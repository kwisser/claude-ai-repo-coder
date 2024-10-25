import os
import argparse
from pathlib import Path
from typing import List, Dict
from anthropic import AnthropicVertex
import sys
import tiktoken
from config import IGNORED_FILE_PATTERNS, MAX_OUTPUT_TOKEN
from colorama import init, Fore, Style

# Initialisiere colorama
init(autoreset=True)


class ColorPrinter:
    @staticmethod
    def info(message: str):
        print(f"{Fore.CYAN}{Style.BRIGHT}ℹ {message}{Style.RESET_ALL}")

    @staticmethod
    def success(message: str):
        print(f"{Fore.GREEN}{Style.BRIGHT}✓ {message}{Style.RESET_ALL}")

    @staticmethod
    def warning(message: str):
        print(f"{Fore.YELLOW}{Style.BRIGHT}⚠ {message}{Style.RESET_ALL}")

    @staticmethod
    def error(message: str):
        print(f"{Fore.RED}{Style.BRIGHT}✘ {message}{Style.RESET_ALL}")

    @staticmethod
    def highlight(message: str):
        print(f"{Fore.MAGENTA}{Style.BRIGHT}{message}{Style.RESET_ALL}")

    @staticmethod
    def file_path(path: str):
        return f"{Fore.BLUE}{Style.BRIGHT}{path}{Style.RESET_ALL}"

    @staticmethod
    def cost(amount: float):
        return f"{Fore.YELLOW}{Style.BRIGHT}${amount:.2f}{Style.RESET_ALL}"

    @staticmethod
    def tokens(count: int):
        return f"{Fore.GREEN}{Style.BRIGHT}{count:,}{Style.RESET_ALL}"


# TokenEstimator bleibt unverändert
class TokenEstimator:
    def __init__(self):
        self.encoding = tiktoken.get_encoding("cl100k_base")

    def estimate_tokens(self, text: str) -> int:
        return len(self.encoding.encode(text))


class RepoAnalyzer:
    def __init__(self, location: str, project_id: str):
        self.client = AnthropicVertex(
            region=location,
            project_id=project_id
        )
        self.token_estimator = TokenEstimator()
        self.ignored_patterns = IGNORED_FILE_PATTERNS
        self.printer = ColorPrinter()


    def should_ignore(self, file_path: str) -> bool:
        """
        Überprüft, ob eine Datei ignoriert werden soll.
        """
        from fnmatch import fnmatch
        self.printer.info("Now checking: "+file_path)
        # Relativen Pfad verwenden
        rel_path = str(Path(file_path))

        for pattern in self.ignored_patterns:
            if fnmatch(rel_path, pattern):
                return True
        return False

    def prompt_user_confirmation(self, estimated_tokens: int, cost_estimate: float) -> bool:
        """
        Fragt den Benutzer nach Bestätigung für den API-Call.
        """
        self.printer.info(f"Token-Schätzung und Kosten:")
        print(f"  Geschätzte Token: {self.printer.tokens(estimated_tokens)}")
        print(f"  Geschätzte Kosten: {self.printer.cost(cost_estimate)} (basierend auf $0.00015/Token)")

        while True:
            response = input(f"\n{Fore.CYAN}Möchten Sie fortfahren? (j/n): {Style.RESET_ALL}").lower()
            if response in ['j', 'ja', 'y', 'yes']:
                return True
            elif response in ['n', 'nein', 'no']:
                return False
            self.printer.warning("Bitte antworten Sie mit 'j' oder 'n'")

    def find_relevant_files(self, repo_path: str, task_description: str) -> List[str]:
        self.printer.info("Suche nach relevanten Dateien...")

        # Sammle alle Dateien im Projekt, ohne die Inhalte zu lesen
        all_files = []
        for root, dirs, files in os.walk(repo_path):
            # Ignoriere node_modules Verzeichnisse
            dirs[:] = [d for d in dirs if d != 'node_modules' and d != '.git' and d != '.next' and d != 'resources' and d != '.venv' and d != '.idea' and d != '__pycache__' and d !='classes']
            for file in files:
                file_path = os.path.join(root, file)
                if not self.should_ignore(file_path):
                    rel_path = os.path.relpath(file_path, repo_path)
                    all_files.append(rel_path)

        # Erstelle die Liste der Dateien für den Prompt
        files_context = "\n".join([f"- {f}" for f in all_files])

	# Wenn task_description mit """ beginnt und endet, verwende den kompletten String
        task = task_description.strip()
        if task.startswith('"""') and task.endswith('"""'):
            task = task[3:-3].strip()
        else:
            task = f'"{task}"'  # Sonst in einfache Anführungszeichen setzen

        prompt = f"""Given the following files in a repository and this task: "{task_description}"

        Files:
        {files_context}

        Which files are most likely relevant for this task? Return only the filenames separated by newlines.
        """
        price_per_token_old=0.00015
        price_per_token = 0.000003
        # Token-Schätzung und Benutzerbestätigung
        estimated_input_tokens = self.token_estimator.estimate_tokens(prompt)
        estimated_output_tokens = 5000  # Annahme
        total_estimated_tokens = estimated_input_tokens + estimated_output_tokens
        estimated_cost_old = total_estimated_tokens * price_per_token_old
        estimated_cost = total_estimated_tokens * price_per_token



        if not self.prompt_user_confirmation(total_estimated_tokens, estimated_cost):
            self.printer.error("Anfrage abgebrochen.")
            sys.exit(0)

        self.printer.info("Frage Claude nach relevanten Dateien...")
        response = self.client.messages.create(
            max_tokens=MAX_OUTPUT_TOKEN,
            messages=[{"role": "user", "content": prompt}],
            model="claude-3-5-sonnet-v2@20241022"
        )

        used_input_tokens = response.usage.input_tokens
        cost_input = used_input_tokens * 3/1000000
        used_output_tokens = response.usage.output_tokens
        cost_output = used_output_tokens = 15/1000000

        self.printer.highlight(
            "Used input tokens: " + str(used_input_tokens) + " Used output tokens: " + str(used_output_tokens))
        self.printer.highlight("Costs for input token: $"+str(cost_input)+ " Costs for output token: $"+str(cost_output)+ " total: $"+str(cost_input+cost_output))

        # Verarbeite die Antwort, um die relevanten Dateien zu erhalten
        relevant_files = response.content[0].text.strip().splitlines()
        relevant_files = [f.strip() for f in relevant_files if f.strip() in all_files]

        return relevant_files

    def analyze_changes(self, repo_path: str, files: List[str], task_description: str) -> Dict:
        self.printer.info("Analysiere benötigte Änderungen...")

        file_contents = {}
        for rel_path in files:
            file_path = os.path.join(repo_path, rel_path)
            self.printer.info(f"Lese Datei: {self.printer.file_path(file_path)}")
            with open(file_path, 'r') as f:
                file_contents[rel_path] = f.read()

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

        if not self.prompt_user_confirmation(total_estimated_tokens, estimated_cost):
            self.printer.error("Anfrage abgebrochen.")
            sys.exit(0)

        self.printer.info("Frage Claude nach Änderungsvorschlägen...")
        response = self.client.messages.create(
            max_tokens=MAX_OUTPUT_TOKEN,
            messages=[{"role": "user", "content": prompt}],
            model="claude-3-5-sonnet-v2@20241022"
        )

        used_input_tokens = response.usage.input_tokens
        cost_input = used_input_tokens * 3 / 1000000
        used_output_tokens = response.usage.output_tokens
        cost_output = used_output_tokens = 15 / 1000000

        self.printer.highlight(
            "Used input tokens: " + str(used_input_tokens) + " Used output tokens: " + str(used_output_tokens))
        self.printer.highlight("Costs for input token: $" + str(cost_input) + " Costs for output token: $" + str(
            cost_output) + " total: $" + str(cost_input + cost_output))

        return {
            "task": task_description,
            "files": files,
            "recommendations": response.content[0].text
        }


def main():
    parser = argparse.ArgumentParser(
        description=f'{Fore.CYAN}{Style.BRIGHT}Repository Analyzer für Code-Änderungen{Style.RESET_ALL}'
    )
    parser.add_argument('repo_path', help='Pfad zum Repository')
    parser.add_argument('task', help='Beschreibung der gewünschten Änderungen')
    parser.add_argument('--location', default='us-east5', help='Anthropic API Location')
    parser.add_argument('--project-id', required=True, help='GCP Project ID')
    parser.add_argument('--ignore', action='append', help='Zusätzliche Ignore-Patterns')
    parser.add_argument('--show-ignored', action='store_true', help='Zeige ignorierte Patterns')

    args = parser.parse_args()
    printer = ColorPrinter()
    analyzer = RepoAnalyzer(args.location, args.project_id)

    if args.ignore:
        for pattern in args.ignore:
            analyzer.ignored_patterns.append(pattern)
            printer.info(f"Ignoriere zusätzlich: {pattern}")

    if args.show_ignored:
        printer.highlight("Ignorierte Patterns:")
        for pattern in analyzer.ignored_patterns:
            print(f"  {Fore.YELLOW}- {pattern}{Style.RESET_ALL}")
        return

    printer.highlight(f"Analysiere Repository: {printer.file_path(args.repo_path)}")
    printer.highlight(f"Aufgabe: {args.task}")

    relevant_files = analyzer.find_relevant_files(args.repo_path, args.task)

    if relevant_files:
        printer.success(f"Gefunden: {len(relevant_files)} relevante Dateien:")
        for f in relevant_files:
            print(f"  {printer.file_path(f)}")
    else:
        printer.warning("Keine relevanten Dateien gefunden!")
        return

    printer.highlight("\nAnalysiere Änderungen...")
    analysis = analyzer.analyze_changes(args.repo_path, relevant_files, args.task)

    printer.success("\nEmpfohlene Änderungen:")
    print(f"{Fore.GREEN}{analysis['recommendations']}{Style.RESET_ALL}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Fore.RED}{Style.BRIGHT}Programm durch Benutzer abgebrochen.{Style.RESET_ALL}")
    except Exception as e:
        print(f"\n{Fore.RED}{Style.BRIGHT}Fehler: {str(e)}{Style.RESET_ALL}")
        sys.exit(1)
