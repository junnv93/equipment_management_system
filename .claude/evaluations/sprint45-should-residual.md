# Evaluation Report: sprint45-should-residual

## 반복 #1 (2026-04-30)

**Evaluator**: Claude Sonnet 4.6 (skeptical QA mode)
**Contract**: `.claude/contracts/sprint45-should-residual.md`
**Exec plan**: `.claude/exec-plans/active/2026-04-30-sprint45-should-residual.md`

---

## MUST 기준 대조 (M1~M25 + M10a~M10d = 29 항목)

| Criterion | Verdict | Evidence |
|-----------|---------|----------|
| **M1** TypeScript 전체 검증 | **PASS** | `pnpm tsc --noEmit` → exit 0, 출력 없음 |
| **M2** Frontend tsc 단독 | **PASS** | `pnpm --filter frontend exec tsc --noEmit` → exit 0 |
| **M3** Frontend build 성공 | **PASS** | `✓ Compiled successfully in 16.3s`, exit 0 |
| **M4** Frontend lint 0 error | **PASS** | `pnpm --filter frontend run lint` → exit 0, error 0건 |
| **M5** CheckoutGroupCard prop API 3개 | **PASS** | `selectedRowIds?:`, `onToggleGroup?:`, `onToggleRow?:` 모두 존재, count=3 |
| **M6** 헤더 체크박스 indeterminate 패턴 | **PASS** | `indeterminate` 키워드 2건 검출 (`checked='indeterminate'` Radix 패턴 포함) |
| **M7** 단위 테스트 파일 + ≥3 케이스 | **PASS** | 파일 존재 + 9 it/test 블록 (≥3 기준 충족) |
| **M8** CheckoutGroupCard 단위 테스트 PASS | **PASS** | 9/9 PASS, `Test Suites: 1 passed, 1 total` |
| **M9** use-bulk-selection 회귀 0건 | **PASS** | 13/13 PASS (기존 13개 보존) |
| **M10** IME 가드 적용 | **PASS** | `nativeEvent.isComposing` 1건 검출 (헤더 체크박스 onKeyDown) |
| **M10a** getGroupRowIds SSOT + 1+ 호출처 | **PASS** | `export function getGroupRowIds` 확인. 호출처 4건 (CheckoutGroupCard.tsx, group-indeterminate fixture 포함) |
| **M10b** Visual fixture + production 가드 | **PASS** | `group-indeterminate/page.tsx` 존재. `process.env.NODE_ENV` + `notFound()` 3건 검출 |
| **M10c** e2e 시나리오 3건 (spec 존재 확인만, fallback 적용) | **PASS** | `group-indeterminate.spec.ts` 존재 + 3 test 블록. 실제 실행은 dev 서버 불가로 SHOULD 강등 (contract fallback 명시됨) |
| **M10d** tech-debt-tracker 후속 항목 등록 | **PASS** | `checkouts-tab-bulk-selection-integration` 1건 등록 확인 |
| **M11** D-day 6-level Playwright spec 신설 | **PASS** | `dday-6level.spec.ts` 파일 존재 |
| **M12** D-day fixture page + production 가드 | **PASS** | `__visual__/dday/page.tsx` 존재. `process.env.NODE_ENV === 'production'` + `notFound()` 3건 |
| **M13** D-day SSOT 직접 import (하드코딩 0) | **PASS** | fixture page에서 `CHECKOUT_DDAY_VISUAL_THRESHOLDS`, `DDAY_VISUAL_LEVEL_CLASSES`, `getCheckoutDdayVisualLevel` 총 9건 검출 (wc -l=9 for combined files) |
| **M14** baseline 갱신 명령 정의 | **PASS** | `--update-snapshots` + `baseline` 4건 검출. spec 주석에 `pnpm --filter frontend exec playwright test visual/dday-6level --update-snapshots` 명시 |
| **M15** FRONTEND_ROUTES.HELP SSOT 등록 | **PASS** | `HELP: {` 1건 (`packages/shared-constants/src/frontend-routes.ts:315`) |
| **M16** /help 라우트 페이지 신설 | **PASS** | `app/(dashboard)/help/page.tsx` 존재 |
| **M17** middleware.ts 신규 0 + useFormState 0 | **PASS** | 미들웨어 신규 0건, useFormState 0건 |
| **M18** i18n parity (ko + en help.json) | **PASS** | `PARITY OK 13 keys` — ko/en 동일 키 13개 |
| **M19** EmptyState secondaryAction prop API | **PASS** | `secondaryAction?:` 1건 (`dashboard/atoms/EmptyState.tsx`) |
| **M20** 도움말 라우트 a11y | **PASS** | `aria-label`, `aria-labelledby`, `<h1` 3건 검출. `aria-label={t('ariaLandmark')}` + `<h1>` + `id="help-placeholder-heading"` |
| **M21** 하드코딩 /help 0건 | **PASS** | `href="/help"` 또는 `router.push('/help')` 비 SSOT 경유 0건 |
| **M22** SSOT 준수: 임계값 직접 import | **CONDITIONAL PASS** | contract grep 명령 `CHECKOUT_DDAY_VISUAL_THRESHOLDS\.` (점 포함) = 0건. 그러나 fixture page에서 `const T = CHECKOUT_DDAY_VISUAL_THRESHOLDS` 별칭 후 `T.relaxedFloor` 등으로 사용 — SSOT import는 실질적으로 존재 (심볼명 자체 9건). Contract 명령의 regex가 별칭 패턴을 포착 못한 false negative. **실질 판정: PASS, 단 regex gap 주목** |
| **M23** 옛날 API 부재 | **PASS** | `useFormState` 신규 도입 0건 (`git diff HEAD~5..HEAD` 기준). `export async function middleware` 전체 0건 |
| **M24** tech-debt-tracker 정리 (3건 archive) | **PASS** | tracker.md strikethrough 4건 + archive.md에 S3/S4/S6 3건 모두 등재 확인 |
| **M25** REGISTRY.md 갱신 | **PASS** | `sprint45-should-residual` 1건 등록 확인 |

**MUST 결과: 29/29 PASS** (M22는 contract grep의 regex 한계로 인한 false negative — 실질 SSOT import 확인됨)

---

## SHOULD 기준 대조 (루프 차단 없음)

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| **S1** Dark baseline 캡처 PNG 존재 | **INFO** | `dday-6level.spec.ts-snapshots/` 디렉토리 자체 없음 (dark PNG 0건). Spec은 작성됐으나 `--update-snapshots` 실행 전. Contract fallback 명시: "본 세션은 spec만 작성, baseline은 후속 sprint". tech-debt-tracker 등록 권장 |
| **S2** Bundle size /help < 30KB First Load | **INFO** | build 출력에서 `/help` 라우트가 `◐` (Partial Prerender)로 빌드됨 확인. First Load JS 수치가 build stdout에 kB 단위로 미출력 (Next.js 16 PPR 빌드 형식 변경). `/help`는 Server Component 정적 페이지, i18n JSON ~3KB + 기존 shared 청크 공유 → exec-plan 추정 5~7KB 유효. 명시적 숫자 미확인이므로 INFO 처리 |
| **S3** Playwright trace 캡처 (CI integration) | **INFO** | `trace:` / `video:` 옵션 0건. spec 파일에 trace 주석 미포함. 후속 CI 통합 sprint 권장 |
| **S4** verify-bulk-action-bar SKILL Step ≥8 | **INFO** | 현재 7 Steps. 기준 ≥8 미달. 그룹 헤더 indeterminate 패턴 Step 8 미추가. tech-debt-tracker 등록 권장 |
| **S5** analytics 이벤트 등록 | **INFO** | `track('checkout.group.toggleAll'` 0건. exec-plan에 "SHOULD로 가능" 명시됨. 후속 등록 권장 |
| **S6** i18n key 추가 정책 명시 | **PASS** | exec-plan에 `i18n.*placeholder|콘텐츠.*confirm` 2건 검출. "placeholder 키만 등록, 실제 카피는 사용자 confirm" 명시 |
| **S7** EmptyState dedup 결정 명문화 | **PASS** | exec-plan에 `EmptyState.*dedup|3종.*dedup` 3건 검출. Out-of-Scope 섹션에 명시 |
| **S8** Help 페이지 metadata | **PASS** | `generateMetadata()` + `title:` 2건. `export async function generateMetadata()` 구현됨 (Next.js 16 패턴 정확) |

---

## Senior-Level Additional Checks

| Check | Verdict | Evidence |
|-------|---------|----------|
| help/page.tsx `dark:` prefix 사용 0건 | **PASS** | `dark:` 0건 — brand CSS 변수 체계 준수 |
| visual fixture pages `dark:` prefix 0건 | **PASS** | dday + group-indeterminate 양쪽 모두 0건 |
| group-selection.ts `any` 타입 0건 | **PASS** | `any` 0건 |
| checkouts.json ko/en parity | **PASS** | 669 keys 동일. groupCard.selectAll 등 신규 키 parity 확인 |
| CheckoutGroupCard 후방호환 | **PASS** | OutboundCheckoutsTab/InboundCheckoutsTab 기존 호출처에서 selection prop 미전달 — prop 옵셔널(?) 설계 확인 |
| M22 contract regex gap | **주목** | `CHECKOUT_DDAY_VISUAL_THRESHOLDS\.` (점 포함) 패턴이 `const T = CHECKOUT_DDAY_VISUAL_THRESHOLDS; T.foo` 별칭 패턴을 포착 못함. 계약 명령의 false negative — 실제 SSOT는 import+사용 중. 다음 contract에서 regex 개선 권장 |
| production 빌드 내 `__visual__` 라우트 노출 여부 | **주목** | `__visual__` 라우트가 production 빌드에서 `notFound()` 반환 패턴이지만, build output에서 해당 라우트가 목록에 미출력됨 (Next.js 빌드 목록에 없음). Production 번들 포함 여부 불분명. 단, fixture page 코드에 `if (process.env.NODE_ENV === 'production') notFound()` 가드가 있으므로 런타임 보호는 됨 |
| e2e spec storageState 의존성 | **주목** | `group-indeterminate.spec.ts`가 `testEngineerPage` fixture 의존 — `tests/e2e/.auth/test-engineer.json` storageState 필요. dev 서버 없이 실행 불가. M10c fallback 적용됨 |
| useFormState 전체 코드베이스 0건 | **PASS** | `grep -rn "useFormState"` 전체 0건 확인 |

---

## 전체 판정

**OVERALL: PASS**

- **MUST 미달: 0개** (29/29 PASS. M22는 contract regex 한계의 false negative — 실질 SSOT import 확인)
- **SHOULD INFO: 3개** (S1 dark baseline, S3 trace, S4 SKILL Step)
- **SHOULD PASS: 3개** (S6, S7, S8)
- **SHOULD INFO 기타: 2개** (S2 bundle size 수치 미출력, S5 analytics)

---

## Repair Instructions

없음 — MUST 29항목 모두 PASS.

---

## 후속 권장 (tech-debt-tracker 등록 권장)

### 즉시 등록 권장

1. **D-day visual baseline 캡처 실행 (S1)**
   - 명령: `pnpm --filter frontend exec playwright test visual/dday-6level --update-snapshots --project=chromium`
   - 조건: dev 서버 기동 + storageState 유효 시
   - 산출물: 12 PNG baseline (6 level × light/dark)

2. **verify-bulk-action-bar SKILL Step 8 추가 (S4)**
   - 항목: 그룹 헤더 indeterminate 패턴 검증 — `CheckoutGroupCard`에 `selectedRowIds?`, `onToggleGroup?` prop API + Radix `checked='indeterminate'` 패턴

3. **Playwright trace 설정 추가 (S3)**
   - `dday-6level.spec.ts`에 `test.use({ trace: 'retain-on-failure' })` 추가 권장

### 차회 contract 개선 권장

- M22 regex 개선: `CHECKOUT_DDAY_VISUAL_THRESHOLDS[\.\s]` 또는 import 자체 카운트로 변경 — 별칭 패턴(`const T = X; T.foo`) 포착 가능하도록

### 기존 등록 확인 완료

- `checkouts-tab-bulk-selection-integration` — tech-debt-tracker 등재 확인
- S3/S4/S6 3건 — tech-debt-tracker-archive 이전 확인
