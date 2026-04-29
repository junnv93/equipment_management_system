# Contract: dashboard-design-review-0427

> **Date**: 2026-04-27
> **Mode**: harness Mode 1 (Evaluator-only — Phase 1~3 구현 완료 상태 독립 검증)
> **Slug**: `dashboard-design-review-0427`
> **Generator**: N/A (Phase 1~3 이미 커밋됨)
> **Evaluator**: sonnet (independent agent)

---

## Context

이전 세션에서 Dashboard Design Overhaul AP-01~16(Phase 1~3)이 완료 및 커밋되었다.
Phase 4~6(E2E, Bundle, Build Guards, Layout 추출)은 아직 미구현 상태이다.

이번 Evaluator 실행 목적:
1. **설계 품질 독립 검증** — /review-design으로 시니어 수준 디자인 리뷰
2. **SSOT/하드코딩/i18n/design-token 아키텍처 정합성** — verify-* 스킬 일괄
3. **TypeScript + Build 통과 재확인** — 커밋 이후 환경 변화 가능성
4. **Phase 4~6 진행 전 기술 부채 사전 발굴** — 발견 이슈는 tech-debt-tracker.md 등록

---

## Scope (평가 대상 파일 — Phase 1~3 구현)

| 파일 | 변경 유형 |
|---|---|
| `apps/frontend/lib/config/dashboard-config.ts` | M |
| `apps/frontend/lib/utils/dashboard-role.ts` | C |
| `apps/frontend/lib/utils/utilization-state.ts` | C |
| `apps/frontend/lib/utils/use-count-up.ts` | C |
| `apps/frontend/lib/utils/use-prefers-reduced-motion.ts` | C |
| `apps/frontend/lib/design-tokens/components/dashboard.ts` | M |
| `apps/frontend/components/dashboard/DashboardClient.tsx` | M |
| `apps/frontend/components/dashboard/KpiStatusGrid.tsx` | M |
| `apps/frontend/components/dashboard/AlertBanner.tsx` | M |
| `apps/frontend/components/dashboard/QuickActionBar.tsx` | M |
| `apps/frontend/components/dashboard/MyActivityCard.tsx` | C |
| `apps/frontend/app/(dashboard)/page.tsx` | M |
| `apps/frontend/app/(dashboard)/loading.tsx` | M |
| `apps/frontend/styles/globals.css` | M |
| `apps/frontend/messages/ko/dashboard.json` | M |
| `apps/frontend/messages/en/dashboard.json` | M |
| `apps/frontend/components/dashboard/__tests__/AlertBanner.test.tsx` | C |
| `apps/frontend/components/dashboard/__tests__/MyActivityCard.test.tsx` | C |

---

## MUST Criteria

> 모두 PASS 시 Phase 4~6 진행 승인. 단 하나라도 FAIL이면 Fix Loop 진입.

| ID | 기준 | 검증 방법 |
|---|---|---|
| M-01 | TypeScript 컴파일 통과 | `pnpm --filter frontend run tsc --noEmit` |
| M-02 | Frontend 빌드 통과 | `pnpm --filter frontend run build` |
| M-03 | verify-design-tokens — brand `dark:` 0건 + FOCUS_TOKENS 적용 | `/verify-design-tokens` |
| M-04 | verify-ssot — DASHBOARD_ROLE_CONFIG inline ≤ 2 | `grep -rn "DASHBOARD_ROLE_CONFIG\[" apps/frontend --include="*.ts" --include="*.tsx" \| grep -v "dashboard-config\|test\|spec" \| wc -l` ≤ 2 |
| M-05 | verify-hardcoding — 3종 인라인 0건 | `lg:grid-cols-[` in components = 0, `UTILIZATION_HIGH` in components = 0, `min-h-\[.*rem\]` in components = 0 |
| M-06 | verify-i18n — ko/en parity 0건 | `diff <(jq -r 'paths(scalars)\|join(".")' apps/frontend/messages/ko/dashboard.json\|sort) <(jq -r 'paths(scalars)\|join(".")' apps/frontend/messages/en/dashboard.json\|sort) \| wc -l` = 0 |
| M-07 | review-design PASS — 업계 표준 설계 기준 시니어 레벨 리뷰 | `/review-design` 스킬 실행 → Score 확인 |
| M-08 | review-architecture PASS — 아키텍처 레이어 위반 0건 | `/review-architecture` 스킬 실행 |
| M-09 | AlertBanner stacked `border-l-8` 존재 (§01 Critical) | `grep -n "border-l-8" apps/frontend/lib/design-tokens/components/dashboard.ts` ≥ 1 |
| M-10 | `style={{animationDelay` 0건 — 인라인 스타일 animationDelay 제거 확인 | `grep -rn "animationDelay" apps/frontend/components/dashboard/DashboardClient.tsx \| wc -l` = 0 |
| M-11 | UTILIZATION_THRESHOLDS SSOT — KpiStatusGrid 내 리터럴 0건 | `grep -n "UTILIZATION_HIGH\|UTILIZATION_MEDIUM" apps/frontend/components/dashboard/KpiStatusGrid.tsx \| wc -l` = 0 |
| M-12 | ALERT_BANNER_STACKED_THRESHOLD export 확인 | `grep -n "ALERT_BANNER_STACKED_THRESHOLD" apps/frontend/lib/config/dashboard-config.ts` ≥ 1 |
| M-13 | prefers-reduced-motion `@media` 글로벌 선언 | `grep -n "prefers-reduced-motion" apps/frontend/styles/globals.css` ≥ 1 |
| M-14 | frontend 단위 테스트 통과 (AlertBanner + MyActivityCard + useCountUp) | `pnpm --filter frontend run test -- --testPathPattern="AlertBanner\|MyActivityCard\|use-count-up"` |

---

## SHOULD Criteria

> FAIL 허용. 실패 시 `tech-debt-tracker.md` 등록.

| ID | 기준 |
|---|---|
| S-01 | review-design 점수 ≥ 85/100 (시니어 웹 설계 기준) |
| S-02 | QuickAction `data-action` 속성 + 터치 타겟 h ≥ 36px 확인 |
| S-03 | Hero bar `[data-threshold]` 속성 DOM 존재 |
| S-04 | AlertBanner `role="alert"` (inline) + `role="region"` (stacked) 분기 |
| S-05 | DashboardClient `placeholderData` 순서 정합성 |
| S-06 | `any` 타입 0건, `eslint-disable` 0건 (Phase 1~3 파일 범위) |

---

## Evaluator 실행 순서

1. `pnpm --filter frontend run tsc --noEmit` (M-01)
2. `pnpm --filter frontend run build` (M-02)
3. `pnpm --filter frontend run test -- --testPathPattern="AlertBanner|MyActivityCard|use-count-up"` (M-14)
4. MUST M-03~M-13 grep 기반 검증 (각 명령 실행)
5. `/verify-design-tokens` 스킬 (M-03)
6. `/verify-ssot` 스킬 (M-04)
7. `/verify-hardcoding` 스킬 (M-05)
8. `/verify-i18n` 스킬 (M-06)
9. `/review-architecture` 스킬 (M-08)
10. `/review-design` 스킬 (M-07) — **핵심: 시니어 레벨 설계 품질 평가**
11. `.claude/evaluations/dashboard-design-review-0427.md` 작성 (PASS/FAIL 판정 + 수정 지시)

---

## 산출물

- `.claude/evaluations/dashboard-design-review-0427.md` — Evaluator 리포트
- `SHOULD 실패` → `.claude/exec-plans/tech-debt-tracker.md` 등록
- `MUST FAIL` → Fix Loop (Generator가 수정 후 재평가)

---

## 참고 문서

- 기존 계약: `.claude/contracts/dashboard-design-overhaul.md`
- exec-plan: `.claude/exec-plans/completed/2026-04-26-dashboard-design-overhaul.md`
- handoff-formats: `.claude/skills/harness/references/handoff-formats.md`
- tech-debt-tracker: `.claude/exec-plans/tech-debt-tracker.md`
