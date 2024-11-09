import React, { useState } from 'react';
import ResponseDisplay from './ResponseDisplay';
import {analyzeRepository, askFollowUpQuestion, confirmAnalysis} from './services/api';
import './styles.css';
import ConfirmationDialog from './ConfirmationDialog';

function App() {
  const [formData, setFormData] = useState({ task: '', repoPath: '' });
  const [state, setState] = useState({ loading: false, error: null, response: null });
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [confirmation, setConfirmation] = useState(null);  // for confirmation dialog

  const handleFollowUpSubmit = async (e) => {
    e.preventDefault();
    setState({ loading: true, error: null, response: null });

    try {
      const result = await askFollowUpQuestion(followUpQuestion);
      setState({ loading: false, error: null, response: result });
      setFollowUpQuestion(''); // Clear input after submission
    } catch (err) {
      setState({ loading: false, error: err.message, response: null });
    }
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setState({ loading: true, error: null, response: null });

    try {
      const estimationResult = await analyzeRepository(formData.task, formData.repoPath, false);

      if (estimationResult.needsConfirmation) {
        setState({ loading: false, error: null, response: null });
        setConfirmation({
          estimatedTokens: estimationResult.estimatedTokens,
          estimatedCost: estimationResult.estimatedCost,
          requestId: estimationResult.requestId  // Save requestId for confirmation
        });
        return;
      }

      setState({ loading: false, error: null, response: estimationResult });
    } catch (err) {
      setState({ loading: false, error: err.message, response: null });
    }
  };

  const handleConfirmAnalysis = async () => {
    console.log('Confirming analysis...');
    setState({ loading: true, error: null, response: null });
    setConfirmation(null);  // Close confirmation dialog

    try {
      const result = await confirmAnalysis(confirmation.requestId);
      console.log('Analysis confirmed:', result);
      setState({ loading: false, error: null, response: result });
    } catch (err) {
      setState({ loading: false, error: err.message || 'Ein unerwarteter Fehler ist aufgetreten', response: null });
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
            requestId={confirmation.requestId}  // Pass requestId to dialog
            onConfirm={handleConfirmAnalysis}
            onCancel={() => setConfirmation(null)}
          />
        )}
        {state.response && (
          <div className="follow-up-section">
            <h3>Nachfragen</h3>
            <form onSubmit={handleFollowUpSubmit} className="follow-up-form">
              <input
                type="text"
                value={followUpQuestion}
                onChange={(e) => setFollowUpQuestion(e.target.value)}
                placeholder="Stelle eine Nachfrage..."
                disabled={state.loading}
              />
              <button
                type="submit"
                className="follow-up-button"
                disabled={state.loading || !followUpQuestion.trim()}
              >
                Fragen
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;