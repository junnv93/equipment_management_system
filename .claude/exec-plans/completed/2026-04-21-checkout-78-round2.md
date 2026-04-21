# Exec Plan: 78차 반출입관리 2라운드

**날짜**: 2026-04-21
**슬러그**: checkout-78-round2
**모드**: Mode 1 (Surgical — 알려진 tech-debt 해소 + 추가 발견 a11y/SSOT)
**소스**: 78-7 직후 tech-debt-tracker + 반출입 페이지 자체 감사

---

## 목표

78차 세션에서 이연된 tech-debt 4건(K1~K4)과 감사 중 발견된 a11y 결함 1건(N1)을 해소하여,
반출입관리 페이지의 키보드 접근성·코드 일관성·SSOT 준수를 동시에 확보한다.

표면 변경은 수술적 범위로 한정하고, 인접 코드 리팩토링은 수행하지 않는다.

---

## 분석 요약

### 발견된 이슈 인벤토리 (심각도 + 근거)

| # | 이슈 | 파일:라인 | 심각도 | 근거 |
|---|------|-----------|--------|------|
| K1 | `div role="button"` 행 | `CheckoutGroupCard.tsx` | 🔴 HIGH | a11y — button 시맨틱 부재, screen reader 한정적 인식, `onKeyDown` Enter/Space 수동 처리 중 |
| K2 | 전역 `isLoading` early return | `InboundCheckoutsTab.tsx:211` | 🟡 MED | L248/L290/L393 섹션별 `isLoading` 체크가 unreachable (dead code). 한 섹션 로딩 중 다른 섹션 전체 숨김 |
| K3 | `EmptyState` 내부 `useAuth()` | `EmptyState.tsx` | 🟡 MED | 테스트 시 auth provider mock 강제, 프레젠테이셔널 컴포넌트 원칙 위반 |
| K4 | `w-[18px] h-[18px]` 잔존 | `checkout.ts:CHECKOUT_MINI_PROGRESS.dot.base` | 🟡 MED | arbitrary value — 78-1 review-architecture 권고 |
| N1 | Stat Card 키보드 접근성 누락 | `OutboundCheckoutsTab.tsx` | 🟡 MED | `<Card onClick>` 만 있고 `role="button"`, `aria-pressed`, `tabIndex`, `onKeyDown` 전부 없음 |
| N2 | `text-[10px]` 하드코딩 | `CheckoutsContent.tsx:251` | 🟢 LOW | `MICRO_TYPO.badge`(= `text-2xs`) SSOT 존재 |
| N3 | Overdue 앵커 a11y 취약 | `OutboundCheckoutsTab.tsx` + `CheckoutAlertBanners.tsx` | 🟢 LOW | `document.getElementById` 스크롤 — 타겟에 `tabIndex={-1}` 포커스 이동 없음 |
| N4 | 스켈레톤 중복 | `InboundCheckoutsTab.tsx` + `OutboundCheckoutsTab.tsx` | 🟢 LOW | `w-[Npx]` 하드코딩, `CheckoutListSkeleton` SSOT 존재 |

### 우선순위 기준

| 묶음 | 이슈 | 근거 |
|------|------|------|
| **P0 a11y 블로킹** | K1 + N1 | WCAG 2.1 AA — Name/Role/Value + Keyboard 모두 실패 |
| **P1 구조 결함** | K2 / K3 / K4 | 유지보수성·테스트 가용성·토큰 SSOT |
| **P2 표면 개선** | N2 ~ N4 | 개별 리스크 낮음, 묶음 변경 시 가치 발생 |

### 확인된 비-이슈 (제외 근거)

- backend DTO 마이그레이션: `class-validator` 사용 0건 — 이미 완료
- `any`/`setQueryData`: checkouts 전체 스캔 0건
- SSOT 위반: 0건 (UserRole, Permission, Status 전부 packages import)

---

## Phase 1: 접근성 블로킹 (P0 — 즉시 수정)

### 작업 1-1: CheckoutGroupCard 행을 button 시맨틱으로 교체
- **파일**: `apps/frontend/components/checkouts/CheckoutGroupCard.tsx`
- **목표**: equipmentRow 래퍼를 `<div role="button" tabIndex onKeyDown>` 패턴에서 `<button type="button">` 시맨틱으로 전환. 기존 내부 레이아웃과 nested 버튼(승인/반려/반입처리 Link)은 유지. 내부 버튼 이벤트 전파는 기존 `e.stopPropagation` 유지.
- **검증**:
  - `grep "role=\"button\"" CheckoutGroupCard.tsx` → 0 hit
  - 기존 nested 승인/반려 버튼 `e.stopPropagation` 유지
  - `text-left w-full` 또는 token으로 button 기본 스타일 리셋

### 작업 1-2: Outbound stat Card 키보드 접근성
- **파일**: `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx`
- **목표**: 5개 stat Card 각각에 키보드 활성화 경로 제공. `role="button"` + `tabIndex={0}` + `onKeyDown`(Enter/Space) + `aria-pressed={isActive}` + 카드 라벨 `aria-label` 추가. 기존 `onClick`과 모션 클래스는 유지.
- **검증**:
  - `grep "aria-pressed" OutboundCheckoutsTab.tsx` → 1+ hit
  - `grep "onKeyDown" OutboundCheckoutsTab.tsx` → 1+ hit

---

## Phase 2: 구조 결함 해소 (P1 — 이번 세션 내)

### 작업 2-1: InboundCheckoutsTab 전역 isLoading 가드 제거
- **파일**: `apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx`
- **목표**: 전역 `isLoading` 변수와 `if (isLoading) return renderLoadingState()` 조기 return 삭제. 섹션별 `*Loading` 변수는 유지. 전체 빈 상태 EmptyState는 **모든 섹션 로딩 완료 + 데이터 0건** 조건으로만 표시하도록 `!isLoadingAny` 가드 추가.
- **검증**:
  - `grep "const isLoading =" InboundCheckoutsTab.tsx` → 0 hit (전역)
  - `grep "if (isLoading) return" InboundCheckoutsTab.tsx` → 0 hit

### 작업 2-2: EmptyState useAuth 제거 + props 주입
- **파일**: `apps/frontend/components/shared/EmptyState.tsx`
- **목표**: 컴포넌트 내부 `useAuth()` 호출 제거. `canAct?: boolean` prop 추가 — undefined면 항상 표시(후방호환), 지정되면 그 값으로 표시 판정. 소비처(OutboundCheckoutsTab 등) 업데이트.
- **검증**:
  - `grep "useAuth" EmptyState.tsx` → 0 hit
  - `grep "canAct" EmptyState.tsx` → 1+ hit

### 작업 2-3: `--spacing-step-dot` 토큰 등록 + named utility 교체
- **파일**:
  - `apps/frontend/styles/globals.css` (@theme 블록)
  - `apps/frontend/lib/design-tokens/primitives.ts`
  - `apps/frontend/lib/design-tokens/semantic.ts`
  - `apps/frontend/lib/design-tokens/components/checkout.ts`
- **목표**: `--spacing-step-dot: 18px`를 @theme에 추가 → `w-step-dot h-step-dot` named utility 자동 생성 → `DIMENSION_TOKENS.stepDot` 추가 → `CHECKOUT_MINI_PROGRESS.dot.base`의 `w-[18px] h-[18px]`를 token으로 교체.
- **검증**:
  - `grep "w-\[18px\]" apps/frontend/lib/design-tokens/components/checkout.ts` → 0 hit
  - `grep "\-\-spacing-step-dot" apps/frontend/styles/globals.css` → 1 hit

---

## Phase 3: 표면 개선 (P2 — 선택적)

### 작업 3-1: CheckoutsContent `text-[10px]` 토큰화
- **파일**: `apps/frontend/app/(dashboard)/checkouts/CheckoutsContent.tsx:251`
- **목표**: pending checks 배지의 `text-[10px]`를 `MICRO_TYPO.badge`로 교체.

### 작업 3-2: Overdue 앵커 포커스 이동 + i18n
- **파일**:
  - `apps/frontend/components/checkouts/CheckoutAlertBanners.tsx`
  - `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx`
  - `apps/frontend/messages/ko/checkouts.json` + `apps/frontend/messages/en/checkouts.json`
- **목표**: 타겟 섹션에 `tabIndex={-1}` + ref + focus() 이동. "기한 초과 항목으로 이동" 하드코딩 → i18n 키.

### 작업 3-3: 중복 스켈레톤 CheckoutListSkeleton 공유
- **파일**:
  - `apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx`
  - `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx`
- **목표**: 로컬 `renderLoadingState`의 `w-[Npx]` Skeleton 조합을 `CheckoutListSkeleton` 컴포넌트 호출로 치환.

---

## 제외 항목 (이번 세션 스코프 밖)

| 항목 | 제외 사유 |
|------|----------|
| backend DTO class→Zod 마이그레이션 | `class-validator` 사용 0건, 이미 완료됨 |
| CheckoutDetailClient arbitrary values | 상세 페이지 스코프 — 별도 세션 |
| CreateCheckoutContent arbitrary values | 생성 폼 스코프 — 별도 세션 |
| 전체 design-tokens 90건 arbitrary | 78-1 tech-debt 등록 완료 |
| `destination \|\| location` 타입 이중 필드 | backend DTO 변경 동반 필요, 후속 |
| EmptyState `permission` prop 완전 제거 | 후방호환 유지, 후속 세션 |

---

## 검증 명령

```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run lint

# 감사 스캔
grep -rn "role=\"button\"" apps/frontend/components/checkouts apps/frontend/app/\(dashboard\)/checkouts
grep -rn "w-\[18px\]\|h-\[18px\]" apps/frontend/lib/design-tokens
grep -rn "useAuth" apps/frontend/components/shared/EmptyState.tsx
```

---

## Build 순서 (체크리스트)

- [ ] **Phase 1-1**: CheckoutGroupCard 행 `<button>` 교체 + 내부 버튼 이벤트 전파 검증
- [ ] **Phase 1-2**: OutboundCheckoutsTab stat Card `role`/`tabIndex`/`onKeyDown`/`aria-pressed` 추가
- [ ] **Phase 1 게이트**: `pnpm --filter frontend run tsc --noEmit`
- [ ] **Phase 2-1**: InboundCheckoutsTab 전역 `isLoading` 제거 + 섹션별 독립 로딩
- [ ] **Phase 2-2**: EmptyState `useAuth` 제거 + `canAct` prop 추가 + 소비처 업데이트
- [ ] **Phase 2-3**: `--spacing-step-dot` 토큰 등록 + 3-layer 반영
- [ ] **Phase 2 게이트**: tsc + lint
- [ ] **Phase 3**(선택): 3-1 → 3-2 → 3-3 순차
- [ ] **최종**: `pnpm --filter frontend run tsc --noEmit` PASS 후 커밋
