import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, Container, Switch, FormControlLabel } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { useContext } from 'react';
import { GlobalStateContext } from './GlobalStateContext';
import Header from './Header';

const Layout = () => {
    const { state, toggleDarkMode } = useContext(GlobalStateContext);
    const theme = createTheme({
        palette: {
            mode: state.darkMode ? 'dark' : 'light',
            background: {
                default: state.darkMode ? '#121212' : '#ffffff',
                paper: state.darkMode ? '#1e1e1e' : '#ffffff',
            },
            text: {
                primary: state.darkMode ? '#ffffff' : '#000000',
                secondary: state.darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
            },
        },
    });

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ display: 'flex' }}>
                <CssBaseline />
                <Header />
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        bgcolor: 'background.default',
                        color: 'text.primary',
                        p: 3,
                        minHeight: '100vh',
                    }}
                >
                    <Container maxWidth="lg">
                        <FormControlLabel
                            control={<Switch checked={state.darkMode} onChange={toggleDarkMode} />}
                            label="Dark Mode"
                        />
                        <Outlet />
                    </Container>
                </Box>
            </Box>
        </ThemeProvider>
    );
};

export default Layout;