import React from 'react';
import { Box, Typography } from '@mui/material';
import ResponseDisplay from './ResponseDisplay';

const AnalysisResults = ({ response }) => {
  if (!response) return null;

  return (
    <Box className="results-section">
      <Typography variant="h4" gutterBottom>
        Analysis Results
      </Typography>
      {response.files?.length > 0 && (
        <Box className="relevant-files">
          <Typography variant="h5">Relevant Files:</Typography>
          <ul>
            {response.files.map((file, index) => (
              <li key={index}>{file}</li>
            ))}
          </ul>
        </Box>
      )}
      <Box className="recommendations">
        <Typography variant="h5">Recommendations:</Typography>
        <ResponseDisplay content={response.recommendations} />
      </Box>
    </Box>
  );
};

export default AnalysisResults;