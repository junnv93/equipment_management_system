# Contracts Registry

Harness가 생성하는 MUST/SHOULD 평가 기준 파일 인덱스.
새 contract는 항상 `.claude/contracts/{slug}.md`에 생성, eval 완료 후 `completed/`로 이동.

---

## Active (진행 중)

| slug | 설명 | 시작일 |
|------|------|--------|
| `query-dto-validation-ssot` | Backend Query DTO trim/max + sort enum SSOT — 11 DTO + 1 schemas SSOT, optionalTrimmedString helper, per-domain sort enum + mapper | 2026-05-05 |
---

## Backlog (계획됨, 미착수)

| slug | 설명 |
|------|------|
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

`completed/` 폴더에 320개 (2026-05-03: +calibration-design-review-phase1, +team-management-design-review, +github-actions-ci-stability. +production-env-api-ssot, +quality-audit-ssot, +quality-audit-auth-routes, +validation-rules-domain-constants, +data-migration-preview-windowing, +validation-message-pagination-residual, +revoke-approval-dto-trim-symmetry, +calibration-created-linked-plan-item-sse, +frontend-error-enum-ssot-migration, +inspection-mobile-760-e2e, +user-error-backend-code-routing, +frontend-mapper-unit-test, +software-validation-pagesize-ssot, +equipment-import-invalidation-keys-ssot, +calibration-action-button-aria-labels, +document-file-frontend-error-mapper, +inspection-template-frontend-error-mapper, +verify-implementation-orphan-skills-registration, +frontend-state-cas-step-details, +backfill-inspection-templates-unit-test, +frontend-types-ssot-cleanup, +inspection-template-developer-docs, +review-architecture-defense-in-depth-audit, +inspection-template-gallery-sql-filtering, +disposal-review-calibration-reject-fail-close, +inspection-template-analytics-events, +inspection-template-feature-flag, +disposal-opinion-comment-zod-min10-defense-closure, +sidebar-nav-aria-key-literal-union, +sidebar-row-container-li-semantics, +nc-design-review-phases-eslint-disable-cleanup, +lab-manager-explicit-permission-spec-closure, +create-test-equipment-token-deprecation-closure, +checkouts-pending-hero-priority, +playwright-trace-on-failure-policy, +eslint-require-randomuuid-alias-guard, +eslint-require-alias-rename-gap-closure, +second-skip-link-row1-closure, +analytics-events-registry-production-callers, +checkout-row-onclick-callback, +frontend-id-helper-trigger-closure, +charscounter-min-mode-disposal, +checkout-zone2-status-truncate-closure, +groupcard-usecallback-t-scan, +stagger-low-spec-guard, +checkout-row-mobile-stacking, +wf34-t2-fixture-clarity, +approval-detail-modal-mobile-fullscreen, +nc-open-blocked-repair-quality-manager-guidance, +analytics-role-prop-convention, +checkout-help-status-ui-namespace, +inspection-template-controller-integration-test, +i18n-disposal-rename-static-closure, +approval-stepper-disposal-start-node-label, +approval-vocabulary-unification, +phase3-design-token-verifier, +harness-contract-collateral-exceptions, +e2e-error-code-integration-spec, +use-optimistic-mutation-matching-scope, +bulk-action-bar-wrapper-dedup-verification, +findall-meta-fallback-path-design-closure, +fsm-response-interceptor-guard, +verify-frontend-state-split, +verify-e2e-split, +checkout-display-steps-schema-ssot, +ap16-ssr-strategy-docs, +checkout-summary-delay-meta, +phase-4-6-sparkline-trend-api, +bundle-baseline-refresh-20260503, +bulk-double-find-checkout, +monitoring-auth-404-alert-rule, +csp-report-endpoint-violation-monitoring, +e2e-gallery-ui-auto-show, +minicalendar-typo-tokens-vs-spec, +fail-closed-e2e-matrix-expansion, +approval-audit-timeline-ui, +quality-approve-comment-policy, +simulate-role-audit-log-observability, +emptystate-3-file-dedup, +dashboard-spec-helper-return-type-policy, +e2e-your-turn-badge-coverage, +sv-playwright-browser-approve-dialog-verification, +ul-qp-18-11-ui-download-e2e, +e2e-soft-fork-apply-forward-submit, +e2e-cas-409-conflict-flow, +phase-k-backup-dr, +reject-reason-template-quickselect, +rejection-reason-max-length, +fsm-meta-drift-observability, +class-dto-migration-residual-closure, +sidebar-nav-action-e2e-manual-verify, +dday-baseline-png-initial-capture, +font-system-ssot). 검색: `ls .claude/contracts/completed/ | grep <slug>`
