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


cache = {}


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
            print("Performing token estimation")
            estimated_tokens = repo_analyzer.token_estimator.estimate_tokens(task)
            estimated_cost = estimated_tokens * 0.000003 + 5000 * 0.000015

            # Generate a unique ID for this request and store in cache
            request_id = str(uuid.uuid4())
            cache[request_id] = {
                "task": task,
                "repoPath": repo_path,
                "estimatedTokens": estimated_tokens,
                "estimatedCost": estimated_cost,
                "request_id": request_id,
            }

            return jsonify(
                {
                    "needsConfirmation": True,
                    "requestId": request_id,
                    "estimatedTokens": estimated_tokens,
                    "estimatedCost": estimated_cost,
                    "request_id": request_id,
                }
            )
        else:
            # Direct analysis is requested, but ideally, users should confirm through the /api/confirm_analysis endpoint
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

        if not request_id or request_id not in cache:
            return (
                jsonify(
                    {
                        "error": "Ungültige Anforderungs-ID oder die Anfrage ist abgelaufen."
                    }
                ),
                400,
            )

        # Retrieve cached data
        analysis_request = cache.pop(request_id)
        task = analysis_request["task"]
        repo_path = analysis_request["repoPath"]

        print("Confirmation received, performing analysis")
        relevant_files = await repo_analyzer.find_relevant_files(
            repo_path, task, approve=True
        )
        if relevant_files:
            print(f"Found relevant files: {relevant_files}")
            analysis = await repo_analyzer.analyze_changes(
                repo_path,
                relevant_files,
                task,
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


@app.route("/")
def hello_world():
    return "Hello World"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=443)
