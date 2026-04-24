# Tech Debt Tracker

harness 세션에서 이연된 SHOULD 실패·후속 작업을 누적 관리한다.
완료 항목은 `tech-debt-tracker-archive.md`로 이동.

## Open

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
- [ ] **[2026-04-22 checkout-arch-pr3-11] 🟢 LOW .env.example 플래그 문서화 누락** — `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=false` 항목이 `.env.example`, `apps/frontend/.env.local.example`에 없음. 트리거: env 문서 업데이트 시.
- [ ] **[2026-04-22 checkout-arch-pr3-11] 🟡 MEDIUM NextStepPanel 플래그 상시화** — `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL` 2026-Q2 안정화 후 제거 예정. `isNextStepPanelEnabled()` 호출부 3곳 및 `checkout-flags.ts` 제거. 트리거: Q2 스프린트 시작 시.

### 2026-04-22 harness: checkout-lender-guard-p1p3 후속 (verify + review 결과)
- [ ] **[2026-04-22 p1p3] 🟢 LOW RENTAL reject_return 설계 갭 — FSM 명시적 결정 필요** — FSM `reject_return` 전이가 `purposes: CAL_REPAIR`만 허용, RENTAL 제외. RENTAL 반납 검사 실패 시 반려 불가한 도메인 갭. 의도적 설계라면 FSM 주석 추가 권장; RENTAL 반납 반려가 필요하다면 FSM에 rental 추가 + rejectReturn LENDER_TEAM_ONLY 복구 필요. 트리거: 렌탈 워크플로우 설계 검토 시.

### 2026-04-22 harness: NC-P4 GuidanceCallout 후속

- [ ] **[2026-04-22 nc-p4-guidance] 🟢 LOW help.status.completed / help.status.return_rejected — CheckoutStatus enum 미포함 상태** — UI 표시 전용(GuidanceCallout 등)으로 허용했으나, 장기적으로 `help.status.ui.*` 별도 네임스페이스로 분리 권고. 파일: `apps/frontend/messages/ko/checkouts.json`, `apps/frontend/messages/en/checkouts.json`. 트리거: i18n 네임스페이스 정리 작업 시.

### 2026-04-22 harness: checkout-subtab-ia + checkout-subtab-ssot-fix 후속 (verify + review 결과)

- [ ] **[2026-04-22 subtab-ia] 🟢 LOW verify-i18n: guidance.urgency.normal 빈 문자열 (기존 파일)** — `checkouts.json` en/ko 양쪽 `guidance.urgency.normal` 빈 문자열. 런타임 호출 코드 없으나 키 채우거나 제거 필요. 트리거: GuidanceCallout urgency 기능 구현 시.

### 2026-04-22 PR-22 checkout-api 정리 후속 (verify-implementation + review-architecture 결과)

- [ ] **[2026-04-22 pr22] 🟢 LOW approvals-api.ts approverId 미사용 파라미터** — `approve`(L731), `reject`(L838), `bulkApprove`(L940), `bulkReject`(L977) 메서드 시그니처에 `approverId: string` 파라미터 존재하나 메서드 본체에서 미사용. Rule 2(서버사이드 userId 추출) 준수로 인해 올바르게 미전송되나 dead parameter가 오해 유발. 수정: 파라미터 제거 (호출부도 함께 제거). 트리거: approvals-api.ts 리팩토링 시.
- [ ] **[2026-04-22 pr22] 🟢 LOW Checkout.user.department 백엔드 DTO 미지원 필드** — `checkout-api.ts` `Checkout.user`에 `department: string`(필수) 선언. 백엔드 `UserInfoDto`에 해당 필드 없음 — 런타임 값 항상 `undefined`. optional(`department?: string`)로 변경하거나 실제 사용처 확인 후 제거. 트리거: Checkout user 필드 관련 작업 시.

### 2026-04-24 harness: PR-3 Design Token Layer 2 후속 (verify + review 결과)

- [ ] **[2026-04-24 pr-3] 🟢 LOW Layer 1 직접 import — dashboard.ts/header.ts/sidebar.ts** — 3개 파일이 `../primitives`에서 `toTailwindSize`, `toTailwindGap`을 직접 import. `@/lib/design-tokens` 배럴 경유로 교체 필요. 트리거: 해당 컴포넌트 파일 수정 시.
- [ ] **[2026-04-24 pr-3] 🟢 LOW EquipmentImportDetail.tsx role 리터럴 액션 게이트** — `EquipmentImportDetail.tsx:174-176` `userRole === URVal.TECHNICAL_MANAGER||LAB_MANAGER||SYSTEM_ADMIN` 패턴이 Permission 게이트 역할. `can(Permission.APPROVE_EQUIPMENT_IMPORT)` 패턴으로 교체 권장. 트리거: equipment-imports 권한 작업 시.
- [ ] **[2026-04-24 pr-3] 🟢 LOW NEXT_STEP_PANEL_TOKENS dead token** — `workflow-panel.ts:71` 정의되고 `index.ts` re-export되나 `NextStepPanel.tsx`에서 미사용. PR-4 NextStepPanel 리디자인 시 `WORKFLOW_PANEL_TOKENS` → `NEXT_STEP_PANEL_TOKENS` 전환 필요. 트리거: PR-4 구현 시.

### 2026-04-24 harness: PR-4·6·7·8 verify-implementation + review-architecture 후속 (86차)

- [x] **[2026-04-24 pr4-7] 🟢 LOW en/checkouts.json 3개 키 누락** — 2026-04-24 해소: cancelCheckout/cancelTitle/cancelDescription 추가.
- [ ] **[2026-04-24 pr4-7] 🟡 MEDIUM use-inbound-section-pagination.ts URLSearchParams 직접 조작** — `new URLSearchParams(searchParams.toString())` + `params.set` 패턴. `resetFilters` 시 섹션 페이지(`inboundPage/rentalPage/internalPage`) URL 잔존. `UICheckoutFilters`에 섹션 페이지 포함 또는 `filtersToSearchParams` 확장 + resetFilters에서 1로 초기화 필요. 트리거: 체크아웃 필터/페이지네이션 작업 시.
- [ ] **[2026-04-24 pr4-7] 🟢 LOW CheckoutsContent.tsx PURPOSE_OPTIONS 로컬 재정의** — `CheckoutsContent.tsx:77` `['calibration','repair','rental']` 배열 로컬 정의. `@equipment-management/schemas`의 `USER_SELECTABLE_CHECKOUT_PURPOSES` 존재. 트리거: CheckoutsContent 수정 시.
- [ ] **[2026-04-24 pr4-7] 🟢 LOW OutboundCheckoutsTab pagination ?? 10 매직넘버** — `pageSize ?? 10` fallback이 `DEFAULT_PAGE_SIZE=20` SSOT와 불일치. 잘못된 페이지 정보 표시 가능. 트리거: 페이지네이션 관련 작업 시.
- [ ] **[2026-04-24 pr4-7] 🟢 LOW OutboundCheckoutsTab celebration EmptyState i18n 하드코딩** — `'기한 초과 없음'`, `'현재 기한이 초과된...'` 한국어 리터럴. `// TODO(PR-8)` 주석 존재. 트리거: PR-8 i18n 완성 시.

### 2026-04-24 harness: rental-phase5-8 review-architecture 후속

- [x] **[2026-04-24 rental-phase5-8] 🟢 LOW borrowerReject dialog onErrorCallback reason 미초기화** — 89차 세션 수정: `onErrorCallback`에 `setBorrowerRejectReason('')` 추가 (commit 14c2d526).
- [x] **[2026-04-24 rental-phase5-8] 🟢 LOW REJECTED 상태 카드에 borrowerRejectionReason 미표시** — 89차 세션 수정: `borrowerRejectionReason ?? rejectionReason` 우선순위로 표시 (commit 14c2d526).
- [x] **[2026-04-24 rental-phase5-8] 🟢 LOW CheckoutNotificationEvent lenderTeamId 미선언** — 88차 세션 즉시 수정: notification-events.ts에 `lenderTeamId?: string` 추가.
- [x] **[2026-04-24 rental-phase5-8] 🟢 LOW lenderTeamId ?? '' 빈 문자열 fallback** — 88차 세션 즉시 수정: `?? undefined`로 교체.
- [x] **[2026-04-24 rental-phase5-8] 🔴 Critical LegacyActionsBlock 취소 조건 BORROWER_APPROVED 누락** — 88차 세션 즉시 수정: FSM SSOT 일치.

### 2026-04-24 harness: PR-5 FSM 통합 후속 (SHOULD 미충족)

- [ ] **[2026-04-24 pr5] 🟢 LOW checkout-fsm-borrower-actions** — `handleNextStepAction` switch에 `borrower_approve`/`borrower_reject` 명시적 case 없음. 현재 `default` no-op으로 흡수됨. 백엔드 배선 완료 시 case 추가 + mutation 연결 필요. 트리거: rental borrower 승인 백엔드 구현 시.
- [ ] **[2026-04-24 pr5] 🟢 LOW checkout-legacy-rental-flow-cleanup** — `RentalFlowInline` 함수 + `RENTAL_FLOW_INLINE_TOKENS` + `i18n.checkouts.rentalFlow.*` 키가 Feature Flag 상시화 후 불필요. 조건: `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL` 상시화 완료(PR-23) 후. 트리거: PR-23 (플래그 상시화) 작업 시.
- [ ] **[2026-04-24 pr5] 🟢 LOW checkout-legacy-next-step-panel-cleanup** — `apps/frontend/components/checkouts/NextStepPanel.tsx` (legacy)가 PR-5 이후 dead code. 조건: PR-23 (플래그 상시화) 완료 후. 트리거: PR-23 작업 시.
- [ ] **[2026-04-24 pr5] 🟡 MEDIUM checkout-group-card-fsm-actions** — `CheckoutGroupCard.tsx` compact `<NextStepPanel>`에 `onActionClick`/`isPending` 미연결. 인라인 승인 등 group card 내 직접 액션 필요 시 추가. 트리거: PR-13 (YourTurnBadge + GroupCard 재설계) 작업 시.
- [ ] **[2026-04-24 pr5] 🟢 LOW checkout-fsm-dedicated-dialogs** — floating panel action → 기존 공유 Dialog 재사용 중. FSM 전용 Dialog 도입 여부 설계 검토 필요. 트리거: PR-18 (Contextual Tooltip + Dialog UX) 작업 시.

### 2026-04-24 harness: rental-phase3-4 후속

- [ ] **[2026-04-24 rental-phase3-4] 🟡 MEDIUM borrowerApprove/borrowerReject 단위 테스트 4케이스** — `checkouts.service.spec.ts`에 describe 블록 없음. 테스트 케이스: (a) 정상 1차 승인, (b) 비-rental → BadRequestException(BORROWER_APPROVE_RENTAL_ONLY), (c) 스코프 외 사용자 → ForbiddenException, (d) req.user.teamId !== requester.teamId → ForbiddenException(BORROWER_TEAM_ONLY). 기존 mockReq fixture + mockDrizzle.limit(requester user) 패턴 활용. 트리거: checkouts.service.spec.ts 작업 시.

### 2026-04-24 harness: 86차 세션 verify-cache-events + verify-design-tokens 후속

- [ ] **[2026-04-24 86th-session] 🟡 MEDIUM SOFTWARE_VALIDATION_* 이벤트 5개 cache-event.registry.ts 미등록** — `NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_APPROVED/QUALITY_APPROVED/REJECTED/SUBMITTED`, `CACHE_EVENTS.TEST_SOFTWARE_REVALIDATION_REQUIRED` 총 5개가 서비스에서 `emitAsync`로 발행되나 `CACHE_INVALIDATION_REGISTRY`에 미등록. 기존 pre-existing 부채. 캐시 무효화 no-op → stale read 위험. 등록 시 `invalidateAllDashboard` + 관련 캐시 키 패턴 추가 필요. 트리거: software-validations 모듈 작업 시.
- [ ] **[2026-04-24 86th-session] 🟢 LOW verify-design-tokens NEXT_STEP_PANEL_TOKENS 명시적 검증 단계 미포함** — `.claude/skills/verify-design-tokens/SKILL.md`의 검증 워크플로우가 `NEXT_STEP_PANEL_TOKENS`를 사용하는 `NextStepPanel.tsx`의 token import 체인을 명시적으로 커버하지 않음. 기존 Step에 NEXT_STEP_PANEL_TOKENS 관련 grep 패턴 추가 권장. 트리거: verify-design-tokens 스킬 업데이트 시.
