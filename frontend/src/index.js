import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GlobalStateProvider } from './GlobalStateContext';
import AuthProvider from './AuthProvider';
import AppRoutes from './Routes';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <GlobalStateProvider>
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  </GlobalStateProvider>
);