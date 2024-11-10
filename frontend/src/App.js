import React, { useState, useEffect } from 'react';
import ResponseDisplay from './ResponseDisplay';
import api from './services/api';
import ConfirmationDialog from './ConfirmationDialog';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Switch,
  FormControlLabel,
  Box,
  Divider,
} from '@mui/material';
import { addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { chatsCollection } from './firebase';
import { useContext } from 'react';
import { AuthContext } from './AuthProvider';
import Header from './Header';
import { Drawer, List, ListItem, ListItemText, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DeleteIcon from '@mui/icons-material/Delete';

function App({ darkMode, setDarkMode }) {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({ task: '', repoPath: '' });
  const [state, setState] = useState({ loading: false, error: null, response: null });
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [requestId, setRequestId] = useState(null);  // Store the request ID here
  const [conversationHistory, setConversationHistory] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [allConversations, setAllConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);

  useEffect(() => {
    // Load conversations from localStorage on mount
    const savedConversations = localStorage.getItem('conversations');
    if (savedConversations) {
      setAllConversations(JSON.parse(savedConversations));
    }
  }, []);


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
        const newConversation = {
          id: estimationResult.requestId,
          type: 'initial',
          task: formData.task,
          repoPath: formData.repoPath,
          response: {
            files: estimationResult.files,
            recommendations: estimationResult.recommendations,
            fullResponse: estimationResult
          },
          followUps: [],
          timestamp: new Date().toISOString()
        };
        setConversationHistory([newConversation]);
        setCurrentConversationId(estimationResult.requestId);  // Set currentConversationId
        setState({ loading: false, error: null, response: null });
        setConfirmation({
          estimatedTokens: estimationResult.estimatedTokens,
          estimatedCost: estimationResult.estimatedCost
        });
        setRequestId(estimationResult.requestId);
        setAllConversations(prev => {
          const newConversations = [...prev, newConversation];
          localStorage.setItem('conversations', JSON.stringify(newConversations));
          return newConversations;
        });
        return;
      }

      setState({ loading: false, error: null, response: estimationResult });
    } catch (err) {
      setState({ loading: false, error: err.message, response: null });
    }
  };

  const handleNewConversation = () => {
    setFormData({ task: '', repoPath: '' });
    setState({ loading: false, error: null, response: null });
    setFollowUpQuestion('');
    setConfirmation(null);
    setRequestId(null);
    setConversationHistory([]);
    setCurrentConversationId(null);
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

  const handleDeleteConversation = async (convId) => {
    try {
      // Remove from local storage
      setAllConversations(prev => {
        const newConversations = prev.filter(conv => conv.id !== convId);
        localStorage.setItem('conversations', JSON.stringify(newConversations));
        return newConversations;
      });

      // Clear current conversation if it's the one being deleted
      if (currentConversationId === convId) {
        setCurrentConversationId(null);
        setConversationHistory([]);
        setState({ loading: false, error: null, response: null });
      }

      // Remove from Firestore if user is logged in
      if (user) {
        // Create proper document reference before deleting
        const docRef = doc(chatsCollection, convId);
        await deleteDoc(docRef);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const handleFollowUpQuestion = async (e) => {
    e.preventDefault();
    if (!followUpQuestion.trim()) return;
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await api.askFollowUpQuestion(followUpQuestion, requestId);

      setAllConversations(prev => {
        const newConversations = prev.map(conv => {
          if (conv.id === currentConversationId) {
            return {
              ...conv,
              followUps: [...conv.followUps, {
                question: followUpQuestion,
                response: result.response
              }]
            };
          }
          return conv;
        });
        localStorage.setItem('conversations', JSON.stringify(newConversations));
        return newConversations;
      });

      if (user) {
        await addDoc(chatsCollection, {
          userId: user.uid,
          question: followUpQuestion,
          response: result.response,
          timestamp: serverTimestamp(),
          type: 'followUp',
          requestId: requestId
        });
      }

      setConversationHistory(prev => [...prev, {
        type: 'followUp',
        question: followUpQuestion,
        response: result.response
      }]);
      setFollowUpQuestion('');
      setState(prev => ({ ...prev, loading: false, error: null }));
    } catch (err) {
      setState(prev => ({ ...prev, loading: false, error: err.message }));
    }
  };

  const handleConversationClick = (conv) => {
    setCurrentConversationId(conv.id);
    setRequestId(conv.id);
    setFormData({
      task: conv.task,
      repoPath: conv.repoPath
    });

    setState({
      loading: false,
      error: null,
      response: {
        files: conv.response.files,
        recommendations: conv.response.recommendations,
        ...conv.response.fullResponse
      }
    });


    const initialEntry = {
      type: 'initial',
      task: conv.task,
      response: conv.response
    };

    const followUpEntries = conv.followUps.map(followUp => ({
      type: 'followUp',
      question: followUp.question,
      response: followUp.response
    }));

    setConversationHistory([initialEntry, ...followUpEntries]);
    setDrawerOpen(false);
  };


  return (<>
    <Header darkMode={darkMode} setDarkMode={setDarkMode} />

    <IconButton
      onClick={() => setDrawerOpen(true)}
      sx={{ position: 'fixed', left: 16, top: 70 }}
    >
      <MenuIcon />
    </IconButton>
    <Button
      variant="contained"
      onClick={handleNewConversation}
      sx={{ position: 'fixed', left: 16, top: 120 }}
    >
      Neu
    </Button>

    <Drawer
      anchor="left"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
    >
      <List sx={{ width: 300 }}>
        {allConversations.map((conv) => (
          <React.Fragment key={conv.id}>
            <ListItem
              onClick={() => handleConversationClick(conv)}
              selected={currentConversationId === conv.id}
              secondaryAction={
                <IconButton edge="end" onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteConversation(conv.id);
                }}>
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText
                primary={
                  <>
                    <span>Task: {conv.task.substring(0, 50)}...</span>
                    {conv.followUps.length > 0 && (
                      <span style={{ display: 'block' }}>
                        {conv.followUps.length} follow-up questions
                      </span>
                    )}
                  </>
                }
                secondary={new Date(conv.timestamp).toLocaleString()}
              />
            </ListItem>
            {conv.followUps.map((followUp, index) => (
              <ListItem key={index} sx={{ pl: 4 }}>
                <ListItemText
                  secondary=
                  {
                    <Box component="div"> {/* Change from Typography to Box with div component */}
                      Q: {followUp.question.substring(0, 30)}...
                    </Box>
                  }

                />
              </ListItem>
            ))}
            <Divider />
          </React.Fragment>
        ))}
      </List>
    </Drawer>
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Code Analyzer
        </Typography>
        <Typography variant="subtitle1" gutterBottom align="center">
          Analysiere dein Repository und erhalte Empfehlungen
        </Typography>

        <Paper sx={{ p: 3, mt: 3 }}>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Repository Pfad"
              name="repoPath"
              value={formData.repoPath}
              onChange={handleInputChange}
              margin="normal"
              variant="outlined"
              required
              disabled={state.loading}
            />
            <TextField
              fullWidth
              label="Aufgabenbeschreibung"
              name="task"
              value={formData.task}
              onChange={handleInputChange}
              margin="normal"
              variant="outlined"
              multiline
              rows={4}
              required
              disabled={state.loading}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={state.loading}
              sx={{ mt: 2 }}
            >
              {state.loading ? 'Analysiere...' : 'Analysieren'}
            </Button>
          </form>
        </Paper>

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

        {conversationHistory.length > 0 && (
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Konversationsverlauf:
            </Typography>
            {conversationHistory.map((item, index) => (
              <Box key={index} sx={{ mb: 3 }}>
                {item.type === 'initial' ? (
                  <>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Ursprüngliche Aufgabe:
                    </Typography>
                    <Typography paragraph>{item.task}</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Erste Analyse:
                    </Typography>
                    <ResponseDisplay content={item.response.recommendations} />
                  </>
                ) : (
                  <>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Nachfrage:
                    </Typography>
                    <Typography paragraph>{item.question}</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Antwort:
                    </Typography>
                    <ResponseDisplay content={item.response} />
                  </>
                )}
              </Box>
            ))}
          </Paper>
        )}

        {state.response && (
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Weitere Fragen?
            </Typography>
            <Box component="form" onSubmit={handleFollowUpQuestion}>
              <TextField
                fullWidth
                value={followUpQuestion}
                onChange={(e) => setFollowUpQuestion(e.target.value)}
                placeholder="Stelle eine Nachfrage..."
                disabled={state.loading}
                sx={{ mr: 2 }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={state.loading || !followUpQuestion.trim()}
                sx={{ mt: 2 }}
              >
                Fragen
              </Button>
            </Box>
          </Paper>
        )}
        {state.response?.followUpAnswers && state.response.followUpAnswers.length > 0 && (
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Nachfragen & Antworten:
            </Typography>
            {state.response.followUpAnswers.map((qa, index) => (
              <Box key={index} sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Frage:
                </Typography>
                <Typography paragraph>{qa.question}</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Antwort:
                </Typography>
                <ResponseDisplay content={qa.answer} />
              </Box>
            ))}
          </Paper>
        )}
      </Box>
    </Container>
  </>
  );
}

export default App;