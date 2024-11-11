import React from 'react';
import { Paper, TextField, Button, Box, Typography } from '@mui/material';

const FollowUpForm = ({ followUpQuestion, setFollowUpQuestion, handleFollowUpQuestion, loading }) => {
  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Have more questions?
      </Typography>
      <Box component="form" onSubmit={handleFollowUpQuestion}>
        <TextField
          fullWidth
          value={followUpQuestion}
          onChange={(e) => setFollowUpQuestion(e.target.value)}
          placeholder="Ask a follow-up question..."
          disabled={loading}
          sx={{ mr: 2 }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={loading || !followUpQuestion.trim()}
          sx={{ mt: 2 }}
        >
          Ask
        </Button>
      </Box>
    </Paper>
  );
};

export default FollowUpForm;