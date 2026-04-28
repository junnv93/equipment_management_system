# Tech Debt Tracker

harness 세션에서 이연된 SHOULD 실패·후속 작업을 누적 관리한다.
완료 항목은 `tech-debt-tracker-archive.md`로 이동.

## Open

### 2026-04-30 deps-supply-chain-hardening review-architecture 권고 (ATTENTION → PASS 격상 조건)

- [x] **[2026-04-30 deps-supply-chain] 🔴 IMMEDIATE A3 ci-supply-chain-gate** — ✅ 2026-04-28 완료. `.github/workflows/supply-chain-gate.yml` 신설 (drift-check + dependabot-audit 2 jobs, `--ignore-scripts`로 preinstall 독립 검증).
- [x] **[2026-04-30 deps-supply-chain] 🔴 IMMEDIATE A1 mock-providers-identifier-helper** — ✅ 2026-04-28 완료. `createMockIdentifierService()` 헬퍼 추가, verify-ssot Step 44 검증 명령 6번에 mock 등록 grep 추가 + PASS/FAIL 항목 갱신.
- [x] **[2026-04-30 deps-supply-chain] 🔴 IMMEDIATE A5 identifier-policy-docs** — ✅ 2026-04-28 완료. `docs/references/identifier-policy.md` 63 lines (5 섹션: SSOT 진입점/4 헬퍼/트레이드오프/예외/추가 절차). skills-index.md 인덱스 추가.
- [x] **[2026-04-30 deps-supply-chain] 🔴 IMMEDIATE A6 eslint-no-restricted-imports-crypto** — ✅ 2026-04-28 완료. `apps/backend/.eslintrc.js`에 `no-restricted-imports.paths` (`node:crypto`/`crypto` randomUUID) + `no-restricted-syntax` (`MemberExpression[property.name='randomUUID']`) + identifier.service.ts overrides 추가. 부수: 3 파일을 named import (`createHash`/`randomBytes`)로 좁힘.

#### 후속 (본 세션 2026-04-28에서 발견)
- [ ] **[2026-04-28 supply-chain-gate-completion] 🟢 LOW eslint-require-alias-rename-gap** — ESLint `no-restricted-imports`는 ES module `import`만 검사. `const { randomUUID: rid } = require('node:crypto')` + `rid()` alias 패턴은 미차단. TypeScript ESM 코드베이스에서 require 사용 패턴 드물어 실질 위험 낮음. 트리거: backend에 처음 require() 사용처 등장 시.
- [x] **[2026-04-28 supply-chain-gate-completion] 🟢 LOW main-residual-lint-errors** — ✅ 2026-04-28 완료 (system-wide-completion sprint Phase C1). pre-push hook에 `pnpm --filter backend run lint:ci` + `pnpm --filter frontend run lint` 추가하여 회귀 차단 게이트 보강. 부수: 본 sprint 동안 frontend `RouteLoading` deprecated 9건 일괄 SSOT 마이그레이션(`@/components/layout/RouteLoading` → `@/components/loading`) + `variant="table"` 4건 → `"list"` SSOT 정합화 + `showHeader` prop 4건 제거 (SSOT 미지원). frontend lint warnings 2건(LegacyServiceWorkerCleanup unused eslint-disable)은 warning이라 차단 안 됨 — 별도 sprint 처리 가능.
- [ ] **[2026-04-30 deps-supply-chain] 🟡 MEDIUM A4 dependabot-yml-policy** — `.github/dependabot.yml`에 caret 잠금 정책과 충돌 방지 룰 (semver-major ignore 또는 versioning-strategy 명시). 트리거: dependabot 첫 PR이 preinstall guard에 의해 install 실패하는 시점 (조기 등재로 잊힘 방지).
- [ ] **[2026-04-30 deps-supply-chain] 🟡 MEDIUM file-upload-form-template-spec-신설** — `file-upload.service.spec.ts` + `form-template.service.spec.ts` 부재 (기존 tech-debt). IdentifierService 도입 계기로 spec 신설 자연스러운 시점. file-upload는 보안·magic-bytes·SHA-256 critical path. 트리거: 다음 critical path 변경 PR.
- [ ] **[2026-04-30 deps-supply-chain] 🟢 LOW identifier-negative-test** — `randomUUID` mock 실패 시뮬레이션 1 케이스 spec 추가. 트리거: identifier.service 변경 PR.
- [ ] **[2026-04-30 deps-supply-chain] 🟢 LOW frontend-id-helper-격상** — frontend가 client-side 도메인 id 생성하는 첫 호출처 등장 시 `packages/shared-constants` 또는 `apps/frontend/lib/identifiers/`로 격상. 트리거: frontend 첫 호출처 (드래그-드롭 reorder key 등).
- [ ] **[2026-04-30 deps-supply-chain] 🟢 LOW bundle-size-baseline** — `pnpm measure:bundle` baseline 갱신. 본 세션은 backend-only 변경이라 frontend 영향 0이지만 frontend가 IdentifierService 격상된 SSOT를 import하는 시점 측정 권장.

#### review-architecture skill 권고 (2026-04-28 통합 review)
- [ ] **[2026-04-28 review-arch] 🟡 MEDIUM dev-doctor-hint-line-mode** — `.claude/settings.json` SessionStart hook의 `node -e '...JSON 파싱 35자...'` 인라인 JS 파서가 `dev-doctor.mjs` SSOT 외부에 존재. 스크립트 파편화 — doctor 변경 시 hook 파서도 동기 갱신 필요. 처리: `dev-doctor.mjs`에 `--hint-line` CLI mode 추가(JSON 출력을 doctor 자체에서 1줄 hint로 가공) → hook은 `node scripts/dev-doctor.mjs --hint-line` 단순 호출만. 트리거: dev-doctor 출력 형식 변경 PR 또는 hook 정합화 sprint.
- [ ] **[2026-04-28 review-arch] 🟡 MEDIUM checkout-selectability-physical-ssot** — `apps/backend/src/modules/checkouts/checkouts.service.ts:1535-1551` OWN_TEAM_ONLY/OTHER_TEAM_ONLY 가드가 `getAvailablePurposes` SSOT 헬퍼를 import하지 않고 inline `===` 비교 사용. JSDoc `@see`로 논리적 동기는 있으나 *물리적 SSOT* 미달 — 미래 룰 변경 PR이 frontend SSOT만 갱신하고 backend inline은 누락할 risk. 처리: `import { getAvailablePurposes, isPurposeCompatibleWithEquipment } from '@equipment-management/shared-constants'` 후 `if (!isPurposeCompatibleWithEquipment(purposeVal, equip.teamId, userTeamId)) throw ...` 1-line 수렴. 트리거: 다음 selectability 룰 변경 PR 또는 SSOT 통일 sprint.

### 2026-04-28 checkouts-phase4-kpi-hierarchy SHOULD 이연 항목

- [ ] **[2026-04-28 checkouts-phase4] 🟡 MEDIUM dashboard-pending-approval-card-alert-ring-token** — `apps/frontend/components/dashboard/PendingApprovalCard.tsx:463,541` 두 곳에서 raw `'ring-1 ring-brand-critical/20'` 직접 className. Phase 4에서 checkouts hero alertRing은 `CHECKOUT_STATS_VARIANTS.hero.alertRing` 토큰으로 통일했으나 dashboard 도메인은 별도 처리 필요. `DASHBOARD_ALERT_RING_TOKENS` 신설(또는 Layer 2 semantic으로 일반화)하여 토큰화. 트리거: dashboard alert 강조 토큰 정합화 PR.
- [ ] **[2026-04-28 checkouts-phase4] 🟢 LOW heroKPI-atom-react-memo** — `apps/frontend/components/checkouts/HeroKPI.tsx`에 React.memo 미적용. host에서 useCallback referential stability를 부여했으므로 atom memo 적용 시 이득 큼. atom signature 변경 0이지만 export 형식 변경(memo wrap)이 별도 PR 권장. 트리거: HeroKPI atom signature 변경 PR.
- [ ] **[2026-04-28 checkouts-phase4] 🟢 LOW phase-4-5-checkout-summary-extension** — backend `CheckoutSummary`에 `avgDelayDays`, `maxOverdueDays` 추가 → wireframe hero kpi-meta ("평균 지연 2.3일 · 최장 D+8") UI 표시. 트리거: backend 확장 + frontend kpi-meta 슬롯 추가.
- [ ] **[2026-04-28 checkouts-phase4] 🟢 LOW phase-4-6-sparkline-trend-api** — `SparklineMini` 현재 `[]` placeholder. trend timeseries API 신설 + 실제 데이터 연결 + trend prop 동적 derive. 트리거: 시계열 백엔드 신설 PR.
- [ ] **[2026-04-28 checkouts-phase4] 🟢 LOW phase-5-pending-hero-priority** — `selectHeroVariant`에 pending threshold 우선순위 추가 (overdue==0 && pending>10 → 'pending'). `HERO_PRIORITY` 배열에 rule 추가 + negative test 5번 갱신. 트리거: Phase 5 (P1-2 알림 단일 노출)와 함께 결정.

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
- [ ] **[2026-04-27 approvals-ui-r2] 🟡 MEDIUM approvals-api-module-split** — `approvals-api.ts` 1401줄 → 카테고리별 sub-module 분리. 예: `approvals-equipment-api.ts`, `approvals-calibration-api.ts`. 트리거: 파일 크기가 개발 마찰의 원인이 될 때.
- [ ] **[2026-04-27 approvals-ui-r2] 🟡 MEDIUM role-approval-categories-db-backed** — `ROLE_APPROVAL_CATEGORIES` 현재 코드 상수. DB-backed 설정으로 전환 시 운영 유연성 확보. 트리거: 역할별 카테고리 변경 주기가 배포 주기보다 빨라질 때.
- [ ] **[2026-04-27 approvals-ui-r2] 🟡 MEDIUM bulk-approve-rate-limit** — 일괄 승인 시 N개 동시 API 호출. Rate-limit 또는 배치 API 엔드포인트 검토. 트리거: 선택 건수 > 20건 UX 이슈 발생 시.
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW approval-vocabulary-unification** — `approval-constants.ts` ↔ `approvals-api.ts` vocabulary 분산 (pending_approval vs pending 등). AR-2 잔여. 트리거: 승인 도메인 대규모 리팩토링 시.
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW approval-audit-timeline-ui** — backend 감사 로그 존재하나 UI 타임라인 미구현. 트리거: 승인 이력 조회 요구사항 발생 시.
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW mobile-detail-modal-fullscreen** — 모바일에서 ApprovalDetailModal이 full-screen 미지원. 트리거: 모바일 실기기 테스트 시.
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW reject-reason-template-quickselect** — 자주 쓰는 반려 사유 quick-select 기능. 현재 5개 템플릿 하드코딩. DB-backed 템플릿 관리 검토. 트리거: 운영팀 피드백 시.
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW approval-delegation-workflow** — 위임 워크플로우 미구현. 장기 부재자 승인 위임. 트리거: 위임 요구사항 발생 시.
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW approval-analytics-dashboard** — 월별 처리량/평균 처리시간 대시보드 미구현. 트리거: 관리자 리포팅 요구사항 발생 시.

### 2026-04-27 harness: Sprint 4.1+4.2 NextStepPanel+Row3Zone SHOULD 이연 항목

- [ ] **[2026-04-27 sprint-4.2] 🟢 LOW overflow-action-type-ssot** — `OverflowAction` 인터페이스가 `components/shared/NextStepPanel.tsx` 로컬 정의. 두 번째 사용처 등장 시 `lib/types/checkout-ui.ts`로 승격 검토.
- [ ] **[2026-04-27 sprint-4.2] 🟢 LOW zone2-status-text-truncate** — Zone 2(72px) Badge 내부 긴 상태값 truncate 처리 없음. 영어 locale overflow 가능. 트리거: i18n 검토 시.
- [ ] **[2026-04-27 sprint-4.2] 🟢 LOW row-mobile-stacking** — Zone 4 모바일(< sm) overflow 가능. sm:hidden/flex 패턴으로 스택 레이아웃 검토 필요. 트리거: 모바일 실기기 테스트 시.

### 2026-04-26 harness: Sprint 3.1~3.2 BFF + queryKeys 계층 SHOULD 후속

- [ ] **[2026-04-26 sprint-3.1] 🟡 MEDIUM inbound-bff-flag-removal** — `isInboundBffEnabled()` canary flag가 `NEXT_PUBLIC_CHECKOUT_INBOUND_BFF === 'true'`로 조건. 기본값 false(S5). BFF 안정화 후 flag 제거 + legacy 3-useQuery 경로 코드 삭제 필요. `InboundCheckoutsTab.tsx` enabled 분기 + `lib/features/checkout-flags.ts` 삭제. 트리거: BFF 1주 무결 후.
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
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW stepper-step-transition-animation** — ApprovalStepIndicator step transition 200ms ease 미적용. 현재 색상 전환 즉시. 트리거: 애니메이션 정책 일괄 적용 Sprint 시.


### 2026-04-28 dashboard-redesign-architectural SHOULD 이연 항목

- [ ] **[2026-04-28 dashboard-thresholds-ssot] 🟢 LOW system-health-queue-size-impl** — `apps/backend/src/modules/dashboard/dashboard.service.ts:getSystemHealth()`의 `queueSize`가 0 stub. BullMQ 또는 Redis 큐 도입 시 실측 연결 필요. 현재는 dbResponseMs/storagePct만 overallStatus 판정에 기여. 트리거: BullMQ/큐 인프라 도입 Sprint.
- [ ] **[2026-04-28 dashboard-thresholds-ssot] 🟢 LOW system-health-error-source-table** — `errorCount24h`가 audit_logs의 `reject`/`cancel` 비즈니스 거절을 proxy로 사용 중. 진정한 시스템 에러 카운트는 별도 `error_logs` 또는 `system_events` 테이블 + Sentry 통합 필요. 트리거: 운영 모니터링 정비 Sprint.
- [ ] **[2026-04-28 dashboard-thresholds-ssot] 🟢 LOW dashboard-storage-capacity-env** — `DASHBOARD_STORAGE_CAPACITY_BYTES` 기본 100 GiB. 운영 환경별 실제 디스크 capacity로 env 설정 필요 (Docker volume / K8s PV / 호스트 디스크). 트리거: 프로덕션 배포 시 env 설정 체크리스트.

### 2026-04-28 dashboard-redesign-residual SHOULD 이연 항목 (verify+review+manage-skills 통합)

- [ ] **[2026-04-28 dashboard-redesign] 🟢 LOW pre-existing-dday-deprecation** — `apps/frontend/components/checkouts/{CheckoutGroupCard,DdayBadge}.tsx` + `lib/design-tokens/components/{checkout,dday-colors}.ts`에서 `getDdayTier`/`DdayTier`/`DDAY_TIER_CLASSES`/`DDAY_TIER_ICON_KEY`/`getDdayBadgeClasses`/`getDdayIconKey` deprecated 사용 13건. 이번 세션과 무관한 pre-existing 위반(HEAD에서도 동일 발생). REVIEW §4.3 4-tier 시스템(`getCheckoutDday4Tier`/`CheckoutDdayTier`/`DDAY_4TIER_*` shared-constants)으로 마이그레이션 필요. 트리거: checkouts D-day 시스템 마이그레이션 Sprint.
- [ ] **[2026-04-28 dashboard-redesign] 🟢 LOW dashboard-controller-zod-scope-validation** — `apps/backend/src/modules/dashboard/dashboard.controller.ts:getCheckoutsByScope`의 `scope` 쿼리 파라미터에 Zod enum 검증 미적용. 현재는 TypeScript 타입에만 의존 → 잘못된 값 전달 시 런타임 분기 누락 가능성. `ZodValidationPipe`로 enum 검증 추가 필요. 트리거: 백엔드 입력 검증 강화 Sprint.
- [ ] **[2026-04-28 dashboard-redesign] 🟢 LOW dashboard-controller-process-env-direct** — `dashboard.service.ts:getSystemHealth`의 `process.env.DASHBOARD_STORAGE_CAPACITY_BYTES` 직접 접근. NestJS `ConfigService` 경유 권장 (테스트 시 mockable + 검증 가능). 트리거: env 관리 정비 Sprint.
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

- [ ] **[2026-04-28 phase-e-residual] 🟡 MEDIUM bundle-baseline-script-nextjs16-migration** — `scripts/check-bundle-size.mjs`의 build output 파싱 정규식이 Next.js 13/14 형식(`│ ○ /login 5.23 kB 95.4 kB`)을 가정. Next.js 16 PPR(Partial Prerender) 모드는 라우트 트리만 출력하고 size/First Load JS 컬럼 미표시. script 마이그레이션 필요 — webpack-bundle-analyzer JSON 출력 또는 `next build --stats-json` 옵션 검토. 본 세션 AP-08 미완료 원인. 트리거: bundle 모니터링 sprint.
- [ ] **[2026-04-28 phase-e-residual] 🟢 LOW simulate-role-audit-log-observability** — SYSTEM_ADMIN의 `?simulateRole=` 사용 시 audit_logs entry 미발행. 누가 어떤 역할 시뮬했는지 추적 불가. `useEffectiveRole`에서 시뮬 활성 1회 audit log 호출 검토. 트리거: 보안/관측 강화 sprint.
- [ ] **[2026-04-28 phase-e-residual] 🟢 LOW standalone-html-1to1-matching** — REVIEW_RESULT.md ⚠️ 5항목 (§3.1 EQ 마크 / §3.7 items-stretch / §3.10 debug widget / §A.3.1 미니캘린더 / §A.9.1 skip nav) — Playwright baseline 캡처 + 시각 검수로 1:1 매칭 검증 필요. 트리거: 다음 디자인 QA sprint.
- [ ] **[2026-04-28 phase-e-residual] 🟢 LOW frontend-test-final-run** — `pnpm --filter frontend test` 본 세션에서 미실행 (시간 제약). 다음 세션에서 실측. 트리거: 다음 commit 전.
- [ ] **[2026-04-28 phase-e-residual] 🟢 LOW playwright-dashboard-screenshots-baseline** — `dashboard-screenshots.spec.ts` 본 세션에서 helper 추가 + dark/axe scan 보강만 완료. 실제 5 role × 1440 light/dark 30 PNG 캡처는 미실행 (storage state + dev 서버 의존). 트리거: 다음 디자인 QA sprint.

### 2026-04-28 i18n-parity-hardening SHOULD 후속 (미완료)

- [x] **[2026-04-28 i18n-parity-hardening] 🟡 MEDIUM lib-i18n-client-singular-deprecation** — `apps/frontend/lib/i18n/client.ts` 파일 삭제 완료 (0 callers, 단수형 `useTranslation` 래퍼는 dead code였음. 미래 silent-swallow 회귀 벡터 제거). next-intl 표준 `useTranslations` (복수형) 직접 사용으로 통일. (완료 2026-04-28 gap-fix-iter)
- [x] **[2026-04-28 i18n-parity-hardening] 🟢 LOW shadowed-binding-eslint-rule** — NonConformanceBanner.tsx의 `t` 변수 분리 완료 (`tNc` for non-conformances ns + `tBanner` for equipment.nonConformanceBanner ns). 정적 검증 shadowed 0건 달성. (완료 2026-04-28 gap-fix-iter)
- [x] **[2026-04-28 i18n-parity-hardening] 🟢 LOW eslint-no-atom-i18n-rule** — ESLint 룰 대신 더 정확한 게이트 채택: `scripts/check-i18n-call-sites.mjs`에 `common.json` 구조 검증 추가 — root level은 sub-namespace(object)만 허용, flat string/array 추가 시 exit 1. 정밀 분석 결과 atom-owned sub-namespace(예: `common.fileUpload.*`)는 안전한 캡슐화이므로 일률적 금지는 false positive 9건 발생. 회귀 메커니즘(flat top-level key 추가)을 *구조적으로* 차단하는 것이 ROI 높음. frontend-patterns.md 정책 정밀화 동시 완료. (완료 2026-04-28 gap-fix-iter)
- [x] **[2026-04-28 i18n-parity-hardening] 🟢 LOW e2e-no-missing-message-spec** — `tests/e2e/features/i18n/no-missing-message.spec.ts` 작성 완료. 시드 UUID 회피 위해 system-wide list 라우트(`/checkouts`, `/equipment`, `/non-conformances`) 3개 사용. console.error MISSING_MESSAGE 패턴 + body raw key 노출 0건 검증. (완료 2026-04-28 gap-fix-iter)
- [ ] **[2026-04-28 i18n-parity-hardening] 🟡 MEDIUM cross-cutting-ns-structural-check** — review-architecture 발견: `check-i18n-call-sites.mjs`의 structural check가 `common.json`만 대상으로 함. `navigation.json` (60+ flat key 추정) / `notifications.json` (3 flat key 추정) / `errors.json` / `auth.json` 같은 다른 cross-cutting ns는 정책 미정의. 정책 결정 필요: (a) common.json만 sub-namespace 강제, 다른 cross-cutting은 flat 허용 (현재 묵시적 정책) 명문화 (b) 모든 cross-cutting ns에 동일 정책 확장. 트리거: 다른 cross-cutting ns 회귀 발생 시 또는 i18n 정책 통일 sprint.
- [ ] **[2026-04-28 i18n-parity-hardening] 🟢 LOW frontend-patterns-shared-exception-text-precision** — review-architecture 발견: `frontend-patterns.md:228` "shared에 있을 때는 props으로 끌어올리는 것이 일관적이다"가 실제 정책(직접 호출 허용 예외)과 텍스트 모순. 예외 정책의 권장사항 명확화 필요 — "허용하되 가능하면 이동" vs "이동 권장" 결정. 트리거: 다음 atom 위치 결정 PR 또는 정책 통일 sprint.
- [ ] **[2026-04-28 i18n-parity-hardening] 🟢 LOW i18n-namespaces-array-comment-lag** — `apps/frontend/i18n.ts:31`의 "Phase 0 ~ Phase 1+" 주석이 namespaces 배열 실측과 lag. namespace 추가/제거 시 주석 갱신 누락 위험. 주석 단순화 또는 제거 검토. 트리거: 다음 i18n 변경 시.

### 2026-04-28 supply-chain-gate-completion 부수 발견 — 사전 lint 회귀 청소

- [x] **[2026-04-28 software-validations] 🔴 IMMEDIATE software-validation-approve-comment-silent-loss** — ✅ 2026-04-28 완료 (harness Mode 2 — `software-validation-approve-comment`). 도메인 결정 (c) **컬럼 + audit_logs 이중 안전망** 적용: `software_validations.approval_comment text` 컬럼 신설(disposal/calibration-plans 동일 SSOT 답습) + service `approve()` underscore prefix 제거 + `approvalComment: approvalComment || null` persist. Audit 측은 `audit.interceptor.ts:287-291`이 `@AuditLog` 데코레이터 적용 핸들러의 `request.body`를 자동 기록 중이므로 service 추가 호출 없음(SRP/중복 회피). 4 spec 케이스(persist/undefined→null/empty→null/regression guard) + Migration `0048_add_software_validation_approval_comment.sql` + rollback SQL + 무손실 회귀 안전망(audit_logs에서 코멘트 복원 가능). drizzle journal/snapshot은 TTY 제약으로 hand-written SQL만 1차 진행 (S5 SHOULD: 사용자 TTY 환경에서 `db:generate` 별도 실행 필요).
- [ ] **[2026-04-28 software-validation-comment] 🟢 LOW service-param-underscore-prefix-static-check** — Service 메서드 파라미터 underscore prefix(`_paramName`) 패턴이 의도된 unused인지 silent loss인지 정적 구분 불가. ESLint 룰은 false positive 다수(데코레이터 metadata-only 파라미터, 인터페이스 구현용 unused 등) → 채택 안 함(Phase 5 결정). 회귀 1차 방어: spec 커버리지(persist + regression guard 케이스). 2차 방어: verify-implementation 스킬에 underscore-prefixed parameter grep 룰 추가 권고(개별 review 절차로). 트리거: 다른 도메인에서 동일 silent loss 발견 시 또는 verify-implementation 스킬 검증 강화 sprint.
- [ ] **[2026-04-28 software-validation-comment] 🟢 LOW frontend-approval-comment-input-ui-audit** — Backend는 fix 완료지만 controller가 이미 `dto.approvalComment`를 받는다는 사실은 어떤 클라이언트 경로가 이미 전송 중임을 시사. Frontend ApprovalCommentField 입력 컴포넌트 존재 여부 + `apps/frontend/lib/api/software-validations-api.ts` payload에 `approvalComment` 포함 여부 audit 필요. UI 미구현 시 별도 frontend plan으로 분리. 트리거: 다음 frontend software-validations 도메인 작업 시.
- [ ] **[2026-04-28 software-validation-comment] 🟢 LOW quality-approve-comment-policy** — `qualityApprove()` 메서드 시그니처에 코멘트 파라미터 자체가 없음. 품질책임자 승인 시 검토 의견 기록 정책 미정의. ISO/IEC 17025 §6.2.2 관점에서 "이중 승인 trail 일관성" 위해 `qualityApproveComment` 필드 도입 검토 필요. 트리거: 도메인 정책 결정 sprint.
- [ ] **[2026-04-28 dashboard-spec] 🟢 LOW dashboard-spec-helper-return-type-policy** — `apps/backend/src/modules/dashboard/__tests__/dashboard.service.spec.ts:326` `setupHealthMocks` helper에 return type `: void` 명시로 lint 통과. 정책 점검: spec 파일에서 helper function의 explicit-function-return-type 강제 적절성 — 현재 ESLint override는 `no-restricted-syntax`만 끔. spec helper는 추론으로 충분한 경우가 많아 spec 디렉토리에서 본 룰 완화 검토 가능. 트리거: ESLint config 정책 통일 sprint.
- [ ] **[2026-04-28 supply-chain-gate-completion] 🟢 LOW eslint-require-alias-rename-gap** — A6 ESLint 룰(`no-restricted-imports` + `MemberExpression[property.name='randomUUID']`)이 ES module `import` 구문과 직접 member call만 차단. 우회 경로 미차단: `const { randomUUID: rid } = require('node:crypto'); rid()` (CommonJS require + alias rename). 실질 위험 낮음 (TS sourceType: 'module', `tsconfig.json`이 `import` 강제, project lint 시 require 호출 0건 실측). 그러나 contract A6가 명시적으로 "alias rename 우회 패턴 차단" 목표 → 완전성 미달. 처리 옵션: (a) `no-restricted-syntax`에 `CallExpression[callee.name='require'][arguments.0.value='node:crypto']` 패턴 추가 (b) custom AST rule로 `require()` 결과의 destructure-rename + 후속 호출 추적. 트리거: TS→JS 부분 마이그 또는 require() 패턴 발견 시.

### 2026-04-28 sidebar-nav-action-pattern SHOULD 후속 (미완료)

- [ ] **[2026-04-28 sidebar-nav-action-pattern] 🟢 LOW resolve-badge-and-action-exhaustive-kind-check** — `apps/frontend/lib/navigation/nav-config.ts` `resolveBadgeAndAction` 함수가 `if (cfg.kind === 'count-with-action')` 분기 후 `'count'` case는 implicit fall-through. 미래 `NavItemBadgeConfig`에 세 번째 `kind`가 추가되면 TypeScript가 누락 분기를 잡지 못함. `switch (cfg.kind)` + `assertNever` 패턴으로 교체하면 컴파일 타임 exhaustiveness 보장. 트리거: 세 번째 `kind` 추가 또는 다음 nav 도메인 확장.
- [ ] **[2026-04-28 sidebar-nav-action-pattern] 🟢 LOW filtered-nav-secondary-action-aria-key-literal-union** — `FilteredNavSecondaryAction.ariaKey` / `primaryAriaKey`가 `string` 타입. 오타 시 next-intl 런타임 throw. i18n 키 리터럴 유니언으로 좁히면 컴파일 타임 검증. 단, 키 추가 시마다 타입 갱신 필요라 trade-off 존재. 트리거: i18n 키 도메인 SSOT sprint 또는 nav 도메인 키 폭주 시.
- [ ] **[2026-04-28 sidebar-nav-action-pattern] 🟢 LOW sidebar-row-container-li-semantics** — exec-plan 아키텍처 결정은 `<li>` 컨테이너였으나 구현은 `<div>`. 부모도 `<ul>`이 아닌 `<div>`이라 자기 일관성은 유지되나 nav landmark 안에서 `<ul><li>` 시맨틱이 더 정확. 모든 nav item을 `<ul><li>`로 일괄 재구성하면 SR이 "list with N items" 안내 추가. 트리거: 사이드바 nav 시맨틱 강화 sprint 또는 a11y 회귀 발견 시.
- [ ] **[2026-04-28 sidebar-nav-action-pattern] 🟡 MEDIUM sidebar-nav-action-e2e-manual-verify** — Playwright `tests/e2e/features/layout/sidebar-nav-action.spec.ts` BLOCKED-ENV (contract M4/M5). dev server + storageState로 수동 검증 후 결과 기록 필요. 검증 항목: (1) 콘솔 hydration 에러 0건 (2) DOM `a > a` 0건 (3) Tab 순서 메인 → 보조. 시드에 yourTurn ≥1 케이스 보장 필요. 트리거: 다음 commit 직전 또는 `/checkouts` 라우트 수정 시.
