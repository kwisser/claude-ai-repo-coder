import React, { useState, useEffect, useContext } from 'react';
import { Container, Box, Typography, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { AuthContext } from './AuthProvider';
import Header from './Header';
import NavigationDrawer from './components/NavigationDrawer';
import CodeAnalyzer from './components/CodeAnalyzer';
import { GlobalStateContext } from './GlobalStateContext';

function App() {
  const { user } = useContext(AuthContext);
  const { state, toggleDarkMode } = useContext(GlobalStateContext);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [allConversations, setAllConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);

  useEffect(() => {
    // Load conversations from localStorage on mount
    const savedConversations = localStorage.getItem('conversations');
    if (savedConversations) {
      setAllConversations(JSON.parse(savedConversations));
    }
  }, []);

  const handleConversationClick = (conv) => {
    setCurrentConversationId(conv.id);
    // Additional logic to handle conversation click
  };

  const handleDeleteConversation = (convId) => {
    // Logic to handle conversation deletion
  };

  return (
    <>
      <Header />
      <IconButton
        onClick={() => setDrawerOpen(true)}
        sx={{ position: 'fixed', left: 16, top: 70 }}
      >
        <MenuIcon />
      </IconButton>
      <NavigationDrawer
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        allConversations={allConversations}
        currentConversationId={currentConversationId}
        handleConversationClick={handleConversationClick}
        handleDeleteConversation={handleDeleteConversation}
      />
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Box sx={{ my: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom align="center">
            Code Analyzer
          </Typography>
          <Typography variant="subtitle1" gutterBottom align="center">
            Analyze your repository and get recommendations
          </Typography>
          <CodeAnalyzer />
        </Box>
      </Container>
    </>
  );
}

export default App;