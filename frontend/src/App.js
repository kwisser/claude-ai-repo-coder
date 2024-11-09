import React, { useState } from 'react';
import ResponseDisplay from './ResponseDisplay';
import api from './services/api';
import './styles.css';
import ConfirmationDialog from './ConfirmationDialog';

function App() {
  const [formData, setFormData] = useState({ task: '', repoPath: '' });
  const [state, setState] = useState({ loading: false, error: null, response: null });
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [requestId, setRequestId] = useState(null);  // Store the request ID here

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setState({ loading: true, error: null, response: null });
    setRequestId(null);

    try {
      const estimationResult = await api.analyzeRepository(formData.task, formData.repoPath, false);

      if (estimationResult.needsConfirmation) {
        setState({ loading: false, error: null, response: null });
        setConfirmation({
          estimatedTokens: estimationResult.estimatedTokens,
          estimatedCost: estimationResult.estimatedCost
        });
        setRequestId(estimationResult.requestId);  // Save the request ID for confirmation
        return;
      }

      setState({ loading: false, error: null, response: estimationResult });
    } catch (err) {
      setState({ loading: false, error: err.message, response: null });
    }
  };

  const handleConfirmAnalysis = async () => {
    setState({ loading: true, error: null, response: null });
    setConfirmation(null);

    try {
      const result = await api.confirmAnalysis(requestId);  // Send requestId with confirmation
      setState({ loading: false, error: null, response: result });
    } catch (err) {
      setState({ loading: false, error: err.message || 'Ein unerwarteter Fehler ist aufgetreten', response: null });
    }
  };

  const handleFollowUpQuestion = async (e) => {
    e.preventDefault();
    if (!followUpQuestion.trim()) return;
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await api.askFollowUpQuestion(followUpQuestion, requestId);  // Send requestId with follow-up
      setState(prev => ({
        loading: false,
        error: null,
        response: {
          ...prev.response,
          followUpAnswers: [
            ...(prev.response?.followUpAnswers || []),
            { question: followUpQuestion, answer: result.response }
          ]
        }
      }));
      setFollowUpQuestion('');
    } catch (err) {
      setState(prev => ({ ...prev, loading: false, error: err.message }));
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Code Analyzer</h1>
        <p className="subtitle">Analysiere dein Repository und erhalte Empfehlungen</p>
      </header>

      <main className="main-content">
        <form onSubmit={handleSubmit} className="analysis-form">
          <div className="form-group">
            <label htmlFor="repoPath">Repository Pfad:</label>
            <input
              id="repoPath"
              name="repoPath"
              type="text"
              value={formData.repoPath}
              onChange={handleInputChange}
              placeholder="/pfad/zum/repository"
              required
              disabled={state.loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="task">Aufgabenbeschreibung:</label>
            <textarea
              id="task"
              name="task"
              value={formData.task}
              onChange={handleInputChange}
              placeholder="Beschreibe deine Aufgabe..."
              required
              rows={4}
              disabled={state.loading}
            />
          </div>
          <button type="submit" className="submit-button" disabled={state.loading}>
            {state.loading ? 'Analysiere...' : 'Analysieren'}
          </button>
        </form>

        {state.error && <div className="error-message">{state.error}</div>}

        {state.loading && (
          <div className="loading-container">
            <p>Analysiere Repository...</p>
          </div>
        )}

        {state.response && (
          <div className="results-section">
            <h2>Analyse Ergebnisse</h2>

            {state.response.files?.length > 0 && (
              <div className="relevant-files">
                <h3>Relevante Dateien:</h3>
                <ul>
                  {state.response.files.map((file, index) => (
                    <li key={index}>{file}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="recommendations">
              <h3>Empfehlungen:</h3>
              <ResponseDisplay content={state.response.recommendations} />
            </div>
          </div>
        )}

        {confirmation && (
          <ConfirmationDialog
            estimatedTokens={confirmation.estimatedTokens}
            estimatedCost={confirmation.estimatedCost}
            onConfirm={handleConfirmAnalysis}
            onCancel={() => setConfirmation(null)}
          />
        )}

        {state.response && (
          <form onSubmit={handleFollowUpQuestion} className="follow-up-form">
            <h3>Weitere Fragen?</h3>
            <div className="input-group">
              <input
                type="text"
                value={followUpQuestion}
                onChange={(e) => setFollowUpQuestion(e.target.value)}
                placeholder="Stelle eine Nachfrage..."
                disabled={state.loading}
              />
              <button
                type="submit"
                disabled={state.loading || !followUpQuestion.trim()}
                className="follow-up-button"
              >
                Fragen
              </button>
            </div>
          </form>
        )}
        {state.response?.followUpAnswers && state.response.followUpAnswers.length > 0 && (
          <div className="follow-up-answers">
            <h3>Nachfragen & Antworten:</h3>
            {state.response.followUpAnswers.map((qa, index) => (
              <div key={index} className="qa-pair">
                <div className="question">
                  <strong>Frage:</strong>
                  <p>{qa.question}</p>
                </div>
                <div className="answer">
                  <strong>Antwort:</strong>
                  <ResponseDisplay content={qa.answer} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;