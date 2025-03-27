//contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import apiService from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 로그아웃 함수를 먼저 정의
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
  }, []);

  // 토큰 검증 함수
  const verifyToken = useCallback(async () => {
    try {
      console.log('토큰 검증 중...');
      setLoading(true);
      const response = await apiService.auth.getProfile();
      console.log('토큰 검증 완료, 사용자 정보:', response.data);
      setCurrentUser(response.data);
      setIsAuthenticated(true);
      setAuthError(null);
      return true;
    } catch (error) {
      console.error('토큰 검증 실패:', error);
      logout();
      setAuthError('세션이 만료되었습니다. 다시 로그인해주세요.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [logout]);

  // 초기 로드 시 토큰 검증
  useEffect(() => {
    console.log('AuthProvider 초기화');
    const token = localStorage.getItem('token');
    
    if (token) {
      verifyToken();
    }

    // axios 인터셉터 설정
    const interceptorId = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 컴포넌트 언마운트 시 인터셉터 제거
    return () => {
      axios.interceptors.request.eject(interceptorId);
    };
  }, [verifyToken]);

  // 주기적으로 토큰 검증 (선택적)
  useEffect(() => {
    if (!isAuthenticated) return;

    const tokenCheckInterval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token) {
        verifyToken();
      }
    }, 15 * 60 * 1000); // 15분마다 검증

    return () => clearInterval(tokenCheckInterval);
  }, [isAuthenticated, verifyToken]);

  // 로그인 함수
  const login = async (username, password) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      const response = await apiService.auth.login({ username, password });
      const token = response.data.access;
      
      // 토큰 저장
      localStorage.setItem('token', token);
      
      // 사용자 정보 설정
      setCurrentUser(response.data.user);
      setIsAuthenticated(true);
      
      return response.data;
    } catch (error) {
      console.error('로그인 실패:', error);
      
      // 에러 메시지 설정
      const errorMessage = error.message || '로그인에 실패했습니다. 사용자 이름과 비밀번호를 확인해주세요.';
      setAuthError(errorMessage);
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 사용자 정보 갱신 함수
  const refreshUserInfo = async () => {
    try {
      if (!isAuthenticated) return;
      
      const response = await apiService.auth.getProfile();
      setCurrentUser(response.data);
    } catch (error) {
      console.error('사용자 정보 갱신 실패:', error);
      
      // 인증 오류인 경우 로그아웃
      if (error.status === 401) {
        logout();
        setAuthError('세션이 만료되었습니다. 다시 로그인해주세요.');
      }
    }
  };

  // 컨텍스트 값
  const value = {
    currentUser,
    loading,
    authError,
    isAuthenticated,
    login,
    logout,
    refreshUserInfo,
    verifyToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}