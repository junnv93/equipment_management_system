# Tech Debt Tracker

harness 세션에서 이연된 SHOULD 실패·후속 작업을 누적 관리한다.
완료 항목은 `tech-debt-tracker-archive.md`로 이동.

## Batch 이력

> 2026년 4월 배치 이력 → [tech-debt-tracker-archive.md](tech-debt-tracker-archive.md)

| Batch | 처리일 | 항목 수 | 상태 |
|-------|--------|---------|------|
| disposal-zod-defense-in-depth | 2026-05-01 | 5 | 완료 |
| disposal-service-fail-close | 2026-05-02 | 2 | 완료 |
| error-codes-ssot-system-wide | 2026-05-02 | 15 | 완료 |
| tier-2-rejectmodal-ssot-integration | 2026-05-02 | ~38 | 완료 |
| equipment-reject-zod-fail-close-hardening | 2026-05-02 | 3 | 완료 |
| rejection-reason-notfound-systemic-closure | 2026-05-02 | 16 | 완료 |
| tier2-fsm-invalid-status-transition | 2026-05-02 | 26 | 완료 |
| 2026-05-03 batch (12 sprints) | 2026-05-03 | 12 | 완료 |
| quality-audit-ssot | 2026-05-03 | 11 | 완료 |
| data-migration-preview-windowing | 2026-05-03 | 6 | 완료 |
| security-auditable-revocation-comment | 2026-05-03 | 0 | 완료 |
| calibration-action-button-aria-labels | 2026-05-03 | 4 | 완료 |
| document-file-frontend-error-mapper | 2026-05-03 | 6 | 완료 |
| inspection-template-frontend-error-mapper | 2026-05-03 | 5 | 완료 |
| frontend-test-final-run | 2026-05-03 | 0 | 완료 |
| verify-implementation-orphan-skills-registration | 2026-05-03 | 1 | 완료 |

---

## Open

### 2026-05-03 entropy-pass + verify-implementation 발견 항목

### 2026-05-02 rejection-reason-notfound-systemic-closure 스코프 외


### 2026-05-01~02 disposal-zod 후속 — RejectModal SSOT 통합 + 시스템 전반 보안 강화 (재구조화)

본 세션은 frontend가 이미 `≥ 10` 강제 중인 disposal/calibration-plan 2개 도메인만 backend Zod 격상 (Tier 1 안전). 시니어 자기검토 결과 단순 도메인별 페어링 sprint(7건)는 단편 누적이라 판단 — 진정한 시스템적 해결은 **RejectModal SSOT 컴포넌트로 통합** + 시스템 전반 Zod 가드 일괄 적용.

#### 시스템적 통합 sprint (Mode 2 권장)

- [x] **[2026-05-01 disposal-zod] 🟢 LOW step-12-trim-system-wide-residual** — 2026-05-03 batch에서 28+ DTO `.trim()` 일괄 적용 완료 (cables/checkouts/equipment-imports/calibration/inspection/users/data-migration 전 도메인). 잔여: notifications/teams 도메인 일부. 실질적 closure 달성.
- [x] **[2026-05-01 disposal-zod] 🟢 LOW step-15-max-system-wide-residual** — 2026-05-03 batch에서 28+ DTO `.max(VALIDATION_RULES.*)` 일괄 적용 완료. SHORT_TEXT_MAX_LENGTH(20)/EXTENDED_TEXT_MAX_LENGTH(200)/TEXT_FIELD_MAX_LENGTH(100)/LONG_TEXT_MAX_LENGTH(500) 전 계층 SSOT 사용. 실질적 closure 달성.

#### 별도 ADR 필요

- [ ] **[2026-05-02 system-arch] 🟡 MEDIUM backend-zod-error-message-i18n-adr** — backend `VM.string.min('field', N)` 응답이 한국어 하드코딩. frontend locale=en이어도 backend 한국어 그대로. 옵션 (a) `Accept-Language` 헤더 기반 backend i18n (b) error code 반환 + frontend 번역 (c) 현 상태 유지(한국 단일 운영 확정). ADR 결정 필요. 트리거: 다국어 운영 결정 시.


### 2026-05-02 error-codes-ssot-system-wide 후속 — 시스템 전반 마이그레이션

본 sprint는 disposal + calibration-plan 도메인만 ErrorCode enum 격상. 나머지 도메인(equipment/checkout/non-conformance/calibration/등)은 인라인 string literal 잔존. 시니어 자기검토 갭 7(audit log 통합) + 갭 9(e2e 통합 spec) 별도 sprint.

- [ ] **[2026-05-02 error-codes-ssot] 🟡 MEDIUM e2e-error-code-integration-spec** — 자기검토 갭 9. controller → service → response HTTP path 통합 spec 부재. fail-close BadRequestException이 HTTP 400 응답으로 직렬화되고 frontend가 mapper로 i18n 처리하는 전체 path 검증. 다른 세션이 e2e-spec.ts 도메인이라 회피했으나 본 sprint scope 외부에서 추가 가능. 트리거: 다음 e2e 강화 sprint.
- [ ] **[2026-05-03 review-architecture] 🟡 MEDIUM disposal-review-stage-service-fail-close** — `reviewDisposal()` reject branch가 controller Zod `opinion.trim().min(REJECTION_REASON_MIN_LENGTH)`에 의존하고 service-layer 직접 guard가 없음. direct service caller/worker/admin script가 controller를 우회하면 짧은 rejectionReason 저장 가능. 권장: transaction 전 `decision==='reject'` 분기에서 `opinion.trim().length < REJECTION_REASON_MIN_LENGTH` fail-close + ErrorCode/i18n/audit 경로 동기화. 파일: `apps/backend/src/modules/equipment/services/disposal.service.ts`.
- [ ] **[2026-05-03 review-architecture] 🟢 LOW calibration-plan-reject-trim-canonicalization** — `calibration-plans.service.ts:reject()`는 `trimmedReason`으로 fail-close하지만 direct service caller 경로에서는 원본 `rejectionReason`을 저장/emit할 수 있음. controller Zod 경로는 이미 trim됨. 권장: 저장/notification/audit payload에 `trimmedReason` 사용. 파일: `apps/backend/src/modules/calibration-plans/calibration-plans.service.ts`.

### 2026-04-30 stale-contract-cleanup 후속 (Mode 1 harness 발견)

- [ ] **[2026-04-30 stale-cleanup] 🟢 LOW nc-design-review-phases-eslint-disable-2건** — `NCDocumentsSection.tsx:100`, `CreateNonConformanceForm.tsx:145`에 `Promise.allSettled` 패턴으로 인한 `eslint-disable-line no-restricted-syntax -- self-audit-exception` 2건. `self-audit.md §7` 예외 정책 준수(self-audit-exception 마커 명시). 트리거: 향후 `Promise.allSettled` SSOT 헬퍼 도입 시 일괄 제거.
- [ ] **[2026-04-30 stale-cleanup] 🟢 LOW createTestEquipment-token-인자-deprecation-cleanup** — 본 세션은 시그니처 호환성 위해 `_token` 인자 보존(약 30개 호출부). 후속 sprint에서 호출부 일괄 정리 후 `createTestEquipment(app, overrides?)`로 단순화. 파일: `apps/backend/test/helpers/test-fixtures.ts` + 모든 e2e-spec 파일. 트리거: 다음 e2e fixture 정비 sprint.
- [ ] **[2026-04-30 stale-cleanup] 🟡 MEDIUM lab-manager-explicit-permission-spec-신규** — `e2e-63-fixes` 정리 과정에서 8 spec이 `'admin'` → `'systemAdmin'` 일괄 변경됨. 일부 spec은 lab_manager(admin)의 권한 검증이 본 의도였을 가능성. UL-QP-18 직무분리 정책 준수 회귀 방지를 위해 lab_manager 권한 명시 spec 신설 권장 — 예: lab_manager가 CREATE_EQUIPMENT 시도 → 403 확인. 트리거: lab_manager 권한 회귀 발견 시 또는 직무분리 정책 변경 sprint.

### 2026-04-30 tech-debt-batch-0501 후속 (Mode 1 harness 발견)

- [ ] **[2026-04-30 batch-0501 SHOULD] 🟢 LOW charscounter-disposal-extension** — Disposal 3개 dialog는 `min-hint` 시맨틱(`charCountMin` i18n: "{min}자 이상 입력해주세요")이라 본 세션의 `<CharsCounter>`(`ratio+warning` 시맨틱)와 통합되지 않음. 향후 `<CharsCounter mode="min">` variant 또는 `<CharsCounterMinHint>` 별도 컴포넌트로 4번째 시맨틱 등장 시 통합. 트리거: min-hint 4번째 호출처 등장 또는 designer가 모든 카운터 일관 표기 요구 시.
- [ ] **[2026-04-30 batch-0501 SHOULD] 🟢 LOW analytics-track-listener-integration** — `track(ANALYTICS_EVENTS.SIDEBAR_CHECKOUTS_CLICK)` 이벤트가 발행되나 외부 listener(GA/Amplitude) 미연결로 telemetry 적재 0건. `apps/frontend/app/layout.tsx` 또는 `_document`에서 `window.addEventListener('app:analytics', ...)` 연결 필요. 트리거: telemetry 도입 sprint.
- [ ] **[2026-04-30 batch-0501 SHOULD] 🟢 LOW i18n-disposal-rename-e2e-snapshot** — Disposal 3개 dialog의 `t('common.charCount')` → `t('charCountMin', { min })` 키+파라미터 변경이 e2e snapshot/copy 회귀 없음을 수동 검증 필요. 정적 분석으로 키 존재만 확인됨. 트리거: 다음 disposal e2e suite 실행 시.
- [ ] **[2026-04-30 batch-0501 iter3 SHOULD] 🟡 MEDIUM disposal-opinion-comment-zod-min10-defense** — Backend `disposal.dto.ts`의 `opinion: z.string().min(1)` + `comment: z.string().optional()` 는 frontend 10자 룰과 동기화 안 됨 (defense-in-depth 부재). NC `cause`처럼 `.min(VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH)` 적용 권장. 단, 기존 데이터/E2E 회귀 위험으로 별도 sprint. 트리거: disposal 보안 강화 sprint.
- [ ] **[2026-04-30 batch-0501 iter3 SHOULD] 🟢 LOW analytics-events-other-domains-pending** — `ANALYTICS_EVENTS` 레지스트리에 현재 1건(`SIDEBAR_CHECKOUTS_CLICK`)만 등록. 도메인별(equipment/calibration/non-conformance) sidebar 클릭, bulk operations, 검색 등 추가 telemetry 등장 시 레지스트리에 등록. 트리거: 새 analytics 호출처 등장 시.

### 2026-04-30 sprint45-should-residual 후속 (Mode 2 harness 발견)

- [ ] **[2026-04-30 sprint-4.5 S3 후속] 🟡 MEDIUM checkouts-tab-bulk-selection-integration** — Outbound/InboundCheckoutsTab 부모에 `useRowSelection` + `BulkActionBar` 도입. CheckoutGroupCard prop API(`selectedRowIds` / `onToggleGroup`)는 본 세션에 신설 + 격리 fixture page로 동작 검증 완료. 부모 통합은 useBulkSelection 신규 도입 + bulk approve/reject/return/cancel 핸들러 다중 도메인 결정 = scope +50% 이상이라 별도 sprint. 파일: `app/(dashboard)/checkouts/tabs/{Outbound,Inbound}CheckoutsTab.tsx`. 트리거: bulk approve/reject 운영 요구사항 발생 시.
- [ ] **[2026-04-30 sprint-4.5 S4 후속] 🟢 LOW dday-baseline-png-initial-capture** — `tests/e2e/visual/dday-6level.spec.ts` 12 baseline PNG는 초기 캡처(`--update-snapshots`) 미실행 상태. dev 서버 + storageState(test-engineer) 가용 환경에서 1회 캡처 필요. 캡처 후 baseline PNG 12개 git 커밋. 트리거: 다음 visual QA sprint 또는 디자인 토큰 변경 직전.
- [ ] **[2026-04-30 sprint-4.5 S6 후속] 🟢 LOW help-faq-content-authoring** — `messages/{ko,en}/help.json` 4 섹션 (checkout/calibration/nonConformance/permissions) placeholder만 등록. 운영팀과 협의 후 실제 FAQ 카피 작성 + 섹션 anchor 키 동기화. `feedback_no_fabricate_domain_data.md` 정책에 따라 카피 생성 금지 — 사용자/운영팀 입력 후 별도 작업. 트리거: 운영팀 FAQ 콘텐츠 공급.
- [ ] **[2026-04-30 sprint-4.5 S6 후속] 🟢 LOW emptystate-3-file-dedup** — `dashboard/atoms/EmptyState.tsx` / `shared/EmptyState.tsx` / `checkouts/CheckoutEmptyState.tsx` 3개 파일 dedup 미수행. 본 세션은 `dashboard/atoms/`에만 secondaryAction prop 신설(다른 2개는 이미 보유). 통합 SSOT로 `shared/EmptyState`로 통일하면 호출자 import 경로 변경 다수 수반 — 별도 sprint. 트리거: 4번째 EmptyState 변형 등장 시 또는 prop API 분기 발생 시.
- [ ] **[2026-04-30 sprint-4.5 SHOULD 후속] 🟢 LOW playwright-trace-on-failure-policy** — `tests/e2e/visual/dday-6level.spec.ts` + `group-indeterminate.spec.ts` 본 세션 spec에 `trace: 'on-first-retry'` (기본값) 외 별도 설정 없음. 시각 회귀 / a11y 회귀 spec은 trace 보존이 디버깅에 유용 — `use: { trace: 'retain-on-failure' }` 정책 권고. 트리거: CI playwright 인프라 정비 sprint.

### 2026-05-02 tier-2-calibration-factor-reject-ui 후속 (manage-skills 발견)


---

### 2026-04-30 setqueryd-purge-and-bulk-ux 후속 (Mode 2 harness 발견)

- [ ] **[2026-04-30 setqueryd-purge SHOULD] 🟢 LOW BulkActionBar 두 파일 dedup** — `components/common/BulkActionBar.tsx`(canonical, generic actions slot)와 `components/approvals/BulkActionBar.tsx`(approvals 특화 wrapper)가 분리되어 있음. 본 세션 SKILL doc(`verify-bulk-action-bar`)는 패턴만 명문화. 실제 dedup은 별도 세션 (수술적 변경 원칙). 트리거: approvals 외 도메인이 BulkActionBar wrapper 추가 시 즉시 dedup.
- [ ] **[2026-04-30 setqueryd-purge SHOULD] 🟢 LOW analytics PII deny-list 'role' 정책 명시** — `lib/analytics/track.ts` PII_DENY_KEYS는 user-identifying fields만 포함 (userId/email/firstName/lastName/displayName/fullName/employeeId/사번). 'role'은 카테고리 (admin/user)이므로 strict PII가 아니나, 권한 분포 분석 통한 추론 가능성. `track()` 호출자에서 명시적으로 role을 props로 사용하지 않는다는 컨벤션 SKILL doc 또는 ADR 등록 필요. 트리거: track 호출처에서 role/permission 관련 props 첫 등장 시.
- [ ] **[2026-04-30 setqueryd-purge SHOULD] 🟢 LOW useOptimisticMutation 멀티 view 한계** — 단일 queryKey 기반이라 `view.all()` prefix를 넘겨도 setQueryData가 정확 일치만 동작 → 실제 view query (filters 포함)에 optimistic 도달 안 함. 코드베이스 전체 패턴 (use-equipment.ts 4곳 + 이번 use-checkout-card-mutations.ts)이 같은 한계 — invalidateKeys onSettled refresh로 ~100-300ms 후 갱신. 트리거: optimistic UI 즉시 반영이 critical UX인 신규 mutation 등장 시 useOptimisticMutation 확장 (setQueriesData 옵션 또는 array of queryKeys).

### 2026-04-30 Checkouts V3 Sprint 4.5 T1+T2 SHOULD/Architecture Concerns

- [ ] **[2026-04-30 sprint-4.5] 🟢 LOW bulk-double-find-checkout** — `bulkApprove`/`bulkReject` service 모두 `findCheckoutEntity(id)` 후 `approve()`/`reject()`가 내부에서 다시 `findCheckoutEntity(id)` — 2N DB read (50건 max × 2 = 100 reads / ~100ms). 의도적 trade-off: 단건 path와 정확히 같은 fail-close 순서·audit·notification 보장 우선. 측정된 병목 발생 시 `_rejectWithEntity`/`_approveWithEntity` private helper로 분리해 N reads로 감축. 변경 시 service.spec.ts 회귀 테스트 동시 보강 필수. 트리거: ① p95 bulk latency >500ms, ② bulk 호출 빈도 >100/day, ③ N>50로 max 상향 시.

### 2026-04-30 deps-supply-chain-hardening 후속

#### 후속 (본 세션 2026-04-28에서 발견)
- [ ] **[2026-04-28 supply-chain-gate-completion] 🟢 LOW eslint-require-alias-rename-gap** — ESLint `no-restricted-imports`는 ES module `import`만 검사. `const { randomUUID: rid } = require('node:crypto')` + `rid()` alias 패턴은 미차단. TypeScript ESM 코드베이스에서 require 사용 패턴 드물어 실질 위험 낮음. 트리거: backend에 처음 require() 사용처 등장 시.
- [ ] **[2026-04-30 deps-supply-chain] 🟢 LOW frontend-id-helper-격상** — frontend가 client-side 도메인 id 생성하는 첫 호출처 등장 시 `packages/shared-constants` 또는 `apps/frontend/lib/identifiers/`로 격상. 트리거: frontend 첫 호출처 (드래그-드롭 reorder key 등).
- [ ] **[2026-04-30 deps-supply-chain] 🟢 LOW bundle-size-baseline** — `pnpm measure:bundle` baseline 갱신. 본 세션은 backend-only 변경이라 frontend 영향 0이지만 frontend가 IdentifierService 격상된 SSOT를 import하는 시점 측정 권장.

### 2026-04-28 checkouts-phase4-kpi-hierarchy SHOULD 이연 항목

- [ ] **[2026-04-28 checkouts-phase4] 🟢 LOW phase-4-5-checkout-summary-extension** — backend `CheckoutSummary`에 `avgDelayDays`, `maxOverdueDays` 추가 → wireframe hero kpi-meta ("평균 지연 2.3일 · 최장 D+8") UI 표시. 트리거: backend 확장 + frontend kpi-meta 슬롯 추가.
- [ ] **[2026-04-28 checkouts-phase4] 🟢 LOW phase-4-6-sparkline-trend-api** — `SparklineMini` 현재 `[]` placeholder. trend timeseries API 신설 + 실제 데이터 연결 + trend prop 동적 derive. 트리거: 시계열 백엔드 신설 PR.
- [ ] **[2026-04-28 checkouts-phase4] 🟢 LOW phase-5-pending-hero-priority** — `selectHeroVariant`에 pending threshold 우선순위 추가 (overdue==0 && pending>10 → 'pending'). `HERO_PRIORITY` 배열에 rule 추가 + negative test 5번 갱신. 트리거: Phase 5 (P1-2 알림 단일 노출)와 함께 결정.

### 2026-04-29 harness: nextauth-csrf-single-origin SHOULD 후속 (ADR-0006 정착 후 deferred)

- [ ] **[2026-04-29 nextauth-csrf §S2] 🟢 LOW bundle-size-baseline-after-axios-baseurl-simplification** — `pnpm measure:bundle` baseline 갱신. axios baseURL 분기 단순화 (절대 URL → 빈 문자열) 영향 측정 — 약 수백 byte 감소 추정. 트리거: bundle baseline 정기 업데이트.
- [ ] **[2026-04-29 nextauth-csrf §S3] 🟡 MEDIUM docker-compose-lan-prod-manual-verification** — `pnpm compose:lan up -d --build` 후 `curl http://lan-ip:9000/api/auth/csrf` → 200 + JSON 응답 확인. nginx NextAuth handler 분기(infra/nginx/lan.conf:121-159 신규 location 2개) 운영 환경 manual 검증. 트리거: 다음 LAN/prod 배포 직전.
- [ ] **[2026-04-29 nextauth-csrf §S4] 🟢 LOW csp-report-endpoint-violation-monitoring** — same-origin 모델 정착으로 CSP `connect-src 'self' ws: wss:`가 strict해짐. 5분 dev 모니터링에서 CSP violation 0건 확인했으나 production 트래픽에서도 0건인지 dashboard 알림 룰 검토. 파일: `apps/backend/src/modules/security/`. 트리거: production 배포 후 1주일 모니터링.
- [ ] **[2026-04-29 nextauth-csrf §S8] 🟢 LOW monitoring-middleware-auth-404-alert-rule** — `/api/auth/*` 404가 backend 콘솔에 다시 출력되면 즉시 회귀. monitoring middleware (또는 Grafana 알림)에 룰 신설하여 회귀 5분 내 발견. 파일: `apps/backend/src/common/middleware/monitoring.middleware.ts`. 트리거: monitoring rule sprint.
- [ ] **[2026-04-29 nextauth-csrf §J1] 🟢 LOW phase-0-reproduction-actual-network-trace** — Phase 0 reproduction 시나리오 (a) Incognito + chrome://serviceworker-internals (b) Network Initiator stack trace (c) `unset NEXT_PUBLIC_API_URL`은 본 작업의 single-origin 모델로 모두 종결되어 실측 미실행. ADR-0006이 효과를 본 후 정확한 호출 경로(legacy SW vs NextAuth client basePath vs 외부 proxy) 사후 분석 권장. 트리거: 동일 증상 재발 시 디버깅 데이터 수집.

### 2026-04-29 harness: dashboard-low-residual SHOULD 이연 항목 (현 세션)

- [ ] **[2026-04-29 §3.1] 🟢 LOW sidebar-eq-monogram-design-decision** — 명세서 §3.1은 사이드바 상단을 "EQ 모노그램 또는 공급할 자체 로고 SVG, 26px, rounded-md, bg-brand-gradient"로 권고하나 현재 `Wrench` lucide 아이콘 + `bg-ul-red` 32px 사용. 외부 회사 브랜드(UL Solutions)는 이미 제거된 상태이고 Wrench는 "장비 관리" 의미 표현하는 자체 fallback으로 채택된 것으로 추정. **사용자 디자인 결정 필요**: (a) Wrench 유지 (b) EQ 모노그램 적용 (c) 자체 로고 SVG 공급. 파일: `apps/frontend/components/layout/DashboardShell.tsx:209,245`. 트리거: 디자이너 자체 로고 공급 시점 또는 사용자 결정 시.
- [ ] **[2026-04-29 §A.3.1] 🟢 LOW minicalendar-typo-tokens-vs-spec** — 명세서는 미니캘린더 범례 폰트 11→12px 권고. 현재 `MICRO_TYPO.badge = text-2xs (10px)` 사용. 토큰 시스템 규약(`text-2xs`)과 명세 권고(12px) 간 디자인 불일치. 도트(8px)는 명세 일치 ✅. 변경 시 다른 미니 라벨 일관성 영향. 트리거: 디자인 시스템 typography 검토 sprint.
- [ ] **[2026-04-29 §A.9.1] 🟢 LOW second-skip-link-row1** — 명세서 §A.9.1 권고: `<a href="#dashboard-row1">사이드바 탐색 건너뛰기</a>` 두 번째 skip link. 현재 `#main-content`만 존재. 사이드바가 키보드 사용자에게 Tab 다수 회수 부담을 줄 수 있어 권고됨. 파일: `apps/frontend/components/layout/SkipLink.tsx`. 트리거: 접근성 sprint.
- [ ] **[2026-04-29 standalone-html] 🟢 LOW standalone-html-1to1-pixel-matching** — `_ _ _standalone_.html`(1.2MB single-file gzipped bundle)은 자체 unzip JS 필요. 정적 grep으로 마크업 비교 불가 → 실제 1:1 픽셀 매칭은 (a) Playwright로 file:// 로드 후 DOM 캡처, (b) bundle JS unzip + 분석 두 방법 중 하나로 sprint 단위 진행 권장. 본 세션은 명세서 ↔ 구현 1:1 매칭(5/5 검증)로 대체 처리. 트리거: 디자인 QA sprint.



- [ ] **[2026-04-27 sprint-3.3] 🟢 LOW checkout-row-onclick-callback** — `CheckoutGroupCard.tsx` 내부 row `onClick={() => onCheckoutClick(row.checkoutId)}`가 여전히 inline arrow. `useCallback` 또는 stable ref 패턴으로 교체 시 GroupCard 내부 row 재렌더 추가 감소 가능. 트리거: CheckoutGroupCard 성능 이슈 발생 시.
- [ ] **[2026-04-27 sprint-3.3] 🟢 LOW stagger-low-spec-guard** — `navigator.hardwareConcurrency < 4`인 저사양 기기에서 stagger 완전 off 검토. 현재 `STAGGER_ROW_LIMIT = 12` + `prefers-reduced-motion` 2중 가드 존재하나 hardwareConcurrency 기반 추가 방어 가능. 트리거: 저사양 기기 성능 이슈 보고 시.
- [ ] **[2026-04-27 sprint-3.3] 🟢 LOW groupcard-usecallback-t-scan** — `CheckoutGroupCard.tsx`의 `buildRowOverflowActions` useCallback deps에 `t`(번역 함수) 포함. `equipmentRows` 패턴과 동일하게 pre-hoisted 상수로 전환 검토. 트리거: CheckoutGroupCard 리팩토링 시.
- [ ] **[2026-04-27 sprint-3.3] 🟡 MEDIUM sprint-3.3-e2e-profiler-verification** — M12(React DevTools Profiler 수동 QA) + M13(E2E suite-ux 테스트) 미완. E2E 실행으로 클릭 핸들러 동작 변경 없음 확인 필요. 트리거: E2E 전체 배치 실행 시.

### 2026-04-27 harness: approvals-ui-r2 DoD deferred items (contract section 11)

- [ ] **[2026-04-27 ar13] 🟢 LOW ar13-lab-manager-self-inspection** — `lab_manager` 역할이 `ROLE_APPROVAL_CATEGORIES`에 `AC.SELF_INSPECTION` 미포함. 현재 technical_manager만 자체점검 승인 가능. lab_manager의 자체점검 승인 권한 필요 여부 확인 후 `approval-categories.ts` 수정. 트리거: lab_manager 역할 승인 흐름 검토 시. ⚠️ 도메인 정책 결정 보류 (사용자 확인 필요).
- [ ] **[2026-04-27 approvals-ui-r2] 🟡 MEDIUM role-approval-categories-db-backed** — `ROLE_APPROVAL_CATEGORIES` 현재 코드 상수. DB-backed 설정으로 전환 시 운영 유연성 확보. 트리거: 역할별 카테고리 변경 주기가 배포 주기보다 빨라질 때.
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW approval-vocabulary-unification** — `approval-constants.ts` ↔ `approvals-api.ts` vocabulary 분산 (pending_approval vs pending 등). AR-2 잔여. 트리거: 승인 도메인 대규모 리팩토링 시.
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW approval-audit-timeline-ui** — backend 감사 로그 존재하나 UI 타임라인 미구현. 트리거: 승인 이력 조회 요구사항 발생 시.
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW mobile-detail-modal-fullscreen** — 모바일에서 ApprovalDetailModal이 full-screen 미지원. 트리거: 모바일 실기기 테스트 시.
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW reject-reason-template-quickselect** — 자주 쓰는 반려 사유 quick-select 기능. 현재 5개 템플릿 하드코딩. DB-backed 템플릿 관리 검토. 트리거: 운영팀 피드백 시.
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW approval-delegation-workflow** — 위임 워크플로우 미구현. 장기 부재자 승인 위임. 트리거: 위임 요구사항 발생 시.
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW approval-analytics-dashboard** — 월별 처리량/평균 처리시간 대시보드 미구현. 트리거: 관리자 리포팅 요구사항 발생 시.

### 2026-04-27 harness: Sprint 4.1+4.2 NextStepPanel+Row3Zone SHOULD 이연 항목

- [ ] **[2026-04-27 sprint-4.2] 🟢 LOW zone2-status-text-truncate** — Zone 2(72px) Badge 내부 긴 상태값 truncate 처리 없음. 영어 locale overflow 가능. 트리거: i18n 검토 시.
- [ ] **[2026-04-27 sprint-4.2] 🟢 LOW row-mobile-stacking** — Zone 4 모바일(< sm) overflow 가능. sm:hidden/flex 패턴으로 스택 레이아웃 검토 필요. 트리거: 모바일 실기기 테스트 시.

### 2026-04-26 harness: Sprint 3.1~3.2 BFF + queryKeys 계층 SHOULD 후속

- [ ] **[2026-04-26 sprint-3.1] 🟢 LOW inbound-overview-module-boundary** — `checkoutsService.getInboundOverview()`가 `RentalImportsService`를 직접 주입. 향후 반입 도메인이 별도 모듈로 분리될 경우 circular dependency 가능. BFF Gateway 패턴(독립 BFF 모듈) 검토 필요(S6). 트리거: 반입 도메인 대규모 리팩토링 시.

### 2026-04-26 harness: NC Round-2 (R1a~R5) SHOULD 이연 항목

- [ ] **[2026-04-26 nc-r5] 🟢 LOW rejection-reason-max-length** — `rejectionReason` 최대 길이 제한 미정의 (R5 Non-Goal). `z.string().trim().min(1).max(?)` 추가 시 도메인 정의 필요. 트리거: NC 도메인 규격 확정 후.
- [ ] **[2026-04-26 nc-r1a] 🟢 LOW openBlockedRepair-quality-manager-i18n** — `openBlockedRepair_quality_manager` guidance 케이스 (operator guidance 사용 중) — quality_manager 역할이 openBlockedRepair 상태일 때 role-aware 메시지 부재. 트리거: quality_manager 역할 실제 배포 시.

### 2026-04-26 harness: Sprint 2.4 tab-badge alert variant SHOULD 후속

- [ ] **[2026-04-26 sprint-2.4] 🟢 LOW en-overdueclear-translation-spec** — `en/checkouts.json` `emptyState.overdueClear.title` = `"No Overdue Checkouts"` (현재) vs 컨트랙트 스펙 `"No overdue items"`. 대소문자·의미 불일치. Sprint 2.3 구현 당시 의도적으로 다른 프레이밍 선택. 사용자 확인 후 보정 또는 컨트랙트 업데이트 필요. 트리거: i18n 리뷰 세션.

### 2026-04-26 harness: Sprint 2.1·2.2 Row 토큰 누수 봉합 SHOULD 후속

- [ ] **[2026-04-26 sprint-2.1-2.2] 🟡 MEDIUM purpose-bar-return-to-vendor-color** — `CHECKOUT_ITEM_ROW_TOKENS.purposeBar.return_to_vendor` 현재 `bg-brand-neutral` 가안. 디자인 팀과 return_to_vendor 목적 색상 확정 후 수정 필요. 트리거: 디자인 리뷰 시 또는 return_to_vendor 반출 UI 실제 노출 전.

### 2026-04-24 harness: WF-34 E2E + PR-13 YourTurnBadge 후속 (93차)

- [ ] **[2026-04-24 wf34-pr13] 🟢 LOW T2 fixture 의도 불명확** — `wf-34-rental-2step-approval.spec.ts` T2가 `techManagerPage`(lender TM) fixture를 받지만 실제 인증은 `borrowerTmToken`으로 교체됨. `testOperatorPage` 또는 generic page fixture 사용이 더 명확. 트리거: wf-34 spec 리팩토링 시.
- [ ] **[2026-04-15 docker-infra-standards] Phase K — 백업·DR** (pg_dump cron + 복원 리허설 CI + runbook). 프로덕션 사용자 발생 시점.

### 2026-04-17 harness: QR Phase 1-3 후속 정리

- [ ] **[2026-04-18 completion] 🟢 LOW 실제 브라우저 동선 수동 검증** — playwright-skill로 NC 사진 업로드 + handover QR 흐름 로컬 검증, CSP violation report 수집.
- [ ] **[2026-04-18 completion] 🟢 LOW Drizzle snapshot 재생성** — **OUT OF SCOPE (TTY required)** — `pnpm db:generate`는 Drizzle interactive prompt 입력 필요, non-TTY harness 환경에서 실행 불가. TTY 세션에서 수동 실행 필요.

### 2026-04-17 harness: arch-ci-gate-zod-pilot 후속 (ZodResponse 글로벌 승격)

- [ ] **[2026-04-17 arch-ci-gate-zod-pilot] ZodSerializerInterceptor 글로벌 승격** — 파일럿은 `checkouts.controller.ts` handover 2 메서드에 **메서드 단위** `@UseInterceptors(ZodSerializerInterceptor)`. **승격 조건**: (1) 파일럿 2주 무회귀, (2) `@ZodResponse` 적용 컨트롤러 3+ 개 확보, (3) 외부 OpenAPI 클라이언트/SDK 가 `<Name>` → `<Name>_Output` 접미사 변경 대응 완료. 모두 충족 시 `app.module.ts` 에 `{ provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor }` 등록하고 메서드 단위 등록 제거. 적용 세부 조건: `docs/references/backend-patterns.md` "ZodResponse 적용 조건" 참조.
- [ ] **[2026-04-17 arch-ci-gate-zod-pilot] 기존 class-DTO 점진 마이그레이션 잔여** — 2026-04-21 기준 대규모 전환 완료 (calibration/data-migration/settings/equipment/notifications/teams). 잔여 미전환 DTO는 해당 모듈 작업 시 기회가 될 때 전환. 트리거: `any`/Swagger-TS drift/Zod+class 중복.

### 2026-04-20 — cplan-export-audit (verify-implementation + review-architecture 후속)

- [ ] **[2026-04-21 verify-workflows] 🟢 LOW UL-QP-18-11 UI 다운로드 E2E 미커버** — `wf-export-ui-download.spec.ts` 주석에 `implemented: false, backend exporter 미구현`으로 의도된 부채. 백엔드 exporter 구현 시 E2E 케이스 추가 필요.

### 2026-04-22 harness: checkout-lender-guard-p1p3 후속 (verify + review 결과)

- [ ] **[2026-04-22 p1p3] 🟢 LOW RENTAL reject_return 설계 갭 — FSM 명시적 결정 필요** — FSM `reject_return` 전이가 `purposes: CAL_REPAIR`만 허용, RENTAL 제외. RENTAL 반납 검사 실패 시 반려 불가한 도메인 갭. 의도적 설계라면 FSM 주석 추가 권장; RENTAL 반납 반려가 필요하다면 FSM에 rental 추가 + rejectReturn LENDER_TEAM_ONLY 복구 필요. 트리거: 렌탈 워크플로우 설계 검토 시.

### 2026-04-22 harness: NC-P4 GuidanceCallout 후속

- [ ] **[2026-04-22 nc-p4-guidance] 🟢 LOW help.status.completed / help.status.return_rejected — CheckoutStatus enum 미포함 상태** — UI 표시 전용(GuidanceCallout 등)으로 허용했으나, 장기적으로 `help.status.ui.*` 별도 네임스페이스로 분리 권고. 파일: `apps/frontend/messages/ko/checkouts.json`, `apps/frontend/messages/en/checkouts.json`. 트리거: i18n 네임스페이스 정리 작업 시.

### 2026-04-24 harness: PR-14·15 verify + review-architecture 후속 (90차)

- [ ] **[2026-04-24 pr14-15] 🟢 LOW CHECKOUT_DISPLAY_STEPS 계층 위치 — 스타일 토큰에 도메인 데이터 혼재** — `checkout-timeline.ts`에 FSM display step 배열 위치. 장기적으로 `packages/schemas/src/checkout-display.ts`로 이전하여 `computeStepIndex` SSOT와 동일 패키지에 배치 권장. 트리거: schemas 패키지 정리 시.

### 2026-04-24 harness: Sprint 1.3 checkout-meta-fail-closed SHOULD 후속

- [ ] **[2026-04-24 sprint-1.3] 🟡 MEDIUM fsm-meta-drift-observability** — `warnMetaDrift()` 현재 dev console.warn만. Prod에서 Sentry breadcrumb + custom dashboard 계측 추가. `checkout-api.ts` → Sentry `addBreadcrumb({ category: 'fsm', message: 'meta missing', data: { id } })`. 트리거: Sentry SDK 도입 또는 observability 스프린트 시.
- [ ] **[2026-04-24 sprint-1.3] 🟢 LOW fail-closed-e2e-matrix-expansion** — `fail-closed.spec.ts` 현재 12건(4 role × 3 state). role 4 × status 5 = 20건으로 확장: lab_manager BORROWER_APPROVED 최종승인·LENDER_CHECKED 수령확인, technical_manager BORROWER_RETURNED 반입승인, admin OVERDUE 독촉, test_engineer cancel 버튼. 트리거: E2E 안정화 후 커버리지 확장 Sprint.
- [ ] **[2026-04-24 sprint-1.3] 🟢 LOW fsm-response-interceptor-guard** — 백엔드 NestJS interceptor에서 응답 직전 `meta` 완전성 검증. 누락 시 빈 meta 채워 500 방지 또는 경고 로깅. Sprint 1.1 populate 보증이 있으나 방어 계층 추가. 트리거: 백엔드 응답 인터셉터 정비 Sprint.

### 2026-04-27 harness: dashboard-design-review-0427 SHOULD 후속

- [ ] **[2026-04-27 dashboard-design-review] 🟢 LOW ap16-ssr-strategy-docs** — DashboardRow3/4로 이관 후에도 `ssr: true` 유지. 주석 "First Load JS -15~30KB" 는 과장. `ssr: false` 전환 시 수화 전 레이아웃 시프트 가능 — 실측 후 판단 필요. 트리거: bundle-baseline 갱신 Sprint.

### 2026-04-27 harness: dashboard-phase4-6 SHOULD 후속

- [ ] **[2026-04-27 dashboard-phase4-6] 🟢 LOW bundle-baseline-update** — Phase 4.5 스킵. `pnpm --filter frontend run build 2>&1 | node scripts/check-bundle-size.mjs --baseline` 실행해 `bundle-baseline.json` 갱신 필요. DashboardRow3/4 분리로 청크 구조 변경됨. 트리거: 다음 번들 최적화 Sprint.
- [ ] **[2026-04-27 dashboard-phase4-6] 🟢 LOW visual-regression-baseline** — Phase 4.6 스킵. `visual-regression.spec.ts` 미생성 — 5 role × 4 viewport × 3 mode = 60 baseline 스크린샷. 트리거: 디자인 QA Sprint 착수 시 `--update-snapshots`로 초기 캡처.

### 2026-04-27 harness: fsm-terminal-actor-variant SHOULD 이연 항목

- [ ] **[2026-04-27 fsm-terminal-actor-variant] 🟢 LOW e2e-your-turn-badge-coverage** — `YourTurnBadge` Playwright E2E 미커버. 검증 필요 3케이스: (1) technical_manager lender checkout → 뱃지 visible, (2) test_engineer approved checkout → 뱃지 visible, (3) terminal(rejected/canceled) → `data-my-turn="false"` 뱃지 없음. 트리거: checkouts E2E 확장 Sprint 시.

### 2026-04-27 harness: approvals-ui-r2 SHOULD 이연 항목

- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW stepper-disposal-start-node-label** — ApprovalStepIndicator의 disposalSteps 시작 노드 차등화(`▸` 마이크로 라벨) 미구현. 현재 모든 단계 노드 동일 시각. 트리거: Stepper UX 세밀화 Sprint 시.

### 2026-04-28 dashboard-redesign-architectural SHOULD 이연 항목

- [ ] **[2026-04-28 dashboard-thresholds-ssot] 🟢 LOW system-health-queue-size-impl** — `apps/backend/src/modules/dashboard/dashboard.service.ts:getSystemHealth()`의 `queueSize`가 0 stub. BullMQ 또는 Redis 큐 도입 시 실측 연결 필요. 현재는 dbResponseMs/storagePct만 overallStatus 판정에 기여. 트리거: BullMQ/큐 인프라 도입 Sprint.
- [ ] **[2026-04-28 dashboard-thresholds-ssot] 🟢 LOW system-health-error-source-table** — `errorCount24h`가 audit_logs의 `reject`/`cancel` 비즈니스 거절을 proxy로 사용 중. 진정한 시스템 에러 카운트는 별도 `error_logs` 또는 `system_events` 테이블 + Sentry 통합 필요. 트리거: 운영 모니터링 정비 Sprint.
- [ ] **[2026-04-28 dashboard-thresholds-ssot] 🟢 LOW dashboard-storage-capacity-env** — `DASHBOARD_STORAGE_CAPACITY_BYTES` 기본 100 GiB. 운영 환경별 실제 디스크 capacity로 env 설정 필요 (Docker volume / K8s PV / 호스트 디스크). 트리거: 프로덕션 배포 시 env 설정 체크리스트.

### 2026-04-28 dashboard-redesign-phase-e-residual SHOULD 후속 (미완료)

- [ ] **[2026-04-28 phase-e-residual] 🟢 LOW simulate-role-audit-log-observability** — SYSTEM_ADMIN의 `?simulateRole=` 사용 시 audit_logs entry 미발행. 누가 어떤 역할 시뮬했는지 추적 불가. `useEffectiveRole`에서 시뮬 활성 1회 audit log 호출 검토. 트리거: 보안/관측 강화 sprint.
- [ ] **[2026-04-28 phase-e-residual] 🟢 LOW standalone-html-1to1-matching** — REVIEW_RESULT.md ⚠️ 5항목 (§3.1 EQ 마크 / §3.7 items-stretch / §3.10 debug widget / §A.3.1 미니캘린더 / §A.9.1 skip nav) — Playwright baseline 캡처 + 시각 검수로 1:1 매칭 검증 필요. 트리거: 다음 디자인 QA sprint.
- [ ] **[2026-04-28 phase-e-residual] 🟢 LOW playwright-dashboard-screenshots-baseline** — `dashboard-screenshots.spec.ts` 본 세션에서 helper 추가 + dark/axe scan 보강만 완료. 실제 5 role × 1440 light/dark 30 PNG 캡처는 미실행 (storage state + dev 서버 의존). 트리거: 다음 디자인 QA sprint.

### 2026-04-28 supply-chain-gate-completion 부수 발견

- [ ] **[2026-04-28 software-validation-comment] 🟢 LOW quality-approve-comment-policy** — `qualityApprove()` 메서드 시그니처에 코멘트 파라미터 자체가 없음. 품질책임자 승인 시 검토 의견 기록 정책 미정의. ISO/IEC 17025 §6.2.2 관점에서 "이중 승인 trail 일관성" 위해 `qualityApproveComment` 필드 도입 검토 필요. 트리거: 도메인 정책 결정 sprint.
- [ ] **[2026-04-28 dashboard-spec] 🟢 LOW dashboard-spec-helper-return-type-policy** — `apps/backend/src/modules/dashboard/__tests__/dashboard.service.spec.ts:326` `setupHealthMocks` helper에 return type `: void` 명시로 lint 통과. 정책 점검: spec 파일에서 helper function의 explicit-function-return-type 강제 적절성 — 현재 ESLint override는 `no-restricted-syntax`만 끔. spec helper는 추론으로 충분한 경우가 많아 spec 디렉토리에서 본 룰 완화 검토 가능. 트리거: ESLint config 정책 통일 sprint.

### 2026-04-28 sidebar-nav-action-pattern SHOULD 후속 (미완료)

- [ ] **[2026-04-28 sidebar-nav-action-pattern] 🟢 LOW filtered-nav-secondary-action-aria-key-literal-union** — `FilteredNavSecondaryAction.ariaKey` / `primaryAriaKey`가 `string` 타입. 오타 시 next-intl 런타임 throw. i18n 키 리터럴 유니언으로 좁히면 컴파일 타임 검증. 단, 키 추가 시마다 타입 갱신 필요라 trade-off 존재. 트리거: i18n 키 도메인 SSOT sprint 또는 nav 도메인 키 폭주 시.
- [ ] **[2026-04-28 sidebar-nav-action-pattern] 🟢 LOW sidebar-row-container-li-semantics** — exec-plan 아키텍처 결정은 `<li>` 컨테이너였으나 구현은 `<div>`. 부모도 `<ul>`이 아닌 `<div>`이라 자기 일관성은 유지되나 nav landmark 안에서 `<ul><li>` 시맨틱이 더 정확. 모든 nav item을 `<ul><li>`로 일괄 재구성하면 SR이 "list with N items" 안내 추가. 트리거: 사이드바 nav 시맨틱 강화 sprint 또는 a11y 회귀 발견 시.
- [ ] **[2026-04-28 sidebar-nav-action-pattern] 🟡 MEDIUM sidebar-nav-action-e2e-manual-verify** — Playwright `tests/e2e/features/layout/sidebar-nav-action.spec.ts` BLOCKED-ENV (contract M4/M5). dev server + storageState로 수동 검증 후 결과 기록 필요. 검증 항목: (1) 콘솔 hydration 에러 0건 (2) DOM `a > a` 0건 (3) Tab 순서 메인 → 보조. 시드에 yourTurn ≥1 케이스 보장 필요. 트리거: 다음 commit 직전 또는 `/checkouts` 라우트 수정 시.
- [ ] **[2026-04-29 rental-approval-workflow-fix] 🟢 LOW findall-meta-fallback-path** — `findAll` 의 `if (userPermissions)` 조건부 분기 — 직접 호출 시(getInboundOverview 등) meta 누락 경로 잔존. 모든 호출처가 user info 전달하면 분기 제거 가능. 트리거: getInboundOverview에 meta 필요해질 때 (현재는 dashboard 용도라 meta 불필요 — defense-in-depth 측면에서 옵셔널 유지가 적절).

### 2026-04-29 button-loading-codemod SHOULD 후속 (미완료)

- [ ] **[2026-04-29 button-loading] 🟢 LOW harness-contract-M1-extra-claude-files** — Phase 0 commit `f661c2d0`에 `.claude/contracts/button-loading-codemod.md` 등 harness 아티팩트 4개가 도메인 파일과 동일 커밋에 포함됨. 계약 기준 M1 미달이나 코드 품질에는 영향 없음. Harness 워크플로우 개선: Planner 아티팩트를 별도 커밋(chore(harness))으로 분리하도록 계약 예외 항목 추가 권고. 트리거: 다음 harness Mode 2 세션 Planner 작성 시.
- [ ] **[2026-04-29 button-loading] 🟢 LOW harness-contract-M9-prettier-collateral** — Phase 1 commit `ccde0f74`에 Prettier PostToolUse hook이 자동 포맷한 shadcn UI 12개 파일 포함. 계약 M9 "surgical scope" 기술적 미달. 실제로는 pure formatting(no-op). Harness 계약에 "PostToolUse Prettier 리포맷 파일은 M9 예외" 조항 명시 권고. 트리거: 다음 harness Mode 2 계약 작성 시.

### 2026-04-30 sv-system-wide-completion SHOULD 후속

- [ ] **[2026-04-30 sv-system-wide] 🟢 LOW sv-playwright-browser-approve-dialog-verification** — approveDialog / qualityApproveDialog 렌더링 + 코멘트 입력 → 승인 흐름을 브라우저 레벨에서 미검증. 현재는 unit/integration spec으로만 커버. 트리거: `/software/[id]/validation` 라우트 UI 수정 시 또는 다음 playwright-e2e sprint.

### 2026-05-01 inspection-template-build-once SHOULD 후속

Backend Phase 1B-A/B/C 완료 (commits 94a9e68c → a4e0c070). frontend 1B-D~G는 별도 세션 진행. SHOULD 미구현 항목:

- [ ] **[2026-05-01 inspection-template] 🟡 MEDIUM analytics-ssot-events** — `lib/analytics/track.ts` SSOT에 4개 event 미통합: `inspection_template_created`, `inspection_template_versioned`, `soft_fork_decided`, `gallery_used`. PII 미포함, dispatchEvent + DEV throw / PROD drop 패턴. 트리거: 1B-E (SoftForkDialog) 작성 시 + 1B-F (Gallery) 작성 시 backend service에서 telemetry 호출 추가.
- [ ] **[2026-05-01 inspection-template] 🟡 MEDIUM feature-flag-gradual-rollout** — `INSPECTION_TEMPLATE_ENABLED` feature flag 미구현. 문제 발생 시 즉시 fallback (latestInspection prefill로 회귀) 흐름 부재. 권장: `apps/frontend/lib/feature-flags.ts` 또는 backend `system_settings` 테이블에 toggle. 트리거: 1B-D (frontend hook) 작성 시 또는 production 출시 직전.
- [ ] **[2026-05-01 inspection-template] 🟢 LOW controller-integration-test** — `EquipmentInspectionTemplateController` / `InspectionTemplatesGalleryController` integration test 미작성. service unit 17개로 핵심 로직 커버, e2e는 1B-G 예정. RequirePermissions / ZodValidationPipe / ParseUUIDPipe 통합 흐름은 e2e가 더 정합. 트리거: 1B-G (E2E) 진행 시.

### 2026-05-02 inspection-template 1B-G E2E SHOULD 후속

1B-G Mode 1 harness PASS 후 시니어 자기검토에서 발견된 갭 (RTL test가 분담 또는 차후 e2e 보강).

- [ ] **[2026-05-02 inspection-template] 🟢 LOW e2e-gallery-ui-auto-show** — wf-19g는 *backend gallery API*만 검증 (매칭/권한/parameter). InspectionFormDialog `useEffect`에서 trigger되는 *UI 자동 노출 흐름* (open + isTemplateMissing + items≥1 + !skipped → setGalleryOpen)은 RTL `TemplateGallery.test.tsx` (5 tests)가 cover. e2e UI 시나리오 추가 시 modelName 매칭 시드(두 장비를 같은 modelName으로 동기화) 필요. 트리거: gallery UX 변경 또는 production 출시 전 회귀 강화.
- [ ] **[2026-05-02 inspection-template] 🟢 LOW e2e-soft-fork-apply-forward-submit** — wf-19f는 SoftForkDialog *노출* + *권한 분기 disabled* + *cancel*까지만 e2e cover. *apply_forward 실제 제출 → template v+1 + inspection 생성*까지 가는 시나리오 미커버. RTL `SoftForkDialog.test.tsx` 4 tests + wf-19f S3a/b/c/d API permission split이 분담. 트리거: SoftForkDialog 흐름 회귀 시.
- [ ] **[2026-05-02 inspection-template] 🟢 LOW e2e-cas-409-conflict-flow** — useUpsertTemplate onError의 isConflictError 처리 (toast + queryClient.invalidateQueries) 코드는 1B-E 구현 완료. 그러나 e2e에서 동시 수정 시뮬레이션은 race condition 까다로움 — 미커버. 트리거: CAS 정책 변경 또는 conflict UX 회귀 발견 시.

### 2026-05-02 backend-errorcode-full-closure 스코프 외 (frontend mapper 잔여)

checkout/team/notification/user/cable mapper는 2026-05-03 sprint에서 생성 완료. 미완 항목만 잔존.


### 2026-05-03 verify-skill-restructure-phase1 (Mode 2 harness) SHOULD 후속

Mode 2 harness PASS 후 발견된 갭 (별도 sprint로 정리):

- [ ] **[2026-05-03 verify-skill-restructure-phase1] 🟢 LOW phase2-mega-skill-references-split** — verify-design-tokens 2241 / verify-ssot 2200 / verify-checkout-fsm 1754 / verify-frontend-state 1337 / verify-e2e 1223 mega-skill 5종 → references/<sub-domain>.md 분리. plan Phase 2 별도 진행.
- [ ] **[2026-05-03 verify-skill-restructure-phase1] 🟢 LOW phase3-ts-morph-design-tokens** — `apps/frontend/scripts/verify-design-tokens.ts` 신규 작성 (BRAND_CLASS_MATRIX globals.css 동기화 + bg-brand-${var} 동적 보간 탐지 + transition-all 금지). plan Phase 3 별도 진행.
