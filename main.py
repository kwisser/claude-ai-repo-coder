import argparse
import sys
from colorama import init, Fore, Style

import arg_parser
from color_printer import ColorPrinter
from repo_analyzer import RepoAnalyzer

import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


# Initialisiere colorama
init(autoreset=True)


def main():
    parser = arg_parser.create_argument_parser()

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

    if args.interactive:
        while True:
            question = input(f"\n{Fore.CYAN}Nachfrage (oder 'q' zum Beenden): {Style.RESET_ALL}")
            if question.lower() in ['q', 'quit', 'exit']:
                break
            response = analyzer.ask_followup_question(question)
            print(f"\n{Fore.GREEN}{response}{Style.RESET_ALL}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Fore.RED}{Style.BRIGHT}Programm durch Benutzer abgebrochen.{Style.RESET_ALL}")
    except Exception as e:
        print(f"\n{Fore.RED}{Style.BRIGHT}Fehler: {str(e)}{Style.RESET_ALL}")
        sys.exit(1)




