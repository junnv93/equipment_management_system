# Contract: frontend-ssot-typing

**Slug**: frontend-ssot-typing  
**Mode**: 1 (Lightweight)  
**Date**: 2026-04-14  
**Source**: example-prompts.md — 45차 🟡 MEDIUM — Frontend loose typing: status: string / role: string → SSOT enum 적용

---

## Deliverables

### status: string → enum 교체 (8곳)
1. `components/checkouts/CheckoutStatusBadge.tsx:17` → `CheckoutStatus`
2. `components/checkouts/CheckoutGroupCard.tsx:50` (RentalFlowInline) → `CheckoutStatus`
3. `components/equipment/VirtualizedEquipmentList.tsx:36` → `EquipmentStatus`
4. `components/equipment/EquipmentTable.tsx:83` → `EquipmentStatus`
5. `components/equipment/EquipmentStickyHeader.tsx:89` → `EquipmentStatus`
6. `components/equipment/CalibrationHistorySection.tsx:49` → `CalibrationStatus`
7. `components/equipment/NonConformanceBanner.tsx:12` → `NonConformanceStatus`
8. `components/monitoring/MonitoringDashboardClient.tsx:74,95,139` → 적절한 status enum 또는 union type

### role: string → UserRole 교체 (4곳)
9. `components/teams/TeamDetail.tsx:27` → `UserRole`
10. `components/auth/DevLoginButtons.tsx:33` → `UserRole`
11. `components/dashboard/WelcomeHeader.tsx:31` → `UserRole`
12. `components/audit-logs/AuditTimelineFeed.tsx:125` → `UserRole`

---

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `pnpm tsc --noEmit` exit 0 | CLI (frontend) |
| M2 | `grep 'status: string' apps/frontend/components` → 0 hit (test 파일 제외) | grep |
| M3 | `grep 'role: string' apps/frontend/components` → 0 hit | grep |
| M4 | SSOT enum import from `@equipment-management/schemas` | grep |

---

## SHOULD Criteria
| # | Criterion |
|---|-----------|
| S1 | MonitoringDashboardClient status union → 적절한 enum 명시 |

---

## Out of Scope
- checkouts 프론트엔드 페이지 (`app/(dashboard)/checkouts/`) — 다른 세션 작업 중
- 컴포넌트 로직 변경 (타입만 교체)
