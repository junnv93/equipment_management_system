//components/PrivateRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function PrivateRoute() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // 또는 로딩 스피너
  }

  return currentUser ? <Outlet /> : <Navigate to="/login" />;
}

export default PrivateRoute;