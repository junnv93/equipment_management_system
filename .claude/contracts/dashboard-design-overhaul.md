# Contract: dashboard-design-overhaul

> **Date**: 2026-04-26
> **Mode**: harness Mode 2
> **Generator**: opus (main context)
> **Evaluator**: sonnet (independent agent)
> **Exec-plan**: `.claude/exec-plans/active/2026-04-26-dashboard-design-overhaul.md`

---

## Context

2026-04-24 외부 디자인 리뷰(24개 P0~P3 항목) + 내부 rev-2 아키텍처 감사(ADD-01~14)를 단일 머지로 해결한다.
리뷰 핵심: 1280px에서 sub-grid 압축(P0), severity 통합(P0), Hero bar/alertBorder 약함(P1), QuickAction 14px 아이콘(P1).
아키텍처 핵심: SSOT 분산(ADD-01~05), JIT-unsafe(ADD-04), i18n 불일치(ADD-06), dead prop(ADD-07), a11y 미흡(ADD-08/09/14), 측정 부재(ADD-10/11/12).

---

## Scope

| AP | 요약 |
|---|---|
| AP-01 | DASHBOARD_GRID `lg:` → `xl:` + sub-grid 신규 5키 |
| AP-02 | AlertBanner stacked variant + countPill 확장 |
| AP-03 | Hero bar h-2 + 임계 눈금 + alertBorder 3중 강화 |
| AP-04 | UTILIZATION_THRESHOLDS SSOT + hysteresis ±2%p |
| AP-05 | QuickAction 아이콘 16px + 터치 타겟 36px + iconBgClass 제거 |
| AP-06 | system_admin 사이드바 grid-rows 동적 계산 |
| AP-07 | quality_manager row3ThreeCol + test_engineer 1-col |
| AP-08 | DASHBOARD_ENTRANCE 토큰화 + prefers-reduced-motion 글로벌 |
| AP-09 | resolveDashboardRoleConfig 헬퍼 |
| AP-10 | i18n parity + FOCUS_TOKENS + bundle-baseline + 5-role e2e |
| AP-11 | AlertBanner info severity 4-state |
| AP-12 | useCountUp hook + reducedMotion 분기 |
| AP-13 | MyActivityCard 신규 (클라이언트 필터, 백엔드 0) |
| AP-14 | AlertBanner trailingAction slot (Lab/Tech Mgr) |
| AP-15 | DashboardLayout 5 Row 추출 (Phase 6 — 마지막) |
| AP-16 | below-the-fold 8개 next/dynamic (First Load JS 절감) |
| AP-17 | Visual regression baseline 60장 |
| GUARD-1 | DASHBOARD_ROLE_CONFIG ↔ ROLE_PERMISSIONS 빌드 sync |
| GUARD-2 | CSS :root ↔ .dark brand 변수 정합성 |

## Out of Scope

- **Dashboard SSE 도입** (별도 시퀀스) — `REFETCH_STRATEGIES.SSE_BACKED` 활성화는 백엔드 SSE endpoint 신설 필요

---

## MUST Criteria

> 모두 PASS 시 머지. 단 하나라도 FAIL이면 Fix Loop 진입.

| ID | 기준 | 검증 명령 / 방법 |
|---|---|---|
| M-01 | TypeScript 컴파일 통과 | `pnpm tsc --noEmit` (root) + `pnpm --filter frontend run tsc --noEmit` |
| M-02 | Frontend 빌드 통과 | `pnpm --filter frontend run build` |
| M-03 | Dashboard E2E 통과 (5 role + TC-14/15 + responsive 4 viewport) | `pnpm --filter frontend run test:e2e --grep "dashboard\|alert-kpi\|responsive\|auth-role-access"` |
| M-04 | Bundle size 5% TOLERANCE 내 (`/dashboard` 항목 갱신 후) | `node scripts/check-bundle-size.mjs` |
| M-05 | verify-implementation PASS (13 verify-* 일괄) | `/verify-implementation` 스킬 |
| M-06 | verify-ssot PASS — DASHBOARD_ROLE_CONFIG inline ≤ 2 (헬퍼+테스트) | `grep "DASHBOARD_ROLE_CONFIG\[" apps/frontend \| wc -l` ≤ 2 |
| M-07 | verify-hardcoding PASS — 3종 인라인 0건 | `grep -rn "lg:grid-cols-\[" apps/frontend/components` = 0 / `grep -rn "UTILIZATION_HIGH\s*=" apps/frontend/components` = 0 / `grep -rn "min-h-\[.*rem\]" apps/frontend/components` = 0 (design-tokens 제외) |
| M-08 | verify-design-tokens PASS — brand `dark:` 0건 + FOCUS_TOKENS 4곳 적용 | `/verify-design-tokens` Layer 1.5 + grep |
| M-09 | verify-i18n PASS — ko/en alertBanner.* + myActivity.* parity | `diff <(jq -r 'paths(scalars)\|join(".")' messages/ko/dashboard.json\|sort) <(jq -r ... en) \| wc -l` = 0 |
| M-10 | verify-cache-events PASS (캐시/이벤트 변경 없음 → trivial PASS) | `/verify-cache-events` |
| M-11 | AP-11 info severity — TC-15 e2e PASS | overdue=0 + upcoming=5 → info variant DOM 검증 |
| M-12 | AP-12 useCountUp 단위 테스트 4 branch PASS | `pnpm --filter frontend run test -- use-count-up` |
| M-13 | AP-13 MyActivityCard — test_engineer 가시 + userId 필터 단위 테스트 | e2e + 단위 테스트 |
| M-14 | AP-14 trailingAction — lab_manager / technical_manager 승인 버튼 가시 | e2e DOM 검증 |
| M-15 | AP-17 visual regression baseline 60장 수립 | `pnpm --filter frontend run test:e2e --grep visual-regression --update-snapshots` 성공 |
| M-16 | GUARD-1 role-config sync | `node scripts/check-role-config-sync.mjs` exit 0 |
| M-17 | GUARD-2 CSS var integrity | `node scripts/check-css-vars.mjs` exit 0 |
| M-18 | AlertBanner stacked row `border-l-8` — §01 Critical note (리뷰 명시 누락 보완) | `grep -n "border-l-8" apps/frontend/lib/design-tokens/components/dashboard.ts` ≥ 1 |
| M-19 | system_admin `bottomRowAdmin` [1.5fr_1fr] — §04 Warning (P2) | `DASHBOARD_GRID.bottomRowAdmin` 존재 + `DashboardClient` 분기 |

---

## SHOULD Criteria

> FAIL 허용. 실패 시 `tech-debt-tracker.md`에 등록 후 다음 PR.

| ID | 기준 |
|---|---|
| S-01 | AP-15 DashboardLayout 추출 후 DashboardClient.tsx ≤ 80 라인 |
| S-02 | AP-16 dynamic import First Load JS 실측 -15KB 이상 절감 |
| S-03 | Dark mode 시각 회귀 0건 (`emulateMedia({ colorScheme: 'dark' })`) |
| S-04 | AlertBanner stacked + info + trailing variant 사용자 시나리오 데모 (메모리 [feedback_explain_ui_after_tests]) |
| S-05 | LCP/CLS 측정 기록 (Chrome DevTools Performance 패널 1 측정) |
| S-06 | Lighthouse Performance 점수 ≥ baseline (회귀 0) |
| S-07 | sticky-header `--sticky-header-height` AlertBanner 후보 진단 보고 |
| S-08 | AlertBanner variant 전환 빈도 telemetry 후속 `tech-debt-tracker.md` 등록 |

---

## Domain Criteria

> Evaluator가 DOM 또는 코드로 직접 검증하는 기능적 기준.

| 항목 | 검증 방법 |
|---|---|
| 부적합 KPI: `nonConforming > 0` 시 border + bg-tint + ring 3중 적용 | DOM className 검증 |
| Hero bar threshold: `[data-threshold="40"]` + `[data-threshold="70"]` 존재 | `page.locator('[data-threshold="70"]')` |
| Hero bar meter: `role="meter"` + `aria-valuenow` 속성 | DOM attribute |
| AlertBanner inline: `role="alert"` | DOM role |
| AlertBanner stacked (totalCount ≥ 10): `role="region"` + `aria-label` + severity row 분리 | DOM 구조 |
| AlertBanner countPill: `min-w-[1.75rem] h-7` (99+ 가변폭) | DOM className |
| AlertBanner info: critical=0, warning=0, upcoming>0 → info variant 진입 | 시나리오 TC-15 |
| AlertBanner trailing: lab_manager/technical_manager → 승인 버튼 가시 | e2e |
| QuickAction 터치 타겟: 모든 `[data-action]` `getBoundingClientRect().height >= 36` | Playwright evaluate |
| QuickAction 아이콘: `h-4 w-4` (16px) | DOM className |
| Sidebar system_admin: 3 widget 가시 + 마지막 widget flex-grow + overflow 없음 | e2e + DOM |
| role config quality_manager: `.row3Layout === 'three-col-action-first'` | 코드 grep |
| role config test_engineer: `.showMyActivity === true` | 코드 grep |
| prefers-reduced-motion: `globals.css`에 `@media (prefers-reduced-motion: reduce)` 존재 | grep |
| inline style animationDelay: `DashboardClient.tsx` 내 `style={{animationDelay` 0건 | grep = 0 |
| UTILIZATION_THRESHOLDS SSOT: `KpiStatusGrid.tsx` 내 `UTILIZATION_HIGH` / `UTILIZATION_MEDIUM` 리터럴 0건 | grep = 0 |
| AlertBanner stacked row: `border-l-8` (border-l-4 아님) — §01 Critical note | DOM className 검증 |
| AlertBanner allClear compact: totalCount=0 시 `py-1.5` + `border-dashed` 적용 — §05 Warning 3 | DOM className 검증 |
| system_admin bottomRow: `xl:grid-cols-[1.5fr_1fr]` (`[2fr_1fr]` 아님) — §04 Warning | DASHBOARD_GRID.bottomRowAdmin grep |
| ALERT_BANNER_STACKED_THRESHOLD: `dashboard-config.ts`에서 `export const ALERT_BANNER_STACKED_THRESHOLD = 10` | grep = 1 (AlertBanner import 확인) |

---

## Evaluator 실행 순서

1. contract MUST/SHOULD 기준 대조 (이 파일 기준)
2. `pnpm tsc --noEmit` + `pnpm --filter frontend run build`
3. `/verify-implementation` (13 verify-* 스킬 일괄)
4. `/review-architecture` (Mode 2 — 아키텍처 레이어 검증)
5. `/review-design` (frontend 변경사항 시각 평가)
6. `/playwright-e2e` (5 role × 4 viewport + TC-14/15)
7. bundle-gate (`node scripts/check-bundle-size.mjs`)
8. Domain Criteria 항목별 DOM/코드 검증
9. `.claude/evaluations/dashboard-design-overhaul.md` 작성 (handoff-formats.md 스키마)

---

## Generator 제약

1. `exec-plan`에 명시된 **36개 파일만** 변경 — 범위 외 파일 수정 금지
2. **"주변 코드 개선" 절대 금지** — 수술적 변경만
3. brand token 파일 내 `dark:bg-brand-*` 명시 금지 (CSS 변수 자동 전환)
4. 동적 보간 클래스 금지 (`text-brand-${key}` 등) — JIT-unsafe
5. 각 Phase 종료 시 **`pnpm tsc --noEmit` 통과 필수**
6. `any` 타입 0건, `eslint-disable` 0건

---

## 참고 문서

- `exec-plan`: `.claude/exec-plans/active/2026-04-26-dashboard-design-overhaul.md`
- `evaluation-report`: `.claude/evaluations/dashboard-design-overhaul.md` (Evaluator 작성)
- `tech-debt-tracker`: `.claude/exec-plans/tech-debt-tracker.md`
- `handoff-formats`: `.claude/skills/harness/references/handoff-formats.md`
