import { z } from 'zod';

/**
 * 에러 코드 정의
 *
 * ⚠️ SSOT: 이 파일이 에러 코드의 단일 소스
 * 백엔드/프론트엔드 모두 이 코드를 기준으로 에러 처리
 *
 * 명명 규칙:
 * - PascalCase (JavaScript enum 컨벤션)
 * - 값은 SCREAMING_SNAKE_CASE
 */
export enum ErrorCode {
  // ============================================================================
  // 일반 HTTP 에러
  // ============================================================================
  BadRequest = 'BAD_REQUEST',
  Unauthorized = 'UNAUTHORIZED',
  Forbidden = 'FORBIDDEN',
  NotFound = 'NOT_FOUND',
  Conflict = 'CONFLICT',
  TooManyRequests = 'TOO_MANY_REQUESTS',
  InternalServerError = 'INTERNAL_SERVER_ERROR',

  // ============================================================================
  // 장비 관련 에러
  // ============================================================================
  EquipmentNotAvailable = 'EQUIPMENT_NOT_AVAILABLE',
  EquipmentAlreadyAssigned = 'EQUIPMENT_ALREADY_ASSIGNED',
  EquipmentMaintenance = 'EQUIPMENT_MAINTENANCE',
  EquipmentNotFound = 'EQUIPMENT_NOT_FOUND',
  DuplicateManagementNumber = 'DUPLICATE_MANAGEMENT_NUMBER',
  DuplicateSerialNumber = 'DUPLICATE_SERIAL_NUMBER',

  // ============================================================================
  // 사용자/인증 관련 에러
  // ============================================================================
  InvalidCredentials = 'INVALID_CREDENTIALS',
  UserNotFound = 'USER_NOT_FOUND',
  EmailAlreadyExists = 'EMAIL_ALREADY_EXISTS',
  SessionExpired = 'SESSION_EXPIRED',
  PermissionDenied = 'PERMISSION_DENIED',

  // ============================================================================
  // 데이터 유효성 에러
  // ============================================================================
  InvalidData = 'INVALID_DATA',
  ValidationError = 'VALIDATION_ERROR',
  RequiredFieldMissing = 'REQUIRED_FIELD_MISSING',
  InvalidFormat = 'INVALID_FORMAT',
  InvalidDate = 'INVALID_DATE',

  // ============================================================================
  // 파일 관련 에러
  // ============================================================================
  FileTooLarge = 'FILE_TOO_LARGE',
  InvalidFileType = 'INVALID_FILE_TYPE',
  FileUploadFailed = 'FILE_UPLOAD_FAILED',
  FileEmpty = 'FILE_EMPTY',
  FileContentMismatch = 'FILE_CONTENT_MISMATCH',
  FileSaveFailed = 'FILE_SAVE_FAILED',
  FileReadFailed = 'FILE_READ_FAILED',

  // ============================================================================
  // 비즈니스 로직 에러
  // ============================================================================
  CheckoutAlreadyApproved = 'CHECKOUT_ALREADY_APPROVED',
  CheckoutNotPending = 'CHECKOUT_NOT_PENDING',
  CalibrationOverdue = 'CALIBRATION_OVERDUE',
  NonConformanceNotOpen = 'NON_CONFORMANCE_NOT_OPEN',
  CannotSelfApprove = 'CANNOT_SELF_APPROVE',

  // ============================================================================
  // Optimistic Locking (CAS) — SSOT for VersionedBaseService.updateWithVersion()
  // ============================================================================
  /**
   * CAS(낙관적 잠금) 충돌.
   * 백엔드 VersionedBaseService 와 프론트엔드 useOptimisticMutation / error classifier,
   * E2E helpers(approval-helpers.ts, s25-cas-concurrent-approval.spec.ts 등) 가 모두 이 값을 참조.
   * 리터럴 `'VERSION_CONFLICT'` 를 새로 도입하지 말고 항상 `ErrorCode.VersionConflict` 사용할 것.
   */
  VersionConflict = 'VERSION_CONFLICT',

  // ============================================================================
  // 스코프/접근 범위 에러
  // ============================================================================
  ScopeAccessDenied = 'SCOPE_ACCESS_DENIED',

  // ============================================================================
  // 양식 템플릿 관련 에러 (UL-QP-18 form templates)
  // ============================================================================
  FormNumberAlreadyExists = 'FORM_NUMBER_ALREADY_EXISTS',
  FormTemplateNotFound = 'FORM_TEMPLATE_NOT_FOUND',
  FormHistoryDownloadForbidden = 'FORM_HISTORY_DOWNLOAD_FORBIDDEN',
  InvalidFormName = 'INVALID_FORM_NAME',
  InvalidFormNumberFormat = 'INVALID_FORM_NUMBER_FORMAT',

  // ============================================================================
  // 네트워크/시스템 에러
  // ============================================================================
  NetworkError = 'NETWORK_ERROR',
  TimeoutError = 'TIMEOUT_ERROR',
  ServiceUnavailable = 'SERVICE_UNAVAILABLE',
}

// HTTP 상태 코드와 에러 코드 매핑
export const errorCodeToStatusCode: Record<ErrorCode, number> = {
  // 일반 HTTP 에러
  [ErrorCode.BadRequest]: 400,
  [ErrorCode.Unauthorized]: 401,
  [ErrorCode.Forbidden]: 403,
  [ErrorCode.NotFound]: 404,
  [ErrorCode.Conflict]: 409,
  [ErrorCode.TooManyRequests]: 429,
  [ErrorCode.InternalServerError]: 500,

  // 장비 관련 에러
  [ErrorCode.EquipmentNotAvailable]: 400,
  [ErrorCode.EquipmentAlreadyAssigned]: 409,
  [ErrorCode.EquipmentMaintenance]: 400,
  [ErrorCode.EquipmentNotFound]: 404,
  [ErrorCode.DuplicateManagementNumber]: 409,
  [ErrorCode.DuplicateSerialNumber]: 409,

  // 사용자/인증 관련 에러
  [ErrorCode.InvalidCredentials]: 401,
  [ErrorCode.UserNotFound]: 404,
  [ErrorCode.EmailAlreadyExists]: 409,
  [ErrorCode.SessionExpired]: 401,
  [ErrorCode.PermissionDenied]: 403,

  // 데이터 유효성 에러
  [ErrorCode.InvalidData]: 400,
  [ErrorCode.ValidationError]: 400,
  [ErrorCode.RequiredFieldMissing]: 400,
  [ErrorCode.InvalidFormat]: 400,
  [ErrorCode.InvalidDate]: 400,

  // 파일 관련 에러
  [ErrorCode.FileTooLarge]: 413,
  [ErrorCode.InvalidFileType]: 415,
  [ErrorCode.FileUploadFailed]: 500,
  [ErrorCode.FileEmpty]: 400,
  [ErrorCode.FileContentMismatch]: 400,
  [ErrorCode.FileSaveFailed]: 500,
  [ErrorCode.FileReadFailed]: 500,

  // 비즈니스 로직 에러
  [ErrorCode.CheckoutAlreadyApproved]: 409,
  [ErrorCode.CheckoutNotPending]: 400,
  [ErrorCode.CalibrationOverdue]: 400,
  [ErrorCode.NonConformanceNotOpen]: 400,
  [ErrorCode.CannotSelfApprove]: 403,

  // Optimistic Locking
  [ErrorCode.VersionConflict]: 409,

  // 스코프/접근 범위 에러
  [ErrorCode.ScopeAccessDenied]: 403,

  // 양식 템플릿 관련 에러
  [ErrorCode.FormNumberAlreadyExists]: 409,
  [ErrorCode.FormTemplateNotFound]: 404,
  [ErrorCode.FormHistoryDownloadForbidden]: 403,
  [ErrorCode.InvalidFormName]: 400,
  [ErrorCode.InvalidFormNumberFormat]: 400,

  // 네트워크/시스템 에러
  [ErrorCode.NetworkError]: 503,
  [ErrorCode.TimeoutError]: 504,
  [ErrorCode.ServiceUnavailable]: 503,
};

// 에러 응답 스키마
export const ErrorResponseSchema = z.object({
  code: z.nativeEnum(ErrorCode),
  message: z.string(),
  details: z.unknown().optional(),
  timestamp: z.string().datetime(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// V8 엔진의 captureStackTrace 타입 정의
interface ErrorConstructorWithCaptureStackTrace {
  new (message?: string): Error;
  (message?: string): Error;
  readonly prototype: Error;
  captureStackTrace?(targetObject: object, constructorOpt?: NewableFunction): void;
}

// 애플리케이션 에러 클래스
export class AppError extends Error {
  code: ErrorCode;
  details?: unknown;
  statusCode: number;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
    this.statusCode = errorCodeToStatusCode[code];
    this.name = 'AppError';

    // 스택 트레이스 유지를 위한 설정
    // V8 엔진 전용 API (Node.js)
    const ErrorConstructor = Error as ErrorConstructorWithCaptureStackTrace;
    if (ErrorConstructor.captureStackTrace) {
      ErrorConstructor.captureStackTrace(this, AppError);
    }
  }

  // 응답 형식으로 변환
  toResponse(): ErrorResponse {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: new Date().toISOString(),
    };
  }

  // 특정 에러 타입 생성을 위한 팩토리 메서드들
  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(ErrorCode.BadRequest, message, details);
  }

  static unauthorized(message: string = '인증이 필요합니다', details?: unknown): AppError {
    return new AppError(ErrorCode.Unauthorized, message, details);
  }

  static forbidden(message: string = '권한이 없습니다', details?: unknown): AppError {
    return new AppError(ErrorCode.Forbidden, message, details);
  }

  static notFound(message: string = '리소스를 찾을 수 없습니다', details?: unknown): AppError {
    return new AppError(ErrorCode.NotFound, message, details);
  }

  static conflict(message: string, details?: unknown): AppError {
    return new AppError(ErrorCode.Conflict, message, details);
  }

  static internalServerError(
    message: string = '서버 오류가 발생했습니다',
    details?: unknown
  ): AppError {
    return new AppError(ErrorCode.InternalServerError, message, details);
  }

  static validationError(message: string = '유효성 검사 오류', details?: unknown): AppError {
    return new AppError(ErrorCode.ValidationError, message, details);
  }
}

// Zod 검증 에러를 AppError로 변환하는 유틸리티 함수
export function handleZodError(error: z.ZodError): AppError {
  return AppError.validationError('입력 데이터가 유효하지 않습니다', {
    issues: error.format(),
  });
}
