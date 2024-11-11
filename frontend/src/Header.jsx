import React, { useContext } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthProvider";
import { GlobalStateContext } from "./GlobalStateContext";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Avatar,
  Switch,
  FormControlLabel,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

const Header = () => {
  const { user, logOut } = useContext(AuthContext);
  const { state, toggleDarkMode } = useContext(GlobalStateContext);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = () => {
    logOut()
      .then(() => {
        console.log("User logged out successfully");
        navigate("/login");
      })
      .catch((error) => console.error(error));
  };

  const navLinks = (
    <>
      <Button color="inherit" component={NavLink} to="/">
        Home
      </Button>
      {!user && (
        <>
          <Button color="inherit" component={NavLink} to="/login">
            Login
          </Button>
          <Button color="inherit" component={NavLink} to="/sign-up">
            Sign-Up
          </Button>
        </>
      )}
    </>
  );

  return (
    <AppBar position="fixed">
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={handleMenu}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            Firebase Auth
          </Link>
        </Typography>
        <FormControlLabel
          control={
            <Switch checked={state.darkMode} onChange={toggleDarkMode} />
          }
          label="Dark Mode"
        />
        {navLinks}
        {user && (
          <>
            <IconButton
              edge="end"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar alt={user.displayName} src={user.photoURL} />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleClose} component={Link} to="/profile">
                Profile
              </MenuItem>
              <MenuItem onClick={handleSignOut}>Logout</MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
