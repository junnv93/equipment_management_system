## Evaluation Report — checkouts-phase3-inline-action (Iteration 1)

**Date**: 2026-04-28  
**Evaluator**: QA Agent (skeptical mode)  
**Overall verdict**: **FAIL — 2 MUST criteria fail, 1 MUST criterion ambiguous**

---

### MUST Criteria

| # | Criterion | Verdict | Evidence |
|---|---|---|---|
| M1 | tsc --noEmit 0 errors (frontend) | **PASS** | `cd apps/frontend && pnpm exec tsc --noEmit; echo "EXIT $?"` → `EXIT 0` |
| M2 | shared-constants build 0 errors | **PASS** | `pnpm --filter @equipment-management/shared-constants build` → `EXIT 0` (rimraf dist && tsc -p tsconfig.json --skipLibCheck) |
| M3 | WORKFLOW_PANEL_TOKENS.variant.{compact,hero}.actionButton 호출처 0 | **PASS** | `grep -rn "WORKFLOW_PANEL_TOKENS\.variant\.\(compact\|hero\)\.actionButton"` → 0 hits (EXIT 1 = no match) |
| M4 | atom 외부 raw utility 0건 | **PASS** | `grep -rn "(bg\|text\|border)-surface-inline-action-" apps/frontend/components apps/frontend/app \| grep -v "inline-action-button.tsx" \| grep -v "__tests__/"` → 0 hits (EXIT 1 = no match) |
| M5 | canAct 상호 배타 분기 보존 | **PASS** | `grep -n "!canAct\|canAct &&" NextStepPanel.tsx` → line 308 `{!canAct && (` + line 314 `{canAct && (` — 상호 배타 분기 정확히 보존 |
| M6 | stopPropagation 보존 (≥ 2 hits) | **PASS** | `grep -n "stopPropagation" NextStepPanel.tsx` → 3 hits: line 324 (compact InlineActionButton onClick), line 341 (overflow trigger), line 351 (DropdownMenuItem) |
| M7 | atom 단위 테스트 ≥ 8 PASS | **PASS** | 15 tests passed. 8 atom tests: (1) 4 variant 합성, (2) loading aria-busy, (3) disabled aria-disabled 동기화, (4) disabled onClick 비호출, (5) stopPropagation, (6) leadingIcon, (7) forwardRef ref forwarding, (8) default type="button". 8개 충족. |
| M8 | resolveInlineActionVariant matrix ≥ 7 PASS | **PASS** | 7 matrix tests passed: critical→danger, warning→warning, normal+isMyTurn+approve→warning, normal+ok-actions→ok, normal+approve+isMyTurn=false→info, null→info, fallback-actions→info |
| M9 | 와이어프레임 04 spec 7개 속성 매핑 | **PASS** | `SURFACE_INLINE_ACTION_TOKENS.base`에 `h-7 px-2.5 ... border ... text-xs font-semibold` 확인. variant 4축 각각 `bg-surface-inline-action-{v}-bg / text-surface-inline-action-{v}-fg / border-surface-inline-action-{v}-border` 포함. base에 shadow 미포함(none). 7개 속성 모두 반영. |
| M10 | i18n parity | **PASS** | `git diff --stat apps/frontend/messages/` → 변경 파일이 `dashboard.json` 양쪽뿐 (checkouts.json 무변경). Phase 3 신규 키 미추가로 기존 키 재사용. 동기 자동 충족. |
| M11 | verify-implementation 0 violations | **FAIL** | `InlineActionButton` atom에 `displayName` 속성이 없음. 플랜(Commit 2 설명)에서 `displayName='InlineActionButton'`을 명시했고, M7 contract 목록에도 "displayName" 케이스가 포함됨. 구현 파일 (`inline-action-button.tsx`) 마지막 export는 `export const InlineActionButton = React.memo(InlineActionButtonImpl)` — `InlineActionButton.displayName = 'InlineActionButton'` 라인 없음. 테스트 파일에도 displayName 케이스 없음. SSOT 위반은 아니나 플랜 명세 미이행 + 테스트 미작성. |
| M12 | atom 외 cn() 외 인라인 className 합성 없음 | **FAIL** | `grep -n "surface-inline-action" NextStepPanel.tsx` → 0 hits (PASS 측면). 그러나 hero `canAct=true` 분기에서 `className={cn('mt-4', pulseClass)}`를 `InlineActionButton`에 직접 전달함. 이는 `cn()` 경유이므로 허용. **그런데** hero `canAct=false` 분기에서는 `<div className="mt-4">` wrapper + `<InlineActionButton disabled>` 패턴을 사용하는 반면 canAct=true는 `className={cn('mt-4', pulseClass)}` prop 직접 사용 — 두 분기가 레이아웃 마진을 다른 방식으로 처리. wrapper `<div>` vs atom prop — 이는 M12 기준(cn() 외 합성 금지)의 직접 위반은 아니나 **구조 불일치**. **추가 발견**: 플랜 Commit 3은 hero canAct=true에 `aria-label={stepLabel}` + `data-testid` + `className={cn('mt-4', pulseClass)}`를 atom에 전달하도록 명시했으나 hero canAct=false `disabled` 분기는 `aria-label` prop이 **없음** (canAct=true에는 있음). 스크린리더 입장에서 disabled 상태의 버튼이 aria-label 없이 children 텍스트로만 식별됨 — 와이어프레임 04 접근성 요구사항 위반 여부 불명확하나 canAct 분기 간 불일치. 이 항목은 FAIL로 판정하지 않고 **Notable Observation**으로 처리. M12 본래 기준(raw className 합성 금지)은 **PASS**. |

> M12 재판정: 본래 기준 "cn() 외 인라인 className 합성 금지"는 충족. **PASS**로 정정.

**확정 FAIL**: M11 (displayName 누락)

---

### Architectural Decision Verification

**Q1 urgency 권위 순서**: **PASS**

`resolveInlineActionVariant` 함수 분기 순서:
```
if (urgency === 'critical') return 'danger';   // 1순위
if (urgency === 'warning') return 'warning';   // 2순위
if (nextAction === null) return 'info';        // terminal guard
if (isMyTurn && APPROVE_INLINE_ACTIONS.has(nextAction)) return 'warning'; // 3순위
if (OK_INLINE_ACTIONS.has(nextAction)) return 'ok';  // 4순위
return 'info';                                  // default
```
플랜 명세의 5단계 우선순위와 정확히 일치.

**Q3 atom props**: **PASS**

`forwardRef + memo + variant + loading + leadingIcon + className(escape)` 모두 구현. `asChild` 없음.  
단, `displayName`이 설정되지 않음 — 플랜 Commit 2 명세(`displayName='InlineActionButton'`) 미이행.

**Q5 토큰 cut + satisfies 갱신**: **PASS**

`workflow-panel.ts` line 83:
```ts
} satisfies Record<'compact' | 'hero', { container: string; heading: string }>,
```
`actionButton` 키가 `Record` 타입에서 제거되었고 `compact.actionButton`, `hero.actionButton` 모두 삭제됨. 확인.

**R4 hero canAct=false opacity 누적 제거**: **PASS**

`grep -n "opacity-50\|cursor-not-allowed" NextStepPanel.tsx` → 0 hits. 기존 누적 클래스 완전 제거. hero canAct=false 분기는 `<InlineActionButton disabled>` 단독 사용 — atom base 토큰 `disabled:opacity-50 disabled:cursor-not-allowed`이 단독 처리.

**와이어프레임 04 spec 7개 속성**:

| 속성 | 와이어프레임 04 | 구현 | 판정 |
|---|---|---|---|
| height 28px | `h-7` | `SURFACE_INLINE_ACTION_TOKENS.base`에 `'h-7 px-2.5'` | PASS |
| background `hsl(brand/0.10)` | `bg-surface-inline-action-{variant}-bg` | variant별 `bg-surface-inline-action-*-bg` 4축 | PASS |
| color `hsl(brand)` | `text-surface-inline-action-{variant}-fg` | variant별 `text-surface-inline-action-*-fg` 4축 | PASS |
| border `1px solid hsl(brand/0.22)` | `border` + `border-surface-inline-action-{variant}-border` | base에 `'border'` + variant별 `border-surface-inline-action-*-border` | PASS |
| box-shadow `none` | base에 shadow 미정의 | base 클래스에 `shadow-*` 없음 | PASS |
| font-weight 600 | `font-semibold` | `'text-xs font-semibold'` in base | PASS |
| icon: none / size-12 lucide | `leadingIcon` prop optional | `leadingIcon?: LucideIcon` prop, 마이그레이션 호출 0건 | PASS |

**와이어프레임 04 spec 7개 속성 전체: PASS**

---

### SHOULD Criteria

- **S1 다크모드 대비비 ≥ 3:1**: SKIP — Playwright 환경 필요
- **S2 React.memo 작동 검증**: PASS (코드 검사) — `React.memo(InlineActionButtonImpl)` 적용 확인. 런타임 Profiler 검증은 SKIP.
- **S3 Bundle size delta < 1KB**: SKIP — next-bundle-analyzer 빌드 분석 필요
- **S4 leadingIcon 호출 0건**: PASS — `grep -rn "leadingIcon=" apps/frontend/components/` (테스트 제외) → 0 hits
- **S5 review-architecture**: SKIP — 별도 스킬 실행 필요
- **S6 Storybook entry**: SKIP — 별도 PR 후보

---

### Final Verdict

**FAIL — M11 (displayName 누락) 1건 위반**

---

### Repair Instructions

**M11: `displayName` 미설정**

파일: `/home/kmjkds/equipment_management_system/apps/frontend/components/ui/inline-action-button.tsx`

현재 마지막 라인:
```ts
export const InlineActionButton = React.memo(InlineActionButtonImpl);
```

수정 후:
```ts
export const InlineActionButton = React.memo(InlineActionButtonImpl);
InlineActionButton.displayName = 'InlineActionButton';
```

**추가 (선택적 — M7 완전 충족)**: 테스트 파일에 displayName 케이스 추가.

파일: `/home/kmjkds/equipment_management_system/apps/frontend/components/ui/__tests__/inline-action-button.test.tsx`

추가 테스트 케이스:
```ts
it('displayName이 "InlineActionButton"으로 설정됨 (DevTools 식별 + React.memo 디버깅)', () => {
  expect(InlineActionButton.displayName).toBe('InlineActionButton');
});
```

---

### Notable Observations

1. **hero canAct=false 분기 aria-label 불일치**: canAct=true 분기는 `aria-label={stepLabel}` + `data-testid` prop을 atom에 전달하지만 canAct=false 분기의 `disabled` InlineActionButton에는 aria-label이 없음. disabled 상태라도 스크린리더가 버튼을 탐색할 때 children 텍스트만으로 식별되는데, `stepLabel`(단계 정보 포함)이 누락됨. M12 기준 위반은 아니나 WCAG 2.4.6 접근성 불균형.

2. **'ok' 액션 테스트가 isMyTurn=true 케이스만 검증**: 테스트 `urgency='normal' + 반환·수령·반입 액션 → 'ok'` 는 `isMyTurn: true`만 테스트. 코드 구현상 `if (OK_INLINE_ACTIONS.has(nextAction)) return 'ok'`는 isMyTurn과 무관하게 실행되므로 로직은 맞음. 그러나 `isMyTurn: false` 케이스에서도 ok 반환을 검증하는 테스트가 없어 리그레션 탐지 범위가 좁음.

3. **floating/inline variant는 여전히 raw `<button>` + `NEXT_STEP_PANEL_TOKENS.actionButton.primary`**: Phase 3 범위 외 처리로 계획서에 명시. 그러나 현재 파일에 두 가지 버튼 패턴(InlineActionButton atom vs raw button)이 공존하는 상태는 장기적으로 불일치. Phase 4 tech-debt 추적 필요.

4. **`InlineActionButtonImpl` 내부 명명 노출**: `forwardRef` 내부 함수명이 `InlineActionButton`으로 명명되어 있어 displayName 없이도 DevTools에서 일부 식별 가능하지만, `React.memo` 래퍼의 displayName은 별도 설정이 필요.

---

### Iteration Tracking (갱신)

| Iter | Date | Verdict | FAIL items | Notes |
|------|------|---------|------------|-------|
| 1 | 2026-04-28 | FAIL | M11 (displayName 미설정) | 11/12 MUST PASS. displayName 1라인 추가로 해결 가능. |
| 2 | 2026-04-28 | PASS | — | M11 수정 확인. 16 tests all pass. tsc EXIT 0. 전 회귀 없음. |

---

## Iteration 2 — M11 Fix Verification

### Verification Commands

| Step | Command | Result |
|---|---|---|
| 1. M11 displayName 랜딩 | `grep -n "displayName" inline-action-button.tsx` | line 72: `InlineActionButton.displayName = 'InlineActionButton';` — 확인 |
| 2. atom + matrix 테스트 | `npx jest inline-action-button --no-coverage` | **16 tests PASS** (atom 9개 + matrix 7개). 0 failures. |
| 3. tsc 회귀 | `cd apps/frontend && npx tsc --noEmit; echo "EXIT $?"` | `EXIT 0` — 오류 없음 |
| 4. shared-constants build | `pnpm --filter @equipment-management/shared-constants build` | 빌드 성공 (rimraf dist && tsc -p tsconfig.json --skipLibCheck, 0 오류) |
| 5a. M3 토큰 cut 회귀 | `grep -rn "WORKFLOW_PANEL_TOKENS\.variant\.(compact\|hero)\.actionButton"` (소스 파일 한정) | 0 hits — PASS |
| 5b. M4 raw utility 회귀 | `grep -rn "(bg\|text\|border)-surface-inline-action-" components app \| grep -v inline-action-button.tsx \| grep -v __tests__/` | 0 hits — PASS |
| 6. canAct 상호배타 + stopPropagation | `grep -n "!canAct\|canAct &&\|stopPropagation" NextStepPanel.tsx` | `!canAct` line 309, `canAct &&` line 315, `stopPropagation` lines 325/342/352 — 구조 보존 |
| 7. hero canAct=false aria-label (Notable #1) | `grep -n "aria-label={stepLabel}" NextStepPanel.tsx` | 4 hits (lines 234, 253, 323, 401) — canAct=true 및 canAct=false 양쪽 포함, PASS |

### Verdict

- **M11**: PASS — `InlineActionButton.displayName = 'InlineActionButton'` line 72에 확인. 테스트 케이스 `displayName이 'InlineActionButton'으로 설정 (DevTools 가독성)` 신규 추가 후 PASS (atom test 8→9개).
- **Regression check**: PASS — 이전 11 MUST 모두 유지. tsc EXIT 0. shared-constants 빌드 성공. M3/M4 grep 0 hits. canAct 상호배타 분기 및 stopPropagation 3곳 보존.
- **Final**: **ALL MUST PASS** (12/12)

### Bonus items

- **Notable #1 (aria-label balance)**: PASS — `grep -n "aria-label={stepLabel}" NextStepPanel.tsx` → 4 hits. canAct=true (line 323)와 canAct=false (line 401) 양쪽에 aria-label 추가 확인. Iteration 1에서 지적한 접근성 불균형 해소.
- **Notable #2 (matrix isMyTurn coverage)**: PASS — `urgency='normal' + 반환·수령·반입 액션 → 'ok'` 테스트 내 `for (const isMyTurn of [true, false])` 루프로 isMyTurn=true 및 isMyTurn=false 양쪽 검증. Iteration 1에서 지적한 리그레션 탐지 범위 좁음 문제 해소.

### Final Verdict for Harness

**ALL MUST PASS — proceed to Step 7**
