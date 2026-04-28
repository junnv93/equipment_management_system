# Phase 3 Skill Coverage Audit

**날짜:** 2026-04-28  
**대상:** Checkouts Phase 3 신규 패턴 4종 (InlineActionButton atom, CHECKOUT_ACTION_INLINE_CLASS, resolveInlineActionVariant, useCallback memo prop stability)  
**검토 스킬:** verify-design-tokens, verify-checkout-fsm, verify-frontend-state, verify-ssot, verify-hardcoding

---

## New Patterns Introduced

1. **InlineActionButton atom** — `apps/frontend/components/ui/inline-action-button.tsx`  
   `components/ui/`의 첫 forwardRef + memo + sr-only loading + iconSize-via-token 조합 원자 컴포넌트.

2. **`CHECKOUT_ACTION_INLINE_CLASS` Record SSOT** — `packages/shared-constants/src/checkout-thresholds.ts`  
   `as const satisfies Record<CheckoutAction, InlineActionClass>` 패턴의 첫 사용. 액션 enum × 분류 축 망라(exhaustive) 맵.

3. **`SURFACE_INLINE_ACTION_TOKENS.iconSize`** — `apps/frontend/lib/design-tokens/semantic.ts`  
   버튼 토큰 그룹 내 spinner/leading icon 크기를 토큰 필드로 관리하는 신규 컨벤션.

4. **useCallback for memo prop stability** — `apps/frontend/components/shared/NextStepPanel.tsx`  
   memo'd atom(`InlineActionButton`)을 호출하는 부모가 핸들러 prop을 `useCallback`으로 안정화해야 한다는 패턴. 파일 내 주석("Stable click handlers — InlineActionButton의 React.memo 효과 보존")으로 명시됨.

---

## Coverage Status

| # | 패턴 | 커버 스킬 | 이미 커버됨? | 갭 |
|---|---|---|---|---|
| 1a | InlineActionButton atom — atom 경유 강제 (surface-inline-action-* 직접 사용 금지) | verify-design-tokens Step 44 | **YES** | 없음 — atom 경유 grep 패턴 포함 |
| 1b | InlineActionButton atom — `iconSize` 필드가 SSOT 토큰에서 와야 한다 (하드코딩 `h-3 w-3` 금지) | verify-design-tokens Step 44 / verify-hardcoding | **부분적** | Step 44는 SURFACE_INLINE_ACTION_TOKENS 토큰 존재를 검증하나, atom 내부 내 iconSize를 토큰 외부 값으로 override하는 회귀는 감지 못함. verify-hardcoding에 gap 존재 |
| 1c | InlineActionButton atom — `components/ui/` 컴포넌트에서 useAuth 직접 호출 금지 | verify-frontend-state Step 19 | **YES** | shared/ui useAuth 금지 grep이 inline-action-button.tsx 커버 |
| 2 | `as const satisfies Record<EnumType, X>` 패턴 강제 — `Set<EnumType>` 또는 `Record<string, X>` 약타입 대체 방지 | verify-ssot | **NO** | 어떤 Step도 `as const satisfies Record<EnumType, X>` 패턴이 enum extension에 안전한 유일 방식임을 검증하지 않음 |
| 3a | `resolveInlineActionVariant` SSOT 경유 — atom variant 결정 | verify-design-tokens Step 44 (Phase 3 갱신) | **YES** | grep 패턴 포함: `grep -rn "resolveInlineActionVariant"` |
| 3b | `resolveInlineActionVariant` SSOT 경유 — verify-checkout-fsm 관점 | verify-checkout-fsm Step 40 (2026-04-28 갱신) | **YES** | "atom variant 결정은 resolveInlineActionVariant ... SSOT 헬퍼 경유" PASS 조건 5번에 명시 |
| 4 | useCallback memo prop stability — memo'd atom 부모가 handler를 useCallback으로 안정화 | verify-frontend-state | **NO** | 어떤 Step도 "React.memo'd 컴포넌트를 호출하는 부모가 함수 prop을 useCallback으로 안정화해야 한다"는 규칙을 검증하지 않음 |

---

## Recommended Step Additions

### Gap 1b: verify-hardcoding — atom 내부 iconSize 하드코딩 회귀 방지

`InlineActionButton` 내부에서 `SURFACE_INLINE_ACTION_TOKENS.iconSize`를 사용하는 대신 `h-3 w-3` 같은
arbitrary 픽셀 클래스를 직접 인라인하면 SSOT 체인이 끊어진다.  
Step 44(verify-design-tokens)는 토큰 정의의 존재를 검증하지만, atom 내부에서의 실제 소비를 검증하지 않는다.

- **Skill:** `verify-hardcoding`
- **Step number:** 30
- **Step name:** "`InlineActionButton` iconSize — `SURFACE_INLINE_ACTION_TOKENS.iconSize` 토큰 경유 필수"
- **auto-apply:** NO (신규 파일 경로 패턴, 위험도 낮음이나 다른 ui atom 확장 시 필요)

**Body sketch:**

```markdown
### Step 30: `InlineActionButton` iconSize — SSOT 토큰 경유 필수 (2026-04-28 추가)

`apps/frontend/components/ui/inline-action-button.tsx`에서 spinner / leading icon 크기 클래스는
반드시 `SURFACE_INLINE_ACTION_TOKENS.iconSize` 경유. `h-3 w-3`, `h-4 w-4` 등 arbitrary 크기 클래스
직접 인라인 사용 금지.

패턴 배경: SURFACE_INLINE_ACTION_TOKENS.iconSize = 'h-3.5 w-3.5' (semantic.ts SSOT). 크기를
semantic 토큰에서 관리해야 전체 variant 일관성 보장.

**탐지:**
```bash
# inline-action-button.tsx 내 arbitrary 크기 클래스 직접 사용 탐지
grep -n "className=.*h-[0-9]\|className=.*w-[0-9]" \
  apps/frontend/components/ui/inline-action-button.tsx \
  | grep -v "SURFACE_INLINE_ACTION_TOKENS\|cn("
# 기대: 0건 (SSOT 토큰 경유)

# iconSize 토큰 소비 확인
grep -n "iconSize" apps/frontend/components/ui/inline-action-button.tsx
# 기대: SURFACE_INLINE_ACTION_TOKENS.iconSize 참조 2건 이상 (spinner + leading icon)
```

**PASS:** iconSize 클래스가 `SURFACE_INLINE_ACTION_TOKENS.iconSize` 경유.
**FAIL:** `h-3 w-3` / `h-4 w-4` 등 arbitrary 크기 직접 인라인 → SSOT 토큰으로 교체.

**관련 파일:**
- `apps/frontend/lib/design-tokens/semantic.ts` — `SURFACE_INLINE_ACTION_TOKENS.iconSize` SSOT 정의
- `apps/frontend/components/ui/inline-action-button.tsx` — 소비처
```

**Grep pattern:** `grep -n "className=.*h-[0-9]\|className=.*w-[0-9]" apps/frontend/components/ui/inline-action-button.tsx | grep -v "SURFACE_INLINE_ACTION_TOKENS"`

---

### Gap 2: verify-ssot — `as const satisfies Record<EnumType, X>` 패턴 강제

`CHECKOUT_ACTION_INLINE_CLASS`는 `as const satisfies Record<CheckoutAction, InlineActionClass>` 패턴을
사용해 enum 확장 시 컴파일러가 누락 키를 즉시 탐지한다.  
`Set<EnumType>` 또는 `Record<string, X>` 약타입은 enum에 새 값이 추가되어도 silent pass된다.
현재 어떤 Step도 이 패턴을 강제하지 않는다.

- **Skill:** `verify-ssot`
- **Step number:** 38
- **Step name:** "`as const satisfies Record<EnumType, X>` — 액션 분류 맵 exhaustive 강제"
- **auto-apply:** NO (패턴 범위가 신규. 기존 Set 사용 코드 실측 필요)

**Body sketch:**

```markdown
### Step 38: 액션/상태 분류 맵의 `as const satisfies Record<EnumType, X>` 패턴 (2026-04-28 추가)

enum 값 × 분류 축 매핑 객체(action class, badge variant, icon 등)를 정의할 때
`as const satisfies Record<EnumType, X>` 패턴을 사용해야 한다. `Set<EnumType>` 또는
`Record<string, X>` 대체 사용 금지.

**이유**: enum에 새 값이 추가될 때
- `Set<EnumType>` — tsc 에러 없음, runtime에서 조용히 누락값 처리 실패
- `Record<string, X>` — tsc 에러 없음, 런타임 undefined 반환
- `as const satisfies Record<EnumType, X>` — 컴파일 타임에 누락 키 즉시 탐지 (올바른 패턴)

**올바른 패턴 (checkout-thresholds.ts 기준):**
```typescript
// ✅ 컴파일러가 CheckoutAction의 모든 값에 대해 키 존재를 강제
const CHECKOUT_ACTION_INLINE_CLASS = {
  approve: 'ok',
  reject: 'danger',
  // ... 모든 CheckoutAction 값
} as const satisfies Record<CheckoutAction, InlineActionClass>;

// ❌ Set — 새 CheckoutAction 추가 시 silent miss
const DISPLAYED_CHECKOUT_ACTIONS = new Set<CheckoutAction>(['approve', 'reject']);

// ❌ Record<string, X> — 완전성 검사 없음
const ACTION_CLASS_MAP: Record<string, string> = { approve: 'ok' };
```

**탐지 — 분류 맵에 약타입 사용:**
```bash
# checkout-thresholds.ts 내 분류 맵 패턴 확인
grep -n "satisfies Record<CheckoutAction" \
  packages/shared-constants/src/checkout-thresholds.ts
# 기대: CHECKOUT_ACTION_INLINE_CLASS 등 1건 이상

# Record<string, 분류타입> 패턴 탐지 (약타입 후보)
grep -rn "Record<string,\s*InlineActionClass\|Record<string,\s*BadgeVariant\|Record<string,\s*IconVariant" \
  packages/shared-constants/src apps/frontend/lib/design-tokens/ \
  --include="*.ts"
# 기대: 0건 (EnumType으로 키를 특정해야 함)
```

**PASS:** 액션/상태 분류 맵이 `as const satisfies Record<EnumType, X>` 사용.
**FAIL:** `Record<string, X>` 또는 `Set<EnumType>` 대체 사용 → 타입 강화 필요.

**관련 파일:**
- `packages/shared-constants/src/checkout-thresholds.ts` — `CHECKOUT_ACTION_INLINE_CLASS` 최초 도입
```

**Grep pattern:** `grep -rn "Record<string,\s*InlineActionClass" packages/shared-constants/src` + manual review of new enum-keyed maps.

---

### Gap 4: verify-frontend-state — React.memo'd 컴포넌트 호출 시 useCallback prop 안정화

`InlineActionButton`은 `React.memo`로 wrap되어 있고, 파일 내 JSDoc에 "호출처는 onClick 같은 함수 prop을 useCallback으로 안정화하거나 부모 자체가 memo여야 함"이라고 명시되어 있다.  
`NextStepPanel.tsx`는 `handleHeroClick`, `handleCompactClick`을 `useCallback`으로 안정화한다.  
현재 verify-frontend-state 어떤 Step도 "memo'd UI 원자 컴포넌트를 호출하는 부모가 함수 prop을 useCallback으로 안정화해야 한다"는 규칙을 검증하지 않는다.

- **Skill:** `verify-frontend-state`
- **Step number:** 25
- **Step name:** "`React.memo` atom 소비 — 부모의 함수 prop `useCallback` 안정화 필수"
- **auto-apply:** NO (grep으로 기계 탐지가 어려움 — `InlineActionButton`을 사용하는 호출처 목록이 확장될 때 수동 검토 필요)

**Body sketch:**

```markdown
### Step 25: `React.memo` atom 소비 — 부모의 함수 prop `useCallback` 안정화 필수 (2026-04-28 추가)

`React.memo`로 wrap된 atom 컴포넌트(예: `InlineActionButton`)에 함수 prop을 전달할 때,
부모 컴포넌트는 반드시 `useCallback`으로 안정화된 핸들러를 전달해야 한다.
`onClick={(e) => handleAction(e)}` 인라인 arrow 전달은 매 렌더 새 함수 참조를 생성하여 memo를 무력화한다.

**규칙:**
- `<MemoedAtom onClick={...}>`에 인라인 arrow 직접 전달 → FAIL
- 부모가 `useCallback`으로 안정화된 함수 → PASS
- 부모 자체가 `React.memo`면 렌더 주기가 같으므로 허용

**탐지 — InlineActionButton에 인라인 arrow 전달:**
```bash
# InlineActionButton의 onClick에 인라인 arrow 함수 전달 탐지
grep -rn "<InlineActionButton" \
  apps/frontend/components apps/frontend/app \
  --include="*.tsx" -A 5 \
  | grep "onClick={(e)\|onClick={() =>"
# 기대: 0건 (useCallback 안정화된 핸들러만 전달)
```

**올바른 패턴 (NextStepPanel.tsx 기준):**
```typescript
// ✅ useCallback 안정화 — memo 효과 보존
const handleHeroClick = useCallback(() => {
  onAction(descriptor.nextAction, descriptor.actionPayload);
}, [onAction, descriptor.nextAction, descriptor.actionPayload]);

<InlineActionButton onClick={handleHeroClick} ... />

// ❌ 인라인 arrow — memo 무력화 (매 렌더 새 함수 참조)
<InlineActionButton onClick={() => onAction(descriptor.nextAction, descriptor.actionPayload)} ... />
```

**PASS:** `InlineActionButton` 호출처에서 인라인 arrow onClick 0건.
**FAIL:** 인라인 arrow 발견 → `useCallback`으로 안정화 필요.

**예외:**
- 부모 컴포넌트 자체가 `React.memo`인 경우 — 렌더 주기가 동일하므로 허용.
- 클릭 핸들러가 단순 리터럴 전달(`() => someConst`)로 항등성이 보장되는 경우 — INFO 수준.

**관련 파일:**
- `apps/frontend/components/ui/inline-action-button.tsx` — `React.memo` wrap + JSDoc 경고
- `apps/frontend/components/shared/NextStepPanel.tsx` — `useCallback` 올바른 구현 사례
```

**Grep pattern:** `grep -rn "<InlineActionButton" apps/frontend --include="*.tsx" -A5 | grep "onClick={("`

---

## Existing Steps That Might Need Strengthening

| Skill:Step | 현재 상태 | 제안 보강 내용 |
|---|---|---|
| verify-design-tokens:Step 44 | `iconSize` 필드가 4-way sync 항목으로 다뤄지지 않음. Step 44 본문은 bg/border/fg 16토큰을 강조하고 iconSize는 언급 안 됨 | "5. `SURFACE_INLINE_ACTION_TOKENS.iconSize` 필드 — semantic.ts export + barrel re-export + atom 내부 소비 3점 동기화" PASS 항목 추가. 현재 3.에서 `getSurfaceInlineActionClasses` 헬퍼 or base+variant만 언급 |
| verify-checkout-fsm:Step 40 | Phase 3 갱신이 되어 있으나 `resolveInlineActionVariant`의 시그니처 `{ urgency, nextAction, isMyTurn }` 인자가 SSOT 정의와 호출처 모두에서 3개 모두 전달되는지는 검증 안 됨 | "resolveInlineActionVariant 호출처에서 urgency/nextAction/isMyTurn 3개 인자 모두 전달 확인" grep 보강 |

---

## Final Verdict

- **모든 신규 패턴이 충분히 커버됨:** NO
- **권장 액션 수:** 3개 (신규 Step 추가 2개 + 기존 Step 보강 1개)

| 항목 | 대상 스킬 | Step | auto-apply |
|---|---|---|---|
| atom iconSize 토큰 경유 강제 | verify-hardcoding | Step 30 (신규) | NO |
| `as const satisfies Record<EnumType, X>` 패턴 강제 | verify-ssot | Step 38 (신규) | NO |
| React.memo atom 부모 useCallback 안정화 | verify-frontend-state | Step 25 (신규) | NO |
| SURFACE_INLINE_ACTION_TOKENS iconSize 3점 동기화 보강 | verify-design-tokens | Step 44 (기존 보강) | NO |

### auto-apply: NO 이유

모든 항목이 `auto-apply: no`인 이유:
1. **Step 30 (iconSize)**: 탐지 패턴이 `inline-action-button.tsx` 파일 1개에 국한되어 있어 다른 `components/ui/` 원자 컴포넌트 확장 시 패턴 조정 필요.
2. **Step 38 (as const satisfies)**: 기존 codebase에서 `Record<string, X>` 분류 맵이 얼마나 존재하는지 실측 없이 추가하면 false-positive 가능.
3. **Step 25 (useCallback)**: grep 패턴이 `InlineActionButton` 단일 atom에만 유효. 향후 memo'd atom이 추가되면 패턴 확장 필요. 수동 검토 단계가 있어야 안전.
