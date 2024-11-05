from colorama import Fore, Style

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