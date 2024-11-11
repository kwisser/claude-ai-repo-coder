import React from 'react';
import { Paper, TextField, Button, Box } from '@mui/material';

const SearchForm = ({ formData, handleInputChange, handleSubmit, loading }) => {
  return (
    <Paper sx={{ p: 3, mt: 3, backgroundColor: 'background.paper', color: 'text.primary' }}>
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
          disabled={loading}
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
          disabled={loading}
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </Button>
      </form>
    </Paper>
  );
};

export default SearchForm;