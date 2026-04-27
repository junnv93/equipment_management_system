# Tech Debt Tracker

harness 세션에서 이연된 SHOULD 실패·후속 작업을 누적 관리한다.
완료 항목은 `tech-debt-tracker-archive.md`로 이동.

## Open

### 2026-04-27 harness: approvals-ui-r2 DoD deferred items (contract section 11)

- [x] **[2026-04-27 approvals-ui-r2] 🟡 MEDIUM ar-13-self-inspection-category** — ✅ 2026-04-27 완료. `self_inspection` SSOT 체인 전체 추가 (schemas → shared-constants → backend → frontend → i18n).
- [ ] **[2026-04-27 ar13] 🟢 LOW ar13-lab-manager-self-inspection** — `lab_manager` 역할이 `ROLE_APPROVAL_CATEGORIES`에 `AC.SELF_INSPECTION` 미포함. 현재 technical_manager만 자체점검 승인 가능. lab_manager의 자체점검 승인 권한 필요 여부 확인 후 `approval-categories.ts` 수정. 트리거: lab_manager 역할 승인 흐름 검토 시.
- [ ] **[2026-04-27 ar13] 🟢 LOW ar13-dashboard-kpi-self-inspection** — `dashboard.service.ts`의 `todayProcessed` KPI 집계가 `self_inspection` 액션을 포함하지 않음. 대시보드 today 처리 건수에 자체점검 승인/반려 반영 필요. 트리거: dashboard KPI 정확도 이슈 발생 시.
- [ ] **[2026-04-27 ar13] 🟢 LOW ar13-self-inspection-approve-weak-cast** — `approvals-api.ts`의 `self_inspection` approve/reject 케이스에서 `(selfInspDetail as { version?: number }).version` 약타입 캐스트 사용. 응답 구조에 따라 version undefined 가능성. `SelfInspectionsService` 응답 타입 명시 후 타입 안전 패턴으로 교체 필요. 트리거: self-inspection 승인 실제 사용 시.
- [ ] **[2026-04-27 approvals-ui-r2] 🟡 MEDIUM approvals-api-module-split** — `approvals-api.ts` 1401줄 → 카테고리별 sub-module 분리. 예: `approvals-equipment-api.ts`, `approvals-calibration-api.ts`. 트리거: 파일 크기가 개발 마찰의 원인이 될 때.
- [ ] **[2026-04-27 approvals-ui-r2] 🟡 MEDIUM role-approval-categories-db-backed** — `ROLE_APPROVAL_CATEGORIES` 현재 코드 상수. DB-backed 설정으로 전환 시 운영 유연성 확보. 트리거: 역할별 카테고리 변경 주기가 배포 주기보다 빨라질 때.
- [ ] **[2026-04-27 approvals-ui-r2] 🟡 MEDIUM bulk-approve-rate-limit** — 일괄 승인 시 N개 동시 API 호출. Rate-limit 또는 배치 API 엔드포인트 검토. 트리거: 선택 건수 > 20건 UX 이슈 발생 시.
- [ ] **[2026-04-27 approvals-ui-r2] 🟡 MEDIUM ar-14-software-validation-approve-comment** — `software_validation` 액션 라벨 "검토완료"는 코멘트를 암시하지만 backend `approveValidationSchema`에 comment 필드 없음. backend DTO에 `approvalComment: z.string().optional()` 추가 + `softwareValidationApi.approve()` 파라미터 확장 + TAB_META `commentRequired: true` 전환이 세트로 필요. i18n `commentDialogTitle`/`commentPlaceholder`는 이미 준비됨. 트리거: software_validation 승인 감사 요구사항 발생 시.
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW approval-vocabulary-unification** — `approval-constants.ts` ↔ `approvals-api.ts` vocabulary 분산 (pending_approval vs pending 등). AR-2 잔여. 트리거: 승인 도메인 대규모 리팩토링 시.
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW reject-reason-stale-i18n** — `rejectModal.validation` / `bulk.rejectValidation` 키가 "10자 이상" 메시지 포함하나 `RejectReasonSchema`는 min(1). 미사용 키 삭제 또는 min(1) 메시지로 교정. 트리거: i18n 키 감사 시.
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW approval-audit-timeline-ui** — backend 감사 로그 존재하나 UI 타임라인 미구현. 트리거: 승인 이력 조회 요구사항 발생 시.
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW mobile-detail-modal-fullscreen** — 모바일에서 ApprovalDetailModal이 full-screen 미지원. 트리거: 모바일 실기기 테스트 시.
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW reject-reason-template-quickselect** — 자주 쓰는 반려 사유 quick-select 기능. 현재 5개 템플릿 하드코딩. DB-backed 템플릿 관리 검토. 트리거: 운영팀 피드백 시.
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW approval-delegation-workflow** — 위임 워크플로우 미구현. 장기 부재자 승인 위임. 트리거: 위임 요구사항 발생 시.
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW approval-analytics-dashboard** — 월별 처리량/평균 처리시간 대시보드 미구현. 트리거: 관리자 리포팅 요구사항 발생 시.
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW react-form-event-deprecation** — `RejectModal.tsx:102` `React.FormEvent` → `React.SyntheticEvent<HTMLFormElement>` 교체 필요 (React 19 deprecated). 동작에 영향 없으나 타입 정확도 향상. 트리거: React 19 마이그레이션 or approvals 리팩토링 시.

### 2026-04-27 harness: Sprint 4.1+4.2 NextStepPanel+Row3Zone SHOULD 이연 항목

- [ ] **[2026-04-27 sprint-4.2] 🟢 LOW overflow-action-type-ssot** — `OverflowAction` 인터페이스가 `components/shared/NextStepPanel.tsx` 로컬 정의. 두 번째 사용처 등장 시 `lib/types/checkout-ui.ts`로 승격 검토.
- [ ] **[2026-04-27 sprint-4.2] 🟢 LOW zone2-status-text-truncate** — Zone 2(72px) Badge 내부 긴 상태값 truncate 처리 없음. 영어 locale overflow 가능. 트리거: i18n 검토 시.
- [ ] **[2026-04-27 sprint-4.2] 🟢 LOW row-mobile-stacking** — Zone 4 모바일(< sm) overflow 가능. sm:hidden/flex 패턴으로 스택 레이아웃 검토 필요. 트리거: 모바일 실기기 테스트 시.
- [ ] **[2026-04-27 sprint-4.1] 🟢 LOW group-header-currentUserRole-parity** — 그룹 헤더 `NextStepPanel variant="inline"`에 `currentUserRole` 미전달. row zone 4 compact 패턴과 parity 미완성. 트리거: Sprint 4.3 시.

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

### 2026-04-24 harness: 86차 세션 verify-cache-events + verify-design-tokens 후속

- [ ] **[2026-04-24 86th-session] 🟢 LOW verify-design-tokens NEXT_STEP_PANEL_TOKENS 명시적 검증 단계 미포함** — `.claude/skills/verify-design-tokens/SKILL.md`의 검증 워크플로우가 `NEXT_STEP_PANEL_TOKENS`를 사용하는 `NextStepPanel.tsx`의 token import 체인을 명시적으로 커버하지 않음. 기존 Step에 NEXT_STEP_PANEL_TOKENS 관련 grep 패턴 추가 권장. 트리거: verify-design-tokens 스킬 업데이트 시.

### 2026-04-24 harness: PR-14·15 verify + review-architecture 후속 (90차)

- [ ] **[2026-04-24 pr14-15] 🟢 LOW CHECKOUT_DISPLAY_STEPS 계층 위치 — 스타일 토큰에 도메인 데이터 혼재** — `checkout-timeline.ts`에 FSM display step 배열 위치. 장기적으로 `packages/schemas/src/checkout-display.ts`로 이전하여 `computeStepIndex` SSOT와 동일 패키지에 배치 권장. 트리거: schemas 패키지 정리 시.

### 2026-04-24 harness: PR-17 Feature Flag 상시화 후속

- [ ] **[2026-04-24 pr-17] 🟢 LOW E2E global-setup trigger-overdue-check 역할 문서화** — `global-setup.ts:122` `technical_manager` 토큰 사용 이유가 코드 내 주석 외 문서에 미기록. `e2e-patterns.md`에 "global-setup에서 시스템 트리거 API는 UPDATE_EQUIPMENT 보유 역할(technical_manager) 사용" 가이드 추가 권장. 트리거: e2e-patterns.md 업데이트 시.

### 2026-04-24 harness: Sprint 1.2 NextStepDescriptor 확장 후속

- [ ] **[2026-04-24 sprint-1.2] 🟢 LOW non-rental purpose phase 개념 확장 설계 미문서화** — `rental-phase.ts`에 calibration/repair 2-phase 가능성 논의용 comment 없음. 향후 non-rental 워크플로도 Phase 개념 도입 시 `getRentalPhase()`의 역할 재설계 필요 (S4 실패). 트리거: Sprint 4+ non-rental UI 세분화 논의 시.

### 2026-04-24 harness: Sprint 1.1 resolveNextAction 아키텍처 통일 후속 (90차)

- [ ] **[2026-04-24 sprint-1.1] 🟡 MEDIUM DESCRIPTOR_TABLE 재생성 스크립트 부재** — `packages/schemas/src/fsm/__tests__/fixtures/descriptor-table.ts` 현재 `getNextStep()` 런타임 동적 계산으로 구현 (자체 재생성). FSM 의도적 변경 시 `buildDescriptorTable()` 함수가 자동 반영되므로 당장 위험은 없으나, S2 tech-debt 계획: 독립 `gen:descriptor-table` 스크립트 추가로 정적 스냅샷 형태로 전환 권장 (명시적 diff visible). 트리거: Sprint 2 FSM 확장 또는 packages/schemas 빌드 파이프라인 정비 시.

### 2026-04-24 harness: Sprint 1.3 checkout-meta-fail-closed SHOULD 후속

- [ ] **[2026-04-24 sprint-1.3] 🟡 MEDIUM fsm-meta-drift-observability** — `warnMetaDrift()` 현재 dev console.warn만. Prod에서 Sentry breadcrumb + custom dashboard 계측 추가. `checkout-api.ts` → Sentry `addBreadcrumb({ category: 'fsm', message: 'meta missing', data: { id } })`. 트리거: Sentry SDK 도입 또는 observability 스프린트 시.
- [ ] **[2026-04-24 sprint-1.3] 🟢 LOW fail-closed-e2e-matrix-expansion** — `fail-closed.spec.ts` 현재 12건(4 role × 3 state). role 4 × status 5 = 20건으로 확장: lab_manager BORROWER_APPROVED 최종승인·LENDER_CHECKED 수령확인, technical_manager BORROWER_RETURNED 반입승인, admin OVERDUE 독촉, test_engineer cancel 버튼. 트리거: E2E 안정화 후 커버리지 확장 Sprint.
- [ ] **[2026-04-24 sprint-1.3] 🟢 LOW fsm-response-interceptor-guard** — 백엔드 NestJS interceptor에서 응답 직전 `meta` 완전성 검증. 누락 시 빈 meta 채워 500 방지 또는 경고 로깅. Sprint 1.1 populate 보증이 있으나 방어 계층 추가. 트리거: 백엔드 응답 인터셉터 정비 Sprint.

### 2026-04-24 harness: Sprint 1.5 exhaustive satisfies SHOULD 후속

- [ ] **[2026-04-24 sprint-1.5] 🟢 LOW design-tokens-partial-audit** — `design-tokens/components/` 내 `tab-badge`, `your-turn`, `timeline` 토큰 파일에 `Partial<Record<...>>` 잔존 여부 전수 스캔 미완. 현재 `checkout.ts`/`checkout-timeline.ts`만 처리. 트리거: Sprint 2 Token Layer 봉합(S2.4~S2.7) 작업 시.

### 2026-04-27 harness: dashboard-design-review-0427 SHOULD 후속

- [ ] **[2026-04-27 dashboard-design-review] 🟢 LOW ap16-ssr-strategy-docs** — DashboardRow3/4로 이관 후에도 `ssr: true` 유지. 주석 "First Load JS -15~30KB" 는 과장. `ssr: false` 전환 시 수화 전 레이아웃 시프트 가능 — 실측 후 판단 필요. 트리거: bundle-baseline 갱신 Sprint.

### 2026-04-27 harness: dashboard-phase4-6 SHOULD 후속

- [ ] **[2026-04-27 dashboard-phase4-6] 🟢 LOW bundle-baseline-update** — Phase 4.5 스킵. `pnpm --filter frontend run build 2>&1 | node scripts/check-bundle-size.mjs --baseline` 실행해 `bundle-baseline.json` 갱신 필요. DashboardRow3/4 분리로 청크 구조 변경됨. 트리거: 다음 번들 최적화 Sprint.
- [ ] **[2026-04-27 dashboard-phase4-6] 🟢 LOW visual-regression-baseline** — Phase 4.6 스킵. `visual-regression.spec.ts` 미생성 — 5 role × 4 viewport × 3 mode = 60 baseline 스크린샷. 트리거: 디자인 QA Sprint 착수 시 `--update-snapshots`로 초기 캡처.

### 2026-04-27 harness: fsm-terminal-actor-variant SHOULD 이연 항목

- [ ] **[2026-04-27 fsm-terminal-actor-variant] 🟡 MEDIUM use-checkout-next-step-fallback-terminated-from** — `apps/frontend/hooks/use-checkout-next-step.ts:47` client-side fallback 경로에서 `getNextStep()`에 `terminatedFromStatus` 미전달. 서버 `nextStep` Zod 검증 실패(schema drift) 시 terminal 상태의 `reachedStepIndex`가 항상 `1`로 계산됨. 수정: `UseCheckoutNextStepInput`에 `terminatedFromStatus?: CheckoutStatus | null` 추가 + fallback getNextStep 호출에 전달. 현재 단일 호출처(`CheckoutStatusStepper`)가 terminal 상태에서 special UI 경로를 사용하여 실질 영향 없음. 트리거: schema drift 대응 또는 Stepper terminal 단계 표시 UI 추가 시.
- [ ] **[2026-04-27 fsm-terminal-actor-variant] 🟢 LOW e2e-your-turn-badge-coverage** — `YourTurnBadge` Playwright E2E 미커버. 검증 필요 3케이스: (1) technical_manager lender checkout → 뱃지 visible, (2) test_engineer approved checkout → 뱃지 visible, (3) terminal(rejected/canceled) → `data-my-turn="false"` 뱃지 없음. 트리거: checkouts E2E 확장 Sprint 시.

### 2026-04-27 harness: checkout-sprint4-3-to-5 미완 항목

- [x] **[2026-04-27 sprint4-3-to-5] 🔴 HIGH rejection-presets-seed** — 5건 삽입 완료(2026-04-27). `seed-data/admin/rejection-presets.seed.ts` 신규. 교정유효기간만료(is_default)·장비상태부적합(is_default)·반출정보오류(is_default)·중복신청·신청요건미충족. tsc 0 error.

### 2026-04-27 harness: approvals-ui-r2 SHOULD 이연 항목

- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW stepper-disposal-start-node-label** — ApprovalStepIndicator의 disposalSteps 시작 노드 차등화(`▸` 마이크로 라벨) 미구현. 현재 모든 단계 노드 동일 시각. 트리거: Stepper UX 세밀화 Sprint 시.
- [ ] **[2026-04-27 approvals-ui-r2] 🟢 LOW stepper-step-transition-animation** — ApprovalStepIndicator step transition 200ms ease 미적용. 현재 색상 전환 즉시. 트리거: 애니메이션 정책 일괄 적용 Sprint 시.

### 2026-04-27 verify-implementation: checkout-sprint4-3-to-5 pre-existing 이슈

- [ ] **[2026-04-27 checkout-sprint4-3-to-5] 🟡 MEDIUM qr-label-size-preset-micro-ssot** — ko/en qr.json `micro` i18n 키 추가됨(2026-04-27). **미완**: `LabelSizePreset`(`packages/shared-constants/src/qr-config.ts:241`) + `LABEL_SIZE_CONFIG` + `LABEL_SAMPLER_LAYOUT`에 `'micro'` 항목 미추가 → dead i18n 키 상태. 수정: qr-config.ts에 micro 사이즈 스펙(mm) 추가 필요. 트리거: QR micro 옵션 UI 구현 시.
- [x] **[2026-04-27 checkout-sprint4-3-to-5] 🟡 MEDIUM stale-time-query-config-presets** — 36건 전수 교체 완료(2026-04-27). COMBOBOX_SEARCH 신규 preset 추가(SHORT+gcMEDIUM+refetchOnWindowFocus:false+retry:1), Settings/Profile/NotificationPreferences→SETTINGS(mutation invalidation 체인 검증 후), 콤보박스 4개 검색 쿼리→COMBOBOX_SEARCH. 최종 보존 5건(의도적): StorageImage(gcTime:SHORT blob revoke load-bearing), use-equipment:84(backend협력 주석), use-management-number-check(gcTime:LONG+retry:1), providers.tsx(GlobalQueryClient default). tsc 0 error. 3커밋: 70685229(23건), 91107449(13건).

### 2026-04-27 verify-implementation: 세션 종료 발견 항목

- [x] **[2026-04-27 tech-debt-0427-cleanup] 🟡 MEDIUM revoke-approval-workflow-e2e** — critical-workflows.md WF-AP-03 등록 + wf-ap03-revoke-approval.spec.ts 작성 완료(2026-04-27). test.skip(REVOCATION_WINDOW_EXPIRED) 명시적 마킹. tsc 0 error.
- [ ] **[2026-04-27 tech-debt-0427-cleanup] 🟢 LOW create-equipment-import-form-react-formevent** — `apps/frontend/components/equipment-imports/CreateEquipmentImportForm.tsx:113` `React.FormEvent` → `React.SyntheticEvent<HTMLFormElement>` 교체 필요. React 19/Next.js 16에서 deprecated. verify-nextjs 스캔에서 검출 (이번 세션 범위 외). 트리거: 해당 파일 다음 수정 시 함께 교정.
- [ ] **[2026-04-27 tech-debt-0427-cleanup] 🟢 LOW not-found-href-ssot** — `not-found.tsx` 4개 파일에 `href="/"` 하드코딩 잔존. fallback 루트 링크이므로 실제 영향 최소 (contract S3 미처리). 트리거: not-found 파일 다음 수정 시 `FRONTEND_ROUTES.DASHBOARD`로 교체.
- [ ] **[2026-04-27 manage-skills] 🟢 LOW revocation-window-ms-shared-constants** — `checkouts.service.ts:3177` `const REVOCATION_WINDOW_MS = 300_000` 로컬 상수. `packages/shared-constants/src/business-rules.ts`에 `APPROVAL_REVOCATION_WINDOW_MS`로 승격 필요. verify-hardcoding Step 29로 추적. 트리거: checkouts.service.ts 다음 수정 시.
