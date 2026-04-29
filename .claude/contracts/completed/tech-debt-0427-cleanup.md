---
slug: tech-debt-0427-cleanup
date: 2026-04-27
mode: 1
domain: frontend (multi-component)
---

# Contract — tech-debt-0427-cleanup

## Scope

tech-debt-tracker.md Open 항목 중 즉시 실행 가능한 7개 항목의 아키텍처 수준 수정.

## MUST Criteria

| ID | Criterion | Verification |
|----|-----------|-------------|
| M1 | FRONTEND_ROUTES 하드코딩 8곳 모두 제거 — `/equipment`, `/calibration-plans`, `/non-conformances`, `/equipment/create` 직접 경로 없음 | `grep -rn "href=\"/equipment\"\|href=\"/calibration-plans\"\|href=\"/non-conformances\"\|href=\"/equipment/create\"" apps/frontend/components/ apps/frontend/app/` 0건 |
| M2 | `dark:text-brand-info` 제거 — dashboard.ts:101,105 `text-brand-info`만 사용 | `grep -n "dark:text-brand-info" apps/frontend/lib/design-tokens/components/dashboard.ts` 0건 |
| M3 | RejectModal helper text 추가 — REJECTION_MIN_LENGTH 기반 "10자 이상 입력" 힌트 Textarea 아래 표시 | `grep -n "minLengthHint\|minLength" apps/frontend/components/approvals/RejectModal.tsx` 1건 이상 |
| M4 | bulkReject 성공 후 모달 자동 닫힘 — `onClose()` bulk 성공 경로에 호출 | `grep -n "onClose\(\)" apps/frontend/components/approvals/RejectModal.tsx` mode=bulk 경로에서 호출 |
| M5 | `guidance.urgency.normal` 빈 문자열 해소 — ko/en 양쪽 빈 문자열 → 값 추가 또는 키 제거 | `grep "urgency" apps/frontend/messages/ko/checkouts.json apps/frontend/messages/en/checkouts.json` 빈 문자열 없음 |
| M6 | `text-brand-info font-medium` 잔존 0건 검증 — components 전수 스캔 | `grep -rn "text-brand-info font-medium\|font-medium text-brand-info" apps/frontend/components/` 0건 (또는 발견 시 token 교체) |
| M7 | DashboardRow4 `useTranslations` 제거 — `recentActivityAriaLabel?: string` prop 추가, DashboardClient에서 전달 | `grep "useTranslations" apps/frontend/components/dashboard/layout/DashboardRow4.tsx` 0건 |
| M8 | tsc 0 errors — frontend + backend | `pnpm --filter frontend exec tsc --noEmit` && `pnpm --filter backend exec tsc --noEmit` exit 0 |
| M9 | lint 0 errors | `pnpm --filter backend run lint` exit 0 |
| M10 | i18n parity — 신규 key ko+en 양쪽 추가 | `rejectModal.minLengthHint` ko+en, `guidance.urgency.normal` ko+en 값 존재 |
| M11 | SSOT 준수 — FRONTEND_ROUTES 경유, 로컬 재정의 없음 | `import { FRONTEND_ROUTES } from '@equipment-management/shared-constants'` 사용 |

## SHOULD Criteria (비차단)

| ID | Criterion |
|----|-----------|
| S1 | CalibrationPlansContent.tsx `/calibration-plans/create` → FRONTEND_ROUTES.CALIBRATION_PLANS.CREATE 교체 |
| S2 | equipment.ts:92 `dark:text-brand-info` 교체 (tracker 범위 외이나 동일 패턴) |
| S3 | not-found.tsx 파일들 하드코딩 경로 교체 (fallback 페이지 — 낮은 영향) |

## Target Files

### FRONTEND_ROUTES SSOT (P1) — 8곳
1. `apps/frontend/components/equipment/EquipmentStickyHeader.tsx:156`
2. `apps/frontend/components/calibration-plans/CalibrationPlanDetailClient.tsx:319`
3. `apps/frontend/components/non-conformances/NCDetailClient.tsx:354`
4. `apps/frontend/app/(dashboard)/calibration-plans/create/CreateCalibrationPlanContent.tsx:175,358`
5. `apps/frontend/app/(dashboard)/non-conformances/NonConformancesContent.tsx:651`
6. `apps/frontend/components/equipment/EquipmentPageHeader.tsx:68`
7. `apps/frontend/components/teams/TeamEquipmentList.tsx:138`

### Dark Prefix (P2)
- `apps/frontend/lib/design-tokens/components/dashboard.ts:101,105`

### RejectModal UX (P3+P4)
- `apps/frontend/components/approvals/RejectModal.tsx`
- `apps/frontend/messages/ko/approvals.json`
- `apps/frontend/messages/en/approvals.json`

### i18n (P5)
- `apps/frontend/messages/ko/checkouts.json`
- `apps/frontend/messages/en/checkouts.json`

### DashboardRow4 Architecture (P7)
- `apps/frontend/components/dashboard/layout/DashboardRow4.tsx`
- `apps/frontend/components/dashboard/DashboardClient.tsx`
