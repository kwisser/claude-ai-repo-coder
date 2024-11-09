from color_printer import ColorPrinter
from colorama import Fore, Style

def prompt_user_confirmation(estimated_tokens: int, cost_estimate: float, printer: ColorPrinter, auto_approve: bool=False) -> bool:
    """Separate function for user confirmation logic"""

    printer.info("Token-Schätzung und Kosten:")
    print(f"  Geschätzte Token: {printer.tokens(estimated_tokens)}")
    print(f"  Geschätzte Kosten: {printer.cost(cost_estimate)}")

    while True:
        if auto_approve:
            return True
        response = input(f"\n{Fore.CYAN}Möchten Sie fortfahren? (j/n): {Style.RESET_ALL}").lower()
        
        if response in ['j', 'ja', 'y', 'yes']:
            return True
        elif response in ['n', 'nein', 'no']:
            return False
        printer.warning("Bitte antworten Sie mit 'j' oder 'n'")