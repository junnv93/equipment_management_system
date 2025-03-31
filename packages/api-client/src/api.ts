// API 클라이언트 기본 구현
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ApiResponse, ApiError } from './types';

// API 기본 URL 설정
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// API 클라이언트 클래스
export class ApiClient {
  private client: AxiosInstance;

  constructor(config?: AxiosRequestConfig) {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    });

    // 요청 인터셉터
    this.client.interceptors.request.use(
      (config) => {
        // 토큰이 있는 경우 헤더에 추가
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('accessToken');
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 응답 인터셉터
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        // 에러 응답 표준화
        const errorResponse: ApiError = {
          error: {
            code: 'UNKNOWN_ERROR',
            message: '알 수 없는 오류가 발생했습니다.',
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        };

        if (error.response) {
          // 서버 에러 응답
          return Promise.reject(error.response.data || errorResponse);
        }

        if (error.request) {
          // 응답 없음
          errorResponse.error.code = 'NETWORK_ERROR';
          errorResponse.error.message = '서버와 연결할 수 없습니다.';
          return Promise.reject(errorResponse);
        }

        return Promise.reject(errorResponse);
      }
    );
  }

  // GET 요청
  async get<T>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.client.get(url, { params });
  }

  // POST 요청
  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.client.post(url, data);
  }

  // PUT 요청
  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.client.put(url, data);
  }

  // PATCH 요청
  async patch<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.client.patch(url, data);
  }

  // DELETE 요청
  async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.client.delete(url);
  }
}

// 기본 API 클라이언트 인스턴스 내보내기
export const apiClient = new ApiClient(); 