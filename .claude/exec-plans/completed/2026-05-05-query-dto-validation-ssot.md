# Query DTO Validation SSOT — exec-plan

**Slug**: `query-dto-validation-ssot`
**Mode**: 2 (Planner → Generator → Evaluator loop)
**Source**: 사용자 명시 요청 — "Backend Query DTO trim/max + sort enum SSOT — 전면 적용 (시니어 표준)"
**Created**: 2026-05-05
**Author**: Harness Planner

---

## 1. 배경 (Why)

### 현재 상태 (실측)

`grep -rn 'z\.string()\.optional()' apps/backend/src/modules/*/dto/*-query.dto.ts` 결과 — 38건의 `z.string().optional()` 자유 텍스트 필드:

| 도메인 | 필드 | 라인 |
|--------|------|------|
| test-software | `search`, `manufacturer` | 20, 21 |
| calibration | `statuses`, `methods`, `calibrationAgency`, `isPassed`, `search` | 34, 35, 36, 41, 42 |
| checkouts | `statuses`, `destination`, `checkoutFrom`, `checkoutTo`, `returnFrom`, `returnTo`, `search` | 33–39 |
| non-conformances | `search` | 40 |
| notifications | `recipientSite`, `search` | 42, 50 |
| calibration-factors | `search` | 35 |
| teams | `ids`, `search` | 20, 21 |
| users | `email`, `name`, `roles`, `teams`, `department`, `search` | 13–21 |
| equipment-imports | `search` | 24 |
| cables | `search` | 7 |
| software-validations | (sort 외 자유 텍스트 없음 — sort만 처리) | — |
| **packages/schemas equipmentFilterSchema** | `search`, `location`, `manufacturer` | 155, 158, 159 |
| audit | `startDate`, `endDate`, `cursor` | 29, 30, 36 (날짜/cursor — 별도 정책) |
| reports | `status`, `period`, ... | 31, 84, 97, 107 (상태/기간 — 별도 정책) |
| calibration-plan | (자유 텍스트 없음) | — |

**11개 Query DTO + 1개 schemas 패키지 SSOT (`equipmentFilterSchema`) = 총 12개 schema 단위가 영향받음.**

### 11개 Query DTO에서 추가로 발견된 `sort: z.string()` (sort 검증 안전망 부재)

| 도메인 | 라인 | 현재 |
|--------|------|------|
| test-software | 26 | `z.string().optional()` |
| calibration | 47 | `z.string().default('calibrationDate.desc')` |
| checkouts | 40 | `z.string().optional()` |
| non-conformances | 41 | `z.string().optional()` |
| notifications | 58 | `z.string().default('createdAt.desc')` |
| calibration-factors | 40 | `z.string().optional()` |
| teams | 24 | `z.string().optional()` |
| users | 22 | `z.string().optional()` |
| cables | 11 | `z.string().optional()` |
| software-validations | 19 | `z.string().optional()` |
| equipment-imports | 25-29 | `z.enum([...]).default('createdAt')` (이미 enum, 본 sprint 검증 대상) |
| **packages/schemas equipmentFilterSchema** | 173 | `z.string().optional()` |

### 문제 (Risk)

1. **DoS 표면**: `z.string().optional()` 무제한 → 50KB+ payload가 메모리 통과 (파싱 후 버려져도 비용 발생).
2. **SQL injection 표면 (sort)**: `sort.split('.')` 후 service의 `switch (sortField)` blacklist만이 유일한 방어선. allowlist enum이 없어 새 필드 추가 시 서비스/DTO 동기화 누락 → unauthorized field가 default 분기로 떨어져 silent 의도치 않은 정렬.
3. **whitespace bypass**: `.trim()` 누락 → 공백만 입력해도 검증 통과 (verify-zod Step 12와 동일 issue 의 query 영역 미커버).
4. **시스템 비대칭**: c82ae0ef commit이 Create/Update DTO만 커버, Query DTO 미터치 → defense-in-depth 구멍.

### 명시된 사용자 요구사항

> 타협 X / 누락 X / 시니어 웹개발 표준 / 단편적 임시방편 X / 아키텍처 시스템 전반 / SSOT 준수 / 하드코딩 금지 / 워크플로/성능 / 옛날 API X / 완료 후 문서 + 아카이브.

---

## 2. 환경 검증 (Phase A 결과)

### Zod 버전 + 사용 패턴

- `packages/schemas/package.json`: `"zod": "workspace:*"` (root pnpm workspace) — 실제 버전: **Zod v4** (확인: `packages/schemas/src/utils/fields.ts` 헤더 주석 "Zod v4의 z.string().uuid()는 RFC 9562...").
- **Deprecated 패턴 회피**:
  - `z.string().uuid()` 직접 사용 금지 (verify-zod Step 18 — `uuidString()` SSOT 경유).
  - `z.preprocess` / `z.coerce` — 모두 v4에서 active. 동일 파일 내 혼용 금지(Step 6).
  - `z.enum([...])` v4 — 두번째 인자 옵션 객체 `{ message }` 형식 사용 (calibration-plan-query.dto.ts 참조).
  - `.refine` 사용 가능 (deprecated 아님).

### 기존 sort 처리 패턴 (실측)

- `apps/backend/src/common/utils/sort.ts` — `parseSortString(sortString) → { field, direction }` 헬퍼 존재 (users.service.ts에서만 사용). 다른 9개 service는 인라인 `sort.split('.')`.
- 9개 service의 sort 처리 패턴 분기:
  - **switch + named cases + default**: test-software, calibration, non-conformances, calibration-factors, software-validations, cables, checkouts, users
  - **if-else chain**: equipment-imports (이미 `z.enum`이라 안전)
- 모든 service가 `default → createdAt`/도메인 default로 fallback — allowlist 효과는 있으나 컴파일타임 강제 없음.

### 기존 SSOT 구성

- `packages/shared-constants/src/validation-rules.ts` — `EXTENDED_TEXT_MAX_LENGTH = 200` 존재.
- `packages/schemas/src/validation/messages.ts` — `VM.string.max(name, max)` / `VM.string.min(name, min)` / `VM.required(name)` 모두 존재.
- `packages/schemas/src/utils/fields.ts` — `uuidString` / `optionalUuid` / `nullableOptionalUuid` 헬퍼 위치. 새 helper 추가 위치 확정.
- `packages/schemas/src/enums/shared.ts` — `SORT_ORDER_VALUES` / `SortOrderEnum` 이미 존재 (asc/desc).
- `packages/schemas/src/enums/index.ts` — barrel re-export 패턴.

---

## 3. 아키텍처 결정 (Phase B)

### 결정 A — Sort enum 파일 구조: **per-domain + 단일 결합 enum (`'field.dir'`)**

**구조**:
```
packages/schemas/src/sort/
├── index.ts                     # barrel
├── checkout-sort.ts             # CheckoutSortEnum + CheckoutSortField + CheckoutSortDirection
├── calibration-sort.ts
├── non-conformance-sort.ts
├── test-software-sort.ts
├── calibration-factor-sort.ts
├── software-validation-sort.ts
├── cable-sort.ts
├── team-sort.ts
├── user-sort.ts
├── notification-sort.ts
├── equipment-sort.ts            # equipmentFilterSchema sort 격상
└── _shared.ts                   # buildSortEnum(fields) 팩토리 + parseSortValue
```

**enum 표현**:
```typescript
// packages/schemas/src/sort/_shared.ts
export const SORT_DIRECTION_VALUES = ['asc', 'desc'] as const;
export type SortDirection = (typeof SORT_DIRECTION_VALUES)[number];

/**
 * 도메인별 sort enum 빌더.
 * field 배열을 받아 `${field}.asc` / `${field}.desc` 결합형 z.enum 생성.
 *
 * @example
 *   const CheckoutSortEnum = buildSortEnum(['createdAt', 'checkoutDate', 'status']);
 *   // → z.enum(['createdAt.asc', 'createdAt.desc', 'checkoutDate.asc', ...])
 */
export function buildSortEnum<F extends readonly [string, ...string[]]>(
  fields: F
): z.ZodEnum<...> { /* ... */ }

export function parseSortValue<S extends string>(
  value: S
): { field: string; direction: SortDirection };
```

**예시 — checkout-sort.ts**:
```typescript
export const CHECKOUT_SORT_FIELDS = [
  'createdAt',
  'checkoutDate',
  'expectedReturnDate',
  'status',
  'requesterId',
  'approverId',
] as const;

export const CheckoutSortEnum = buildSortEnum(CHECKOUT_SORT_FIELDS);
export type CheckoutSortValue = z.infer<typeof CheckoutSortEnum>;
// = 'createdAt.asc' | 'createdAt.desc' | 'checkoutDate.asc' | ...

export type CheckoutSortField = (typeof CHECKOUT_SORT_FIELDS)[number];
```

**근거**:
1. **Surgical 원칙**: 기존 service 9개가 `sort.split('.')` 패턴이고 DTO도 단일 string `sort` 파라미터. `field` + `dir` 분리하면 모든 service 시그니처/캐시 키/필터 hash 변경 → scope 폭발.
2. **API 호환**: 프론트엔드 SearchParams 가 `?sort=name.asc` 형식으로 통합되어 있음 (필터 SSOT). 분리 시 query string 형식 breaking change.
3. **Type safety 동등**: 결합형이라도 `z.infer` 결과 유니언 리터럴 → 모든 valid 조합이 정적 검증됨. parseSortValue는 narrow된 enum만 받으므로 unknown field 불가능.

### 결정 B — Free-text query helper: **`optionalTrimmedString` SSOT 도입**

**위치**: `packages/schemas/src/utils/fields.ts` (uuidString 옆).

**시그니처**:
```typescript
/**
 * Optional + trim + max + 빈 문자열 → undefined 정규화.
 *
 * Query DTO 자유 텍스트 필드(search/manufacturer/destination 등)의 SSOT.
 * - HTML form `?search=` (빈 문자열) → undefined
 * - Whitespace bypass 차단 (`.trim()` 선행)
 * - DoS 차단 (`.max(maxLen)` 강제)
 *
 * @param maxLen - 허용 최대 길이 (필수 — 매직 넘버 강제 차단)
 * @param fieldNameForMessage - VM.string.max 메시지에 들어갈 필드명 (예: '검색어')
 *
 * @example
 *   import { optionalTrimmedString } from '@equipment-management/schemas';
 *   import { VALIDATION_RULES } from '@equipment-management/shared-constants';
 *   search: optionalTrimmedString(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH, '검색어'),
 */
export function optionalTrimmedString(maxLen: number, fieldNameForMessage: string) {
  return z
    .string()
    .trim()
    .max(maxLen, VM.string.max(fieldNameForMessage, maxLen))
    .transform((v) => (v === '' ? undefined : v))
    .optional();
}
```

**근거**:
1. **30+ call sites** — 인라인 `.string().trim().max(...)`은 패턴 중복.
2. **단일 진화점** — 향후 i18n parameterization, audit logging, 길이 정책 변경 단일 진입점.
3. **빈 문자열 정규화** — HTML form `?search=` (빈) → undefined: 기존 `optionalUuid`와 동일 시맨틱 통일.

### 결정 C — Sort 컬럼 매핑 위치: **service 모듈 내 `utils/<domain>-sort-mapper.ts`**

**근거**:
1. `packages/schemas`는 **runtime ORM column refs (drizzle `PgColumn`) 의존 금지** — schemas는 frontend도 import. drizzle import 시 frontend 번들에 ORM 코드 누출.
2. Schema = validation, Mapper = ORM coupling — **separation of concerns**.
3. Type safety는 `satisfies Record<CheckoutSortField, PgColumn>`로 컴파일타임 exhaustive 강제.

**예시 — apps/backend/src/modules/checkouts/utils/checkout-sort-mapper.ts**:
```typescript
import type { PgColumn } from 'drizzle-orm/pg-core';
import { checkouts } from '@equipment-management/db/schema';
import type { CheckoutSortField } from '@equipment-management/schemas';

export const CHECKOUT_SORT_COLUMN_MAP = {
  createdAt: checkouts.createdAt,
  checkoutDate: checkouts.checkoutDate,
  expectedReturnDate: checkouts.expectedReturnDate,
  status: checkouts.status,
  requesterId: checkouts.requesterId,
  approverId: checkouts.approverId,
} as const satisfies Record<CheckoutSortField, PgColumn>;

export const CHECKOUT_SORT_DEFAULT_FIELD: CheckoutSortField = 'createdAt';
export const CHECKOUT_SORT_DEFAULT_DIRECTION = 'desc';
```

`satisfies` 가 핵심 — `CHECKOUT_SORT_FIELDS` 변경 시 mapper에서 컴파일 에러 자동 발생.

### 결정 D — CSV-style 다중값 query 필드 (statuses/methods/roles/teams/ids/email/recipientSite)

**선택**: `.trim().max(VALIDATION_RULES.LONG_CSV_MAX_LENGTH).optional()` + `transform('' → undefined)` 적용. 토큰별 enum 검증은 service layer 위임 (점진 별도 sprint).

**신규 SSOT**: `VALIDATION_RULES.LONG_CSV_MAX_LENGTH = 1000` (`packages/shared-constants/src/validation-rules.ts`).

**근거**:
- `EXTENDED_TEXT_MAX_LENGTH = 200`은 단일 검색어 가정. 여러 status 토큰 (`'pending,borrower_approved,approved,rejected,checked_out,...'`) → 200 초과 가능.
- 1000자 = ~166개 status 토큰 (현실적 상한).
- 토큰별 enum 검증을 본 sprint에 포함하면 service signature 변경 + parsing 로직 변경 → scope 폭발. **Tech-debt에 분리** (`csv-token-enum-validation`).

### 결정 E — verify-zod 새 Step: **Step 20**

기존 Step 19(CAS)가 마지막. 새 invariant은 Step 20.

**Grep invariants**:
1. **자유 텍스트 optional**: `grep -rn "z\.string()\.optional()" apps/backend/src/modules/*/dto/*-query.dto.ts` → 0건 (예외: `optionalTrimmedString` 사용 시 제외).
2. **sort 단순 string**: `grep -rn "sort:\s*z\.string()" apps/backend/src/modules/*/dto/*-query.dto.ts apps/backend/src/modules/*/dto/equipment-query.dto.ts packages/schemas/src/equipment.ts` → 0건.
3. **`optionalTrimmedString` 도입 확인**: `grep -c "optionalTrimmedString" packages/schemas/src/utils/fields.ts` ≥ 1.
4. **per-domain sort enum 존재**: `ls packages/schemas/src/sort/*-sort.ts | wc -l` ≥ 11.
5. **mapper exhaustive 강제**: `grep -rn "satisfies Record<.*SortField" apps/backend/src/modules/*/utils/*-sort-mapper.ts | wc -l` ≥ 11.

---

## 4. Phase별 변경 (Phase C)

### Phase 1 — SSOT scaffolding (신규)

**파일 생성** (총 14개 신규):

1. `packages/shared-constants/src/validation-rules.ts` — `LONG_CSV_MAX_LENGTH: 1000` 추가 (수정).
2. `packages/schemas/src/utils/fields.ts` — `optionalTrimmedString(maxLen, fieldName)` 추가 (수정).
3. `packages/schemas/src/sort/_shared.ts` — `buildSortEnum`, `parseSortValue`, `SORT_DIRECTION_VALUES` (신규).
4. `packages/schemas/src/sort/index.ts` — barrel re-export (신규).
5. `packages/schemas/src/sort/checkout-sort.ts` (신규) — fields: `createdAt, checkoutDate, expectedReturnDate, status, requesterId, approverId` (기존 `INDEXED_FIELDS` 미러링).
6. `packages/schemas/src/sort/calibration-sort.ts` (신규) — fields: `calibrationDate, nextCalibrationDate, status, agencyName, equipmentName` (기존 service 매핑 미러).
7. `packages/schemas/src/sort/non-conformance-sort.ts` (신규) — fields: `discoveryDate, status, createdAt, updatedAt`.
8. `packages/schemas/src/sort/test-software-sort.ts` (신규) — fields: `name, managementNumber, testField, createdAt`.
9. `packages/schemas/src/sort/calibration-factor-sort.ts` (신규) — fields: `effectiveDate, requestedAt, createdAt`.
10. `packages/schemas/src/sort/software-validation-sort.ts` (신규) — fields: `testDate, status, createdAt`.
11. `packages/schemas/src/sort/cable-sort.ts` (신규) — fields: `managementNumber, lastMeasurementDate, createdAt`.
12. `packages/schemas/src/sort/team-sort.ts` (신규) — fields: `name, classification, createdAt`.
13. `packages/schemas/src/sort/user-sort.ts` (신규) — fields: `email, role, site, createdAt, updatedAt, name`.
14. `packages/schemas/src/sort/notification-sort.ts` (신규) — fields: `createdAt, priority`.
15. `packages/schemas/src/sort/equipment-sort.ts` (신규) — fields: `managementNumber, name, status, location, createdAt, lastCalibrationDate, nextCalibrationDate` (현재 equipment.service.ts 매핑 정확 미러).

**수정**:
- `packages/schemas/src/index.ts` — `export * from './sort';` 추가.

**검증**:
```bash
pnpm --filter @equipment-management/schemas run build  # 타입 검증
pnpm --filter @equipment-management/shared-constants run build
pnpm tsc -p packages/schemas/tsconfig.json --noEmit
```

### Phase 2 — Query DTO 마이그레이션 (11개)

각 DTO에 대해 동일한 패턴 적용:

**Before**:
```typescript
search: z.string().optional(),
sort: z.string().optional(),
statuses: z.string().optional(),
```

**After**:
```typescript
import { optionalTrimmedString, CheckoutSortEnum } from '@equipment-management/schemas';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';

search: optionalTrimmedString(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH, '검색어'),
sort: CheckoutSortEnum.optional(),
statuses: optionalTrimmedString(VALIDATION_RULES.LONG_CSV_MAX_LENGTH, '반출 상태 목록'),
```

**파일별 변경 (11개)**:

| # | 파일 | 자유텍스트 필드 | sort | 다중값(CSV) |
|---|------|----------------|------|-------------|
| 1 | `apps/backend/src/modules/test-software/dto/test-software-query.dto.ts` | `search`, `manufacturer` | `TestSoftwareSortEnum` | — |
| 2 | `apps/backend/src/modules/calibration/dto/calibration-query.dto.ts` | `calibrationAgency`, `search`, `isPassed` | `CalibrationSortEnum` (default 격상) | `statuses`, `methods` |
| 3 | `apps/backend/src/modules/checkouts/dto/checkout-query.dto.ts` | `destination`, `checkoutFrom`, `checkoutTo`, `returnFrom`, `returnTo`, `search` | `CheckoutSortEnum` | `statuses` |
| 4 | `apps/backend/src/modules/non-conformances/dto/non-conformance-query.dto.ts` | `search` | `NonConformanceSortEnum` | — |
| 5 | `apps/backend/src/modules/notifications/dto/notification-query.dto.ts` | `search`, `recipientSite` | `NotificationSortEnum` (default 격상) | — |
| 6 | `apps/backend/src/modules/calibration-factors/dto/calibration-factor-query.dto.ts` | `search` | `CalibrationFactorSortEnum` | — |
| 7 | `apps/backend/src/modules/teams/dto/team-query.dto.ts` | `search` | `TeamSortEnum` | `ids` |
| 8 | `apps/backend/src/modules/users/dto/user-query.dto.ts` | `email`, `name`, `department`, `search` | `UserSortEnum` | `roles`, `teams` |
| 9 | `apps/backend/src/modules/equipment-imports/dto/equipment-import-query.dto.ts` | `search` | (이미 enum) | — |
| 10 | `apps/backend/src/modules/cables/dto/cable-query.dto.ts` | `search` | `CableSortEnum` | — |
| 11 | `apps/backend/src/modules/software-validations/dto/validation-query.dto.ts` | (자유 텍스트 없음) | `SoftwareValidationSortEnum` | — |

**+1 packages/schemas equipmentFilterSchema** (`packages/schemas/src/equipment.ts` 라인 154-197):
- `search`, `location`, `manufacturer` → `optionalTrimmedString(EXTENDED_TEXT_MAX_LENGTH, ...)`.
- `sort` → `EquipmentSortEnum.optional()`.

**Field 명명 (한국어 message)**: 기존 i18n/Swagger 설명 라벨 재활용 (`'검색어'`, `'제조사'`, `'반출 상태 목록'`, `'반출지'`, `'팀 ID 목록'`, `'역할 목록'`, `'팀 목록'`, `'이메일'`, `'이름'`, `'부서'`, `'팀 ID 목록'`, `'위치'`, `'교정 기관'`, `'교정 합격 여부'`, `'수신자 사이트'`).

### Phase 3 — Service-layer sort mapper (11개 신규 + 11개 service 수정)

**신규 파일** (11개 mapper):
- `apps/backend/src/modules/checkouts/utils/checkout-sort-mapper.ts`
- `apps/backend/src/modules/calibration/utils/calibration-sort-mapper.ts`
- `apps/backend/src/modules/non-conformances/utils/non-conformance-sort-mapper.ts`
- `apps/backend/src/modules/test-software/utils/test-software-sort-mapper.ts`
- `apps/backend/src/modules/calibration-factors/utils/calibration-factor-sort-mapper.ts`
- `apps/backend/src/modules/software-validations/utils/software-validation-sort-mapper.ts`
- `apps/backend/src/modules/cables/utils/cable-sort-mapper.ts`
- `apps/backend/src/modules/teams/utils/team-sort-mapper.ts` (현재 service에 sort 처리 없음 — 신규 도입)
- `apps/backend/src/modules/users/utils/user-sort-mapper.ts` (기존 `UsersService.getSortColumn` 추출)
- `apps/backend/src/modules/notifications/utils/notification-sort-mapper.ts` (notifications는 현재 service에 sort 처리 없음 — 신규 도입 필요한지 검증 필요)
- `apps/backend/src/modules/equipment/utils/equipment-sort-mapper.ts`

**Mapper 패턴 (모두 동일)**:
```typescript
import type { PgColumn } from 'drizzle-orm/pg-core';
import { schema } from '@equipment-management/db/schema';
import {
  type CheckoutSortField,
  type SortDirection,
  parseSortValue,
} from '@equipment-management/schemas';
import type { SQL } from 'drizzle-orm';
import { asc, desc } from 'drizzle-orm';

export const CHECKOUT_SORT_COLUMN_MAP = {
  createdAt: schema.checkouts.createdAt,
  checkoutDate: schema.checkouts.checkoutDate,
  // ... (모든 field exhaustive)
} as const satisfies Record<CheckoutSortField, PgColumn>;

export const CHECKOUT_SORT_DEFAULT: { field: CheckoutSortField; direction: SortDirection } = {
  field: 'createdAt',
  direction: 'desc',
};

/**
 * sort enum value (예: `'createdAt.desc'`) → drizzle ORDER BY 절.
 * undefined → default 사용.
 */
export function resolveCheckoutOrderBy(sort: CheckoutSortValue | undefined): SQL {
  const { field, direction } = sort ? parseSortValue(sort) : CHECKOUT_SORT_DEFAULT;
  const column = CHECKOUT_SORT_COLUMN_MAP[field as CheckoutSortField];
  return direction === 'asc' ? asc(column) : desc(column);
}
```

**Service 수정** (11개):
각 service의 인라인 `sort.split('.')` 블록을 `resolveXxxOrderBy(query.sort)` 단일 호출로 치환. 하드코딩 default fallback 제거 (mapper의 `XXX_SORT_DEFAULT`로 통일).

**예시** — `checkouts.service.ts` 라인 605-643 (39 lines) → 1 line:
```typescript
// Before: 39 lines of switch + INDEXED_FIELDS check
// After:
const orderBy: SQL<unknown>[] = [resolveCheckoutOrderBy(query.sort)];
```

**예외 처리**:
- `checkouts.service.ts` `INDEXED_FIELDS` 배열 → mapper의 `CHECKOUT_SORT_FIELDS`로 흡수 (중복 SSOT 제거).
- `users.service.ts` `getSortColumn` static → mapper 함수로 이전.
- `notifications.service.ts` 현재 sort 처리 없음 — `notification-sort-mapper.ts` 신규 도입 + 기존 `desc(createdAt)` 위치를 `resolveNotificationOrderBy(query.sort)`로 격상.
- `teams.service.ts` 현재 `.orderBy(teamsTable.name)` 하드코딩 — `resolveTeamOrderBy(query.sort)`로 격상.

### Phase 4 — Spec coverage (12개 spec 신규/수정)

**11개 per-DTO spec** + **1개 sort enum unit spec**.

**Per-DTO spec 위치**: `apps/backend/src/modules/<domain>/__tests__/<domain>-query-validation.spec.ts` (또는 기존 `*-dto-validation.spec.ts` 확장).

**Spec 패턴 (4 케이스 per field)**:
```typescript
import { checkoutQuerySchema } from '../dto/checkout-query.dto';
import { VALIDATION_RULES } from '@equipment-management/shared-constants';
import { VM } from '@equipment-management/schemas';

describe('checkoutQuerySchema — Query DTO trim/max + sort enum (Phase 4)', () => {
  describe('search field — optionalTrimmedString', () => {
    it('trim → reject (N-1자, trim 후 비어 있어도 통과? — 빈 문자열 → undefined transform이라 통과)', () => {
      // 빈 문자열은 undefined 변환되어 통과 (이는 의도된 동작).
      // 진짜 reject 케이스는 max 초과.
    });

    it('trim → accept (N자, max 정확히 일치)', () => {
      const search = 'a'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH);
      const result = checkoutQuerySchema.safeParse({ search });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.search).toBe(search);
    });

    it('max + 1 → reject', () => {
      const search = 'a'.repeat(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH + 1);
      const result = checkoutQuerySchema.safeParse({ search });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          VM.string.max('검색어', VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH)
        );
      }
    });

    it('whitespace only → undefined (trim + transform)', () => {
      const result = checkoutQuerySchema.safeParse({ search: '   ' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.search).toBeUndefined();
    });

    it('surrounding whitespace → trimmed', () => {
      const result = checkoutQuerySchema.safeParse({ search: '  교정  ' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.search).toBe('교정');
    });
  });

  describe('sort field — CheckoutSortEnum allowlist', () => {
    it.each([
      'createdAt.asc', 'createdAt.desc', 'checkoutDate.asc', 'checkoutDate.desc',
      'expectedReturnDate.desc', 'status.asc', 'requesterId.asc', 'approverId.desc',
    ])('accepts valid combined value: %s', (sort) => {
      const result = checkoutQuerySchema.safeParse({ sort });
      expect(result.success).toBe(true);
    });

    it.each([
      'sqlinjection',
      'createdAt; DROP TABLE',
      'createdAt.invalidDir',
      'unknownField.asc',
      'createdAt.ASC',  // case-sensitive
    ])('rejects unauthorized value: %s', (sort) => {
      const result = checkoutQuerySchema.safeParse({ sort });
      expect(result.success).toBe(false);
    });
  });

  describe('CSV multi-value field — optionalTrimmedString(LONG_CSV_MAX_LENGTH)', () => {
    it('accepts comma-separated tokens up to LONG_CSV_MAX_LENGTH', () => {
      const statuses = 'a'.repeat(VALIDATION_RULES.LONG_CSV_MAX_LENGTH);
      const result = checkoutQuerySchema.safeParse({ statuses });
      expect(result.success).toBe(true);
    });

    it('rejects payload exceeding LONG_CSV_MAX_LENGTH', () => {
      const statuses = 'a'.repeat(VALIDATION_RULES.LONG_CSV_MAX_LENGTH + 1);
      const result = checkoutQuerySchema.safeParse({ statuses });
      expect(result.success).toBe(false);
    });
  });
});
```

**Sort enum unit spec**: `packages/schemas/src/sort/__tests__/sort-enum.spec.ts` — `buildSortEnum` + `parseSortValue` 단위 테스트.

### Phase 5 — verify-zod skill Step 20 추가

**File**: `.claude/skills/verify-zod/SKILL.md`

**위치**: Step 19 (CAS) 뒤에 Step 20 추가.

**Content**:
```markdown
### Step 20: Query DTO trim/max + sort enum SSOT 강제 (2026-05-05 추가)

**탐지 대상**: `*-query.dto.ts` 자유 텍스트 optional 필드의 `.trim()` / `.max()` 누락
+ `sort` 필드의 `z.string()` 사용 (allowlist 부재) — DoS + SQL 의도치 않은 정렬 위험.

**규칙**:
- 자유 텍스트 optional → `optionalTrimmedString(VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH, '<라벨>')` 또는 `optionalTrimmedString(VALIDATION_RULES.LONG_CSV_MAX_LENGTH, '...')` (CSV)
- `sort` 필드 → per-domain `XxxSortEnum.optional()` (`packages/schemas/src/sort/`)
- service ORDER BY → `XXX_SORT_COLUMN_MAP satisfies Record<XxxSortField, PgColumn>` (mapper SSOT)

**검증 명령**:
```bash
# 1. Query DTO 자유 텍스트 optional → optionalTrimmedString 미사용 탐지
grep -rn "z\.string()\.optional()" apps/backend/src/modules/*/dto/*-query.dto.ts \
  | grep -v "optionalTrimmedString"
# expected: 0 hits (자유 텍스트는 모두 SSOT 헬퍼 경유)

# 2. sort: z.string() 직접 사용 탐지 (allowlist 부재)
grep -rnE "sort:\s*z\.string\(\)" apps/backend/src/modules/*/dto/*-query.dto.ts \
  apps/backend/src/modules/equipment/dto/equipment-query.dto.ts \
  packages/schemas/src/equipment.ts
# expected: 0 hits

# 3. per-domain sort enum 파일 존재 (≥ 11)
ls packages/schemas/src/sort/*-sort.ts | grep -v _shared | wc -l
# expected: ≥ 11

# 4. mapper exhaustive satisfies 강제
grep -rn "satisfies Record<.*SortField" apps/backend/src/modules/*/utils/*-sort-mapper.ts | wc -l
# expected: ≥ 11

# 5. optionalTrimmedString SSOT 도입 확인
grep -c "export function optionalTrimmedString" packages/schemas/src/utils/fields.ts
# expected: ≥ 1
```

**PASS 기준**: 모두 expected 충족.
**FAIL 기준**: 하나라도 위반 시 즉시 수정.

**예외**:
- `audit-log-query.dto.ts` `cursor`, `startDate`, `endDate` — 별도 정책 (날짜 / pagination cursor)
- `report-query.dto.ts` — 별도 도메인 (status, period 등 보고서 전용 enum)
- `gallery-query.dto.ts` (inspection-form-templates) — 갤러리 전용 query (현재 자유 텍스트 미사용)
```

### Phase 6 — 최종 검증

```bash
# Build (전체)
pnpm build

# Type checking (전체)
pnpm tsc --noEmit
pnpm --filter backend run tsc --noEmit
pnpm --filter @equipment-management/schemas run build
pnpm --filter @equipment-management/shared-constants run build

# Lint
pnpm --filter backend run lint

# Tests (backend)
pnpm --filter backend run test
pnpm --filter backend run test:e2e

# verify-zod (manual run — Step 20 새 grep)
bash <verify-zod Step 20 commands>

# Frontend regression (sort 값이 frontend filter SSOT와 어긋나지 않는지)
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run test
```

---

## 5. 시니어 자기 감사 (Senior Self-Audit)

### L0 inferred (가정/검증 미완)

| 가정 | 검증 상태 | 미달 시 영향 |
|------|----------|--------------|
| 모든 11개 service의 sort 처리가 인라인 `sort.split('.')` 패턴 | ✅ 9/11 검증, equipment-imports는 enum 이미 사용, notifications/teams는 sort 처리 없음 | None |
| 프론트엔드 SearchParams `?sort=name.asc` 형식 의존 | ✅ verify-filters skill + filter SSOT 코드 — 결정 A로 보존 | None |
| `EXTENDED_TEXT_MAX_LENGTH=200`이 search/manufacturer/destination에 적정 | ⚠️ 사용자 입력 분석 — 실제 search 입력 통계 없음. 200자 = 한국어 100자 ≈ 3-4 검색어 어휘. 현실적 상한 | 기각 시 사용자 검색 실패 → DTO 검증 422 |
| `LONG_CSV_MAX_LENGTH=1000`이 statuses/methods/roles 다중값 충분 | ⚠️ 추정 — checkout statuses 13개 평균 17자 → 13×18+12 = 246자, 안전 | 도메인별 enum 다양화 시 재평가 필요 |
| Frontend `?search=foo` query 빌더가 빈 문자열 자동 생략 | ⚠️ 미검증 — `optionalTrimmedString`의 `'' → undefined` transform이 빈 query 안전망 | frontend test 회귀로 자동 발견 |
| service의 default sort fallback (`createdAt.desc`)이 모든 도메인에 적합 | ✅ 기존 코드 fallback 미러 — mapper의 `XXX_SORT_DEFAULT` 동일 값 | None |

### L4ext (cross-domain ripple)

| 영역 | 영향 | 필요 작업 |
|------|------|----------|
| Frontend 필터 SSOT (`lib/utils/equipment-filter-utils.ts` 등) | sort 값이 enum이 아닌 string 그대로 URL에 인코딩 — backend 검증 추가만 영향 | None (backend strict 검증 추가, frontend는 그대로 통과) |
| Frontend e2e specs (sort=name.asc 등 실제 호출) | 기존 enum 매핑된 값이라면 통과 | spot check (`grep -rn 'sort=' apps/frontend/tests/e2e/`) |
| Frontend hooks (`use-equipment.ts`, `use-checkouts.ts`) | sort 파라미터 전달 — 형식 변경 없음 | None |
| Swagger OpenAPI 문서 | sort enum이 명시되어 OpenAPI 문서 자동 개선 | None (boost) |
| BFF 라우트 (`apps/frontend/app/api/`) | proxy만 — 검증 없음 | None |
| 기존 backend specs | sort field 변경 없음 (mapper 추출만) — 회귀 없어야 정상 | 모든 backend test 통과 검증 |

### 관측성 (Observability)

- **trim/max 위반 로깅**: 본 sprint 범위 외 (현재 GlobalExceptionFilter가 422 기록). 추가 logging은 ZodValidationPipe의 ValidationError emit이 이미 다룸. **변경 없음**.
- **sort 거부 telemetry**: SQL injection 시도 모니터링은 별도 sprint (SIEM 연계). 본 sprint는 차단만 — telemetry는 tech-debt에 분리 (`sort-rejection-telemetry`).

### 테스트 매트릭스 (per-DTO)

| 도메인 | trim→accept (N자) | trim→reject (max+1) | 빈 문자열→undefined | sort allowlist accept | sort enum reject (4가지) | CSV 경계 |
|--------|---|---|---|---|---|---|
| test-software | search, manufacturer | search, manufacturer | search, manufacturer | each combined value | invalid field/dir | — |
| calibration | calibrationAgency, search | calibrationAgency, search | search | each | invalid | statuses, methods |
| checkouts | destination, search, checkoutFrom… | each | each | each | invalid | statuses |
| non-conformances | search | search | search | each | invalid | — |
| notifications | search, recipientSite | each | each | each | invalid | — |
| calibration-factors | search | search | search | each | invalid | — |
| teams | search | search | search | each | invalid | ids |
| users | email, name, department, search | each | each | each | invalid | roles, teams |
| equipment-imports | search | search | search | (이미 enum) | (이미 검증됨) | — |
| cables | search | search | search | each | invalid | — |
| software-validations | (없음) | — | — | each | invalid | — |
| equipmentFilterSchema | search, location, manufacturer | each | each | each (15+ values) | invalid | — |

**Total spec 케이스 추정**: ~120 케이스 (12 schema × 10 평균 케이스).

### CAS 영향

- **None expected** — Query DTO는 read-only. CAS는 state-change DTO에만 적용.
- 검증: `grep -n 'versionedSchema' apps/backend/src/modules/*/dto/*-query.dto.ts` → 0건 (정상).

### 의존성 검증 명령

```bash
# 1. 전체 빌드 (workspace dependency 순서)
pnpm build  # schemas → shared-constants → backend → frontend

# 2. 타입 체크
pnpm --filter @equipment-management/schemas run build
pnpm --filter @equipment-management/shared-constants run build
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit

# 3. 테스트
pnpm --filter backend run test    # unit + 신규 12 spec
pnpm --filter backend run test:e2e  # backend e2e (sort 기존 흐름 회귀)
pnpm --filter frontend run test     # frontend filter SSOT 회귀

# 4. Lint
pnpm --filter backend run lint
pnpm --filter frontend run lint

# 5. verify-zod Step 20 grep invariants (5개 명령 — 4. 위 참조)
bash -c "<verify-zod Step 20 commands>"

# 6. 기존 verify-zod Steps 1-19 회귀 확인
.claude/skills/verify-zod/SKILL.md (manual review)
```

### WCAG SC

- **None** — backend 검증 영역. 사용자 직접 가시 텍스트 변경 없음.

### Pre-commit audit (CLAUDE.md "수술적 변경" 원칙)

| 항목 | 적용 여부 |
|------|----------|
| 요청 범위 외 인접 코드 개선 금지 | ✅ Query DTO만 변경, 다른 DTO/service 로직 비변경 |
| 신규 파일은 SSOT 분리에 한함 | ✅ 14 신규 파일 모두 SSOT (sort enum + mapper) |
| 기존 service 시그니처 변경 최소화 | ✅ findAll/findMany 시그니처 변경 없음 — 내부 sort 처리만 mapper 호출로 치환 |
| `useState` 이중관리 / `setQueryData` | N/A (backend) |
| 하드코딩 0 | ✅ 모든 max length는 `VALIDATION_RULES.*`, sort field는 enum |
| eslint-disable 0 | ✅ 본 변경에서 추가 없음 |
| `any` 0 | ✅ `Record<XxxSortField, PgColumn>` 명시 타입 |
| role 리터럴 0 | N/A |
| i18n parity | N/A (backend 메시지는 VM SSOT 한국어 — 기존 정책) |
| accessibility | N/A |

---

## 6. 추정치

| 항목 | 추정 |
|------|------|
| 신규 파일 | 26개 (14 sort schema + 11 mapper + 1 sort unit spec) |
| 수정 파일 | ~30개 (12 DTO + 11 service + verify-zod skill + validation-rules + schemas index + utils/fields.ts + 12 spec 파일) |
| 라인 수 변경 | +1500 / -250 (신규 +1500, service 인라인 sort 블록 제거 -250) |
| 테스트 케이스 | ~120 신규 (12 schema × 10 평균) |
| Build/Test 시간 | tsc ~30초 + test ~3분 + e2e ~5분 = ~10분 |

---

## 7. Generator-friendly 작업 단위 (Phase 단위 PR 가능)

본 sprint는 단일 PR로 처리하나, Generator가 작업을 commit 단위로 나눌 수 있도록 phase 분할:

1. **Commit 1**: Phase 1 SSOT scaffolding (14 파일 신규 + 1 수정).
2. **Commit 2**: Phase 2 Query DTO 마이그레이션 (12 schema 수정).
3. **Commit 3**: Phase 3 Service mapper + service 수정 (11 mapper 신규 + 11 service 수정).
4. **Commit 4**: Phase 4 spec 신규 (12 spec 파일).
5. **Commit 5**: Phase 5 verify-zod Step 20 + tech-debt-tracker 업데이트.

각 commit 후 tsc + test 통과 확인. (옵션 — Generator 판단)

---

## 8. 완료 후 후속 작업

| 항목 | 위치 | 우선순위 |
|------|------|---------|
| Move exec-plan → `.claude/exec-plans/completed/` | 본 sprint Phase 6 통과 후 | (필수) |
| Move contract → `.claude/contracts/completed/` | 동일 | (필수) |
| Update `.claude/contracts/REGISTRY.md` Active → Completed | 동일 | (필수) |
| Tech-debt 등록 — `csv-token-enum-validation` | tech-debt-tracker.md Open | MEDIUM |
| Tech-debt 등록 — `sort-rejection-telemetry` | tech-debt-tracker.md Open | LOW |
| Tech-debt 등록 — `audit-report-query-trim-max` (별도 도메인) | tech-debt-tracker.md Open | MEDIUM |
| MEMORY.md 갱신 — 본 sprint 항목 추가 | `~/.claude/projects/.../MEMORY.md` | (필수) |

---

## 9. Generator를 위한 핵심 노트

1. **Zod v4 호환성**: `z.enum([...])` 시 두번째 인자 `{ message: VM.enumInvalid('정렬') }` 가능. `.optional().default(...)` 체인 — `.default(...)` 가 `.optional()` 다음에 오면 default 적용 안됨, 반드시 `.default(...).optional()` 또는 `.default(...)` 단독 사용 (현재 calibration-query default 패턴 참조).
2. **`optionalTrimmedString` 반환 타입**: `ZodOptional<ZodEffects<ZodString>>` — `.transform` 통과 후 `.optional()` 체이닝. 빈 문자열 → undefined transform 후 optional. type inference: `string | undefined`.
3. **Sort enum naming**: `'createdAt.asc'` 같은 결합형 — JSON serialization-safe, URL safe (점은 URL-safe).
4. **Drizzle PgColumn 타입 import**: `import type { PgColumn } from 'drizzle-orm/pg-core'`. union 타입 회피 — `as const satisfies Record<XxxSortField, PgColumn>` 패턴.
5. **Cache key invariance**: `sort` 값을 enum으로 좁혀도 cache key 형식 동일 (string concat). 캐시 무효화 영향 없음.
6. **Frontend filter SSOT 영향 범위**: 본 sprint는 backend 검증만 strict. frontend가 보내는 값은 변경 없음 — 기존 UI에서 enum 값만 보내고 있으므로 회귀 가능성 매우 낮음.
7. **Build dependency 순서**: schemas → shared-constants는 schemas만 영향. `pnpm build` 시 자동 처리. 단, schemas/sort 폴더 추가 후 `packages/schemas/src/index.ts`에 `export * from './sort'` 누락 시 backend tsc 실패. **반드시 index.ts 수정 잊지 말 것**.
8. **Notifications/Teams sort 신규 도입**: notifications.service / teams.service는 현재 sort 처리 없음. mapper 추가하더라도 service에서 호출 안 하면 dead code. 옵션: (a) 호출 추가 (default sort 격상), (b) DTO만 enum화 (mapper 미작성). **결정**: (a) 채택 — 시스템 일관성. service에 `resolveXxxOrderBy(query.sort)` 추가.

---

## 10. 위험/블로커

| 위험 | 영향 | 완화 |
|------|------|------|
| Frontend가 sort에 unknown field 보내고 있을 가능성 | 422 에러로 사용자 검색 실패 | Phase 6에서 frontend e2e 회귀 + 사전에 `grep 'sort=' apps/frontend/tests/e2e/` 점검 |
| equipmentFilterSchema 변경 → frontend EquipmentFilter 타입 영향 | type-only narrowing — frontend tsc로 자동 검출 | Phase 6 frontend tsc PASS 검증 |
| Zod v4 `.optional().transform()` 체인 순서 미묘 (`'' → undefined`) | 의도와 다른 동작 | `optionalTrimmedString` 단위 spec으로 빈 문자열 → undefined 케이스 명시 검증 |
| 신규 12개 sort enum이 service 매핑과 어긋남 | 컴파일 에러 | `satisfies Record<XxxSortField, PgColumn>` 컴파일타임 자동 차단 |

**블로커**: 없음. 사용자 결정 대기 항목 없음. Generator 즉시 시작 가능.
