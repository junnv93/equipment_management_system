# Checkouts V3 Sprint 4.3 → 5 실행 계획

> 수립일: 2026-04-27 · Mode 2
> 전제: Sprint 1·2·3·4.1·4.2 완료. RentalPhase schemas LIVE. NextStepPanel 단일 렌더 LIVE.
> 원본 로드맵: `.claude/exec-plans/completed/2026-04-24-checkouts-v3-roadmap.md`

## 이미 LIVE (재작업 금지)

- `packages/schemas/src/fsm/rental-phase.ts` — `RENTAL_PHASES`, `RENTAL_STATUS_TO_PHASE`, `getRentalPhase`, `getPhaseIndex`, `getStepsInPhase`, `RENTAL_PHASE_I18N_KEY`, `satisfies` 강제 모두 완성
- `packages/schemas/src/fsm/checkout-fsm.ts` — `NextStepDescriptor.phase/phaseIndex/totalPhases/nextStepIndex` 완성
- `CheckoutGroupCard.tsx` — Zone 1~4 grid · staggerFadeInItem · MiniProgress tooltipButton · NextStepPanel compact LIVE
- `CheckoutDetailClient.tsx` — Hero NextStepPanel · descriptor.nextStepIndex 사용 LIVE
- `checkouts.controller.ts` — `GET /inbound-overview` LIVE
- `queryKeys.checkouts.view.*/resource.*` 재편 LIVE

## Phase 1: Sprint 4.3 D-day 배지 (이번 세션)

### WHAT

**신규 `apps/frontend/lib/utils/dday-utils.ts`**
- `calculateDaysRemaining(expectedReturnDate: string): number` SSOT 헬퍼 export
- 기존 `CheckoutGroupCard` 내부 인라인 계산을 이 헬퍼로 교체

**신규 `apps/frontend/components/checkouts/DdayBadge.tsx`**
- Props: `daysRemaining: number | null`, `variant?: 'compact' | 'hero'`, `className?: string`
- `daysRemaining === null`이면 null 렌더 (early return)
- Phase 3 U-09 `getDdayBadgeClasses` 의존 → U-09 먼저 구현
- 색 + 숫자 + 아이콘(critical tier) 3중 단서 (WCAG)
- `role="img"` + `aria-label` ko/en

**`apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx`**
- 헤더 영역에 `<DdayBadge variant="hero" daysRemaining={...} />` 삽입
- terminal 상태(rejected/canceled/return_approved) 미렌더 가드

**i18n**: `checkouts.detail.ddayLabel`, `checkouts.detail.ddaySrLabel` ko + en 동시

## Phase 2: Sprint 4.4 RentalPhase UI (이번 세션)

### WHAT

**신규 `apps/frontend/lib/design-tokens/components/checkout-phase.ts`**
- `CHECKOUT_RENTAL_PHASE_TOKENS` export (container, header, dot, dotState.complete/current/future, expandBtn, collapsedSummary)
- 모든 색은 brand CSS 변수 경유, raw class 0
- `lib/design-tokens/index.ts` re-export 추가

**신규 `apps/frontend/components/checkouts/CheckoutPhaseIndicator.tsx`**
- Props: `descriptor: NextStepDescriptor`, `variant?: 'inline' | 'compact'`, `className?: string`
- `descriptor.phase === null`이면 null 렌더
- dot state: phaseIndex < current → complete, === → current, > → future
- phase label: `RENTAL_PHASE_I18N_KEY[phase]` 경유
- `role="group"` + `aria-label` + 3개 phase dot

**`apps/frontend/components/checkouts/CheckoutGroupCard.tsx`**
- rental 그룹 조건 안에 `<CheckoutPhaseIndicator descriptor={rentalDescriptor} variant="compact" />` 삽입
- non-rental 변경 없음

**`apps/frontend/components/checkouts/WorkflowTimeline.tsx`**
- rental purpose: phase-collapsible 모드 (3 phase card, current expanded, 나머지 collapsed)
- non-rental: 기존 dot/connector 렌더링 유지 (회귀 0)
- `aria-expanded` + `aria-controls` + 키보드 Space/Enter

**i18n**: `rentalPhase.xOfY`, `rentalPhase.ariaLabel`, `rentalPhase.expandAll`, `rentalPhase.collapseAll`, `rentalPhase.viewSteps`, `rentalPhase.waiting`, `rentalPhase.{approve,handover,return}.label` ko + en

## Phase 3: Sprint 4.5 단순 FE (이번 세션)

### U-09 D-day 6단계 색온도

**신규 `apps/frontend/lib/design-tokens/components/dday-colors.ts`**
- 6 tier: farFuture(D-7+), upcoming(D-6~-4), soon(D-3~-1), dueToday(D-0), overdueShort(D+1~+3), overdueLong(D+4+)
- `getDdayBadgeClasses(daysRemaining: number): string`
- `getDdayTier(daysRemaining: number): DdayTier`
- `getDdayIconKey(tier: DdayTier): 'warning' | 'critical' | null`
- 모든 색: brand CSS 변수 (`:root` + `.dark` 양쪽). raw `bg-orange-500` 0
- D+4+ tier만 `motion-safe:animate-pulse`
- `lib/design-tokens/index.ts` re-export
- 기존 `getDdayClasses`는 deprecated alias → `getDdayBadgeClasses` 위임

### U-11 Nav "내 차례" 배지

**`apps/frontend/lib/navigation/nav-config.ts`**
- `badgeKey?: 'approvals' | 'checkouts-your-turn'` 타입 확장
- checkouts 아이템에 `badgeKey: 'checkouts-your-turn'` 추가
- `getFilteredNavSections` 세 번째 파라미터에 `checkoutYourTurnCount?: number` 추가
- 배지 계산 시 `badgeKey === 'checkouts-your-turn'`이면 `checkoutYourTurnCount` 사용

**`apps/frontend/components/layout/DashboardShell.tsx`**
- `queryKeys.checkouts.resource.pendingCount()` + `QUERY_CONFIG.CHECKOUT_SUMMARY` 쿼리 추가
- `getFilteredNavSections` 호출에 `checkoutYourTurnCount: data` 전달

**신규 `apps/frontend/components/layout/NavBadge.tsx`**
- Props: `count: number`, `srLabel: string`, `variant?: 'default' | 'critical'`
- 0이면 null, 10+ "9+", `aria-label` 포함

**i18n**: `navigation.checkouts.yourTurnAria`, `navigation.nav.badge.tooltip` ko + en

### U-12 Empty/Error variant 5종

**`apps/frontend/components/checkouts/CheckoutEmptyState.tsx`**
- variant: `noneYet | noPermission | noFilterResult | error | network` 5종
- 각 variant primary CTA + (해당 시) secondary CTA
- `noPermission`: 현재 역할 inline 표시
- `noFilterResult`: "필터 초기화" CTA
- `network`: `navigator.onLine` 감지

**`apps/frontend/lib/design-tokens/components/checkout-empty-state.ts`**
- `variantIconBg`: 5종 토큰 정의 (Sprint 5.1과 통합)

**i18n**: 5 × {title, description, primaryCta, secondaryCta} = 20개 키 ko + en

### U-10 Optimistic UI 보강

**`apps/frontend/components/checkouts/CheckoutGroupCard.tsx`**
- `approveMutation` `useOptimisticMutation` 패턴 검토/적용
- CAS 409 시 `CheckoutCacheInvalidation` detail cache 포함 검증

## Phase 4: Sprint 4.5 Backend API (이번 세션)

### U-01 `POST /checkouts/bulk-approve`

- **DTO** `apps/backend/src/modules/checkouts/dto/bulk-approve.dto.ts`: Zod `ids: uuid[] (min 1, max 50)`, `commonReason?: string`
- **Controller**: `@Post('bulk-approve')`, `@RequirePermissions(Permission.APPROVE_CHECKOUT)`
- **Service**: `bulkApprove(ids, approverId, req)` — `Promise.allSettled` + 개별 CAS + cross-team reject
- 응답: `{ approved: {id, version}[], failed: {id, error}[] }`
- approverId = `extractUserId(req)` (Rule 2)
- cache invalidate: view:* + resource:*

### U-04 `GET /checkouts/rejection-presets`

- 신규 테이블 `rejection_presets` Drizzle schema (`packages/db/src/schemas/rejection-presets.ts`)
- 마이그레이션: `db:generate` → `db:migrate`
- **Controller**: `@Get('rejection-presets')`, `@RequirePermissions(Permission.REJECT_CHECKOUT)`
- Seed: 기본 5건 (임의 생성 금지 — seed 내용은 사용자 확인 필요)

### U-08 `GET /checkouts/destinations/recent`

- **Controller**: `@Get('destinations/recent')`, `@RequirePermissions(Permission.VIEW_CHECKOUTS)`
- **Service**: `getRecentDestinations(userId, limit=5)` — userId scope 엄수, Drizzle groupBy + desc
- 캐시: 1분 TTL, key에 userId 포함

### U-05 `POST /checkouts/:id/revoke-approval`

- **Controller**: `@Post(':uuid/revoke-approval')`, `@RequirePermissions(Permission.APPROVE_CHECKOUT)`
- **Service**: `revokeApproval(uuid, dto, approverId, req)`
  - fail-close 순서: scope → FSM(status===approved, 5분 이내) → domain(approvedBy===approverId)
  - CAS: version 불일치 → 409
  - 신규 ErrorCode `REVOCATION_WINDOW_EXPIRED` (`packages/schemas/src/error-codes.ts`)
  - AuditLog: revokedBy, revokeReason, previousApprovedAt

## Phase 5: Sprint 5 Visual Polish (이번 세션 후반)

### 5.1~5.5

- `checkout-empty-state.ts` variantIconBg 5종 (U-12와 통합)
- `TYPOGRAPHY_TOKENS` alias 추가 (heroH, actionH, rowTitle, body, meta, kicker)
- color semantic 5축 원칙 주석 + verify-design-tokens 룰 추가
- Density: CHECKOUT_ITEM_ROW_TOKENS.container 64px cozy 검증
- Icon/motion: 동사 앞 아이콘 원칙 + sprint 4 컴포넌트 grep 점검

## Phase 6: 다음 세션 이월

- **U-02** 전역 단축키 + 치트시트 (시스템 wide, IME 가드 복잡)
- **U-03** 필터 Sticky + Saved Views (localStorage + URL hybrid + 서버 집계 카운트)
- **U-06** QR drawer (U-02 단축키 의존)
- **U-07** 스크롤 복원 (Next.js 16 router lifecycle 정밀 작업)

## 검증 시퀀스

```bash
# Phase 1+3-U09 완료 후
pnpm --filter frontend tsc --noEmit

# Phase 2 완료 후
pnpm tsc --noEmit

# Phase 4 완료 후
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test

# 통합
pnpm lint
pnpm --filter frontend test:e2e -- features/checkouts
```

## 실행 순서

```
U-09 (dday-colors) → Phase 1 (DdayBadge) → Phase 2 (PhaseIndicator+Timeline)
→ U-11 + U-12 + U-10 → Phase 4 (Backend) → Phase 5 (Polish)
```
