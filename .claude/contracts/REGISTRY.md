# Contracts Registry

Harness가 생성하는 MUST/SHOULD 평가 기준 파일 인덱스.
새 contract는 항상 `.claude/contracts/{slug}.md`에 생성, eval 완료 후 `completed/`로 이동.

---

## Active (진행 중)

| slug | 설명 | 시작일 |
|------|------|--------|
| `inspection-template-build-once` | 중간/자체점검 Build-Once Workflow Phase 1B/1C/1D — Template Snapshot DB + Soft Fork + Gallery (LIMS 표준) | 2026-05-01 |

---

## Backlog (계획됨, 미착수)

| slug | 설명 |
|------|------|
| `calibration-phase4-7` | calibration-phase4-7 |
| `checkout-sprint-2-5-2-8` | Checkout Sprint 2.5~2.8 — Token Layer 봉합 |
| `checkout-ux-u01-bulk-approval` | **(흡수됨 → `checkouts-v3-sprint45`)** Sprint 4.5 · U-01 — 일괄 승인 |
| `checkout-ux-u02-keyboard-shortcuts` | Sprint 4.5 · U-02 — 전역 단축키 + `?` 치트시트 모달 |
| `checkout-ux-u03-filter-sticky-saved-views` | Sprint 4.5 · U-03 — 필터 Sticky 헤더 + Saved Views (시스템 기본 + 사용자 |
| `checkout-ux-u04-inline-reject-presets` | Sprint 4.5 · U-04 — 인라인 반려 사유 + 프리셋 chips |
| `checkout-ux-u05-undo-toast` | Sprint 4.5 · U-05 — Undo 5초 토스트 + `useOptimisticMutation` `u |
| `checkout-ux-u06-qr-drawer` | Sprint 4.5 · U-06 — QR 한 번에 꺼내기 drawer (페이지 전환 없음) |
| `checkout-ux-u07-context-restore` | **(흡수됨 → `checkouts-v3-sprint45`)** Sprint 4.5 · U-07 — 돌아가기 컨텍스트 보존 |
| `checkout-ux-u08-destination-combobox` | Sprint 4.5 · U-08 — Destination 자동완성 combobox + 최근 목적지 + fuz |
| `checkout-ux-u09-dday-color-temperature` | **(흡수됨 → `checkouts-v3-sprint45`)** Sprint 4.5 · U-09 — D-day 시각 6-level (4-tier SSOT 보존) |
| `checkout-ux-u10-optimistic-skeleton` | **(흡수됨 → `checkouts-v3-sprint45`)** Sprint 4.5 · U-10 — Optimistic UI + Skeleton 일관성 |
| `checkout-ux-u11-nav-your-turn-badge` | **(흡수됨 → `checkouts-v3-sprint45`)** Sprint 4.5 · U-11 — Sidebar pendingCount 배지 |
| `checkout-ux-u12-empty-error-recovery` | **(흡수됨 → `checkouts-v3-sprint45`)** Sprint 4.5 · U-12 — Empty/Error 복구 경로 |
| `checkouts-phase3-inline-action` | checkouts-phase3-inline-action |
| `checkouts-phase4-5-wireframe-gaps` | — Checkouts Phase 4.5 (Wireframe GAP 보정 + verify Step 46/47) |
| `checkouts-phase4-kpi-hierarchy` | — 반출입 Phase 4 (P1-1 KPI 1-hero + 3-mini) |
| `dashboard-phase4-6` | dashboard-phase4-6 |
| `data-migration-m1` | — data-migration M1 |
| `data-migration-m2` | data-migration-m2 |
| `qr-phase2-scanner-ncr-labels` | 스프린트 계약: QR Phase 2 — 라벨 PDF 일괄 + 앱 내 스캐너 + 원탭 NCR |
| `qr-phase3-handover` | 스프린트 계약: QR Phase 3 — Handover 서명 토큰 |
| `rental-phase3-4` | rental-phase3-4 — Scope Guard Branching & Borrower Approval  |
| `rental-phase5-8` | rental-phase5-8 |
| `rental-phase9-borrower-unit-tests` | rental 2-step Phase 9 — borrowerApprove/borrowerReject 유닛 테스 |

---

## Completed

`completed/` 폴더에 192개 (2026-04-30: completed-ar13-self-inspection-approval + nc-design-review-phases + dashboard-role-layout + ul-qp-18-forms-replacement + e2e-63-fixes 일괄 이동 — stale-contract-cleanup 세션). 검색: `ls .claude/contracts/completed/ | grep <slug>`