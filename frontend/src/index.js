import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AuthProvider from './AuthProvider';
import Router from './Routes';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <AuthProvider>
      <Router />
    </AuthProvider>
  </React.StrictMode>
);