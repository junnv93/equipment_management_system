// API 클라이언트 타입 정의
export interface ApiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      total: number;
      pageSize: number;
      currentPage: number;
      totalPages: number;
    };
    timestamp: string;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta: {
    timestamp: string;
  };
} 