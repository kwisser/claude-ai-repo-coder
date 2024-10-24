from claude_client import ClaudeClient
from token_estimator import TokenEstimator
from config import IGNORED_FILE_PATTERNS,IGNORED_DIRECTORIES, INPUT_TOKEN_PRICE
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


        self.printer.info("Frage Claude nach relevanten Dateien...")
        response = self.claude_client.send_message(prompt)

        relevant_files = response.get("content").strip().splitlines()
        self.printer.info("Response for files: " + str(relevant_files))
        #relevant_files = [f.strip() for f in relevant_files if f.strip() in all_files]
        #print(relevant_files)
        return relevant_files

    def read_file_contents(self, repo_path: str, files: List[str]) -> Dict[str, str]:
        file_contents = {}
        for rel_path in files:
            file_path = os.path.join(repo_path, rel_path)
            self.printer.info(f"Lese Datei: {self.printer.file_path(file_path)}")
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    file_contents[rel_path] = f.read()
            except FileNotFoundError:
                self.printer.error(f"Datei nicht gefunden: {file_path}")
            except UnicodeDecodeError:
                self.printer.error(f"Encoding-Fehler beim Lesen von: {file_path}")
        return file_contents

    def analyze_changes(self, repo_path: str, files: List[str], task_description: str) -> Dict:
        self.printer.info("Analysiere benötigte Änderungen...")

        files_content = self.read_file_contents(repo_path, files)

        prompt = f"""Given these files and this task: "{task_description}"

        Files:
        {files_content}
    
        What changes should be made to accomplish this task? Provide specific code modifications for each file.
        """

        self.printer.info("Frage Claude nach Änderungsvorschlägen...")
        response = self.claude_client.send_message(prompt)

        return {
            "task": task_description,
            "files": files,
            "recommendations": response.get("content")
        }

    def ask_followup_question(self, question: str) -> str:
        # Verwende den existierenden ClaudeClient mit der gespeicherten Historie
        token_estimator = TokenEstimator()
        printer = ColorPrinter()

        response = self.claude_client.send_message(question)
        return response["content"]




