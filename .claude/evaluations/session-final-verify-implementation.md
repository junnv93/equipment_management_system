# 본 세션 verify-implementation 종합 보고서

생성일: 2026-04-28  
베이스 커밋: d6dc8df6

---

## 총괄

| 심각도 | 건수 |
|---|---|
| P0 (즉시 fix) | 1 |
| P1 (architecture violation) | 3 |
| P2 (권고) | 2 |
| PASS skills | 9 |

---

## 스킬별 결과 (13개)

### 1. verify-ssot — FAIL (P1 × 1)

**`dashboard.service.ts` 100 GiB 기본값 중복**

- `apps/backend/src/config/env.validation.ts` 의 Zod 스키마에서 `.default(100 * 1024 * 1024 * 1024)` 로 이미 SSOT 정의.
- `apps/backend/src/modules/dashboard/dashboard.service.ts:776` 에서 `?? 100 * 1024 * 1024 * 1024` 로 동일 숫자를 재정의.
- `ConfigService.get()` 은 Zod 기본값이 적용된 후 반환하므로 `undefined` 가 될 수 없음 → fallback 자체가 dead code이면서 SSOT 분산.
- 위반 파일: `apps/backend/src/modules/dashboard/dashboard.service.ts:776`

그 외 SSOT 확인:
- `DASHBOARD_SCOPES` / `DashboardScope` → `@equipment-management/shared-constants` 올바르게 경유 ✅
- backend/frontend 모두 `type DashboardScope` import SSOT 사용 ✅
- `CHECKOUT_DDAY_THRESHOLDS`, `getCheckoutDdayTier` → `@equipment-management/shared-constants` 경유 ✅
- `DEFAULT_LOCALE` → `@equipment-management/schemas` 경유 ✅

### 2. verify-hardcoding — FAIL (P0 × 1)

**`AzureAdButton.tsx` — Tailwind JIT 클래스 내 hex 하드코딩**

- `apps/frontend/components/auth/AzureAdButton.tsx:44`:
  ```
  'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0078D4]/50'
  ```
- `components/auth/` 는 ESLint `no-restricted-syntax` HEX_COLOR_RULE 예외 목록(`**/lib/brand-assets/**`, `**/lib/design-tokens/**`) 에 미포함.
- `AUTH_LAYOUT_TOKENS.microsoft` 에 `bg: '#0078D4'` 가 이미 선언되어 있고, `lib/design-tokens/components/auth.ts` 는 예외 파일이라 hex 허용됨.
- 그러나 컴포넌트 파일에서 Tailwind 임의값 `ring-[#0078D4]` 으로 직접 사용하는 것은 ESLint 룰 위반이며, CSS 변수 기반 접근이 아님.
- **Fix**: Tailwind config에 Microsoft blue를 custom color로 등록하거나, `ring-[var(--color-microsoft)]` 패턴 사용. 혹은 `components/auth/**` 를 ESLint 예외에 추가하되 STATUS_LITERAL 룰은 유지.

그 외 하드코딩 확인:
- `DDAY_4TIER_CLASSES` 임계값 → `CHECKOUT_DDAY_THRESHOLDS` SSOT 경유 ✅
- `BRAND_THEME_META_COLORS` hex — 주석에 "meta tag는 CSS 변수 미사용 → hex 하드코딩 불가피" 명시, `lib/design-tokens/brand.ts` 는 예외 파일 ✅
- `microsoft-logo.tsx` hex (F25022, 7FBA00 등) — `lib/brand-assets/` 예외 파일, 외부 브랜드 자산 명시 ✅
- `DASHBOARD_STORAGE_CAPACITY_BYTES` `.default(100 * 1024 * 1024 * 1024)` — `env.validation.ts` SSOT 정의 ✅
- `MiniCalendar` `'KR'` — 국가 코드 상수화 미흡하나 P2 수준

### 3. verify-frontend-state — PASS

- `DashboardClient.tsx` — `useQuery(...QUERY_CONFIG.MONITORING)` 올바르게 SSOT 참조 ✅
- 대시보드 관련 서버 데이터를 `useState` 로 이중 관리하는 패턴 미발견 ✅
- `setQueryData` — `CheckoutGroupCard.tsx:201` 에 있으나 `onError` 롤백 컨텍스트 (`context?.previousViewQueries?.forEach`) 로 낙관적 업데이트 복원 용도 — 메모리 룰 "onSuccess setQueryData 금지"와 다름 (onError 복원은 허용). 단 **본 세션 변경 범위 외** 파일이므로 범위 제외.
- `ReturnCheckoutClient` / `ConditionCheckClient` — `useOptimisticMutation` 패턴 사용, `setQueryData` 없음 ✅

### 4. verify-design-tokens — PASS

- `transition-all` 직접 사용 미발견 ✅
- `focus:` → `focus-visible:` 전환 확인 (`AzureAdButton.tsx:44` 이미 `focus-visible` 사용) ✅
- `DDAY_4TIER_CLASSES` CSS 변수 기반 (`bg-brand-critical/16` 등) ✅
- `BRAND_THEME_META_COLORS` — 디자인 토큰 파일 내 정의, `layout.tsx` 경유 사용 ✅
- `dark:bg-brand-*` 직접 사용 미발견 ✅
- `CalibrationDdayList.tsx` `T.minHeightPx` — `DASHBOARD_DDAY_COMPACT_TOKENS` 경유 ✅

### 5. verify-i18n — PASS

- `ko/dashboard.json` ↔ `en/dashboard.json` 키 완전 일치 (372 keys each) ✅
- `_suffixNote` — ko와 en 모두 존재, ko는 "한국어 호칭" 설명, en은 "Intentionally empty" 설명 ✅
- `moreEvents` — ko: `"+{count}건 더"`, en: `"+{count} more"` 양쪽 존재 ✅
- `MiniCalendar` `t('moreEvents')` 사용 확인 ✅

### 6. verify-nextjs — PASS

- `layout.tsx` — sync `RootLayout` + `<Suspense>` 내부 async `IntlProvider` 패턴 ✅
- `useActionState` (React 19) — 변경 파일 내 `useFormState` 미발견 ✅
- `params`/`searchParams` await 패턴 — 변경 파일에서 Page 컴포넌트 없음 (Client Components만 변경) ✅

### 7. verify-cas — PASS (N/A)

- `getCheckoutsByScope`, `getSystemHealth`, `getQualityReviewPending` — 읽기 전용 엔드포인트, CAS 불필요 ✅
- `ReturnCheckoutClient` `useOptimisticMutation` 의 `version` 필드 전달 확인:
  ```typescript
  version: (old?.version ?? checkout.version) + 1,
  ```
  ✅

### 8. verify-auth — FAIL (P1 × 1, P2 × 1)

**P1: `system-health` 엔드포인트 권한 설정 불일치**

- `@RequirePermissions(Permission.VIEW_EQUIPMENT)` 로 선언 후 내부에서 `SYSTEM_ADMIN` role 비교.
- `VIEW_SYSTEM_SETTINGS` 권한이 별도 존재 (`packages/shared-constants/src/permissions.ts:218`) — SYSTEM_ADMIN은 해당 권한을 가짐.
- 더 정확한 표현: `@RequirePermissions(Permission.VIEW_SYSTEM_SETTINGS)` 가 의미론적으로 적합.
- 현재 동작은 `VIEW_EQUIPMENT` 가진 모든 역할이 endpoint에 진입 가능하나 내부 role 가드에서 다시 걸림 → 이중 가드 패턴으로 실제 보안 취약점은 아님.
- 단 SSOT 불일치: PermissionsGuard가 의미 없는 권한을 검사.

**P2: `quality-review-pending` 엔드포인트 동일 패턴**
- `@RequirePermissions(Permission.VIEW_CALIBRATIONS)` + 내부 `QUALITY_MANAGER/LAB_MANAGER/SYSTEM_ADMIN` role 비교.
- `VIEW_CALIBRATIONS` 는 모든 인증 사용자에게 넓게 부여되어 있을 가능성 → role 가드와 중복/불일치.

그 외 auth 확인:
- `req.user.userId` 추출 패턴 — `getMyQuickSummary`, `getCheckoutsByScope` 모두 서버 사이드 추출 ✅
- `@Body() userId` 패턴 미발견 ✅

### 9. verify-zod — PASS

- `DashboardScopeValidationPipe` — `z.enum(DASHBOARD_SCOPES)` SSOT 경유, `targets: ['query']` 명시 ✅
- `class-validator` (`IsString` 등) 미발견 ✅
- `ZodValidationPipe` targets bug (기본 body만) 방어 코드 존재 ✅

### 10. verify-cache-events — PASS (N/A)

- 변경 범위 내 `emit`/`emitAsync` 없음 ✅

### 11. verify-security — PASS

- `dangerouslySetInnerHTML` 미발견 ✅
- `MicrosoftLogo.tsx` — SVG 정적 컴포넌트, 동적 내용 없음, `aria-hidden="true"` ✅
- `scripts/check-bundle-size.mjs` — `readFileSync` 경로가 빌드 산출물에만 접근 ✅

### 12. verify-sql-safety — PASS

- `sql\`SELECT 1\`` — ping 쿼리, 사용자 입력 없음 ✅
- `sql\`SELECT pg_database_size(current_database())\`` — 파라미터 없는 시스템 함수 ✅
- `ANY(jsArray)` 패턴 미발견 ✅
- `LIKE` 이스케이프 필요 패턴 미발견 ✅

### 13. verify-implementation — FAIL (P1 × 1)

**ESLint deprecated guard 파일 패턴 불일치**

- `eslint.config.mjs` 의 hex/design-token 예외 블록 (line 150): `'**/lib/design-tokens/**/*.{ts,tsx}'` (globstar)
- 같은 파일의 `@typescript-eslint/no-deprecated` guard 블록 (line 187): `'lib/design-tokens/**/*.ts'` (상대경로)
- 파일 자체 주석(line 146-147)에서 "lint-staged가 root cwd로 실행할 때 상대경로는 매칭 실패" 문제를 설명하고 globstar 패턴 사용을 권고하지만, deprecated guard 블록에는 적용되지 않음.
- 결과: CI 또는 root에서 `pnpm lint` 실행 시 `components/checkouts/` 와 `app/(dashboard)/checkouts/` deprecated 가드는 정상 작동하나, `lib/design-tokens/**/*.ts` 가드만 `apps/frontend/` 기준 상대경로이므로 root 실행 시 매칭 실패 가능성 있음.
- ESLint flat config의 `files` 패턴은 **config 파일 위치 기준 상대경로** 이므로 `apps/frontend/eslint.config.mjs` 기준에서 `lib/design-tokens/**` 는 `apps/frontend/lib/design-tokens/**` 와 동일. 단, lint-staged가 절대 경로를 넘길 때 매칭 실패 가능.

---

## 위반 심각도별 요약

### P0

| ID | 위치 | 내용 |
|---|---|---|
| P0-1 | `apps/frontend/components/auth/AzureAdButton.tsx:44` | Tailwind JIT `ring-[#0078D4]` — ESLint HEX_COLOR_RULE 대상 파일에서 hex 직접 사용. `components/auth/` 는 예외 파일 아님 |

### P1

| ID | 위치 | 내용 |
|---|---|---|
| P1-1 | `apps/backend/src/modules/dashboard/dashboard.service.ts:776` | `100 * 1024 * 1024 * 1024` 기본값 SSOT 중복 — env.validation.ts Zod default 와 동일 값을 서비스 레이어에서 재정의 |
| P1-2 | `apps/backend/src/modules/dashboard/dashboard.controller.ts:396` | `system-health` `@RequirePermissions(Permission.VIEW_EQUIPMENT)` — `VIEW_SYSTEM_SETTINGS` 권한이 의미론적으로 정확. 이중 가드 패턴이나 SSOT 불일치 |
| P1-3 | `apps/frontend/eslint.config.mjs:187` | `@typescript-eslint/no-deprecated` guard 블록이 `'lib/design-tokens/**/*.ts'` 상대경로 사용 — 다른 블록과 불일치 (`**/` globstar 미적용) |

### P2

| ID | 위치 | 내용 |
|---|---|---|
| P2-1 | `apps/backend/src/modules/dashboard/dashboard.controller.ts:415` | `quality-review-pending` — `VIEW_CALIBRATIONS` 권한 + 내부 role 가드 이중 패턴. `system-health` 와 동일 불일치 |
| P2-2 | `apps/backend/src/modules/dashboard/__tests__/dashboard.service.spec.ts` | `getSystemHealth()` 전용 테스트 케이스 없음 — ConfigService mock은 설정됐으나 실제 `storagePct` 계산 / `overallStatus` 로직 검증 미포함 |

---

## Quick Wins (1-2 line fix)

**P0-1 fix** (`AzureAdButton.tsx:44`):
```typescript
// Before
'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0078D4]/50',

// After — eslint-disable 주석 + 사유 or AUTH_LAYOUT_TOKENS 참조
// eslint-disable-next-line no-restricted-syntax -- Microsoft brand focus ring: hex required for Tailwind JIT opacity syntax
'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0078D4]/50',
```
또는 ESLint 예외 블록에 `'**/components/auth/**/*.{ts,tsx}'` 추가 (단, STATUS_LITERAL_RULE 유지).

**P1-1 fix** (`dashboard.service.ts:775`):
```typescript
// Before
const storageCapacityBytes =
  this.configService.get<number>('DASHBOARD_STORAGE_CAPACITY_BYTES') ??
  100 * 1024 * 1024 * 1024;

// After — env.validation.ts Zod default가 항상 적용되므로 ?? fallback 제거
const storageCapacityBytes =
  this.configService.get<number>('DASHBOARD_STORAGE_CAPACITY_BYTES', 100 * 1024 * 1024 * 1024);
// 또는 단순화:
const storageCapacityBytes = this.configService.getOrThrow<number>('DASHBOARD_STORAGE_CAPACITY_BYTES');
```
주: `env.validation.ts` Zod schema에 `.default()` 가 있어 `getOrThrow` 는 문제없음.

**P1-3 fix** (`eslint.config.mjs:187`):
```javascript
// Before
'lib/design-tokens/**/*.ts',

// After — globstar 통일
'**/lib/design-tokens/**/*.ts',
```

**P1-2 fix** (`dashboard.controller.ts:396`):
```typescript
// Before
@RequirePermissions(Permission.VIEW_EQUIPMENT)

// After
@RequirePermissions(Permission.VIEW_SYSTEM_SETTINGS)
```

---

## Architectural Concerns (설계 변경)

없음. 이번 세션 변경은 대체로 기존 아키텍처를 올바르게 따름.

---

## PASS 항목 (이상 없음)

- **verify-frontend-state**: TanStack Query 패턴 준수, `setQueryData` 오남용 없음
- **verify-design-tokens**: `transition-all` 금지, `focus-visible` 사용, brand CSS 변수 경유
- **verify-i18n**: ko/en 372 키 완전 일치, `_suffixNote` / `moreEvents` 양방향 포함
- **verify-nextjs**: PPR 패턴 준수, async params 미존재, `useActionState` 사용
- **verify-cas**: read-only 대시보드 영역 — CAS 불필요, ReturnCheckoutClient version 전달 정상
- **verify-zod**: `DashboardScopeValidationPipe` targets:['query'] 명시, class-validator 0건
- **verify-cache-events**: 변경 범위 내 emit/emitAsync 없음
- **verify-security**: XSS 패턴 없음, SVG 정적 처리, bundle script 안전
- **verify-sql-safety**: parameterized queries 사용, ANY(jsArray) 패턴 없음
