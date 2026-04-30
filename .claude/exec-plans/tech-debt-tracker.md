# Tech Debt Tracker

harness 세션에서 이연된 SHOULD 실패·후속 작업을 누적 관리한다.
완료 항목은 `tech-debt-tracker-archive.md`로 이동.

## Batch 이력

| Batch | 처리일 | 항목 수 | 상태 |
|-------|--------|---------|------|
| tech-debt-batch-0430 (A~G) | 2026-04-28 | 31 | 완료 |
| tech-debt-batch-0430b | 2026-04-29 | 12 | 완료 |
| tech-debt-batch-0430c | 2026-04-30 | 8 | 완료 |
| **tech-debt-batch-0430d** | **2026-04-30** | **11** | **완료** — setQueryData purge, startNodeLabel, charsRemaining, dependabot, Settings 스피너 3건, IME가드, verify-implementation 3 step, file/form-template spec |
| **setqueryd-purge-and-bulk-ux** | **2026-04-30** | **9** | **완료** (Mode 2 harness, 17/17 MUST PASS) — useOptimisticMutation 추출 (`use-checkout-card-mutations.ts`), CheckoutGroupCard 165 lines 인라인 mutation 제거, S1 verify-bulk-action-bar SKILL 신설, S2 IME 가드 RowSelectCell+ApprovalKpiStrip 확장, S7 analytics SSOT (`lib/analytics/track.ts`) + sidebar 200ms debounce, S8 wf-ap02 Step 7 a11y, S9 charsRemaining REQUIRED_FIELD_TOKENS+text-warning+80% 임계값 |
| **sprint45-should-residual** | **2026-04-30** | **3** | **완료** (Mode 2 harness) — S3 그룹 헤더 indeterminate(`lib/checkouts/group-selection.ts` SSOT + 격리 fixture page + e2e 3 시나리오), S4 D-day 6-level Playwright snapshot infra(`tests/e2e/visual/dday-6level.spec.ts` light+dark 12 baseline), S6 in-app `/help` 라우트 + `FRONTEND_ROUTES.HELP` SSOT + EmptyState `secondaryAction` prop |

---

## Open

### 2026-04-30 sprint45-should-residual 후속 (Mode 2 harness 발견)

- [ ] **[2026-04-30 sprint-4.5 S3 후속] 🟡 MEDIUM checkouts-tab-bulk-selection-integration** — Outbound/InboundCheckoutsTab 부모에 `useRowSelection` + `BulkActionBar` 도입. CheckoutGroupCard prop API(`selectedRowIds` / `onToggleGroup`)는 본 세션에 신설 + 격리 fixture page로 동작 검증 완료. 부모 통합은 useBulkSelection 신규 도입 + bulk approve/reject/return/cancel 핸들러 다중 도메인 결정 = scope +50% 이상이라 별도 sprint. 파일: `app/(dashboard)/checkouts/tabs/{Outbound,Inbound}CheckoutsTab.tsx`. 트리거: bulk approve/reject 운영 요구사항 발생 시.
- [ ] **[2026-04-30 sprint-4.5 S4 후속] 🟢 LOW dday-baseline-png-initial-capture** — `tests/e2e/visual/dday-6level.spec.ts` 12 baseline PNG는 초기 캡처(`--update-snapshots`) 미실행 상태. dev 서버 + storageState(test-engineer) 가용 환경에서 1회 캡처 필요. 캡처 후 baseline PNG 12개 git 커밋. 트리거: 다음 visual QA sprint 또는 디자인 토큰 변경 직전.
- [ ] **[2026-04-30 sprint-4.5 S6 후속] 🟢 LOW help-faq-content-authoring** — `messages/{ko,en}/help.json` 4 섹션 (checkout/calibration/nonConformance/permissions) placeholder만 등록. 운영팀과 협의 후 실제 FAQ 카피 작성 + 섹션 anchor 키 동기화. `feedback_no_fabricate_domain_data.md` 정책에 따라 카피 생성 금지 — 사용자/운영팀 입력 후 별도 작업. 트리거: 운영팀 FAQ 콘텐츠 공급.
- [ ] **[2026-04-30 sprint-4.5 S6 후속] 🟢 LOW emptystate-3-file-dedup** — `dashboard/atoms/EmptyState.tsx` / `shared/EmptyState.tsx` / `checkouts/CheckoutEmptyState.tsx` 3개 파일 dedup 미수행. 본 세션은 `dashboard/atoms/`에만 secondaryAction prop 신설(다른 2개는 이미 보유). 통합 SSOT로 `shared/EmptyState`로 통일하면 호출자 import 경로 변경 다수 수반 — 별도 sprint. 트리거: 4번째 EmptyState 변형 등장 시 또는 prop API 분기 발생 시.

### 2026-04-30 setqueryd-purge-and-bulk-ux 후속 (Mode 2 harness 발견)

- [ ] **[2026-04-30 setqueryd-purge SHOULD] 🟢 LOW BulkActionBar 두 파일 dedup** — `components/common/BulkActionBar.tsx`(canonical, generic actions slot)와 `components/approvals/BulkActionBar.tsx`(approvals 특화 wrapper)가 분리되어 있음. 본 세션 SKILL doc(`verify-bulk-action-bar`)는 패턴만 명문화. 실제 dedup은 별도 세션 (수술적 변경 원칙). 트리거: approvals 외 도메인이 BulkActionBar wrapper 추가 시 즉시 dedup.
- [ ] **[2026-04-30 setqueryd-purge SHOULD] 🟢 LOW charsCount 5곳 SSOT 통합** — `DisposalApprovalDialog`/`DisposalReviewDialog`/`DisposalRequestDialog` 3개는 `t('common.charCount')` 호출 (단, 키는 `disposal.json`에만 존재 → i18n missing 위험). `NCEditDialog`는 인라인 `{cause.length} / 500` 하드코딩, i18n 미적용. `RejectModal`은 `aria-live="polite"` + `text-warning` + `REQUIRED_FIELD_TOKENS.charCount` 적용 완료. 5곳 통합 위해 신규 `<CharsCounter>` 컴포넌트 추출 권장. 트리거: 6번째 charsCount 사용처 추가 또는 i18n missing key 보고.
- [ ] **[2026-04-30 setqueryd-purge SHOULD] 🟢 LOW analytics PII deny-list 'role' 정책 명시** — `lib/analytics/track.ts` PII_DENY_KEYS는 user-identifying fields만 포함 (userId/email/firstName/lastName/displayName/fullName/employeeId/사번). 'role'은 카테고리 (admin/user)이므로 strict PII가 아니나, 권한 분포 분석 통한 추론 가능성. `track()` 호출자에서 명시적으로 role을 props로 사용하지 않는다는 컨벤션 SKILL doc 또는 ADR 등록 필요. 트리거: track 호출처에서 role/permission 관련 props 첫 등장 시.
- [ ] **[2026-04-30 setqueryd-purge SHOULD] 🟢 LOW useOptimisticMutation 멀티 view 한계** — 단일 queryKey 기반이라 `view.all()` prefix를 넘겨도 setQueryData가 정확 일치만 동작 → 실제 view query (filters 포함)에 optimistic 도달 안 함. 코드베이스 전체 패턴 (use-equipment.ts 4곳 + 이번 use-checkout-card-mutations.ts)이 같은 한계 — invalidateKeys onSettled refresh로 ~100-300ms 후 갱신. 트리거: optimistic UI 즉시 반영이 critical UX인 신규 mutation 등장 시 useOptimisticMutation 확장 (setQueriesData 옵션 또는 array of queryKeys).

### 2026-04-30 Checkouts V3 Sprint 4.5 T1+T2 SHOULD/Architecture Concerns

- [ ] **[2026-04-30 sprint-4.5] 🟢 LOW bulk-double-find-checkout** — `bulkApprove`/`bulkReject` service 모두 `findCheckoutEntity(id)` 후 `approve()`/`reject()`가 내부에서 다시 `findCheckoutEntity(id)` — 2N DB read (50건 max × 2 = 100 reads / ~100ms). 의도적 trade-off: 단건 path와 정확히 같은 fail-close 순서·audit·notification 보장 우선. 측정된 병목 발생 시 `_rejectWithEntity`/`_approveWithEntity` private helper로 분리해 N reads로 감축. 변경 시 service.spec.ts 회귀 테스트 동시 보강 필수. 트리거: ① p95 bulk latency >500ms, ② bulk 호출 빈도 >100/day, ③ N>50로 max 상향 시.
- [x] ~~**[2026-04-30 sprint-4.5 SHOULD] S3 그룹 헤더 indeterminate 체크박스**~~ — CheckoutGroupCard 헤더 그룹 단위 일괄 선택. **완료 (sprint45-should-residual)** — `lib/checkouts/group-selection.ts` SSOT + 격리 fixture page (`__visual__/group-indeterminate`) + e2e 3 시나리오 (none/indeterminate/all → toggle 사이클).
- [x] ~~**[2026-04-30 sprint-4.5 SHOULD] S4 D-day 6-level storybook**~~ — visual regression. **완료 (sprint45-should-residual)** — Storybook 회피, Playwright `toHaveScreenshot()` 12 baseline (6 level × light/dark) `tests/e2e/visual/dday-6level.spec.ts`. SSOT 직접 import (`getCheckoutDdayVisualLevel`/`CHECKOUT_DDAY_VISUAL_THRESHOLDS`).
- [x] ~~**[2026-04-30 sprint-4.5 SHOULD] S6 EmptyState in-app 도움말 라우팅**~~ — mailto 외 대체 경로. **완료 (sprint45-should-residual)** — `FRONTEND_ROUTES.HELP` SSOT + `/help` 정적 라우트 + EmptyState `secondaryAction` prop. mailto 사용처(TeamMemberList/MemberProfileDialog)는 도메인 의도가 다르므로 보존.
- [ ] **[2026-04-30 sprint-4.5 SHOULD] S7 Sidebar pendingCount 분석 이벤트** — `analytics.track('sidebar.checkouts.click', {pendingCount})`.
- [x] **[2026-04-30 sprint-4.5 SHOULD] S8 bulk-reject e2e 테스트** — Playwright 5건 일괄 반려 + 부분 실패 시뮬레이션. **완료 2026-04-30**: Step 8(mock 전체 성공 toast) + Step 9(mock 부분 실패 toast) + WF-AP02-EXT describe(5건 실제 반려 + 3건 부분 실패 route intercept) 추가.

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

- [ ] **[2026-04-29 nextauth-csrf §S1] 🟡 MEDIUM legacy-sw-unregister-e2e-verification** — `LegacyServiceWorkerCleanup` 컴포넌트가 dev 마운트 시 `navigator.serviceWorker.getRegistrations()`로 1회 unregister하나 e2e 검증 없음. 추가로 cleanup 직후 강제 reload하지 않아 cleanup 발생 당시 페이지에서는 stale SW 응답이 잔존할 수 있음 — 다음 진입 시 정상화. Playwright spec으로 `getRegistrations().length === 0` 확인 + reload 정책 결정. 파일: `apps/frontend/components/pwa/LegacyServiceWorkerCleanup.tsx`. 트리거: PWA 회귀 테스트 sprint 또는 사용자 stale SW 보고 시.
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
- [ ] **[2026-04-26 sprint-3.2] 🟢 LOW canonical-filter-sort-helper** — `InboundCheckoutsTab.tsx`의 검색/필터 파라미터 빌드가 탭 컴포넌트 내부에서 인라인. `buildInboundOverviewQuery(filters)` 헬퍼로 추출하면 BFF + legacy 경로 모두 동일 파라미터 빌드를 보장(S2). 트리거: InboundCheckoutsTab 리팩토링 시.

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
- [ ] **[2026-04-28 phase-e-residual] 🟢 LOW frontend-test-final-run** — `pnpm --filter frontend test` 본 세션에서 미실행 (시간 제약). 다음 세션에서 실측. 트리거: 다음 commit 전.
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
