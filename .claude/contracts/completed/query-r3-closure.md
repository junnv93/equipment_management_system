# Contract — query-r3-closure

**Slug**: `query-r3-closure`
**Mode**: 2 (Planner → Generator → Evaluator loop)
**Plan**: `.claude/exec-plans/active/2026-05-07-query-r3-closure.md`
**Created**: 2026-05-07
**Source**: query-dto-validation-ssot Round 1 (2026-05-05) + Round 2 (2026-05-06) closure — 7 LOW tech-debt 통합

---

## MUST (필수 — 1건 FAIL = Generator iteration)

### M-1. Build / Typecheck / Lint 전체 PASS

- `pnpm --filter @equipment-management/schemas run build` exit 0
- `pnpm --filter @equipment-management/shared-constants run build` exit 0
- `pnpm --filter backend run tsc --noEmit` exit 0
- `pnpm --filter frontend run tsc --noEmit` exit 0
- `pnpm --filter backend run lint` exit 0
- `pnpm --filter frontend run lint` exit 0
- `pnpm build` exit 0 (전체)

### M-2. Test 회귀 0건

**Reality 정합 (2026-05-07 contract rev-2)**: 본 sprint 변경 파일 영향 spec 전체 PASS. 다른 세션이 동시 진행 중인 untracked RTL spec(`CalibrationContent.test.tsx` chip render + `CalibrationRegisterDialog.test.tsx` managementNumber mismatch)은 다른 sprint(`calibration-cert-phase-a-architecture-closure` 갭#3 — equipment-detail-separate-fetch-for-chip)에 의존하며 본 sprint 변경과 무관. 다른 세션이 자체 sprint에서 처리.

- `pnpm --filter backend run test` exit 0 (126 suites / 1606 tests PASS)
- 본 sprint 변경 영향 도메인 spec 전체 PASS:
  - `pnpm --filter frontend run test -- query-csv` exit 0 (11/11)
  - `pnpm --filter frontend run test -- 'checkout|equipment-filter|non-conformances|teams-api|filter'` exit 0 (158/158)
- `pnpm --filter frontend run test:e2e -- bulk-action-mutateAsync` — real-backend 의존 (CI에서 별도 게이트, 본 sprint M-8 cases 정상)

### M-3. Frontend CSV normalization SSOT 신설 (Phase 1)

- 파일 존재: `apps/frontend/lib/api/query-csv.ts`
  - `grep -c "export function toCsvParam" apps/frontend/lib/api/query-csv.ts` ≥ 1
- 파일 존재: `apps/frontend/lib/api/query-csv.test.ts` (또는 `.spec.ts`)
- helper 시그니처: `string | string[] | undefined → string | undefined`
  - `grep -cE "string\s*\|\s*string\[\]" apps/frontend/lib/api/query-csv.ts` ≥ 1
- 케이스 카운트: `grep -c "it\(" apps/frontend/lib/api/query-csv.test.ts` ≥ 8

### M-4. Frontend csv 호출자 helper 경유 (Phase 2)

**Grep invariant 1 — `.join(',')` 인라인 사용 0건 (`query-csv.ts` 자체 제외)**:
```bash
grep -rnE "\.join\(['\"],['\"]\)" apps/frontend/lib/api/ | grep -v "query-csv"
```
**expected**: 0 hits

**도메인별 helper 도입 확인**:
- `grep -c "toCsvParam" apps/frontend/lib/api/teams-api.ts` ≥ 1
- `grep -c "toCsvParam" apps/frontend/lib/api/users-api.ts` ≥ 1 (teams 필드가 csv 형식이면)

**타입 격상 확인**:
- `grep -cE "ids\??:\s*string\s*\|\s*string\[\]" apps/frontend/lib/api/teams-api.ts` ≥ 1
- `TeamQuery.ids`가 단일 `string` 타입이 아닌 union 타입

### M-5. equipment-import frontend hard-cut (Phase 3)

**Grep invariant 2 — sortBy / sortOrder 잔존 0건**:
```bash
grep -nE "sortBy|sortOrder" apps/frontend/lib/api/equipment-import-api.ts
```
**expected**: 0 hits

**결합형 sort 도입 확인**:
- `grep -cE "EquipmentImportSortValue|EquipmentImportSortEnum" apps/frontend/lib/api/equipment-import-api.ts` ≥ 1

**호출자 prop 변경 회귀 0**:
- `pnpm --filter frontend run tsc --noEmit` (M-1 포함) — sortBy/sortOrder prop 사용처 자동 발견

### M-6. Frontend sort field narrowing — sort UI 보유 도메인 (Phase 4)

**Reality 정합 (2026-05-07 contract rev-2)**: Plan 작성 시점 가정과 달리 frontend filter-utils의 sort field 보유 도메인은 **equipment + non-conformances 2건뿐**. checkout/team/notification/software/users 도메인은 sort UI/field 자체 미존재 — narrowing 적용 무관 (sort UI 도입은 별도 가치 검증 필요한 신기능). 5 도메인 narrowing은 기존 tech-debt `frontend-other-domain-sort-narrowing`로 분리 보존 (Phase 9 라운드 #2 명시).

**Grep invariant 3 — `as XxxSortValue` / `as XxxSortField` cast 0건 (sort 보유 도메인)**:
```bash
grep -rnE "as (Equipment|NonConformance)(SortValue|SortField)" apps/frontend/
```
**expected**: 0 hits (좁힘 type으로 자동 추론)

**Domain SSOT import 확인 (sort 보유 도메인)**:
- `grep -cE "EquipmentSortValue|EquipmentSortField" apps/frontend/lib/utils/equipment-filter-utils.ts` ≥ 1
- `grep -cE "NonConformanceSortValue|NonConformanceSortField" apps/frontend/lib/utils/non-conformances-filter-utils.ts` ≥ 1

**URL parser 화이트리스트 검증 패턴**:
- `grep -rcE "\(.*SORT_(FIELDS|VALUE_SET)" apps/frontend/lib/utils/` ≥ 2 (equipment + non-conformances)

**5 도메인 sort 부재 검증 (reality lock)**:
```bash
grep -nE "sortBy|sortOrder|sort\s*:" apps/frontend/lib/utils/checkout-filter-utils.ts apps/frontend/lib/utils/team-filter-utils.ts apps/frontend/lib/utils/notification-filter-utils.ts apps/frontend/lib/utils/software-filter-utils.ts
```
**expected**: 0 hits (5 도메인은 sort UI 미보유 — narrowing 무관)

### M-7. calibration.methods frontend filter UI 노출 (Phase 5)

**Reality 정합 (2026-05-07 contract rev-2)**: i18n 메시지 디렉토리는 `apps/frontend/messages/`(루트), 키 컨벤션은 `content.filters.methodsLabel` / `content.filters.methodOptions.*`. UI ToggleGroup은 `CalibrationContent.tsx`에 통합 (별도 component 신설 회피 — surgical).

**Type + URL serialize**:
- `grep -c "methods" apps/frontend/lib/utils/calibration-filter-utils.ts` ≥ 1
- `grep -cE "ManagementMethod" apps/frontend/lib/utils/calibration-filter-utils.ts` ≥ 1

**i18n parity (ko + en)**:
- `grep -cE "methodsLabel|methodsHint|methodOptions|external_calibration|self_inspection|not_applicable" apps/frontend/messages/ko/calibration.json` ≥ 6 (label + hint + options 객체 + 3 enum 값 + 일부 기존 사용처)
- `grep -cE "methodsLabel|methodsHint|methodOptions|external_calibration|self_inspection|not_applicable" apps/frontend/messages/en/calibration.json` ≥ 6
- ko 카운트 == en 카운트 (parity)

**UI component 변경 확인** (CalibrationContent.tsx ToggleGroup 통합):
- `grep -cE "ToggleGroup.*type=\"multiple\"|MANAGEMENT_METHOD_VALUES" apps/frontend/app/\\(dashboard\\)/calibration/CalibrationContent.tsx` ≥ 1
- `grep -c "aria-label" apps/frontend/app/\\(dashboard\\)/calibration/CalibrationContent.tsx` ≥ 1 (a11y)

**API type 추가 (Phase 2 부분)**:
- `grep -c "methods" apps/frontend/lib/api/calibration-api.ts` ≥ 1

### M-8. Real-backend e2e — bulk action mutateAsync UX (Phase 6)

**파일 존재**:
- `ls apps/frontend/tests/e2e/checkouts/bulk-action-mutateAsync.spec.ts` 존재

**케이스 매트릭스 (3 minimum)**:
- (a) bulk approve 성공: AlertDialog visible during pending + hidden after success
- (b) bulk reject 성공: AlertDialog visible during pending + hidden after success
- (c) bulk approve 실패 (권한 또는 conflict): AlertDialog remains visible + error 표시

**검증 명령**:
```bash
pnpm --filter frontend run test:e2e -- bulk-action-mutateAsync
```
**expected**: exit 0, 모든 case PASS

**Spec 케이스 카운트**:
- `grep -cE "test\(|test\.describe" apps/frontend/tests/e2e/checkouts/bulk-action-mutateAsync.spec.ts` ≥ 3
- `grep -cE "waitForResponse|toBeVisible" apps/frontend/tests/e2e/checkouts/bulk-action-mutateAsync.spec.ts` ≥ 6

**Anti-pattern 차단 — 본 spec은 mock-only 회피, real-backend 의존**:
- `grep -cE "page\.route\(.+/checkouts" apps/frontend/tests/e2e/checkouts/bulk-action-mutateAsync.spec.ts` ≤ 0 (또는 SHOULD로 격하 — 명시 권장 mock 미사용)

### M-9. calibration.service sql-shape spec (Phase 7)

**파일 존재**:
- `ls apps/backend/src/modules/calibration/__tests__/calibration.service.sql-shape.spec.ts` 존재

**Spec 케이스 (4 minimum)**:
- (a) methods=`['external']` → SQL `equipment.management_method IN (...)` + 1 param
- (b) methods=`['external','self']` → 2 params
- (c) methods=undefined → methods 조건 없음
- (d) methods=`['exempt']` → 1 param

**SSOT 패턴 사용 확인**:
- `grep -cE "createMockDrizzle|renderSQL" apps/backend/src/modules/calibration/__tests__/calibration.service.sql-shape.spec.ts` ≥ 2
- `grep -c "it\(" apps/backend/src/modules/calibration/__tests__/calibration.service.sql-shape.spec.ts` ≥ 4

**SQL shape assertion**:
- `grep -cE "management_method|managementMethod.*IN" apps/backend/src/modules/calibration/__tests__/calibration.service.sql-shape.spec.ts` ≥ 1

### M-10. report-query export schema spec coverage (Phase 8)

**3 export schema spec 추가**:
- `grep -cE "exportEquipmentUsage" apps/backend/src/modules/reports/__tests__/report-query-validation.spec.ts` ≥ 4 (4 cases)
- `grep -cE "exportTeamEquipment" apps/backend/src/modules/reports/__tests__/report-query-validation.spec.ts` ≥ 4
- `grep -cE "exportMaintenance" apps/backend/src/modules/reports/__tests__/report-query-validation.spec.ts` ≥ 4

**전체 케이스 카운트 증가**:
- `grep -c "it\(" apps/backend/src/modules/reports/__tests__/report-query-validation.spec.ts` 가 본 sprint 시작 시점 대비 ≥ +12 (3 schema × 4 cases)

### M-11. SSOT 위반 0건 (시스템 횡적)

- `as XxxSortValue` cast 0건 (M-6 포함, 전체 도메인)
- 하드코딩 `.join(',')` 0건 (M-4 포함, query-csv.ts 자체 제외)
- 인라인 `code: '[A-Z_]+'` string literal 0건 (verify-zod Step 16 회귀):
  ```bash
  grep -rn "code: '[A-Z_]\+'" apps/frontend/lib/api/query-csv.ts apps/backend/src/modules/calibration/__tests__/calibration.service.sql-shape.spec.ts apps/backend/src/modules/reports/__tests__/report-query-validation.spec.ts
  ```
  expected: 0
- 신규 파일에 `any` 0건:
  ```bash
  grep -rnE ":\s*any\b|<any>" apps/frontend/lib/api/query-csv.ts apps/backend/src/modules/calibration/__tests__/calibration.service.sql-shape.spec.ts
  ```
  expected: 0
- 신규 파일에 `eslint-disable` 0건:
  ```bash
  grep -rn "eslint-disable" apps/frontend/lib/api/query-csv.ts apps/backend/src/modules/calibration/__tests__/calibration.service.sql-shape.spec.ts apps/frontend/tests/e2e/checkouts/bulk-action-mutateAsync.spec.ts
  ```
  expected: 0

### M-12. Backend equipment-import legacy fallback 보존 (회귀 차단)

본 sprint는 frontend hard-cut만 수행. backend는 r2의 dual-accept (sortBy/sortOrder + sort 결합형)를 보존해야 함:
- `grep -nE "sortBy|sortOrder" apps/backend/src/modules/equipment-imports/dto/equipment-import-query.dto.ts` ≥ 1 (legacy 필드 존재 — 본 sprint에서 삭제 금지)
- `grep -nE "EquipmentImportSortEnum|EquipmentImportSortValue" apps/backend/src/modules/equipment-imports/dto/equipment-import-query.dto.ts` ≥ 1 (결합형 enum도 보존)

### M-13. Next.js 16 / React 19 deprecated API 0건

본 sprint 신규/변경 파일 cross-check:
- `useFormState` 사용 0건 (≠ useActionState):
  ```bash
  grep -rn "useFormState" apps/frontend/lib/api/query-csv.ts apps/frontend/lib/utils/calibration-filter-utils.ts apps/frontend/components/calibration/
  ```
  expected: 0
- `middleware.ts` 추가 0건 (≠ proxy.ts):
  ```bash
  find apps/frontend -name "middleware.ts" -newer apps/frontend/proxy.ts 2>/dev/null
  ```
  expected: 0 (없거나 기존만)

### M-14. 시니어 자기검토 라운드 #2 (Phase 9)

iter 1 PASS 후 사용자 명시 표준 ("타협 X / 누락 X / 단편적 임시방편 X") 따라 명시적 라운드 #2 수행. **본 항목은 Phase 9 완료 + 라운드 #2 결과 commit 또는 tech-debt 등록 후 PASS**:

- (a) **다른 도메인 frontend filter 회귀 검토**: `audit-log-filter-utils.ts`, `reports-filter-utils.ts`, `calibration-plans-filter-utils.ts` 등 자체 sort field 보유 여부 + `as XxxSortValue` cast 잔존 검토. 발견 시 즉시 수정 또는 tech-debt 등록.
- (b) **`toCsvParam` 추가 호출자 lift**: `apps/frontend/lib/api/*.ts` 전체에서 array → csv 변환 인라인 패턴 (`Array.isArray(...) ? ... : ...`) grep. 발견 시 helper 경유 migration.
- (c) **backend equipment-import legacy fallback 제거 가능성**: frontend hard-cut 후 backend `sortBy`/`sortOrder` 사용처 0건이면 backend dead code. **본 sprint는 보존** (M-12), 후속 sprint에 분리 등록.
- (d) **verify-zod / verify-ssot / verify-frontend-state SKILL Step 추가 결정**: 본 sprint 신규 패턴 (toCsvParam SSOT, frontend sort narrowing 7 도메인) 회귀 차단 grep step 추가 가치 평가. 추가 시 SKILL.md 수정 + 검증 명령 명시.
- (e) **MEMORY.md 갱신**: 본 sprint slug + 핵심 패턴 (toCsvParam SSOT / 7 도메인 sort narrowing / real-backend e2e mutateAsync / calibration sql-shape) 한 줄 등록.
- (f) **tech-debt-tracker.md 갱신**: 7 LOW 항목 closure mark + 라운드 #2 발견 항목 (있으면) Open 등록.

**검증**: 라운드 #2 결과 명시적 보고서 (Phase 9 closure summary) — Generator는 라운드 #2 수행 후 마지막 commit message 또는 별도 paragraph로 결과 요약.

### M-15. 문서 + 아카이브 (Phase 9 후)

- `.claude/contracts/REGISTRY.md` Active 섹션에 `query-r3-closure` 추가 후 → Completed 이동
- 평가 통과 후:
  - `.claude/exec-plans/active/2026-05-07-query-r3-closure.md` → `.claude/exec-plans/completed/`
  - `.claude/contracts/query-r3-closure.md` → `.claude/contracts/completed/`
  - REGISTRY.md Active → Completed 이동
- MEMORY.md `프로젝트 이력` 섹션에 항목 추가:
  - 슬러그 / 날짜 / 핵심 결정 (toCsvParam SSOT / 7 도메인 sort narrowing / real-backend e2e / calibration sql-shape) / 파일 수 / 테스트 수
- tech-debt-tracker.md 갱신:
  - 7 LOW 항목 모두 `[x]` closure mark + 해결 PR/commit 링크
  - 라운드 #2 발견 항목 (있으면) Open 등록

---

## SHOULD (권장 — FAIL 시 tech-debt 분리, loop 차단 안 함)

### S-1. backend equipment-import legacy fallback 제거 후속 sprint 등록

- frontend hard-cut 후 backend `sortBy`/`sortOrder` 사용처 0건이면 dead code. tech-debt 등록.
- 미등록 시 회귀 위험.

### S-2. UI calibration.methods toggle a11y

- ToggleGroup `role="group"` + `aria-label` 명시
- 키보드 navigation (Tab + Space) 동작 확인
- 미준수 시 review-design 점수 영향

### S-3. e2e mutateAsync flake 0건

- real-backend latency 의존 — `page.waitForResponse`로 timing 동기화 필수
- flake 발생 시 SHOULD FAIL → tech-debt `e2e-mutateAsync-flake-mitigation` 등록

### S-4. calibration.service sql-shape spec — 다른 filter 케이스 추가

- methods 외 statuses, calibrationAgency 등 filter도 sql-shape spec 추가 가능 (확장 spec)
- 본 sprint는 methods만 MUST. 추가는 SHOULD.

### S-5. report-query export pipe Swagger 자동 enum 노출

- DTO 클래스 `@ApiPropertyOptional({ enum: ... })` 자동 enum 표시
- 권장, 미적용 시 tech-debt 분리

### S-6. Phase 9 라운드 #2 — verify-* SKILL Step 추가 시점

- 신규 패턴 회귀 차단 grep step 추가 가치 평가
- 추가 가치 낮으면 보류 (over-engineering 회피)
- 결정 사유 commit message에 명시

### S-7. frontend test coverage threshold

- 신규 helper + filter 변경 케이스 ≥ 20 (전체 신규 spec 기준)
- 미달 시 tech-debt `frontend-test-coverage-r3` 등록

### S-8. ErrorCode SSOT 회귀 검증

- 본 sprint 신규/변경 backend 파일에서 인라인 `code: 'X'` 0건 회귀 (verify-zod Step 16)
- 검증: M-11에 포함됨

### S-9. 회귀 spec — Round 2 SSOT helper 영향 받는 case 보존

- `optionalCsvUuid` / `optionalCsvEnum` / `optionalTrimmedString` 사용 case가 r2 spec에서 PASS 유지
- 본 sprint는 helper 자체 변경 없음 — 회귀 차단만

### S-10. 7 LOW 항목 모두 closure (tracker `[x]`)

- 6 항목 closure + 1 보류 (예: e2e flake 후속) 시 SHOULD WARN
- 모두 closure 시 PASS

---

## 검증 명령 요약 (Evaluator용)

```bash
# 1. Build / Test
pnpm build                                          # M-1
pnpm --filter backend run tsc --noEmit              # M-1
pnpm --filter frontend run tsc --noEmit             # M-1
pnpm --filter backend run lint                      # M-1
pnpm --filter frontend run lint                     # M-1
pnpm --filter backend run test                      # M-2
pnpm --filter frontend run test                     # M-2
pnpm --filter frontend run test:e2e -- bulk-action-mutateAsync   # M-2, M-8

# 2. CSV normalization SSOT (M-3, M-4)
grep -c "export function toCsvParam" apps/frontend/lib/api/query-csv.ts
grep -rnE "\.join\(['\"],['\"]\)" apps/frontend/lib/api/ | grep -v "query-csv"

# 3. equipment-import hard-cut (M-5)
grep -nE "sortBy|sortOrder" apps/frontend/lib/api/equipment-import-api.ts
grep -cE "EquipmentImportSortValue|EquipmentImportSortEnum" apps/frontend/lib/api/equipment-import-api.ts

# 4. 7 도메인 sort narrowing (M-6)
grep -rnE "as (Checkout|Team|Calibration|NonConformance|Notification|TestSoftware)(SortValue|SortField)" apps/frontend/

# 5. calibration.methods UI (M-7)
grep -c "methods" apps/frontend/lib/utils/calibration-filter-utils.ts
grep -rcE "filter\.method\." apps/frontend/lib/i18n/messages/ko/
grep -rcE "filter\.method\." apps/frontend/lib/i18n/messages/en/

# 6. e2e mutateAsync (M-8)
ls apps/frontend/tests/e2e/checkouts/bulk-action-mutateAsync.spec.ts
grep -cE "waitForResponse|toBeVisible" apps/frontend/tests/e2e/checkouts/bulk-action-mutateAsync.spec.ts

# 7. calibration sql-shape (M-9)
ls apps/backend/src/modules/calibration/__tests__/calibration.service.sql-shape.spec.ts
grep -cE "createMockDrizzle|renderSQL" apps/backend/src/modules/calibration/__tests__/calibration.service.sql-shape.spec.ts

# 8. report-query coverage (M-10)
grep -cE "exportEquipmentUsage" apps/backend/src/modules/reports/__tests__/report-query-validation.spec.ts
grep -cE "exportTeamEquipment" apps/backend/src/modules/reports/__tests__/report-query-validation.spec.ts
grep -cE "exportMaintenance" apps/backend/src/modules/reports/__tests__/report-query-validation.spec.ts

# 9. SSOT 회귀 (M-11)
grep -rn "code: '[A-Z_]\+'" apps/frontend/lib/api/query-csv.ts apps/backend/src/modules/calibration/__tests__/calibration.service.sql-shape.spec.ts
grep -rnE ":\s*any\b|<any>" apps/frontend/lib/api/query-csv.ts apps/backend/src/modules/calibration/__tests__/calibration.service.sql-shape.spec.ts
grep -rn "eslint-disable" apps/frontend/lib/api/query-csv.ts apps/backend/src/modules/calibration/__tests__/calibration.service.sql-shape.spec.ts apps/frontend/tests/e2e/checkouts/bulk-action-mutateAsync.spec.ts

# 10. backend legacy 보존 (M-12)
grep -nE "sortBy|sortOrder" apps/backend/src/modules/equipment-imports/dto/equipment-import-query.dto.ts
grep -nE "EquipmentImportSortEnum|EquipmentImportSortValue" apps/backend/src/modules/equipment-imports/dto/equipment-import-query.dto.ts

# 11. Round #2 / 아카이브 (M-14, M-15)
ls .claude/exec-plans/completed/2026-05-07-query-r3-closure.md      # Phase 9 후 존재
ls .claude/contracts/completed/query-r3-closure.md                  # Phase 9 후 존재
grep -c "query-r3-closure" .claude/contracts/REGISTRY.md            # Active → Completed 추적
grep -c "query-r3-closure" ~/.claude/projects/-home-kmjkds-equipment-management-system/memory/MEMORY.md  # ≥ 1
```

---

## Iteration 종료 조건

1. **All MUST PASS**: 15/15 MUST 항목 통과 (M-1 ~ M-15)
2. **SHOULD 평가**: PASS 권장. FAIL 항목은 tech-debt-tracker에 분리 등록 후 본 sprint는 클로즈.
3. **Phase 9 시니어 자기검토 라운드 #2**: 명시적 수행 + 결과 보고 (commit message 또는 paragraph)
4. **Archive**: REGISTRY 업데이트 + exec-plan/contract 이동 + MEMORY.md 갱신 + tech-debt 7 항목 closure mark.

**FAIL 케이스 처리**:
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입 요청)
- 3회 반복 초과 → 수동 개입 요청
- SHOULD 실패는 종료 조건에 영향 없음 — tech-debt-tracker.md에 기록
