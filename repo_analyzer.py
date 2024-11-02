from dataclasses import dataclass
from pathlib import Path
from typing import List, Dict
from fnmatch import fnmatch
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor

from claude_client import ClaudeClient
from token_estimator import TokenEstimator
from config import IGNORED_FILE_PATTERNS, IGNORED_DIRECTORIES
from color_printer import ColorPrinter

logger = logging.getLogger(__name__)


@dataclass
class AnalysisResult:
    """Data class for analysis results"""
    task: str
    files: List[str]
    recommendations: str


class RepoAnalyzer:
    def __init__(self, location: str, project_id: str):
        """Initialize RepoAnalyzer with required dependencies"""
        self.claude_client = ClaudeClient(location, project_id)
        self.token_estimator = TokenEstimator()
        self.ignored_patterns = set(IGNORED_FILE_PATTERNS)  # Using set for faster lookups
        self.printer = ColorPrinter()
        self.file_cache: Dict[str, str] = {}  # Cache for file contents
        self._executor = ThreadPoolExecutor(max_workers=4)

    def add_ignore_pattern(self, pattern: str) -> None:
        """Add a new pattern to ignored patterns"""
        self.ignored_patterns.add(pattern)
        logger.info(f"Added ignore pattern: {pattern}")

    def should_ignore(self, file_path: Path) -> bool:
        """
        Check if a file should be ignored based on patterns and directories.

        Args:
            file_path: Path object representing the file

        Returns:
            bool: True if file should be ignored, False otherwise
        """
        try:
            # Check if parent directory should be ignored
            if any(parent.name in IGNORED_DIRECTORIES
                   for parent in file_path.parents):
                return True

            # Check file against ignore patterns
            return any(fnmatch(str(file_path), pattern)
                       for pattern in self.ignored_patterns)

        except Exception as e:
            logger.error(f"Error checking ignore status for {file_path}: {e}")
            return True

    async def find_relevant_files(self, repo_path: str, task_description: str) -> List[str]:
        """
        Find files relevant to the given task asynchronously.

        Args:
            repo_path: Path to the repository
            task_description: Description of the task

        Returns:
            List of relevant file paths

        Raises:
            FileNotFoundError: If repository path doesn't exist
        """
        logger.info("Starting file search...")

        repo_path = Path(repo_path)

        if not repo_path.exists():
            raise FileNotFoundError(f"Repository path not found: {repo_path}")

        # Collect all files asynchronously
        all_files = []
        for file_path in repo_path.rglob('*'):
            if file_path.is_file() and not self.should_ignore(file_path):
                rel_path = file_path.relative_to(repo_path)
                all_files.append(str(rel_path))

        if not all_files:
            logger.warning("No files found in repository")
            return []

        # Create context for Claude
        files_context = "\n".join([f"- {f}" for f in all_files])
        prompt = self._create_file_selection_prompt(task_description, files_context)

        try:
            logger.info("Querying Claude for relevant files...")
            response = await self._async_claude_query(prompt)
            relevant_files = response.get("content").strip().splitlines()

            # Validate returned files exist in repository
            validated_files = [f.strip() for f in relevant_files if f.strip() in all_files]

            #logger.info(f"Found {len(validated_files)} relevant files")
            return validated_files

        except Exception as e:
            logger.error(f"Error during file analysis: {e}")
            raise

    async def read_file_contents(self, repo_path: Path, files: List[str]) -> Dict[str, str]:
        """
        Read contents of specified files asynchronously with caching.
        """
        file_contents = {}
        tasks = []

        async def read_file(rel_path: str) -> tuple[str, str]:
            if rel_path in self.file_cache:
                return rel_path, self.file_cache[rel_path]

            file_path = repo_path / rel_path
            try:
                content = await self._read_file_async(file_path)
                self.file_cache[rel_path] = content
                return rel_path, content
            except Exception as e:
                logger.error(f"Error reading {file_path}: {e}")
                return rel_path, ""

        for file in files:
            tasks.append(read_file(file))

        results = await asyncio.gather(*tasks)
        return dict(results)

    async def analyze_changes(self, repo_path: str, files: List[str],
                              task_description: str) -> AnalysisResult:
        """
        Analyze required changes for the given task and files.

        Args:
            repo_path: Repository path
            files: List of files to analyze
            task_description: Description of the task

        Returns:
            AnalysisResult object containing analysis results
        """
        logger.info("Starting change analysis...")
        repo_path = Path(repo_path)

        files_content = await self.read_file_contents(repo_path, files)
        prompt = self._create_analysis_prompt(task_description, files_content)

        try:
            response = await self._async_claude_query(prompt)
            return AnalysisResult(
                task=task_description,
                files=files,
                recommendations=response.get("content")
            )
        except Exception as e:
            logger.error(f"Error during change analysis: {e}")
            raise

    async def ask_followup_question(self, question: str) -> str:
        """Handle follow-up questions asynchronously"""
        try:
            response = await self._async_claude_query(question)
            return response["content"]
        except Exception as e:
            logger.error(f"Error during follow-up question: {e}")
            raise

    def _create_file_selection_prompt(self, task: str, files: str) -> str:
        """Create prompt for file selection"""
        return f"""Given the following files in a repository and this task: "{task}"

        Files:
        {files}

        Which files are most likely relevant for this task? Return only the filenames separated by newlines.
        """

    def _create_analysis_prompt(self, task: str, files_content: Dict[str, str]) -> str:
        """Create prompt for change analysis"""
        return f"""Given these files and this task: "{task}"

        Files:
        {files_content}

        What changes should be made to accomplish this task? Provide specific code modifications for each file.
        """

    async def _async_claude_query(self, prompt: str) -> dict:
        """Wrapper for async Claude queries"""
        return self.claude_client.send_message(prompt)

    async def _read_file_async(self, file_path: Path) -> str:
        """Read file contents asynchronously"""
        try:
            return await asyncio.get_event_loop().run_in_executor(
                self._executor,
                self._read_file_sync,
                file_path
            )
        except Exception as e:
            logger.error(f"Error reading file {file_path}: {e}")
            raise

    @staticmethod
    def _read_file_sync(file_path: Path) -> str:
        """Synchronous file reading helper"""
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()

    def __del__(self):
        """Cleanup resources"""
        self._executor.shutdown(wait=False)