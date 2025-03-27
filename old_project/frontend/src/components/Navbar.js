//components/Navbar.js
import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    // 로그아웃 후 로그인 페이지로 리다이렉트
    window.location.href = '/login';
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" style={{ flexGrow: 1 }}>
          Equipment Management
        </Typography>
        {currentUser ? (
          <>
            <Button color="inherit" component={RouterLink} to="/">
              Dashboard
            </Button>
            <Button color="inherit" component={RouterLink} to="/equipment">
              Equipment
            </Button>
            <Button color="inherit" component={RouterLink} to="/checkout">
              Checkout
            </Button>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </>
        ) : (
          <Button color="inherit" component={RouterLink} to="/login">
            Login
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
