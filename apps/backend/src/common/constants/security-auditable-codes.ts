import { ErrorCode } from '@equipment-management/schemas';

/**
 * 보안 감사 대상 ErrorCode SSOT
 *
 * GlobalExceptionFilter에서 참조 (보안 이벤트 감사 로그 기록 트리거).
 * 새 fail-close / scope / 권한 코드 추가 시 이 파일 단일 갱신.
 *
 * 포함 기준:
 *   - 권한 우회 시도 (403 scope/permission denial)
 *   - FSM 위반 (defense-in-depth fail-close — frontend bypass 차단)
 *   - 인증 이상 (token 위조/만료/재사용)
 *   - 승인 프로세스 bypass 시도
 *
 * 제외 기준 (운영 노이즈):
 *   - 유효성 검사 오류 (ValidationError, RequiredFieldMissing 등)
 *   - 리소스 없음 (*NotFound)
 *   - 낙관적 잠금 충돌 (VersionConflict) — 비즈니스 정상 흐름
 *   - 중복 데이터 (Duplicate*, *AlreadyExists)
 *   - 장비 비즈니스 상태 (EquipmentNotAvailable 등)
 *   - 파일/네트워크/시스템 오류
 *   - TooManyRequests (별도 throttler telemetry)
 */
export const SECURITY_AUDITABLE_CODES: ReadonlySet<ErrorCode> = new Set([
  // ─── 권한 / scope 침해 (403) ───────────────────────────────────────────
  ErrorCode.Forbidden,
  ErrorCode.PermissionDenied,
  ErrorCode.ScopeAccessDenied,
  ErrorCode.CannotSelfApprove,
  ErrorCode.FormHistoryDownloadForbidden,
  ErrorCode.RevocationWindowExpired,
  ErrorCode.RevocationReasonRequired,
  ErrorCode.IntermediateInspectionWithdrawNotSubmitter,
  ErrorCode.SelfInspectionWithdrawNotSubmitter,
  ErrorCode.EquipmentImportOnlyRequesterCanCancel,

  // ─── 인증 / 토큰 이상 (401) ───────────────────────────────────────────
  ErrorCode.InvalidCredentials,
  ErrorCode.SessionExpired,
  ErrorCode.HandoverTokenInvalid,
  ErrorCode.HandoverTokenExpired,
  ErrorCode.HandoverTokenConsumed,

  // ─── 폐기(Disposal) fail-close — defense-in-depth bypass 차단 ────────
  ErrorCode.DisposalTeamScopeOnly,
  ErrorCode.DisposalOnlyRequesterCanCancel,
  ErrorCode.DisposalRejectCommentRequired,

  // ─── 교정계획서(Calibration Plan) FSM 위반 ────────────────────────────
  ErrorCode.CalibrationPlanRejectionReasonRequired,
  ErrorCode.CalibrationPlanInvalidStatusForReject,
  ErrorCode.CalibrationPlanInvalidStatusForSubmit,
  ErrorCode.CalibrationPlanOnlyApprovedCanConfirm,
  ErrorCode.CalibrationPlanOnlyApprovedCanCreateVersion,
  ErrorCode.CalibrationPlanOnlyDraftCanDelete,
  ErrorCode.CalibrationPlanOnlyDraftCanUpdate,
  ErrorCode.CalibrationPlanOnlyDraftCanUpdateItem,
  ErrorCode.CalibrationPlanOnlyPendingReviewCanReview,
  ErrorCode.CalibrationPlanOnlyPendingApprovalCanApprove,
  ErrorCode.CalibrationPlanItemNotExecuted,
  ErrorCode.CalibrationPlanNonExportableStatus,

  // ─── 7 도메인 reject defense-in-depth fail-close ─────────────────────
  // (frontend RejectReasonSchema ≥10자 룰의 backend 페어링)
  ErrorCode.EquipmentImportRejectionReasonRequired,
  ErrorCode.CalibrationRejectionReasonRequired,
  ErrorCode.CalibrationFactorRejectionReasonRequired,
  ErrorCode.SoftwareValidationRejectionReasonRequired,
  ErrorCode.IntermediateInspectionRejectionReasonRequired,
  ErrorCode.SelfInspectionRejectionReasonRequired,
  ErrorCode.NonConformanceRejectionReasonRequired,
]);
