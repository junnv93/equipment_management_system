# Contract — query-dto-validation-ssot

**Slug**: `query-dto-validation-ssot`
**Mode**: 2 (Planner → Generator → Evaluator loop)
**Plan**: `.claude/exec-plans/active/2026-05-05-query-dto-validation-ssot.md`
**Created**: 2026-05-05

---

## MUST (필수 — 1건 FAIL = Generator iteration)

### M-1. Build / Typecheck / Lint 전체 PASS

- `pnpm --filter @equipment-management/schemas run build` exit 0
- `pnpm --filter @equipment-management/shared-constants run build` exit 0
- `pnpm --filter backend run tsc --noEmit` exit 0
- `pnpm --filter frontend run tsc --noEmit` exit 0
- `pnpm --filter backend run lint` exit 0
- `pnpm build` exit 0 (전체)

### M-2. Test 회귀 0건

- `pnpm --filter backend run test` exit 0 (기존 + 신규 12 spec)
- `pnpm --filter backend run test:e2e` exit 0 (sort 관련 e2e 회귀 0)
- `pnpm --filter frontend run test` exit 0 (filter SSOT 회귀 0)

### M-3. SSOT scaffolding 신설 완료

- 파일 존재: `packages/schemas/src/utils/fields.ts` 내 `optionalTrimmedString` export
  - `grep -c "export function optionalTrimmedString" packages/schemas/src/utils/fields.ts` ≥ 1
- 파일 존재: `packages/schemas/src/sort/_shared.ts` (`buildSortEnum`, `parseSortValue`, `SORT_DIRECTION_VALUES`)
  - `grep -c "export function buildSortEnum\|export function parseSortValue" packages/schemas/src/sort/_shared.ts` ≥ 2
- per-domain sort enum 11개 + equipment-sort 1개 = 12개:
  - `ls packages/schemas/src/sort/ | grep -E '^(checkout|calibration|non-conformance|test-software|calibration-factor|software-validation|cable|team|user|notification|equipment)-sort\.ts$' | wc -l` ≥ 11
- barrel export: `packages/schemas/src/sort/index.ts` 존재 + `packages/schemas/src/index.ts`에서 `export * from './sort'`
  - `grep -c "export \* from './sort'" packages/schemas/src/index.ts` ≥ 1

### M-4. VALIDATION_RULES SSOT 신설

- `packages/shared-constants/src/validation-rules.ts` 내 `LONG_CSV_MAX_LENGTH: 1000` 추가
  - `grep -c "LONG_CSV_MAX_LENGTH" packages/shared-constants/src/validation-rules.ts` ≥ 1
- 기존 `EXTENDED_TEXT_MAX_LENGTH: 200` 보존 (변경 금지)
  - `grep -c "EXTENDED_TEXT_MAX_LENGTH:\s*200" packages/shared-constants/src/validation-rules.ts` ≥ 1

### M-5. Query DTO 자유 텍스트 마이그레이션 완료 (모두 `optionalTrimmedString` 경유)

**Grep invariant 1 — 자유 텍스트 optional 잔존 0건**:
```bash
grep -rn "z\.string()\.optional()" apps/backend/src/modules/*/dto/*-query.dto.ts \
  | grep -v "optionalTrimmedString"
```
**expected**: 0 hits

**예외 (audit/reports 도메인 — 본 sprint 범위 외)**:
- `apps/backend/src/modules/audit/dto/audit-log-query.dto.ts` (startDate, endDate, cursor)
- `apps/backend/src/modules/reports/dto/report-query.dto.ts` (status, period, ...)

**검증 명령에서 위 두 파일은 grep 패턴에 자동 미포함** (`*/dto/*-query.dto.ts` 와일드카드는 11 도메인만 매칭):
- 위 두 파일 패턴은 `*-query.dto.ts` 매칭되어 grep 결과에 잡힐 수 있음 → **Generator는 audit/reports를 본 sprint 범위에서 제외**. M-5 grep 결과에서 위 두 파일 line이 나오면 SHOULD로 격하 (tech-debt 분리, M-5 PASS).

**도메인별 DTO 변경 확인** (각 ≥ 1 hit):
- `grep -c "optionalTrimmedString" apps/backend/src/modules/test-software/dto/test-software-query.dto.ts` ≥ 2 (search, manufacturer)
- `grep -c "optionalTrimmedString" apps/backend/src/modules/calibration/dto/calibration-query.dto.ts` ≥ 5 (statuses, methods, calibrationAgency, search, isPassed)
- `grep -c "optionalTrimmedString" apps/backend/src/modules/checkouts/dto/checkout-query.dto.ts` ≥ 7 (statuses, destination, checkoutFrom, checkoutTo, returnFrom, returnTo, search)
- `grep -c "optionalTrimmedString" apps/backend/src/modules/non-conformances/dto/non-conformance-query.dto.ts` ≥ 1 (search)
- `grep -c "optionalTrimmedString" apps/backend/src/modules/notifications/dto/notification-query.dto.ts` ≥ 2 (search, recipientSite)
- `grep -c "optionalTrimmedString" apps/backend/src/modules/calibration-factors/dto/calibration-factor-query.dto.ts` ≥ 1 (search)
- `grep -c "optionalTrimmedString" apps/backend/src/modules/teams/dto/team-query.dto.ts` ≥ 2 (ids, search)
- `grep -c "optionalTrimmedString" apps/backend/src/modules/users/dto/user-query.dto.ts` ≥ 6 (email, name, roles, teams, department, search)
- `grep -c "optionalTrimmedString" apps/backend/src/modules/equipment-imports/dto/equipment-import-query.dto.ts` ≥ 1 (search)
- `grep -c "optionalTrimmedString" apps/backend/src/modules/cables/dto/cable-query.dto.ts` ≥ 1 (search)
- `grep -c "optionalTrimmedString" packages/schemas/src/equipment.ts` ≥ 3 (search, location, manufacturer)

### M-6. Sort enum 전면 적용

**Grep invariant 2 — `sort: z.string()` 잔존 0건**:
```bash
grep -rnE "sort:\s*z\.string\(\)" apps/backend/src/modules/*/dto/*-query.dto.ts \
  packages/schemas/src/equipment.ts
```
**expected**: 0 hits

**Grep invariant 3 — 각 DTO가 도메인 SortEnum import**:
- `grep -c "CheckoutSortEnum\|CheckoutSortValue" apps/backend/src/modules/checkouts/dto/checkout-query.dto.ts` ≥ 1
- `grep -c "CalibrationSortEnum\|CalibrationSortValue" apps/backend/src/modules/calibration/dto/calibration-query.dto.ts` ≥ 1
- `grep -c "NonConformanceSortEnum\|NonConformanceSortValue" apps/backend/src/modules/non-conformances/dto/non-conformance-query.dto.ts` ≥ 1
- `grep -c "TestSoftwareSortEnum\|TestSoftwareSortValue" apps/backend/src/modules/test-software/dto/test-software-query.dto.ts` ≥ 1
- `grep -c "CalibrationFactorSortEnum\|CalibrationFactorSortValue" apps/backend/src/modules/calibration-factors/dto/calibration-factor-query.dto.ts` ≥ 1
- `grep -c "SoftwareValidationSortEnum\|SoftwareValidationSortValue" apps/backend/src/modules/software-validations/dto/validation-query.dto.ts` ≥ 1
- `grep -c "CableSortEnum\|CableSortValue" apps/backend/src/modules/cables/dto/cable-query.dto.ts` ≥ 1
- `grep -c "TeamSortEnum\|TeamSortValue" apps/backend/src/modules/teams/dto/team-query.dto.ts` ≥ 1
- `grep -c "UserSortEnum\|UserSortValue" apps/backend/src/modules/users/dto/user-query.dto.ts` ≥ 1
- `grep -c "NotificationSortEnum\|NotificationSortValue" apps/backend/src/modules/notifications/dto/notification-query.dto.ts` ≥ 1
- `grep -c "EquipmentSortEnum\|EquipmentSortValue" packages/schemas/src/equipment.ts` ≥ 1

### M-7. Service mapper SSOT 신설 (11개)

**Grep invariant 4 — `satisfies Record<XxxSortField, PgColumn>` 패턴 11개**:
```bash
grep -rnE "satisfies Record<\w+SortField, PgColumn>" apps/backend/src/modules/*/utils/*-sort-mapper.ts | wc -l
```
**expected**: ≥ 11

**파일 존재**:
- `apps/backend/src/modules/checkouts/utils/checkout-sort-mapper.ts`
- `apps/backend/src/modules/calibration/utils/calibration-sort-mapper.ts`
- `apps/backend/src/modules/non-conformances/utils/non-conformance-sort-mapper.ts`
- `apps/backend/src/modules/test-software/utils/test-software-sort-mapper.ts`
- `apps/backend/src/modules/calibration-factors/utils/calibration-factor-sort-mapper.ts`
- `apps/backend/src/modules/software-validations/utils/software-validation-sort-mapper.ts`
- `apps/backend/src/modules/cables/utils/cable-sort-mapper.ts`
- `apps/backend/src/modules/teams/utils/team-sort-mapper.ts`
- `apps/backend/src/modules/users/utils/user-sort-mapper.ts`
- `apps/backend/src/modules/notifications/utils/notification-sort-mapper.ts`
- `apps/backend/src/modules/equipment/utils/equipment-sort-mapper.ts`

### M-8. Service ORDER BY 인라인 sort 패턴 제거

**Grep invariant 5 — 인라인 `sort.split('.')` 잔존 0건 (단, mapper 내부 `parseSortValue` 호출은 제외)**:
```bash
grep -rn "sort\.split\|query\.sort\.split" apps/backend/src/modules/*.service.ts apps/backend/src/modules/*/services/*.service.ts 2>/dev/null \
  | grep -v "// "
```
**expected**: 0 hits (모두 `resolveXxxOrderBy(query.sort)` mapper 호출로 치환)

**예외**:
- `apps/backend/src/common/utils/sort.ts` `parseSortString` 헬퍼 — 본 sprint에서 제거 또는 deprecated 표시 (UsersService에서만 사용 중이었으므로 mapper 흡수 후 unused 가능)

### M-9. 신규 spec 12개 (per-DTO 11 + sort enum unit 1)

**파일 존재**:
- `apps/backend/src/modules/test-software/__tests__/test-software-query-validation.spec.ts`
- `apps/backend/src/modules/calibration/__tests__/calibration-query-validation.spec.ts`
- `apps/backend/src/modules/checkouts/__tests__/checkout-query-validation.spec.ts`
- `apps/backend/src/modules/non-conformances/__tests__/non-conformance-query-validation.spec.ts`
- `apps/backend/src/modules/notifications/__tests__/notification-query-validation.spec.ts`
- `apps/backend/src/modules/calibration-factors/__tests__/calibration-factor-query-validation.spec.ts`
- `apps/backend/src/modules/teams/__tests__/team-query-validation.spec.ts`
- `apps/backend/src/modules/users/__tests__/user-query-validation.spec.ts`
- `apps/backend/src/modules/equipment-imports/__tests__/equipment-import-query-validation.spec.ts` (또는 기존 spec 확장)
- `apps/backend/src/modules/cables/__tests__/cable-query-validation.spec.ts` (또는 기존 cable-dto-validation.spec.ts 확장)
- `apps/backend/src/modules/software-validations/__tests__/validation-query.spec.ts`
- `packages/schemas/src/sort/__tests__/sort-enum.spec.ts` (또는 backend 측 spec)

**케이스 매트릭스 (각 spec 필수 케이스)**:
- (a) trim → accept (max 정확히): N자 → success === true
- (b) trim → reject (max + 1): N+1자 → success === false
- (c) whitespace only → undefined: `'   '` → success === true && data.X === undefined
- (d) surrounding whitespace → trimmed: `'  값  '` → success === true && data.X === '값'
- (e) sort allowlist accept (≥ 4 valid combined values per domain)
- (f) sort enum reject (≥ 3 invalid: unknown field, invalid dir, sql injection 시도, case-mismatch)
- (g) (CSV 보유 도메인만) CSV LONG_CSV_MAX_LENGTH 경계 accept (1000자) + reject (1001자)

**spec 케이스 카운트**:
- `grep -c "it\(" apps/backend/src/modules/*/__tests__/*-query-validation.spec.ts | awk -F: '{sum+=$2} END {print sum}'` ≥ 80

### M-10. verify-zod skill Step 20 추가

- `.claude/skills/verify-zod/SKILL.md` 내 `### Step 20:` 추가
  - `grep -c "### Step 20:" .claude/skills/verify-zod/SKILL.md` ≥ 1
- Output Format 표에 row 14 (Step 20) 추가:
  - `grep -c "Step 20" .claude/skills/verify-zod/SKILL.md` ≥ 1
- Step 20 본문에 검증 명령 5개 모두 포함:
  - `grep -c "optionalTrimmedString\|XxxSortField\|XXX_SORT_COLUMN_MAP\|sort:.*z\.string\|satisfies Record" .claude/skills/verify-zod/SKILL.md` ≥ 4

### M-11. SSOT 위반 0건 (시스템 횡적)

- 하드코딩 max length 0건: `grep -rnE '\.max\(\s*[0-9]+\s*[,)]' apps/backend/src/modules/*/dto/*-query.dto.ts | grep -v "VALIDATION_RULES\|MAX_PAGE_SIZE\|//"` = 0
- `z.string().uuid(` 사용 0건 (verify-zod Step 18 회귀): `grep -rn "z\.string()\.uuid(" apps/backend/src/modules/*/dto/*-query.dto.ts` = 0
- 인라인 `code: '[A-Z_]+'` 0건 (verify-zod Step 16 회귀): `grep -rn "code: '[A-Z_]\+'" apps/backend/src/modules/*/dto/*-query.dto.ts` = 0
- 신규 mapper 파일에 `any` 0건: `grep -rn ":\s*any\b\|<any>" apps/backend/src/modules/*/utils/*-sort-mapper.ts` = 0

### M-12. Frontend 회귀 0건

- frontend tsc 통과 (M-1 포함)
- frontend filter SSOT 변경 0건: `git diff --stat apps/frontend/lib/utils/equipment-filter-utils.ts` 변경 없음 (또는 본 sprint와 무관한 변경만)
- frontend hooks `use-equipment.ts` / `use-checkouts.ts` 변경 없음

### M-13. Next.js 16 / React 19 deprecated API 0건

본 sprint는 backend 전용이지만 cross-check:
- `useFormState` 사용 0건 (≠ useActionState)
- `middleware.ts` 추가 0건 (≠ proxy.ts)
- 본 sprint의 신규/변경 파일에서 위 패턴 0건

### M-14. 문서 + 아카이브 (Phase 6 후)

- `.claude/contracts/REGISTRY.md` Active 섹션에 `query-dto-validation-ssot` 추가
- 평가 통과 후:
  - `.claude/exec-plans/active/2026-05-05-query-dto-validation-ssot.md` → `.claude/exec-plans/completed/`
  - `.claude/contracts/query-dto-validation-ssot.md` → `.claude/contracts/completed/`
  - REGISTRY.md Active → Completed 이동
- MEMORY.md `프로젝트 이력` 섹션에 항목 추가:
  - 슬러그 / 날짜 / 핵심 결정 (sort enum SSOT, optionalTrimmedString helper, mapper SoC) / 파일 수 / 테스트 수
- tech-debt-tracker.md `Open` 섹션에 신규 후속 작업 등록:
  - `csv-token-enum-validation` (MEDIUM)
  - `sort-rejection-telemetry` (LOW)
  - `audit-report-query-trim-max` (MEDIUM)

---

## SHOULD (권장 — FAIL 시 tech-debt 분리, loop 차단 안 함)

### S-1. parseSortString helper deprecation

- `apps/backend/src/common/utils/sort.ts` — `parseSortString`은 mapper 도입 후 unused. 옵션 (a) 삭제, (b) deprecated 주석. **(a) 채택**: 사용처 0건이면 즉시 삭제.
- 만약 외부 의존(테스트 등) 있으면 deprecated 주석 + tech-debt 등록.

### S-2. INDEXED_FIELDS 중복 SSOT 제거

- `apps/backend/src/modules/checkouts/checkouts.service.ts` `INDEXED_FIELDS` 배열 — `CHECKOUT_SORT_FIELDS`로 흡수.
- 미흡수 시 두 SSOT 동기화 필요 — 회귀 위험.

### S-3. Test name 한국어 통일 (기존 spec 패턴 미러)

- 신규 12 spec describe/it 텍스트는 한국어 + 영어 혼합 OK (기존 cable-dto-validation.spec.ts 패턴 미러).

### S-4. notifications/teams sort default 의도 검증

- notifications.service.ts: 현재 `desc(notifications.createdAt)` 하드코딩 — `resolveNotificationOrderBy` 도입 후 `NOTIFICATION_SORT_DEFAULT = { field: 'createdAt', direction: 'desc' }` 동일 동작 검증.
- teams.service.ts: 현재 `.orderBy(teamsTable.name)` (asc) — `TEAM_SORT_DEFAULT = { field: 'name', direction: 'asc' }` 동일.

### S-5. Equipment service sort 매핑 정확성 검증

- `apps/backend/src/modules/equipment/equipment.service.ts` 의 sort 처리 — 현재 어떻게 동작하는지 명시 (실제 sort 처리 코드 위치 미발견 — Generator가 확인 후 mapper 도입).

### S-6. OpenAPI/Swagger 자동 enum 노출

- DTO 클래스 `@ApiPropertyOptional({ enum: CheckoutSortEnum.options })` 추가 시 Swagger 자동 enum 표시. **권장**, 미적용 시 tech-debt 분리.

### S-7. equipment-imports DTO 일관성

- 이미 `sortBy` + `sortOrder` 분리 패턴 (`SortOrderEnum`) — 결정 A의 결합형과 다름. 본 sprint에서 강제 변환 불가 (frontend `?sortBy=&sortOrder=` 형식 의존).
- **결정**: equipment-imports는 기존 패턴 유지. 본 sprint M-6 grep invariant에서 자동 제외 (sortBy ≠ sort).
- search 필드만 `optionalTrimmedString` 적용.

### S-8. Spec name convention 통일

- 모든 spec 파일명 `*-query-validation.spec.ts`로 통일. 기존 `*-dto-validation.spec.ts` 패턴 (cable, calibration-factor 등)은 `*-query-validation.spec.ts` 별도 파일 권장 — 또는 기존 파일에 `describe('Query DTO trim/max + sort enum')` 블록 추가.

### S-9. ErrorCode SSOT 회귀 검증 (verify-zod Step 16)

- 본 sprint 변경 backend 파일에서 인라인 `code: 'X'` 0건 회귀 확인.

### S-10. Spec coverage threshold

- 신규 케이스 ≥ 100 (Phase 4 매트릭스 기준 ~120). 80 미달 시 tech-debt 분리.

---

## 검증 명령 요약 (Evaluator용)

```bash
# 1. Build / Test
pnpm build                                          # M-1
pnpm --filter backend run tsc --noEmit              # M-1
pnpm --filter frontend run tsc --noEmit             # M-1, M-12
pnpm --filter backend run lint                      # M-1
pnpm --filter backend run test                      # M-2
pnpm --filter backend run test:e2e                  # M-2
pnpm --filter frontend run test                     # M-2, M-12

# 2. SSOT 신설
grep -c "export function optionalTrimmedString" packages/schemas/src/utils/fields.ts
grep -c "export function buildSortEnum" packages/schemas/src/sort/_shared.ts
ls packages/schemas/src/sort/*-sort.ts | grep -v _shared | wc -l
grep -c "export \* from './sort'" packages/schemas/src/index.ts
grep -c "LONG_CSV_MAX_LENGTH" packages/shared-constants/src/validation-rules.ts

# 3. Query DTO 마이그레이션
grep -rn "z\.string()\.optional()" apps/backend/src/modules/*/dto/*-query.dto.ts \
  | grep -v "optionalTrimmedString\|audit-log-query\|report-query"  # M-5

grep -rnE "sort:\s*z\.string\(\)" apps/backend/src/modules/*/dto/*-query.dto.ts \
  packages/schemas/src/equipment.ts                                   # M-6

# 4. Mapper SSOT
grep -rnE "satisfies Record<\w+SortField, PgColumn>" apps/backend/src/modules/*/utils/*-sort-mapper.ts | wc -l   # M-7

grep -rn "sort\.split" apps/backend/src/modules/**/*.service.ts 2>/dev/null \
  | grep -v "// "                                   # M-8

# 5. Spec
ls apps/backend/src/modules/*/__tests__/*-query-validation.spec.ts | wc -l   # M-9
grep -c "it\(" apps/backend/src/modules/*/__tests__/*-query-validation.spec.ts | awk -F: '{sum+=$2} END {print sum}'  # M-9

# 6. verify-zod Step 20
grep -c "### Step 20:" .claude/skills/verify-zod/SKILL.md             # M-10

# 7. SSOT 회귀
grep -rnE '\.max\(\s*[0-9]+\s*[,)]' apps/backend/src/modules/*/dto/*-query.dto.ts | grep -v "VALIDATION_RULES\|MAX_PAGE_SIZE\|//"  # M-11
grep -rn "z\.string()\.uuid(" apps/backend/src/modules/*/dto/*-query.dto.ts                    # M-11
grep -rn "code: '[A-Z_]\+'" apps/backend/src/modules/*/dto/*-query.dto.ts                      # M-11
grep -rn ":\s*any\b\|<any>" apps/backend/src/modules/*/utils/*-sort-mapper.ts                  # M-11
```

---

## Iteration 종료 조건

1. **All MUST PASS**: 14/14 MUST 항목 통과
2. **SHOULD 평가**: PASS 권장. FAIL 항목은 tech-debt-tracker에 분리 등록 후 본 sprint는 클로즈.
3. **Phase 6 verification**: tsc + test + e2e + lint 모두 PASS.
4. **Archive**: REGISTRY 업데이트 + exec-plan/contract 이동 + MEMORY.md 갱신.
