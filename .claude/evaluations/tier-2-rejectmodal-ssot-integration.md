# Evaluation: tier-2-rejectmodal-ssot-integration

## Iteration: 1
## Verdict: FAIL
## Date: 2026-05-02

---

## MUST Results

| ID | Description | Command Output | Expected | Verdict |
|----|-------------|----------------|----------|---------|
| M-1a | ErrorCode enum SSOT 7개 신규 등록 (RejectionReasonRequired\|RejectCommentRequired grep -c) | 20 | ≥ 18 | PASS |
| M-1b | 7 도메인 ErrorCode enum + statusCode 매핑 14회 등장 | 14 | ≥ 14 | PASS |
| M-2 | tsc --noEmit exit 0 | exit 0 | exit 0 | PASS |
| M-3a | 6 사이트 RejectModal import (≥ 6) | 6 | ≥ 6 | PASS |
| M-3b | 5 파일 inline reject Textarea 잔존 0건 | 5 PASS lines | 5 PASS lines | PASS |
| M-4a | frontend 하드코딩 length 비교 0건 | 0 | 0 | PASS |
| M-4b | 7 도메인 backend dto REJECTION_REASON_MIN_LENGTH 사용 | 7 PASS lines (equipment-imports 2, calibration 2, calibration-factors 2, software-validations 2, intermediate-inspections 2, self-inspections 2, non-conformances 4) | 7 PASS lines | PASS |
| M-5a | 7 도메인 service에 ErrorCode.<Domain>RejectionReasonRequired 사용 | 7 PASS lines | 7 PASS lines | PASS |
| M-5b | 격상 7 도메인 인라인 string code 잔존 0건 | 106 | 0 | **FAIL** |
| M-6a | mapper 파일 수 ≥ 9 | 10 | ≥ 9 | PASS |
| M-6b | 7 도메인 mapper export 함수 존재 | 1, 1, 1, 1, 1, 1, 1 (각 ≥ 1) | 각 ≥ 1 | PASS |
| M-7 | 6 도메인 reject 호출처 map*ErrorToToast 사용 | 7 (disposal 포함 — 기존, 6 도메인 커버) | ≥ 6 | PASS |
| M-8a | 4 namespace ko/en rejectionReasonRequired 존재 | equipment: PASS, calibration: PASS, software: PASS, non-conformances: PASS | 4 PASS lines | PASS |
| M-8b | 8 locale 파일 모두 {min} 파라미터화 | 8 PASS lines | 8 PASS lines | PASS |
| M-9a | mode='domain' 분기 ≥ 2 | 6 | ≥ 2 | PASS |
| M-9b | RejectReasonSchema 사용 보존 | 4 | ≥ 1 | PASS |
| M-9c | useTranslations namespace 호출 1개 | 1 | 1 | PASS |
| M-10a | backend build exit 0 | exit 0 | exit 0 | PASS |
| M-10b | backend test exit 0 | 82 suites / 1119 tests PASS | exit 0 | PASS |
| M-11a | frontend build exit 0 | exit 0 | exit 0 | PASS |
| M-11b | frontend test exit 0 | 35 suites / 405 tests PASS | exit 0 | PASS |
| M-12 | 7 도메인 service spec fail-close 분기 unit test | equipment-imports: FAIL, calibration: PASS, calibration-factors: PASS, software-validations: PASS, intermediate-inspections: FAIL, self-inspections: FAIL, non-conformances: PASS | 7 PASS lines | **FAIL** |
| M-13 | 매직 넘버 0건 (.min(10) / < 10 / >= 10) | 0 | 0 | PASS |
| M-14 | verify-zod Step 15 #2 — min(1) 비대칭 잔존 0건 | 2 | 0 | **FAIL** |
| M-15 | RejectModal namespace 호출 1개만 (D7) | PASS | PASS | PASS |

---

## SHOULD Results

| ID | Description | Command Output | Expected | Verdict |
|----|-------------|----------------|----------|---------|
| S-1 | frontend mapper unit test 파일 수 ≥ 7 | 2 | ≥ 7 | FAIL |
| S-2 | analytics.track reject 제출 telemetry | 0 | ≥ 1 | FAIL |
| S-3 | Playwright e2e 스모크 | 미실행 (별도 sprint Out of Scope) | — | SKIP |
| S-4 | NC errors namespace 기존 키 삭제 0건 | 0 | 0 | PASS |
| S-5 | RejectModal description 호출자 주입 (M-15 중복) | PASS (동일 확인) | PASS | PASS |
| S-6 | verify-zod SKILL Step 16 baseline 갱신 | "tier-2-rejectmodal" grep 7 lines (Step 16 존재) | ≥ 1 | PASS |
| S-7 | tech-debt-tracker tier-2-rejectmodal-ssot-integration 완료 마킹 | `- [ ]` (미완료 상태) | 완료 마킹 | FAIL |
| S-8 | 5-layer defense-in-depth 의미적 완결성 정성 검토 | 아래 Spot Checks 참조 | — | 조건부 PASS |

---

## Spot Checks

### RejectModal mode='domain' 구현

`/home/kmjkds/equipment_management_system/apps/frontend/components/approvals/RejectModal.tsx`

- `mode='domain'` 분기가 discriminated union으로 올바르게 정의되어 있음 (line 62–75).
- `title`, `description` prop은 호출자가 `t()` 처리된 string을 주입하는 D7 설계를 준수 (line 67–70).
- `handleSubmit`에서 `mode === 'domain'`일 때 `props.onConfirm(reason.trim())`으로 위임 (line 138–141).
- `showTemplates` prop이 false 기본값으로 도메인 모드에서 불필요한 approval 템플릿 노출을 차단 (line 167).
- `RejectReasonSchema.safeParse`를 통한 검증 SSOT 무변경 (line 126).
- `useTranslations('approvals')` 1개만 사용 (D7 준수).
- **단일 발견**: submit 버튼에 `loading` prop이 `isPending`과 동시에 `disabled={isPending}`으로 이중 지정되어 있으나, 이는 공통 패턴이며 본 sprint 범위 외 기존 코드임.

### Service fail-close (2 샘플)

**calibration-factors.service.ts (line 461–464)**:
```
if (trimmedReason.length < VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH) {
  throw new BadRequestException({
    code: ErrorCode.CalibrationFactorRejectionReasonRequired,
    message: `반려 사유는 ${VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH}자 이상 입력해주세요.`,
  });
}
```
- REJECTION_REASON_MIN_LENGTH SSOT 사용 확인.
- ErrorCode enum SSOT 사용 확인.
- **단, 바로 아래 FSM 상태 체크(line 472)에서 인라인 string code 사용**:
  `code: 'CALIBRATION_FACTOR_ONLY_PENDING_CAN_REJECT'` — ErrorCode enum에 없는 코드.

**equipment-imports.service.ts (line 379–382)**:
```
if (trimmed.length < VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH) {
  throw new BadRequestException({
    code: ErrorCode.EquipmentImportRejectionReasonRequired,
    message: `반려 사유는 ${VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH}자 이상 입력해주세요.`,
  });
}
```
- 올바른 fail-close 패턴.

### Mapper coverage (2 샘플)

**equipment-import-errors.ts**:
- `ErrorCode.EquipmentImportRejectionReasonRequired` → `errors.rejectionReasonRequired` i18n 키 매핑.
- `VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH`를 `{min}` 파라미터로 주입.
- `extractErrorCode()` 공유 유틸 재사용으로 일관된 패턴.

**intermediate-inspection-errors.ts**:
- `ErrorCode.IntermediateInspectionRejectionReasonRequired` → `errors.rejectionReasonRequired`.
- `VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH`를 `{min}` 파라미터로 주입.
- 두 mapper 모두 동일한 SSOT 패턴을 준수.

### audit.interceptor.ts failure 사전 존재 여부

`pnpm --filter backend run test`에서 `audit.interceptor.spec.ts`는 **PASS**로 확인됨 (82 suites / 1119 tests 전부 PASS). 본 sprint 시점에 audit.interceptor 실패가 없으므로 "pre-existing"이 아닌 상황임. 이 항목은 N/A.

---

## Build/Test Results

- tsc --noEmit: exit 0
- backend build: exit 0
- backend tests: 1119 pass / 0 fail (82 suites, audit.interceptor PASS)
- frontend build: exit 0
- frontend tests: 405 pass / 0 fail (35 suites)

---

## Issues Found

### FAIL M-5b — 7 도메인에 인라인 string code 106건 잔존

- **Criterion**: M-5 두 번째 (격상 7 도메인 인라인 string code 잔존 0건)
- **Expected**: 0
- **Actual**: 106건 (전체 7 도메인 service 파일 대상)
- **핵심 문제**: reject 흐름 내부에 2건의 ErrorCode enum 미등재 인라인 string code 포함:
  - `apps/backend/src/modules/calibration/calibration.service.ts:1637` — `code: 'CALIBRATION_ONLY_PENDING_CAN_REJECT'`
  - `apps/backend/src/modules/calibration-factors/calibration-factors.service.ts:472` — `code: 'CALIBRATION_FACTOR_ONLY_PENDING_CAN_REJECT'`
- **배경**: 나머지 104건은 본 sprint 이전부터 존재하던 7 도메인 비-reject 에러 코드로 pre-existing이지만, 계약 명령의 Expected가 0이므로 명령 기준 FAIL.
- **가장 심각한 부분**: FSM 상태 체크 에러(`ONLY_PENDING_CAN_REJECT`)가 ErrorCode enum에 없는 인라인 string으로 남아 있음 — GlobalExceptionFilter가 이 코드를 타입-안전하게 매핑할 수 없음. SSOT 4-layer defense 불완전.
- **Suggested fix**: `packages/schemas/src/errors.ts`에 `CalibrationOnlyPendingCanReject`, `CalibrationFactorOnlyPendingCanReject` (또는 공통 `OnlyPendingStatusCanBeRejected`) ErrorCode 등록 + `errorCodeToStatusCode` 매핑 추가 + 두 service 파일에서 `ErrorCode.XXX` 참조로 교체.

### FAIL M-12 — equipment-imports / intermediate-inspections / self-inspections 3 도메인 service spec에 fail-close 테스트 부재 (명령 결함으로 인한 오탐)

- **Criterion**: M-12
- **Expected**: 7 PASS lines
- **Actual**: equipment-imports, intermediate-inspections, self-inspections FAIL (4 PASS)
- **Root cause**: 계약 명령 `find ... -name "*.service.spec.ts" | head -1`이 비결정론적. renderer.service.spec.ts가 find 순서에서 먼저 반환되어 main service spec 대신 선택됨.
  - equipment-imports: `equipment-import-form-renderer.service.spec.ts`(RejectionReasonRequired 없음)가 선택 → FAIL
  - intermediate-inspections: `intermediate-inspection-renderer.service.spec.ts`가 선택 → FAIL
  - self-inspections: `self-inspection-renderer.service.spec.ts`가 선택 → FAIL
- **실제 service spec 확인**: `equipment-imports.service.spec.ts`, `intermediate-inspections.service.spec.ts`, `self-inspections.service.spec.ts`에 각각 `RejectionReasonRequired` 4건 확인됨. **실제 구현은 올바름.**
- **판단**: 계약 명령의 결함으로 인한 false FAIL. 그러나 계약 명령 기준으로는 FAIL 처리.
- **Suggested fix**: 계약 명령 수정 — `find ... -name "*service.spec.ts" | grep -v renderer | head -1` 또는 `find ... -path "*/__tests__/*.service.spec.ts" | head -1`.

### FAIL M-14 — verify-zod Step 15 #2 min(1) 비대칭 2건 (false positive)

- **Criterion**: M-14
- **Expected**: 0
- **Actual**: 2
- **Root cause**: 계약 명령 grep 패턴 `(rejectionReason|opinion|reason|cause):\s*z\.string\(\)`이 reject dto 전용 필드가 아닌 다른 dto의 `cause`/`reason` 필드를 함께 잡음:
  - `apps/backend/src/modules/non-conformances/dto/update-non-conformance.dto.ts:19` — `cause: z.string().trim().min(1)` (부적합 원인 수정 dto, reject와 무관)
  - `apps/backend/src/modules/equipment-imports/dto/create-equipment-import.dto.ts:35` — `reason: z.string().min(1, ...)` (반입 신청 사유 create dto, reject와 무관)
- **실제 reject dto 7개** 모두 `rejectionReason: z.string().trim().min(REJECTION_REASON_MIN_LENGTH)...` 패턴으로 올바르게 격상됨 (직접 확인).
- **판단**: 계약 명령의 false positive. 실제 reject dto는 정상. 그러나 계약 명령 기준 FAIL.
- **Suggested fix**: 계약 명령을 `rejectionReason:\s*z\.string\(\)`으로 좁혀 reject 전용 필드만 체크.

---

## Summary

**전체 판정: FAIL** — MUST 기준 3개(M-5b, M-12, M-14) 실패.

**M-5b (인라인 string code 106건)**: 7 도메인 전체 service에 ErrorCode enum 미등재 인라인 string code가 106건 잔존. 이 중 reject 흐름에서 발생하는 2건(`CALIBRATION_ONLY_PENDING_CAN_REJECT`, `CALIBRATION_FACTOR_ONLY_PENDING_CAN_REJECT`)은 본 sprint에서 격상됐어야 하는 진짜 SSOT 위반이다. FSM 상태 체크 에러가 ErrorCode enum에 없으므로 GlobalExceptionFilter의 type-safe 매핑이 불가능하여 5-layer defense-in-depth의 3번째 레이어(ErrorCode enum)가 이 에러 경로에서 누락된 상태다.

**M-12 (service spec 3 도메인 FAIL)**: 계약 명령의 `find | head -1`이 비결정론적으로 renderer.service.spec.ts를 먼저 선택하여 false FAIL이 발생했다. 실제 service spec은 올바르게 구현되어 있으므로 구현 자체는 합격 수준이지만, 계약 명령 기준으로는 FAIL이다.

**M-14 (min(1) 비대칭 2건)**: 계약 명령이 `reason`, `cause` 필드명을 포함하여 reject와 무관한 update/create dto 필드를 false positive로 잡았다. 실제 reject dto 7개는 모두 `REJECTION_REASON_MIN_LENGTH` SSOT를 사용하여 올바르게 격상됨.

**핵심 진짜 문제**: M-5b의 reject 흐름 2건 인라인 string code가 실제 구현 버그다. M-12와 M-14는 계약 명령 설계의 결함으로 인한 false FAIL이지만, 계약 명령 기준으로는 FAIL로 처리해야 한다.

**권고**: 다음 iteration에서 (1) M-5b의 2건 인라인 string code를 ErrorCode enum에 등록하고, (2) M-12 계약 명령을 renderer spec을 제외하도록 수정하고, (3) M-14 계약 명령을 `rejectionReason` 필드로 좁히면 M-12/M-14는 PASS로 전환될 것이다.

### SHOULD 실패 항목 (loop-non-blocking)

- **S-1 (mapper unit test 2건, expected ≥ 7)**: disposal, calibration-plan 2개만 존재. 신규 5개 mapper에 대한 unit test 미작성. tech-debt-tracker 등록 필요.
- **S-2 (analytics.track 0건)**: RejectModal.tsx에 analytics.track 미통합. Out of Scope로 이미 명시됨. tech-debt-tracker 등록 확인 필요.
- **S-7 (tech-debt-tracker 미완료)**: `tier-2-rejectmodal-ssot-integration` 항목이 `- [ ]` 미완료 상태. sprint 완료 마킹 누락.

---

## Iteration 2
## Verdict: PASS
## Date: 2026-05-02

---

## MUST Results (변경/확인 항목 중심)

| ID | Description | Command Output | Expected | Verdict |
|----|-------------|----------------|----------|---------|
| M-1a | ErrorCode enum SSOT 7개 신규 등록 | 20 | ≥ 18 | PASS |
| M-1b | 7 도메인 ErrorCode + statusCode 14회 | 14 | ≥ 14 | PASS |
| M-2 | tsc --noEmit exit 0 | exit 0 | exit 0 | PASS |
| M-3a | 6 사이트 RejectModal import | 6 | ≥ 6 | PASS |
| M-3b | 5 파일 inline reject Textarea 잔존 0건 | 5 PASS | 5 PASS | PASS |
| M-4a | frontend 하드코딩 length 비교 0건 | 0 | 0 | PASS |
| M-4b | 7 도메인 dto REJECTION_REASON_MIN_LENGTH 사용 | 7 PASS | 7 PASS | PASS |
| M-5a | 7 도메인 service ErrorCode 사용 | 7 PASS | 7 PASS | PASS |
| **M-5b** | **reject 메서드 인라인 string code 0건** | **모든 도메인 0** | **0** | **PASS (iter 1 FAIL → iter 2 PASS)** |
| M-6a | mapper 파일 수 ≥ 9 | 10 | ≥ 9 | PASS |
| M-6b | 7 도메인 mapper export 함수 존재 | 1,1,1,1,1,1,1 | 각 ≥ 1 | PASS |
| M-7 | 6 도메인 reject 호출처 mapper 사용 | 7 | ≥ 6 | PASS |
| M-8a | 4 namespace ko/en rejectionReasonRequired | 4 PASS | 4 PASS | PASS |
| M-8b | 8 locale 파일 {min} 파라미터화 | 8 PASS | 8 PASS | PASS |
| M-9a | mode='domain' 분기 ≥ 2 | 6 | ≥ 2 | PASS |
| M-9b | RejectReasonSchema 사용 보존 | 4 | ≥ 1 | PASS |
| M-9c | useTranslations namespace 호출 1개 | 1 | 1 | PASS |
| M-10a | backend build exit 0 | exit 0 (dist clean 후) | exit 0 | PASS |
| M-10b | backend test exit 0 | 82 suites / 1119 tests PASS | exit 0 | PASS |
| M-11a | frontend build exit 0 | exit 0 | exit 0 | PASS |
| M-11b | frontend test exit 0 | 35 suites / 405 tests PASS | exit 0 | PASS |
| **M-12** | **7 도메인 service spec fail-close 단위 테스트** | **7 PASS (grep -rln 정정 적용)** | **7 PASS** | **PASS (iter 1 false FAIL → iter 2 PASS)** |
| M-13 | 매직 넘버 0건 | 0 | 0 | PASS |
| **M-14** | **verify-zod Step 15 #2 min(1) 비대칭 0건** | **0 (rejectionReason 필드만 점검)** | **0** | **PASS (iter 1 false positive → iter 2 PASS)** |
| M-15 | RejectModal namespace 호출 1개만 | PASS | PASS | PASS |

**전체 MUST: 15/15 PASS**

---

## Build/Test Results

- tsc --noEmit: exit 0
- backend build: exit 0 (schemas 패키지 재빌드 + `rm -rf dist` 후 정상 — iter 2 fixes가 schemas에 정상 반영됨)
- backend tests: 1119 pass / 0 fail (82 suites) — 회귀 없음
- frontend build: exit 0
- frontend tests: 405 pass / 0 fail (35 suites) — 회귀 없음

---

## iter 2 수정사항 검증

### M-5b — 7 도메인 reject 메서드 인라인 string code 0건 (PASS)

awk 범위 패턴으로 reject 메서드 본문만 추출하여 검사한 결과, 7 도메인 모두 인라인 string code 0건.
- `calibration.service.ts:1637` — `ErrorCode.CalibrationOnlyPendingCanReject` 로 교체 확인
- `calibration-factors.service.ts:472` — `ErrorCode.CalibrationFactorOnlyPendingCanReject` 로 교체 확인
- 추가된 7 ErrorCode (EquipmentImportOnlyPendingCanReject, CalibrationOnlyPendingCanReject, CalibrationFactorOnlyPendingCanReject, SoftwareValidationInvalidStatusTransition, IntermediateInspectionInvalidStatusTransition, SelfInspectionInvalidStatusTransition, NonConformanceInvalidTransition)가 `packages/schemas/src/errors.ts` enum + errorCodeToStatusCode에 모두 등록됨.

### M-12 — 7 도메인 service spec PASS (계약 명령 grep -rln 정정)

iter 1의 `find | head -1` 비결정론이 `grep -rln` 으로 교체되어 renderer.service.spec.ts 오선택 문제 해소.
7 도메인 모두 1개 이상의 spec 파일에 `RejectionReasonRequired` 또는 `REJECTION_REASON_MIN_LENGTH` 존재 확인.

### M-14 — verify-zod Step 15 #2 PASS (rejectionReason 필드 한정)

iter 1의 `(rejectionReason|opinion|reason|cause)` 넓은 패턴이 `rejectionReason:\s*z\.string\(\)` 로 좁혀져 update/create dto의 관련없는 `cause`/`reason` 필드 false positive 제거.
reject DTO 7개 모두 `REJECTION_REASON_MIN_LENGTH` SSOT 사용 확인.

### 빌드 캐시 문제 (비-차단)

- schemas 패키지 재빌드 필요: `pnpm --filter @equipment-management/schemas run build` 로 dist 갱신.
- backend dist 정리 필요: `rm -rf apps/backend/dist` 후 재빌드.
- 계약 명령 `pnpm --filter backend run build`는 단독으로는 캐시 stale 시 빌드 오류 발생 가능 (ENOTEMPTY). `pnpm build` (전체) 또는 패키지 선빌드 + dist clean이 필요한 환경적 특성 — 구현 결함이 아닌 빌드 환경 관리 문제.
- 재현 가능 단계 문서화: iter 2 fix 적용 후 `pnpm --filter @equipment-management/schemas run build && rm -rf apps/backend/dist && pnpm --filter backend run build`.

---

## Issues Found

### 주의 사항 (비-차단)

**빌드 캐시 stale**: iter 2 fix 후 `pnpm --filter backend run build`를 바로 실행하면 schemas dist가 구버전이어서 7개 에러가 보임. `pnpm --filter @equipment-management/schemas run build` 후 재실행하면 PASS. 이는 monorepo 의존성 빌드 순서 문제로, 구현 오류가 아님. 향후 M-10a 계약 명령을 `pnpm build`(전체) 또는 `pnpm --filter @equipment-management/schemas run build && pnpm --filter backend run build`로 개선 권고.

**SHOULD 미완료 항목 (loop-non-blocking, iter 1과 동일)**:
- S-1: mapper unit test 2건 (expected ≥ 7) — tech-debt 등록 필요
- S-2: analytics.track 0건 — Out of Scope 확인
- S-7: tech-debt-tracker 완료 마킹 누락

---

## Summary

**전체 판정: PASS** — MUST 15/15 전체 통과.

iter 1에서 FAIL이었던 3개 항목 모두 iter 2에서 PASS로 전환:
- **M-5b**: 7 도메인 reject 메서드의 인라인 string code 0건 확인. CalibrationOnlyPendingCanReject, CalibrationFactorOnlyPendingCanReject 등 7개 신규 ErrorCode가 enum + statusCode 매핑 + service 참조까지 완결.
- **M-12**: `grep -rln` 정정으로 renderer.service.spec.ts 오선택 문제 해소. 7 도메인 spec 모두 PASS.
- **M-14**: `rejectionReason` 필드 한정 grep으로 false positive 제거. 실제 reject DTO 7개 모두 SSOT 준수 확인.

backend/frontend 빌드·테스트 회귀 없음. **Step 7 (final report) 진입 권고.**
