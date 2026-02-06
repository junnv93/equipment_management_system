/**
 * API 응답 타입 정의
 *
 * Best Practice: 모든 API 응답을 일관된 구조로 통일합니다.
 * - 성공/에러 모두 동일한 래퍼 구조 사용
 * - 타입 안전성 보장
 * - 프론트엔드에서 일관된 처리 가능
 */

/**
 * 기본 API 응답 인터페이스
 */
export interface ApiResponse<T = unknown> {
  /** 응답 상태 */
  success: boolean;
  /** 응답 메시지 (선택적) */
  message?: string;
  /** 응답 데이터 */
  data: T | null;
  /** 응답 시간 */
  timestamp: string;
  /** 에러 코드 (에러 시) */
  code?: string;
}

/**
 * 페이지네이션 메타 정보
 */
export interface PaginationMeta {
  /** 전체 아이템 수 */
  totalItems: number;
  /** 현재 페이지 아이템 수 */
  itemCount: number;
  /** 페이지당 아이템 수 */
  itemsPerPage: number;
  /** 전체 페이지 수 */
  totalPages: number;
  /** 현재 페이지 번호 */
  currentPage: number;
}

/**
 * 페이지네이션 응답
 */
export interface PaginatedResponse<T> {
  /** 아이템 목록 */
  items: T[];
  /** 페이지네이션 메타 정보 */
  meta: PaginationMeta;
}

/**
 * 성공 응답 생성 헬퍼
 */
export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 페이지네이션 응답 생성 헬퍼
 */
export function createPaginatedResponse<T>(
  items: T[],
  meta: PaginationMeta,
  message?: string
): ApiResponse<PaginatedResponse<T>> {
  return {
    success: true,
    message,
    data: { items, meta },
    timestamp: new Date().toISOString(),
  };
}

/**
 * 에러 응답 생성 헬퍼
 */
export function createErrorResponse(code: string, message: string): ApiResponse<null> {
  return {
    success: false,
    code,
    message,
    data: null,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 빈 성공 응답 (204 No Content 대용)
 */
export function createEmptyResponse(message?: string): ApiResponse<null> {
  return {
    success: true,
    message: message || '요청이 성공적으로 처리되었습니다.',
    data: null,
    timestamp: new Date().toISOString(),
  };
}

/**
 * 생성 성공 응답 (201 Created)
 */
export function createCreatedResponse<T>(
  data: T,
  message = '리소스가 성공적으로 생성되었습니다.'
): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}
