import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HomeIcon from '@mui/icons-material/Home';

function NotFound() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 5,
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <ErrorOutlineIcon sx={{ fontSize: 100, color: 'error.main', mb: 2 }} />
          <Typography variant="h2" component="h1" gutterBottom>
            404
          </Typography>
          <Typography variant="h4" component="h2" gutterBottom>
            페이지를 찾을 수 없습니다
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4 }}>
            요청하신 페이지가 존재하지 않거나, 이동되었거나, 일시적으로 사용할 수 없습니다.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
            size="large"
          >
            홈으로 돌아가기
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}

export default NotFound; 