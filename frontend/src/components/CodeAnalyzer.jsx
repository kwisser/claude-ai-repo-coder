import React, { useState, useContext } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
} from "@mui/material";
import { AuthContext } from "../AuthProvider";
import api from "../services/api";
import AnalysisResults from "./AnalysisResults";
import ConfirmationDialog from "./ConfirmationDialog";
import ConversationHistory from "./ConversationHistory";
import FollowUpForm from "./FollowUpForm";

const CodeAnalyzer = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({ task: "", repoPath: "" });
  const [state, setState] = useState({
    loading: false,
    error: null,
    response: null,
  });
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setState({ loading: true, error: null, response: null });
    setRequestId(null);

    try {
      console.log("Submitting analysis request...");
      const estimationResult = await api.analyzeRepository(
        formData.task,
        formData.repoPath,
        false
      );
      console.log("Received estimation result:", estimationResult);

      if (estimationResult.needsConfirmation) {
        const newConversation = {
          id: estimationResult.requestId,
          type: "initial",
          task: formData.task,
          repoPath: formData.repoPath,
          response: {
            files: estimationResult.files,
            recommendations: estimationResult.recommendations,
            fullResponse: estimationResult,
          },
          followUps: [],
          timestamp: new Date().toISOString(),
        };
        setConversationHistory([newConversation]);
        setRequestId(estimationResult.requestId);
        setConfirmation(estimationResult);
        console.log("Request ID: ", estimationResult.requestId);
        setState({ loading: false, error: null, response: null });
        return;
      }

      setState({ loading: false, error: null, response: estimationResult });
    } catch (err) {
      console.error("Error during analysis:", err);
      setState({ loading: false, error: err.message, response: null });
    }
  };

  const handleConfirmAnalysis = async () => {
    setState({ loading: true, error: null, response: null });
    setConfirmation(null);

    try {
      console.log("Confirming analysis with requestId:", requestId);
      const result = await api.confirmAnalysis(requestId); // Send requestId with confirmation
      console.log("Received confirmation result:", result);
      setState({ loading: false, error: null, response: result });
    } catch (err) {
      console.error("Error during confirmation:", err);
      setState({
        loading: false,
        error: err.message || "Ein unerwarteter Fehler ist aufgetreten",
        response: null,
      });
    }
  };

  const handleFollowUpQuestion = async (question) => {
    // Define the logic for handling follow-up questions
  };

  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Code Analyzer
        </Typography>
        <Typography variant="subtitle1" gutterBottom align="center">
          Analyze your repository and get recommendations
        </Typography>
        <Paper
          sx={{
            p: 3,
            mt: 3,
            backgroundColor: "background.paper",
            color: "text.primary",
          }}
        >
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Repository Path"
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
              label="Task Description"
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
              {state.loading ? "Analyzing..." : "Analyze"}
            </Button>
          </form>
        </Paper>
        {state.error && <div className="error-message">{state.error}</div>}
        {state.loading && (
          <div className="loading-container">
            <p>Analyzing repository...</p>
          </div>
        )}
        <AnalysisResults response={state.response} />
        {confirmation && (
          <ConfirmationDialog
            estimatedTokens={confirmation.estimatedTokens}
            estimatedCost={confirmation.estimatedCost}
            onConfirm={handleConfirmAnalysis}
            onCancel={() => setConfirmation(null)}
          />
        )}
        {conversationHistory.length > 0 && (
          <ConversationHistory history={conversationHistory} />
        )}
        {state.response && (
          <FollowUpForm
            followUpQuestion={followUpQuestion}
            setFollowUpQuestion={setFollowUpQuestion}
            handleFollowUpQuestion={handleFollowUpQuestion}
            loading={state.loading}
          />
        )}
      </Box>
    </Container>
  );
};

export default CodeAnalyzer;
