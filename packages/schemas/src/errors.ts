import { z } from 'zod';
import {
  BackendValidationIssueSchema,
  serializeZodIssue,
  type BackendValidationIssue,
} from './validation/zod-issue';

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
  // 승인 철회 (Revoke Approval)
  // ============================================================================
  /** 승인 후 5분 경과 — 철회 가능 시간 초과. */
  RevocationWindowExpired = 'REVOCATION_WINDOW_EXPIRED',
  /** 철회 사유 미입력 또는 최소 길이 미달. */
  RevocationReasonRequired = 'REVOCATION_REASON_REQUIRED',

  // ============================================================================
  // 승인 위임 (Approval Delegation)
  // ============================================================================
  /** 자기 자신에게 승인을 위임할 수 없음 (delegatorId === delegateeId). */
  ApprovalDelegationSelfDelegationForbidden = 'APPROVAL_DELEGATION_SELF_DELEGATION_FORBIDDEN',
  /** 위임 시작일이 종료일 이후 또는 같음 (startsAt >= endsAt). */
  ApprovalDelegationInvalidPeriod = 'APPROVAL_DELEGATION_INVALID_PERIOD',

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

  // ============================================================================
  // 도메인 NOT_FOUND — updateWithVersion notFoundCode SSOT
  // (versioned-base.service.ts 호출자가 ErrorCode enum 값으로 참조)
  // ============================================================================
  /** 케이블 기록을 찾을 수 없음. */
  CableNotFound = 'CABLE_NOT_FOUND',
  /** 부적합(NC) 기록을 찾을 수 없음. */
  NonConformanceNotFound = 'NC_NOT_FOUND',
  /** 시험용 소프트웨어 유효성 확인 기록을 찾을 수 없음. */
  SoftwareValidationNotFound = 'SOFTWARE_VALIDATION_NOT_FOUND',
  /** 시험용 소프트웨어를 찾을 수 없음. */
  TestSoftwareNotFound = 'TEST_SOFTWARE_NOT_FOUND',
  /** 중간 점검 기록을 찾을 수 없음. */
  IntermediateInspectionNotFound = 'INTERMEDIATE_INSPECTION_NOT_FOUND',
  /** 자체 점검 기록을 찾을 수 없음. */
  SelfInspectionNotFound = 'SELF_INSPECTION_NOT_FOUND',
  /** 점검 계획을 찾을 수 없음. */
  TestPlanNotFound = 'TEST_PLAN_NOT_FOUND',
  /** 점검 항목을 찾을 수 없음. */
  InspectionItemNotFound = 'INSPECTION_ITEM_NOT_FOUND',
  /** 점검 양식 템플릿을 찾을 수 없음. */
  InspectionTemplateNotFound = 'INSPECTION_TEMPLATE_NOT_FOUND',
  /** 결과 섹션을 찾을 수 없음. */
  ResultSectionNotFound = 'RESULT_SECTION_NOT_FOUND',

  // ============================================================================
  // 반출(Checkout) 도메인 NOT_FOUND
  // ============================================================================
  /** 반출 기록을 찾을 수 없음. */
  CheckoutNotFound = 'CHECKOUT_NOT_FOUND',

  // ============================================================================
  // 알림(Notification) 도메인 NOT_FOUND
  // ============================================================================
  /** 알림을 찾을 수 없음. */
  NotificationNotFound = 'NOTIFICATION_NOT_FOUND',

  // ============================================================================
  // 팀(Team) 도메인 NOT_FOUND
  // ============================================================================
  /** 팀을 찾을 수 없음. */
  TeamNotFound = 'TEAM_NOT_FOUND',
  /** 팀 리더를 찾을 수 없음. */
  LeaderNotFound = 'LEADER_NOT_FOUND',

  // ============================================================================
  // 사용자(User) 도메인 NOT_FOUND
  // ============================================================================
  /** 요청자(requester) 사용자를 찾을 수 없음. */
  UserRequesterNotFound = 'USER_REQUESTER_NOT_FOUND',
  /** 대상(target) 사용자를 찾을 수 없음. */
  UserTargetNotFound = 'USER_TARGET_NOT_FOUND',

  // ============================================================================
  // 인증(Auth) 도메인 NOT_FOUND
  // ============================================================================
  /** 인증 과정에서 사용자를 찾을 수 없음. */
  AuthUserNotFound = 'AUTH_USER_NOT_FOUND',

  // ============================================================================
  // 파일·문서 도메인 NOT_FOUND
  // ============================================================================
  /** 문서를 찾을 수 없음. */
  DocumentNotFound = 'DOCUMENT_NOT_FOUND',
  /** 파일을 찾을 수 없음. */
  FileNotFound = 'FILE_NOT_FOUND',

  // ============================================================================
  // 케이블(Cable) 도메인 추가 NOT_FOUND
  // ============================================================================
  /** 케이블 손실 측정 기록을 찾을 수 없음. */
  CableLossMeasurementNotFound = 'CABLE_LOSS_MEASUREMENT_NOT_FOUND',

  // ============================================================================
  // 시험용 소프트웨어(Test Software) 도메인 추가 NOT_FOUND
  // ============================================================================
  /** 장비 연결(P-number 링크)을 찾을 수 없음. */
  EquipmentLinkNotFound = 'EQUIPMENT_LINK_NOT_FOUND',

  // ============================================================================
  // 인증(Auth) 도메인 — SSE·JWT·권한 에러
  // ============================================================================
  /** SSE 연결에 토큰이 필요함. */
  AuthSseTokenRequired = 'AUTH_SSE_TOKEN_REQUIRED',
  /** 리프레시 토큰으로 SSE 접근 불가 — 액세스 토큰 전용 엔드포인트. */
  AuthAccessTokenOnly = 'AUTH_ACCESS_TOKEN_ONLY',
  /** 블랙리스트에 등록된 토큰. */
  AuthTokenBlacklisted = 'AUTH_TOKEN_BLACKLISTED',
  /** 유효하지 않은 토큰 (서명 오류·형식 불량). */
  AuthInvalidToken = 'AUTH_INVALID_TOKEN',
  /** JWT 페이로드에 userId 클레임 누락. */
  AuthUserIdMissing = 'AUTH_USER_ID_MISSING',
  /** 유효하지 않은 세션 (userId 추출 실패). */
  AuthInvalidSession = 'AUTH_INVALID_SESSION',
  /** 운영 환경에서는 Azure AD 로그인만 허용. */
  AuthProductionAzureOnly = 'AUTH_PRODUCTION_AZURE_ONLY',
  /** 계정이 잠김 (로그인 실패 횟수 초과). */
  AuthAccountLocked = 'AUTH_ACCOUNT_LOCKED',
  /** 자격증명(이메일/비밀번호) 불일치 — 인증 흐름 전용. */
  AuthInvalidCredentials = 'AUTH_INVALID_CREDENTIALS',
  /** Azure AD 인증 실패. */
  AuthAzureAdFailed = 'AUTH_AZURE_AD_FAILED',
  /** 리프레시 토큰이 유효하지 않음. */
  AuthInvalidRefreshToken = 'AUTH_INVALID_REFRESH_TOKEN',
  /** 리프레시 토큰 만료 — 재로그인 필요. */
  AuthSessionExpired = 'AUTH_SESSION_EXPIRED',
  /** 리프레시 과정에서 사용자를 찾을 수 없음. */
  AuthRefreshNoUser = 'AUTH_REFRESH_NO_USER',
  /** 리프레시 토큰 절대만료(30일) 초과. */
  AuthRefreshExpired = 'AUTH_REFRESH_EXPIRED',
  /** @SkipPermissions 없는 핸들러에 RequiredPermissions 메타데이터 미설정. */
  AuthPermissionsNotConfigured = 'AUTH_PERMISSIONS_NOT_CONFIGURED',
  /** 인증되지 않은 요청 — 로그인 필요. */
  AuthRequired = 'AUTH_REQUIRED',
  /** 권한 부족 — 허용된 역할/퍼미션 없음. */
  AuthInsufficientPermissions = 'AUTH_INSUFFICIENT_PERMISSIONS',
  /** 비활성화된 사용자 계정. */
  AuthUserInactive = 'AUTH_USER_INACTIVE',
  /** 요청 헤더/컨텍스트에서 사용자 정보 추출 실패. */
  AuthUserInfoMissing = 'AUTH_USER_INFO_MISSING',

  // ============================================================================
  // 스코프/접근 범위 — 상세 사유
  // ============================================================================
  /** 스코프 범위 외 리소스 접근 거부 (ScopeAccessDenied의 세부 케이스). */
  ScopeDenied = 'SCOPE_DENIED',
  /** 팀 간 접근 거부 (cross-team). */
  ScopeCrossTeamDenied = 'CROSS_TEAM_DENIED',
  /** 사이트 간 접근 거부 (cross-site). */
  ScopeCrossSiteDenied = 'CROSS_SITE_DENIED',
  /** 스코프 SQL 필터를 적용할 수 없는 상태. */
  ScopeFilterUnavailable = 'SCOPE_FILTER_UNAVAILABLE',

  // ============================================================================
  // 문서·파일 도메인 — 추가 에러
  // ============================================================================
  /** 문서가 이미지 형식이 아님. */
  DocumentNotImage = 'DOCUMENT_NOT_IMAGE',
  /** 문서가 초안(draft) 상태가 아님 — 유효성 검증 실패. */
  DocumentValidationNotDraft = 'VALIDATION_NOT_DRAFT',
  /** 문서 소유자 정보가 필요함. */
  DocumentOwnerRequired = 'DOCUMENT_OWNER_REQUIRED',
  /** 문서 파일 첨부 필수. */
  DocumentFileRequired = 'DOCUMENT_FILE_REQUIRED',
  /** 문서 타입이 유효하지 않음 (document.service 공통). */
  DocumentTypeInvalid = 'DOCUMENT_TYPE_INVALID',
  /** 문서 타입별 개수 불일치. */
  DocumentTypeCountMismatch = 'DOCUMENT_TYPE_COUNT_MISMATCH',
  /** 문서 소유자 불일치 — 다른 도메인 문서 사용 시도. */
  DocumentOwnerMismatch = 'DOCUMENT_OWNER_MISMATCH',
  /** UUID 형식 오류. */
  InvalidUuid = 'INVALID_UUID',
  /** 지원하지 않는 문서 타입 (documents.controller 라우터). */
  InvalidDocumentType = 'INVALID_DOCUMENT_TYPE',
  /** NC 첨부파일은 전용 엔드포인트 사용 필요. */
  NcAttachmentWrongEndpoint = 'NC_ATTACHMENT_WRONG_ENDPOINT',

  // ============================================================================
  // 교정(Calibration) 도메인 — 추가 에러
  // ============================================================================
  /** 교정 파일 첨부 필수. */
  CalibrationFileRequired = 'CALIBRATION_FILE_REQUIRED',
  /** 교정 인증서 첨부 필수. */
  CalibrationCertificateRequired = 'CALIBRATION_CERTIFICATE_REQUIRED',
  /** 교정 파일 개수 제한 초과. */
  CalibrationFileLimitExceeded = 'CALIBRATION_FILE_LIMIT_EXCEEDED',
  /** 같은 날짜 교정 이력 중복. */
  CalibrationDuplicateSameDay = 'CALIBRATION_DUPLICATE_SAME_DAY',
  /** 교정 트랜잭션 실패. */
  CalibrationTxFailed = 'CALIBRATION_TX_FAILED',
  /** 교정 요청 payload 파싱 실패. */
  CalibrationPayloadInvalid = 'CALIBRATION_PAYLOAD_INVALID',
  /** 폐기된 엔드포인트 — 신규 엔드포인트 사용 필요. */
  EndpointDeprecated = 'ENDPOINT_DEPRECATED',

  // 교정성적서 PDF 추출 (Phase A — HCT 양식 자동 메타 추출)
  /** 지원하지 않는 양식 — HCT 마커 미발견 (`주식회사 에이치시티` / `Certificate of Calibration`). */
  CalibrationCertificateFormatUnsupported = 'CALIBRATION_CERTIFICATE_FORMAT_UNSUPPORTED',
  /** pdftotext 실행 실패 — binary 미설치 / timeout(15s) / PDF 손상 / magic byte 불일치. */
  CalibrationCertificateExtractionFailed = 'CALIBRATION_CERTIFICATE_EXTRACTION_FAILED',
  /** 표지 텍스트는 추출됐으나 필수 필드 누락 (`details.field`로 어떤 필드인지 식별). */
  CalibrationCertificateFieldMissing = 'CALIBRATION_CERTIFICATE_FIELD_MISSING',

  // ============================================================================
  // 반출(Checkout) 도메인 — 추가 에러
  // ============================================================================
  /** 반출 ID 누락 (export 흐름). */
  CheckoutMissingId = 'MISSING_CHECKOUT_ID',

  // ============================================================================
  // 반입(EquipmentImport/RentalImport) 도메인 — 추가 에러
  // ============================================================================
  /** 반입 ID 누락 (export 흐름). */
  ImportMissingId = 'MISSING_IMPORT_ID',
  /** 지원하지 않는 source type. */
  ImportInvalidSourceType = 'INVALID_SOURCE_TYPE',
  /** CAS version 필드 누락 — 낙관적 잠금 필수. */
  EquipmentImportVersionRequired = 'VERSION_REQUIRED',

  // ============================================================================
  // 점검 양식 템플릿(InspectionFormTemplate) 도메인 — 추가 에러
  // ============================================================================
  /** 점검 유형이 유효하지 않음. */
  InvalidInspectionType = 'INVALID_INSPECTION_TYPE',
  /** 템플릿 기반 버전이 최신이 아님 (stale base). */
  InspectionTemplateStaleBase = 'INSPECTION_TEMPLATE_STALE_BASE',
  /** 템플릿 버전 형식 오류. */
  InspectionTemplateInvalidVersion = 'INSPECTION_TEMPLATE_INVALID_VERSION',
  /** 템플릿 버전 충돌 (동시 수정). */
  InspectionTemplateVersionConflict = 'INSPECTION_TEMPLATE_VERSION_CONFLICT',

  // ============================================================================
  // 중간점검·자체점검(Inspection) 도메인 — 추가 에러
  // ============================================================================
  /** 중간점검이 필요하지 않은 장비. */
  IntermediateInspectionNotRequired = 'INTERMEDIATE_INSPECTION_NOT_REQUIRED',
  /** 승인 완료된 점검은 삭제 불가. */
  InspectionCannotDeleteApproved = 'CANNOT_DELETE_APPROVED',
  /** 결과 섹션 중복 등록. */
  ResultSectionDuplicate = 'RESULT_SECTION_DUPLICATE',
  /** 결과 섹션 항목 불일치. */
  ResultSectionMismatch = 'RESULT_SECTION_MISMATCH',
  /** 결과 섹션 순서 불완전. */
  ResultSectionIncompleteOrder = 'RESULT_SECTION_INCOMPLETE_ORDER',
  /** CSV 데이터 행 부족. */
  CsvTooFewRows = 'CSV_TOO_FEW_ROWS',
  /** 파일 첨부 필수 (CSV 업로드 엔드포인트). */
  FileRequired = 'FILE_REQUIRED',

  // ============================================================================
  // 부적합(NonConformance) 도메인 — 추가 에러
  // ============================================================================
  /** 부적합 유형(ncType) 필수. */
  NcTypeRequired = 'NC_TYPE_REQUIRED',
  /** 장비가 이미 부적합 상태. */
  NcEquipmentAlreadyNonConforming = 'NC_EQUIPMENT_ALREADY_NON_CONFORMING',
  /** 수리 이력 연결 필수 (종료 전제조건). */
  NcRepairRecordRequired = 'NC_REPAIR_RECORD_REQUIRED',
  /** 재교정 기록 연결 필수 (종료 전제조건). */
  NcRecalibrationRequired = 'NC_RECALIBRATION_REQUIRED',
  /** 수리 이력이 이미 연결됨. */
  NcRepairAlreadyLinked = 'NC_REPAIR_ALREADY_LINKED',

  // ============================================================================
  // 리포트·양식(Reports/FormTemplate) 도메인 — 추가 에러
  // ============================================================================
  /** 전용 엔드포인트를 사용해야 함. */
  FormUseDedicatedEndpoint = 'USE_DEDICATED_ENDPOINT',
  /** 해당 양식은 아직 구현되지 않음. */
  FormNotImplemented = 'FORM_NOT_IMPLEMENTED',
  /** 점검 ID 누락 (양식 생성 흐름). */
  FormMissingInspectionId = 'MISSING_INSPECTION_ID',
  /** 장비 ID 누락 (양식 생성 흐름). */
  FormMissingEquipmentId = 'MISSING_EQUIPMENT_ID',
  /** 양식 번호 형식 오류. */
  FormInvalidFormNumber = 'INVALID_FORM_NUMBER',
  /** 양식 렌더링 실패 (DOCX 생성 오류). */
  FormTemplateRenderFailed = 'FORM_TEMPLATE_RENDER_FAILED',

  // ============================================================================
  // 시험용 소프트웨어 유효성 확인(SoftwareValidation) — 추가 에러
  // ============================================================================
  /** 내보내기 불가 상태의 유효성 확인 기록. */
  SoftwareValidationNonExportableStatus = 'NON_EXPORTABLE_VALIDATION_STATUS',
  /** 유효성 확인 ID 누락 (export 흐름). */
  SoftwareValidationMissingId = 'MISSING_VALIDATION_ID',

  // ============================================================================
  // 팀(Team) 도메인 — 추가 에러
  // ============================================================================
  /** 팀 이름 중복. */
  TeamNameAlreadyExists = 'TEAM_NAME_ALREADY_EXISTS',
  /** 팀 리더 사이트 불일치. */
  TeamLeaderSiteMismatch = 'LEADER_SITE_MISMATCH',

  // ============================================================================
  // 시험용 소프트웨어(TestSoftware) 도메인 — 추가 에러
  // ============================================================================
  /** 장비가 이미 P-number에 연결됨. */
  TestSoftwareEquipmentAlreadyLinked = 'EQUIPMENT_ALREADY_LINKED',

  // ============================================================================
  // 사용자(User) 도메인 — 추가 에러
  // ============================================================================
  /** 이메일 중복 (users 도메인 전용). */
  UserEmailAlreadyExists = 'USER_EMAIL_ALREADY_EXISTS',
  /** 역할 변경 권한 없음. */
  UserNoRoleChangePermission = 'USER_NO_ROLE_CHANGE_PERMISSION',
  /** 자신의 역할은 변경 불가. */
  UserCannotChangeOwnRole = 'USER_CANNOT_CHANGE_OWN_ROLE',
  /** 상위 역할은 변경 불가. */
  UserCannotChangeSeniorRole = 'USER_CANNOT_CHANGE_SENIOR_ROLE',
  /** 다른 팀 사용자 역할 변경 불가 (팀 매니저 스코프). */
  UserTeamScopeOnly = 'USER_TEAM_SCOPE_ONLY',
  /** 다른 사이트 사용자 역할 변경 불가 (사이트 매니저 스코프). */
  UserSiteScopeOnly = 'USER_SITE_SCOPE_ONLY',

  // ============================================================================
  // Saved Views 도메인 — PRIVATE/TEAM/GLOBAL scope 트리아드 + CAS
  // ============================================================================
  /** Saved View 가 존재하지 않음 — id mismatch 또는 cascade 삭제 후. */
  SavedViewNotFound = 'SAVED_VIEW_NOT_FOUND',
  /** scope 별 권한 거부 — PRIVATE: 비-owner / TEAM: 다른 팀 / GLOBAL: write 시 권한 없음. */
  SavedViewScopeForbidden = 'SAVED_VIEW_SCOPE_FORBIDDEN',
  /** 사용자당 모듈별 최대(MAX_SAVED_VIEWS_PER_MODULE) 초과 — 신규 생성 차단. */
  SavedViewMaxReached = 'SAVED_VIEW_MAX_REACHED',
  /** scope=TEAM 인데 teamId 미지정 또는 본인 팀과 불일치 — 무결성 위반. */
  SavedViewTeamRequiredForScope = 'SAVED_VIEW_TEAM_REQUIRED_FOR_SCOPE',

  // ============================================================================
  // 공통 기본 에러 (versioned-base.service.ts 기본값)
  // ============================================================================
  /** 도메인 지정 에러 코드 없을 때 updateWithVersion 기본 notFoundCode */
  EntityNotFound = 'ENTITY_NOT_FOUND',
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

  // 승인 철회
  [ErrorCode.RevocationWindowExpired]: 403,
  [ErrorCode.RevocationReasonRequired]: 400,
  [ErrorCode.ApprovalDelegationSelfDelegationForbidden]: 400,
  [ErrorCode.ApprovalDelegationInvalidPeriod]: 400,

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

  // 도메인 NOT_FOUND (updateWithVersion notFoundCode SSOT)
  [ErrorCode.CableNotFound]: 404,
  [ErrorCode.NonConformanceNotFound]: 404,
  [ErrorCode.SoftwareValidationNotFound]: 404,
  [ErrorCode.TestSoftwareNotFound]: 404,
  [ErrorCode.IntermediateInspectionNotFound]: 404,
  [ErrorCode.SelfInspectionNotFound]: 404,
  [ErrorCode.TestPlanNotFound]: 404,
  [ErrorCode.InspectionItemNotFound]: 404,
  [ErrorCode.InspectionTemplateNotFound]: 404,
  [ErrorCode.ResultSectionNotFound]: 404,
  [ErrorCode.CheckoutNotFound]: 404,
  [ErrorCode.NotificationNotFound]: 404,
  [ErrorCode.TeamNotFound]: 404,
  [ErrorCode.LeaderNotFound]: 404,
  [ErrorCode.UserRequesterNotFound]: 404,
  [ErrorCode.UserTargetNotFound]: 404,
  [ErrorCode.AuthUserNotFound]: 404,
  [ErrorCode.DocumentNotFound]: 404,
  [ErrorCode.FileNotFound]: 404,
  [ErrorCode.CableLossMeasurementNotFound]: 404,
  [ErrorCode.EquipmentLinkNotFound]: 404,

  // 인증(Auth) 도메인 — SSE·JWT·권한 에러
  [ErrorCode.AuthSseTokenRequired]: 401,
  [ErrorCode.AuthAccessTokenOnly]: 401,
  [ErrorCode.AuthTokenBlacklisted]: 401,
  [ErrorCode.AuthInvalidToken]: 401,
  [ErrorCode.AuthUserIdMissing]: 401,
  [ErrorCode.AuthInvalidSession]: 401,
  [ErrorCode.AuthProductionAzureOnly]: 403,
  [ErrorCode.AuthAccountLocked]: 401,
  [ErrorCode.AuthInvalidCredentials]: 401,
  [ErrorCode.AuthAzureAdFailed]: 401,
  [ErrorCode.AuthInvalidRefreshToken]: 401,
  [ErrorCode.AuthSessionExpired]: 401,
  [ErrorCode.AuthRefreshNoUser]: 401,
  [ErrorCode.AuthRefreshExpired]: 401,
  [ErrorCode.AuthPermissionsNotConfigured]: 500,
  [ErrorCode.AuthRequired]: 401,
  [ErrorCode.AuthInsufficientPermissions]: 403,
  [ErrorCode.AuthUserInactive]: 403,
  [ErrorCode.AuthUserInfoMissing]: 401,

  // 스코프/접근 범위 — 상세 사유
  [ErrorCode.ScopeDenied]: 403,
  [ErrorCode.ScopeCrossTeamDenied]: 403,
  [ErrorCode.ScopeCrossSiteDenied]: 403,
  [ErrorCode.ScopeFilterUnavailable]: 500,

  // 문서·파일 도메인 — 추가 에러
  [ErrorCode.DocumentNotImage]: 400,
  [ErrorCode.DocumentValidationNotDraft]: 400,
  [ErrorCode.DocumentOwnerRequired]: 400,
  [ErrorCode.DocumentFileRequired]: 400,
  [ErrorCode.DocumentTypeInvalid]: 400,
  [ErrorCode.DocumentTypeCountMismatch]: 400,
  [ErrorCode.DocumentOwnerMismatch]: 400,
  [ErrorCode.InvalidUuid]: 400,
  [ErrorCode.InvalidDocumentType]: 400,
  [ErrorCode.NcAttachmentWrongEndpoint]: 400,

  // 교정(Calibration) 도메인 — 추가 에러
  [ErrorCode.CalibrationFileRequired]: 400,
  [ErrorCode.CalibrationCertificateRequired]: 400,
  [ErrorCode.CalibrationFileLimitExceeded]: 400,
  [ErrorCode.CalibrationDuplicateSameDay]: 409,
  [ErrorCode.CalibrationTxFailed]: 500,
  [ErrorCode.CalibrationPayloadInvalid]: 400,
  [ErrorCode.EndpointDeprecated]: 410,

  // 교정성적서 PDF 추출 (Phase A) — service가 BadRequestException 경로로 throw하므로
  // NestJS HTTP exception 시맨틱과 일관되게 모두 400. (UnprocessableEntity는 별도 service refactor 필요.)
  [ErrorCode.CalibrationCertificateFormatUnsupported]: 400,
  [ErrorCode.CalibrationCertificateExtractionFailed]: 400,
  [ErrorCode.CalibrationCertificateFieldMissing]: 400,

  // 반출(Checkout) 도메인 — 추가 에러
  [ErrorCode.CheckoutMissingId]: 400,

  // 반입(EquipmentImport) 도메인 — 추가 에러
  [ErrorCode.ImportMissingId]: 400,
  [ErrorCode.ImportInvalidSourceType]: 400,
  [ErrorCode.EquipmentImportVersionRequired]: 400,

  // 점검 양식 템플릿(InspectionFormTemplate) 도메인 — 추가 에러
  [ErrorCode.InvalidInspectionType]: 400,
  [ErrorCode.InspectionTemplateStaleBase]: 409,
  [ErrorCode.InspectionTemplateInvalidVersion]: 400,
  [ErrorCode.InspectionTemplateVersionConflict]: 409,

  // 중간점검·자체점검(Inspection) 도메인 — 추가 에러
  [ErrorCode.IntermediateInspectionNotRequired]: 400,
  [ErrorCode.InspectionCannotDeleteApproved]: 400,
  [ErrorCode.ResultSectionDuplicate]: 409,
  [ErrorCode.ResultSectionMismatch]: 400,
  [ErrorCode.ResultSectionIncompleteOrder]: 400,
  [ErrorCode.CsvTooFewRows]: 400,
  [ErrorCode.FileRequired]: 400,

  // 부적합(NonConformance) 도메인 — 추가 에러
  [ErrorCode.NcTypeRequired]: 400,
  [ErrorCode.NcEquipmentAlreadyNonConforming]: 409,
  [ErrorCode.NcRepairRecordRequired]: 400,
  [ErrorCode.NcRecalibrationRequired]: 400,
  [ErrorCode.NcRepairAlreadyLinked]: 409,

  // 리포트·양식(Reports/FormTemplate) 도메인 — 추가 에러
  [ErrorCode.FormUseDedicatedEndpoint]: 400,
  [ErrorCode.FormNotImplemented]: 400,
  [ErrorCode.FormMissingInspectionId]: 400,
  [ErrorCode.FormMissingEquipmentId]: 400,
  [ErrorCode.FormInvalidFormNumber]: 400,
  [ErrorCode.FormTemplateRenderFailed]: 500,

  // 시험용 소프트웨어 유효성 확인(SoftwareValidation) — 추가 에러
  [ErrorCode.SoftwareValidationNonExportableStatus]: 400,
  [ErrorCode.SoftwareValidationMissingId]: 400,

  // 팀(Team) 도메인 — 추가 에러
  [ErrorCode.TeamNameAlreadyExists]: 409,
  [ErrorCode.TeamLeaderSiteMismatch]: 400,

  // 시험용 소프트웨어(TestSoftware) 도메인 — 추가 에러
  [ErrorCode.TestSoftwareEquipmentAlreadyLinked]: 409,

  // 사용자(User) 도메인 — 추가 에러
  [ErrorCode.UserEmailAlreadyExists]: 409,
  [ErrorCode.UserNoRoleChangePermission]: 403,
  [ErrorCode.UserCannotChangeOwnRole]: 403,
  [ErrorCode.UserCannotChangeSeniorRole]: 403,
  [ErrorCode.UserTeamScopeOnly]: 403,
  [ErrorCode.UserSiteScopeOnly]: 403,

  // Saved Views 도메인
  [ErrorCode.SavedViewNotFound]: 404,
  [ErrorCode.SavedViewScopeForbidden]: 403,
  [ErrorCode.SavedViewMaxReached]: 409,
  [ErrorCode.SavedViewTeamRequiredForScope]: 400,

  // 공통 기본 에러
  [ErrorCode.EntityNotFound]: 404,
};

// 에러 응답 스키마
//
// `issues` 필드는 Zod 검증 실패(ValidationError) 응답에만 포함됨 — frontend i18n routing SSOT.
// 다른 ErrorCode 응답은 `issues` 미포함 (optional). 자세한 내용은 ADR-0008 참고.
export const ErrorResponseSchema = z.object({
  code: z.nativeEnum(ErrorCode),
  message: z.string(),
  details: z.unknown().optional(),
  issues: z.array(BackendValidationIssueSchema).optional(),
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
    const response: ErrorResponse = {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: new Date().toISOString(),
    };
    // ValidationError 의 `details.issues` 가 BackendValidationIssue[] 인 경우 top-level 로 추가 노출 — frontend mapper SSOT 정합 (ADR-0008).
    if (
      this.code === ErrorCode.ValidationError &&
      Array.isArray((this.details as { issues?: BackendValidationIssue[] })?.issues)
    ) {
      response.issues = (this.details as { issues: BackendValidationIssue[] }).issues;
    }
    return response;
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
//
// `details.issues` 는 BackendValidationIssue[] (machine-readable SSOT) — frontend mapper SSOT 정합.
// 본 helper 호출자는 AppError.toResponse() 시점에 자동으로 top-level `issues` 필드로 노출됨.
// (ADR-0008 §B-option 패턴)
export function handleZodError(error: z.ZodError): AppError {
  const issues: BackendValidationIssue[] = error.issues.map((issue) => serializeZodIssue(issue));
  return AppError.validationError('입력 데이터가 유효하지 않습니다', { issues });
}

/**
 * Calibration frontend error routing codes — shared SSOT for backend code → i18n key maps.
 *
 * These remain API-level error code strings. Frontend mappers own UX copy, but
 * the code set comes from schemas instead of local enums.
 */
export const CALIBRATION_ERROR_CODES = {
  FILE_REQUIRED: ErrorCode.CalibrationFileRequired,
  CERTIFICATE_REQUIRED: ErrorCode.CalibrationCertificateRequired,
  DOCUMENT_TYPE_COUNT_MISMATCH: ErrorCode.DocumentTypeCountMismatch,
  DOCUMENT_TYPE_INVALID: ErrorCode.DocumentTypeInvalid,
  FILE_LIMIT_EXCEEDED: ErrorCode.CalibrationFileLimitExceeded,
  DUPLICATE_SAME_DAY: ErrorCode.CalibrationDuplicateSameDay,
  TX_FAILED: ErrorCode.CalibrationTxFailed,
  NOT_FOUND: ErrorCode.CalibrationNotFound,
  ENDPOINT_DEPRECATED: ErrorCode.EndpointDeprecated,
  PLAN_ITEM_NOT_EXECUTED: ErrorCode.CalibrationPlanItemNotExecuted,
  // 교정성적서 PDF 추출 (Phase A) — frontend i18n routing 진입점
  CERTIFICATE_FORMAT_UNSUPPORTED: ErrorCode.CalibrationCertificateFormatUnsupported,
  CERTIFICATE_EXTRACTION_FAILED: ErrorCode.CalibrationCertificateExtractionFailed,
  CERTIFICATE_FIELD_MISSING: ErrorCode.CalibrationCertificateFieldMissing,
} as const;

export type CalibrationErrorCode =
  (typeof CALIBRATION_ERROR_CODES)[keyof typeof CALIBRATION_ERROR_CODES];
