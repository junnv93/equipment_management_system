//src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import EquipmentList from './components/EquipmentList';
import EquipmentDetail from './components/EquipmentDetail';
import EquipmentForm from './components/EquipmentForm';
import CheckoutList from './components/CheckoutList';
import CheckoutDetail from './components/CheckoutDetail';
import RecentActivity from './components/RecentActivity';
import Layout from './components/Layout';
import NotFound from './components/NotFound';

// 테마 설정
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      'Noto Sans KR',
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

// 인증이 필요한 라우트를 위한 래퍼 컴포넌트
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // 인증 상태 로딩 중일 때 로딩 표시
  if (isLoading) {
    return <div>로딩 중...</div>;
  }
  
  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // 인증된 경우 자식 컴포넌트 렌더링
  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* 공개 라우트 */}
            <Route path="/login" element={<Login />} />
            
            {/* 인증이 필요한 라우트 */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              
              {/* 장비 관련 라우트 */}
              <Route path="equipment">
                <Route index element={<EquipmentList />} />
                <Route path=":id" element={<EquipmentDetail />} />
                <Route path="new" element={<EquipmentForm />} />
                <Route path="edit/:id" element={<EquipmentForm />} />
              </Route>
              
              {/* 반출 관련 라우트 */}
              <Route path="checkout">
                <Route index element={<CheckoutList />} />
                <Route path=":id" element={<CheckoutDetail />} />
                <Route path="new" element={<CheckoutDetail />} />
                <Route path="edit/:id" element={<CheckoutDetail />} />
              </Route>
              
              {/* 최근 활동 라우트 */}
              <Route path="activities" element={<RecentActivity />} />
            </Route>
            
            {/* 404 페이지 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
