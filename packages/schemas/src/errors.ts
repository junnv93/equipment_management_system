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
  EquipmentNotFound = 'EQUIPMENT_NOT_FOUND',
  EquipmentSiteScopeOnly = 'EQUIPMENT_SITE_SCOPE_ONLY',
  EquipmentTeamScopeOnly = 'EQUIPMENT_TEAM_SCOPE_ONLY',
  EquipmentManagementNumberRequired = 'EQUIPMENT_MANAGEMENT_NUMBER_REQUIRED',
  EquipmentSharedCannotUpdate = 'EQUIPMENT_SHARED_CANNOT_UPDATE',
  EquipmentSharedCannotDelete = 'EQUIPMENT_SHARED_CANNOT_DELETE',
  EquipmentFileRequired = 'EQUIPMENT_FILE_REQUIRED',
  EquipmentAttachmentTypeRequired = 'EQUIPMENT_ATTACHMENT_TYPE_REQUIRED',
  EquipmentFormDataParseFailed = 'FORM_DATA_PARSE_FAILED',
  EquipmentInvalidManagementNumber = 'INVALID_MANAGEMENT_NUMBER',
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

  // ============================================================================
  // Reject 사유 길이 SSOT — 7개 도메인 reject defense-in-depth fail-close
  // (frontend `RejectReasonSchema` ≥10자 룰의 backend 페어링)
  // ============================================================================
  /** 장비 반입 반려 사유가 최소 길이 미만 (frontend bypass 차단 fail-close). */
  EquipmentImportRejectionReasonRequired = 'EQUIPMENT_IMPORT_REJECTION_REASON_REQUIRED',
  /** 교정 기록 반려 사유가 최소 길이 미만. */
  CalibrationRejectionReasonRequired = 'CALIBRATION_REJECTION_REASON_REQUIRED',
  /** 교정 인자 반려 사유가 최소 길이 미만. */
  CalibrationFactorRejectionReasonRequired = 'CALIBRATION_FACTOR_REJECTION_REASON_REQUIRED',
  /** 시험용 소프트웨어 유효성 확인 반려 사유가 최소 길이 미만. */
  SoftwareValidationRejectionReasonRequired = 'SOFTWARE_VALIDATION_REJECTION_REASON_REQUIRED',
  /** 중간 점검 반려 사유가 최소 길이 미만. */
  IntermediateInspectionRejectionReasonRequired = 'INTERMEDIATE_INSPECTION_REJECTION_REASON_REQUIRED',
  /** 자체 점검 반려 사유가 최소 길이 미만. */
  SelfInspectionRejectionReasonRequired = 'SELF_INSPECTION_REJECTION_REASON_REQUIRED',
  /** 부적합 시정 반려 사유가 최소 길이 미만. */
  NonConformanceRejectionReasonRequired = 'NON_CONFORMANCE_REJECTION_REASON_REQUIRED',

  // ============================================================================
  // FSM 상태 전이 ErrorCode — 7 도메인 reject/transition 흐름 SSOT
  // (sprint tier-2-rejectmodal-ssot iter 2: 인접 inline 코드 시스템 전반 격상)
  // ============================================================================
  /** equipment-imports: pending 상태만 반려 가능 (CAS precondition). */
  EquipmentImportOnlyPendingCanReject = 'IMPORT_ONLY_PENDING_CAN_REJECT',
  /** calibration: pending_approval 상태만 반려 가능. */
  CalibrationOnlyPendingCanReject = 'CALIBRATION_ONLY_PENDING_CAN_REJECT',
  /** calibration-factors: pending 상태만 반려 가능. */
  CalibrationFactorOnlyPendingCanReject = 'CALIBRATION_FACTOR_ONLY_PENDING_CAN_REJECT',
  /** software-validations: 상태 전이 불가 (submitted/approved → rejected 외). */
  SoftwareValidationInvalidStatusTransition = 'SOFTWARE_VALIDATION_INVALID_STATUS_TRANSITION',
  /** intermediate-inspections: 상태 전이 불가. */
  IntermediateInspectionInvalidStatusTransition = 'INTERMEDIATE_INSPECTION_INVALID_STATUS_TRANSITION',
  /** self-inspections: 상태 전이 불가. */
  SelfInspectionInvalidStatusTransition = 'SELF_INSPECTION_INVALID_STATUS_TRANSITION',
  /** non-conformances: NC 상태 전이 불가 (validateTransition 헬퍼). */
  NonConformanceInvalidTransition = 'NC_INVALID_TRANSITION',

  // ============================================================================
  // FSM 상태 전이 ErrorCode — 비-reject 흐름 (tier-2-fsm-invalid-status-transition)
  // 7 도메인 service의 inline INVALID_STATUS_TRANSITION + 도메인 FSM literal 격상
  // ============================================================================

  // ── intermediate-inspections (비-reject 흐름 7건) ──────────────────────────
  /** 초안(draft)만 수정 가능. */
  IntermediateInspectionOnlyDraftCanUpdate = 'INTERMEDIATE_INSPECTION_ONLY_DRAFT_CAN_UPDATE',
  /** 초안(draft)만 제출 가능. */
  IntermediateInspectionOnlyDraftCanSubmit = 'INTERMEDIATE_INSPECTION_ONLY_DRAFT_CAN_SUBMIT',
  /** 제출(submitted)만 검토 가능. */
  IntermediateInspectionOnlySubmittedCanReview = 'INTERMEDIATE_INSPECTION_ONLY_SUBMITTED_CAN_REVIEW',
  /** 검토(reviewed)만 승인 가능. */
  IntermediateInspectionOnlyReviewedCanApprove = 'INTERMEDIATE_INSPECTION_ONLY_REVIEWED_CAN_APPROVE',
  /** 제출(submitted)만 제출 취소 가능. */
  IntermediateInspectionOnlySubmittedCanWithdraw = 'INTERMEDIATE_INSPECTION_ONLY_SUBMITTED_CAN_WITHDRAW',
  /** 반려(rejected)만 재제출 가능. */
  IntermediateInspectionOnlyRejectedCanResubmit = 'INTERMEDIATE_INSPECTION_ONLY_REJECTED_CAN_RESUBMIT',
  /** 제출자 본인만 제출 취소 가능. */
  IntermediateInspectionWithdrawNotSubmitter = 'INTERMEDIATE_INSPECTION_WITHDRAW_NOT_SUBMITTER',

  // ── self-inspections (비-reject 흐름 6건) ──────────────────────────────────
  /** 초안(draft)만 수정 가능. */
  SelfInspectionOnlyDraftCanUpdate = 'SELF_INSPECTION_ONLY_DRAFT_CAN_UPDATE',
  /** 초안(draft)만 제출 가능. */
  SelfInspectionOnlyDraftCanSubmit = 'SELF_INSPECTION_ONLY_DRAFT_CAN_SUBMIT',
  /** 제출(submitted)만 제출 취소 가능. */
  SelfInspectionOnlySubmittedCanWithdraw = 'SELF_INSPECTION_ONLY_SUBMITTED_CAN_WITHDRAW',
  /** 제출자 본인만 제출 취소 가능. */
  SelfInspectionWithdrawNotSubmitter = 'SELF_INSPECTION_WITHDRAW_NOT_SUBMITTER',
  /** 제출(submitted)만 승인 가능. */
  SelfInspectionOnlySubmittedCanApprove = 'SELF_INSPECTION_ONLY_SUBMITTED_CAN_APPROVE',
  /** 반려(rejected)만 재제출 가능. */
  SelfInspectionOnlyRejectedCanResubmit = 'SELF_INSPECTION_ONLY_REJECTED_CAN_RESUBMIT',

  // ── software-validations (비-reject 흐름 5건) ──────────────────────────────
  /** 초안(draft)만 수정 가능. */
  SoftwareValidationOnlyDraftCanUpdate = 'SOFTWARE_VALIDATION_ONLY_DRAFT_CAN_UPDATE',
  /** 초안(draft)만 제출 가능. */
  SoftwareValidationOnlyDraftCanSubmit = 'SOFTWARE_VALIDATION_ONLY_DRAFT_CAN_SUBMIT',
  /** 제출(submitted)만 기술 승인 가능. */
  SoftwareValidationOnlySubmittedCanApprove = 'SOFTWARE_VALIDATION_ONLY_SUBMITTED_CAN_APPROVE',
  /** 기술승인(approved)만 품질 승인 가능. */
  SoftwareValidationOnlyApprovedCanQualityApprove = 'SOFTWARE_VALIDATION_ONLY_APPROVED_CAN_QUALITY_APPROVE',
  /** 반려(rejected)만 재수정 가능. */
  SoftwareValidationOnlyRejectedCanRevise = 'SOFTWARE_VALIDATION_ONLY_REJECTED_CAN_REVISE',

  // ── calibration (비-reject 흐름 4코드 — 6건 커버) ─────────────────────────
  /** 교정 기록을 찾을 수 없음 (NotFoundException). */
  CalibrationNotFound = 'CALIBRATION_NOT_FOUND',
  /** 예약(scheduled) 또는 진행 중(in_progress)만 완료 처리 가능. */
  CalibrationInvalidStatusForComplete = 'CALIBRATION_INVALID_STATUS_FOR_COMPLETE',
  /** pending_approval 상태만 승인 가능. */
  CalibrationOnlyPendingCanApprove = 'CALIBRATION_ONLY_PENDING_CAN_APPROVE',
  /** 중간점검 일정이 없는 교정 기록. */
  CalibrationNoIntermediateCheck = 'CALIBRATION_NO_INTERMEDIATE_CHECK',

  // ── calibration-factors (비-reject 흐름 2건) ──────────────────────────────
  /** 교정 인자를 찾을 수 없음 (NotFoundException). */
  CalibrationFactorNotFound = 'CALIBRATION_FACTOR_NOT_FOUND',
  /** pending 상태만 승인 가능. */
  CalibrationFactorOnlyPendingCanApprove = 'CALIBRATION_FACTOR_ONLY_PENDING_CAN_APPROVE',

  // ── equipment-imports (FSM + business 9건) ────────────────────────────────
  /** 반입 종료일이 시작일보다 이전. */
  EquipmentImportEndDateBeforeStart = 'IMPORT_END_DATE_BEFORE_START',
  /** 장비 반입 기록 조회 실패 (findOne — NotFoundException). */
  EquipmentImportNotFound = 'IMPORT_NOT_FOUND',
  /** pending 상태만 승인 가능 (CAS precondition errorCode). */
  EquipmentImportOnlyPendingCanApprove = 'IMPORT_ONLY_PENDING_CAN_APPROVE',
  /** approved 상태만 수령 가능. */
  EquipmentImportOnlyApprovedCanReceive = 'IMPORT_ONLY_APPROVED_CAN_RECEIVE',
  /** 연결된 장비 없음. */
  EquipmentImportNoLinkedEquipment = 'IMPORT_NO_LINKED_EQUIPMENT',
  /** received 상태만 반납 시작 가능 (CAS precondition errorCode). */
  EquipmentImportOnlyReceivedCanReturn = 'IMPORT_ONLY_RECEIVED_CAN_RETURN',
  /** pending 또는 approved 상태만 취소 가능. */
  EquipmentImportOnlyPendingOrApprovedCanCancel = 'IMPORT_ONLY_PENDING_OR_APPROVED_CAN_CANCEL',
  /** 반입 요청자 본인만 취소 가능. */
  EquipmentImportOnlyRequesterCanCancel = 'IMPORT_ONLY_REQUESTER_CAN_CANCEL',
  /** 장비 반입 기록 조회 실패 (getImportDetail — NotFoundException). */
  EquipmentImportDetailNotFound = 'EQUIPMENT_IMPORT_NOT_FOUND',

  // ── non-conformances FSM (비-reject 흐름 2건) ─────────────────────────────
  /** 종료된 부적합 기록은 수정 불가. */
  NcClosedCannotUpdate = 'NC_CLOSED_CANNOT_UPDATE',
  /** 종료된 부적합에는 수리 이력 연결 불가. */
  NcClosedCannotLinkRepair = 'NC_CLOSED_CANNOT_LINK_REPAIR',

  // ============================================================================
  // 장비 서비스 도메인 에러 (equipment.service.ts)
  // ============================================================================
  /** 교정 기한 날짜 형식 오류 (calibrationDue). */
  EquipmentInvalidCalibrationDue = 'EQUIPMENT_INVALID_CALIBRATION_DUE',
  /** 교정 기한 이후 날짜가 기한보다 이전 (calibrationDueAfter < calibrationDue). */
  EquipmentInvalidCalibrationDueAfter = 'EQUIPMENT_INVALID_CALIBRATION_DUE_AFTER',
  /** 담당자 UUID가 존재하지 않음. */
  EquipmentManagerNotFound = 'EQUIPMENT_MANAGER_NOT_FOUND',
  /** 담당자 역할이 manager 이상이어야 함. */
  EquipmentManagerRoleInsufficient = 'EQUIPMENT_MANAGER_ROLE_INSUFFICIENT',
  /** 담당자와 장비 사이트가 다름. */
  EquipmentManagerSiteMismatch = 'EQUIPMENT_MANAGER_SITE_MISMATCH',
  /** 장비 관리번호 중복 (사이트 내). */
  EquipmentManagementNumberDuplicate = 'EQUIPMENT_MANAGEMENT_NUMBER_DUPLICATE',
  /** site 정보 없이 장비 생성 불가. */
  EquipmentSiteRequired = 'EQUIPMENT_SITE_REQUIRED',
  /** 교정 기한 초과 상태로 인한 작업 차단. */
  EquipmentCalibrationOverdueStatusBlock = 'EQUIPMENT_CALIBRATION_OVERDUE_STATUS_BLOCK',

  // ============================================================================
  // 장비 승인 서비스 에러 (equipment-approval.service.ts)
  // ============================================================================
  /** 장비 승인 요청 생성 실패 (internal). */
  EquipmentRequestCreateFailed = 'EQUIPMENT_REQUEST_CREATE_FAILED',
  /** 장비 승인 요청 수정 실패 (internal). */
  EquipmentRequestUpdateFailed = 'EQUIPMENT_REQUEST_UPDATE_FAILED',
  /** 장비 승인 요청 삭제 실패 (internal). */
  EquipmentRequestDeleteFailed = 'EQUIPMENT_REQUEST_DELETE_FAILED',
  /** 장비 승인 요청 조회 권한 없음. */
  EquipmentRequestNoViewPermission = 'EQUIPMENT_REQUEST_NO_VIEW_PERMISSION',
  /** 장비 승인 요청 목록 조회 실패 (internal). */
  EquipmentRequestListFailed = 'EQUIPMENT_REQUEST_LIST_FAILED',
  /** 장비 UUID 없이 요청 불가. */
  EquipmentRequestNoEquipmentId = 'EQUIPMENT_REQUEST_NO_EQUIPMENT_ID',
  /** 장비 승인 요청을 찾을 수 없음. */
  EquipmentRequestNotFound = 'EQUIPMENT_REQUEST_NOT_FOUND',
  /** 장비 승인 요청 조회 실패 (internal). */
  EquipmentRequestFetchFailed = 'EQUIPMENT_REQUEST_FETCH_FAILED',
  /** 승인 권한 없음. */
  EquipmentRequestNoApprovePermission = 'EQUIPMENT_REQUEST_NO_APPROVE_PERMISSION',
  /** 이미 처리된 요청 재처리 불가. */
  EquipmentRequestAlreadyProcessed = 'EQUIPMENT_REQUEST_ALREADY_PROCESSED',
  /** 본인 요청 셀프 승인 금지. */
  EquipmentRequestSelfApprovalForbidden = 'EQUIPMENT_REQUEST_SELF_APPROVAL_FORBIDDEN',
  /** 팀 스코프 위반 (다른 팀 요청 처리 불가). */
  EquipmentRequestTeamScopeViolation = 'EQUIPMENT_REQUEST_TEAM_SCOPE_VIOLATION',
  /** 장비 승인 처리 실패 (internal). */
  EquipmentRequestApproveFailed = 'EQUIPMENT_REQUEST_APPROVE_FAILED',
  /** 반려 권한 없음. */
  EquipmentRequestNoRejectPermission = 'EQUIPMENT_REQUEST_NO_REJECT_PERMISSION',
  /** 반려 사유 필수. */
  EquipmentRequestRejectionReasonRequired = 'EQUIPMENT_REQUEST_REJECTION_REASON_REQUIRED',
  /** 본인 요청 셀프 반려 금지. */
  EquipmentRequestSelfRejectionForbidden = 'EQUIPMENT_REQUEST_SELF_REJECTION_FORBIDDEN',
  /** 장비 반려 처리 실패 (internal). */
  EquipmentRequestRejectFailed = 'EQUIPMENT_REQUEST_REJECT_FAILED',

  // ============================================================================
  // 이력/첨부/수리 도메인 에러
  // ============================================================================
  /** 장비 이력을 찾을 수 없음. */
  HistoryNotFound = 'HISTORY_NOT_FOUND',
  /** 부적합 사고 유형이 유효하지 않음. */
  NcInvalidIncidentType = 'NC_INVALID_INCIDENT_TYPE',
  /** 수리 이력을 찾을 수 없음. */
  RepairHistoryNotFound = 'REPAIR_HISTORY_NOT_FOUND',
  /** 첨부 파일을 찾을 수 없음. */
  AttachmentNotFound = 'ATTACHMENT_NOT_FOUND',
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
  [ErrorCode.EquipmentNotFound]: 404,
  [ErrorCode.EquipmentSiteScopeOnly]: 403,
  [ErrorCode.EquipmentTeamScopeOnly]: 403,
  [ErrorCode.EquipmentManagementNumberRequired]: 400,
  [ErrorCode.EquipmentSharedCannotUpdate]: 403,
  [ErrorCode.EquipmentSharedCannotDelete]: 403,
  [ErrorCode.EquipmentFileRequired]: 400,
  [ErrorCode.EquipmentAttachmentTypeRequired]: 400,
  [ErrorCode.EquipmentFormDataParseFailed]: 400,
  [ErrorCode.EquipmentInvalidManagementNumber]: 400,
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

  // Reject 사유 길이 fail-close (7 도메인)
  [ErrorCode.EquipmentImportRejectionReasonRequired]: 400,
  [ErrorCode.CalibrationRejectionReasonRequired]: 400,
  [ErrorCode.CalibrationFactorRejectionReasonRequired]: 400,
  [ErrorCode.SoftwareValidationRejectionReasonRequired]: 400,
  [ErrorCode.IntermediateInspectionRejectionReasonRequired]: 400,
  [ErrorCode.SelfInspectionRejectionReasonRequired]: 400,
  [ErrorCode.NonConformanceRejectionReasonRequired]: 400,

  // FSM 상태 전이 ErrorCode (iter 2: 7 도메인 시스템 전반 격상)
  [ErrorCode.EquipmentImportOnlyPendingCanReject]: 400,
  [ErrorCode.CalibrationOnlyPendingCanReject]: 400,
  [ErrorCode.CalibrationFactorOnlyPendingCanReject]: 400,
  [ErrorCode.SoftwareValidationInvalidStatusTransition]: 400,
  [ErrorCode.IntermediateInspectionInvalidStatusTransition]: 400,
  [ErrorCode.SelfInspectionInvalidStatusTransition]: 400,
  [ErrorCode.NonConformanceInvalidTransition]: 400,

  // FSM 상태 전이 ErrorCode — 비-reject 흐름 (tier-2-fsm-invalid-status-transition)
  // intermediate-inspections
  [ErrorCode.IntermediateInspectionOnlyDraftCanUpdate]: 400,
  [ErrorCode.IntermediateInspectionOnlyDraftCanSubmit]: 400,
  [ErrorCode.IntermediateInspectionOnlySubmittedCanReview]: 400,
  [ErrorCode.IntermediateInspectionOnlyReviewedCanApprove]: 400,
  [ErrorCode.IntermediateInspectionOnlySubmittedCanWithdraw]: 400,
  [ErrorCode.IntermediateInspectionOnlyRejectedCanResubmit]: 400,
  [ErrorCode.IntermediateInspectionWithdrawNotSubmitter]: 403,
  // self-inspections
  [ErrorCode.SelfInspectionOnlyDraftCanUpdate]: 400,
  [ErrorCode.SelfInspectionOnlyDraftCanSubmit]: 400,
  [ErrorCode.SelfInspectionOnlySubmittedCanWithdraw]: 400,
  [ErrorCode.SelfInspectionWithdrawNotSubmitter]: 403,
  [ErrorCode.SelfInspectionOnlySubmittedCanApprove]: 400,
  [ErrorCode.SelfInspectionOnlyRejectedCanResubmit]: 400,
  // software-validations
  [ErrorCode.SoftwareValidationOnlyDraftCanUpdate]: 400,
  [ErrorCode.SoftwareValidationOnlyDraftCanSubmit]: 400,
  [ErrorCode.SoftwareValidationOnlySubmittedCanApprove]: 400,
  [ErrorCode.SoftwareValidationOnlyApprovedCanQualityApprove]: 400,
  [ErrorCode.SoftwareValidationOnlyRejectedCanRevise]: 400,
  // calibration
  [ErrorCode.CalibrationNotFound]: 404,
  [ErrorCode.CalibrationInvalidStatusForComplete]: 400,
  [ErrorCode.CalibrationOnlyPendingCanApprove]: 400,
  [ErrorCode.CalibrationNoIntermediateCheck]: 400,
  // calibration-factors
  [ErrorCode.CalibrationFactorNotFound]: 404,
  [ErrorCode.CalibrationFactorOnlyPendingCanApprove]: 400,
  // equipment-imports
  [ErrorCode.EquipmentImportEndDateBeforeStart]: 400,
  [ErrorCode.EquipmentImportNotFound]: 404,
  [ErrorCode.EquipmentImportOnlyPendingCanApprove]: 400,
  [ErrorCode.EquipmentImportOnlyApprovedCanReceive]: 400,
  [ErrorCode.EquipmentImportNoLinkedEquipment]: 400,
  [ErrorCode.EquipmentImportOnlyReceivedCanReturn]: 400,
  [ErrorCode.EquipmentImportOnlyPendingOrApprovedCanCancel]: 400,
  [ErrorCode.EquipmentImportOnlyRequesterCanCancel]: 403,
  [ErrorCode.EquipmentImportDetailNotFound]: 404,
  // non-conformances FSM
  [ErrorCode.NcClosedCannotUpdate]: 400,
  [ErrorCode.NcClosedCannotLinkRepair]: 400,

  // 장비 서비스 도메인 에러
  [ErrorCode.EquipmentInvalidCalibrationDue]: 400,
  [ErrorCode.EquipmentInvalidCalibrationDueAfter]: 400,
  [ErrorCode.EquipmentManagerNotFound]: 400,
  [ErrorCode.EquipmentManagerRoleInsufficient]: 400,
  [ErrorCode.EquipmentManagerSiteMismatch]: 400,
  [ErrorCode.EquipmentManagementNumberDuplicate]: 409,
  [ErrorCode.EquipmentSiteRequired]: 400,
  [ErrorCode.EquipmentCalibrationOverdueStatusBlock]: 400,

  // 장비 승인 서비스 에러
  [ErrorCode.EquipmentRequestCreateFailed]: 500,
  [ErrorCode.EquipmentRequestUpdateFailed]: 500,
  [ErrorCode.EquipmentRequestDeleteFailed]: 500,
  [ErrorCode.EquipmentRequestNoViewPermission]: 403,
  [ErrorCode.EquipmentRequestListFailed]: 500,
  [ErrorCode.EquipmentRequestNoEquipmentId]: 400,
  [ErrorCode.EquipmentRequestNotFound]: 404,
  [ErrorCode.EquipmentRequestFetchFailed]: 500,
  [ErrorCode.EquipmentRequestNoApprovePermission]: 403,
  [ErrorCode.EquipmentRequestAlreadyProcessed]: 409,
  [ErrorCode.EquipmentRequestSelfApprovalForbidden]: 403,
  [ErrorCode.EquipmentRequestTeamScopeViolation]: 403,
  [ErrorCode.EquipmentRequestApproveFailed]: 500,
  [ErrorCode.EquipmentRequestNoRejectPermission]: 403,
  [ErrorCode.EquipmentRequestRejectionReasonRequired]: 400,
  [ErrorCode.EquipmentRequestSelfRejectionForbidden]: 403,
  [ErrorCode.EquipmentRequestRejectFailed]: 500,

  // 이력/첨부/수리 도메인 에러
  [ErrorCode.HistoryNotFound]: 404,
  [ErrorCode.NcInvalidIncidentType]: 400,
  [ErrorCode.RepairHistoryNotFound]: 404,
  [ErrorCode.AttachmentNotFound]: 404,
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
