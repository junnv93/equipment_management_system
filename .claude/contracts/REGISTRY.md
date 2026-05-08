# Contracts Registry

Harness가 생성하는 MUST/SHOULD 평가 기준 파일 인덱스.
새 contract는 항상 `.claude/contracts/{slug}.md`에 생성, eval 완료 후 `completed/`로 이동.

---

## Active (진행 중)

| slug | 설명 | 시작일 |
|------|------|--------|
| `calibration-cert-phase-a-closure` | 교정성적서 PDF 추출 Phase A 8 갭 atomic closure (controller + ErrorCode 5-layer + e2e + Dockerfile) | 2026-05-06 |
| `system-health-cluster-closure` | 4 tech-debt 통합 (Redis cluster-aware rate limiter + drops Counter + shim 삭제+ESLint 가드 + controller e2e) | 2026-05-08 |
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

`completed/` 폴더에 325개 (2026-05-07: +calibration-cert-phase-a-architecture-closure — Phase A 후속 시니어 자기 감사 6갭 옵션 C closure: sub-route(`/equipment/[id]/calibration-history`) + FilterChip SSOT + design token + AuditLog entityIdPath + RTL spec(CalibrationRegisterDialog 4 cases). Gap 2b(filter-chip 적용) + Gap 4(useEquipment chip data) + Gap 6b(CalibrationContent.test) 후속 sprint 분리(query-r3-closure commit 후 통합 마이그레이션). +nextauth-csrf-onprem-prod-verification — 2026-05-04 PASS 평가 후 archive 누락된 stale active contract closure. MUST 5/5 + SHOULD 2/2 모두 후속 sprint `nextauth-csrf-verify-harness` (2026-05-05~06)가 더 엄격한 자동화 contract로 흡수: §S3 manual curl→`pnpm compose:onprem:verify` SSOT smoke, §J1 manual reproduction→`scripts/diagnostics/nextauth-csrf-trace.mjs` 영구 진단 harness, ADR-0006 §Recurrence Response. 2026-05-07 재검증: verify-routing-origin.sh ALL PASS + api-routing 34/34 + onprem-verify dry-run EXIT 0 + Old API(middleware.ts/pages/api/auth) 회귀 0건. 2026-05-06: +ssot-recovery-3finding — 3 finding 통합 Mode 2 harness 4 phase: setup-node v6 SHA-pin 4 workflows + ApprovalDelegation ErrorCode 5-layer + backend bare Error 9 files + useEffectiveRole 12 client files + verify-* baseline. 다중 세션 sabotage 대응 학습. 2026-05-05: +nextauth-csrf-verify-harness — §S3 manual curl을 `pnpm compose:onprem:verify` SSOT 자동 스모크로 승격 + §J1 manual reproduction을 `scripts/diagnostics/nextauth-csrf-trace.mjs` 영구 진단 harness로 결빙 + ADR-0006 §Recurrence Response 신설. 2026-05-05: +query-dto-validation-ssot — Backend Query DTO 12개 trim/max + sort enum SSOT 13개 도메인 + verify-zod Step 20 + 12 spec/185 cases. 2026-05-03: +calibration-design-review-phase1, +team-management-design-review, +github-actions-ci-stability. +production-env-api-ssot, +quality-audit-ssot, +quality-audit-auth-routes, +validation-rules-domain-constants, +data-migration-preview-windowing, +validation-message-pagination-residual, +revoke-approval-dto-trim-symmetry, +calibration-created-linked-plan-item-sse, +frontend-error-enum-ssot-migration, +inspection-mobile-760-e2e, +user-error-backend-code-routing, +frontend-mapper-unit-test, +software-validation-pagesize-ssot, +equipment-import-invalidation-keys-ssot, +calibration-action-button-aria-labels, +document-file-frontend-error-mapper, +inspection-template-frontend-error-mapper, +verify-implementation-orphan-skills-registration, +frontend-state-cas-step-details, +backfill-inspection-templates-unit-test, +frontend-types-ssot-cleanup, +inspection-template-developer-docs, +review-architecture-defense-in-depth-audit, +inspection-template-gallery-sql-filtering, +disposal-review-calibration-reject-fail-close, +inspection-template-analytics-events, +inspection-template-feature-flag, +disposal-opinion-comment-zod-min10-defense-closure, +sidebar-nav-aria-key-literal-union, +sidebar-row-container-li-semantics, +nc-design-review-phases-eslint-disable-cleanup, +lab-manager-explicit-permission-spec-closure, +create-test-equipment-token-deprecation-closure, +checkouts-pending-hero-priority, +playwright-trace-on-failure-policy, +eslint-require-randomuuid-alias-guard, +eslint-require-alias-rename-gap-closure, +second-skip-link-row1-closure, +analytics-events-registry-production-callers, +checkout-row-onclick-callback, +frontend-id-helper-trigger-closure, +charscounter-min-mode-disposal, +checkout-zone2-status-truncate-closure, +groupcard-usecallback-t-scan, +stagger-low-spec-guard, +checkout-row-mobile-stacking, +wf34-t2-fixture-clarity, +approval-detail-modal-mobile-fullscreen, +nc-open-blocked-repair-quality-manager-guidance, +analytics-role-prop-convention, +checkout-help-status-ui-namespace, +inspection-template-controller-integration-test, +i18n-disposal-rename-static-closure, +approval-stepper-disposal-start-node-label, +approval-vocabulary-unification, +phase3-design-token-verifier, +harness-contract-collateral-exceptions, +e2e-error-code-integration-spec, +use-optimistic-mutation-matching-scope, +bulk-action-bar-wrapper-dedup-verification, +findall-meta-fallback-path-design-closure, +fsm-response-interceptor-guard, +verify-frontend-state-split, +verify-e2e-split, +checkout-display-steps-schema-ssot, +ap16-ssr-strategy-docs, +checkout-summary-delay-meta, +phase-4-6-sparkline-trend-api, +bundle-baseline-refresh-20260503, +bulk-double-find-checkout, +monitoring-auth-404-alert-rule, +csp-report-endpoint-violation-monitoring, +e2e-gallery-ui-auto-show, +minicalendar-typo-tokens-vs-spec, +fail-closed-e2e-matrix-expansion, +approval-audit-timeline-ui, +quality-approve-comment-policy, +simulate-role-audit-log-observability, +emptystate-3-file-dedup, +dashboard-spec-helper-return-type-policy, +e2e-your-turn-badge-coverage, +sv-playwright-browser-approve-dialog-verification, +ul-qp-18-11-ui-download-e2e, +e2e-soft-fork-apply-forward-submit, +e2e-cas-409-conflict-flow, +phase-k-backup-dr, +reject-reason-template-quickselect, +rejection-reason-max-length, +fsm-meta-drift-observability, +class-dto-migration-residual-closure, +sidebar-nav-action-e2e-manual-verify, +dday-baseline-png-initial-capture, +font-system-ssot). 검색: `ls .claude/contracts/completed/ | grep <slug>`
