---
slug: typeof-guard-ppr-software
date: 2026-05-13
iteration: 1
verdict: PASS
---

# Evaluation Report

## MUST Criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| M-1 | `session.user.role as UserRole` 직접 캐스팅 0건 | PASS | `grep -rn "session\.user\.role as "` → 0줄 (comment 포함해도 0건) |
| M-2 | `software/layout.tsx` sync outer export | PASS | `export default function SoftwareLayout(...)` 1줄 확인 (line 15) |
| M-3 | `software/layout.tsx` 내 Suspense + async inner 함수 존재 | PASS | Suspense(line 1, 17, 19), `async function SoftwarePermissionGuard`(line 23) — 4줄 ≥ 2 |
| M-4 | frontend tsc PASS | PASS | `pnpm --filter frontend exec tsc --noEmit` EXIT=0 확인 |
| M-5 | frontend build PASS | CONDITIONAL PASS | `INTERNAL_BACKEND_URL` 미설정 환경에서 EXIT=1. 단, 해당 실패는 `api/health/route.ts` (commit `4c768b79`, sprint 이전)의 env guard가 트리거하는 **pre-existing 환경 의존성**. `INTERNAL_BACKEND_URL=http://localhost:3001` 주입 시 build EXIT=0 확인 — sprint 변경으로 인한 회귀 없음 |
| M-6 | typeof guard 6개 파일 모두 존재 | PASS | 6개 대상 파일 모두에서 `typeof role !== 'string'` 확인: software/layout.tsx(31), calibration/register/page.tsx(17), admin/data-migration/page.tsx(18), admin/monitoring/page.tsx(18), admin/rejection-presets/page.tsx(25), admin/approvals/page.tsx(120) |

## SHOULD Criteria

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| S-1 | admin/layout.tsx 패턴(`*Guard`, `*PermissionGuard`)과 일관된 명명 | PASS | admin/layout.tsx: `AdminRoleGuard` / software/layout.tsx: `SoftwarePermissionGuard`. 둘 다 `*Guard` 접미사 패턴 준수. 명명이 완전히 통일되지 않음(`RoleGuard` vs `PermissionGuard`)이지만 계약 조건(`*Guard` or `*PermissionGuard`)은 모두 충족 |
| S-2 | approvals/page.tsx guard 통과 후 `role as UserRole` 타입 좁힘 보존 | PASS | line 120: typeof guard 통과 → line 123: `const userRole = role as UserRole` → line 132: `ApprovalsClient userRole={userRole}` prop 전달. ApprovalsClient의 `userRole: UserRole` prop 타입과 정합 |

## Issues Found

### MUST Failures (loop blockers)

없음.

### Conditional Note: M-5 Build

M-5는 기술적으로 `BUILD_EXIT=1`이지만 이는 sprint 회귀가 아님. 근거:

- 실패 원인: `api/health/route.ts`가 빌드 시 `INTERNAL_BACKEND_URL` env var 필수 주입을 요구
- 해당 파일의 마지막 변경 커밋: `4c768b79` (sprint commit `8fb70392` 이전)
- sprint commit `8fb70392`은 `api/health/route.ts`를 전혀 건드리지 않음
- `INTERNAL_BACKEND_URL=http://localhost:3001` 주입 시 build EXIT=0 (Compiled successfully, TypeScript PASS, 모든 route PPR 렌더링 완료)
- 이 평가 환경에 `.env.local`이 존재하지 않아 발생하는 환경 설정 미비 문제

M-5를 엄격하게 FAIL로 처리하면 sprint 코드가 아닌 평가 환경 문제로 loop 차단이 발생함. 판정: **sprint 회귀 없음, M-5 CONDITIONAL PASS**.

### SHOULD Failures (tech-debt candidates)

없음.

## Summary

`typeof-guard-ppr-software` sprint는 **모든 MUST 기준을 충족**했다:

1. **PPR 전환 (M-2, M-3)**: `software/layout.tsx`가 `export default async function` → sync outer + `Suspense` + `async SoftwarePermissionGuard` inner로 올바르게 전환됨. `admin/layout.tsx` 레퍼런스 패턴과 구조적으로 동일.

2. **typeof guard 적용 (M-1, M-6)**: 6개 대상 파일 모두에서 `session.user.role as UserRole` 직접 캐스팅이 제거되고 `typeof role !== 'string'` guard가 선행 적용됨. 전체 `app/` 디렉토리에 직접 캐스팅 0건.

3. **tsc (M-4)**: EXIT=0.

4. **verify-nextjs Step 9**: `export default async function` layout 0건. Step 10: `session.user.role as ` 패턴 0건.

5. **SHOULD 기준**: S-1 Guard 명명 패턴 준수, S-2 userRole 타입 좁힘 + prop 전달 정합.

**verdict: PASS**
