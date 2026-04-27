# Contract: dashboard-phase4-6

> **Slug**: `dashboard-phase4-6`
> **Date**: 2026-04-27
> **Parent Plan**: `.claude/exec-plans/completed/2026-04-26-dashboard-design-overhaul.md` (Phase 4~6)

---

## Scope

Phase 6 → Phase 5 → Phase 4 순서로 진행.

| Phase | 작업 | 파일 수 |
|-------|------|---------|
| 6 | DashboardLayout 추출 (Row0~4 신규 + DashboardClient 축소) | 6 |
| 5 | Build-time Guards (check-role-config-sync + check-css-vars) | 3 |
| 4.1 | auth-role-access.spec.ts — quality_manager + system_admin | 1 |
| 4.2 | alert-kpi.spec.ts — stacked + info 시나리오 | 1 |
| 4.3 | responsive.spec.ts — 1024/1280/1440/1920 viewport | 1 |

---

## MUST Criteria (모두 PASS 필요)

| # | 기준 | 검증 방법 |
|---|------|----------|
| M1 | `DashboardRow0~4.tsx` 5개 파일이 `layout/` 디렉토리에 존재 | `ls components/dashboard/layout/` |
| M2 | `DashboardClient.tsx` ≤ 200 라인 (450 → ~200) | `wc -l DashboardClient.tsx` |
| M3 | DashboardRow 파일 내 `useQuery` import 0건 | `grep -r "useQuery" layout/` |
| M4 | `pnpm --filter frontend tsc --noEmit` 0 errors | tsc 실행 |
| M5 | `pnpm --filter frontend build` 성공 | build 실행 |
| M6 | `scripts/check-role-config-sync.mjs` 존재 + exit 0 | `node scripts/check-role-config-sync.mjs` |
| M7 | `scripts/check-css-vars.mjs` 존재 + exit 0 | `node scripts/check-css-vars.mjs` |
| M8 | `auth-role-access.spec.ts`에 `quality_manager` 시나리오 추가 | `grep -c "quality_manager\|품질책임자" auth-role-access.spec.ts` ≥ 1 |
| M9 | `alert-kpi.spec.ts`에 stacked variant(role="region") 테스트 추가 | `grep -c "stacked\|region" alert-kpi.spec.ts` ≥ 1 |
| M10 | `responsive.spec.ts`에 1280/1440 viewport 시나리오 추가 | `grep -c "1280\|1440" responsive.spec.ts` ≥ 2 |

---

## SHOULD Criteria (실패 시 tech-debt 등록, 루프 차단 없음)

| # | 기준 |
|---|------|
| S1 | `data-widget` 속성이 DashboardRow4 사이드바 위젯 컨테이너에 존재 |
| S2 | visual-regression.spec.ts 파일 생성 (baseline 캡처는 수동) |
| S3 | `package.json` prebuild에 두 guard 스크립트 추가 |

---

## Generator 제약 (CLAUDE.md 원칙 준수)

1. exec-plan 명시 파일 외 변경 금지 (인접 코드 개선 금지)
2. `any` 타입 0건, `eslint-disable` 0건
3. brand token `dark:` 직접 명시 금지 (CSS 변수 자동 전환)
4. DashboardRow 파일에 `useQuery`, `useSession`, `useSearchParams` 등 데이터 훅 사용 금지
5. 기존 E2E 시나리오가 그대로 통과해야 함 (행동 변경 없음)
