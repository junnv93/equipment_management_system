# Evaluation: calibration-status-filter-url

**Date**: 2026-04-20
**Contract**: `.claude/contracts/calibration-status-filter-url.md`
**Evaluator**: QA Agent (claude-sonnet-4-6)

---

## MUST Criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| M1 | `status=calibration_scheduled` 제거 | **PASS** | grep (app/ + components/ + hooks/ + lib/) → 0건 |
| M2 | `status=calibration_overdue` 제거 | **PASS** | grep (app/ + components/ + hooks/ + lib/) → 0건. tests/ 내 3건 존재하나 계약 스코프 밖 |
| M3 | `calibrationDueFilter=due_soon` ≥2건 | **PASS** | `CalibrationContent.tsx:213`, `CalibrationStatsCards.tsx:38` — 정확히 2건 |
| M4 | `calibrationDueFilter=overdue` ≥2건 | **PASS** | `CalibrationContent.tsx:210`, `CalibrationStatsCards.tsx:37` — 정확히 2건. `AlertBanner.tsx:92`에도 추가 확인 |
| M5 | TypeScript 타입 오류 없음 | **PASS** | `pnpm tsc --noEmit` exit 0 |

**MUST 결과: 5/5 PASS**

---

## SHOULD Criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| S1 | `CalibrationStatsCards.tsx` 하드코딩 `/equipment` → `FRONTEND_ROUTES.EQUIPMENT.LIST` 교체 | **PASS** | L13에 `FRONTEND_ROUTES` import, KPI_LINKS 전체가 `FRONTEND_ROUTES.EQUIPMENT.LIST` 사용. 하드코딩 문자열 없음 |

---

## 추가 스캔 — 계약 명시 외 잠재 문제

### tests/ 내 `status=calibration_overdue` 잔존

`tests/e2e/` 3개 파일에서 deprecated 값이 남아 있음:
- `tests/e2e/features/equipment/list/group-a-calibration-display.spec.ts:78` — `goto('/equipment?status=calibration_overdue')`
- `tests/e2e/features/equipment/list/group-a-filter-status.spec.ts:126–127` — `waitForURL(/status=calibration_overdue/)` + `toHaveURL(/status=calibration_overdue/)`

이 테스트들은 백엔드 400을 받거나 빈 결과를 반환할 가능성 높음. 계약 스코프 밖이므로 MUST 판정에 영향 없으나, 별도 수정 대상으로 기록.

### lib/ 내 `calibration_overdue` 참조

`lib/constants/`, `lib/design-tokens/`, `lib/config/dashboard-config.ts` 등에서 `calibration_overdue` 문자열 존재하나 모두 URL query param이 아닌 도메인 레이블/디자인 토큰/댓글 용도. 계약 위반 아님.

### AlertBanner.tsx 수정 확인

L91–93: `buildScopedUrl(scope, FRONTEND_ROUTES.EQUIPMENT.LIST, { calibrationDueFilter: 'overdue' })` — 올바르게 수정됨.
`buildScopedEquipmentUrl`은 `NON_CONFORMING` 상태에만 사용 중 (L79–84) — 이것은 유효한 `EquipmentStatus` 값이므로 문제 없음.

---

## 최종 판정

**PASS** — MUST 5개 전부 통과. SHOULD 1개 통과.

미해결 사항: `tests/e2e/` 내 deprecated `status=calibration_overdue` 3건은 계약 스코프 밖이나 테스트 신뢰성에 영향을 줄 수 있어 후속 정리 권장.
