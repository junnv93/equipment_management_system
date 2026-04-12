# Contract: Frontend Loose Typing → SSOT Enum 적용

- **Slug**: frontend-loose-typing
- **Mode**: 1 (Lightweight)
- **Date**: 2026-04-12

## Scope

프론트엔드 컴포넌트에서 `status: string`, `role: string`으로 선언된 파라미터를
`@equipment-management/schemas`의 SSOT enum 타입으로 교체.

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `pnpm tsc --noEmit` exit 0 (backend + frontend + packages) | CLI |
| M2 | `pnpm --filter frontend run build` exit 0 | CLI |
| M3 | `grep 'status: string' apps/frontend/components` → 허용 예외만 남음 (test 파일 제외) | Grep |
| M4 | `grep 'role: string' apps/frontend/components` → 허용 예외만 남음 (test 파일 제외) | Grep |
| M5 | 모든 교체된 enum은 `@equipment-management/schemas`에서 import (SSOT) | verify-ssot |
| M6 | 기존 기능 회귀 없음 — 변경된 컴포넌트 caller site에서 타입 에러 없음 | tsc |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | MonitoringDashboardClient의 status 함수들이 discriminated union으로 구현됨 |
| S2 | 변경 파일 수 ≤ 15 |

## Allowed Exceptions

| File | Field | Reason |
|------|-------|--------|
| MonitoringDashboardClient.tsx | `status: string` (3 hits) | 시스템 모니터링 health status (ok/up/healthy/warning/critical) — SSOT enum 없음, 동적 외부 값 |
| AuditTimelineFeed.tsx | `roleLabel: (role: string)` (2 hits) | audit_logs.user_role은 비정규화된 VARCHAR 스냅샷 — 과거 enum 값 포함 가능 |

## Out of Scope

- calibration, users 모듈 (다른 세션 작업 중)
- 컴포넌트 분리/리팩토링
- approvals-api.ts unsafe cast (별도 프롬프트)
