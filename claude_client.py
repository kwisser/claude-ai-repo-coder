from anthropic import AnthropicVertex
from color_printer import ColorPrinter
from token_estimator import TokenEstimator
from config import MAX_OUTPUT_TOKEN
from utils import prompt_user_confirmation
import sys

class ClaudeClient:
    """Handles all interactions with Claude AI"""

    def __init__(self, location: str, project_id: str):
        self.client = AnthropicVertex(
            region=location,
            project_id=project_id
        )
        self.price_per_input_token = 0.000003
        self.price_per_output_token = 0.000015
        self.printer = ColorPrinter()

    def send_message(self, prompt: str, token_estimator: TokenEstimator, printer: ColorPrinter) -> dict:
        estimated_input_tokens = token_estimator.estimate_tokens(prompt)
        estimated_output_tokens = MAX_OUTPUT_TOKEN
        total_estimated_tokens = estimated_input_tokens + estimated_output_tokens

        estimated_cost = (estimated_input_tokens * self.price_per_input_token +
                          estimated_output_tokens * self.price_per_output_token)

        if not prompt_user_confirmation(total_estimated_tokens, estimated_cost, self.printer):
            printer.error("Anfrage abgebrochen.")
            sys.exit(0)

        response = self.client.messages.create(
            max_tokens=MAX_OUTPUT_TOKEN,
            messages=[{"role": "user", "content": prompt}],
            model="claude-3-5-sonnet-v2@20241022"
        )

        self._print_usage_stats(response, printer)

        return {
            "content": response.content[0].text,
            "usage": response.usage
        }

    def _print_usage_stats(self, response, printer):
        used_input_tokens = response.usage.input_tokens
        used_output_tokens = response.usage.output_tokens
        cost_input = used_input_tokens * self.price_per_input_token
        cost_output = used_output_tokens * self.price_per_output_token

        printer.highlight(
            f"Used input tokens: {used_input_tokens} Used output tokens: {used_output_tokens}")
        printer.highlight(
            f"Costs for input token: ${cost_input:.6f} "
            f"Costs for output token: ${cost_output:.6f} "
            f"total: ${cost_input + cost_output:.6f}")
