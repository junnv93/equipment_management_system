import axios from 'axios';
// ✅ 일관된 에러 처리: 공통 유틸리티 사용
import { transformErrorResponse } from './utils/response-transformers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 설정
apiClient.interceptors.request.use(
  (config) => {
    // 토큰이 있다면 헤더에 추가
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 설정
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 토큰이 만료된 경우 (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // 토큰 갱신 요청
        const response = await apiClient.post('/api/auth/refresh');
        const { token } = response.data;

        // 새로운 토큰 저장
        localStorage.setItem('token', token);

        // 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch (error) {
        // 토큰 갱신 실패 시 로그아웃
        localStorage.removeItem('token');
        window.location.href = '/auth/login';
        return Promise.reject(error);
      }
    }

    // ✅ 공통 에러 변환 유틸리티 사용: 일관된 에러 처리
    const transformedError = transformErrorResponse(error);
    return Promise.reject(new Error(transformedError.message));
  }
);
