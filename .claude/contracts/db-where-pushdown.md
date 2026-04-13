# Contract: db-where-pushdown

**Slug**: db-where-pushdown  
**Mode**: 1 (Lightweight)  
**Date**: 2026-04-13  
**Source**: example-prompts.md — 46차 🟡 MEDIUM — DB WHERE push-down: JS 인메모리 필터 → Drizzle gte/lt 조건

---

## Deliverables

1. `apps/backend/src/modules/calibration-plans/calibration-plans.service.ts`
   - line ~166-177: JS `.filter(nextDate >= startOfYear && nextDate < endOfYear)` → Drizzle `gte/lt` WHERE 조건으로 이동
   - line ~869-876: 동일 패턴 (getEligibleEquipments — year 파라미터 조건부 gte/lt)

2. `apps/backend/src/modules/calibration/calibration.service.ts`
   - line ~1603-1622: 3개 독립 `.filter()` → 단일 `reduce()` O(n)으로 통합

---

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `pnpm tsc --noEmit` exit 0 | CLI |
| M2 | `pnpm --filter backend run test` 578+ PASS | CLI |
| M3 | calibration-plans JS filter 제거 | `grep -n '\.filter.*nextDate\|\.filter.*startOfYear' apps/backend/src/modules/calibration-plans/calibration-plans.service.ts` → 0 hit |
| M4 | calibration.service reduce 통합 | `grep -n 'overdueCount.*filter\|pendingCount.*filter\|dueCount.*filter' apps/backend/src/modules/calibration/calibration.service.ts` → 0 hit |
| M5 | Drizzle gte/lt 조건 추가 확인 | `grep -n 'gte.*nextCalibrationDate\|lt.*nextCalibrationDate' apps/backend/src/modules/calibration-plans/calibration-plans.service.ts` → 2+ hit |

---

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | null nextCalibrationDate는 gte/lt가 자동 false → 기존 if 체크와 동일 동작 주석 |

---

## Out of Scope

- calibration-plans 외 다른 도메인
- 프론트엔드 변경
