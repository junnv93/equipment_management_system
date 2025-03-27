//components/Login.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  TextField, Button, Typography, Container, Box, 
  CircularProgress, Alert, Paper, Snackbar
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, authError, isAuthenticated } = useAuth();

  // URL 쿼리 파라미터 확인
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    if (params.get('expired') === 'true') {
      setError('세션이 만료되었습니다. 다시 로그인해주세요.');
      setShowAlert(true);
    } else if (params.get('session') === 'expired') {
      setError('인증이 만료되었습니다. 다시 로그인해주세요.');
      setShowAlert(true);
    } else if (params.get('logout') === 'success') {
      setError('성공적으로 로그아웃되었습니다.');
      setShowAlert(true);
    }
  }, [location]);

  // 인증 상태 확인
  useEffect(() => {
    if (isAuthenticated) {
      // 이미 로그인된 경우 메인 페이지로 리다이렉트
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // 인증 에러 처리
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 입력 검증
    if (!username.trim()) {
      setError('사용자 이름을 입력해주세요.');
      return;
    }
    
    if (!password.trim()) {
      setError('비밀번호를 입력해주세요.');
      return;
    }
    
    try {
      setError('');
      
      await login(username, password);
      
      // 로그인 성공 시 메인 페이지로 이동
      navigate('/');
    } catch (err) {
      setError(err.message || '로그인에 실패했습니다. 사용자 이름과 비밀번호를 확인해주세요.');
      setShowAlert(true);
    }
  };

  const handleCloseAlert = () => {
    setShowAlert(false);
  };

  return (
    <Container maxWidth="sm">
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh'
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            width: '100%', 
            borderRadius: 2,
            backgroundColor: 'white'
          }}
        >
          <Typography 
            variant="h4" 
            align="center" 
            sx={{ 
              mb: 3, 
              fontWeight: 'bold',
              color: 'primary.main'
            }}
          >
            로그인
          </Typography>
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="username"
              label="사용자 이름"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="password"
              label="비밀번호"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ 
                py: 1.5, 
                fontSize: '1.1rem',
                position: 'relative'
              }}
            >
              로그인
            </Button>
          </form>
        </Paper>
      </Box>
      
      <Snackbar
        open={showAlert}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseAlert} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Login;