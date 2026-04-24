# 장비 반출입(checkouts) 도메인 V3 종합 개발 플랜

> 원본 리뷰: `/mnt/c/Users/kmjkd/Downloads/index.html` (V2 아키텍처 리뷰, 18 findings · 10 sections) + `index2.html` (V1 UX/Visual 리뷰, 5 sections).
> 리뷰 스냅샷: 2026-04-24. 세션 87차 종료 직후.

---

## Context — 왜 이 작업을 하는가

반출입 도메인은 지난 80~87차 harness에서 **PR-3~PR-22** (design token layer, FSM integration, hero KPI, sparkline, rental 2-step, UX polish, loading skeleton 등) 집중 개발되었다. 그러나 이번 외부 리뷰 V2는 **한 층 아래**로 내려가 다음을 지적한다:

1. **토큰은 선언되었지만 소비 지점에서 raw Tailwind를 찍는다** — layer 3 → raw class 7곳 누수.
2. **FSM 규칙이 컴포넌트 내부에 재구현되어 있다** — "approve 버튼을 보여줄지"의 정답이 4곳에 분산 (`useCheckoutNextStep` / `useCheckoutGroupDescriptors` / `checkout.meta.availableActions` / role permissions).
3. **서버 `meta.availableActions`가 undefined일 때 role 기반으로 fallback한다** — 서버가 금지한 액션을 UI가 켤 수 있는 보안 약점.
4. **목록/상세 간 진실 불일치** — 목록은 5단계 "3/5", 상세 Stepper는 8단계; 상세에는 D-day 배지 결여.
5. **InboundTab 3 round-trip** — 같은 필터로 3개 독립 쿼리.

V1 리뷰(UX/Visual)의 90%는 이미 80~87차 harness로 커버되었으나, V2가 지적한 **아키텍처·보안·일관성** 층은 대부분 잔존한다.

**목표**: 리뷰 권고의 의도는 반영하되, V2의 Sprint 1-3 + V1의 UX/Visual + V2 §7~§10의 통합 5-Sprint 로드맵을 **기존 harness 계약과 합쳐** 중복 없이 실행한다. 권위 단일화 선행 → 토큰 봉합 → 성능 → UX → Visual 순서는 유지 (거꾸로 하면 회귀 비용이 기하급수).

---

## 검증 결과 요약 — 18 findings 현황

| ID | P | Finding | 상태 | 파일:라인 근거 |
|----|---|---------|------|-------------|
| L-1 | P0 | `getPurposeBarClass` 로컬 map | ✅ FIXED (return_to_vendor 결측 잔존) | `CheckoutGroupCard.tsx` L297-304 — 이미 토큰 참조 |
| L-2 | P1 | YourTurn 요약 raw `text-brand-info font-medium` | 🔴 LIVE | `CheckoutGroupCard.tsx` L398-404 |
| L-3 | P1 | EmptyState 하드코딩 한글 "기한 초과 없음" | 🔴 LIVE | `OutboundCheckoutsTab.tsx` L363-365 |
| L-4 | P1 | `pendingChecksCount` raw `bg-destructive` | 🔴 LIVE | `CheckoutsContent.tsx` L283 |
| L-5 | P2 | `mb-3/mb-4/mb-5` 하드코딩 | ⚠ PARTIAL | OutboundCheckoutsTab L327/L353/L534 (mb-4만 잔존) |
| L-6 | P2 | Stepper `ring-offset-2` magic | 🔴 LIVE | `checkout.ts` L364 |
| L-7 | P2 | `pl-4` 반복 하드코딩 | 🔴 LIVE | `InboundCheckoutsTab.tsx` L246/L300/L418 |
| L-8 | — | `@deprecated` 토큰 여전히 export | 🔴 LIVE | `checkout.ts` L294-301, L325-328, L464-465, L687-694 |
| F-1 | P0 | `LegacyActionsBlock` 11 if 하드코딩 | 🔴 LIVE | `CheckoutDetailClient.tsx` L462-663 |
| F-2 | P0 | `meta.availableActions ?? canApprove` fallback | 🔴 LIVE | `CheckoutGroupCard.tsx` L215, L243 |
| F-3 | P1 | `currentStepIndex + 1` 호출부 계산 | 🔴 LIVE | `CheckoutDetailClient.tsx` L728-730; descriptor 타입에 `nextStepIndex` 없음 |
| F-4 | P2 | `RentalFlowInline` vs `NextStepPanel` 공존 | 🔴 LIVE | `CheckoutGroupCard.tsx` L71-134, L388-392; flag 기본값 false |
| P-1 | P0 | InboundTab 3 queries × 1 필터 | 🔴 LIVE | `InboundCheckoutsTab.tsx` L82-146 (3 useQuery) |
| P-2 | P1 | `equipmentRows` useMemo deps에 `t` | 🔴 LIVE | `CheckoutGroupCard.tsx` L195-220 |
| P-3 | P1 | `onCheckoutClick` 매 렌더 재생성 → memo miss | 🔴 LIVE | `OutboundCheckoutsTab.tsx` L444 inline arrow |
| P-4 | P2 | stagger 150 row 동시 | 🔴 LIVE | `CheckoutGroupCard.tsx` L465-466 (상한 없음) |
| P-5 | P2 | `pendingChecksCount` refetch 정책 | ✅ OK | 이미 `CHECKOUT_SUMMARY` preset 적용 (staleTime: SHORT + focus refetch) |
| C-1 | P0 | 목록 `meta ?? role` vs 상세 `can(Permission.*)` 불일치 | 🔴 LIVE | `CheckoutDetailClient.tsx` L114 vs `CheckoutGroupCard.tsx` L215 |
| C-2 | P1 | 목록 5단계 vs 상세 Stepper 8단계 | 🔴 LIVE | `CheckoutMiniProgress` stepCount.rental=5; Stepper uses `CHECKOUT_DISPLAY_STEPS.rental` len 8 |
| C-3 | P2 | 상세 페이지 D-day 배지 결여 | 🔴 LIVE | `CheckoutDetailClient.tsx` L851 raw date만 |

**총계**: LIVE 15건 · PARTIAL 1건 · FIXED 2건 · OK 1건. P0 잔존 4건.

**기존 harness 계약과의 매핑** (중복 작업 방지):

- `pr5-checkout-fsm-integration.md` — F-1, F-3과 겹침 (확장 필요)
- `checkout-fsm-backend.md` / `-hardening.md` / `-schemas.md` — F-2 서버 fail-closed와 겹침
- `empty-state-component.md` — L-3, V1 S4와 겹침
- `ux-polish-pr18.md` (완료) — V1 S1~S3 대부분 커버
- `pr14-workflow-timeline.md` — V1 S5, C-2와 겹침

→ 기존 계약은 확장/재개, 신규 작업만 새 contract 파일 생성.

---

## Sprint 1 — FSM Authority 단일화 (P0 Block)

> 리뷰가 "이게 안 되면 나머지는 사상누각"이라 명시. UX·Visual 개선은 이 후에.

### 1.1 · `resolveNextAction` isomorphic 함수 — `packages/schemas/src/fsm/checkout-fsm.ts`

현재 `NextStepDescriptor` 타입은 있지만 (L69-81), **단일 진입점 함수가 없다**. 서버(NestJS checkouts service)와 클라이언트(`useCheckoutNextStep`, `useCheckoutGroupDescriptors`)가 같은 규칙을 각자 구현 중.

- **입력**: `(status, purpose, role, dueAt, serverHints?)` → `NextStepDescriptor`
- **SSOT**: enum은 `@equipment-management/schemas`의 `CheckoutStatus`, `CheckoutPurpose`. Role은 `UserRole`.
- **서버**: checkouts service가 응답 직렬화 시 `meta.availableActions`/`meta.nextStep` 채움 — `resolveNextAction` 실행본을 import.
- **클라**: 훅 2개가 모두 동일 함수 경유. 서버 힌트가 있으면 그대로 사용, 없으면(401 직후 등) 클라 실행.
- **테스트**: 전수 테이블 (status 13 × purpose 4 × role 4 = 208 조합). `satisfies Record<CheckoutStatus, Record<CheckoutPurpose, Record<UserRole, NextStepDescriptor>>>`로 컴파일 시점 누락 검증.
- **확장성 가드**: MEMORY.md `project_76_tech_debt_0420b_20260421`의 `versions` 캐시 키 패턴과 연계, 새 상태 추가 시 touch 지점 7곳 → 1곳.

### 1.2 · `NextStepDescriptor` 필드 확장 — `nextStepIndex` + phase 정보

호출부(`CheckoutDetailClient.tsx` L728-730, `CheckoutStatusStepper.tsx` L54-56)에서 `currentStepIndex + 1` 계산을 **descriptor 내부로 이관**. 동시에 Sprint 4.4의 Phase-based 표기를 위한 phase 필드도 함께 추가.

- `schemas/fsm/checkout-fsm.ts` 필드 추가:
  - `nextStepIndex: number | null` (기존 currentStepIndex + 1 계산을 SSOT화)
  - `phase: RentalPhase | null` (APPROVE / HANDOVER / RETURN; non-rental은 null)
  - `phaseIndex: number | null` (0/1/2)
  - `totalPhases: number | null` (rental=3, non-rental=null)
- `resolveNextAction`: `computeNextStepIndex(status, purpose)`, `getRentalPhase(status)`, `getPhaseIndex(status)` 호출.
- Stepper/Timeline 호출부: `+1` 삭제, `descriptor.nextStepIndex ?? undefined` 사용.
- UI는 phase 필드 기반으로 "Phase 1/3 · 승인" 렌더 (Sprint 4.4).
- `satisfies Record<CheckoutStatus, RentalPhase>`로 매핑 누락 컴파일 타임 검증.

### 1.3 · 서버 `meta.availableActions` fail-closed 전환

- **Before**: `canApproveItem: checkout.meta?.availableActions?.canApprove ?? canApprove` (2곳: L215, L243).
- **After**: `canApproveItem: checkout.meta?.availableActions?.canApprove ?? false` — 서버가 안 채우면 기본 숨김.
- **보장**: 서버 `CheckoutSerializer`가 모든 응답에서 `availableActions`를 반드시 populate (DTO 레벨 제네릭 guard). 이게 깨지면 목록의 승인 버튼이 안 뜨므로 배포 전 E2E에서 즉시 검증됨.
- **role 기반은 optimistic hint**: 로딩 전 flash-of-disabled-ui 방지용으로만, 보안 결정에서는 제거.
- **E2E**: `apps/frontend/tests/e2e/features/checkouts/`에 fail-closed 시나리오 추가 — 서버 meta 누락 시 버튼이 렌더되지 않는지.

### 1.4 · `LegacyActionsBlock` 제거 + `isNextStepPanelEnabled()` default ON

- `CheckoutDetailClient.tsx` L462-663의 11-if 블록 삭제.
- `checkout-flags.ts`의 `isNextStepPanelEnabled` 기본값 `true`로 전환, 이후 마일스톤에 flag 제거.
- 렌더 경로는 **NextStepPanel 하나**로 수렴. descriptor가 null이면 null 렌더.
- 이동한 로직(취소/조건확인/QR 드로어 등 action label): `resolveNextAction`의 `labelKey`/`actionKind`로 표현 가능한지 검증. 표현 불가 케이스는 descriptor 확장.

### 1.5 · Exhaustive table 선언 — `satisfies`

- `CHECKOUT_MINI_PROGRESS.statusToStepIndex`, `stepCount`, `CHECKOUT_STATUS_BADGE_TOKENS`, `CHECKOUT_DISPLAY_STEPS.nonRental/.rental` 모두 `satisfies Record<CheckoutStatus, ...>`로 강제.
- 현재 `as Partial<Record<string, number>>` (checkout.ts L223-237)로 느슨한 선언 → 누락이 런타임까지 살아남음.
- 새 상태(예: `IN_TRANSIT`) 추가 시 컴파일 오류로 즉시 발견.

### Sprint 1 검증
- `pnpm tsc --noEmit` 통과.
- `.claude/skills/verify-checkout-fsm/` — Step 추가: "LegacyActionsBlock 부재", "resolveNextAction 호출 경로 단일", "fail-closed 검증".
- E2E: rental 2-step + non-rental 전 상태 시나리오 (이미 존재하는 `rental-2step-e2e-pr13.md` 확장).
- Backend unit test: `resolveNextAction` 208 조합 table test.

---

## Sprint 2 — Token Layer 봉합 (L-2~L-8 · V1 S4 · §9 일부)

> 기계적 치환 중심. 신규 토큰 3개 + 기존 토큰 확장 4개. MEMORY.md의 `feedback_no_fabricate_domain_data`·`verify-design-tokens` 스킬 준수.

### 2.1 · `getPurposeBarClass` — `return_to_vendor` 포함 SSOT 이관
- 현재 `CheckoutGroupCard.tsx` L297-304에서 토큰 참조는 하지만 `return_to_vendor` 케이스가 `purposeBar` 객체에 누락.
- **Fix**: `checkout.ts` L893-899의 `purposeBar`에 `return_to_vendor` 추가. 헬퍼는 `checkout.ts`의 `getCheckoutRowClasses` 옆으로 이전. 컴포넌트는 `getPurposeBarClass(row.purpose)` 한 줄만.
- Exhaustive: `satisfies Record<CheckoutPurpose, string>`.

### 2.2 · `CHECKOUT_YOUR_TURN_BADGE_TOKENS.summary` 신설 (L-2)
- `lib/design-tokens/components/checkout-your-turn.ts`에 `summary` variant (색/두께/간격) 추가.
- `CheckoutGroupCard.tsx` L398-404의 raw `text-xs text-brand-info font-medium shrink-0` 제거.

### 2.3 · i18n 키 `emptyState.overdueClear` 추가 (L-3)
- `apps/frontend/messages/ko.json` + `en.json`에 `emptyState.overdueClear.title` / `.description` 추가.
- `OutboundCheckoutsTab.tsx` L363-365의 한글 리터럴 제거, `t()` 경유.
- MEMORY.md의 "en i18n 누락 3키"처럼 양 로케일 동시 추가.

### 2.4 · `CHECKOUT_TAB_BADGE_TOKENS.alert` variant 추가 (L-4)
- 현재 `active`/`inactive`만. `alert` 추가(red 계열).
- `CheckoutsContent.tsx` L283의 raw `bg-destructive px-1.5 py-0.5` 제거.

### 2.5 · `SECTION_RHYTHM_TOKENS.tight` 일괄 적용 (L-5)
- `mb-3`/`mb-4`/`mb-5` 혼용 → 단일 토큰.
- 검증: `.claude/skills/verify-design-tokens/` skill로 raw `mb-\d+` grep 차단.

### 2.6 · `FOCUS_TOKENS.ringCurrent` 신설 (L-6)
- `lib/design-tokens/primitives.ts` 또는 `semantic.ts`에 `ringCurrent`(ring-2 + ring-offset-2) 토큰.
- `checkout.ts` L364 Stepper current 노드, HeroKPI active ring, Stats card active 3곳이 공용.
- MEMORY.md `ring-dashed CSS utility` 패턴처럼 box-shadow 충돌 주의.

### 2.7 · `CHECKOUT_INBOUND_SECTION_TOKENS.container`에 `pl-4` 흡수 (L-7)
- 현재 `'space-y-3'`만. `'space-y-3 pl-4'`로 통합.
- `InboundCheckoutsTab.tsx` L246/L300/L418의 수동 `'pl-4'` 삭제.
- border-l-4와 pl-4는 항상 동반되므로 토큰이 둘을 같이 관리.

### 2.8 · `@deprecated` 토큰 실제 제거 + `eslint-plugin-deprecation` (L-8)
- `RENTAL_FLOW_INLINE_TOKENS`, `MINI_PROGRESS_STEPS`, `inProgress`, `CHECKOUT_STATS_CHECKED_OUT/RETURNED` 제거.
- 호출부 있으면(=F-4 `RentalFlowInline`이 RENTAL_FLOW_INLINE_TOKENS 쓰면) Sprint 4와 연동(삭제 시점 일치).
- `apps/frontend/package.json` + root에 `eslint-plugin-deprecation` 추가, `.eslintrc.*`에 `deprecation/deprecation: "error"`.
- MEMORY.md `feedback_pnpm_overrides_caret`대로 caret 버전 고정.

### Sprint 2 검증
- `pnpm tsc --noEmit` + `pnpm lint`.
- `.claude/skills/verify-design-tokens/`에 신규 raw class grep 차단 규칙 추가.
- `.claude/skills/verify-hardcoding/`에 i18n 하드코딩 한글 차단 규칙 적용.
- Visual diff: Storybook(있다면) 또는 Playwright screenshot으로 Before/After 비교.

---

## Sprint 3 — Perf & Cache Boundary (P-1~P-4 · §3)

### 3.1 · Backend BFF endpoint: `/inbound-overview` (P-1, P0)

- NestJS `checkouts` 모듈에 `GET /checkouts/inbound-overview` 추가 (또는 `equipment-imports` 모듈로 배치).
- 응답: `{ standard: {...}, rental: {...}, internalShared: {...}, sparkline: number[] }`.
- 페이지네이션이 섹션별 독립이면 `offset`을 섹션별 query param으로.
- RBAC: 기존 `PermissionsGuard` + `@RequirePermissions(Permission.VIEW_CHECKOUTS)`.
- `PermissionsGuard` 기본 DENY 정책 (MEMORY.md) 준수.
- Response caching: Redis 있으면 team별 30s TTL.
- 프론트: `InboundCheckoutsTab.tsx`에서 3 useQuery → 1 useQuery. 섹션별 내부 state 유지는 OK.

### 3.2 · `queryKeys.checkouts.view.* / resource.*` 재편 (§3 권장)

현재 (`apps/frontend/lib/api/query-config.ts` L500-514):
```
checkouts.all, .list, .detail, .outbound, .inbound, .destinations, .pending, .pendingCount, .summary
```

재편 후:
```
queryKeys.checkouts.view.outbound(filters)
queryKeys.checkouts.view.inboundOverview(filters)      ← 새 BFF
queryKeys.checkouts.view.inboundSection(kind, { filters, page })
queryKeys.checkouts.resource.detail(id)
queryKeys.checkouts.resource.pendingCount()
queryKeys.checkouts.resource.destinations()
queryKeys.checkouts.resource.summary({ direction, teamId })
```

- `invalidateQueries({ queryKey: [...checkouts.view] })` 한 줄로 목록군 전체 무효화.
- MEMORY.md `buildDetailCachePattern SSOT`, `CACHE_EVENTS 분리`와 정합.
- Cache event listener는 새 키 패턴에 정규식 매칭 — MEMORY.md `feedback_cache_key_json_sorted` 규칙 준수 (필드 순서 의존 금지).

### 3.3 · `useMemo` deps 정리 — `t` 제거 (P-2)
- `CheckoutGroupCard.tsx` L195-220 `equipmentRows` deps에서 `t` 제거.
- 내부 `t('groupCard.unknownUser')` 1회 호출 → `const UNKNOWN_USER_KEY = 'groupCard.unknownUser';` 상수화 후 `t(UNKNOWN_USER_KEY)`는 useMemo 바깥 `const unknownUserLabel = t(UNKNOWN_USER_KEY);`로 뽑고 row.map 내부에서 참조.

### 3.4 · memo boundary 보강 (P-3)
- `OutboundCheckoutsTab.tsx` L444 inline arrow → `const handleCheckoutClick = useCallback((id) => router.push(FRONTEND_ROUTES.CHECKOUTS.DETAIL(id)), [router]);`.
- `canApprove` 계산을 상위 useMemo로 1회만.
- `CheckoutGroupCard`의 memo는 유지.
- React DevTools Profiler로 before/after 렌더 횟수 비교 (검증).

### 3.5 · stagger 12행 상한 + `prefers-reduced-motion` (P-4)
- `CheckoutGroupCard.tsx` L465-466: `staggerFadeInItem` 적용 조건 `rowIndex < 12`.
- `getStaggerFadeInStyle` 내부에서 `matchMedia('(prefers-reduced-motion: reduce)')` 확인, true면 style 반환 skip.
- Storybook 또는 devtools에서 150 row 대형 그룹 성능 측정.

### Sprint 3 검증
- Network tab: InboundTab 필터 변경 1회 = 1 request 확인.
- Profiler: `CheckoutGroupCard` memo hit rate 측정.
- `.claude/skills/verify-cache-events/`로 event/cache key 일관성 확인.
- E2E: 목록 대량 렌더 (150+ row) 페이지 로드 시간 회귀 가드.

---

## Sprint 4 — UX Flow (V1 §1~§3, §5 · V2 §7 · §8)

> V1 리뷰의 5섹션 중 이미 87차에 커버된 것: yourTurnBadge 승격(S2), ux-polish-pr18(S1 일부). 잔존: 3-zone 리레이아웃의 미완성, Rental 3-chunk 타임라인, Empty state variant 톤 분리, 편의성 12가지 중 선별.

### 4.1 · `NextStepPanel` 단일 렌더 (목록 Zone 3 + 상세 Hero · C-1 연계)

- Sprint 1의 FSM 단일화 완료 후, `RentalFlowInline` 컴포넌트 제거 (F-4 해소).
- 목록 Zone 3(행 우측)과 상세 Hero가 모두 `<NextStepPanel descriptor={...} variant="compact|hero" />`.
- V2 §7 Before/After: 행 우측은 **primary 1개 + overflow menu**로 축약. "승인 대기"·"내 차례"·"D-3"가 한 줄로 요약.
- V1 S3의 actor variant(requester/approver/receiver)는 `descriptor.actor` 필드가 있으면 색/테두리/아이콘으로 자동 분기. 이미 `WORKFLOW_PANEL_TOKENS`가 있으므로 `.actor` sub-tree 추가.

### 4.2 · 행(Row) 3-zone grid 재구조화 (V1 S1)

- `CheckoutGroupCard.tsx` row container를 `grid-cols-[3px_72px_1fr_auto]` 4-zone (V1 S1 제안).
- Zone 1: purposeBar (3px)
- Zone 2: **status pill + D-day** (72px)
- Zone 3: identity (장비명 + meta) (flex)
- Zone 4: action cell (primary CTA + overflow) (auto)
- MiniProgress는 Zone 4 내부 `title="3/4"` 7×7 tooltip 버튼으로 강등 (V1 S1 권고).
- `staggerFadeInItem` + rowIndex 상한 규칙(Sprint 3.5)과 결합.
- E2E: 키보드 focus order 검증, a11y `role="row"` 준수.

### 4.3 · 상세 페이지 D-day 배지 (C-3)

- `CheckoutDetailClient.tsx` 헤더 우측에 `<DdayBadge daysRemaining={...} />`.
- `getDdayClasses` + `formatDday`를 shared util로 유지 (이미 목록이 쓰는 것).
- 기한 초과 row의 배경 `bg-brand-critical/5` (V1 S1)처럼 상세 배너도 동일 토큰.

### 4.4 · Rental 8-step → **Phase-based 표기 전면 통일** (V1 S5 + V2 §7 Expanded · C-2 해소)

> **의미 매핑 결정 (사용자 확정)**: 목록과 상세 모두 **Phase 개념을 1차 표기**로 사용. "같은 수치를 다른 뜻으로 쓰지 않는다"는 C-2 원칙을 유지하면서, 목록은 phase로 요약하고 상세에서 step으로 하이퍼링크.

#### 4.4.1 · Rental Phase 모델 정의 (schemas)
- `packages/schemas/src/fsm/checkout-fsm.ts`에 `RentalPhase` enum 신설:
  - `APPROVE` — `[PENDING, BORROWER_APPROVED, APPROVED]` (승인)
  - `HANDOVER` — `[LENDER_CHECKED, BORROWER_RECEIVED]` (반출·인수)
  - `RETURN` — `[IN_USE, BORROWER_RETURNED, RETURN_APPROVED]` (반납)
- 매핑 함수 `getRentalPhase(status: CheckoutStatus): RentalPhase` + `getPhaseIndex(status)` (0-based) + `getStepsInPhase(phase)`.
- `satisfies Record<CheckoutStatus, RentalPhase>`로 누락 검증.
- `NextStepDescriptor` 확장: `phase: RentalPhase | null`, `phaseIndex: number | null` (0-based, 0/1/2), `totalPhases: number | null` (rental=3, non-rental=null) — Sprint 1.2의 `nextStepIndex`와 함께 추가.

#### 4.4.2 · 목록(List) — `CheckoutMiniProgress` → `CheckoutPhaseIndicator` 재구성
- 기존 `CheckoutMiniProgress.tsx`의 stepCount.rental=5는 제거.
- 신규 컴포넌트 `CheckoutPhaseIndicator.tsx` (rental 전용):
  - 표기: **"Phase 1/3 · 승인 진행 중"** (또는 짧은 형태 "1/3 · 승인")
  - 3개 phase dot (완료=ok 색, 진행중=info 색+ring, 대기=neutral)
  - `aria-label`: "현재 승인 단계 (3단계 중 1단계)"
- Non-rental(교정/수리)은 `CheckoutMiniProgress` 기존 "3/5" step 표기 **유지** — 5단계 표기가 혼동 소지 없고 Rental만의 8-step 복잡성이 없으므로.
- `RentalFlowInline` 제거 (Sprint 4.1 + F-4 연계) — `NextStepPanel variant="compact"`가 대체.

#### 4.4.3 · 상세(Detail) — Phase-based `WorkflowTimeline` + Drill-down 8-step
- `WorkflowTimeline.tsx`를 phase 접힘/펼침 구조로 재작성:
  - **기본 상태**: 3개 phase card (완료/진행중/대기). 진행중 phase만 내부 step 펼침. 완료 phase는 "3/3 완료 · 단계 보기" 링크. 미래 phase는 "3단계 대기".
  - **"전체 단계 보기" 버튼 클릭 시**: Rental 8-step expanded Stepper 표시 (기존 `CheckoutStatusStepper.tsx`의 rental 분기 재활용).
- `aria-expanded` + `aria-controls` + 키보드 조작 (Space/Enter로 phase 토글).
- 반응형: 모바일(<480px) `pl-9`, 태블릿 `md:pl-11`, 데스크톱은 가로 phase grouping 시 `lg:grid-cols-3` 병렬 배치.

#### 4.4.4 · 토큰 & 네이밍
- `lib/design-tokens/components/checkout-timeline.ts`의 `CHECKOUT_DISPLAY_STEPS.rental`은 8-step 그대로 유지(상세 expanded용).
- 신규 토큰 `CHECKOUT_RENTAL_PHASE_TOKENS`: `container`, `header` (phase 제목 + count), `stepItem`, `collapsedSummary`, `expandBtn`. MEMORY.md의 `82차 PR-3 Design Token Layer 2`와 정합.
- i18n 키: `rentalPhase.approve.label`, `rentalPhase.handover.label`, `rentalPhase.return.label` + `rentalPhase.xOfY` ("Phase {current}/{total}") — ko/en 동시.

#### 4.4.5 · 검증
- E2E: rental 생성 → PENDING 시 목록 "Phase 1/3 · 승인", 상세 접힘 phase card 3개 중 1st만 펼침. BORROWER_APPROVED 진행 시 여전히 1/3. APPROVED 완료 시 2/3로 전환, handover phase 펼침.
- a11y: axe-core, keyboard 전용 네비게이션으로 phase 토글 가능 여부.
- `review-design` skill: "information density" 스코어 전후 비교.

### 4.5 · 편의성 마이크로 UX **U-01 ~ U-12 전체 12건 완전 구현** (V2 §8)

> 사용자 지시: "타협하지 말고 누락시키지 말 것". 12개 모두 이 계획 범위에 포함. 각 항목은 Sprint 4 내 세부 PR로 분리 가능.

#### 4.5.1 · U-01 · 일괄 승인 · 단축키 A
- **기존 자산 재활용**: MEMORY.md `tech-debt-tracker Rev2`의 `useRowSelection`/`BulkActionBar` 승격분.
- 그룹 헤더에 체크박스 (부분 선택 indeterminate 지원). 선택 N건 → 하단 스티키 `BulkActionBar`에 "N건 승인 · 반려".
- 단축키 `A` = 전체 선택, `Shift+A` = 선택 해제. 서버: backend checkouts에 `POST /checkouts/bulk-approve` (기존 단일 approve 엔드포인트 N회 호출 vs 트랜잭션 일괄 — 트랜잭션 권장). CAS 버전은 개별 row별 체크.
- 승인 모달 1회: 이유 공통 입력 옵션 + 각 건별 실패 처리(일부 실패 시 성공 건만 반영, 실패 목록 표시).
- `PermissionsGuard`: `Permission.APPROVE_CHECKOUT` 요구.

#### 4.5.2 · U-02 · 전역 단축키 + `?` 치트시트
- 신규 `apps/frontend/hooks/use-keyboard-shortcuts.ts` + `KeyboardShortcutsContext`.
- 목록에서: `J`/`K` 행 상/하, `Enter` 상세 진입, `/` 검색 포커스, `F` 필터 sidebar 토글, `G G` 맨 위, `G E` 끝.
- 상세에서: `Y` 승인, `N` 반려, `Q` QR drawer, `Esc` 뒤로.
- `?` 전역 치트시트 모달 (shadcn `Dialog`). 모든 단축키 role별 그룹핑.
- IME/입력 포커스 상태 감지 (input/textarea/contenteditable 내에서는 단축키 비활성).
- `prefers-reduced-motion` 환경에서도 동작.
- 단축키 목록 설정 화면(`/settings/shortcuts`)에서 커스터마이즈 가능(후속 백로그로 표기).

#### 4.5.3 · U-03 · 필터 Sticky + Saved Views
- `OutboundCheckoutsTab` / `InboundCheckoutsTab` / `CheckoutsContent`의 필터 바에 `sticky top-[var(--sticky-header-height)]` 적용 (MEMORY.md의 `--sticky-header-height` CSS 변수 + ResizeObserver 패턴 재사용).
- Saved views는 URL + localStorage 하이브리드:
  - **시스템 기본 뷰** (filter chip toolbar): "내 차례 N" / "기한 초과 N" / "이번 주 반납 N" — 서버 집계(`queryKeys.checkouts.view.savedViewCounts` 신설) 경유.
  - **사용자 커스텀 뷰**: "이름 저장하기" → localStorage에 `{ label, filters, sort }` 저장. 최대 5개, 드래그 정렬.
- 뷰 전환 시 URL 쿼리파람 업데이트(MEMORY.md "Filter SSOT: URL 파라미터가 유일한 진실의 소스" 준수).

#### 4.5.4 · U-04 · 인라인 반려 사유 + 프리셋
- 현재: 반려 시 모달 오픈.
- 신규: 목록 행에서 "반려" 클릭 시 행 아래로 `<ReturnReasonInline />` expand.
- 프리셋 버튼 (clickable chips) 3~5개: "일정 부적합", "기기 점검 중", "서류 미비", "중복 신청", "+ 직접 입력".
- 프리셋은 서버 config(`/checkouts/rejection-presets` 또는 기존 settings 모듈)에서 role별 로드 — 하드코딩 금지(MEMORY.md `feedback_no_fabricate_domain_data` 준수).
- 키보드: Esc 취소, Ctrl+Enter 전송.
- 모바일에서는 full-screen sheet(drawer)로 fallback.

#### 4.5.5 · U-05 · Undo 토스트 (5초)
- 승인/반려 직후 `sonner` 토스트 + "실행 취소 (5s)" CTA.
- 기존 `useOptimisticMutation`에 `undoWindowMs: 5000` 옵션 추가.
- Optimistic UI: 즉시 row 상태 전환 + 5초 후 서버 확정. 5초 내 Undo 클릭 시 서버 호출 취소(AbortController).
- 이미 서버에 커밋된 경우: 보상 트랜잭션 `POST /checkouts/:id/revoke-approval` (승인자 == 자신이고 5분 이내) — 서버 supported인지 Sprint 1 FSM 설계 시 합류.
- a11y: `role="status"` `aria-live="polite"`, Esc로 토스트 dismiss.

#### 4.5.6 · U-06 · QR 한 번에 꺼내기
- 상세 페이지 우상단 고정 버튼 `<QrDrawerTrigger />`. 기존 `HandoverQRDisplay.tsx` 재활용.
- 버튼 클릭 시 full-height right drawer (shadcn `Sheet`)로 QR 렌더 — 페이지 전환 없음.
- 단축키 `Q` (또는 `Alt+Q`). 모바일에서는 bottom-sheet.
- MEMORY.md `feedback_qr_is_path_not_workflow` 준수: QR 전용 새 워크플로우 금지, 기존 checkout 서비스로만 연결.

#### 4.5.7 · U-07 · 돌아가기 컨텍스트 보존
- 상세 → 목록 복귀 시 필터/페이지/스크롤 위치 복원.
- URL query string에 필터/페이지 이미 저장(MEMORY.md "URL 파라미터가 유일한 진실의 소스").
- 스크롤 복원: Next.js App Router 기본은 scroll-top. `scroll={false}`로 link 수정 + 상세 진입 시 `history.state`에 scrollTop 저장, 복귀 시 `window.scrollTo()`.
- 진입한 row에 `data-checkout-id`로 anchor → hash fragment `#row-183`로 highlight + scrollIntoView.
- Next.js 16 proxy 규약(MEMORY.md의 Rule 4) 하에서 검증.

#### 4.5.8 · U-08 · Destination 자동완성 + 최근 목록
- 반출 신청 폼의 destination 필드: 기존 `queryKeys.checkouts.destinations`(또는 `resource.destinations` 재편 후) 재활용.
- 초기 상태: "최근 3개" (로그인 유저 기준 MRU 3건, 서버가 `/checkouts/destinations/recent?userId` 제공 — backend 신설).
- 타이핑 시: full-text + fuzzy (Fuse.js 또는 command-k 패턴). combobox role + keyboard navigation (`↑↓ Enter`).
- 팀 목적지와 외부 목적지 그룹핑 (shadcn `Command` → `CommandGroup`).
- 빈 검색 결과 시 "+ 새 목적지 추가" 옵션.

#### 4.5.9 · U-09 · Due-date 공감각 색온도
- `apps/frontend/lib/utils/dday-colors.ts` 신설 또는 기존 `getDdayClasses` 확장.
- 6단계 gradient:
  - `D-7+` neutral (`bg-ink-100 text-ink-600`)
  - `D-6 ~ D-4` info tint (`bg-brand-info/10 text-brand-info`)
  - `D-3 ~ D-1` warning (`bg-brand-warning/10 text-brand-warning`)
  - `D-0` orange 강조 (`bg-orange-500 text-white`)
  - `D+1 ~ D+3` critical (`bg-brand-critical/15 text-brand-critical`)
  - `D+4+` pulse critical (`bg-brand-critical text-white motion-safe:animate-pulse`)
- CSS 변수로 각 단계 정의 → 다크모드 자동 전환(MEMORY.md brand color migration 패턴).
- 색뿐 아니라 숫자 + 아이콘(경고)로도 전달 (WCAG: 색만으로 정보 전달 금지).

#### 4.5.10 · U-10 · Optimistic UI + Skeleton ≠ Spinner
- 승인 즉시 row 상태 전환 (→ `CHECKED_OUT` 등 다음 상태로). 기존 `useOptimisticMutation` 패턴.
- 실패 시 자동 롤백 + destructive 토스트 ("승인 실패 · 네트워크 확인").
- 로딩은 skeleton만 (`CheckoutGroupCardSkeleton`, `CheckoutListSkeleton` 이미 존재). 전역 spinner 금지.
- CAS 409 발생 시: MEMORY.md "CAS 409 발생 시 backend detail 캐시 반드시 삭제" 준수, refetch + 재시도 안내 토스트.
- Sprint 3.5 stagger 상한과 함께 저사양 기기 감지 (optional, matchMedia 기반).

#### 4.5.11 · U-11 · 전역 nav "내 차례 N" 배지
- 기존 sidebar의 "반출입" 메뉴에 badge 추가.
- 숫자 source: 기존 `queryKeys.checkouts.resource.pendingCount()` 활용 — 이미 `CHECKOUT_SUMMARY` preset(staleTime SHORT + refetchOnWindowFocus)으로 aggressive 갱신(P-5 OK).
- 클릭 시 `/checkouts?view=yourTurn` — saved view 경유.
- 0건이면 배지 숨김. 10+는 "9+" 표시.
- `aria-label="내 차례 반출 N건 대기 중"`.
- SSE 실시간 업데이트(MEMORY.md의 CRITICAL refetch strategy 30s) — 선택적(backend notification module 협업).

#### 4.5.12 · U-12 · Empty/Error의 인간적인 복구 경로
- 모든 empty state는 최소 1개의 행동 제안 포함 — 막다른 골목 금지.
- Sprint 5.1의 variant 3색 분리와 통합:
  - `noneYet`: "반출 요청" CTA + "가이드 보기" 링크
  - `noPermission`: "관리자에게 요청" CTA + 현재 역할 표시
  - `noFilterResult`: active filter chip 표시 + "필터 초기화" + "신청하기" dual CTA
  - `error`: "다시 시도" + "에러 신고" (Sentry 통합)
  - `network`: 오프라인 상태 감지 + "재연결 시 자동 복구"
- 모든 empty/error 화면에 keyboard focus trap 없이 Esc/Tab으로 자연 이동 보장.
- i18n: ko/en 전체 키 추가.

### Sprint 4 전반 검증
- Playwright E2E: rental Phase 표기 전환, 모든 편의성 12건 (role별 × 키보드별 × 모바일 breakpoint별).
- `.claude/skills/verify-workflows/`, `verify-frontend-state`, `verify-cache-events` 전부 통과.
- a11y: axe-core 0 위반, NVDA/VoiceOver 스크린리더 음성 흐름 체크.
- 편의성별 세부 E2E sub-suite (`tests/e2e/features/checkouts/suite-ux/u01-bulk.spec.ts` ~ `u12-empty.spec.ts`).
- `review-design` skill: 10 anti-pattern 스코어 전/후 비교 문서화.

### Sprint 4 검증
- Playwright E2E: 역할별 actor variant 스크린샷, Rental 3-phase 접힘/펼침, D-day 배지 역할별, 편의성 키보드 시나리오.
- a11y: axe-core로 aria-expanded/aria-controls 검증.
- `.claude/skills/verify-workflows/`에 step 추가.

---

## Sprint 5 — Visual Polish (V1 S4 · V2 §9)

> Contract 5종 작성 완료 (2026-04-24 90차):
> - 5.1 → `.claude/contracts/empty-state-variant-colors.md`
> - 5.2 → `.claude/contracts/typography-6-tier.md`
> - 5.3 → `.claude/contracts/color-semantic-5-axis.md`
> - 5.4 → `.claude/contracts/density-rhythm.md`
> - 5.5 → `.claude/contracts/icon-motion-policy.md`

### 5.1 · Empty state variant 3색 분리 (V1 S4)
- `CHECKOUT_EMPTY_STATE_TOKENS.variantIconBg`:
  - `noneYet: 'bg-brand-info/10 border border-brand-info/20'` — 초대
  - `noPermission: 'bg-ink-100 border border-ink-200'` — 차단 (차분, 현재 역할 표시)
  - `noFilterResult: 'bg-brand-warning/10 border border-brand-warning/20'` — 조절
- `noFilterResult` variant에 active filter chip 표시 + "전체 초기화" 버튼.

### 5.2 · Typography 6단계 (§9)
- Hero H: 22/28 semibold (페이지 타이틀)
- Action H: 18/24 semibold (NextStepPanel title)
- Row title: 14/20 semibold (현재 `text-sm`에서 승격 — 장비명 주체 승격)
- Body: 12.5/18
- Meta: 11.5/16
- Kicker: 10.5 uppercase tracking-[.12em]
- `TYPOGRAPHY_TOKENS`에 alias 추가, raw `text-xs`/`text-sm` 교체.

### 5.3 · Color semantic 5축 (§9)
- Neutral(Primary action, 텍스트) / Warning(My turn) / Critical(Overdue) / OK(Done) / Purple(Rental purpose 식별 전용).
- **원칙**: "Rental purple은 purpose 식별에만, 상태·CTA에 절대 사용 금지".
- 기존 brand token과 호환, 신규 색 없음.
- `verify-design-tokens` skill에 "purple은 purposeBar/purpose chip 외 사용 시 경고" 규칙.

### 5.4 · Density & rhythm (§9)
- 행 기본 64px cozy (타이틀 + 메타 2줄).
- 섹션 간 24px, 카드 간 12px, 행 간 0 (divider).
- `SECTION_RHYTHM_TOKENS` 단일화는 Sprint 2.5에서 완료.

### 5.5 · Icon & motion 규약 (§9)
- **Icon은 동사 앞에만**: 승인하기/반려하기/QR 발급/반입 처리/반출 시작. 상태 배지·필터 라벨·메타에는 아이콘 금지.
- **Motion 예산**:
  - 상태 전환 180ms ease-out
  - 패널 접힘/펼침 220ms ease-in-out
  - "내 차례" pulse 2s · 1회 · `prefers-reduced-motion` 존중
  - stagger row-in 40ms step, 12행까지 (Sprint 3.5 일치)

### Sprint 5 검증
- Storybook(있다면) 또는 Playwright screenshot 회귀.
- Lighthouse a11y/best practices 점수 유지.
- bundle-size gate (MEMORY.md `project_81_bundle_gate_20260424`): 신규 토큰으로 인한 First Load JS 증가 ≤ 2KB.

---

## 횡단 관심사 (All Sprints)

### 관측 (Observability)
- FE analytics: `time-to-action`(목록 표시 → primary CTA 클릭 median). 현재 ~14s 추정 → 목표 <5s (§10 metrics).
- 승인 후 철회율(cancel-after-approve) 측정 → Sprint 4 Undo 효과 검증.
- `pnpm --filter backend run` monitoring module 활용, 기존 audit log에 `availableActions` 결정 경로 남기기 (F-2 배포 후 일정 기간).

### i18n / 다크모드
- 모든 신규 copy는 ko + en 동시 추가 (MEMORY.md `feedback_senior_architectural_planning`).
- 다크모드: MEMORY.md의 "CSS 변수가 :root와 .dark 양쪽 정의" 원칙, `dark:` prefix 금지. 신규 토큰은 CSS variable layer에 추가.

### Feature flag / Rollback
- Sprint 1.4 flag default ON: `checkout-flags.ts`에 비중(percentage) 옵션. 초기 10% → 50% → 100% 단계. 
- `LegacyActionsBlock`은 flag 100% 후 최소 1 스프린트 유예 후 삭제.
- Sprint 3.1 BFF: 기존 3 쿼리 경로를 feature flag로 유지, canary.
- Rollback plan: 각 Sprint PR은 `revert` 가능한 단위(커밋/PR)로 분리. 기존 harness의 `pre-push` hook tsc+test는 유지.

### 보안 (F-2 해결 체크리스트)
- 서버 `CheckoutSerializer`가 `meta.availableActions`를 **모든** 응답에서 populate (타입 레벨 강제).
- `NestJS interceptor`에서 라우트별 populate 확인, 누락 시 500 대신 fail-closed 응답.
- Penetration test: 클라가 `availableActions: { canApprove: true }` 위조해 PATCH 보내도 서버가 재검증 (이미 `PermissionsGuard` + domain validation 순서 — MEMORY.md "보안 fail-close 순서"). E2E에 명시적 케이스 추가.

### 접근성 (a11y)
- `aria-expanded`/`aria-controls` (Rental phase chunk, overflow menu)
- `aria-live="polite"` (Undo 토스트)
- 키보드 포커스 순서 (J/K 네비게이션)
- 색만으로 상태 전달 금지 — D-day는 색 + 숫자 + 아이콘 3중 단서.
- WCAG 2.1 AA: 대비 4.5:1 (텍스트), 3:1 (UI component). 
- `prefers-reduced-motion` 전면 존중.

### Bundle-size gate (횡단)
- MEMORY.md `project_81_bundle_gate_20260424`의 `analyzerMode:json` baseline에 신규 토큰 추가 시 gzip/FirstLoadJS 증가 ±2KB 이내.
- Sprint 5는 특히 타이포 토큰 확장으로 JS 증가 위험 → 측정 필수.

### Self-Audit (MEMORY.md `feedback_pre_commit_self_audit`)
커밋 직전 7항목 스캔:
1. SSOT 경유 (enum/permission/queryKey)
2. 하드코딩 0 (URL/숫자/문자열)
3. `eslint-disable` 0
4. 접근성 (`aria-*`, focus-visible)
5. 워크플로 재사용 (`useOptimisticMutation`/`useRowSelection` 등)
6. `role` 리터럴 금지
7. `setQueryData` 금지 (onSuccess)

---

## 실행 순서 요약 & 타임라인

| Sprint | 내용 | 효과 크기 | 의존성 | 리스크 |
|--------|-----|---------|--------|-------|
| 1 | FSM Authority | L · high | schemas/ 패키지 먼저 | 회귀 테스트 비용 큼 → 208 table test 전제 |
| 2 | Token Layer | M · mechanical | Sprint 1 무관 (병행 가능) | 낮음 — 기계적 치환 |
| 3 | Perf & Cache | M · BFF 필요 | Sprint 1 + BE BFF 협업 | 중 — queryKey 재편 시 invalidate 회귀 가능 |
| 4 | UX Flow | L · broad | Sprint 1 완료 필수 | 중 — 키보드/a11y E2E 추가 |
| 5 | Visual Polish | S · polish | Sprint 2 완료 필수 | 낮음 — 토큰 alias 정리 |

Sprint 1을 먼저 하지 않으면 Sprint 4 UX 변경이 `LegacyActionsBlock` 위에 얹혀 중복 수정 강제됨. 이 순서는 비가역.

---

## 기존 harness 계약과의 합류 계획

| 기존 contract (`.claude/contracts/`) | 연관 Sprint | 조치 |
|-------------------------------------|----------|------|
| `pr5-checkout-fsm-integration.md` | 1.1, 1.4 | 확장 — resolveNextAction·LegacyActionsBlock 제거 추가 |
| `checkout-fsm-backend.md` / `-hardening.md` / `-schemas.md` | 1.2, 1.3 | 재개 — fail-closed + nextStepIndex 필드 |
| `empty-state-component.md` | 2.3, 5.1 | 완료 상태 확인 후 L-3 + variantIconBg 추가 |
| `pr14-workflow-timeline.md` | 4.4 | 확장 — Rental 3-phase chunking |
| `ux-polish-pr18.md` (완료) | 참고 | Sprint 4.2 3-zone 리레이아웃이 이어받음 |
| `design-token-layer2-expansion.md` | 2.6 | 확장 — FOCUS_TOKENS.ringCurrent 추가 |
| 신규 필요 | — | `token-layer-leak-l3-l8.md`, `inbound-bff-overview.md`, `perf-memo-boundary.md`, `ux-bulk-undo-keyboard.md`, `visual-density-rhythm.md` |

---

## 사용자 확정 결정 (2026-04-24)

1. **Sprint 범위**: Sprint 1 ~ 5 전체 (Authority → Tokens → Perf → UX → Visual). 권고 순서 그대로 합류.
2. **BFF 포함**: Sprint 3.1의 `/inbound-overview` 엔드포인트 **backend 신설 포함**. 3 round-trip → 1 request.
3. **C-2 매핑**: **Phase-based '1/3 phase'**. 목록/상세 모두 phase를 1차 표기, 상세는 drill-down 8-step.
4. **편의성 범위**: **U-01 ~ U-12 전체 12건 모두 포함**. 누락 금지.
5. **`LegacyActionsBlock` 제거 타이밍**: flag default ON 후 1 스프린트 유예 (릴리즈 안정성). 기본값 true로 이미 커버되므로 즉시 삭제해도 무방하지만 관측 데이터 수집 후 안전 제거.

---

## 주요 파일 수정 인벤토리

### 생성/수정 (Sprint 1)
- `packages/schemas/src/fsm/checkout-fsm.ts` — `resolveNextAction`, `NextStepDescriptor.nextStepIndex`
- `apps/backend/src/modules/checkouts/checkouts.service.ts` (또는 serializer) — `availableActions` populate 보증
- `apps/frontend/hooks/use-checkout-next-step.ts`, `use-checkout-group-descriptors.ts` — 공용 함수 경유
- `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx` — LegacyActionsBlock 삭제 (L462-663)
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` — `?? canApprove` → `?? false` (L215, L243)
- `apps/frontend/lib/checkout-flags.ts` — default ON
- `apps/frontend/components/checkouts/CheckoutStatusStepper.tsx` — `+1` 제거 (L54-56)
- `apps/frontend/lib/design-tokens/components/checkout.ts` — `satisfies` 전환 (L223-237 등)

### Sprint 2
- `apps/frontend/lib/design-tokens/components/checkout-your-turn.ts` (+summary)
- `apps/frontend/lib/design-tokens/components/checkout.ts` (purposeBar, tab-badge.alert, ring-offset 제거)
- `apps/frontend/lib/design-tokens/semantic.ts` (FOCUS_TOKENS.ringCurrent)
- `apps/frontend/messages/ko.json` + `en.json` (emptyState.overdueClear)
- `apps/frontend/components/checkouts/OutboundCheckoutsTab.tsx` (한글 리터럴 제거, mb-* 단일화)
- `apps/frontend/components/checkouts/InboundCheckoutsTab.tsx` (pl-4 흡수)
- `apps/frontend/components/checkouts/CheckoutsContent.tsx` (raw bg-destructive 제거, SECTION_RHYTHM 적용)
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` (L398-404 raw class 제거)
- `apps/frontend/package.json` + `.eslintrc.*` (+eslint-plugin-deprecation)

### Sprint 3
- `apps/backend/src/modules/checkouts/checkouts.controller.ts` + service (`/inbound-overview`)
- `apps/frontend/lib/api/query-config.ts` (view.*/resource.* 재편)
- `apps/frontend/components/checkouts/InboundCheckoutsTab.tsx` (3 → 1 useQuery)
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` (useMemo deps 정리, stagger 상한)
- `apps/frontend/components/checkouts/OutboundCheckoutsTab.tsx` (onCheckoutClick useCallback)

### Sprint 4
- `packages/schemas/src/fsm/checkout-fsm.ts` (RentalPhase enum + getRentalPhase + getStepsInPhase + satisfies 강제)
- `apps/frontend/components/checkouts/NextStepPanel.tsx` (variant + actor 분기 · phase 필드 렌더)
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` (3-zone grid, RentalFlowInline 제거, CheckoutPhaseIndicator 삽입)
- `apps/frontend/components/checkouts/CheckoutPhaseIndicator.tsx` (신규 — rental 전용 "Phase 1/3 · 승인")
- `apps/frontend/components/checkouts/CheckoutMiniProgress.tsx` (rental 분기 제거, non-rental 전용화)
- `apps/frontend/components/checkouts/WorkflowTimeline.tsx` (Phase-based 접힘/펼침 + drill-down 8-step)
- `apps/frontend/components/checkouts/CheckoutStatusStepper.tsx` (+1 계산 제거, descriptor.nextStepIndex 사용)
- `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx` (LegacyActionsBlock 삭제 · DdayBadge · Hero 통합 · QR drawer trigger · Undo 토스트)
- `apps/frontend/hooks/use-keyboard-shortcuts.ts` (신규 U-02 — J/K/Enter/Y/N/Q/Esc/?)
- `apps/frontend/components/shared/KeyboardShortcutsCheatsheet.tsx` (신규 U-02)
- `apps/frontend/components/checkouts/BulkActionBar.tsx` + `useRowSelection` 확장 (U-01 · 기존 SSOT 재활용)
- `apps/frontend/components/checkouts/ReturnReasonInline.tsx` (신규 U-04 · 프리셋 chip)
- `apps/frontend/components/checkouts/SavedViews.tsx` (신규 U-03 · URL + localStorage)
- `apps/frontend/components/checkouts/DestinationCombobox.tsx` (신규 U-08 · recent + fuzzy)
- `apps/frontend/components/checkouts/QrDrawerTrigger.tsx` + `HandoverQRDisplay` 재사용 (U-06)
- `apps/frontend/lib/utils/dday-colors.ts` (U-09 · 6단계 색온도)
- `apps/frontend/hooks/use-optimistic-mutation.ts` (undoWindowMs 옵션 · U-05)
- `apps/frontend/components/layout/SidebarNav.tsx` (nav "내 차례 N" 배지 · U-11)
- `apps/frontend/messages/ko.json` + `en.json` (편의성 12건 전체 i18n 키 + rentalPhase.*)
- `apps/backend/src/modules/checkouts/checkouts.controller.ts` (+ service): `POST /checkouts/bulk-approve`, `POST /checkouts/:id/revoke-approval` (U-01, U-05), `GET /checkouts/destinations/recent` (U-08), `GET /checkouts/rejection-presets` (U-04)

### Sprint 5
- `apps/frontend/lib/design-tokens/components/checkout-empty-state.ts` (variantIconBg 3색)
- `apps/frontend/lib/design-tokens/semantic.ts` (TYPOGRAPHY_TOKENS alias, SEMANTIC_COLORS 원칙 주석)
- 다수 컴포넌트 className 정리 (raw → token)

---

## 검증 / 테스트 전략 (End-to-End)

### 자동 검증
- `pnpm tsc --noEmit` (각 Sprint 후)
- `pnpm lint` (Sprint 2.8 이후 deprecation 룰 작동)
- `pnpm test` (backend resolveNextAction table test)
- `pnpm --filter frontend run test:e2e` (Playwright)
  - `features/checkouts/suite-ux/` 확장: rental 3-phase, actor variant, D-day 배지, keyboard J/K
  - `features/checkouts/fsm/` 신규: LegacyActionsBlock 부재, fail-closed 시나리오

### Skill 기반 검증 (`.claude/skills/`)
- `verify-checkout-fsm`: Sprint 1 완료 후 Step 추가 — "resolveNextAction 단일 경로", "availableActions fail-closed"
- `verify-design-tokens`: raw Tailwind class grep (`text-brand-`, `bg-brand-`, `ring-offset-\d`, `mb-[0-9]`) 차단
- `verify-hardcoding`: 한글 리터럴 scan, URL/숫자 magic
- `verify-cache-events`: queryKey 재편 후 invalidate 경로 완전성
- `verify-workflows`: aria-expanded / keyboard / optimistic mutation 재사용
- `verify-frontend-state`: setQueryData 0건
- `review-architecture`: Sprint 1 완료 후 FSM 단일 경로 검증
- `review-design`: Sprint 4~5 완료 후 디자인 스코어링

### 수동 검증 (사용자 또는 reviewer)
- 역할별 (requester / approver / receiver / admin) 로그인 후 목록/상세 양쪽 CTA 확인
- 모바일 360px / 태블릿 768px / 데스크톱 1440px 3 breakpoint
- 다크모드 전환 후 모든 신규 토큰 색 검증
- bundle size: `pnpm --filter frontend run analyze` baseline 비교

### Success Metrics (§10)
- 목록→승인 median: 14s → <5s (FE analytics)
- "어떻게 해야" 문의: 주 ~8건 → <2건 (헬프데스크 태그)
- 승인 오류 철회율: ~3% → Undo로 체감 0%
- 모바일 성공률(행→상세→승인): ~82% → >95%
- 신규 상태 추가 PR 파일수: 10+ → ≤7

---

## 결론

V2 리뷰의 18개 findings(15 LIVE) 전부를 **5-Sprint 타협 없이 모두 해결**한다. Authority 단일화 → Tokens 봉합 → Perf/BFF → UX Flow(편의성 12건 전량 포함) → Visual Polish 비가역 순서. 사용자 결정대로 C-2는 Phase-based '1/3 phase'로 통일, BFF `/inbound-overview` 신설, 편의성 U-01~U-12 전량 구현.

실행 진입점: Sprint 1.1 `resolveNextAction` isomorphic 함수 설계 → `packages/schemas/src/fsm/checkout-fsm.ts` 확장 → 기존 `pr5-checkout-fsm-integration.md` / `checkout-fsm-backend.md` 계약과 합류. 각 Sprint마다 `.claude/contracts/` 신규 프롬프트 파일 생성(제안 파일명은 "기존 harness 계약과의 합류 계획" 표 참조), harness 오케스트레이터로 Planner/Generator/Evaluator 루프 실행.

플랜 승인 후: (1) Sprint 1의 세부 contract 5종 작성, (2) `verify-checkout-fsm` skill Step 확장, (3) FE analytics instrumentation 선행(metrics 수집 기반). 이후 각 Sprint별 PR 단위로 순차 실행.
