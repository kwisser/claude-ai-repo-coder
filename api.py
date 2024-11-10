from flask import Flask, request, jsonify
from flask_cors import CORS
from claude_client import ClaudeClient
from repo_analyzer import RepoAnalyzer
import os
import asyncio
import uuid

app = Flask(__name__)
CORS(app)

CLAUDE_LOCATION = os.getenv("CLAUDE_LOCATION", "us-central1")
CLAUDE_PROJECT_ID = os.getenv("CLAUDE_PROJECT_ID")

claude_client = ClaudeClient(CLAUDE_LOCATION, CLAUDE_PROJECT_ID)
repo_analyzer = RepoAnalyzer(CLAUDE_LOCATION, CLAUDE_PROJECT_ID)


# RequestManager to handle repo_analyzer instances per request_id
class RequestManager:
    def __init__(self):
        self.cache = {}

    def create_analyzer(self, request_id, task, repo_path):
        # Instantiate a new RepoAnalyzer and store it
        analyzer = RepoAnalyzer(CLAUDE_LOCATION, CLAUDE_PROJECT_ID)
        self.cache[request_id] = {
            "repo_analyzer": analyzer,
            "task": task,
            "repoPath": repo_path,
        }
        return analyzer

    def get_analyzer(self, request_id):
        return self.cache.get(request_id)

    def delete_analyzer(self, request_id):
        if request_id in self.cache:
            del self.cache[request_id]


request_manager = RequestManager()


def async_route(f):
    def wrapper(*args, **kwargs):
        return asyncio.run(f(*args, **kwargs))

    wrapper.__name__ = f.__name__
    return wrapper


@app.route("/api/analyze", methods=["POST"])
@async_route
async def analyze_repository():
    if request.content_type != "application/json":
        return (
            jsonify({"error": "Unsupported Media Type. Expected 'application/json'."}),
            415,
        )

    try:
        data = request.get_json()
        task = data.get("task")
        repo_path = data.get("repoPath")
        confirm = data.get("confirm", False)

        if not task or not repo_path:
            return jsonify({"error": "Task und Repository-Pfad sind erforderlich"}), 400

        if not confirm:
            estimated_tokens = 100  # Replace with actual estimation
            estimated_cost = estimated_tokens * 0.000003 + 5000 * 0.000015

            # Generate a unique request_id and create a repo_analyzer instance for it
            request_id = str(uuid.uuid4())
            request_manager.create_analyzer(request_id, task, repo_path)

            return jsonify(
                {
                    "needsConfirmation": True,
                    "requestId": request_id,
                    "estimatedTokens": estimated_tokens,
                    "estimatedCost": estimated_cost,
                }
            )
        else:
            return (
                jsonify(
                    {
                        "error": "Bitte bestätigen Sie die Analyse mit dem Bestätigungs-Endpunkt."
                    }
                ),
                400,
            )

    except Exception as e:
        print(f"Error during analysis: {str(e)}")
        return jsonify({"error": f"Analyse-Fehler: {str(e)}"}), 500


@app.route("/api/confirm", methods=["POST"])
@async_route
async def confirm_analysis():
    if request.content_type != "application/json":
        return (
            jsonify({"error": "Unsupported Media Type. Expected 'application/json'."}),
            415,
        )

    try:
        data = request.get_json()
        request_id = data.get("requestId")

        # Retrieve the repo_analyzer instance from the RequestManager
        analysis_request = request_manager.get_analyzer(request_id)
        if not analysis_request:
            return (
                jsonify(
                    {
                        "error": "Ungültige Anforderungs-ID oder die Anfrage ist abgelaufen."
                    }
                ),
                400,
            )

        task = analysis_request["task"]
        repo_path = analysis_request["repoPath"]
        repo_analyzer = analysis_request["repo_analyzer"]

        relevant_files = await repo_analyzer.find_relevant_files(repo_path, task)
        if relevant_files:
            analysis = await repo_analyzer.analyze_changes(
                repo_path, relevant_files, task
            )
            return jsonify(
                {
                    "files": relevant_files,
                    "recommendations": analysis.recommendations,
                    "needsConfirmation": False,
                }
            )
        else:
            return jsonify({"error": "Keine relevanten Dateien gefunden"}), 400

    except Exception as e:
        print(f"Error during confirm analysis: {str(e)}")
        return jsonify({"error": f"Analyse-Fehler: {str(e)}"}), 500


@app.route("/api/ask", methods=["POST"])
@async_route
async def ask_followup():
    try:
        data = request.get_json()
        question = data.get("question")
        request_id = data.get("requestId")

        if not question or not request_id:
            return jsonify({"error": "Frage und requestId sind erforderlich"}), 400

        # Retrieve the repo_analyzer instance from the RequestManager for follow-up
        analysis_request = request_manager.get_analyzer(request_id)
        if not analysis_request:
            return (
                jsonify(
                    {
                        "error": "Ungültige Anforderungs-ID oder die Anfrage ist abgelaufen."
                    }
                ),
                400,
            )

        repo_analyzer = analysis_request["repo_analyzer"]
        response = await repo_analyzer.ask_followup_question(question)
        return jsonify({"response": response})

    except Exception as e:
        print(f"Error during follow-up: {str(e)}")
        return jsonify({"error": f"Fehler: {str(e)}"}), 500


@app.route("/")
def home():
    return """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Code Analyzer Assistant API</title>
        <style>
            :root {
                --primary-color: #2563eb;
                --secondary-color: #1e40af;
                --background-color: #f8fafc;
                --text-color: #1e293b;
                --code-bg: #1e293b;
                --code-color: #e2e8f0;
            }

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: var(--text-color);
                background: var(--background-color);
                padding: 2rem;
            }

            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 2rem;
                background: white;
                border-radius: 1rem;
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            }

            h1 {
                color: var(--primary-color);
                font-size: 2.5rem;
                margin-bottom: 1rem;
                text-align: center;
            }

            .description {
                text-align: center;
                margin-bottom: 2rem;
                color: #64748b;
                font-size: 1.1rem;
            }

            .features {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 2rem;
                margin-bottom: 3rem;
            }

            .feature-card {
                padding: 1.5rem;
                background: #f8fafc;
                border-radius: 0.5rem;
                border: 1px solid #e2e8f0;
            }

            .feature-card h3 {
                color: var(--primary-color);
                margin-bottom: 0.5rem;
            }

            .api-section {
                margin-top: 3rem;
            }

            .endpoint {
                background: var(--code-bg);
                color: var(--code-color);
                padding: 1rem;
                border-radius: 0.5rem;
                margin: 1rem 0;
                font-family: 'Fira Code', monospace;
            }

            .stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin: 2rem 0;
                text-align: center;
            }

            .stat-card {
                background: var(--primary-color);
                color: white;
                padding: 1.5rem;
                border-radius: 0.5rem;
            }

            .stat-number {
                font-size: 2rem;
                font-weight: bold;
                margin-bottom: 0.5rem;
            }

            .footer {
                text-align: center;
                margin-top: 3rem;
                padding-top: 2rem;
                border-top: 1px solid #e2e8f0;
                color: #64748b;
            }

            .cta-button {
                display: inline-block;
                background: var(--primary-color);
                color: white;
                padding: 0.75rem 1.5rem;
                border-radius: 0.5rem;
                text-decoration: none;
                margin-top: 1rem;
                transition: background-color 0.3s;
            }

            .cta-button:hover {
                background: var(--secondary-color);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 Code Analyzer Assistant</h1>
            <p class="description">
                Eine leistungsstarke API für intelligente Code-Analyse und Entwicklungsunterstützung,
                angetrieben durch Claude AI
            </p>

            <div class="stats">
                <div class="stat-card">
                    <div class="stat-number">3</div>
                    <div>API Endpoints</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">300s</div>
                    <div>Timeout</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">REST</div>
                    <div>API Type</div>
                </div>
            </div>

            <div class="features">
                <div class="feature-card">
                    <h3>🔍 Intelligente Code-Analyse</h3>
                    <p>Analysiert Ihr Repository und findet die relevantesten Dateien für Ihre Aufgabe.</p>
                </div>
                <div class="feature-card">
                    <h3>💡 Smarte Empfehlungen</h3>
                    <p>Erhalten Sie detaillierte Empfehlungen und Verbesserungsvorschläge für Ihren Code.</p>
                </div>
                <div class="feature-card">
                    <h3>🤔 Follow-up Fragen</h3>
                    <p>Stellen Sie Nachfragen zur Analyse und erhalten Sie präzise Antworten.</p>
                </div>
            </div>

            <div class="api-section">
                <h2>API Endpoints</h2>
                <div class="endpoint">
                    POST /api/analyze
                    <br>
                    POST /api/confirm_analysis
                    <br>
                    POST /api/ask
                </div>
            </div>

            <div class="api-section">
                <h2>Schnellstart</h2>
                <div class="endpoint">
                    curl -X POST http://127.0.0.1:5000/api/analyze \\
                    -H "Content-Type: application/json" \\
                    -d '{"task": "Ihre Aufgabe", "repoPath": "/pfad/zum/repo"}'
                </div>
            </div>

            <div class="footer">
                <p>Entwickelt mit ❤️ für besseren Code</p>
                <a href="http://127.0.0.1:5000/api" class="cta-button">API Dokumentation</a>
            </div>
        </div>
    </body>
    </html>
"""


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=443)
