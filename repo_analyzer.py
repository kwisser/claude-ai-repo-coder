from claude_client import ClaudeClient
from token_estimator import TokenEstimator
from config import IGNORED_FILE_PATTERNS,IGNORED_DIRECTORIES
from color_printer import ColorPrinter
import os
import sys
from pathlib import Path
from typing import List, Dict
from utils import prompt_user_confirmation

class RepoAnalyzer:
    def __init__(self, location: str, project_id: str):
        self.claude_client = ClaudeClient(location, project_id)
        self.token_estimator = TokenEstimator()
        self.ignored_patterns = IGNORED_FILE_PATTERNS
        self.printer = ColorPrinter()
        self.conversation_history = []

    def should_ignore(self, file_path: str) -> bool:
        """
        Überprüft, ob eine Datei ignoriert werden soll.
        """
        from fnmatch import fnmatch
        self.printer.info("Now checking: " + file_path)
        # Relativen Pfad verwenden
        rel_path = str(Path(file_path))

        for pattern in self.ignored_patterns:
            if fnmatch(rel_path, pattern):
                return True
        return False

    def find_relevant_files(self, repo_path: str, task_description: str) -> List[str]:
        self.printer.info("Suche nach relevanten Dateien...")

        # Sammle alle Dateien im Projekt, ohne die Inhalte zu lesen
        all_files = []
        for root, dirs, files in os.walk(repo_path):
            # Ignoriere node_modules Verzeichnisse
            dirs[:] = [d for d in dirs if
                       d not in IGNORED_DIRECTORIES]
            for file in files:
                file_path = os.path.join(root, file)
                if not self.should_ignore(file_path):
                    rel_path = os.path.relpath(file_path, repo_path)
                    all_files.append(rel_path)

        # Erstelle die Liste der Dateien für den Prompt
        files_context = "\n".join([f"- {f}" for f in all_files])

        prompt = f"""Given the following files in a repository and this task: "{task_description}"

        Files:
        {files_context}

        Which files are most likely relevant for this task? Return only the filenames separated by newlines.
        """
        price_per_token_old = 0.00015
        price_per_token = 0.000003
        # Token-Schätzung und Benutzerbestätigung
        estimated_input_tokens = self.token_estimator.estimate_tokens(prompt)
        estimated_output_tokens = 5000  # Annahme
        total_estimated_tokens = estimated_input_tokens + estimated_output_tokens
        estimated_cost_old = total_estimated_tokens * price_per_token_old
        estimated_cost = total_estimated_tokens * price_per_token

        if not prompt_user_confirmation(total_estimated_tokens, estimated_cost, self.printer):
            self.printer.error("Anfrage abgebrochen.")
            sys.exit(0)

        self.printer.info("Frage Claude nach relevanten Dateien...")
        response = self.claude_client.send_message(prompt, self.token_estimator, self.printer)

        relevant_files = response.get("content").strip().splitlines()
        self.printer.info("Response for files: " + str(relevant_files))
        #relevant_files = [f.strip() for f in relevant_files if f.strip() in all_files]
        #print(relevant_files)
        return relevant_files

    def analyze_changes(self, repo_path: str, files: List[str], task_description: str) -> Dict:
        self.printer.info("Analysiere benötigte Änderungen...")

        file_contents = {}
        for rel_path in files:
            file_path = os.path.join(repo_path, rel_path)
            self.printer.info(f"Lese Datei: {self.printer.file_path(file_path)}")
            try:
                with open(file_path, 'r') as f:
                    file_contents[rel_path] = f.read()
            except Exception as e:
                print(e)

        files_content = "\n\n".join([
            f"=== {fname} ===\n{content}"
            for fname, content in file_contents.items()
        ])

        prompt = f"""Given these files and this task: "{task_description}"

    Files:
    {files_content}

    What changes should be made to accomplish this task? Provide specific code modifications for each file.
    """

        # Token-Schätzung und Benutzerbestätigung
        estimated_input_tokens = self.token_estimator.estimate_tokens(prompt)
        estimated_output_tokens = 1024  # Annahme
        total_estimated_tokens = estimated_input_tokens + estimated_output_tokens
        estimated_cost = total_estimated_tokens * 0.00015

        if not prompt_user_confirmation(total_estimated_tokens, estimated_cost, self.printer):
            self.printer.error("Anfrage abgebrochen.")
            sys.exit(0)

        self.printer.info("Frage Claude nach Änderungsvorschlägen...")
        response = self.claude_client.send_message(prompt, self.token_estimator, self.printer)

        return {
            "task": task_description,
            "files": files,
            "recommendations": response.get("content")
        }

    def ask_followup_question(self, question: str) -> str:
        """Allows asking follow-up questions about the previous analysis"""
        if not self.conversation_history:
            self.printer.error("Keine vorherige Analyse verfügbar.")
            return

        context = "\n".join(self.conversation_history)
        prompt = f"""Based on the previous analysis:

    {context}

    Follow-up question: {question}

    Please provide a detailed answer."""

        response = self.claude_client.send_message(
            prompt,
            self.token_estimator,
            self.printer
        )

        self.conversation_history.append(f"Q: {question}\nA: {response['content']}")
        return response['content']




