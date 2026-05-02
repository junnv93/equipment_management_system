# Evaluation: tier2-fsm-invalid-status-transition

**Date**: 2026-05-02
**Iteration**: 1
**Evaluator**: Agent (sonnet)

## Verdict: FAIL

---

## MUST Criteria Results

| ID | Criterion | Result | Evidence |
|---|---|---|---|
| M-1 | `code: 'INVALID_STATUS_TRANSITION'` 잔존 0건 | PASS | `grep` 결과 0건 확인 |
| M-2 | `pnpm --filter backend run tsc --noEmit` PASS | **FAIL** | `nest build` 46 TypeScript errors — schemas dist 미재빌드 원인. 상세 아래 참조 |
| M-3 | `pnpm --filter frontend run tsc --noEmit` PASS | PASS | `pnpm --filter frontend run build` → "Compiled successfully in 13.4s" (Next.js tsconfig는 schemas src/ 직접 참조) |
| M-4 | `pnpm --filter backend run test` PASS | PASS | 82 suites, 1119 tests PASS (jest/ts-jest는 src/ 직접 컴파일 — dist 독립) |
| M-5 | 신규 ErrorCode 34개 모두 `errorCodeToStatusCode` Record에 등재 | PASS (src 기준) | `packages/schemas/src/errors.ts` 내 enum 156개 = Record entries 156개 정합. M-2 FAIL로 컴파일 검증 불완전 |
| M-6 | 신규 ErrorCode 34개 모두 frontend mapper I18N_KEYS map에 등재 | PASS | 7개 mapper 전수 확인 — 34개 전부 존재 |
| M-7 | 신규 i18n 키 ko + en 양쪽 parity | PASS | contract 명시 명령: ko=9, en=9. 도메인별 전수 — calibration/equipment/software/non-conformances 모두 parity |
| M-8 | `pnpm --filter backend run verify:e2e-actors` PASS | PASS | "✅ verify:e2e-actors — 0 violations" |
| M-9 | `code: 'NOT_SUBMITTER'` 인라인 0건 | PASS | `grep` 결과 0건 확인 |
| M-10 | calibration, calibration-factors, equipment-imports, NC 도메인 FSM inline 잔존 0건 | PASS | 4개 도메인 각각 0건 확인 |

---

## SHOULD Criteria Results

| ID | Criterion | Result | Notes |
|---|---|---|---|
| S-1 | i18n 키 명명이 UL-QP-18 도메인 언어 일치 | PASS | `onlyDraftCanUpdate`, `onlySubmittedCanReview`, `withdrawNotSubmitter` 등 도메인 언어 일관 |
| S-2 | 한국어 메시지 사용자 멘탈 모델 일치 | PASS | "초안 상태의 중간점검만 수정할 수 있습니다.", "제출자 본인만 제출 취소할 수 있습니다." 등 자연어 |
| S-3 | calibration-errors.ts local enum vs 신규 ErrorCode 값 동일 → 기존 호출자 영향 없음 | PASS | `CalibrationErrorCode.NOT_FOUND = 'CALIBRATION_NOT_FOUND'` 와 `ErrorCode.CalibrationNotFound = 'CALIBRATION_NOT_FOUND'` 동일 값 |
| S-4 | CasPrecondition.errorCode 필드 string 타입 호환 | PASS | `CasPrecondition.errorCode: string`. ErrorCode enum 값 assignable |
| S-5 | ErrorCode value 문자열이 기존 inline literal과 동일 (API 호환성) | PASS | `IMPORT_NOT_FOUND`, `IMPORT_END_DATE_BEFORE_START` 등 값 1:1 일치 확인 |
| S-6 | 각 도메인 mapper 함수 시그니처/인터페이스 변경 없음 | PASS | 7개 mapper export 함수 시그니처 변경 없음. `getCalibrationErrorI18nKey()` 포함 |

---

## Issues Found

### MUST Failures (loop blockers)

#### M-2: Backend TypeScript 빌드 46 errors — LOOP BLOCKER

**Root Cause**: `packages/schemas/src/errors.ts`에 신규 ErrorCode 95줄이 추가되었으나 schemas 패키지 `dist/`가 재빌드되지 않았다.

**메커니즘**: NestJS `nest build`는 `tsconfig.build.json`을 사용한다. TypeScript의 `extends`에서 `compilerOptions.paths`는 **병합되지 않고 자식이 부모를 완전히 대체**한다. `tsconfig.build.json`의 `paths`는 `@equipment-management/db`만 정의하므로, 부모 `tsconfig.json`의 `@equipment-management/schemas → src/` 매핑이 사라진다. 결과적으로 NestJS 빌드는 node_modules 심볼릭 링크(`packages/schemas/`)를 통해 `dist/errors.d.ts`를 참조하고, 이 dist에 신규 코드가 없어 46개 오류가 발생한다.

**실제 오류 (46건, 35개 unique properties)**:
- Calibration: `CalibrationNotFound`(6회), `CalibrationInvalidStatusForComplete`, `CalibrationOnlyPendingCanApprove`, `CalibrationNoIntermediateCheck`
- CalibrationFactor: `CalibrationFactorNotFound`, `CalibrationFactorOnlyPendingCanApprove`
- EquipmentImport: `EquipmentImportDetailNotFound`(7회), `EquipmentImportEndDateBeforeStart`, `EquipmentImportNotFound`, `EquipmentImportOnlyPendingCanApprove`, `EquipmentImportOnlyApprovedCanReceive`, `EquipmentImportNoLinkedEquipment`, `EquipmentImportOnlyReceivedCanReturn`, `EquipmentImportOnlyPendingOrApprovedCanCancel`, `EquipmentImportOnlyRequesterCanCancel`
- IntermediateInspection: 7개 FSM codes 각 1회
- SelfInspection: 6개 FSM codes 각 1회
- SoftwareValidation: 5개 FSM codes 각 1회
- NC: `NcClosedCannotUpdate`, `NcClosedCannotLinkRepair`

**추가 관찰**: `packages/schemas/src/errors.ts` 자체가 **미커밋 상태** (`git status --short: M packages/schemas/src/errors.ts`). 프론트엔드 mapper 파일들과 i18n 파일들도 전부 미커밋. 현재 스프린트 작업이 전혀 커밋되지 않았다.

**Fix 방법**: `pnpm --filter schemas run build` 실행 후 `pnpm --filter backend run build`로 재검증.

---

### SHOULD Failures (tech-debt candidates)

없음 — 모든 SHOULD 기준 PASS.

---

## Verification Commands Run

```bash
# M-1
grep -rn "code: 'INVALID_STATUS_TRANSITION'" apps/backend/src/ | wc -l
# → 0  PASS

# M-9
grep -rn "code: 'NOT_SUBMITTER'" apps/backend/src/ | wc -l
# → 0  PASS

# M-2 (backend build — tsc proxy)
pnpm --filter backend run build 2>&1 | grep "Found [0-9]* error"
# → Found 46 error(s).  FAIL

# M-3 (frontend build)
pnpm --filter frontend run build 2>&1 | grep "Compiled"
# → ✓ Compiled successfully in 13.4s  PASS

# M-4 (backend tests)
pnpm --filter backend run test 2>&1 | tail -3
# → 82 suites, 1119 tests PASS  PASS

# M-8 (e2e actors)
pnpm --filter backend run verify:e2e-actors
# → ✅ verify:e2e-actors — 0 violations  PASS

# M-10 (FSM inline per domain)
grep -n "code: 'CALIBRATION_'" apps/backend/src/modules/calibration/calibration.service.ts \
  | grep -v "ErrorCode\." | wc -l
# → 0  PASS

grep -n "code: 'CALIBRATION_FACTOR_'" apps/backend/src/modules/calibration-factors/calibration-factors.service.ts \
  | grep -v "ErrorCode\." | wc -l
# → 0  PASS

grep -n "code: 'IMPORT_\|errorCode: 'IMPORT_'" apps/backend/src/modules/equipment-imports/equipment-imports.service.ts \
  | grep -v "ErrorCode\." | wc -l
# → 0  PASS

grep -n "code: 'NC_CLOSED_'" apps/backend/src/modules/non-conformances/non-conformances.service.ts \
  | grep -v "ErrorCode\." | wc -l
# → 0  PASS

# M-6 (frontend mappers — 34개 전수 확인)
# intermediate-inspection-errors.ts: IntermediateInspection* 7 FSM codes ✓
# self-inspection-errors.ts: SelfInspection* 6 FSM codes ✓
# software-validation-errors.ts: SoftwareValidation* 5 FSM codes ✓
# calibration-errors.ts: CalibrationNotFound/InvalidStatusForComplete/OnlyPendingCanApprove/NoIntermediateCheck ✓
# calibration-factor-errors.ts: CalibrationFactorNotFound/OnlyPendingCanApprove ✓
# equipment-import-errors.ts: 9 codes incl. EquipmentImportDetailNotFound ✓
# non-conformance-errors.ts: NcClosedCannotUpdate/NcClosedCannotLinkRepair ✓

# M-7 (i18n parity — contract 명시 명령)
ko_count=$(grep -c '"onlyDraftCanUpdate"\|"onlyDraftCanSubmit"\|"onlySubmittedCanWithdraw"' \
  apps/frontend/messages/ko/*.json | awk -F: '{s+=$2} END {print s}')
en_count=$(grep -c '"onlyDraftCanUpdate"\|"onlyDraftCanSubmit"\|"onlySubmittedCanWithdraw"' \
  apps/frontend/messages/en/*.json | awk -F: '{s+=$2} END {print s}')
# → ko_count=9 en_count=9  PASS
```

---

## 추가 관찰사항

1. **schemas dist rebuild 필수**: `pnpm --filter schemas run build` 실행이 스프린트 완료 전 필수. 이후 `pnpm --filter backend run build`로 46 errors → 0 확인 필요.

2. **스코프 외 inline 잔존 (비-차단)**: `intermediate-inspections.service.ts`에 `'INTERMEDIATE_INSPECTION_NOT_FOUND'`(2건), `'INTERMEDIATE_INSPECTION_NOT_REQUIRED'`(1건); `self-inspections.service.ts`에 `'SELF_INSPECTION_NOT_FOUND'`(2건); `software-validations.service.ts`에 `'SOFTWARE_VALIDATION_NOT_FOUND'`(1건). 이 코드들은 ErrorCode enum에 미등재이며 M-10 명시 범위 외. 향후 별도 스프린트 대상.

3. **M-2 FAIL이 M-5를 무효화**: M-5는 "M-2 derivative"로 선언됨. M-2가 FAIL이므로 컴파일 강제 검증(`Record<ErrorCode, number>` 자동 차단)이 실제로 동작하지 않았다. src 기준 수동 확인으로는 156 enum = 156 Record entries이나, 실제 빌드 검증은 schemas 재빌드 후에만 가능.

4. **backend 테스트 통과 ≠ 배포 가능**: jest/ts-jest는 src를 직접 컴파일하므로 M-4는 PASS다. 그러나 `nest build` 실패로 실제 배포 불가 상태. M-4 PASS가 M-2 FAIL을 상쇄하지 않는다.

---

# Iteration 2

**Date**: 2026-05-02
**Evaluator**: Agent (sonnet)

## Fix Applied (iter 1 → iter 2)

`pnpm --filter @equipment-management/schemas run build` 실행 — `packages/schemas/dist/errors.d.ts`에 신규 34개 ErrorCode 반영 확인.

## Verdict: PASS

---

## MUST Criteria Results (Iteration 2)

| ID | Criterion | Result | Evidence |
|---|---|---|---|
| M-1 | `code: 'INVALID_STATUS_TRANSITION'` 잔존 0건 | PASS | `grep -rn "code: 'INVALID_STATUS_TRANSITION'" apps/backend/src/ \| wc -l` → 0 |
| M-2 | `pnpm --filter backend run build` PASS (tsconfig.build.json + dist paths) | PASS | `nest build` exit 0, 출력 없음 (에러 0건). `pnpm --filter backend run type-check` (tsc --noEmit) 출력 없음 |
| M-3 | `pnpm --filter frontend run type-check` PASS | PASS | `tsc --noEmit` 출력 없음 (에러 0건) |
| M-4 | `pnpm --filter backend run test` PASS | PASS | 82 suites, 1119 tests PASS |
| M-5 | 신규 ErrorCode 34개 모두 `errorCodeToStatusCode` Record 등재 → M-2 자동 검증 | PASS | M-2 build PASS로 `Record<ErrorCode, number>` 강제 검증 실제 통과 확인 |
| M-6 | 신규 ErrorCode 34개 모두 frontend mapper I18N_KEYS map에 등재 | PASS | 7개 mapper 전수 확인 (아래 상세): IntermediateInspection 7/7, SelfInspection 6/6, SoftwareValidation 5/5, Calibration 4/4, CalibrationFactor 2/2, EquipmentImport 9/9, NC 2/2 = 합계 35 references (EquipmentImportDetailNotFound는 EquipmentImportNotFound와 동일 i18n 키 공유) |
| M-7 | 신규 i18n 키 ko + en parity | PASS | calibration.json ko=14/en=14, equipment.json ko=12/en=12, non-conformances.json ko=2/en=2, software.json ko=5/en=5. 전 도메인 parity 일치 |
| M-8 | `pnpm --filter backend run verify:e2e-actors` PASS | PASS | "✅ verify:e2e-actors — 0 violations" |
| M-9 | `code: 'NOT_SUBMITTER'` 인라인 0건 | PASS | `grep -rn "code: 'NOT_SUBMITTER'" apps/backend/src/ \| wc -l` → 0 |
| M-10 | calibration, calibration-factors, equipment-imports, NC 도메인 FSM inline 잔존 0건 | PASS | 4개 도메인 각각 0건 확인 |

---

## Additional Spot-Checks (Iteration 2)

### self-inspections.service.ts 확인 (aef1d8e2 커밋)

`grep -rn "code: 'INVALID_STATUS_TRANSITION'\|code: 'NOT_SUBMITTER'" apps/backend/src/modules/self-inspections/self-inspections.service.ts` → 0건. 서비스 내 모든 FSM throw는 `ErrorCode.SelfInspectionOnly*` / `ErrorCode.SelfInspectionWithdrawNotSubmitter` 경유 확인.

### schemas dist 동기화 확인

`packages/schemas/dist/errors.d.ts`에 `IntermediateInspectionOnlyDraftCanUpdate`, `SelfInspectionOnlyDraftCanUpdate`, `CalibrationNotFound`, `NcClosedCannotUpdate` 4종 존재 확인 (grep -c → 4).

### 커밋 상태

핵심 스프린트 파일들이 commit `6c280f36` (feat(errors): tier-2 FSM inline → ErrorCode SSOT 시스템적 closure (34 신규 코드))에 포함되어 있음. `git status --short` 상 잔존 unstaged: `.claude/settings.local.json`, `apps/frontend/next-env.d.ts`, `pnpm-lock.yaml` (스프린트 범위 외).

---

## SHOULD Criteria Results (Iteration 2)

모든 SHOULD 기준 Iteration 1과 동일하게 PASS. 변경 없음.

---

## Verification Commands Run (Iteration 2)

```bash
# M-1: INVALID_STATUS_TRANSITION 전멸
grep -rn "code: 'INVALID_STATUS_TRANSITION'" apps/backend/src/ | wc -l
# → 0  PASS

# M-9: NOT_SUBMITTER 전멸
grep -rn "code: 'NOT_SUBMITTER'" apps/backend/src/ | wc -l
# → 0  PASS

# M-2: Backend build (tsconfig.build.json → dist paths)
pnpm --filter backend run build  # → exit 0, no output  PASS
pnpm --filter backend run type-check  # → exit 0, no output  PASS

# M-3: Frontend tsc
pnpm --filter frontend run type-check  # → exit 0, no output  PASS

# M-4: Backend tests
pnpm --filter backend run test
# → 82 suites, 1119 tests PASS  PASS

# M-8: e2e actors
pnpm --filter backend run verify:e2e-actors
# → ✅ verify:e2e-actors — 0 violations  PASS

# M-10: Domain FSM inline 잔존
grep -n "code: 'CALIBRATION_'" calibration.service.ts | grep -v "ErrorCode\." | wc -l  # → 0
grep -n "code: 'CALIBRATION_FACTOR_'" calibration-factors.service.ts | grep -v "ErrorCode\." | wc -l  # → 0
grep -n "code: 'IMPORT_\|errorCode: 'IMPORT_'" equipment-imports.service.ts | grep -v "ErrorCode\." | wc -l  # → 0
grep -n "code: 'NC_CLOSED_'" non-conformances.service.ts | grep -v "ErrorCode\." | wc -l  # → 0
# → 모두 0  PASS

# M-6: Frontend mapper 전수 (34 ErrorCodes)
# intermediate-inspection-errors.ts: 7/7 ✓
# self-inspection-errors.ts: 6/6 ✓
# software-validation-errors.ts: 5/5 ✓
# calibration-errors.ts: 4/4 ✓
# calibration-factor-errors.ts: 2/2 ✓
# equipment-import-errors.ts: 9/9 ✓
# non-conformance-errors.ts: 2/2 ✓

# M-7: i18n parity
# calibration.json: ko=14, en=14  ✓
# equipment.json: ko=12, en=12  ✓
# non-conformances.json: ko=2, en=2  ✓
# software.json: ko=5, en=5  ✓
```
