# Evaluation: sort-legacy-removal-and-csv-ssot
Date: 2026-05-08
Iteration: 1

## MUST Criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| M-1 | backend tsc PASS | PASS | 에러 0건 (no output) |
| M-2 | frontend tsc PASS (pre-existing 에러 제외) | PASS | 잔존 에러 3건 모두 pre-existing 확인 — `CalibrationHistoryClient.tsx(24,8) TS2614`, `CalibrationHistoryClient.test.tsx(49,37) TS2352`, `CalibrationHistoryClient.test.tsx(59,3) TS2322` 전부 git stash 후 HEAD 상태에서도 동일 발생 (stash pop으로 복원 완료). `use-checkout-group-aggregates.test.ts` 에러도 pre-existing. 이번 sprint 신규 도입 에러 0건. |
| M-3 | backend test PASS | PASS | 126 suites / 1599 tests PASS, 0 failed |
| M-4 | frontend lint PASS | PASS | `eslint .` 에러 0건 (정상 종료) |
| M-5 | DTO Zod schema sortBy/sortOrder 0건 | PASS | `grep -c "sortBy"` = 0, `grep -c "sortOrder"` = 0 (equipment-import-query.dto.ts) |
| M-6 | mapper legacySortBy/legacySortOrder 0건 | PASS | `grep -c "legacySortBy"` = 0, `grep -c "legacySortOrder"` = 0 (equipment-import-sort-mapper.ts) |
| M-7 | mapper 파라미터 1개 (sort만) | PASS | `export function resolveEquipmentImportOrderBy(sort: EquipmentImportSortValue \| undefined): SQL` — 파라미터 1개 확인 |
| M-8 | service query.sortBy/sortOrder 0건 | PASS | `grep -c "query.sortBy"` = 0, `grep -c "query.sortOrder"` = 0 (equipment-imports.service.ts) |
| M-9 | equipment-api EquipmentQuery sortBy/sortOrder 0건 | PASS | `grep -c "sortBy"` = 0, `grep -c "sortOrder"` = 0 (equipment-api.ts) |
| M-10 | calibration-api CalibrationQuery sortBy/sortOrder 0건 | PASS | `grep -c "sortBy"` = 0, `grep -c "sortOrder"` = 0 (calibration-api.ts) |
| M-11 | calibration-api sort?: CalibrationSortValue 존재 | PASS | `grep -c "sort?: CalibrationSortValue"` = 1, `grep -c "CalibrationSortValue"` = 2 (import 1 + 사용 1), `grep -c "from '@equipment-management/schemas'"` = 1 |
| M-12 | SKILL Step 41 섹션 존재 | PASS | `grep -c "^### Step 41"` = 1, `grep -c "toCsvParam"` = 8 (SKILL.md 전체) |
| M-13 | Step 41에 join(',') 0 hits + toCsvParam SSOT grep 규칙 포함 | PASS | `awk '/^### Step 41/,/^## /'` 추출 결과에 `toCsvParam` + `\.join\(['\"][,]['\"]` 패턴 모두 포함. FAIL 조건 명문화 확인. Output Format 표 line 465: `\| 41  \| toCsvParam SSOT` 행 존재, `toCsvParam` 키워드 포함. |

## SHOULD Criteria

| # | Criterion | Result | Note |
|---|-----------|--------|------|
| S-1 | mapper JSDoc legacy 언급 제거 | PASS | `awk '/\/\*\*/,/\*\//' ... \| grep -ic "legacy\|레거시"` = 0. JSDoc 본문: "결합형 `sort`(`'createdAt.desc'` 등) 파싱. 미제공 시 `EQUIPMENT_IMPORT_SORT_DEFAULT` 사용." — legacy 언급 없음 |
| S-2 | DTO 미사용 import 정리 | PASS | `awk '/^import/,/^[a-zA-Z@]/' ... \| grep -c "SortOrderEnum\|EquipmentImportSortField\|SortOrder[^V]"` = 0. import 블록에 `EquipmentImportSortEnum`, `EquipmentImportSortValue` 만 존재 (결합형 정상) |
| S-3 | sort ApiProperty description 단순화 | PASS | sort 필드 ApiProperty: `description: '결합형 정렬 기준 (\`field.dir\`, 예: \`createdAt.desc\`)'` — legacy / 레거시 키워드 0건 |
| S-4 | service 인접 주석 정리 | PASS | `grep -n "legacy\|레거시" equipment-imports.service.ts` = 0건. mapper 호출 라인(211): `const orderByClause = resolveEquipmentImportOrderBy(query.sort);` — 인접 주석 없음 |

## Verdict

PASS

## Issues Found

없음. MUST 13개 전체 PASS, SHOULD 4개 전체 PASS.

### 참고: 확인된 Pre-existing Frontend tsc 에러

아래 에러는 이번 sprint 변경 전(git stash 후 HEAD 상태)에도 동일하게 존재하는 것을 실측 확인함:

- `components/equipment/CalibrationHistoryClient.tsx(24,8): error TS2614` — `CalibrationApprovalStatus`는 calibration-api.ts에서 import만 하고 re-export하지 않음 (이전 sprint 미완으로 인한 기존 결함)
- `components/equipment/__tests__/CalibrationHistoryClient.test.tsx(49,37): error TS2352`
- `components/equipment/__tests__/CalibrationHistoryClient.test.tsx(59,3): error TS2322`
- `hooks/__tests__/use-checkout-group-aggregates.test.ts` 에러 다수

이번 sprint의 calibration-api.ts 변경 (`sortBy/sortOrder` 제거 + `sort?: CalibrationSortValue` 추가)은 위 에러와 무관함. M-2 범위 외로 처리.
