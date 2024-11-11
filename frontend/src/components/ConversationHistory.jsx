import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import ResponseDisplay from './ResponseDisplay';

const ConversationHistory = ({ history }) => {
  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Conversation History:
      </Typography>
      {history.map((item, index) => (
        <Box key={index} sx={{ mb: 3 }}>
          {item.type === 'initial' ? (
            <>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Initial Task:
              </Typography>
              <Typography paragraph>{item.task}</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Initial Analysis:
              </Typography>
              <ResponseDisplay content={item.response.recommendations} />
            </>
          ) : (
            <>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Follow-Up Question:
              </Typography>
              <Typography paragraph>{item.question}</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Answer:
              </Typography>
              <ResponseDisplay content={item.response} />
            </>
          )}
        </Box>
      ))}
    </Paper>
  );
};

export default ConversationHistory;