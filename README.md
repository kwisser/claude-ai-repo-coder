# Claude AI Repo Coder 🛠️🤖

A Python tool that uses Claude AI to analyze repositories and suggest code changes based on natural language tasks.

## ✨ Features

- Intelligent file selection based on task requirements
- Automated code analysis and change recommendations
- Interactive mode for follow-up questions
- Token usage estimation and cost tracking
- Configurable file/directory ignore patterns
- Colorized console output

## Prerequisites

- Python 3.12+
- Google Cloud Platform account with Vertex AI enabled
- Project ID from GCP

## Installation

1. Clone the repository
2. Install dependencies using Poetry:
```bash
poetry install
```

## Usage

Basic usage:
```bash
python main.py <repo_path> "<task_description>" --project-id <your-gcp-project-id>
```

Options:
- `--location`: Anthropic API location (default: us-east5)
- `--ignore`: Additional ignore patterns
- `--show-ignored`: Display all ignored patterns
- `--interactive`: Enable interactive mode for follow-up questions

Example:
```bash
python main.py ./my-repo "Add error handling to database operations" --project-id my-gcp-project --interactive
```

## Configuration

The tool uses the following dependencies:
- anthropic (with vertex extras)
- google-cloud-aiplatform
- tiktoken
- colorama

## Author

Klemens Wisser (wisserklemens@gmail.com)
