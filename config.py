MAX_OUTPUT_TOKEN=5000

IGNORED_FILE_PATTERNS = [
    # Dependency Directories
    "node_modules/*",
    "venv/*",
    ".env/*",
    "__pycache__/*",
    "*.pyc",

    # Build Directories
    "build/*",
    "dist/*",
    "*.egg-info/*",

    # IDE Directories
    ".idea/*",
    ".vscode/*",
    "*.swp",

    # System Files
    ".DS_Store",
    "Thumbs.db",

    # Log Files
    "*.log",
    "logs/*",

    # Test Directories
    "tests/*",
    "test/*",

    # Documentation
    "docs/*",
    "*.md",
    "LICENSE",

    # Package Files
    "package-lock.json",
    "yarn.lock",
    "poetry.lock",

    # Database Files
    "*.sqlite",
    "*.db"

    # Config Files
    "*.properties"
]