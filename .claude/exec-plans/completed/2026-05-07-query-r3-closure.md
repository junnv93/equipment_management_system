# Query DTO Validation SSOT — Round 3 Closure (7 LOW tech-debt 통합)

## 메타
- 생성: 2026-05-07
- 모드: Mode 2 (Planner → Generator → Evaluator loop)
- Slug: `query-r3-closure`
- 예상 변경: ~30 파일 (신규 ~10 / 수정 ~20)
- 후속 sprint: query-dto-validation-ssot Round 1 (2026-05-05) + Round 2 (2026-05-06) closure

---

## 설계 철학

Round 1·2가 backend SSOT (`optionalTrimmedString` / `optionalCsvEnum` / `optionalCsvUuid` / `buildSortEnum` / `*-sort-mapper`)을 결빙했고 equipment 도메인 frontend까지 좁혔다. **Round 3은 frontend 5 도메인까지 SSOT를 시스템 전반으로 펴고, real-backend e2e + sql-shape spec으로 회귀 차단 표면을 닫는다**. 새 helper는 `apps/frontend/lib/api/query-csv.ts` 단일 파일에 한정 — Round 1·2의 backend SSOT 패턴을 그대로 frontend로 미러.

---

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| frontend csv 정규화 위치 | `apps/frontend/lib/api/query-csv.ts` 신규 SSOT | 14+ api 파일이 `Array.isArray ? join(',') : value` 인라인 작성 위험. 단일 진입점 = 미래 인코딩(URL-encoded csv 등) 단일 진화점. |
| TeamQuery.ids / UserQuery.teams 타입 격상 | `string \| string[]` 유니언 + helper 통과 정규화 | 호출자가 string array를 자연스럽게 전달 + 기존 `string` 호출자도 동작 (backward compatible). backend는 이미 `optionalCsvUuid`로 양쪽 지원. |
| equipment-import frontend sort 마이그레이션 | `sort=field.dir` 결합형으로 hard-cut + legacy `sortBy`/`sortOrder` 삭제 | r2 backend는 결합형 `EquipmentImportSortEnum` 신규 + legacy fallback 유지. **본 sprint에서 frontend hard-cut 후 backend legacy fallback도 후속 별도 sprint에 분리** (본 sprint MUST에는 frontend hard-cut만). 점진 migration window 회피로 SSOT 비대칭 제거. |
| frontend filter 좁히기 — 다른 도메인 범위 | UICheckoutFilters / UIUserFilters / UITeamFilters / UICalibrationFilters / UINonConformancesFilters / UINotificationFilters / UITestSoftwareFilters | r2가 EquipmentSortValue narrowing 패턴 결빙. 7 도메인 mirror — 각 도메인 backend `<Domain>SortValue` 좁힘 + URL 화이트리스트 검증. |
| calibration.methods frontend UI 노출 위치 | 기존 calibration filter UI에 외부교정/자체점검/비대상 toggle group 추가 | UL-QP-18 분류별 조회 사용자 가치. 별도 페이지 신설 회피, 기존 filter component 확장만. |
| e2e mutateAsync 검증 위치 | `apps/frontend/tests/e2e/checkouts/bulk-action-mutateAsync.spec.ts` 신규 + 기존 `bulk-checkout-actions.spec.ts` mock-only는 보존 | 실제 backend 200ms+ latency 시각 피드백 검증 = 신규 spec scope. mock spec과 의도 분리. fixture/storageState 패턴 그대로 재사용. |
| calibration sql-shape spec 위치 | `apps/backend/src/modules/calibration/__tests__/calibration.service.sql-shape.spec.ts` 신규 | checkouts.service.sql-shape.spec.ts 패턴 1:1 미러. `createMockDrizzle()` + `renderSQL` SSOT 재사용. |
| verify-* SKILL Step 추가 위치 | verify-zod Step 21 + verify-frontend-state Step (자동 결정) + verify-ssot Step (자동 결정) | r2가 Step 20 (`buildSortEnum` + `optionalCsvUuid`)까지 점유. Step 21 = frontend csv normalization SSOT 회귀 차단. 다른 SKILL은 manage-skills 결과 따름. |

---

## 구현 Phase

### Phase 1: Frontend CSV normalization SSOT (D-4)

**목표:** `apps/frontend/lib/api/query-csv.ts` 신규 — `Array.isArray ? join(',') : value` 단일 진입점 + `string | string[]` 정규화 helper.

**변경 파일:**
1. `apps/frontend/lib/api/query-csv.ts` — 신규. `toCsvParam(value: string | string[] | undefined): string | undefined` + JSDoc.
2. `apps/frontend/lib/api/query-csv.test.ts` — 신규. accept/reject 8+ cases (string passthrough, array join, undefined→undefined, empty array→undefined, single element array, whitespace 처리, comma-in-element 경고 또는 정상화 결정).

**검증:**
```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run test -- query-csv
grep -c "export function toCsvParam" apps/frontend/lib/api/query-csv.ts  # ≥ 1
```

---

### Phase 2: Frontend TeamQuery / UserQuery / CalibrationQuery 타입 격상 + 호출자 마이그레이션 (D-4)

**목표:** Phase 1 helper를 사용해 `TeamQuery.ids` / `UserQuery.teams` (+ 기타 csv 필드 발견 시) 타입을 `string | string[]`로 격상하고 모든 호출자를 helper 경유로 변경.

**변경 파일:**
1. `apps/frontend/lib/api/teams-api.ts` — `TeamQuery.ids?: string` → `string | string[]`. 내부 URL builder에서 `toCsvParam(ids)` 호출.
2. `apps/frontend/lib/api/users-api.ts` — `UserQuery.teams?: string` 또는 동등 필드 발견 시 → `string | string[]`. 호출자 helper 통과.
3. `apps/frontend/lib/api/calibration-api.ts` — `CalibrationQuery.methods?: ...` 신규 필드 추가 (debt #5의 type 부분 — Phase 5와 분리).
4. `apps/frontend/lib/api/equipment-api.ts` 외 검색 결과 발견되는 csv 필드 — Generator 발견 시 동일 패턴 적용.
5. `apps/frontend/hooks/use-teams.ts` / `use-users.ts` / 호출자 — string array 전달 가능하도록 시그니처 정리 (필요 시).

**검증:**
```bash
pnpm --filter frontend run tsc --noEmit
grep -rnE "\.join\(',\)" apps/frontend/lib/api/ | grep -v query-csv  # 0 hits (모두 helper 경유)
grep -c "toCsvParam" apps/frontend/lib/api/teams-api.ts  # ≥ 1
grep -c "toCsvParam" apps/frontend/lib/api/users-api.ts  # ≥ 1
```

**의존:** Phase 1 (helper).

---

### Phase 3: Frontend equipment-import sort 결합형 hard-cut 마이그레이션 (D-1)

**목표:** `apps/frontend/lib/api/equipment-import-api.ts` 의 `sortBy` + `sortOrder` 분리형을 결합형 `sort=field.dir`로 hard-cut. backend는 r2에서 결합형 + legacy 둘 다 받지만, frontend hard-cut 후 backend legacy fallback 제거는 후속 sprint로 분리.

**변경 파일:**
1. `apps/frontend/lib/api/equipment-import-api.ts` — `EquipmentImportQuery.sortBy?: string` + `sortOrder?: 'asc'|'desc'` 삭제 → `sort?: EquipmentImportSortValue` (`@equipment-management/schemas`에서 import). URL builder의 `params.append('sortBy', ...)` + `params.append('sortOrder', ...)` 두 줄을 `params.append('sort', ...)` 한 줄로 치환.
2. 호출자 컴포넌트 (`apps/frontend/components/equipment-imports/*` 또는 hooks) — `sortBy`/`sortOrder` prop 사용처를 `sort` 결합형으로 변경. tsc가 자동 발견.
3. `apps/frontend/lib/utils/equipment-import-filter-utils.ts` (있다면) — 동일 변경.

**검증:**
```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run test
grep -nE "sortBy|sortOrder" apps/frontend/lib/api/equipment-import-api.ts  # 0 hits
grep -c "EquipmentImportSortValue\|EquipmentImportSortEnum" apps/frontend/lib/api/equipment-import-api.ts  # ≥ 1
```

**의존:** 없음 (단독 수행 가능).

---

### Phase 4: Frontend 7 도메인 sort narrowing — UI filter sort field 좁히기 (D-3)

**목표:** r2가 `UIEquipmentFilters.sortBy` 좁힘 + URL 화이트리스트 검증을 결빙한 패턴을 7 도메인에 mirror. 각 도메인 backend `<Domain>SortField` / `<Domain>SortValue`를 import하여 frontend filter type 좁히고 URL parser에서 화이트리스트 검증.

**변경 파일 (7 도메인):**
1. `apps/frontend/lib/utils/checkout-filter-utils.ts` — `UICheckoutFilters.sort?: string` 또는 동등 필드 → `CheckoutSortValue` (또는 `sortBy: CheckoutSortField` + `sortOrder: SortDirection` 분해, 도메인 기존 패턴에 맞춤).
2. `apps/frontend/lib/utils/team-filter-utils.ts` — `UITeamFilters` sort 필드 → `TeamSortValue`.
3. `apps/frontend/lib/utils/calibration-filter-utils.ts` — `CalibrationSortValue`.
4. `apps/frontend/lib/utils/non-conformances-filter-utils.ts` — `NonConformanceSortValue`.
5. `apps/frontend/lib/utils/notification-filter-utils.ts` — `NotificationSortValue`.
6. `apps/frontend/lib/utils/software-filter-utils.ts` — `TestSoftwareSortValue`.
7. (필요 시 추가 — Generator 발견 도메인) `audit-log-filter-utils.ts` 등 — `as XxxSortValue` cast가 있으면 좁힘.

**각 파일에서 동일 변경 패턴:**
- type field `sort: string` / `sortBy: string` → SSOT 좁힘 type
- URL parser (`parseXxxFiltersFromSearchParams`) 에서 `(SORT_FIELDS as readonly string[]).includes(raw)` 화이트리스트 검증 추가 (r2 equipment 패턴 1:1 미러)
- `as XxxSortValue` cast 0건 (좁힘 type으로 타입 자동 추론)

**검증:**
```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run test
grep -rnE "as Checkout(SortValue|SortField)" apps/frontend/  # 0 hits
grep -rnE "as Team(SortValue|SortField)" apps/frontend/  # 0 hits
grep -rnE "as Calibration(SortValue|SortField)" apps/frontend/  # 0 hits
grep -rnE "as NonConformance(SortValue|SortField)" apps/frontend/  # 0 hits
grep -rnE "as Notification(SortValue|SortField)" apps/frontend/  # 0 hits
grep -rnE "as TestSoftware(SortValue|SortField)" apps/frontend/  # 0 hits
```

**의존:** 없음 (Phase 3와 병렬 가능).

---

### Phase 5: calibration.methods frontend filter UI 노출 (D-3)

**목표:** Round 2 backend service가 `calibration.methods` 필터를 적용했지만 (commit `5bc68ebd`) frontend filter UI 미노출. UL-QP-18 외부교정/자체점검/비대상 분류별 조회를 사용자 가시화. type 추가는 Phase 2에서 처리, 본 phase는 UI toggle만.

**변경 파일:**
1. `apps/frontend/components/calibration/calibration-filters.tsx` (또는 동등 filter component) — ToggleGroup 또는 Checkbox group으로 외부교정/자체점검/비대상 multi-select. design-token + a11y 준수 (`aria-label`, `role="group"`).
2. `apps/frontend/lib/i18n/messages/ko/calibration.json` + `en/calibration.json` — 새 라벨 키 추가 (`filter.method.external` / `filter.method.self` / `filter.method.exempt` 또는 기존 enum 라벨 재사용).
3. `apps/frontend/lib/utils/calibration-filter-utils.ts` — `UICalibrationFilters.methods?: ManagementMethod[]` 추가 + URL serialize/deserialize.
4. `apps/frontend/components/calibration/calibration-filters.test.tsx` (있는 경우) 또는 신규 — methods toggle 동작 1+ test case.

**검증:**
```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run test
grep -c "methods" apps/frontend/lib/utils/calibration-filter-utils.ts  # ≥ 1
grep -rnE "filter\.method\.(external|self|exempt)" apps/frontend/lib/i18n/messages/  # ≥ 6 (ko + en)
```

**의존:** Phase 2 (CalibrationQuery.methods 타입).

---

### Phase 6: real-backend e2e — bulk action mutateAsync UX (D-2)

**목표:** 옵션 A의 mutateAsync 전환이 RTL spec 7 cases (mock-only)만 검증. real-backend e2e 추가 — AlertDialog가 200ms+ pending 동안 열린 상태 유지 + 성공 시 close + reject 시 dialog 유지.

**변경 파일:**
1. `apps/frontend/tests/e2e/checkouts/bulk-action-mutateAsync.spec.ts` — 신규. playwright-e2e SSOT 패턴: storageState fixture + loginAs(actor) + checkout fixture 생성 → bulk select → bulk approve/reject 클릭 → AlertDialog visibility assertion (200ms 가짜 지연 위해 `page.route` mock 또는 실제 backend latency 의존). **권장**: 실제 backend latency (개발 환경 ~50-200ms)에 의존하되, `await expect(dialog).toBeVisible()` 후 즉시 `await page.waitForResponse(/checkouts.*bulk/i)` 로 timing 확정.
2. (만약 verify-e2e Step 추가 필요 시) `.claude/skills/verify-e2e/SKILL.md` — Step 추가 (Round 3 SKILL 업데이트 일환, manage-skills 자동).

**Spec 케이스 (3 minimum):**
- (a) bulk approve 성공: dialog visible during pending (`page.waitForResponse` 동기) + dialog hidden after success.
- (b) bulk reject 성공: 동일 패턴.
- (c) bulk approve 실패 (예: 권한 없음 또는 conflict): dialog visible + remains visible after error response + error message 표시.

**검증:**
```bash
pnpm --filter frontend run test:e2e -- bulk-action-mutateAsync
ls apps/frontend/tests/e2e/checkouts/bulk-action-mutateAsync.spec.ts  # 존재
grep -cE "waitForResponse|toBeVisible" apps/frontend/tests/e2e/checkouts/bulk-action-mutateAsync.spec.ts  # ≥ 6
```

**의존:** 없음 (실제 backend mutateAsync 코드는 r2 sprint45에서 이미 결빙).

---

### Phase 7: calibration.service sql-shape spec — methods filter 회귀 차단 (D-2)

**목표:** Round 2가 `calibration.service.findAll` 의 methods filter (~14 lines) 추가. 현재는 typed destructure + DTO validation 4 cases로만 보호. checkouts.service.sql-shape.spec.ts 패턴을 calibration에 mirror.

**변경 파일:**
1. `apps/backend/src/modules/calibration/__tests__/calibration.service.sql-shape.spec.ts` — 신규. `createMockDrizzle()` + `renderSQL` SSOT 재사용. checkouts spec 1:1 미러.
2. (필요 시) `apps/backend/src/common/testing/mock-providers.ts` — calibration service deps mock helper 추가 (이미 있다면 재사용).

**Spec 케이스 (4 minimum):**
- (a) methods=`['external']` → SQL에 `equipment.management_method IN ($1)` + params `['external']`.
- (b) methods=`['external','self']` → 2 params.
- (c) methods=undefined → methods 조건 없음 (다른 조건만).
- (d) methods=`['exempt']` → 1 param.

**검증:**
```bash
pnpm --filter backend run test -- calibration.service.sql-shape
ls apps/backend/src/modules/calibration/__tests__/calibration.service.sql-shape.spec.ts  # 존재
grep -cE "renderSQL|createMockDrizzle" apps/backend/src/modules/calibration/__tests__/calibration.service.sql-shape.spec.ts  # ≥ 2
```

**의존:** 없음.

---

### Phase 8: report-query export schema spec coverage 보강 (D-3)

**목표:** Round 2가 4개 export schema (utilization/availability/maintenance/team-equipment-usage) spec 추가. 나머지 3개 export pipe (exportEquipmentUsage / exportTeamEquipment / exportMaintenance) spec 추가로 회귀 차단 표면 완성.

**변경 파일:**
1. `apps/backend/src/modules/reports/__tests__/report-query-validation.spec.ts` — 기존 spec 확장. exportEquipmentUsage / exportTeamEquipment / exportMaintenance 각각 4+ cases (sort enum allowlist accept/reject + 자유 텍스트 trim/max + CSV LONG_CSV boundary).

**Spec 케이스 (3 schema × 4 cases = 12 minimum):**
- 각 schema: (a) 정상 input → success, (b) sort enum invalid → reject, (c) trim+max accept 경계, (d) trim+max reject 경계+1.

**검증:**
```bash
pnpm --filter backend run test -- report-query-validation
grep -cE "exportEquipmentUsage|exportTeamEquipment|exportMaintenance" apps/backend/src/modules/reports/__tests__/report-query-validation.spec.ts  # ≥ 18 (이미 16이므로 +2 이상)
grep -c "it\(" apps/backend/src/modules/reports/__tests__/report-query-validation.spec.ts  # ≥ 기존 + 12
```

**의존:** 없음.

---

### Phase 9: 시니어 자기검토 라운드 #2 (commit 후 시스템 회귀 검토)

**목표:** Phase 1-8 PASS 후 사용자 명시 "타협 X / 누락 X" 표준 따라 시스템 횡적 자기검토:
- (a) Phase 4가 7 도메인 좁혔지만 다른 도메인 (예: `audit-log-filter-utils`, `reports-filter-utils`) 회귀? 자체 SortValue 보유 여부 확인.
- (b) Phase 1 helper `toCsvParam` 의 다른 잠재 호출자 (예: `equipment-api.ts` 의 `excludeIds` 등) 발견 시 migration.
- (c) backend equipment-import legacy `sortBy`/`sortOrder` fallback 제거 가능성 (frontend hard-cut 후 dead code) — 본 sprint MUST에는 포함하지 않으나 tech-debt 분리 등록.
- (d) verify-zod / verify-ssot / verify-frontend-state SKILL Step 추가 필요성 — manage-skills로 자동 판단.
- (e) MEMORY.md 항목 추가 — 본 sprint slug + 핵심 패턴 한 줄.

**변경 파일 (조건부):**
1. `.claude/skills/verify-zod/SKILL.md` — Step 21 (frontend csv normalization SSOT 회귀 grep) 추가 가능성.
2. `.claude/skills/verify-frontend-state/SKILL.md` — Step (sort field narrowing 회귀 grep) 추가 가능성.
3. `~/.claude/projects/-home-kmjkds-equipment-management-system/memory/MEMORY.md` — 본 sprint 항목 + 새 패턴 한 줄.
4. `.claude/exec-plans/tech-debt-tracker.md` — round #2 발견 항목 등록.
5. `.claude/contracts/REGISTRY.md` — Active → Completed 이동.
6. `.claude/exec-plans/active/2026-05-07-query-r3-closure.md` → `completed/`.
7. `.claude/contracts/query-r3-closure.md` → `completed/`.

**검증:**
```bash
# 라운드 #2 발견 항목 0건이면 그대로 closure. 발견 시 추가 commit.
pnpm tsc --noEmit
pnpm --filter backend run lint
pnpm --filter frontend run lint
pnpm --filter backend run test
pnpm --filter frontend run test
```

**의존:** Phase 1-8 모두 PASS.

---

## 전체 변경 파일 요약

### 신규 생성 (~10 파일)
| 파일 | 목적 |
|------|------|
| `apps/frontend/lib/api/query-csv.ts` | CSV 정규화 SSOT helper (`toCsvParam`) |
| `apps/frontend/lib/api/query-csv.test.ts` | helper unit spec |
| `apps/frontend/tests/e2e/checkouts/bulk-action-mutateAsync.spec.ts` | real-backend e2e for mutateAsync UX |
| `apps/backend/src/modules/calibration/__tests__/calibration.service.sql-shape.spec.ts` | calibration methods SQL-shape 회귀 차단 |
| (조건부) `.claude/skills/verify-zod/SKILL.md` Step 21 추가 | (Phase 9 결정 시) |
| (조건부) calibration filter UI 신규 component | (기존 component 확장이면 신규 없음) |

### 수정 (~20 파일)
| 파일 | 변경 의도 |
|------|----------|
| `apps/frontend/lib/api/teams-api.ts` | `TeamQuery.ids` 타입 격상 + helper 경유 |
| `apps/frontend/lib/api/users-api.ts` | `UserQuery.teams` 등 타입 격상 + helper 경유 |
| `apps/frontend/lib/api/calibration-api.ts` | `CalibrationQuery.methods` 신규 필드 + (csv면 helper 경유) |
| `apps/frontend/lib/api/equipment-import-api.ts` | sortBy/sortOrder hard-cut → 결합형 sort |
| `apps/frontend/lib/utils/checkout-filter-utils.ts` | sort field narrowing |
| `apps/frontend/lib/utils/team-filter-utils.ts` | sort field narrowing |
| `apps/frontend/lib/utils/calibration-filter-utils.ts` | sort field narrowing + methods 필드 |
| `apps/frontend/lib/utils/non-conformances-filter-utils.ts` | sort field narrowing |
| `apps/frontend/lib/utils/notification-filter-utils.ts` | sort field narrowing |
| `apps/frontend/lib/utils/software-filter-utils.ts` | sort field narrowing |
| `apps/frontend/components/calibration/calibration-filters.tsx` | methods toggle UI |
| `apps/frontend/lib/i18n/messages/ko/calibration.json` | methods 라벨 |
| `apps/frontend/lib/i18n/messages/en/calibration.json` | methods 라벨 (i18n parity) |
| `apps/backend/src/modules/reports/__tests__/report-query-validation.spec.ts` | 3 export schema spec 추가 |
| (조건부) equipment-imports 호출 컴포넌트 | sortBy/sortOrder → sort prop 변경 (tsc가 자동 발견) |
| (조건부) `apps/frontend/lib/utils/equipment-import-filter-utils.ts` | 동일 |
| (조건부) `apps/frontend/lib/utils/audit-log-filter-utils.ts` 외 | round #2 발견 시 |
| `.claude/exec-plans/tech-debt-tracker.md` | 7 LOW 항목 closure mark + round #2 발견 항목 등록 |
| `.claude/contracts/REGISTRY.md` | Active → Completed 이동 |
| `~/.claude/projects/.../MEMORY.md` | 본 sprint 항목 추가 |

---

## 의사결정 로그

- **2026-05-07**: 7 LOW 통합 단일 sprint 결정 — 7 항목이 모두 r2 closure 후속 + 단일 도메인 (Query DTO + frontend filter)이라 sprint 분할 시 의존 그래프 복잡 + 각 항목 단독 sprint는 setup overhead 과다.
- **2026-05-07**: equipment-import sort hard-cut 채택 — backend dual-accept window는 frontend migration이 short-lived이므로 불필요. legacy fallback 제거는 후속 sprint로 분리 (본 sprint scope 차단).
- **2026-05-07**: calibration.methods UI 노출은 별도 컴포넌트 신설 없이 기존 calibration filter 확장 — surgical 원칙 + 사용자 가시화 가치 확보.
- **2026-05-07**: e2e mutateAsync는 real-backend 의존 (mock route 회피) — verify-e2e SKILL 패턴 + 실제 latency 검증이 본 debt의 본질.
- **2026-05-07**: 시니어 자기검토 라운드 #2를 Phase 9로 명시 — feedback_repeated_self_audit + feedback_evaluator_pass_senior_self_audit 학습 반영.

---

## 위험 / 블로커

| 위험 | 영향 | 완화 |
|------|------|------|
| Phase 3 hard-cut으로 frontend backward incompat | URL `?sortBy=&sortOrder=` 북마크 사용자 영향 | backend가 r2에서 legacy fallback 보유 — Phase 3 후에도 동작. frontend hard-cut만 적용. |
| Phase 4 7 도메인 동시 좁히기 → 컴포넌트 회귀 위험 | ~10 컴포넌트 prop type 변경 | tsc가 자동 발견 + Phase 4 검증 명령에 component test 포함. |
| Phase 5 i18n parity (ko + en) | 누락 시 verify-i18n FAIL | 검증 명령에 ko + en 둘 다 grep 카운트. |
| Phase 6 e2e flake (real-backend latency 의존) | CI 불안정 | `page.waitForResponse`로 timing 동기화 — flake 차단. |
| Phase 7 sql-shape spec — calibration mock setup overhead | spec 작성 시간 | checkouts.service.sql-shape.spec.ts 패턴 1:1 복사 — 신규 mock 헬퍼 작성 최소화. |

**블로커**: 없음. Generator 즉시 시작 가능.
