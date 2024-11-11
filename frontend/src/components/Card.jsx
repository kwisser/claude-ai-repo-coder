import React from 'react';
import { Paper } from '@mui/material';

const Card = ({ children, ...props }) => {
  return (
    <Paper elevation={3} {...props}>
      {children}
    </Paper>
  );
};

export default Card;