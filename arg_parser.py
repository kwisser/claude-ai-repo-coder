import argparse
from colorama import Fore, Style

def create_argument_parser():
    parser = argparse.ArgumentParser(
        description=f'{Fore.CYAN}{Style.BRIGHT}Repository Analyzer für Code-Änderungen{Style.RESET_ALL}'
    )
    parser.add_argument('repo_path', help='Pfad zum Repository')
    parser.add_argument('task', help='Beschreibung der gewünschten Änderungen')
    parser.add_argument('--location', default='us-east5', help='Anthropic API Location')
    parser.add_argument('--project-id', required=True, help='GCP Project ID')
    parser.add_argument('--ignore', action='append', help='Zusätzliche Ignore-Patterns')
    parser.add_argument('--show-ignored', action='store_true', help='Zeige ignorierte Patterns')
    parser.add_argument('--interactive', action='store_true', help='Aktiviert den interaktiven Modus für Nachfragen')

    return parser
