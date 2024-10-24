import tiktoken

class TokenEstimator:
    def __init__(self):
        self.encoding = tiktoken.get_encoding("cl100k_base")

    def estimate_tokens(self, text: str) -> int:
        return len(self.encoding.encode(text))