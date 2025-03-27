import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 인증 토큰 추가
apiClient.interceptors.request.use(
  (config) => {
    // 클라이언트에서만 실행 (브라우저 환경)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터: 에러 처리 및 표준화
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // API 응답 오류 처리
    if (error.response) {
      // 인증 오류 처리
      if (error.response.status === 401) {
        // 세션 만료 시 처리
        if (typeof window !== 'undefined') {
          // 로그인 페이지로 리디렉션 또는 토큰 갱신 로직
          console.error('Authentication error: Session expired');
          // 필요시 로그아웃 처리
          // localStorage.removeItem('token');
          // window.location.href = '/login';
        }
      }
      
      // 서버에서 정의한 오류 응답이 있는 경우
      const errorData = error.response.data;
      return Promise.reject(errorData);
    }
    
    // 네트워크 오류
    if (error.request) {
      console.error('Network error:', error.message);
      return Promise.reject({
        error: {
          code: 'NETWORK_ERROR',
          message: '서버에 연결할 수 없습니다.',
        },
      });
    }
    
    // 그 외 오류
    console.error('API client error:', error.message);
    return Promise.reject({
      error: {
        code: 'UNKNOWN_ERROR',
        message: '알 수 없는 오류가 발생했습니다.',
      },
    });
  }
);

export default apiClient; 