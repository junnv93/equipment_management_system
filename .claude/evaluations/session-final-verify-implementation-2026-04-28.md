# 본 세션 verify-implementation 보고서

생성: 2026-04-28 | 베이스 커밋: d5f7bfde

## 총괄

| 심각도 | 건수 |
|---|---|
| P0 | 0 |
| P1 | 2 |
| P2 | 1 |
| PASS skills | 11 |

---

## 스킬별 결과 (13개)

### 1. verify-ssot — PASS

- `utilization-state.test.ts`: `UTILIZATION_THRESHOLDS`를 `@/lib/config/dashboard-config`에서 import 후 `HIGH`, `MEDIUM`, `HYSTERESIS`로 구조 분해. SSOT 우회 없음.
- `dashboard-api.ts`: `DashboardCheckoutScope` deprecated alias 제거 + `getCheckoutsByScope` 파라미터를 `DashboardScope`(shared-constants)로 직접 사용. SSOT 강화.
- `dashboard-config.ts`의 `UTILIZATION_THRESHOLDS.HIGH = UTILIZATION_GAUGE_THRESHOLDS.ok` — 파생 alias이며 SSOT 문서에서 허용 패턴으로 명시됨.

### 2. verify-hardcoding — FAIL (P1)

**위반 ID: P1-1**  
위치: `apps/frontend/components/dashboard/MiniCalendar.tsx`, 284라인 `bg-brand-neutral` 범례 도트

범례 주석(278-280라인)에서 "공휴일은 도트(brand-critical, holiday cell의 cellNumberHoliday 색상과 일치)"라고 명시했으나 실제 구현은 `bg-brand-neutral`(중립 회색)을 사용. `cellNumberHoliday` 토큰은 `text-brand-critical`(빨강)로 정의되어 주석과 코드 간 색상이 불일치함.

- 설계 의도(주석): 공휴일 범례 도트 = `bg-brand-critical` (셀 번호 색상과 동일)
- 실제 코드: `bg-brand-neutral` (회색)
- 결과: 공휴일 범례 도트가 회색으로 보이고, 달력 셀 내 공휴일 날짜 숫자는 빨강으로 표시 → 시각적 불일치

### 3. verify-frontend-state — PASS

- `useState` 이중관리 패턴 없음.
- `setQueryData` 직접 사용 없음.
- `useOptimisticMutation` onSuccess에서 `setQueryData` 없음.
- 변경 파일 모두 해당 없음.

### 4. verify-design-tokens — FAIL (P1)

**위반 ID: P1-2**  
위치: `apps/frontend/components/dashboard/MiniCalendar.tsx`, 286라인

```tsx
{holidayMap.size > 0 ? ` ${holidayMap.size}` : ''}
```

`holidayMap`은 `getHolidays(holidayYear)` — 연도 전체 공휴일 맵 (월 필터 없음). `holidayMap.size`는 연간 전체 공휴일 수(약 15-16개)를 반환하나, 범례에는 "현재 월 공휴일 카운트"를 표시해야 함(명세서 §A.3.1 + 코드 주석 명시). 달력 그리드 셀은 `currentMonth` 기준으로만 렌더링되어 범례 숫자와 실제 표시 공휴일 수가 항상 불일치함.

예시: 2026-04(4월)을 보는 사용자에게 범례가 "공휴일 16"(2026년 전체)을 보여주지만 달력에는 4월 공휴일(2-3개)만 표시됨.

분류 근거: 코드 주석 자체가 "현재 월" 카운트라 명시했으므로 설계 의도 위반.

### 5. verify-i18n — PASS

- `legendHoliday` 키: `messages/ko/dashboard.json` = `"공휴일"`, `messages/en/dashboard.json` = `"Holiday"` → ko/en 패리티 확인됨.
- `DashboardShell.tsx` 변경분에서 신규 i18n 키 추가 없음. 기존 `t('layout.systemName')` 등 유지.
- 신규 `ul-logo.tsx`에 번역 키 없음 (alt="UL Solutions" 하드코딩이지만 브랜드명으로 허용됨).

### 6. verify-nextjs — PASS

- 변경 파일에 Page 컴포넌트 없음 (`params`/`searchParams` await 패턴 해당 없음).
- `useActionState` / `useFormState` 사용 없음.
- `proxy.ts` / `middleware.ts` 수정 없음.
- `'use client'` 선언: `DashboardShell.tsx`(기존), `MiniCalendar.tsx`(기존) — 변경 없음.

### 7. verify-cas — PASS (해당 없음)

변경 파일 7개 모두 CAS 관련 상태 변경(버전 필드 업데이트, 409 처리) 없음. 스코프 외.

### 8. verify-auth — PASS (해당 없음)

변경 파일에 NestJS 컨트롤러 없음. `req.user.userId` / body userId 신뢰 패턴 해당 없음.

### 9. verify-zod — PASS (해당 없음)

변경 파일에 `ZodValidationPipe`, `class-validator` 없음. 스코프 외.

### 10. verify-cache-events — PASS (해당 없음)

변경 파일에 `emit` / `emitAsync` 사용 없음. 스코프 외.

### 11. verify-security — PASS

- `dangerouslySetInnerHTML` 없음.
- `eval()` / `innerHTML` 없음.
- `ul-logo.tsx`의 `src="/images/ul-logo.svg"` — static public 경로, XSS 위험 없음.
- 시크릿 하드코딩 없음.

### 12. verify-sql-safety — PASS (해당 없음)

변경 파일은 모두 프론트엔드 또는 테스트 파일. `ANY(jsArray)` / raw SQL 없음. `dashboard.service.spec.ts`는 mock 기반 테스트 — 실제 SQL 없음.

### 13. verify-implementation — PASS

- `eslint.config.mjs`: 신규 `eslint-disable` 주석 없음. 두 번째 블록(`no-img-element: off`) 추가는 올바른 flat config 오버라이드. `brand-assets` 글로브가 두 블록에 중복되지만 각 블록이 다른 규칙을 설정하므로 머지 충돌 없음.
- `ul-logo.tsx`: `@typescript-eslint/no-explicit-any` 위반 없음. strict 타입 사용.
- `dashboard.service.spec.ts`: `Date.now` spy + `mockRestore?.()` afterEach 패턴 — `jest.restoreAllMocks()`보다 범위가 좁지만 describe 스코프 내 afterEach가 올바르게 적용되어 기능상 안전.
- 빌드: tsc --noEmit PASS, lint PASS.

---

## 위반 심각도별 요약

### P0 (없음)

### P1

| ID | 위치 | 내용 |
|---|---|---|
| P1-1 | `MiniCalendar.tsx:283` | 공휴일 범례 도트 색상: 주석은 `bg-brand-critical`이지만 코드는 `bg-brand-neutral` — 셀 번호(`text-brand-critical`)와 시각적 불일치 |
| P1-2 | `MiniCalendar.tsx:286` | `holidayMap.size` = 연간 전체 공휴일 수. 범례에 "현재 월 공휴일 카운트"를 표시해야 하나 연간 카운트 노출 — 명세서 §A.3.1 + 코드 주석 위반 |

### P2

| ID | 위치 | 내용 |
|---|---|---|
| P2-1 | `DashboardShell.tsx:334,428` | `UlLogo` 두 사용처 모두 `ariaHidden` prop 없음 (기본 `false` → `alt="UL Solutions"` 스크린리더 노출). 사이드바 footer의 로고는 순수 장식적 브랜딩이므로 `ariaHidden={true}`가 더 적절할 수 있음. 기능 파괴는 아니나 접근성 의도 명확화 필요. |

---

## Quick Wins (1-2 line fix)

**P1-1 fix** (`MiniCalendar.tsx:283`):
```tsx
// 주석 수정 OR 코드 수정 (주석을 기준으로 수정)
<span className={cn(T.legendDot, 'bg-brand-critical')} />
```

**P1-2 fix** (`MiniCalendar.tsx:86-97` + `286`):
```tsx
// holidayMap에서 currentMonth 달 기준으로 필터
const currentMonthPrefix = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
const currentMonthHolidayCount = Array.from(holidayMap.keys()).filter(k => k.startsWith(currentMonthPrefix)).length;

// 286라인:
{currentMonthHolidayCount > 0 ? ` ${currentMonthHolidayCount}` : ''}
```

**P2-1 fix** (의사결정 필요):
```tsx
// 장식적 사용이 확실하다면:
<UlLogo className="h-10 w-auto" ariaHidden={true} />
```

---

## 빌드 검증 결과

| 명령 | 결과 |
|---|---|
| `pnpm --filter frontend exec jest utilization-state` | PASS (19/19 통과) |
| `pnpm --filter backend exec jest dashboard.service.spec` | PASS (23/23 통과, 신규 8케이스 포함) |
| `pnpm --filter frontend exec tsc --noEmit` | PASS (출력 없음 = 에러 없음) |
| `pnpm --filter frontend run lint` | PASS (exit 0) |

---

## PASS 항목 (이상 없음)

- verify-ssot: `UTILIZATION_THRESHOLDS` SSOT 경유 확인, `DashboardCheckoutScope` deprecated alias 올바른 제거
- verify-frontend-state: useState 이중관리 / setQueryData 오용 없음
- verify-i18n: `legendHoliday` ko/en 패리티 확인
- verify-nextjs: 해당 패턴 없음 (PASS)
- verify-cas: 해당 없음
- verify-auth: 해당 없음
- verify-zod: 해당 없음
- verify-cache-events: 해당 없음
- verify-security: XSS/시크릿 없음
- verify-sql-safety: 해당 없음
- verify-implementation: 신규 eslint-disable 없음, TypeScript strict PASS

---

## Architectural Concerns (설계 수준)

**[주의] eslint.config.mjs 블록 중복 가능성**

`**/lib/brand-assets/**/*.{ts,tsx}` 파일 패턴이 두 개의 별도 config 블록(156~168라인, 169~177라인)에 중복 선언됨. ESLint flat config는 merge 방식이므로 기능 충돌은 없으나, 향후 brand-assets 예외 규칙 추가 시 두 블록 중 어디에 넣어야 할지 혼란 야기 가능. 단일 블록으로 통합 권고.

**[참고] `Date.now` spy cleanup 패턴**

`dashboard.service.spec.ts`의 `afterEach`에서 `(Date.now as unknown as jest.SpyInstance).mockRestore?.()` 패턴 사용. 이 방식은 setupHealthMocks가 호출되지 않은 describe 내 테스트에서 mockRestore가 undefined일 수 있음(?.()로 방어됨). 더 안전한 대안은 `jest.restoreAllMocks()`를 describe 바깥 afterEach에 두는 것이나, 현재 구현도 기능상 안전.
