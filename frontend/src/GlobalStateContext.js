import React, { createContext, useState, useEffect } from 'react';

export const GlobalStateContext = createContext();

export const GlobalStateProvider = ({ children }) => {
  const [state, setState] = useState({
    darkMode: JSON.parse(localStorage.getItem('darkMode')) || false,
    user: null,
  });

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode !== null && darkMode !== 'undefined') {
      try {
        const parsedDarkMode = JSON.parse(darkMode);
        setState((prevState) => ({ ...prevState, darkMode: parsedDarkMode }));
      } catch (error) {
        console.error('Error parsing dark mode from localStorage:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (state.darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [state.darkMode]);

  const toggleDarkMode = () => {
    try {
      setState((prevState) => {
        const newDarkMode = !prevState.darkMode;
        localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
        return { ...prevState, darkMode: newDarkMode };
      });
    } catch (error) {
      console.error('Error toggling dark mode:', error);
    }
  };

  const setUser = (user) => {
    setState((prevState) => ({ ...prevState, user }));
  };

  return (
    <GlobalStateContext.Provider value={{ state, toggleDarkMode, setUser }}>
      {children}
    </GlobalStateContext.Provider>
  );
};