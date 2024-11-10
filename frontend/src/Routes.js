// Routes.js
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import Login from "./Login";
import SignUp from "./SignUp";
import Profile from "./Profile";
import PrivateRoute from "./PrivateRoute";
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { useState } from 'react';
import React from 'react';


const ThemedApp = React.memo(function ThemedApp() {
    const [darkMode, setDarkMode] = useState(true);

    const theme = createTheme({
        palette: {
            mode: darkMode ? 'dark' : 'light',
            primary: {
                main: '#007bff',
            },
            secondary: {
                main: '#f50057',
            },
        },
    });

    const router = createBrowserRouter([
        {
            path: '/',
            element: (
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <App darkMode={darkMode} setDarkMode={setDarkMode} />
                </ThemeProvider>
            ),
            children: [
                {
                    path: 'login',
                    element: <Login />,
                },
                {
                    path: 'signup',
                    element: <SignUp />,
                },
            ],
        },
        {
            path: 'profile',
            element: (
                <PrivateRoute>
                    <Profile />
                </PrivateRoute>
            ),
        },

    ]);

    return (
        <RouterProvider router={router} /> 
    );
});

export default ThemedApp;