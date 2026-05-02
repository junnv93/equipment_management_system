# Exec Plan: tier2-fsm-invalid-status-transition

**Date**: 2026-05-02  
**Mode**: Mode 2 (22+ files, multi-domain)  
**Slug**: `tier2-fsm-invalid-status-transition`  
**Sprint**: INVALID_STATUS_TRANSITION + 도메인 FSM inline 전멸 → ErrorCode SSOT 5-layer 격상

---

## 실측 결과 (Planner 실행 기준)

| 유형 | 건수 | 위치 |
|---|---|---|
| `code: 'INVALID_STATUS_TRANSITION'` generic | 16건 | intermediate-inspections(6), self-inspections(5), software-validations(5) |
| `code: 'NOT_SUBMITTER'` | 2건 | intermediate-inspections(1), self-inspections(1) |
| calibration 비-reject 인라인 | 6건 | calibration.service.ts — CALIBRATION_NOT_FOUND×3, CALIBRATION_INVALID_STATUS_FOR_COMPLETE, CALIBRATION_ONLY_PENDING_CAN_APPROVE, CALIBRATION_NO_INTERMEDIATE_CHECK |
| calibration-factor FSM | 2건 | CALIBRATION_FACTOR_ONLY_PENDING_CAN_APPROVE, CALIBRATION_FACTOR_NOT_FOUND |
| equipment-imports FSM+business | 9건 | IMPORT_END_DATE_BEFORE_START, IMPORT_NOT_FOUND, IMPORT_ONLY_PENDING_CAN_APPROVE(CAS), IMPORT_ONLY_APPROVED_CAN_RECEIVE, IMPORT_NO_LINKED_EQUIPMENT, IMPORT_ONLY_RECEIVED_CAN_RETURN(CAS), IMPORT_ONLY_PENDING_OR_APPROVED_CAN_CANCEL, IMPORT_ONLY_REQUESTER_CAN_CANCEL, EQUIPMENT_IMPORT_NOT_FOUND |
| NC FSM | 2건 | NC_CLOSED_CANNOT_UPDATE, NC_CLOSED_CANNOT_LINK_REPAIR |

**총 인라인 격상 대상**: 37건 → 신규 ErrorCode enum 멤버 **34개** (CALIBRATION_NOT_FOUND×3 → 1코드, EQUIPMENT_NOT_FOUND는 기존 ErrorCode.EquipmentNotFound 재사용)

---

## 5-layer Defense-in-Depth (기존 확립 패턴)

```
Layer 1: packages/schemas/src/errors.ts — ErrorCode enum + errorCodeToStatusCode Record
Layer 2: Backend Service — throw BadRequestException/NotFoundException({ code: ErrorCode.XXX })
Layer 3: GlobalExceptionFilter — ErrorCode → HTTP response (변경 없음)
Layer 4: Frontend lib/errors/<domain>-errors.ts — mapper I18N_KEYS 확장
Layer 5: messages/{ko,en}/<domain>.json — errors namespace 메시지 등재
```

---

## i18n Namespace 매핑 (도메인별)

| 도메인 | frontend i18n namespace | 파일 |
|---|---|---|
| intermediate-inspections | `calibration` | messages/{ko,en}/calibration.json |
| self-inspections | `equipment` | messages/{ko,en}/equipment.json |
| software-validations | `software` | messages/{ko,en}/software.json |
| calibration | `calibration` | messages/{ko,en}/calibration.json |
| calibration-factors | `calibration` | messages/{ko,en}/calibration.json |
| equipment-imports | `equipment` | messages/{ko,en}/equipment.json |
| non-conformances | `non-conformances` | messages/{ko,en}/non-conformances.json |

---

## Phase 1: ErrorCode enum + errorCodeToStatusCode 등재

**파일**: `packages/schemas/src/errors.ts`

신규 enum 멤버 34개 추가 (기존 FSM 섹션 하단에 새 섹션으로):

```
// ── intermediate-inspections FSM (비-reject 흐름 — 7건) ──────────────────
IntermediateInspectionOnlyDraftCanUpdate = 'INTERMEDIATE_INSPECTION_ONLY_DRAFT_CAN_UPDATE',
IntermediateInspectionOnlyDraftCanSubmit = 'INTERMEDIATE_INSPECTION_ONLY_DRAFT_CAN_SUBMIT',
IntermediateInspectionOnlySubmittedCanReview = 'INTERMEDIATE_INSPECTION_ONLY_SUBMITTED_CAN_REVIEW',
IntermediateInspectionOnlyReviewedCanApprove = 'INTERMEDIATE_INSPECTION_ONLY_REVIEWED_CAN_APPROVE',
IntermediateInspectionOnlySubmittedCanWithdraw = 'INTERMEDIATE_INSPECTION_ONLY_SUBMITTED_CAN_WITHDRAW',
IntermediateInspectionOnlyRejectedCanResubmit = 'INTERMEDIATE_INSPECTION_ONLY_REJECTED_CAN_RESUBMIT',
IntermediateInspectionWithdrawNotSubmitter = 'INTERMEDIATE_INSPECTION_WITHDRAW_NOT_SUBMITTER',

// ── self-inspections FSM (비-reject 흐름 — 6건) ─────────────────────────
SelfInspectionOnlyDraftCanUpdate = 'SELF_INSPECTION_ONLY_DRAFT_CAN_UPDATE',
SelfInspectionOnlyDraftCanSubmit = 'SELF_INSPECTION_ONLY_DRAFT_CAN_SUBMIT',
SelfInspectionOnlySubmittedCanWithdraw = 'SELF_INSPECTION_ONLY_SUBMITTED_CAN_WITHDRAW',
SelfInspectionWithdrawNotSubmitter = 'SELF_INSPECTION_WITHDRAW_NOT_SUBMITTER',
SelfInspectionOnlySubmittedCanApprove = 'SELF_INSPECTION_ONLY_SUBMITTED_CAN_APPROVE',
SelfInspectionOnlyRejectedCanResubmit = 'SELF_INSPECTION_ONLY_REJECTED_CAN_RESUBMIT',

// ── software-validations FSM (비-reject 흐름 — 5건) ─────────────────────
SoftwareValidationOnlyDraftCanUpdate = 'SOFTWARE_VALIDATION_ONLY_DRAFT_CAN_UPDATE',
SoftwareValidationOnlyDraftCanSubmit = 'SOFTWARE_VALIDATION_ONLY_DRAFT_CAN_SUBMIT',
SoftwareValidationOnlySubmittedCanApprove = 'SOFTWARE_VALIDATION_ONLY_SUBMITTED_CAN_APPROVE',
SoftwareValidationOnlyApprovedCanQualityApprove = 'SOFTWARE_VALIDATION_ONLY_APPROVED_CAN_QUALITY_APPROVE',
SoftwareValidationOnlyRejectedCanRevise = 'SOFTWARE_VALIDATION_ONLY_REJECTED_CAN_REVISE',

// ── calibration (비-reject 흐름 — 4코드, 6건 커버) ──────────────────────
CalibrationNotFound = 'CALIBRATION_NOT_FOUND',
CalibrationInvalidStatusForComplete = 'CALIBRATION_INVALID_STATUS_FOR_COMPLETE',
CalibrationOnlyPendingCanApprove = 'CALIBRATION_ONLY_PENDING_CAN_APPROVE',
CalibrationNoIntermediateCheck = 'CALIBRATION_NO_INTERMEDIATE_CHECK',

// ── calibration-factors (2건) ────────────────────────────────────────────
CalibrationFactorNotFound = 'CALIBRATION_FACTOR_NOT_FOUND',
CalibrationFactorOnlyPendingCanApprove = 'CALIBRATION_FACTOR_ONLY_PENDING_CAN_APPROVE',

// ── equipment-imports (9건 → 9코드) ──────────────────────────────────────
EquipmentImportEndDateBeforeStart = 'IMPORT_END_DATE_BEFORE_START',
EquipmentImportNotFound = 'IMPORT_NOT_FOUND',
EquipmentImportOnlyPendingCanApprove = 'IMPORT_ONLY_PENDING_CAN_APPROVE',
EquipmentImportOnlyApprovedCanReceive = 'IMPORT_ONLY_APPROVED_CAN_RECEIVE',
EquipmentImportNoLinkedEquipment = 'IMPORT_NO_LINKED_EQUIPMENT',
EquipmentImportOnlyReceivedCanReturn = 'IMPORT_ONLY_RECEIVED_CAN_RETURN',
EquipmentImportOnlyPendingOrApprovedCanCancel = 'IMPORT_ONLY_PENDING_OR_APPROVED_CAN_CANCEL',
EquipmentImportOnlyRequesterCanCancel = 'IMPORT_ONLY_REQUESTER_CAN_CANCEL',
EquipmentImportDetailNotFound = 'EQUIPMENT_IMPORT_NOT_FOUND',

// ── non-conformances FSM (2건) ───────────────────────────────────────────
NcClosedCannotUpdate = 'NC_CLOSED_CANNOT_UPDATE',
NcClosedCannotLinkRepair = 'NC_CLOSED_CANNOT_LINK_REPAIR',
```

모두 **400** (FSM violation) 또는 **404** (NOT_FOUND) status code:
- 400: IntermediateInspection*(7), SelfInspection*(6), SoftwareValidation*(5), CalibrationInvalidStatusForComplete, CalibrationOnlyPendingCanApprove, CalibrationNoIntermediateCheck, CalibrationFactorOnlyPendingCanApprove, EquipmentImport*(FSM 7건), Nc*(2)
- 404: CalibrationNotFound, CalibrationFactorNotFound, EquipmentImportNotFound, EquipmentImportDetailNotFound

**검증**: `pnpm --filter backend run tsc --noEmit` — Record<ErrorCode, number> 강제로 누락 시 자동 실패

---

## Phase 2: Backend Service 격상 (수술적 치환)

각 파일에서 inline code string → `code: ErrorCode.XXX` 치환. message/logic 변경 없음.
ErrorCode import 추가 필요 시 (`import { ErrorCode } from '@equipment-management/schemas'`).

### 2.1 intermediate-inspections.service.ts (7건)
| 라인 | 현재 | 변경 |
|---|---|---|
| 338 | `'INVALID_STATUS_TRANSITION'` | `ErrorCode.IntermediateInspectionOnlyDraftCanUpdate` |
| 427 | `'INVALID_STATUS_TRANSITION'` | `ErrorCode.IntermediateInspectionOnlyDraftCanSubmit` |
| 459 | `'INVALID_STATUS_TRANSITION'` | `ErrorCode.IntermediateInspectionOnlySubmittedCanReview` |
| 491 | `'INVALID_STATUS_TRANSITION'` | `ErrorCode.IntermediateInspectionOnlyReviewedCanApprove` |
| 632 | `'INVALID_STATUS_TRANSITION'` | `ErrorCode.IntermediateInspectionOnlySubmittedCanWithdraw` |
| 639 | `'NOT_SUBMITTER'` | `ErrorCode.IntermediateInspectionWithdrawNotSubmitter` |
| 672 | `'INVALID_STATUS_TRANSITION'` | `ErrorCode.IntermediateInspectionOnlyRejectedCanResubmit` |

### 2.2 self-inspections.service.ts (6건)
| 라인 | 현재 | 변경 |
|---|---|---|
| 262 | `'INVALID_STATUS_TRANSITION'` | `ErrorCode.SelfInspectionOnlyDraftCanUpdate` |
| 351 | `'INVALID_STATUS_TRANSITION'` | `ErrorCode.SelfInspectionOnlyDraftCanSubmit` |
| 387 | `'INVALID_STATUS_TRANSITION'` | `ErrorCode.SelfInspectionOnlySubmittedCanWithdraw` |
| 394 | `'NOT_SUBMITTER'` | `ErrorCode.SelfInspectionWithdrawNotSubmitter` |
| 431 | `'INVALID_STATUS_TRANSITION'` | `ErrorCode.SelfInspectionOnlySubmittedCanApprove` |
| 573 | `'INVALID_STATUS_TRANSITION'` | `ErrorCode.SelfInspectionOnlyRejectedCanResubmit` |

### 2.3 software-validations.service.ts (5건)
| 라인 | 현재 | 변경 |
|---|---|---|
| 275 | `'INVALID_STATUS_TRANSITION'` | `ErrorCode.SoftwareValidationOnlyDraftCanUpdate` |
| 342 | `'INVALID_STATUS_TRANSITION'` | `ErrorCode.SoftwareValidationOnlyDraftCanSubmit` |
| 398 | `'INVALID_STATUS_TRANSITION'` | `ErrorCode.SoftwareValidationOnlySubmittedCanApprove` |
| 458 | `'INVALID_STATUS_TRANSITION'` | `ErrorCode.SoftwareValidationOnlyApprovedCanQualityApprove` |
| 587 | `'INVALID_STATUS_TRANSITION'` | `ErrorCode.SoftwareValidationOnlyRejectedCanRevise` |

### 2.4 calibration.service.ts (6건 → 4코드)
| 라인 | 현재 | 변경 |
|---|---|---|
| 327 | `'CALIBRATION_NOT_FOUND'` | `ErrorCode.CalibrationNotFound` |
| 642 | `'CALIBRATION_NOT_FOUND'` | `ErrorCode.CalibrationNotFound` |
| 1212 | `'CALIBRATION_INVALID_STATUS_FOR_COMPLETE'` | `ErrorCode.CalibrationInvalidStatusForComplete` |
| 1399 | `'CALIBRATION_ONLY_PENDING_CAN_APPROVE'` | `ErrorCode.CalibrationOnlyPendingCanApprove` |
| 1743 | `'CALIBRATION_NO_INTERMEDIATE_CHECK'` | `ErrorCode.CalibrationNoIntermediateCheck` |
| 1915 | `'CALIBRATION_NOT_FOUND'` | `ErrorCode.CalibrationNotFound` |

### 2.5 calibration-factors.service.ts (3건)
| 라인 | 현재 | 변경 |
|---|---|---|
| 252 | `'CALIBRATION_FACTOR_NOT_FOUND'` | `ErrorCode.CalibrationFactorNotFound` |
| 278 | `'EQUIPMENT_NOT_FOUND'` | `ErrorCode.EquipmentNotFound` (기존 enum — 변경만) |
| 422 | `'CALIBRATION_FACTOR_ONLY_PENDING_CAN_APPROVE'` | `ErrorCode.CalibrationFactorOnlyPendingCanApprove` |

### 2.6 equipment-imports.service.ts (9건)
| 라인 | 현재 | 변경 | 예외 처리 타입 |
|---|---|---|---|
| 105 | `'IMPORT_END_DATE_BEFORE_START'` | `ErrorCode.EquipmentImportEndDateBeforeStart` | BadRequestException |
| 297 | `'IMPORT_NOT_FOUND'` | `ErrorCode.EquipmentImportNotFound` | NotFoundException |
| 339 | `errorCode: 'IMPORT_ONLY_PENDING_CAN_APPROVE'` | `errorCode: ErrorCode.EquipmentImportOnlyPendingCanApprove` | CasPrecondition |
| 452 | `'IMPORT_ONLY_APPROVED_CAN_RECEIVE'` | `ErrorCode.EquipmentImportOnlyApprovedCanReceive` | BadRequestException |
| 607 | `'IMPORT_NO_LINKED_EQUIPMENT'` | `ErrorCode.EquipmentImportNoLinkedEquipment` | BadRequestException |
| 629 | `errorCode: 'IMPORT_ONLY_RECEIVED_CAN_RETURN'` | `errorCode: ErrorCode.EquipmentImportOnlyReceivedCanReturn` | CasPrecondition |
| 746 | `'IMPORT_ONLY_PENDING_OR_APPROVED_CAN_CANCEL'` | `ErrorCode.EquipmentImportOnlyPendingOrApprovedCanCancel` | BadRequestException |
| 754 | `'IMPORT_ONLY_REQUESTER_CAN_CANCEL'` | `ErrorCode.EquipmentImportOnlyRequesterCanCancel` | BadRequestException |
| 1012 | `'EQUIPMENT_IMPORT_NOT_FOUND'` | `ErrorCode.EquipmentImportDetailNotFound` | NotFoundException |

**주의**: CasPrecondition `errorCode` 필드가 `string` 타입이면 `ErrorCode` 값도 string 호환이므로 정상 동작.

### 2.7 non-conformances.service.ts (2건)
| 라인 | 현재 | 변경 |
|---|---|---|
| 666 | `'NC_CLOSED_CANNOT_UPDATE'` | `ErrorCode.NcClosedCannotUpdate` |
| 946 | `'NC_CLOSED_CANNOT_LINK_REPAIR'` | `ErrorCode.NcClosedCannotLinkRepair` |

**중간 검증**: `pnpm --filter backend run tsc --noEmit`

---

## Phase 3: Frontend Mapper 확장

각 mapper의 `_ERROR_I18N_KEYS` 객체에 신규 ErrorCode 추가. 함수 인터페이스 변경 없음.

### 3.1 intermediate-inspection-errors.ts
calibration namespace (`calibration.json errors.*`):
```
IntermediateInspectionOnlyDraftCanUpdate: 'errors.intermediateInspection.onlyDraftCanUpdate'
IntermediateInspectionOnlyDraftCanSubmit: 'errors.intermediateInspection.onlyDraftCanSubmit'
IntermediateInspectionOnlySubmittedCanReview: 'errors.intermediateInspection.onlySubmittedCanReview'
IntermediateInspectionOnlyReviewedCanApprove: 'errors.intermediateInspection.onlyReviewedCanApprove'
IntermediateInspectionOnlySubmittedCanWithdraw: 'errors.intermediateInspection.onlySubmittedCanWithdraw'
IntermediateInspectionOnlyRejectedCanResubmit: 'errors.intermediateInspection.onlyRejectedCanResubmit'
IntermediateInspectionWithdrawNotSubmitter: 'errors.intermediateInspection.withdrawNotSubmitter'
```

**i18n 키 전략**: `errors.intermediateInspection.*` 서브 namespace로 calibration.json의 기존 `errors.*`와 충돌 방지.

### 3.2 self-inspection-errors.ts
equipment namespace (`equipment.json errors.*`):
```
SelfInspectionOnlyDraftCanUpdate: 'errors.selfInspection.onlyDraftCanUpdate'
SelfInspectionOnlyDraftCanSubmit: 'errors.selfInspection.onlyDraftCanSubmit'
SelfInspectionOnlySubmittedCanWithdraw: 'errors.selfInspection.onlySubmittedCanWithdraw'
SelfInspectionWithdrawNotSubmitter: 'errors.selfInspection.withdrawNotSubmitter'
SelfInspectionOnlySubmittedCanApprove: 'errors.selfInspection.onlySubmittedCanApprove'
SelfInspectionOnlyRejectedCanResubmit: 'errors.selfInspection.onlyRejectedCanResubmit'
```

### 3.3 software-validation-errors.ts
software namespace (`software.json errors.*`):
```
SoftwareValidationOnlyDraftCanUpdate: 'errors.onlyDraftCanUpdate'
SoftwareValidationOnlyDraftCanSubmit: 'errors.onlyDraftCanSubmit'
SoftwareValidationOnlySubmittedCanApprove: 'errors.onlySubmittedCanApprove'
SoftwareValidationOnlyApprovedCanQualityApprove: 'errors.onlyApprovedCanQualityApprove'
SoftwareValidationOnlyRejectedCanRevise: 'errors.onlyRejectedCanRevise'
```

### 3.4 calibration-errors.ts
calibration namespace의 `CALIBRATION_REJECT_ERROR_I18N_KEYS` → 일반화하여 비-reject 코드 포함:
```
CalibrationNotFound: 'errors.notFound'  (기존 CalibrationErrorCode.NOT_FOUND 와 i18n key 일치)
CalibrationInvalidStatusForComplete: 'errors.invalidStatusForComplete'
CalibrationOnlyPendingCanApprove: 'errors.onlyPendingCanApprove'
CalibrationNoIntermediateCheck: 'errors.noIntermediateCheck'
```

### 3.5 calibration-factor-errors.ts
calibration namespace:
```
CalibrationFactorNotFound: 'errors.calibrationFactorNotFound'
CalibrationFactorOnlyPendingCanApprove: 'errors.calibrationFactor.onlyPendingCanApprove'
```

### 3.6 equipment-import-errors.ts
equipment namespace:
```
EquipmentImportEndDateBeforeStart: 'errors.import.endDateBeforeStart'
EquipmentImportNotFound: 'errors.import.notFound'
EquipmentImportOnlyPendingCanApprove: 'errors.import.onlyPendingCanApprove'
EquipmentImportOnlyApprovedCanReceive: 'errors.import.onlyApprovedCanReceive'
EquipmentImportNoLinkedEquipment: 'errors.import.noLinkedEquipment'
EquipmentImportOnlyReceivedCanReturn: 'errors.import.onlyReceivedCanReturn'
EquipmentImportOnlyPendingOrApprovedCanCancel: 'errors.import.onlyPendingOrApprovedCanCancel'
EquipmentImportOnlyRequesterCanCancel: 'errors.import.onlyRequesterCanCancel'
EquipmentImportDetailNotFound: 'errors.import.notFound'  (same key as EquipmentImportNotFound)
```

### 3.7 non-conformance-errors.ts
non-conformances namespace:
```
NcClosedCannotUpdate: 'errors.closedCannotUpdate'
NcClosedCannotLinkRepair: 'errors.closedCannotLinkRepair'
```

---

## Phase 4: i18n 메시지 등재 (ko + en parity)

### 4.1 calibration.json — 신규 서브 namespace + calibration errors 보완

**ko/calibration.json `"errors"` 섹션에 추가**:
```json
"invalidStatusForComplete": "완료 처리 가능한 상태가 아닙니다. (예약됨 또는 진행 중만 완료 가능)",
"onlyPendingCanApprove": "승인 대기 중인 교정 기록만 승인할 수 있습니다.",
"noIntermediateCheck": "이 교정 기록에는 중간점검 일정이 없습니다.",
"calibrationFactorNotFound": "교정 인자를 찾을 수 없습니다.",
"calibrationFactor": {
  "onlyPendingCanApprove": "대기 중인 교정 인자만 승인할 수 있습니다."
},
"intermediateInspection": {
  "onlyDraftCanUpdate": "초안 상태의 중간점검만 수정할 수 있습니다.",
  "onlyDraftCanSubmit": "초안 상태의 중간점검만 제출할 수 있습니다.",
  "onlySubmittedCanReview": "제출된 중간점검만 검토할 수 있습니다.",
  "onlyReviewedCanApprove": "검토 완료된 중간점검만 승인할 수 있습니다.",
  "onlySubmittedCanWithdraw": "제출된 중간점검만 제출 취소할 수 있습니다.",
  "onlyRejectedCanResubmit": "반려된 중간점검만 재제출할 수 있습니다.",
  "withdrawNotSubmitter": "제출자 본인만 제출 취소할 수 있습니다."
}
```

**en/calibration.json 동일 구조, 영문**:
```json
"invalidStatusForComplete": "Cannot complete calibration in its current status. Only scheduled or in-progress calibrations can be completed.",
"onlyPendingCanApprove": "Only pending calibrations can be approved.",
"noIntermediateCheck": "No intermediate check is scheduled for this calibration.",
...
```

### 4.2 software.json — 신규 FSM errors

**ko/software.json `"errors"` 섹션에 추가**:
```json
"onlyDraftCanUpdate": "초안 상태의 유효성 확인만 수정할 수 있습니다.",
"onlyDraftCanSubmit": "초안 상태의 유효성 확인만 제출할 수 있습니다.",
"onlySubmittedCanApprove": "제출된 유효성 확인만 기술 승인할 수 있습니다.",
"onlyApprovedCanQualityApprove": "기술 승인된 유효성 확인만 품질 승인할 수 있습니다.",
"onlyRejectedCanRevise": "반려된 유효성 확인만 재수정할 수 있습니다."
```

### 4.3 equipment.json — self-inspection + equipment-import FSM errors

**ko/equipment.json `"errors"` 섹션에 추가**:
```json
"selfInspection": {
  "onlyDraftCanUpdate": "초안 상태의 자체점검만 수정할 수 있습니다.",
  "onlyDraftCanSubmit": "초안 상태의 자체점검만 제출할 수 있습니다.",
  "onlySubmittedCanWithdraw": "제출된 자체점검만 제출 취소할 수 있습니다.",
  "withdrawNotSubmitter": "제출자 본인만 제출 취소할 수 있습니다.",
  "onlySubmittedCanApprove": "제출된 자체점검만 승인할 수 있습니다.",
  "onlyRejectedCanResubmit": "반려된 자체점검만 재제출할 수 있습니다."
},
"import": {
  "endDateBeforeStart": "사용 종료일은 시작일보다 이후여야 합니다.",
  "notFound": "장비 반입 기록을 찾을 수 없습니다.",
  "onlyPendingCanApprove": "대기 중인 반입 요청만 승인할 수 있습니다.",
  "onlyApprovedCanReceive": "승인된 반입 요청만 수령 처리할 수 있습니다.",
  "noLinkedEquipment": "연결된 장비 정보가 없습니다.",
  "onlyReceivedCanReturn": "수령 완료된 반입만 반납 시작할 수 있습니다.",
  "onlyPendingOrApprovedCanCancel": "대기 중이거나 승인된 반입 요청만 취소할 수 있습니다.",
  "onlyRequesterCanCancel": "반입 요청자 본인만 취소할 수 있습니다."
}
```

### 4.4 non-conformances.json — NC FSM errors

**ko/non-conformances.json `"errors"` 섹션에 추가**:
```json
"closedCannotUpdate": "종료된 부적합 기록은 수정할 수 없습니다.",
"closedCannotLinkRepair": "종료된 부적합에는 수리 이력을 연결할 수 없습니다."
```

---

## Phase 5: 검증 명령

```bash
# M-1: INVALID_STATUS_TRANSITION 전멸
grep -rn "code: 'INVALID_STATUS_TRANSITION'" apps/backend/src/ | wc -l   # expect: 0

# M-2: Backend tsc
pnpm --filter backend run tsc --noEmit

# M-3: Frontend tsc
pnpm --filter frontend run tsc --noEmit

# M-4: Backend test (회귀 0)
pnpm --filter backend run test

# M-8: ts-morph e2e actor invariants
pnpm --filter backend run verify:e2e-actors

# M-9: 도메인별 inline code 잔존 확인
grep -rn "code: '[A-Z_]\{2,\}'" \
  apps/backend/src/modules/intermediate-inspections/ \
  apps/backend/src/modules/self-inspections/ \
  apps/backend/src/modules/software-validations/ \
  apps/backend/src/modules/calibration/ \
  apps/backend/src/modules/calibration-factors/ \
  apps/backend/src/modules/equipment-imports/ \
  apps/backend/src/modules/non-conformances/ | grep -v "// \|ErrorCode\." | wc -l  # expect: 0 for FSM codes
```

---

## 파일 변경 목록 (22개 파일)

### Backend (8개)
1. `packages/schemas/src/errors.ts` — enum 34개 + Record 34개
2. `apps/backend/src/modules/intermediate-inspections/intermediate-inspections.service.ts` — 7건
3. `apps/backend/src/modules/self-inspections/self-inspections.service.ts` — 6건
4. `apps/backend/src/modules/software-validations/software-validations.service.ts` — 5건
5. `apps/backend/src/modules/calibration/calibration.service.ts` — 6건
6. `apps/backend/src/modules/calibration-factors/calibration-factors.service.ts` — 3건
7. `apps/backend/src/modules/equipment-imports/equipment-imports.service.ts` — 9건
8. `apps/backend/src/modules/non-conformances/non-conformances.service.ts` — 2건

### Frontend Mappers (7개)
9. `apps/frontend/lib/errors/intermediate-inspection-errors.ts`
10. `apps/frontend/lib/errors/self-inspection-errors.ts`
11. `apps/frontend/lib/errors/software-validation-errors.ts`
12. `apps/frontend/lib/errors/calibration-errors.ts`
13. `apps/frontend/lib/errors/calibration-factor-errors.ts`
14. `apps/frontend/lib/errors/equipment-import-errors.ts`
15. `apps/frontend/lib/errors/non-conformance-errors.ts`

### i18n Messages (8개 = 4 도메인 × 2 언어)
16. `apps/frontend/messages/ko/calibration.json`
17. `apps/frontend/messages/en/calibration.json`
18. `apps/frontend/messages/ko/software.json`
19. `apps/frontend/messages/en/software.json`
20. `apps/frontend/messages/ko/equipment.json`
21. `apps/frontend/messages/en/equipment.json`
22. `apps/frontend/messages/ko/non-conformances.json`
23. `apps/frontend/messages/en/non-conformances.json`

**총 23개 파일** (Planner 예측 22개 + NC i18n 1개 추가)

---

## 제외 범위 (Out of Scope)

- Controller layer inline literal (equipment domain은 commit 01bca2d1에서 완료)
- NC 나머지 inline codes (NC_TYPE_REQUIRED, NC_NOT_FOUND, NON_CONFORMANCE_NOT_FOUND 등) — 별도 sprint
- equipment-imports VERSION_REQUIRED, IMPORT_NO_LINKED_EQUIPMENT — wait, IMPORT_NO_LINKED_EQUIPMENT is IN scope (line 607)
- calibration.service.ts의 CALIBRATION_NOT_FOUND는 이미 local CalibrationErrorCode.NOT_FOUND로 대응 중이지만, ErrorCode enum 격상으로 통합
- CalibrationFactors UI approverComment (runtime 400) — 별도 tech-debt
