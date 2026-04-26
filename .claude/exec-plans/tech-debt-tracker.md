# Tech Debt Tracker

harness 세션에서 이연된 SHOULD 실패·후속 작업을 누적 관리한다.
완료 항목은 `tech-debt-tracker-archive.md`로 이동.

## Open

### 2026-04-26 harness: Sprint 3.1~3.2 BFF + queryKeys 계층 SHOULD 후속

- [ ] **[2026-04-26 sprint-3.1] 🟡 MEDIUM inbound-bff-flag-removal** — `isInboundBffEnabled()` canary flag가 `NEXT_PUBLIC_CHECKOUT_INBOUND_BFF === 'true'`로 조건. 기본값 false(S5). BFF 안정화 후 flag 제거 + legacy 3-useQuery 경로 코드 삭제 필요. `InboundCheckoutsTab.tsx` enabled 분기 + `lib/features/checkout-flags.ts` 삭제. 트리거: BFF 1주 무결 후.
- [ ] **[2026-04-26 sprint-3.1] 🟢 LOW inbound-overview-module-boundary** — `checkoutsService.getInboundOverview()`가 `RentalImportsService`를 직접 주입. 향후 반입 도메인이 별도 모듈로 분리될 경우 circular dependency 가능. BFF Gateway 패턴(독립 BFF 모듈) 검토 필요(S6). 트리거: 반입 도메인 대규모 리팩토링 시.
- [ ] **[2026-04-26 sprint-3.2] 🟢 LOW canonical-filter-sort-helper** — `InboundCheckoutsTab.tsx`의 검색/필터 파라미터 빌드가 탭 컴포넌트 내부에서 인라인. `buildInboundOverviewQuery(filters)` 헬퍼로 추출하면 BFF + legacy 경로 모두 동일 파라미터 빌드를 보장(S2). 트리거: InboundCheckoutsTab 리팩토링 시.

### 2026-04-26 harness: manage-skills 신규 탐지

- [ ] **[2026-04-26 manage-skills] 🟡 MEDIUM bulk-action-bar-subpath-import** — `components/common/BulkActionBar.tsx:6` `@/lib/design-tokens/components/bulk-action-bar` 직접 서브패스 import. verify-design-tokens Step 3 강화(2026-04-26)에서 신규 탐지. `index.ts`에 `BULK_ACTION_BAR_TOKENS` barrel re-export 추가 + BulkActionBar import 수정 필요. 트리거: BulkActionBar 작업 시.

### 2026-04-26 harness: NC Round-2 (R1a~R5) SHOULD 이연 항목

- [ ] **[2026-04-26 nc-r3] 🟢 LOW list-chip-arrow-i18n** — `NonConformancesContent.tsx` chip `→` 화살표를 `aria-hidden` span으로 처리. S1 조건 `nonConformances.list.chip.arrow` i18n 키화 미완. 현재 기능 무결; 트리거: NC i18n 정리 세션.
- [ ] **[2026-04-26 nc-r4] 🟢 LOW nclistrow-mini-workflow-sr-only** — `NCListRow`의 `MiniWorkflow` aria-hidden dot strip에 sr-only 현재 단계 텍스트 없음(S2). GuidanceCallout 내부는 완료, 리스트 행 쪽 미처리. 트리거: NC 접근성 작업 시.
- [ ] **[2026-04-26 nc-r5] 🟢 LOW rejection-reason-max-length** — `rejectionReason` 최대 길이 제한 미정의 (R5 Non-Goal). `z.string().trim().min(1).max(?)` 추가 시 도메인 정의 필요. 트리거: NC 도메인 규격 확정 후.
- [ ] **[2026-04-26 nc-r1a] 🟢 LOW openBlockedRepair-quality-manager-i18n** — `openBlockedRepair_quality_manager` guidance 케이스 (operator guidance 사용 중) — quality_manager 역할이 openBlockedRepair 상태일 때 role-aware 메시지 부재. 트리거: quality_manager 역할 실제 배포 시.
- [ ] **[2026-04-26 nc-verify] 🟢 LOW visualTableEditor-focus-ring** — `components/inspections/result-sections/VisualTableEditor.tsx:184` `focus:ring-2 focus:ring-ring` — inspections 도메인 pre-existing. `focus-visible:ring-2` 로 교체 필요. 트리거: inspections 컴포넌트 접근성 작업 시.

### 2026-04-26 harness: Sprint 2.4 tab-badge alert variant SHOULD 후속

- [ ] **[2026-04-26 sprint-2.4] 🟢 LOW tab-badge-base-absorb-layout** — `CHECKOUT_TAB_BADGE_TOKENS.base`에 `inline-flex items-center justify-center`가 미흡수. `CheckoutsContent.tsx` 호출부가 레이아웃 클래스를 별도로 전달. base에 흡수 시 `ml-1` → `ml-1.5`로 기본값 조정 필요(기존 탭 배지에 4px margin 영향). 트리거: Sprint 2.5~2.7 토큰 작업 시 일괄 처리.
- [ ] **[2026-04-26 sprint-2.4] 🟢 LOW en-overdueclear-translation-spec** — `en/checkouts.json` `emptyState.overdueClear.title` = `"No Overdue Checkouts"` (현재) vs 컨트랙트 스펙 `"No overdue items"`. 대소문자·의미 불일치. Sprint 2.3 구현 당시 의도적으로 다른 프레이밍 선택. 사용자 확인 후 보정 또는 컨트랙트 업데이트 필요. 트리거: i18n 리뷰 세션.
- [ ] **[2026-04-26 sprint-2.4] 🟢 LOW checkout-group-card-purpose-cast** — `CheckoutGroupCard.tsx` L216 `(checkout.purpose ?? 'calibration') as 'calibration' | 'repair' | 'rental'` 리터럴 캐스트 잔존. SSOT 리팩터 커밋(74786210)에서 미처리. `UserSelectableCheckoutPurpose`로 교체 필요. 트리거: CheckoutGroupCard 작업 시.

### 2026-04-26 harness: Sprint 2.1·2.2 Row 토큰 누수 봉합 SHOULD 후속

- [ ] **[2026-04-26 sprint-2.1-2.2] 🟡 MEDIUM purpose-bar-return-to-vendor-color** — `CHECKOUT_ITEM_ROW_TOKENS.purposeBar.return_to_vendor` 현재 `bg-brand-neutral` 가안. 디자인 팀과 return_to_vendor 목적 색상 확정 후 수정 필요. 트리거: 디자인 리뷰 시 또는 return_to_vendor 반출 UI 실제 노출 전.
- [ ] **[2026-04-26 sprint-2.1-2.2] 🟢 LOW brand-info-font-medium-audit** — `CheckoutsContent`·`OutboundCheckoutsTab` 등 다른 컴포넌트에 raw `text-brand-info font-medium` 잔존 여부 전수 스캔 미완. `grep -rn "text-brand-info font-medium" apps/frontend/components/`로 탐지. 트리거: Sprint 2.4~2.7 Token Layer 봉합 작업 시.

### 2026-04-24 harness: WF-34 E2E + PR-13 YourTurnBadge 후속 (93차)

- [ ] **[2026-04-24 wf34-pr13] 🟢 LOW yourTurn.summary dead i18n key 정리** — `checkouts.json` ko/en 양쪽의 `yourTurn.summary` 키가 정의되어 있으나 현재 컴포넌트에서 미사용 (표시는 `count`, aria는 `summaryAria`). `CheckoutGroupCard`에서 `count` → `summary`로 교체하거나 `summary` 제거 후 계약 M-8을 `count`로 수정. 트리거: i18n 정리 또는 CheckoutGroupCard 작업 시.
- [ ] **[2026-04-24 wf34-pr13] 🟢 LOW borrowerApproveCheckout apiPatch 래퍼 미사용** — `workflow-helpers.ts` borrower 함수들이 `BACKEND_URL + path` 직접 조합. 기존 `apiGet`/`apiPatch` 래퍼 패턴과 불일치. E2E 전용이므로 기능 영향 없으나 패턴 일관성 위반. 트리거: workflow-helpers.ts 리팩토링 시.
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

### 2026-04-22 verify+review-architecture: approveReturn 패리티 후속

- [ ] **[2026-04-22 verify-fsm] 🟢 LOW reject-return 컨트롤러 guard ↔ FSM permission 동기화 주석 누락** — `checkouts.controller.ts` reject-return 엔드포인트의 `@RequirePermissions(Permission.REJECT_CHECKOUT)`이 FSM `reject_return` 액션 권한과 대응됨을 명시하는 주석 없음. 트리거: controller permission 관련 작업 시.

### 2026-04-22 harness: checkout-arch-pr3-11 SHOULD 후속

- [ ] **[2026-04-22 checkout-arch-pr3-11] 🟢 LOW blocked 버튼 focus-visible 누락** — `workflow-panel.ts:49-52` `WORKFLOW_PANEL_TOKENS.action.blocked`에 `FOCUS_TOKENS.classes.default` 없음. primary 버튼에는 존재. 접근성 키보드 네비게이션 시 blocked 버튼 포커스 표시 미흡. 트리거: workflow-panel 접근성 작업 시.

### 2026-04-22 harness: checkout-lender-guard-p1p3 후속 (verify + review 결과)
- [ ] **[2026-04-22 p1p3] 🟢 LOW RENTAL reject_return 설계 갭 — FSM 명시적 결정 필요** — FSM `reject_return` 전이가 `purposes: CAL_REPAIR`만 허용, RENTAL 제외. RENTAL 반납 검사 실패 시 반려 불가한 도메인 갭. 의도적 설계라면 FSM 주석 추가 권장; RENTAL 반납 반려가 필요하다면 FSM에 rental 추가 + rejectReturn LENDER_TEAM_ONLY 복구 필요. 트리거: 렌탈 워크플로우 설계 검토 시.

### 2026-04-22 harness: NC-P4 GuidanceCallout 후속

- [ ] **[2026-04-22 nc-p4-guidance] 🟢 LOW help.status.completed / help.status.return_rejected — CheckoutStatus enum 미포함 상태** — UI 표시 전용(GuidanceCallout 등)으로 허용했으나, 장기적으로 `help.status.ui.*` 별도 네임스페이스로 분리 권고. 파일: `apps/frontend/messages/ko/checkouts.json`, `apps/frontend/messages/en/checkouts.json`. 트리거: i18n 네임스페이스 정리 작업 시.

### 2026-04-22 harness: checkout-subtab-ia + checkout-subtab-ssot-fix 후속 (verify + review 결과)

- [ ] **[2026-04-22 subtab-ia] 🟢 LOW verify-i18n: guidance.urgency.normal 빈 문자열 (기존 파일)** — `checkouts.json` en/ko 양쪽 `guidance.urgency.normal` 빈 문자열. 런타임 호출 코드 없으나 키 채우거나 제거 필요. 트리거: GuidanceCallout urgency 기능 구현 시.

### 2026-04-24 harness: PR-3 Design Token Layer 2 후속 (verify + review 결과)

- [ ] **[2026-04-24 pr-3] 🟢 LOW EquipmentImportDetail.tsx role 리터럴 액션 게이트** — `EquipmentImportDetail.tsx:174-176` `userRole === URVal.TECHNICAL_MANAGER||LAB_MANAGER||SYSTEM_ADMIN` 패턴이 Permission 게이트 역할. `can(Permission.APPROVE_EQUIPMENT_IMPORT)` 패턴으로 교체 권장. 트리거: equipment-imports 권한 작업 시.
- [ ] **[2026-04-24 pr-3] 🟢 LOW NEXT_STEP_PANEL_TOKENS dead token** — `workflow-panel.ts:71` 정의되고 `index.ts` re-export되나 `NextStepPanel.tsx`에서 미사용. PR-4 NextStepPanel 리디자인 시 `WORKFLOW_PANEL_TOKENS` → `NEXT_STEP_PANEL_TOKENS` 전환 필요. 트리거: PR-4 구현 시.

### 2026-04-24 harness: PR-4·6·7·8 verify-implementation + review-architecture 후속 (86차)

- [ ] **[2026-04-24 pr4-7] 🟡 MEDIUM use-inbound-section-pagination.ts URLSearchParams 직접 조작** — `new URLSearchParams(searchParams.toString())` + `params.set` 패턴. `resetFilters` 시 섹션 페이지(`inboundPage/rentalPage/internalPage`) URL 잔존. `UICheckoutFilters`에 섹션 페이지 포함 또는 `filtersToSearchParams` 확장 + resetFilters에서 1로 초기화 필요. 트리거: 체크아웃 필터/페이지네이션 작업 시.
- [ ] **[2026-04-24 pr4-7] 🟢 LOW OutboundCheckoutsTab celebration EmptyState i18n 하드코딩** — `'기한 초과 없음'`, `'현재 기한이 초과된...'` 한국어 리터럴. `// TODO(PR-8)` 주석 존재. 트리거: PR-8 i18n 완성 시.

### 2026-04-24 harness: rental-phase5-8 review-architecture 후속

- [ ] **[2026-04-24 rental-phase9] 🟢 LOW rejectReturnMutation onErrorCallback returnRejectReason 미초기화** — `CheckoutDetailClient.tsx` `rejectReturnMutation.onErrorCallback`에서 `setReturnRejectReason('')` 미호출. onSuccessCallback에는 있으나 onError 경로에서는 이전 입력 잔존. borrowerRejectMutation 패턴과 비대칭. 트리거: dialog UX 일괄 패턴 정비 시.

### 2026-04-24 harness: rental-phase3-4 후속

- [ ] **[2026-04-24 rental-phase3-4] 🟡 MEDIUM borrowerApprove/borrowerReject 단위 테스트 4케이스** — `checkouts.service.spec.ts`에 describe 블록 없음. 테스트 케이스: (a) 정상 1차 승인, (b) 비-rental → BadRequestException(BORROWER_APPROVE_RENTAL_ONLY), (c) 스코프 외 사용자 → ForbiddenException, (d) req.user.teamId !== requester.teamId → ForbiddenException(BORROWER_TEAM_ONLY). 기존 mockReq fixture + mockDrizzle.limit(requester user) 패턴 활용. 트리거: checkouts.service.spec.ts 작업 시.

### 2026-04-24 harness: 86차 세션 verify-cache-events + verify-design-tokens 후속

- [ ] **[2026-04-24 86th-session] 🟡 MEDIUM SOFTWARE_VALIDATION_* 이벤트 5개 cache-event.registry.ts 미등록** — `NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_APPROVED/QUALITY_APPROVED/REJECTED/SUBMITTED`, `CACHE_EVENTS.TEST_SOFTWARE_REVALIDATION_REQUIRED` 총 5개가 서비스에서 `emitAsync`로 발행되나 `CACHE_INVALIDATION_REGISTRY`에 미등록. 기존 pre-existing 부채. 캐시 무효화 no-op → stale read 위험. 등록 시 `invalidateAllDashboard` + 관련 캐시 키 패턴 추가 필요. 트리거: software-validations 모듈 작업 시.
- [ ] **[2026-04-24 86th-session] 🟢 LOW verify-design-tokens NEXT_STEP_PANEL_TOKENS 명시적 검증 단계 미포함** — `.claude/skills/verify-design-tokens/SKILL.md`의 검증 워크플로우가 `NEXT_STEP_PANEL_TOKENS`를 사용하는 `NextStepPanel.tsx`의 token import 체인을 명시적으로 커버하지 않음. 기존 Step에 NEXT_STEP_PANEL_TOKENS 관련 grep 패턴 추가 권장. 트리거: verify-design-tokens 스킬 업데이트 시.

### 2026-04-24 harness: PR-14·15 verify + review-architecture 후속 (90차)

- [ ] **[2026-04-24 pr14-15] 🟡 MEDIUM pulseHard container-level scale animation UX 저하** — `workflow-panel.ts:94` critical urgency 컨테이너 전체에 `scale(1.04)` 포함 `animate-pulse-hard`. 내부 버튼 클릭 타겟 팽창·수축, 저사양 기기 repaint 비용. urgency dot 전용 분리 또는 `pulseSoft`(opacity only)로 교체 권장. 트리거: workflow-panel UX 작업 시.
- [ ] **[2026-04-24 pr14-15] 🟡 MEDIUM shared/ExportFormButton + PageHeader useAuth() 직접 호출** — `ExportFormButton.tsx:L7,54`, `PageHeader.tsx:L14,66` shared 컴포넌트에서 `useAuth()` 직접 호출. `canAct?: boolean` prop 수신 + Container에서 `can(Permission.X)` 호출 패턴으로 전환 필요. 트리거: shared 컴포넌트 리팩토링 시.
- [ ] **[2026-04-24 pr14-15] 🟢 LOW CHECKOUT_DISPLAY_STEPS 계층 위치 — 스타일 토큰에 도메인 데이터 혼재** — `checkout-timeline.ts`에 FSM display step 배열 위치. 장기적으로 `packages/schemas/src/checkout-display.ts`로 이전하여 `computeStepIndex` SSOT와 동일 패키지에 배치 권장. 트리거: schemas 패키지 정리 시.
- [ ] **[2026-04-24 pr14-15] 🟢 LOW CheckoutDetailClient date-fns format 직접 사용** — L820/827/837/844/932 총 5곳. `useDateFormatter().fmtDate` 전환 권장 (사용자 dateFormat 설정 반영). 트리거: 날짜 표시 일관성 작업 시.

### 2026-04-24 harness: PR-19 Loading Skeleton + Error Boundary 후속 (94차 verify + review-architecture)

- [ ] **[2026-04-24 pr-19] 🟢 LOW router.refresh() + invalidateKeys 이중 동기화** — `CheckoutDetailClient.tsx` 8개 mutation 전체 `onSuccessCallback: () => router.refresh()` + `invalidateKeys`. 서버 revalidation + TanStack 캐시 무효화 이중 갱신으로 불필요한 서버 요청 발생. 브레드크럼 등 Server Component 상태 동기화 목적이면 유지, 순수 데이터 목적이면 제거. 트리거: CheckoutDetailClient mutation onSuccess 리팩토링 시.
- [ ] **[2026-04-24 pr-19] 🟢 LOW CheckoutListSkeleton CHECKOUT_LOADING_SKELETON_TOKENS 미사용** — `CheckoutListSkeleton.tsx:4` shadcn `<Skeleton>` 직접 사용(`bg-primary/10`). 다른 스켈레톤(`HeroKPISkeleton` 등)의 `CHECKOUT_LOADING_SKELETON_TOKENS.base`(`bg-muted`)와 색상 불일치. 시각적 일관성 위반. 트리거: CheckoutListSkeleton 수정 시.

### 2026-04-24 harness: PR-17 Feature Flag 상시화 후속

- [ ] **[2026-04-24 pr-17] 🟢 LOW E2E global-setup trigger-overdue-check 역할 문서화** — `global-setup.ts:122` `technical_manager` 토큰 사용 이유가 코드 내 주석 외 문서에 미기록. `e2e-patterns.md`에 "global-setup에서 시스템 트리거 API는 UPDATE_EQUIPMENT 보유 역할(technical_manager) 사용" 가이드 추가 권장. 트리거: e2e-patterns.md 업데이트 시.

### 2026-04-24 harness: Sprint 1.2 NextStepDescriptor 확장 후속

- [ ] **[2026-04-24 sprint-1.2] 🟢 LOW computeStepIndex exhaustive satisfies 전환 미완** — `checkout-fsm.ts` `computeStepIndex` 내부에 Switch 분기가 있으나 `satisfies Record<CheckoutStatus, number>` 형태의 exhaustive 테이블 전환 comment 없음. Sprint 1.5에서 목적에 따라 exhaustive 전환 권고 (S3 실패). 트리거: Sprint 1.5 또는 FSM 대규모 리팩토링 시.
- [ ] **[2026-04-24 sprint-1.2] 🟢 LOW non-rental purpose phase 개념 확장 설계 미문서화** — `rental-phase.ts`에 calibration/repair 2-phase 가능성 논의용 comment 없음. 향후 non-rental 워크플로도 Phase 개념 도입 시 `getRentalPhase()`의 역할 재설계 필요 (S4 실패). 트리거: Sprint 4+ non-rental UI 세분화 논의 시.

### 2026-04-24 harness: Sprint 1.1 resolveNextAction 아키텍처 통일 후속 (90차)

- [ ] **[2026-04-24 sprint-1.1] 🟡 MEDIUM DESCRIPTOR_TABLE 재생성 스크립트 부재** — `packages/schemas/src/fsm/__tests__/fixtures/descriptor-table.ts` 현재 `getNextStep()` 런타임 동적 계산으로 구현 (자체 재생성). FSM 의도적 변경 시 `buildDescriptorTable()` 함수가 자동 반영되므로 당장 위험은 없으나, S2 tech-debt 계획: 독립 `gen:descriptor-table` 스크립트 추가로 정적 스냅샷 형태로 전환 권장 (명시적 diff visible). 트리거: Sprint 2 FSM 확장 또는 packages/schemas 빌드 파이프라인 정비 시.
- [ ] **[2026-04-24 sprint-1.1] 🟢 LOW checkout-fsm.test.ts 13건 기존 실패** — `packages/schemas/src/__tests__/checkout-fsm.test.ts` rental borrower_approved 단계 추가로 step index 7→8 드리프트. Sprint 1.1 범위 외(기존 실패, 회귀 아님). 트리거: FSM rental 단계 index 정비 Sprint (Sprint 1.x 또는 2.x) 착수 시.

### 2026-04-24 harness: Sprint 1.3 checkout-meta-fail-closed SHOULD 후속

- [ ] **[2026-04-24 sprint-1.3] 🟡 MEDIUM fsm-meta-drift-observability** — `warnMetaDrift()` 현재 dev console.warn만. Prod에서 Sentry breadcrumb + custom dashboard 계측 추가. `checkout-api.ts` → Sentry `addBreadcrumb({ category: 'fsm', message: 'meta missing', data: { id } })`. 트리거: Sentry SDK 도입 또는 observability 스프린트 시.
- [ ] **[2026-04-24 sprint-1.3] 🟢 LOW fail-closed-e2e-matrix-expansion** — `fail-closed.spec.ts` 현재 12건(4 role × 3 state). role 4 × status 5 = 20건으로 확장: lab_manager BORROWER_APPROVED 최종승인·LENDER_CHECKED 수령확인, technical_manager BORROWER_RETURNED 반입승인, admin OVERDUE 독촉, test_engineer cancel 버튼. 트리거: E2E 안정화 후 커버리지 확장 Sprint.
- [ ] **[2026-04-24 sprint-1.3] 🟢 LOW fsm-response-interceptor-guard** — 백엔드 NestJS interceptor에서 응답 직전 `meta` 완전성 검증. 누락 시 빈 meta 채워 500 방지 또는 경고 로깅. Sprint 1.1 populate 보증이 있으나 방어 계층 추가. 트리거: 백엔드 응답 인터셉터 정비 Sprint.

### 2026-04-24 harness: Sprint 1.5 exhaustive satisfies SHOULD 후속

- [ ] **[2026-04-24 sprint-1.5] 🟡 MEDIUM fsm-terminal-step-index-semantics** — `computeStepIndex`의 terminal 상태(rejected/canceled)가 `1`을 반환해 "신청 단계"처럼 보임. 의미론적으로 올바르지 않음 — rejected/canceled는 "마지막으로 도달한 단계 index"를 반환해야 함. 현재는 checkout 생성 단계(1) 고정. `resolveNextAction` descriptor에 `reachedStepIndex` 필드 추가 후 연동 권고. 트리거: Sprint 2 FSM 확장 또는 Stepper terminal state UI 개선 시.
- [ ] **[2026-04-24 sprint-1.5] 🟢 LOW design-tokens-partial-audit** — `design-tokens/components/` 내 `tab-badge`, `your-turn`, `timeline` 토큰 파일에 `Partial<Record<...>>` 잔존 여부 전수 스캔 미완. 현재 `checkout.ts`/`checkout-timeline.ts`만 처리. 트리거: Sprint 2 Token Layer 봉합(S2.4~S2.7) 작업 시.
