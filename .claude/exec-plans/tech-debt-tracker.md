# Tech Debt Tracker

harness 세션에서 이연된 SHOULD 실패·후속 작업을 누적 관리한다.
완료 항목은 `tech-debt-tracker-archive.md`로 이동.

## Open

### 2026-04-30 Checkouts V3 Sprint 4.5 T1+T2 SHOULD/Architecture Concerns

- [ ] **[2026-04-30 sprint-4.5] 🟡 MEDIUM checkout-group-card-setQueryData** — `apps/frontend/components/checkouts/CheckoutGroupCard.tsx:206,263` `queryClient.setQueryData(key, data)` 2건. MEMORY 규칙 `useOptimisticMutation setQueryData 금지` 위반 (TData ≠ TCachedData crash 75%). 본 Sprint scope 외 기존 코드. 트리거: CheckoutGroupCard 다음 mutation/캐시 관련 변경 PR.
- [ ] **[2026-04-30 sprint-4.5] 🟢 LOW form-template-spec-pre-existing-tsc** — `apps/backend/src/modules/reports/__tests__/form-template.service.spec.ts:257,266` `createdAt` 누락 (tsc error). 본 sprint 이전 존재. 트리거: file-upload-spec 신설 시 일괄 보강.
- [ ] **[2026-04-30 sprint-4.5] 🟢 LOW bulk-double-find-checkout** — `bulkApprove`/`bulkReject` service 모두 `findCheckoutEntity(id)` 후 `approve()`/`reject()`가 내부에서 다시 `findCheckoutEntity(id)` — 2N DB read (50건 max × 2 = 100 reads / ~100ms). 의도적 trade-off: 단건 path와 정확히 같은 fail-close 순서·audit·notification 보장 우선. 측정된 병목 발생 시 `_rejectWithEntity`/`_approveWithEntity` private helper로 분리해 N reads로 감축. 변경 시 service.spec.ts 회귀 테스트 동시 보강 필수. 트리거: ① p95 bulk latency >500ms, ② bulk 호출 빈도 >100/day, ③ N>50로 max 상향 시.
- [ ] **[2026-04-30 sprint-4.5 SHOULD] S1 BulkActionBar SKILL.md actions slot 표준 명문화** — design-token doc 업데이트.
- [ ] **[2026-04-30 sprint-4.5 SHOULD] S2 useRowSelection IME 가드** — 단축키 A/Shift+A 한글 입력 중 발화 방지.
- [ ] **[2026-04-30 sprint-4.5 SHOULD] S3 그룹 헤더 indeterminate 체크박스** — CheckoutGroupCard 헤더 그룹 단위 일괄 선택.
- [ ] **[2026-04-30 sprint-4.5 SHOULD] S4 D-day 6-level storybook** — visual regression.
- [ ] **[2026-04-30 sprint-4.5 SHOULD] S6 EmptyState in-app 도움말 라우팅** — mailto 외 대체 경로.
- [ ] **[2026-04-30 sprint-4.5 SHOULD] S7 Sidebar pendingCount 분석 이벤트** — `analytics.track('sidebar.checkouts.click', {pendingCount})`.
- [ ] **[2026-04-30 sprint-4.5 SHOULD] S8 bulk-reject e2e 테스트** — Playwright 5건 일괄 반려 + 부분 실패 시뮬레이션.
- [ ] **[2026-04-30 sprint-4.5 SHOULD] S9 RejectModal charsRemaining 카운터** — D2 delegation으로 BulkRejectDialog 미신설 → 기존 ApprovalsClient.RejectModal에 charsRemaining UX 보강.

### 2026-04-30 deps-supply-chain-hardening review-architecture 권고 (ATTENTION → PASS 격상 조건)

- [x] **[2026-04-30 deps-supply-chain] 🔴 IMMEDIATE A3 ci-supply-chain-gate** — ✅ 2026-04-28 완료. `.github/workflows/supply-chain-gate.yml` 신설 (drift-check + dependabot-audit 2 jobs, `--ignore-scripts`로 preinstall 독립 검증).
- [x] **[2026-04-30 deps-supply-chain] 🔴 IMMEDIATE A1 mock-providers-identifier-helper** — ✅ 2026-04-28 완료. `createMockIdentifierService()` 헬퍼 추가, verify-ssot Step 44 검증 명령 6번에 mock 등록 grep 추가 + PASS/FAIL 항목 갱신.
- [x] **[2026-04-30 deps-supply-chain] 🔴 IMMEDIATE A5 identifier-policy-docs** — ✅ 2026-04-28 완료. `docs/references/identifier-policy.md` 63 lines (5 섹션: SSOT 진입점/4 헬퍼/트레이드오프/예외/추가 절차). skills-index.md 인덱스 추가.
- [x] **[2026-04-30 deps-supply-chain] 🔴 IMMEDIATE A6 eslint-no-restricted-imports-crypto** — ✅ 2026-04-28 완료. `apps/backend/.eslintrc.js`에 `no-restricted-imports.paths` (`node:crypto`/`crypto` randomUUID) + `no-restricted-syntax` (`MemberExpression[property.name='randomUUID']`) + identifier.service.ts overrides 추가. 부수: 3 파일을 named import (`createHash`/`randomBytes`)로 좁힘.

#### 후속 (본 세션 2026-04-28에서 발견)
- [ ] **[2026-04-28 supply-chain-gate-completion] 🟢 LOW eslint-require-alias-rename-gap** — ESLint `no-restricted-imports`는 ES module `import`만 검사. `const { randomUUID: rid } = require('node:crypto')` + `rid()` alias 패턴은 미차단. TypeScript ESM 코드베이스에서 require 사용 패턴 드물어 실질 위험 낮음. 트리거: backend에 처음 require() 사용처 등장 시.
- [x] **[2026-04-28 supply-chain-gate-completion] 🟢 LOW main-residual-lint-errors** — ✅ 2026-04-28 완료 (system-wide-completion sprint Phase C1). pre-push hook에 `pnpm --filter backend run lint:ci` + `pnpm --filter frontend run lint` 추가하여 회귀 차단 게이트 보강. 부수: 본 sprint 동안 frontend `RouteLoading` deprecated 9건 일괄 SSOT 마이그레이션(`@/components/layout/RouteLoading` → `@/components/loading`) + `variant="table"` 4건 → `"list"` SSOT 정합화 + `showHeader` prop 4건 제거 (SSOT 미지원). frontend lint warnings 2건(LegacyServiceWorkerCleanup unused eslint-disable)은 warning이라 차단 안 됨 — 별도 sprint 처리 가능.
- [x] **[2026-04-29 checkout-url-first-state] 🟢 LOW S6 parseCheckoutCreateParams-unit-test** — ✅ 2026-04-29 완료 (tech-debt-batch-0429 Phase D). `apps/frontend/lib/utils/__tests__/checkout-create-params.test.ts` 신설, 7 케이스 PASS: 빈 입력 / equipmentId only / purpose only / 둘 다 / 잘못된 purpose / 공백 문자열 / Record 형식 입력.
- [ ] **[2026-04-30 deps-supply-chain] 🟡 MEDIUM A4 dependabot-yml-policy** — `.github/dependabot.yml`에 caret 잠금 정책과 충돌 방지 룰 (semver-major ignore 또는 versioning-strategy 명시). 트리거: dependabot 첫 PR이 preinstall guard에 의해 install 실패하는 시점 (조기 등재로 잊힘 방지).
- [ ] **[2026-04-30 deps-supply-chain] 🟡 MEDIUM file-upload-form-template-spec-신설** — `file-upload.service.spec.ts` + `form-template.service.spec.ts` 부재 (기존 tech-debt). IdentifierService 도입 계기로 spec 신설 자연스러운 시점. file-upload는 보안·magic-bytes·SHA-256 critical path. 트리거: 다음 critical path 변경 PR.
- [x] **[2026-04-30 deps-supply-chain] 🟢 LOW identifier-negative-test** — ✅ 2026-04-30 완료 (tech-debt-batch-0430 Phase E). `jest.mock('node:crypto', factory)` 패턴으로 non-configurable 프로퍼티 우회. CSPRNG 장애 시 서비스 중단 negative test 추가. `identifier.service.spec.ts`.
- [ ] **[2026-04-30 deps-supply-chain] 🟢 LOW frontend-id-helper-격상** — frontend가 client-side 도메인 id 생성하는 첫 호출처 등장 시 `packages/shared-constants` 또는 `apps/frontend/lib/identifiers/`로 격상. 트리거: frontend 첫 호출처 (드래그-드롭 reorder key 등).
- [ ] **[2026-04-30 deps-supply-chain] 🟢 LOW bundle-size-baseline** — `pnpm measure:bundle` baseline 갱신. 본 세션은 backend-only 변경이라 frontend 영향 0이지만 frontend가 IdentifierService 격상된 SSOT를 import하는 시점 측정 권장.

#### review-architecture skill 권고 (2026-04-28 통합 review)
- [x] **[2026-04-28 review-arch] 🟡 MEDIUM dev-doctor-hint-line-mode** — ✅ 2026-04-29 완료 (tech-debt-batch-0429 Phase B). `scripts/dev-doctor.mjs`에 `--hint-line` CLI mode 추가 + `formatHintLine()` export. `.claude/settings.json` SessionStart hook을 `node scripts/dev-doctor.mjs --hint-line 2>/dev/null || true` 1줄로 단순화. level=ok → stdout 비어있음, [dev-hygiene] 1줄 포맷 보존.
- [x] **[2026-04-28 review-arch] 🟡 MEDIUM checkout-selectability-physical-ssot** — ✅ 2026-04-29 완료 (tech-debt-batch-0429 Phase A). `checkouts.service.ts` inline `===` 팀 비교 제거, `isPurposeCompatibleWithEquipment` + `USER_SELECTABLE_PURPOSES.includes()` 가드로 교체. `return_to_vendor` 등 시스템 전용 purpose는 팀 검증 제외(fail-open 보존). OWN_TEAM_ONLY/OTHER_TEAM_ONLY 양쪽 경로 보존.

### 2026-04-28 checkouts-phase4-kpi-hierarchy SHOULD 이연 항목

- [x] **[2026-04-28 checkouts-phase4] 🟡 MEDIUM dashboard-pending-approval-card-alert-ring-token** — ✅ 2026-04-29 완료 (tech-debt-batch-0429 Phase C). `DASHBOARD_PENDING_APPROVAL_TOKENS.alertRing` 4키(heroFull/priority/compact/full) 신설. `PendingApprovalCard.tsx` 4곳 raw ring 클래스 → 토큰 경유. 토큰 값 기존 클래스 1:1 동일.
- [x] **[2026-04-28 checkouts-phase4] 🟢 LOW heroKPI-atom-react-memo** — ✅ 2026-04-29 완료 (tech-debt-batch-0429 Phase F). `React.memo(function HeroKPI...)` named function expression으로 wrap. displayName 자동 보존, Props 시그니처 변경 없음.
- [ ] **[2026-04-28 checkouts-phase4] 🟢 LOW phase-4-5-checkout-summary-extension** — backend `CheckoutSummary`에 `avgDelayDays`, `maxOverdueDays` 추가 → wireframe hero kpi-meta ("평균 지연 2.3일 · 최장 D+8") UI 표시. 트리거: backend 확장 + frontend kpi-meta 슬롯 추가.
- [ ] **[2026-04-28 checkouts-phase4] 🟢 LOW phase-4-6-sparkline-trend-api** — `SparklineMini` 현재 `[]` placeholder. trend timeseries API 신설 + 실제 데이터 연결 + trend prop 동적 derive. 트리거: 시계열 백엔드 신설 PR.
- [ ] **[2026-04-28 checkouts-phase4] 🟢 LOW phase-5-pending-hero-priority** — `selectHeroVariant`에 pending threshold 우선순위 추가 (overdue==0 && pending>10 → 'pending'). `HERO_PRIORITY` 배열에 rule 추가 + negative test 5번 갱신. 트리거: Phase 5 (P1-2 알림 단일 노출)와 함께 결정.

### 2026-04-29 harness: nextauth-csrf-single-origin SHOULD 후속 (ADR-0006 정착 후 deferred)

- [ ] **[2026-04-29 nextauth-csrf §S1] 🟡 MEDIUM legacy-sw-unregister-e2e-verification** — `LegacyServiceWorkerCleanup` 컴포넌트가 dev 마운트 시 `navigator.serviceWorker.getRegistrations()`로 1회 unregister하나 e2e 검증 없음. 추가로 cleanup 직후 강제 reload하지 않아 cleanup 발생 당시 페이지에서는 stale SW 응답이 잔존할 수 있음 — 다음 진입 시 정상화. Playwright spec으로 `getRegistrations().length === 0` 확인 + reload 정책 결정. 파일: `apps/frontend/components/pwa/LegacyServiceWorkerCleanup.tsx`. 트리거: PWA 회귀 테스트 sprint 또는 사용자 stale SW 보고 시.
- [ ] **[2026-04-29 nextauth-csrf §S2] 🟢 LOW bundle-size-baseline-after-axios-baseurl-simplification** — `pnpm measure:bundle` baseline 갱신. axios baseURL 분기 단순화 (절대 URL → 빈 문자열) 영향 측정 — 약 수백 byte 감소 추정. 트리거: bundle baseline 정기 업데이트.
- [ ] **[2026-04-29 nextauth-csrf §S3] 🟡 MEDIUM docker-compose-lan-prod-manual-verification** — `pnpm compose:lan up -d --build` 후 `curl http://lan-ip:9000/api/auth/csrf` → 200 + JSON 응답 확인. nginx NextAuth handler 분기(infra/nginx/lan.conf:121-159 신규 location 2개) 운영 환경 manual 검증. 트리거: 다음 LAN/prod 배포 직전.
- [ ] **[2026-04-29 nextauth-csrf §S4] 🟢 LOW csp-report-endpoint-violation-monitoring** — same-origin 모델 정착으로 CSP `connect-src 'self' ws: wss:`가 strict해짐. 5분 dev 모니터링에서 CSP violation 0건 확인했으나 production 트래픽에서도 0건인지 dashboard 알림 룰 검토. 파일: `apps/backend/src/modules/security/`. 트리거: production 배포 후 1주일 모니터링.
- [ ] **[2026-04-29 nextauth-csrf §S8] 🟢 LOW monitoring-middleware-auth-404-alert-rule** — `/api/auth/*` 404가 backend 콘솔에 다시 출력되면 즉시 회귀. monitoring middleware (또는 Grafana 알림)에 룰 신설하여 회귀 5분 내 발견. 파일: `apps/backend/src/common/middleware/monitoring.middleware.ts`. 트리거: monitoring rule sprint.
- [x] **[2026-04-29 nextauth-csrf §J3] 🟢 LOW verify-routing-origin-pre-commit-hook** — ✅ 2026-04-29 완료. `scripts/verify-routing-origin.sh` 신설(Steps 2-11) + `packages/shared-constants/__tests__/api-routing.spec.ts` 신설(34 invariant tests) + `.husky/pre-push` path-based gate 추가(api-routing.ts/next.config.js/proxy.ts/infra/nginx/ 변경 감지 시 자동 실행). Evaluator MUST 11/11 PASS.
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

### 2026-04-30 verify-implementation 발견 — tech-debt-batch-0430 후속

- [x] **[2026-04-30 verify-impl-batch-0430] 🟢 LOW fetchers-status-literal-ssot** — ✅ 2026-04-30 완료 (tech-debt-batch-0430b). `apps/frontend/lib/api/approvals/fetchers.ts` 리터럴 3건 → `CheckoutStatusValues.PENDING` / `CheckoutPurposeValues.RETURN_TO_VENDOR` / `IntermediateCheckFilterStatusValues.DUE` SSOT 교체.

### 2026-04-27 harness: approvals-ui-r2 DoD deferred items (contract section 11)

- [ ] **[2026-04-27 ar13] 🟢 LOW ar13-lab-manager-self-inspection** — `lab_manager` 역할이 `ROLE_APPROVAL_CATEGORIES`에 `AC.SELF_INSPECTION` 미포함. 현재 technical_manager만 자체점검 승인 가능. lab_manager의 자체점검 승인 권한 필요 여부 확인 후 `approval-categories.ts` 수정. 트리거: lab_manager 역할 승인 흐름 검토 시. ⚠️ 도메인 정책 결정 보류 (사용자 확인 필요).
- [x] **[2026-04-27 approvals-ui-r2] 🟡 MEDIUM approvals-api-module-split** — ✅ 2026-04-30 완료 (tech-debt-batch-0430 Phase A). `approvals-api.ts` 1538줄 → `types/internal-rows/mappers/fetchers/actions` 5개 서브모듈 + 배럴 파일로 functional-axis 분리. 24개 호출처 변경 없음(배럴 re-export 보존).
- [ ] **[2026-04-27 approvals-ui-r2] 🟡 MEDIUM role-approval-categories-db-backed** — `ROLE_APPROVAL_CATEGORIES` 현재 코드 상수. DB-backed 설정으로 전환 시 운영 유연성 확보. 트리거: 역할별 카테고리 변경 주기가 배포 주기보다 빨라질 때.
- [x] **[2026-04-27 approvals-ui-r2] 🟡 MEDIUM bulk-approve-rate-limit** — ✅ 2026-04-30 완료 (tech-debt-batch-0430b). `runWithConcurrency<T>(tasks, 5)` 헬퍼 도입, `bulkApprove` / `bulkReject` 동시 API 호출 5개로 제한. 배치 API 엔드포인트는 추후 서버 부하 측정 후 검토.
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW approval-vocabulary-unification** — `approval-constants.ts` ↔ `approvals-api.ts` vocabulary 분산 (pending_approval vs pending 등). AR-2 잔여. 트리거: 승인 도메인 대규모 리팩토링 시.
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW approval-audit-timeline-ui** — backend 감사 로그 존재하나 UI 타임라인 미구현. 트리거: 승인 이력 조회 요구사항 발생 시.
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW mobile-detail-modal-fullscreen** — 모바일에서 ApprovalDetailModal이 full-screen 미지원. 트리거: 모바일 실기기 테스트 시.
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW reject-reason-template-quickselect** — 자주 쓰는 반려 사유 quick-select 기능. 현재 5개 템플릿 하드코딩. DB-backed 템플릿 관리 검토. 트리거: 운영팀 피드백 시.
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW approval-delegation-workflow** — 위임 워크플로우 미구현. 장기 부재자 승인 위임. 트리거: 위임 요구사항 발생 시.
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW approval-analytics-dashboard** — 월별 처리량/평균 처리시간 대시보드 미구현. 트리거: 관리자 리포팅 요구사항 발생 시.

### 2026-04-27 harness: Sprint 4.1+4.2 NextStepPanel+Row3Zone SHOULD 이연 항목

- [x] **[2026-04-27 sprint-4.2] 🟢 LOW overflow-action-type-ssot** — ✅ 2026-04-30 완료 (tech-debt-batch-0430 Phase D). `OverflowAction` 인터페이스를 `lib/types/checkout-ui.ts` SSOT로 승격. `NextStepPanel.tsx`에서 `import type` + `export type` 분리 패턴으로 하위 호환성 보장.
- [ ] **[2026-04-27 sprint-4.2] 🟢 LOW zone2-status-text-truncate** — Zone 2(72px) Badge 내부 긴 상태값 truncate 처리 없음. 영어 locale overflow 가능. 트리거: i18n 검토 시.
- [ ] **[2026-04-27 sprint-4.2] 🟢 LOW row-mobile-stacking** — Zone 4 모바일(< sm) overflow 가능. sm:hidden/flex 패턴으로 스택 레이아웃 검토 필요. 트리거: 모바일 실기기 테스트 시.

### 2026-04-26 harness: Sprint 3.1~3.2 BFF + queryKeys 계층 SHOULD 후속

- [x] **[2026-04-26 sprint-3.1] 🟡 MEDIUM inbound-bff-flag-removal** — ✅ 2026-04-30 완료 (tech-debt-batch-0430b). `checkout-flags.ts` 삭제, `InboundCheckoutsTab.tsx` BFF-only로 단순화 (legacy 3-useQuery 제거, `teamId` props 제거 — 백엔드가 JWT에서 역할 기반 필터링). `.env.example` 플래그 항목 제거.
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
- [x] **[2026-04-27 approvals-ui-r2] 🟢 LOW stepper-step-transition-animation** — ✅ 2026-04-30 완료 (tech-debt-batch-0430c). `APPROVAL_STEPPER_TOKENS.connector.transition = TRANSITION_PRESETS.fastBg` 신설, `ApprovalStepIndicator.tsx` connector div에 적용. background-color 200ms ease-standard `motion-safe:transition-[background-color]` 전환.


### 2026-04-28 dashboard-redesign-architectural SHOULD 이연 항목

- [ ] **[2026-04-28 dashboard-thresholds-ssot] 🟢 LOW system-health-queue-size-impl** — `apps/backend/src/modules/dashboard/dashboard.service.ts:getSystemHealth()`의 `queueSize`가 0 stub. BullMQ 또는 Redis 큐 도입 시 실측 연결 필요. 현재는 dbResponseMs/storagePct만 overallStatus 판정에 기여. 트리거: BullMQ/큐 인프라 도입 Sprint.
- [ ] **[2026-04-28 dashboard-thresholds-ssot] 🟢 LOW system-health-error-source-table** — `errorCount24h`가 audit_logs의 `reject`/`cancel` 비즈니스 거절을 proxy로 사용 중. 진정한 시스템 에러 카운트는 별도 `error_logs` 또는 `system_events` 테이블 + Sentry 통합 필요. 트리거: 운영 모니터링 정비 Sprint.
- [ ] **[2026-04-28 dashboard-thresholds-ssot] 🟢 LOW dashboard-storage-capacity-env** — `DASHBOARD_STORAGE_CAPACITY_BYTES` 기본 100 GiB. 운영 환경별 실제 디스크 capacity로 env 설정 필요 (Docker volume / K8s PV / 호스트 디스크). 트리거: 프로덕션 배포 시 env 설정 체크리스트.

### 2026-04-28 dashboard-redesign-residual SHOULD 이연 항목 (verify+review+manage-skills 통합)

- [x] **[2026-04-28 dashboard-redesign] kpi-status-grid-min-h-token** — `DASHBOARD_DDAY_COMPACT_TOKENS.minHeightPx = 280` 토큰화 완료, CalibrationDdayList.tsx:63 사용. (완료 2026-04-28 phase-e-residual)
- [x] **[2026-04-28 dashboard-redesign] system-health-react-query-monitoring-polling** — `DashboardClient.tsx:173` `QUERY_CONFIG.MONITORING` 적용 완료. (완료 2026-04-28 phase-e-residual)
- [x] **[2026-04-28 dashboard-redesign] welcome-suffix-en-empty** — `_suffixNote` sibling 키 ko/en 양쪽 추가, intentional empty 명시. (완료 2026-04-28 phase-e-residual)
- [x] **[2026-04-28 dashboard-redesign] dashboard-controller-zod-scope-validation** — `DashboardScopeValidationPipe` + `@UsePipes` 적용, `packages/shared-constants/src/dashboard-scope.ts` SSOT 신설. (완료 2026-04-28 phase-e-residual)
- [x] **[2026-04-28 dashboard-redesign] dashboard-controller-process-env-direct** — `ConfigService.get<number>('DASHBOARD_STORAGE_CAPACITY_BYTES')` 경유, `env.validation.ts` Zod schema 추가. (완료 2026-04-28 phase-e-residual)
- [x] **[2026-04-28 dashboard-redesign] pre-existing-dday-deprecation** — 4-tier 마이그레이션 완료, deprecated 6-tier 정의 + 배럴 re-export 모두 제거. (완료 2026-04-28 phase-e-residual)

### 2026-04-28 manage-skills P2 후속 (완료)

- [x] **[2026-04-28 manage-skills] verify-ssot-step-37-effective-role** — Step 37로 추가 (Step 36은 D-day SSOT가 선점). useEffectiveRole SSOT 경유 강제. (완료 2026-04-28 phase-e-residual)
- [x] **[2026-04-28 manage-skills] verify-frontend-state-step-24-dual-mode-asymmetry** — Step 24 추가, isControlled = propA && propB 비대칭 검증. (완료 2026-04-28 phase-e-residual)
- [x] **[2026-04-28 manage-skills] verify-frontend-state-step-21-online-status-ssot** — Step 21 확장, useOnlineStatus SSOT + navigator.onLine 직접 사용 금지. (완료 2026-04-28 phase-e-residual)
- [x] **[2026-04-28 manage-skills] verify-design-tokens-step-43-error-fallback** — Step 43 보강, getDerivedStateFromError 화이트리스트 + EmptyState variant="error" 경유 강제. (완료 2026-04-28 phase-e-residual)

### 2026-04-28 dashboard-redesign-phase-e-residual SHOULD 후속 (미완료)

- [x] **[2026-04-28 phase-e-residual] 🟡 MEDIUM bundle-baseline-script-nextjs16-migration** — ✅ 2026-04-29 완료. `scripts/check-bundle-size.mjs`에 `measureFromBuildArtifacts()` 함수가 이미 존재하며 Next.js 16 PPR 빌드 산출물(build-manifest.json + app-paths-manifest.json) 직접 측정 지원. stdout 파싱은 레거시 fallback으로 유지. AP-08은 별도 원인으로 미완료였을 것으로 추정.
- [ ] **[2026-04-28 phase-e-residual] 🟢 LOW simulate-role-audit-log-observability** — SYSTEM_ADMIN의 `?simulateRole=` 사용 시 audit_logs entry 미발행. 누가 어떤 역할 시뮬했는지 추적 불가. `useEffectiveRole`에서 시뮬 활성 1회 audit log 호출 검토. 트리거: 보안/관측 강화 sprint.
- [ ] **[2026-04-28 phase-e-residual] 🟢 LOW standalone-html-1to1-matching** — REVIEW_RESULT.md ⚠️ 5항목 (§3.1 EQ 마크 / §3.7 items-stretch / §3.10 debug widget / §A.3.1 미니캘린더 / §A.9.1 skip nav) — Playwright baseline 캡처 + 시각 검수로 1:1 매칭 검증 필요. 트리거: 다음 디자인 QA sprint.
- [ ] **[2026-04-28 phase-e-residual] 🟢 LOW frontend-test-final-run** — `pnpm --filter frontend test` 본 세션에서 미실행 (시간 제약). 다음 세션에서 실측. 트리거: 다음 commit 전.
- [ ] **[2026-04-28 phase-e-residual] 🟢 LOW playwright-dashboard-screenshots-baseline** — `dashboard-screenshots.spec.ts` 본 세션에서 helper 추가 + dark/axe scan 보강만 완료. 실제 5 role × 1440 light/dark 30 PNG 캡처는 미실행 (storage state + dev 서버 의존). 트리거: 다음 디자인 QA sprint.

### 2026-04-28 i18n-parity-hardening SHOULD 후속 (미완료)

- [x] **[2026-04-28 i18n-parity-hardening] 🟡 MEDIUM lib-i18n-client-singular-deprecation** — `apps/frontend/lib/i18n/client.ts` 파일 삭제 완료 (0 callers, 단수형 `useTranslation` 래퍼는 dead code였음. 미래 silent-swallow 회귀 벡터 제거). next-intl 표준 `useTranslations` (복수형) 직접 사용으로 통일. (완료 2026-04-28 gap-fix-iter)
- [x] **[2026-04-28 i18n-parity-hardening] 🟢 LOW shadowed-binding-eslint-rule** — NonConformanceBanner.tsx의 `t` 변수 분리 완료 (`tNc` for non-conformances ns + `tBanner` for equipment.nonConformanceBanner ns). 정적 검증 shadowed 0건 달성. (완료 2026-04-28 gap-fix-iter)
- [x] **[2026-04-28 i18n-parity-hardening] 🟢 LOW eslint-no-atom-i18n-rule** — ESLint 룰 대신 더 정확한 게이트 채택: `scripts/check-i18n-call-sites.mjs`에 `common.json` 구조 검증 추가 — root level은 sub-namespace(object)만 허용, flat string/array 추가 시 exit 1. 정밀 분석 결과 atom-owned sub-namespace(예: `common.fileUpload.*`)는 안전한 캡슐화이므로 일률적 금지는 false positive 9건 발생. 회귀 메커니즘(flat top-level key 추가)을 *구조적으로* 차단하는 것이 ROI 높음. frontend-patterns.md 정책 정밀화 동시 완료. (완료 2026-04-28 gap-fix-iter)
- [x] **[2026-04-28 i18n-parity-hardening] 🟢 LOW e2e-no-missing-message-spec** — `tests/e2e/features/i18n/no-missing-message.spec.ts` 작성 완료. 시드 UUID 회피 위해 system-wide list 라우트(`/checkouts`, `/equipment`, `/non-conformances`) 3개 사용. console.error MISSING_MESSAGE 패턴 + body raw key 노출 0건 검증. (완료 2026-04-28 gap-fix-iter)
- [x] **[2026-04-28 i18n-parity-hardening] 🟡 MEDIUM cross-cutting-ns-structural-check** — ✅ 2026-04-30 완료 (tech-debt-batch-0430 Phase B). `CROSS_CUTTING_NAMESPACES = ['common', 'errors']`로 정책 명문화. `checkCommonJsonStructure()` → `checkStructuralNamespaces()`로 리팩터. `navigation`(69 flat keys)/`auth`(8)/`notifications`(13)는 flat-by-design 주석으로 명시. `check-i18n-call-sites.mjs`.
- [x] **[2026-04-28 i18n-parity-hardening] 🟢 LOW frontend-patterns-shared-exception-text-precision** — ✅ 2026-04-30 완료 (tech-debt-batch-0430 Phase G). `frontend-patterns.md` 위치별 예외 정책을 도메인/shared/common.* 3-bullet로 명확화. `CROSS_CUTTING_NAMESPACES` 참조 갱신. 이중 해석 제거.
- [x] **[2026-04-28 i18n-parity-hardening] 🟢 LOW i18n-namespaces-array-comment-lag** — ✅ 2026-04-30 완료 (tech-debt-batch-0430 Phase F). `apps/frontend/i18n/request.ts` "Phase 0 ~ Phase 1+" stale 주석 제거. 네임스페이스 설명을 단순화(동적 로딩, 점진적 추가 지원 1줄).

### 2026-04-28 supply-chain-gate-completion 부수 발견 — 사전 lint 회귀 청소

- [x] **[2026-04-28 software-validations] 🔴 IMMEDIATE software-validation-approve-comment-silent-loss** — ✅ 2026-04-28 완료 (harness Mode 2 — `software-validation-approve-comment`). 도메인 결정 (c) **컬럼 + audit_logs 이중 안전망** 적용: `software_validations.approval_comment text` 컬럼 신설(disposal/calibration-plans 동일 SSOT 답습) + service `approve()` underscore prefix 제거 + `approvalComment: approvalComment || null` persist. Audit 측은 `audit.interceptor.ts:287-291`이 `@AuditLog` 데코레이터 적용 핸들러의 `request.body`를 자동 기록 중이므로 service 추가 호출 없음(SRP/중복 회피). 4 spec 케이스(persist/undefined→null/empty→null/regression guard) + Migration `0048_add_software_validation_approval_comment.sql` + rollback SQL + 무손실 회귀 안전망(audit_logs에서 코멘트 복원 가능). drizzle journal/snapshot은 TTY 제약으로 hand-written SQL만 1차 진행 (S5 SHOULD: 사용자 TTY 환경에서 `db:generate` 별도 실행 필요).
- [ ] **[2026-04-28 software-validation-comment] 🟢 LOW service-param-underscore-prefix-static-check** — Service 메서드 파라미터 underscore prefix(`_paramName`) 패턴이 의도된 unused인지 silent loss인지 정적 구분 불가. ESLint 룰은 false positive 다수(데코레이터 metadata-only 파라미터, 인터페이스 구현용 unused 등) → 채택 안 함(Phase 5 결정). 회귀 1차 방어: spec 커버리지(persist + regression guard 케이스). 2차 방어: verify-implementation 스킬에 underscore-prefixed parameter grep 룰 추가 권고(개별 review 절차로). 트리거: 다른 도메인에서 동일 silent loss 발견 시 또는 verify-implementation 스킬 검증 강화 sprint.
- [x] **[2026-04-28 software-validation-comment] 🟢 LOW frontend-approval-comment-input-ui-audit** — ✅ 2026-04-30 완료 (harness Mode 1 — `sv-approval-comment-ui`). `ValidationApproveDialog` (technical/quality 통합 type prop) + `ValidationRejectDialog` (aria-required + role=alert + disabled=!reason.trim()) 신설. `SoftwareValidationContent` 8 useState → activeDialog discriminated union 압축. i18n ko/en parity (reasonRequired, reasonHint, submitting, charsRemaining 추가). VALIDATION_RULES.LONG_TEXT_MAX_LENGTH char count 표시.
- [ ] **[2026-04-28 software-validation-comment] 🟢 LOW quality-approve-comment-policy** — `qualityApprove()` 메서드 시그니처에 코멘트 파라미터 자체가 없음. 품질책임자 승인 시 검토 의견 기록 정책 미정의. ISO/IEC 17025 §6.2.2 관점에서 "이중 승인 trail 일관성" 위해 `qualityApproveComment` 필드 도입 검토 필요. 트리거: 도메인 정책 결정 sprint.
- [ ] **[2026-04-28 dashboard-spec] 🟢 LOW dashboard-spec-helper-return-type-policy** — `apps/backend/src/modules/dashboard/__tests__/dashboard.service.spec.ts:326` `setupHealthMocks` helper에 return type `: void` 명시로 lint 통과. 정책 점검: spec 파일에서 helper function의 explicit-function-return-type 강제 적절성 — 현재 ESLint override는 `no-restricted-syntax`만 끔. spec helper는 추론으로 충분한 경우가 많아 spec 디렉토리에서 본 룰 완화 검토 가능. 트리거: ESLint config 정책 통일 sprint.
- [x] **[2026-04-28 supply-chain-gate-completion] 🟢 LOW eslint-require-alias-rename-gap (dynamic import variant)** — ✅ 2026-04-30 완료 (tech-debt-batch-0430 Phase C). `dynamic import('node:crypto')` / `import('crypto')` 패턴 2개 차단 selector(`CallExpression[callee.type='Import']`) global + controller override에 추가. CommonJS `require()` + alias rename 패턴은 TS sourceType:module 코드베이스에서 require 호출 0건으로 실질 위험 낮아 별도 항목(상단 2026-04-28 supply-chain-gate-completion 첫 번째 항목)으로 트리거 기반 유지.

### 2026-04-28 sidebar-nav-action-pattern SHOULD 후속 (미완료)

- [x] **[2026-04-28 sidebar-nav-action-pattern] 🟢 LOW resolve-badge-and-action-exhaustive-kind-check** — ✅ 2026-04-29 완료 (tech-debt-batch-0429 Phase E). `switch (cfg.kind)` + `assertNever(x: never): never` 패턴 적용. `count-with-action` / `count` 양쪽 명시, default → assertNever로 컴파일 타임 exhaustiveness 보장.
- [ ] **[2026-04-28 sidebar-nav-action-pattern] 🟢 LOW filtered-nav-secondary-action-aria-key-literal-union** — `FilteredNavSecondaryAction.ariaKey` / `primaryAriaKey`가 `string` 타입. 오타 시 next-intl 런타임 throw. i18n 키 리터럴 유니언으로 좁히면 컴파일 타임 검증. 단, 키 추가 시마다 타입 갱신 필요라 trade-off 존재. 트리거: i18n 키 도메인 SSOT sprint 또는 nav 도메인 키 폭주 시.
- [ ] **[2026-04-28 sidebar-nav-action-pattern] 🟢 LOW sidebar-row-container-li-semantics** — exec-plan 아키텍처 결정은 `<li>` 컨테이너였으나 구현은 `<div>`. 부모도 `<ul>`이 아닌 `<div>`이라 자기 일관성은 유지되나 nav landmark 안에서 `<ul><li>` 시맨틱이 더 정확. 모든 nav item을 `<ul><li>`로 일괄 재구성하면 SR이 "list with N items" 안내 추가. 트리거: 사이드바 nav 시맨틱 강화 sprint 또는 a11y 회귀 발견 시.
- [ ] **[2026-04-28 sidebar-nav-action-pattern] 🟡 MEDIUM sidebar-nav-action-e2e-manual-verify** — Playwright `tests/e2e/features/layout/sidebar-nav-action.spec.ts` BLOCKED-ENV (contract M4/M5). dev server + storageState로 수동 검증 후 결과 기록 필요. 검증 항목: (1) 콘솔 hydration 에러 0건 (2) DOM `a > a` 0건 (3) Tab 순서 메인 → 보조. 시드에 yourTurn ≥1 케이스 보장 필요. 트리거: 다음 commit 직전 또는 `/checkouts` 라우트 수정 시.
- [x] **[2026-04-29 rental-approval-workflow-fix] 🟡 MEDIUM g9-getpendingchecks-borrower-pending** ✅ — F-1에서 처리. EXISTS 서브쿼리로 `requester.teamId === userTeamId` 매칭 + `pending` status 추가. borrower TM nav 배지 정상 카운트.
- [ ] **[2026-04-29 rental-approval-workflow-fix] 🟢 LOW findall-meta-fallback-path** — `findAll` 의 `if (userPermissions)` 조건부 분기 — 직접 호출 시(getInboundOverview 등) meta 누락 경로 잔존. 모든 호출처가 user info 전달하면 분기 제거 가능. 트리거: getInboundOverview에 meta 필요해질 때 (현재는 dashboard 용도라 meta 불필요 — defense-in-depth 측면에서 옵셔널 유지가 적절).
- [x] **[2026-04-29 rental-approval-workflow-fix] 🟡 MEDIUM use-checkout-group-descriptors-actor-ctx** ✅ — F-2에서 처리. hook 시그니처에 `userTeamId?` 합류, `requesterTeamId`를 FE Checkout 타입에 추가, `getNextStep`에 actorCtx 전달. defense-in-depth 일관성.
- [x] **[2026-04-29 rental-approval-workflow-fix] 🟢 LOW actor-team-disabled-wcag** ✅ — F-3에서 처리. `aria-describedby` 연결 + `role="status"` 사유 노출. SR이 disabled 버튼에 포커스 시 사유 읽음.

### 2026-04-29 button-loading-codemod SHOULD 후속 (미완료)

- [ ] **[2026-04-29 button-loading] 🟢 LOW harness-contract-M1-extra-claude-files** — Phase 0 commit `f661c2d0`에 `.claude/contracts/button-loading-codemod.md` 등 harness 아티팩트 4개가 도메인 파일과 동일 커밋에 포함됨. 계약 기준 M1 미달이나 코드 품질에는 영향 없음. Harness 워크플로우 개선: Planner 아티팩트를 별도 커밋(chore(harness))으로 분리하도록 계약 예외 항목 추가 권고. 트리거: 다음 harness Mode 2 세션 Planner 작성 시.
- [ ] **[2026-04-29 button-loading] 🟢 LOW harness-contract-M9-prettier-collateral** — Phase 1 commit `ccde0f74`에 Prettier PostToolUse hook이 자동 포맷한 shadcn UI 12개 파일 포함. 계약 M9 "surgical scope" 기술적 미달. 실제로는 pure formatting(no-op). Harness 계약에 "PostToolUse Prettier 리포맷 파일은 M9 예외" 조항 명시 권고. 트리거: 다음 harness Mode 2 계약 작성 시.
- [ ] **[2026-04-29 button-loading] 🟢 LOW visual-double-spinner-settings-only** — `CalibrationSettingsContent.tsx`, `SystemSettingsContent.tsx`, `DisplayPreferencesContent.tsx` 3개 settings 파일에 `loading={isPending}` + 내부 `<Loader2 aria-hidden="true">` 공존. aria-hidden으로 SR double-announce 없음. 시각적으로는 이중 스피너. 참고: `AzureAdButton.tsx` / `LoginForm.tsx`는 2026-04-30 tech-debt-batch-0430c에서 `loadingPosition="replace"` 패턴으로 수정 완료. 트리거: settings UX 개선 sprint.

### 2026-04-30 verify-implementation (tech-debt-batch-0429) 후속 — 세션 외 파일 발견

- [x] **[2026-04-30 verify-impl-post-batch] 🟡 MEDIUM reason-field-trim-missing-3-dto** — ✅ 2026-04-30 완료 (tech-debt-batch-0430 session wrapup). 3개 DTO 모두 `z.string().trim().min(1, ...)` 패턴으로 수정: reject-return.dto.ts:16, reject-checkout.dto.ts:16, borrower-reject-checkout.dto.ts:16.
- [x] **[2026-04-30 verify-impl-post-batch] 🟢 LOW manual-entry-fallback-react-form-event** — ✅ 2026-04-30 완료 (tech-debt-batch-0430 session wrapup). `ManualEntryFallback.tsx:46` `React.FormEvent<HTMLFormElement>` → `React.SyntheticEvent<HTMLFormElement>` 교체 (React 19 deprecated 해소).

### 2026-04-30 sv-system-wide-completion SHOULD 후속

- [ ] **[2026-04-30 sv-system-wide] 🟢 LOW sv-playwright-browser-approve-dialog-verification** — approveDialog / qualityApproveDialog 렌더링 + 코멘트 입력 → 승인 흐름을 브라우저 레벨에서 미검증. 현재는 unit/integration spec으로만 커버. 트리거: `/software/[id]/validation` 라우트 UI 수정 시 또는 다음 playwright-e2e sprint.

### 2026-04-30 tech-debt-batch-0430c SHOULD 이연 항목

- [ ] **[2026-04-30 batch-0430c B3.5] 🟢 LOW mobilenav-list-semantics** — `apps/frontend/components/layout/MobileNav.tsx` nav item 컨테이너가 `<div>` + `<NavRowWithSecondaryAction>` 나열. `DashboardShell.tsx`는 `<ul role="list">` + `<li>` 구조로 수정됐으나 MobileNav는 미수정. Safari VoiceOver는 `list-style: none` 시 list semantics 제거 → `role="list"` 명시 필요. 수정 범위: MobileNav의 section items map을 `<ul className="... list-none" role="list"><li key={item.href}>...</li></ul>`로 변환 (DashboardShell.tsx:271-283 패턴 동일 적용). 트리거: 모바일 접근성 sprint 또는 MobileNav 수정 PR.
- [ ] **[2026-04-30 batch-0430c B6] 🟢 LOW stepper-start-node-label-token** — `APPROVAL_STEPPER_TOKENS`에 `startNodeLabel` 토큰 미정의. ApprovalStepIndicator의 시작 노드(첫 번째 원)에 SR 전용 레이블(`aria-label`) 부재. 현재 각 step의 `label` 텍스트만 존재하나 시작점 자체에 대한 문맥 정보 없음. `startNodeLabel: { srOnly: 'sr-only text-[0px]' }` 토큰 + `aria-label={t('stepper.start')}` 적용 검토. 파일: `apps/frontend/lib/design-tokens/components/approval.ts`, `apps/frontend/components/approvals/ApprovalStepIndicator.tsx`. 트리거: SR 접근성 audit 또는 Stepper UX 세밀화 Sprint 시.
- [ ] **[2026-04-30 batch-0430c B7.1] 🟢 LOW verify-implementation-spec-helper-return-type** — `verify-implementation` SKILL.md에 spec 파일 내 helper function return type 누락 탐지 grep step 미존재. `makeMock*`, `setup*`, `create*` 패턴 helper가 return type 없으면 `@typescript-eslint/explicit-function-return-type` 에러 발생 → lint 실패 벡터. SKILL.md Step 신설 권고: `grep -rn "^function\s\+make\|^function\s\+setup\|^function\s\+create" --include="*.spec.ts" | grep -v ": "`. 참고: `dashboard.service.spec.ts:326` 및 `form-template.service.spec.ts` 동일 패턴 발견. 트리거: verify-implementation SKILL.md 다음 개정 시.
