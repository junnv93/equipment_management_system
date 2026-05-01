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

  // ============================================================================
  // Handover 서명 토큰 (QR Phase 3 인수인계) — jti 기반 1회용
  // ============================================================================
  /** 서명 불일치, 포맷 오류 등 유효하지 않은 토큰. */
  HandoverTokenInvalid = 'HANDOVER_TOKEN_INVALID',
  /** 10분 TTL 초과. */
  HandoverTokenExpired = 'HANDOVER_TOKEN_EXPIRED',
  /** 이미 한 번 소비된 토큰 (재사용 시도 차단). */
  HandoverTokenConsumed = 'HANDOVER_TOKEN_CONSUMED',

  // ============================================================================
  // 승인 철회 (Revoke Approval)
  // ============================================================================
  /** 승인 후 5분 경과 — 철회 가능 시간 초과. */
  RevocationWindowExpired = 'REVOCATION_WINDOW_EXPIRED',

  // ============================================================================
  // 폐기(Disposal) 도메인 (UL-QP-18-04)
  // ============================================================================
  /** 폐기 요청이 존재하지 않음. */
  DisposalRequestNotFound = 'DISPOSAL_REQUEST_NOT_FOUND',
  /** 검토 대기(pending) 상태 폐기 요청을 찾을 수 없음. */
  DisposalPendingNotFound = 'DISPOSAL_PENDING_NOT_FOUND',
  /** 검토 완료(reviewed) 상태 폐기 요청을 찾을 수 없음. */
  DisposalReviewedNotFound = 'DISPOSAL_REVIEWED_NOT_FOUND',
  /** 폐기 검토자(reviewer) 정보를 찾을 수 없음. */
  DisposalReviewerNotFound = 'DISPOSAL_REVIEWER_NOT_FOUND',
  /** 다른 팀 장비는 검토 불가 (lab_manager 제외). */
  DisposalTeamScopeOnly = 'DISPOSAL_TEAM_SCOPE_ONLY',
  /** 이미 폐기 요청이 진행 중. */
  DisposalAlreadyInProgress = 'DISPOSAL_ALREADY_IN_PROGRESS',
  /** 요청자 본인만 취소 가능. */
  DisposalOnlyRequesterCanCancel = 'DISPOSAL_ONLY_REQUESTER_CAN_CANCEL',
  /** 폐기 반려 코멘트가 최소 길이 미만 (frontend bypass 차단 fail-close). */
  DisposalRejectCommentRequired = 'DISPOSAL_REJECT_COMMENT_REQUIRED',

  // ============================================================================
  // 교정계획서(Calibration Plan) 도메인 (UL-QP-18-09 / UL-QP-18-10)
  // ============================================================================
  /** 교정계획서를 찾을 수 없음. */
  CalibrationPlanNotFound = 'CALIBRATION_PLAN_NOT_FOUND',
  /** 교정계획서 항목을 찾을 수 없음. */
  CalibrationPlanItemNotFound = 'CALIBRATION_PLAN_ITEM_NOT_FOUND',
  /** 동일 연도/팀 교정계획서가 이미 존재함. */
  CalibrationPlanAlreadyExists = 'CALIBRATION_PLAN_ALREADY_EXISTS',
  /** 반려 사유가 최소 길이 미만 (defense-in-depth fail-close). */
  CalibrationPlanRejectionReasonRequired = 'CALIBRATION_PLAN_REJECTION_REASON_REQUIRED',
  /** 검토/승인 대기 상태가 아닌 계획서는 반려 불가. */
  CalibrationPlanInvalidStatusForReject = 'CALIBRATION_PLAN_INVALID_STATUS_FOR_REJECT',
  /** draft 상태가 아닌 계획서는 검토 요청 불가. */
  CalibrationPlanInvalidStatusForSubmit = 'CALIBRATION_PLAN_INVALID_STATUS_FOR_SUBMIT',
  /** 승인된 계획서만 항목 확인 가능. */
  CalibrationPlanOnlyApprovedCanConfirm = 'CALIBRATION_PLAN_ONLY_APPROVED_CAN_CONFIRM',
  /** 승인된 계획서만 새 버전 생성 가능. */
  CalibrationPlanOnlyApprovedCanCreateVersion = 'CALIBRATION_PLAN_ONLY_APPROVED_CAN_CREATE_VERSION',
  /** draft 상태만 삭제 가능. */
  CalibrationPlanOnlyDraftCanDelete = 'CALIBRATION_PLAN_ONLY_DRAFT_CAN_DELETE',
  /** draft 상태만 수정 가능. */
  CalibrationPlanOnlyDraftCanUpdate = 'CALIBRATION_PLAN_ONLY_DRAFT_CAN_UPDATE',
  /** draft 상태만 항목 수정 가능. */
  CalibrationPlanOnlyDraftCanUpdateItem = 'CALIBRATION_PLAN_ONLY_DRAFT_CAN_UPDATE_ITEM',
  /** 검토 대기 상태만 검토 완료 가능. */
  CalibrationPlanOnlyPendingReviewCanReview = 'CALIBRATION_PLAN_ONLY_PENDING_REVIEW_CAN_REVIEW',
  /** 승인 대기 상태만 최종 승인 가능. */
  CalibrationPlanOnlyPendingApprovalCanApprove = 'CALIBRATION_PLAN_ONLY_PENDING_APPROVAL_CAN_APPROVE',
  /** 미실행 항목이 있는 계획서는 처리 불가. */
  CalibrationPlanItemNotExecuted = 'PLAN_ITEM_NOT_EXECUTED',
  /** 'approved' 외 상태의 계획서는 export 불가 (export 보안 게이트). */
  CalibrationPlanNonExportableStatus = 'NON_EXPORTABLE_PLAN_STATUS',
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
  [ErrorCode.HandoverTokenInvalid]: 400,
  [ErrorCode.HandoverTokenExpired]: 401,
  [ErrorCode.HandoverTokenConsumed]: 409,

  // 승인 철회
  [ErrorCode.RevocationWindowExpired]: 403,

  [ErrorCode.NetworkError]: 503,
  [ErrorCode.TimeoutError]: 504,
  [ErrorCode.ServiceUnavailable]: 503,

  // 폐기(Disposal) 도메인
  [ErrorCode.DisposalRequestNotFound]: 404,
  [ErrorCode.DisposalPendingNotFound]: 404,
  [ErrorCode.DisposalReviewedNotFound]: 404,
  [ErrorCode.DisposalReviewerNotFound]: 404,
  [ErrorCode.DisposalTeamScopeOnly]: 403,
  [ErrorCode.DisposalAlreadyInProgress]: 409,
  [ErrorCode.DisposalOnlyRequesterCanCancel]: 403,
  [ErrorCode.DisposalRejectCommentRequired]: 400,

  // 교정계획서(Calibration Plan) 도메인
  [ErrorCode.CalibrationPlanNotFound]: 404,
  [ErrorCode.CalibrationPlanItemNotFound]: 404,
  [ErrorCode.CalibrationPlanAlreadyExists]: 409,
  [ErrorCode.CalibrationPlanRejectionReasonRequired]: 400,
  [ErrorCode.CalibrationPlanInvalidStatusForReject]: 400,
  [ErrorCode.CalibrationPlanInvalidStatusForSubmit]: 400,
  [ErrorCode.CalibrationPlanOnlyApprovedCanConfirm]: 400,
  [ErrorCode.CalibrationPlanOnlyApprovedCanCreateVersion]: 400,
  [ErrorCode.CalibrationPlanOnlyDraftCanDelete]: 400,
  [ErrorCode.CalibrationPlanOnlyDraftCanUpdate]: 400,
  [ErrorCode.CalibrationPlanOnlyDraftCanUpdateItem]: 400,
  [ErrorCode.CalibrationPlanOnlyPendingReviewCanReview]: 400,
  [ErrorCode.CalibrationPlanOnlyPendingApprovalCanApprove]: 400,
  [ErrorCode.CalibrationPlanItemNotExecuted]: 400,
  [ErrorCode.CalibrationPlanNonExportableStatus]: 400,
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
