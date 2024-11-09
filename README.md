# Claude AI Repo Coder 🛠️🤖

A **Python tool** that leverages **Claude AI** to intelligently analyze repositories and suggest code changes based on **natural language tasks**. Perfect for developers who want to speed up code reviews and refactoring! 🚀

## ✨ Features

- 🗂️ **Smart File Selection**: Automatically identifies relevant files based on task requirements
- 📈 **Automated Code Analysis**: Analyzes code and recommends specific improvements
- 🔄 **Interactive Mode**: Engage with Claude AI for follow-up questions during analysis
- 💰 **Token & Cost Tracking**: Estimates token usage and keeps track of costs
- ⚙️ **Configurable Ignoring**: Set up file/directory ignore patterns as needed
- 🌈 **Colorized Console Output**: Displays results in easy-to-read, colorized output

## 📋 Prerequisites

- 🐍 **Python** 3.12+
- ☁️ **Google Cloud Platform** account with Vertex AI enabled
- 🆔 **GCP Project ID**

## 🛠️ Installation

1. **Clone the repository** 📥
2. Install dependencies using **Poetry**:

   ```bash
   poetry install
   ```

## ⚙️ Usage

Basic usage:

```bash
python main.py <repo_path> "<task_description>" --project-id <your-gcp-project-id>
```

### Options

- 🌍 `--location`: Specify the Anthropic API location (default: `us-east5`)
- 🚫 `--ignore`: Add custom ignore patterns
- 👀 `--show-ignored`: Show all currently ignored patterns
- 🗨️ `--interactive`: Enable **Interactive Mode** for ongoing discussions with Claude AI

#### Example

```bash
python main.py ./my-repo "Add error handling to database operations" --project-id my-gcp-project --interactive
```

## 🧩 Configuration

The tool relies on the following packages:

- 🤖 **anthropic** (with `vertex` extras)
- ☁️ **google-cloud-aiplatform**
- 🔢 **tiktoken**
- 🌈 **colorama**

## 👤 Author

Klemens Wisser 📧 <wisserklemens@gmail.com>
