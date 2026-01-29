/**
 * 공통 타입 정의 파일
 *
 * ⚠️ SSOT: 백엔드에서 반복적으로 사용되는 타입의 단일 소스
 * any 타입 사용을 방지하기 위한 명시적 타입 정의
 */

// ============================================================================
// Re-exports from auth.ts (인증 관련 타입)
// ============================================================================
export { JwtUser, AuthenticatedRequest, AzureADProfile } from './auth';

// ============================================================================
// Multer 파일 타입
// ============================================================================

/**
 * Multer에서 업로드된 파일 타입
 *
 * @example
 * ```typescript
 * // ❌ 금지
 * @UploadedFile() file: any
 *
 * // ✅ 권장
 * import { MulterFile } from '../../types/common.types';
 * @UploadedFile() file: MulterFile
 * ```
 */
export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer: Buffer;
}

// ============================================================================
// 로거 관련 타입
// ============================================================================

/**
 * 로거 메타데이터 타입
 * Winston 로거에 전달되는 추가 메타데이터
 */
export type LogMetadata = Record<string, unknown>;

/**
 * 로그 레벨 타입
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

// ============================================================================
// 에러 관련 타입
// ============================================================================

/**
 * 에러 상세 정보 타입
 * API 응답에서 에러 상세 정보를 표현할 때 사용
 */
export type ErrorDetails = Record<string, unknown> | Error | null;

/**
 * API 에러 응답 타입
 */
export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
  details?: ErrorDetails;
  timestamp?: string;
  path?: string;
}

// ============================================================================
// HTTP 요청 관련 타입
// ============================================================================

/**
 * Express Request에서 일반적으로 사용하는 타입들
 */
export interface RequestContext {
  params: Record<string, string>;
  query: Record<string, unknown>;
  body: Record<string, unknown>;
  headers: Record<string, string | string[] | undefined>;
}

/**
 * IP 주소 관련 타입
 */
export type IpAddress = string | undefined;

// ============================================================================
// 데이터베이스 관련 타입
// ============================================================================

/**
 * Drizzle ORM에서 insert/update 시 사용하는 값 타입
 * as any 캐스팅을 피하기 위한 타입
 */
export type DrizzleInsertValue<T> = Partial<T> & Record<string, unknown>;

// ============================================================================
// 유틸리티 타입
// ============================================================================

/**
 * Nullable 타입 헬퍼
 */
export type Nullable<T> = T | null;

/**
 * Optional 타입 헬퍼
 */
export type Optional<T> = T | undefined;

/**
 * 값이 존재하는지 확인하는 타입 가드
 */
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

/**
 * 객체인지 확인하는 타입 가드
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Error 인스턴스인지 확인하는 타입 가드
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}
