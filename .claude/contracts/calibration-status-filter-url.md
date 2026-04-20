# Contract: calibration-status-filter-url

## Problem
`CalibrationContent.tsx`와 `CalibrationStatsCards.tsx`가 제거된 `EquipmentStatus` 값인 `calibration_scheduled` / `calibration_overdue`를 URL `status=` 파라미터로 전송. 백엔드 `ZodValidationPipe`가 400으로 차단.

## Root Cause
`calibration_scheduled` → `calibrationDue` 기반 derived 필터로 대체됨 (migration 0013).
`calibration_overdue` → 스케줄러가 `non_conforming`으로 직접 전환. derived 필터 `calibrationOverdue=true` 사용.

## Fix Scope
- `apps/frontend/app/(dashboard)/calibration/CalibrationContent.tsx` (2개 URL)
- `apps/frontend/components/calibration/CalibrationStatsCards.tsx` (2개 URL)

## MUST Criteria

| # | Criterion | Pass Condition |
|---|-----------|----------------|
| M1 | `status=calibration_scheduled` 제거 | grep 결과 0건 (docs/archive 제외) |
| M2 | `status=calibration_overdue` 제거 | grep 결과 0건 (docs/archive 제외) |
| M3 | 교정 임박 링크가 `calibrationDueFilter=due_soon` 사용 | grep 결과 2건 (두 파일 각각) |
| M4 | 교정 기한 초과 링크가 `calibrationDueFilter=overdue` 사용 | grep 결과 2건 (두 파일 각각) |
| M5 | TypeScript 타입 오류 없음 | `pnpm --filter frontend tsc --noEmit` exit 0 |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | `CalibrationStatsCards.tsx` 하드코딩 `/equipment` → `FRONTEND_ROUTES.EQUIPMENT.LIST` 교체 (SSOT) |
