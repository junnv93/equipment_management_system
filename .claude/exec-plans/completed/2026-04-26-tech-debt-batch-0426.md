# Tech-debt Batch 0426 — 아키텍처 수준 종합 개선

> 작성: 2026-04-26 (Harness Mode 2 Planner)
> 트리거: tech-debt-tracker 누적 항목 일괄 정리 + ⚡ 활성화된 cleanup 트리거
> 모드: Mode 2 (architectural batch)

## 목표

tech-debt-tracker에 누적된 28개 후속 항목 중 우선순위가 명확하고 트리거가 활성화된 22개 항목을 6개 Phase로 묶어 일괄 처리한다. 표면적인 "lint clean"이 아니라 (a) Stale CAS 5차 재발 차단, (b) 캐시 일관성 사각지대 봉합, (c) SSOT 누수 통일, (d) Sprint 1.4 이후 잔여 legacy code 완전 제거를 통해 checkouts 도메인의 아키텍처 무결성을 회복하는 것이 목적이다.

핵심 가치:
- Safety: 캐시 stale read 위험 0, CAS 409 회피
- SSOT: PURPOSE/PAGE_SIZE/ICON/QUERY_CONFIG/ROUTES/STAGGER 분산 0
- Hygiene: Feature flag 상시화 후 dead branch 0
- Coverage: borrowerApprove/Reject 단위 테스트 4 fixture

## 범위 (처리 항목 22개)

### Phase 1 — Safety / Architecture (3건, MUST)
- [P1-A] **SOFTWARE_VALIDATION cache event 미등록** ([86th-session]) — `apps/backend/src/common/cache/cache-event.registry.ts`. `NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_APPROVED/QUALITY_APPROVED/REJECTED/SUBMITTED` 4종과 `CACHE_EVENTS.TEST_SOFTWARE_REVALIDATION_REQUIRED` 1종을 `CACHE_INVALIDATION_REGISTRY`에 등록. 각각 `invalidateAllDashboard` action + `${CACHE_KEY_PREFIXES.SW_VALIDATIONS}*`, `${CACHE_KEY_PREFIXES.TEST_SOFTWARE}*` 패턴. **목적**: 서비스 invalidateCache는 도메인 로컬 캐시 동기 처리 중이나 dashboard/approvals 카운트 캐시는 cross-domain registry에서만 비동기 무효화됨 → 누락 시 stale read 30~120초 발생.
- [P1-B] **Stale CAS 5차 재발 — CheckoutDetailClient 8 mutation** ([pr14-15]) — `apps/frontend/components/checkouts/CheckoutDetailClient.tsx`. 8개 mutation이 렌더 시점 캡처된 `checkout.version` 사용. **목적**: `mutationFn` 내부에서 `await checkoutApi.getCheckout(checkout.id)` fresh fetch → fresh.version 추출 → 백엔드 호출. 기존 SSOT 헬퍼 미존재 시 `apps/frontend/lib/checkouts/cas-helpers.ts`에 `fetchCasVersion(id: string): Promise<number>` 신설.
- [P1-C] **WorkflowTimeline TooltipTrigger 키보드 포커스 불가** ([pr14-15]) — `apps/frontend/components/checkouts/WorkflowTimeline.tsx:132-148`. **목적**: `TooltipTrigger asChild` 내부 `<div>`를 `<button type="button" tabIndex={0}>` 로 교체. focus-visible 토큰 적용. WCAG 2.1 SC 4.1.3 준수.

### Phase 2 — SSOT 위반 (9건, MUST)
- [P2-A] **CheckoutsContent PURPOSE_OPTIONS 로컬 재정의** ([pr4-7]) — `apps/frontend/components/checkouts/CheckoutsContent.tsx:77`. `['calibration','repair','rental']` → `USER_SELECTABLE_CHECKOUT_PURPOSES` (from `@equipment-management/schemas`).
- [P2-B] **OutboundCheckoutsTab pageSize ?? 10 매직넘버** ([pr4-7]) — `apps/frontend/components/checkouts/OutboundCheckoutsTab.tsx`. `pageSize ?? 10` → `pageSize ?? DEFAULT_PAGE_SIZE` (from `@equipment-management/shared-constants`, value=20).
- [P2-C] **overdueClear icon SSOT 통일** ([sprint-2.3]) — `apps/frontend/lib/design-tokens/components/checkout-icons.ts` + `apps/frontend/components/checkouts/OutboundCheckoutsTab.tsx`. `CHECKOUT_ICON_MAP.emptyState`에 `overdueClear: CheckCircle2` 추가. 호출부에서 직접 `CheckCircle2` import 제거 후 `CHECKOUT_ICON_MAP.emptyState.overdueClear` 경유.
- [P2-D] **URGENCY_ICON 로컬 맵 → CHECKOUT_ICON_MAP 이관** ([wf34-pr13]) — `apps/frontend/components/checkouts/YourTurnBadge.tsx` + `apps/frontend/lib/design-tokens/components/checkout-icons.ts`. `CHECKOUT_ICON_MAP`에 `urgencyBadge: { normal: Bell, warning: AlertCircle, critical: AlertCircle }` 신규 섹션 추가. YourTurnBadge에서 로컬 `URGENCY_ICON` const 제거. urgency(workflow-panel dot용)와 urgencyBadge(버저 아이콘) 분리 유지.
- [P2-E] **CHECKOUT_DETAIL 쿼리 프리셋 (4차 재발)** ([pr-19]) — `apps/frontend/lib/api/query-config.ts` + `apps/frontend/components/checkouts/CheckoutDetailClient.tsx:128`. `QUERY_CONFIG.CHECKOUT_DETAIL = { staleTime: CACHE_TIMES.SHORT, gcTime: CACHE_TIMES.MEDIUM, refetchOnMount: false, refetchOnWindowFocus: true, retry: 2 }` 추가. 호출부 인라인 → spread 교체.
- [P2-F] **CheckoutDetailClient href 하드코딩** ([pr14-15]) — `apps/frontend/components/checkouts/CheckoutDetailClient.tsx:902`. `` `/equipment/${equip.id}` `` → `FRONTEND_ROUTES.EQUIPMENT.DETAIL(equip.id)`. 미존재 시 `packages/shared-constants/src/frontend-routes.ts`에 추가.
- [P2-G] **staggerItem 60ms SSOT 이탈** ([pr14-15]) — `apps/frontend/lib/design-tokens/motion.ts:354`. `index * 60` → `index * MOTION_TOKENS.stagger.comfortable`.
- [P2-H] **Layer 1 직접 import — dashboard/header/sidebar.ts** ([pr-3]) — `apps/frontend/lib/design-tokens/components/dashboard.ts`, `header.ts`, `sidebar.ts`. `from '../primitives'` → `from '@/lib/design-tokens'` 배럴 경유. 3-Layer 의존성 단방향 보장.
- [P2-I] **EquipmentImportDetail role 리터럴 → Permission** ([pr-3]) — `apps/frontend/components/equipment-imports/EquipmentImportDetail.tsx:174-176`. `userRole === URVal.TECHNICAL_MANAGER || ...` → `can(Permission.APPROVE_EQUIPMENT_IMPORT)`. 미정의 시 `packages/shared-constants/src/permissions.ts` + role-permissions.ts에 추가.

### Phase 3 — Dead code / Type safety (6건, SHOULD)
- [P3-A] **approvals-api.ts approverId 미사용 파라미터 제거** ([pr22]) — `apps/frontend/lib/api/approvals-api.ts`. approve(L731)/reject(L838)/bulkApprove(L940)/bulkReject(L977) 시그니처 + 호출부에서 `approverId` 인자 제거.
- [P3-B] **Checkout.user.department optional** ([pr22]) — `apps/frontend/lib/api/checkout-api.ts`. `department: string` → `department?: string`.
- [P3-C] **WorkflowTimeline 내부 Suspense 무의미 제거** ([pr14-15]) — `apps/frontend/components/checkouts/WorkflowTimeline.tsx:170-177`. Inner/Outer Suspense 이중 래핑 제거 → 단일 컴포넌트. P1-C와 동일 파일이므로 동시 처리.
- [P3-D] **nextStepIndex prop +1 오프셋 제거** ([pr14-15]) — `apps/frontend/components/checkouts/CheckoutDetailClient.tsx`. `<CheckoutStatusStepper nextStepIndex={nextStepDescriptor.currentStepIndex + 1}>` prop 제거. Stepper가 descriptor에서 직접 추출.
- [P3-E] **rejectReturnMutation onErrorCallback returnRejectReason 미초기화** ([rental-phase9]) — `apps/frontend/components/checkouts/CheckoutDetailClient.tsx`. `rejectReturnMutation.onErrorCallback`에 `setReturnRejectReason('')` 추가. borrowerRejectMutation 패턴(14c2d526)과 대칭화.
- [P3-F] **OutboundCheckoutsTab aria-label "건" i18n 외부화** ([sprint-2.3]) — `apps/frontend/components/checkouts/OutboundCheckoutsTab.tsx:327` + ko/en checkouts.json. `${card.value}건` → `t('count.unit', { value: card.value })`. ko: `"unit": "{value}건"`, en: `"unit": "{value} item(s)"`.

### Phase 4 — Legacy cleanup (⚡ 트리거 활성화, 2건, MUST)
- [P4-A] **checkout-legacy-rental-flow-cleanup** ([pr5]) — `apps/frontend/components/checkouts/CheckoutGroupCard.tsx`:
  1. `RentalFlowInline` 함수 본체 제거
  2. `isNextStepPanelEnabled()` 분기 제거
  3. `RENTAL_FLOW_INLINE_TOKENS` import 제거 + design-tokens에서 정의/re-export 제거
  4. messages/ko/en checkouts.json `rentalFlow.*` 키 통째 제거
  5. `grep -rn "rentalFlow" apps/frontend` 0건 검증

- [P4-B] **checkout-legacy-next-step-panel-cleanup** ([pr5]) — P4-A 완료 후 진행:
  1. `grep -rn "isNextStepPanelEnabled" apps/frontend` 호출부 전체 제거
  2. `apps/frontend/lib/features/checkout-flags.ts` 함수 제거 (다른 flag 없으면 파일 삭제)
  3. `apps/frontend/components/checkouts/NextStepPanel.tsx` (legacy) 삭제
  4. `from '@/components/checkouts/NextStepPanel'` import 0건 보장 (정식은 `@/components/shared/NextStepPanel`)

### Phase 5 — Test coverage (1건, SHOULD)
- [P5-A] **borrowerApprove/borrowerReject 단위 테스트 4케이스** ([rental-phase3-4]) — `apps/backend/src/modules/checkouts/checkouts.service.spec.ts`:
  - (a) 정상 1차 승인 — purpose=rental, role=test_engineer, requester.teamId=req.user.teamId
  - (b) 비-rental BadRequestException — purpose=calibration → BORROWER_APPROVE_RENTAL_ONLY
  - (c) 스코프 외 ForbiddenException — scope 위반
  - (d) teamId 불일치 ForbiddenException → BORROWER_TEAM_ONLY
  - scope-먼저 패턴(83차) 검증: (c) scope 위반 시 reason 필드 미검증에도 ForbiddenException 먼저 throw
  - 기존 mockReq fixture + mockDrizzle.limit(requester user) 패턴 활용

### Phase 6 — Design tokens (2건, SHOULD)
- [P6-A] **CheckoutListSkeleton CHECKOUT_LOADING_SKELETON_TOKENS 적용** ([pr-19]) — `apps/frontend/components/checkouts/CheckoutListSkeleton.tsx`. `bg-primary/10` → `CHECKOUT_LOADING_SKELETON_TOKENS.base` (`bg-muted`). 토큰 미존재 시 `apps/frontend/lib/design-tokens/components/checkout-loading.ts`에 신설.
- [P6-B] **Error 배너 3종 InlineErrorBanner 컴포넌트 추출** ([pr-19]) — `HeroKPIError.tsx`, `NextStepPanelError.tsx`, `WorkflowTimelineError.tsx`. 공통 `<InlineErrorBanner>` 컴포넌트 신설(props: messageKey, onRetry) + `CHECKOUT_ERROR_BANNER_TOKENS` 정의. 3 callsite 교체.

## 범위 밖 (이유 명시)

| 항목 | 제외 이유 |
|---|---|
| pulseHard scale animation 교체 ([pr14-15]) | 디자인 팀 승인 필요 |
| CheckoutGroupCard useMutation 직접 사용 ([pr14-15]) | 전체 mutation 정책 변경 — 별도 sprint |
| ExportFormButton/PageHeader useAuth 직접 호출 ([pr14-15]) | shared 컴포넌트 Container/Presentational 분리 — 별도 sprint |
| date-fns format 직접 사용 ([pr14-15]) | useDateFormatter 전역 마이그레이션 — 5+ 파일 별도 sprint |
| router.refresh + invalidateKeys 이중 동기화 ([pr-19]) | Server Component 상태 동기화 의도 여부 설계 결정 필요 |
| CHECKOUT_DISPLAY_STEPS schemas 이전 ([pr14-15]) | packages/schemas 빌드 파이프라인 정비 동반 |
| ZodSerializerInterceptor 글로벌 승격 | 파일럿 2주 무회귀 + 컨트롤러 3+ 조건 미충족 |
| use-inbound-section-pagination URLSearchParams ([pr4-7]) | UICheckoutFilters 확장 영향 큼 — 별도 sprint |
| fsm-meta-drift-observability ([sprint-1.3]) | Sentry SDK 도입 선행 필요 |
| RENTAL reject_return 설계 갭 ([p1p3]) | 도메인 의사결정 필요 |

## 빌드 시퀀스 (체크리스트)

- [ ] Phase 1 — P1-A registry 5 이벤트 등록 → backend tsc + test
- [ ] Phase 1 — P1-B fetchCasVersion 헬퍼 + 8 mutation 마이그레이션 → frontend tsc
- [ ] Phase 1+3 — P1-C WorkflowTimeline 키보드 포커스 + P3-C 이중 Suspense 제거 (동일 파일)
- [ ] Phase 2 — P2-F FRONTEND_ROUTES.EQUIPMENT.DETAIL 확인/추가 (선행)
- [ ] Phase 2 — P2-I Permission.APPROVE_EQUIPMENT_IMPORT 확인/추가 (선행)
- [ ] Phase 2 — P2-A~E, G, H 일괄
- [ ] Phase 3 — P3-A approverId 파라미터 제거 → tsc
- [ ] Phase 3 — P3-B/D/E 마이크로 수정
- [ ] Phase 3 — P3-F i18n 키 추가 + aria-label 교체
- [ ] Phase 4 — P4-A RentalFlowInline 제거 → tsc + grep 0건 검증
- [ ] Phase 4 — P4-B isNextStepPanelEnabled + legacy NextStepPanel 제거 → tsc + grep 0건
- [ ] Phase 5 — P5-A borrower 테스트 4건 추가 → backend test
- [ ] Phase 6 — P6-A skeleton 토큰 적용
- [ ] Phase 6 — P6-B InlineErrorBanner 추출 + 3 callsite 마이그레이션
- [ ] 최종: pnpm --filter frontend run build + verify-implementation

## 검증 명령어

```bash
# 타입 + 빌드
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run build

# 테스트
pnpm --filter backend run test

# Phase 1 grep
grep -E "SOFTWARE_VALIDATION_(SUBMITTED|APPROVED|QUALITY_APPROVED|REJECTED)\]:|TEST_SOFTWARE_REVALIDATION_REQUIRED\]:" \
  apps/backend/src/common/cache/cache-event.registry.ts | wc -l    # → 5
grep -c "fetchCasVersion\|await checkoutApi.getCheckout(checkout.id)" \
  apps/frontend/components/checkouts/CheckoutDetailClient.tsx       # → >= 8

# Phase 4 legacy 0건
grep -rn "isNextStepPanelEnabled\|RentalFlowInline\|RENTAL_FLOW_INLINE_TOKENS" apps/frontend | wc -l  # → 0
test ! -f apps/frontend/components/checkouts/NextStepPanel.tsx

# Phase 2 SSOT
grep -c "USER_SELECTABLE_CHECKOUT_PURPOSES" apps/frontend/components/checkouts/CheckoutsContent.tsx
grep -c "DEFAULT_PAGE_SIZE" apps/frontend/components/checkouts/OutboundCheckoutsTab.tsx
grep -c "overdueClear:" apps/frontend/lib/design-tokens/components/checkout-icons.ts
grep -c "urgencyBadge:" apps/frontend/lib/design-tokens/components/checkout-icons.ts
grep -c "CHECKOUT_DETAIL:" apps/frontend/lib/api/query-config.ts
grep -c "MOTION_TOKENS.stagger.comfortable" apps/frontend/lib/design-tokens/motion.ts
```

## 위험 / 트레이드오프

- **P1-B latency**: 8 mutation × +1 GET. 캐시 hit 시 무비용. 미스 시 ~80ms. 데이터 일관성 우선.
- **P4-B 파일 삭제**: import 누락 시 build 실패. P4-A grep 0건 검증 → P4-B 순서 엄수.
- **P6-B 컴포넌트 추출**: 추후 4번째 callsite 자동 일관성 보장. retry 콜백 시그니처 통일 필요.

## 관련 메모리

- review-learnings: Stale CAS 4차 누적 → 5차 발생 차단
- [feedback_main_only_no_branches]: main 직접 작업
- 83차 [project_83]: scope-먼저 패턴 → P5-A 테스트로 검증 자동화
