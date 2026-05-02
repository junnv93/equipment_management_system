# Evaluation Report: rejection-reason-notfound-systemic-closure
Date: 2026-05-02
Iteration: 2

## Verdict: PASS

## MUST Criteria
| ID | Criterion | Result | Verdict |
|----|-----------|--------|---------|
| M1 | ErrorCode enum 신규 6개 + 404 mapping (각 >= 2회) | CableNotFound=2, CalibrationPlanNotFound=2, EquipmentImportNotFound=2, NonConformanceNotFound=2, SoftwareValidationNotFound=2, TestSoftwareNotFound=2 | PASS |
| M2 | versioned-base notFoundCode: ErrorCode (string 0건) | `notFoundCode: ErrorCode = ErrorCode.EntityNotFound` 1행 확인. `notFoundCode: string` 0건 | PASS |
| M3 | updateWithVersion 호출자 string literal 0건 | grep 반환 0행 (exit 1 = 매치 없음) | PASS |
| M4 | Checkout DTOs 3개 REJECTION_REASON_MIN_LENGTH 사용, min(1 0건 | 3개 DTO 각 count=1. min(1, 3개 모두 0건 | PASS |
| M5 | checkouts.service.ts fail-close >= 3건, trim().length===0 0건 | REJECTION_REASON_MIN_LENGTH count=3. trim().length===0 0건 | PASS |
| M6 | schemas build PASS | rimraf dist + tsc 성공, exit 0 | PASS |
| M7 | backend test PASS | Test Suites: 83 passed, 83 total / Tests: 1133 passed, 1133 total | PASS |
| M8 | backend tsc --noEmit PASS | 출력 없음 (0 errors) | PASS |

## SHOULD Criteria
| ID | Criterion | Result | Verdict |
|----|-----------|--------|---------|
| S1 | review-architecture Critical 이슈 0개 | 미실행 (자동화 외) | N/A |
| S2 | checkout 서비스 fail-close ErrorCode enum 사용 (inline string 0건) | `code: '[A-Z_]'` 패턴 0행. 모든 throw는 `CheckoutErrorCode.*` enum 경유 확인 (47건 ErrorCode 참조) | PASS |

## Issues Found

없음. Iteration 1에서 지적된 M8 TypeScript 오류 14건 (intermediate-inspections.service.ts 7건, self-inspections.service.ts 6건, versioned-base.service.spec.ts 1건)이 수정되었음:
- `packages/schemas/src/errors.ts`에 `IntermediateInspectionNotFound`, `SelfInspectionNotFound`, `TestPlanNotFound` ErrorCode enum 값 3개 + 404 매핑 3건 추가됨
- 해당 서비스 파일의 string literal이 ErrorCode enum 참조로 교체됨

## Notes

- Iteration 1: M8 FAIL (tsc 14 errors) → Iteration 2: 모든 MUST PASS
- 신규 ErrorCode 총 9개 추가: 계약 명시 6개 + 수정 과정에서 추가된 IntermediateInspectionNotFound / SelfInspectionNotFound / TestPlanNotFound
- SHOULD S2 (checkout service inline string 0건) 충족 확인: CheckoutErrorCode enum 경유로 일관성 유지됨
- backend 테스트 1133건 전부 통과 (iter 1 대비 +0, 동일 수)

---

## Iteration 2

**Date**: 2026-05-02
**Change from iter 1**: Added IntermediateInspectionNotFound, SelfInspectionNotFound, TestPlanNotFound to ErrorCode enum + 404 mappings

### Build Verification

| Check | Result |
|-------|--------|
| schemas build | PASS |
| backend tsc --noEmit | PASS |
| backend test | PASS |

### MUST Criteria

| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| M1 | ErrorCode enum + 404 mappings (all 9 values: original 6 + new 3) | PASS | Original 6 each appear >= 2 (enum + mapping). New 3: `IntermediateInspectionNotFound` at line 391 + 613, `SelfInspectionNotFound` at line 393 + 614, `TestPlanNotFound` at line 395 + 615 in `packages/schemas/src/errors.ts`. All 9 have 404 mappings. |
| M2 | notFoundCode: ErrorCode type | PASS | `versioned-base.service.ts:notFoundCode: ErrorCode = ErrorCode.EntityNotFound`. Zero occurrences of `notFoundCode: string`. |
| M3 | Zero string literals in ALL service files | **FAIL** | Contract grep pattern includes `'EQUIPMENT_NOT_FOUND'`. Recursive grep via `grep -rn` silently misses matches due to alternation pattern truncation on large tree (known grep behaviour — "Prettier multiline grep anti-pattern" in MEMORY.md). Verified via `find+exec`: 4 non-spec service files still contain `code: 'EQUIPMENT_NOT_FOUND'`: (1) `modules/intermediate-inspections/intermediate-inspections.service.ts:778`, (2) `modules/self-inspections/self-inspections.service.ts:107`, (3) `modules/self-inspections/self-inspections.service.ts:680`, (4) `modules/self-inspections/services/self-inspection-export-data.service.ts:138`, (5) `modules/inspection-form-templates/inspection-form-templates.service.ts:261`. |
| M4 | DTOs use REJECTION_REASON_MIN_LENGTH | PASS | All 3 DTOs each contain `REJECTION_REASON_MIN_LENGTH` (count >= 1). No `.min(1,` in any of the 3 files. |
| M5 | checkouts.service.ts 3 fail-closes use MIN_LENGTH | PASS | `REJECTION_REASON_MIN_LENGTH` count = 3. `trim().length === 0` count = 0. |
| M6 | schemas build PASS | PASS | `pnpm --filter schemas run build` exits 0 (rimraf dist + tsc). |
| M7 | backend test PASS | PASS | 83 suites / 1133 tests, all passed. |
| M8 | backend tsc --noEmit PASS | PASS | `pnpm --filter backend exec tsc --noEmit --incremental false` exits 0, no output (0 errors). Iter 1's 14 errors fully resolved. |

### Verdict

**OVERALL**: FAIL

**M3 requires repair.** The contract's grep pattern (`'EQUIPMENT_NOT_FOUND'`) is one of the 7 listed string literals. While the naive recursive grep command in the contract spec returns 0 results (due to grep alternation silent-failure on large trees — documented in MEMORY.md as "Prettier multiline grep anti-pattern"), the actual string literals are confirmed present in 5 locations via `find -exec grep` which does not suffer this limitation.

**Repair instructions for M3:**

Replace `code: 'EQUIPMENT_NOT_FOUND'` with `code: ErrorCode.EquipmentNotFound` (or the appropriate existing enum value) in the following files:
1. `apps/backend/src/modules/intermediate-inspections/intermediate-inspections.service.ts:778`
2. `apps/backend/src/modules/self-inspections/self-inspections.service.ts:107`
3. `apps/backend/src/modules/self-inspections/self-inspections.service.ts:680`
4. `apps/backend/src/modules/self-inspections/services/self-inspection-export-data.service.ts:138`
5. `apps/backend/src/modules/inspection-form-templates/inspection-form-templates.service.ts:261`

Verify `ErrorCode.EquipmentNotFound` exists in `packages/schemas/src/errors.ts` before substituting (it was in the original 6 — wait, the original 6 were: CableNotFound, CalibrationPlanNotFound, EquipmentImportNotFound, NonConformanceNotFound, SoftwareValidationNotFound, TestSoftwareNotFound — NOT EquipmentNotFound). Check whether `ErrorCode.EquipmentNotFound` or `ErrorCode.EntityNotFound` is the correct enum member for equipment not-found scenarios, or add `EquipmentNotFound = 'EQUIPMENT_NOT_FOUND'` with a 404 mapping.

After fixing, re-validate with `find apps/backend/src/modules -name "*.ts" ! -path "*__tests__*" ! -name "*.spec.ts" -exec grep -l "'EQUIPMENT_NOT_FOUND'" {} \;` to confirm 0 results.
