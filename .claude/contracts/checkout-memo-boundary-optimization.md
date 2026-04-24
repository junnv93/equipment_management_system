---
slug: checkout-memo-boundary-optimization
type: contract
date: 2026-04-24
depends: []
sprint: 3
sprint_step: 3.3, 3.4, 3.5
---

# Contract: Sprint 3.3·3.4·3.5 — useMemo deps 정리 + memo boundary 보강 + stagger 12-row 상한

## Context

V2 리뷰 P-2, P-3, P-4 실측:

1. **P-2 (P1)**: `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` L195-220
   ```typescript
   const equipmentRows = useMemo(() => {
     return group.checkouts.map(checkout => ({
       ...
       // 내부: t('groupCard.unknownUser') 1회만 호출
     }));
   }, [group.checkouts, t, canApprove, descriptorMap]);
   ```
   `t` 함수가 deps에 포함 → next-intl locale 변경이 아니어도 컴포넌트 리렌더 시 새 함수 참조가 올 수 있어 매번 재계산. 대형 그룹(30 row × 5 group)에서 비용.

2. **P-3 (P1)**: `CheckoutGroupCard`는 `memo()`로 래핑됨. 그러나 상위 `OutboundCheckoutsTab.tsx` L444:
   ```tsx
   onCheckoutClick={(id) => router.push(FRONTEND_ROUTES.CHECKOUTS.DETAIL(id))}
   ```
   inline arrow → 매 렌더 새 함수. `memo` shallow compare 실패 → 모든 GroupCard 재렌더. 150 row 규모에서 측정 가능한 비용.

3. **P-4 (P2)**: `CheckoutGroupCard.tsx` L465-466
   ```tsx
   className={cn(rowBaseClass, ANIMATION_PRESETS.staggerFadeInItem)}
   style={getStaggerFadeInStyle(rowIndex, 'grid')}
   ```
   모든 `rowIndex`에 stagger 적용 — 상한 없음. 150 row × 독립 `animation-delay` = 저사양 기기 layer 분리 비용 ↑.

---

## Scope

### 수정 대상
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx`
  - L195-220 `equipmentRows` useMemo 정리:
    ```typescript
    // 1. t() 호출을 useMemo 바깥 상수화
    const unknownUserLabel = t('groupCard.unknownUser');

    // 2. deps에서 t 제거. unknownUserLabel만 참조
    const equipmentRows = useMemo(() => {
      return group.checkouts.map(checkout => ({
        ...
        userName: checkout.userName ?? unknownUserLabel,
      }));
    }, [group.checkouts, canApprove, descriptorMap, unknownUserLabel]);
    ```
  - L465-466 stagger 12-row 상한:
    ```tsx
    <div
      className={cn(
        rowBaseClass,
        rowIndex < STAGGER_ROW_LIMIT && ANIMATION_PRESETS.staggerFadeInItem
      )}
      style={rowIndex < STAGGER_ROW_LIMIT ? getStaggerFadeInStyle(rowIndex, 'grid') : undefined}
      onClick={handleRowClick}
      ...
    >
    ```
    여기서 `STAGGER_ROW_LIMIT = 12`는 상수. `lib/design-tokens/motion.ts` 또는 `ANIMATION_PRESETS` 쪽에 export.
- `apps/frontend/lib/design-tokens/motion.ts` (또는 `ANIMATION_PRESETS` 정의 파일)
  - `getStaggerFadeInStyle` 내부 또는 `ANIMATION_PRESETS`에 `STAGGER_ROW_LIMIT = 12` 상수 export
  - `getStaggerFadeInStyle` 함수가 `prefers-reduced-motion`을 존중 — `window.matchMedia('(prefers-reduced-motion: reduce)').matches`일 때 `undefined` 반환 (style 생략)
  - 이미 MEMORY.md `project_81`/`motion.ts L290`에 `motion-reduce:opacity-100` 포함 → stage 기반도 동일 존중.
- `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx`
  - L444 inline arrow → `useCallback`:
    ```typescript
    const handleCheckoutClick = useCallback(
      (id: string) => router.push(FRONTEND_ROUTES.CHECKOUTS.DETAIL(id)),
      [router],
    );
    // ...
    <CheckoutGroupCard onCheckoutClick={handleCheckoutClick} ... />
    ```
  - 기타 `CheckoutGroupCard`에 전달되는 props 중 매 렌더 새 값이 되는 것 점검:
    - `canApprove: boolean` — 이미 상위 계산 확인
    - `descriptorMap` — `useCheckoutGroupDescriptors` 결과 (useMemo 경유, OK)
  - 필요 시 `CheckoutGroupCard` 내부에서도 `handleRowClick`을 `useCallback` (row별 id는 closure로 제공)
- `apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx`
  - 동일 패턴 있으면 같이 수정.
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` 내부
  - L467·L473·L561 `onCheckoutClick(row.checkoutId)` 호출부 — inline handler들도 `useCallback`으로 감쌀지 검토:
    - L467: `onClick={() => onCheckoutClick(row.checkoutId)}` — row별로 새 function. 하지만 **가장 바깥 div에 직접 부여**하면 재렌더 시 새 DOM attribute만 생기고 React 비용 미미. 이 최적화는 SHOULD.

### 수정 금지
- `useOptimisticMutation`·`useCheckoutGroupDescriptors` 내부.
- `ANIMATION_PRESETS.staggerFadeInItem` 정의 (CSS 클래스 값).
- React Query config preset.

### 신규 생성
- (없음 — 상수 export는 기존 파일에 추가)

---

## MUST Criteria (실패 시 루프 차단)

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm --filter frontend exec tsc --noEmit` exit 0 | 빌드 |
| M2 | `pnpm --filter frontend exec eslint` + `react-hooks/exhaustive-deps` 규칙 준수 | lint |
| M3 | `CheckoutGroupCard.tsx` `equipmentRows` useMemo deps에 `t` 포함 0건 | `grep -A5 "const equipmentRows = useMemo" apps/frontend/components/checkouts/CheckoutGroupCard.tsx \| grep -c ", t,"` = 0 |
| M4 | `equipmentRows` deps에 `unknownUserLabel` 또는 동등한 pre-hoisted 상수 참조 | grep 확인 |
| M5 | `t('groupCard.unknownUser')` 호출이 `useMemo` 바깥에서 한 번만 실행 (map 내부 `t()` 호출 0건) | 코드 review |
| M6 | `OutboundCheckoutsTab.tsx`에서 `onCheckoutClick` prop 값이 inline arrow 아닌 `useCallback` 참조 | `grep -n "onCheckoutClick={(" 'apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx'` = 0 hit (inline arrow 없음), `grep -n "onCheckoutClick={handleCheckoutClick}"` = 1 hit |
| M7 | `handleCheckoutClick` 함수가 `useCallback(..., [router])`로 정의 | grep 확인 |
| M8 | `InboundCheckoutsTab.tsx`도 동일 `useCallback` 패턴 적용 (해당 패턴 있으면) | grep |
| M9 | `motion.ts`에 `export const STAGGER_ROW_LIMIT = 12` (또는 동등 상수) | grep |
| M10 | `CheckoutGroupCard.tsx` row 렌더 시 `rowIndex < STAGGER_ROW_LIMIT` 조건부 stagger 적용 | grep 확인 |
| M11 | `getStaggerFadeInStyle`이 `prefers-reduced-motion: reduce` 환경에서 `undefined` 또는 no-op style 반환 | 코드 확인 + playwright test matchMedia mock |
| M12 | React DevTools Profiler 측정: OutboundTab에서 필터 변경 1회 시 `CheckoutGroupCard` 재렌더 횟수 **감소** (before/after) — 수동 QA | profiler |
| M13 | E2E `features/checkouts/suite-ux/` 기존 테스트 통과 — 클릭 핸들러 동작 변경 없음 | test |
| M14 | 변경 파일 = `CheckoutGroupCard.tsx` + `OutboundCheckoutsTab.tsx` + `InboundCheckoutsTab.tsx` + `motion.ts` = **최대 4개** | `git diff --name-only \| grep -v '^\.claude/' \| wc -l` <= 4 |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | `CheckoutGroupCard` row 내부 `onClick={() => onCheckoutClick(row.checkoutId)}`도 `useCallback(checkoutId 매개)` 기반으로 최적화 | `group-card-row-click-callback` |
| S2 | 저사양 기기 감지 (`navigator.hardwareConcurrency < 4`) 시 stagger 완전 off | `stagger-low-end-device-skip` |
| S3 | `equipmentRows` 이외 다른 useMemo deps에 `t` 포함 여부 전수 스캔 | `checkout-usememo-t-deps-audit` |
| S4 | OutboundTab의 `canApprove` 계산도 상위 `useMemo`로 감싸 매 렌더 새 boolean 아님 확인 | `outbound-canapprove-memo` |
| S5 | `prefers-reduced-motion` 전수 preset 테스트 추가 (Playwright emulation) | `reduced-motion-e2e-matrix` |
| S6 | React Compiler(React 19) 도입 시 본 최적화가 자동화되는지 검증 — Next.js 16 호환 버전 | `react-compiler-compat-study` |

---

## Verification Commands

```bash
# 1. 타입 + lint
pnpm --filter frontend exec tsc --noEmit
pnpm --filter frontend exec eslint \
  apps/frontend/components/checkouts/CheckoutGroupCard.tsx \
  'apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx' \
  'apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx' \
  apps/frontend/lib/design-tokens/motion.ts

# 2. MUST grep
grep -A5 "const equipmentRows = useMemo" apps/frontend/components/checkouts/CheckoutGroupCard.tsx | grep -c ", t,"
# 기대: 0

grep -n "onCheckoutClick={(" 'apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx'
# 기대: 0 hit (inline arrow 없음)

grep -n "const handleCheckoutClick = useCallback" 'apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx'
# 기대: 1 hit

grep -n "STAGGER_ROW_LIMIT" apps/frontend/lib/design-tokens/motion.ts apps/frontend/components/checkouts/CheckoutGroupCard.tsx
# 기대: 2+ hit (정의 + 사용)

grep -n "rowIndex < STAGGER_ROW_LIMIT\|prefers-reduced-motion" apps/frontend/components/checkouts/CheckoutGroupCard.tsx apps/frontend/lib/design-tokens/motion.ts
# 기대: 조건 분기 확인

# 3. 변경 파일 수
git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: <= 4

# 4. E2E + Profiler (수동)
pnpm --filter frontend run test:e2e -- checkouts/suite-ux
# React DevTools Profiler로 OutboundTab 필터 변경 시 CheckoutGroupCard 재렌더 횟수 측정
```

---

## 측정 방법 (M12 수동 QA)

1. dev 서버 실행 (`pnpm dev`)
2. React DevTools "Profiler" 탭 → "Start profiling"
3. `/checkouts` 접속, 30+ row 목록 로드
4. 필터 (status) 변경 → 필요 시 2~3회
5. "Stop profiling"
6. `CheckoutGroupCard` 컴포넌트 재렌더 횟수 확인
   - **Before**: 모든 그룹 카드 재렌더 (상위 OutboundTab 렌더 → inline arrow 새 참조 → memo miss)
   - **After**: `group` 자체가 변경된 카드만 재렌더
7. 스크린샷 첨부하여 PR body에 기록.

---

## Acceptance

루프 완료 조건 = MUST 14개 모두 PASS + Profiler 수동 QA에서 재렌더 감소 확인.
SHOULD 미달 항목은 `tech-debt-tracker.md`에 등록 후 루프 종료.

---

## 연계 contracts

- Sprint 3.1·3.2 — 본 contract와 병행 가능 (독립 수정 범위).
- Sprint 4.2 · Row 3-zone 재구조화 — 본 contract의 memo boundary 정리 이후 안전하게 진행.
- Sprint 5.5 · Motion 규약 — stagger 12-row 상한은 본 contract에서 확정, Sprint 5는 예산 전수화.
- MEMORY.md `REFETCH_STRATEGIES 4단계` — 본 contract는 **렌더 레이어** 최적화. fetch 전략은 별개.
