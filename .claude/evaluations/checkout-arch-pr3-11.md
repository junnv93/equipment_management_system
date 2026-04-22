---
slug: checkout-arch-pr3-11
iteration: 1
verdict: FAIL
date: 2026-04-22
---

## Summary

PR-3 ~ PR-11 체크아웃 아키텍처 개선 구현을 40개 MUST 기준으로 평가했다. 핵심 신규 파일(NextStepPanel.tsx, use-checkout-next-step.ts, workflow-panel.ts, checkout-flags.ts, check-i18n-keys.mjs, bundle-baseline.json, s-next-step.spec.ts)은 모두 존재하며 SSOT 준수, FSM 위임, feature flag 구조, i18n 완성도 등 대부분 기준을 충족한다. 그러나 4개 MUST 기준이 FAIL이다: (1) frontend tsc 3개 에러(NC 관련), (2) terminal panel에 `data-next-action` 누락, (3) 통계 카드 padding/gap 하드코딩, (4) E2E S8 테스트가 `data-next-action`/`data-urgency` 중 어느 것도 검증하지 않음.

---

## MUST Criteria Results

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| M-01 | `pnpm --filter frontend run tsc --noEmit` 에러 0건 | **FAIL** | 3개 에러: `NCDetailClient.tsx(493,17)` Type '"default"' 불할당, `NCDetailClient.tsx(537,19)` 동일, `non-conformance.ts(822,14)` TS2740 NC_WORKFLOW_GUIDANCE_TOKENS 누락 키(open_all, corrected_all, closed_operator, closed_manager 외 3개) |
| M-02 | `pnpm --filter backend run tsc --noEmit` 에러 0건 | PASS | 에러 0건 확인 |
| M-03 | `pnpm --filter frontend run build` 성공 | SKIP | tsc 에러로 인해 빌드 미실행 (M-01 선행 FAIL) |
| M-04 | `ELEVATION_TOKENS.surface.flush/raised/floating` 3개 키 | PASS | `semantic.ts:239-243` — flush: '', raised: 'shadow-sm', floating: 'shadow-md ring-1 ring-border/10' |
| M-05 | `TYPOGRAPHY_TOKENS` 11개 키 이상 | PASS | heading h1-h4(4) + body base/large/small(3) + label base/compact(2) + caption base/meta(2) = 11개 (`semantic.ts:374-394`) |
| M-06 | `SPACING_RHYTHM_TOKENS` tight/comfortable/relaxed/spacious × padding/gap/stack | PASS | `semantic.ts:289-294` — 4 density × 3 field 완비 |
| M-07 | `ElevationSurface` / `SpacingRhythm` 타입 export | PASS | `semantic.ts:561` ElevationSurface, `semantic.ts:296` SpacingRhythm |
| M-08 | `workflow-panel.ts` 파일 존재, WORKFLOW_PANEL_TOKENS + WorkflowPanelUrgency export | PASS | 파일 존재 확인. WORKFLOW_PANEL_TOKENS (line 15), WorkflowPanelUrgency (line 59) |
| M-09 | `index.ts`에서 workflow-panel.ts re-export | PASS | `index.ts:721-724` — WORKFLOW_PANEL_TOKENS, WorkflowPanelUrgency export |
| M-10 | WORKFLOW_PANEL_TOKENS가 ELEVATION_TOKENS.surface.floating + SPACING_RHYTHM_TOKENS.comfortable.padding 내부 참조 | PASS | `workflow-panel.ts:19-20` — 두 토큰 모두 참조, 하드코딩 없음 |
| M-11 | `use-checkout-next-step.ts` 존재, `useCheckoutNextStep` named export | PASS | 파일 존재. `use-checkout-next-step.ts:25` named export |
| M-12 | 훅이 `getNextStep`을 `@equipment-management/schemas`에서 호출 | PASS | `use-checkout-next-step.ts:7,31` — import 및 호출 확인, FSM 재구현 없음 |
| M-13 | 훅이 `getPermissions`을 `@equipment-management/shared-constants`에서 호출 | PASS | `use-checkout-next-step.ts:9,28` — import 및 호출 확인 |
| M-14 | `NextStepPanel.tsx` 파일 존재 | PASS | 파일 존재 |
| M-15 | NextStepPanel이 `NextStepDescriptor` 타입 `descriptor` prop 수신 | PASS | `NextStepPanel.tsx:12-14` — descriptor: NextStepDescriptor prop |
| M-16 | NextStepPanel에서 CheckoutStatus 문자열 리터럴 직접 비교 0건 | PASS | `descriptor.nextAction === null` 패턴만 사용, status 문자열 비교 없음 |
| M-17 | 액션 버튼에 `data-testid="next-step-action"` | PASS | `NextStepPanel.tsx:72` (활성), `NextStepPanel.tsx:84` (비활성) 양쪽 부착 |
| M-18 | Panel 컨테이너에 `data-checkout-id`, `data-urgency`, `data-next-action` | **FAIL** | terminal 상태(role="status", `NextStepPanel.tsx:24-37`) — `data-checkout-id`(line 28), `data-urgency`(line 29)는 있으나 `data-next-action` 누락. 활성 상태에는 3개 모두 존재(line 49-51) |
| M-19 | `isNextStepPanelEnabled()` — `process.env.NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL === 'true'` | PASS | `checkout-flags.ts:15` 정확히 일치 |
| M-20 | CheckoutDetailClient에서 `isNextStepPanelEnabled()` 조건부 렌더 | PASS | `CheckoutDetailClient.tsx:487` — `{isNextStepPanelEnabled() && <NextStepPanel .../>}` |
| M-21 | flag off 시 NextStepPanel DOM 미렌더 | PASS | M-20 구현으로 flag=false 시 JSX 미반환 |
| M-22 | CheckoutStatusStepper에 `nextStepIndex` prop 전달 경로 존재 | PASS | `CheckoutDetailClient.tsx:503-507` — 조건부 `nextStepDescriptor.currentStepIndex + 1` 전달 |
| M-23 | `CheckoutStatusStepper` Props에 `nextStepIndex?: number` optional 추가 | PASS | `CheckoutStatusStepper.tsx:13` — `nextStepIndex?: number` |
| M-24 | next 노드에 `data-step-state="next"` | PASS | `CheckoutStatusStepper.tsx:122,194` — `data-step-state={isNext ? 'next' : undefined}` |
| M-25 | `CheckoutMiniProgress` Props에 `descriptor?: NextStepDescriptor` optional 추가, fallback 유지 | PASS | `CheckoutMiniProgress.tsx:20` optional prop, `?? fallback` 패턴으로 회귀 방지 |
| M-26 | `CHECKOUT_STEPPER_TOKENS.status.next` 서브트리 (node/icon/label 3키) | PASS | `checkout.ts:352-357` — next: { node, icon, label } |
| M-27 | 통계 카드 shadow 하드코딩 0 — ELEVATION_TOKENS.surface.* 경유 | PASS | `checkout.ts:416,425,434,444,453,462` — elevation: ELEVATION_TOKENS.surface.raised |
| M-28 | 통계 카드 value/label이 `TYPOGRAPHY_TOKENS.*` 참조 | PASS | `checkout.ts:417,426,435,445,454,463` — valueTypography: `${TYPOGRAPHY_TOKENS.heading.h2} tabular-nums` |
| M-29 | 통계 카드 padding/gap이 `SPACING_RHYTHM_TOKENS.*` 참조 | **FAIL** | `OutboundCheckoutsTab.tsx:234` — CardHeader: `pb-1.5 pt-3 px-3` 하드코딩. `OutboundCheckoutsTab.tsx:247` — CardContent: `px-3 pb-3` 하드코딩. CHECKOUT_STATS_VARIANTS에 padding/gap 키 없음 |
| M-30 | `transition-all` 사용 0건 | PASS | NextStepPanel.tsx, workflow-panel.ts 모두 transition-all 없음 |
| M-31 | `ko/checkouts.json` fsm.* 6개 서브트리 | PASS | action, actor, blocked, hint, panelTitle, urgency 확인 |
| M-32 | `en/checkouts.json` fsm.* 6개 서브트리 | PASS | action, actor, blocked, hint, panelTitle, urgency 확인 |
| M-33 | CHECKOUT_TRANSITIONS labelKey/hintKey 양 로케일 누락 0 | PASS | `node scripts/check-i18n-keys.mjs` — ko 40개, en 40개, exit 0 |
| M-34 | `scripts/check-i18n-keys.mjs` 존재, exit 0 | PASS | 파일 존재, exit code 0 확인 |
| M-35 | E2E spec 파일 존재 | PASS | `suite-next-step/s-next-step.spec.ts` 존재 |
| M-36 | 8개 test case(S1~S8), 각각 data-next-action 또는 data-urgency 검증 | **FAIL** | S8(`s-next-step.spec.ts:157-173`) — `data-checkout-id`만 검증, `data-next-action`/`data-urgency` 검증 없음. S1-S7은 모두 해당 속성 검증 포함 |
| M-37 | NC_ELEVATION이 ELEVATION_TOKENS.surface 재export로 축소 | PASS | `non-conformance.ts:74` — `export const NC_ELEVATION = ELEVATION_TOKENS.surface;` |
| M-38 | non-conformance.ts 내 NC_ELEVATION.raised/floating 5개 → ELEVATION_TOKENS.surface.* 직접 참조 | PASS | `non-conformance.ts` 내 NC_ELEVATION. 참조 0건 확인. ELEVATION_TOKENS.surface.raised/floating 직접 참조 (lines 199, 409, 542, 576, 621, 1015) |
| M-39 | self-audit.mjs 체크 ⑧ (FSM 리터럴 감지) 추가 | PASS | `self-audit.mjs:327,346` — checkFsmLiterals 함수, ⑧ FSM 리터럴 섹션 |
| M-40 | `scripts/bundle-baseline.json` 존재, check-bundle-size.mjs `--baseline`/`--compare` 지원 | PASS | 파일 존재, `check-bundle-size.mjs:25,57,79` — isBaseline 분기 및 compare 분기 |

---

## SHOULD Criteria

실패 항목 (tech-debt 기록 필요):

- **S-07 부분 실패**: `WORKFLOW_PANEL_TOKENS.action.blocked`(비활성 버튼)에 FOCUS_TOKENS.classes.default 없음. `workflow-panel.ts:49-52` blocked 토큰에 focus-visible 클래스 누락. primary 버튼(line 43-48)에는 FOCUS_TOKENS.classes.default 포함되어 있음.
- **S-10 미검증**: `check-i18n-keys.mjs`가 키 삭제 시 exit 1 + stderr 출력 동작을 검증하지 않음 (실행 환경 없이 정적 확인 불가).
- **S-12 FAIL**: `self-audit.mjs --all` 체크 ⑧ 위반 7건 — `CreateEquipmentContent.tsx:115`, `ResultSectionFormDialog.tsx:154`, `CreateNonConformanceForm.tsx:145`, `NCDocumentsSection.tsx:78`, `IntermediateCheckAlert.tsx:153,219`, `document-upload-utils.ts:59`. 모두 PR-3~11 신규 파일이 아닌 기존 파일이나 `--all` 기준 위반 존재.
- **S-13 FAIL**: `.env.example` 및 `apps/frontend/.env.local.example`에 `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=false` 기록 없음.
- **S-14 FAIL**: `tech-debt-tracker.md`에 "Feature Flag NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL 상시화 (2026-Q2)" 항목 등록 없음.

---

## Repair Instructions (FAIL 항목별)

### M-01: TypeScript 에러 3건

**파일**: `apps/frontend/lib/design-tokens/components/non-conformance.ts`

`NC_WORKFLOW_GUIDANCE_TOKENS` (line 822) `Record<NCGuidanceKey, NCGuidanceEntry>` 타입에 누락 키 6개 이상 존재:
- 현재: `open_operator`, `open_manager`, `openRejected_operator`, `openRejected_manager`, ..., `closed_all` 정의됨
- 누락: `open_all`, `corrected_all`, `closed_operator`, `closed_manager` + 추가 2개
- 수정: `NCGuidanceKey` 모든 조합(상태6 × 역할3 = 18개)에 대응하는 엔트리 추가 또는 `Partial<Record<...>>`로 타입 완화

**파일**: `apps/frontend/components/non-conformances/NCDetailClient.tsx`

line 493, 537: `EmptyState` 또는 유사 컴포넌트에 `variant="default"` 전달 중 — `variant` 타입이 `"no-data" | "filtered" | "status-filtered"`만 허용.
- 수정: `"default"` → `"no-data"` (또는 해당 문맥에 맞는 값)

### M-18: terminal panel data-next-action 누락

**파일**: `apps/frontend/components/checkouts/NextStepPanel.tsx:24-36`

terminal 분기 `<section role="status" ...>`에 `data-next-action` 속성 추가:

```tsx
// 현재 (line 27-30):
data-checkout-id={checkoutId}
data-urgency={urgency}

// 수정 후:
data-checkout-id={checkoutId}
data-urgency={urgency}
data-next-action="null"
```

또는 `descriptor.nextAction ?? 'null'`을 사용해 일관성 유지.

### M-29: 통계 카드 padding/gap 하드코딩

**파일**: `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx:234,247`

방법 1 (권장): `CHECKOUT_STATS_VARIANTS`에 padding 토큰 추가 후 사용:

```typescript
// checkout.ts CHECKOUT_STATS_VARIANTS 각 variant에 추가:
cardPadding: SPACING_RHYTHM_TOKENS.comfortable.padding, // 'p-4'
```

방법 2 (임시): OutboundCheckoutsTab에서 직접:

```tsx
// 현재:
<CardHeader className="flex flex-row items-center justify-between pb-1.5 pt-3 px-3">
<CardContent className="px-3 pb-3">

// 수정 후 (SPACING_RHYTHM_TOKENS.tight.padding = 'p-3' 참조):
import { SPACING_RHYTHM_TOKENS } from '@/lib/design-tokens';
<CardHeader className={`flex flex-row items-center justify-between ${SPACING_RHYTHM_TOKENS.tight.padding}`}>
<CardContent className={SPACING_RHYTHM_TOKENS.tight.padding}>
```

### M-36: S8 data-urgency/data-next-action 검증 누락

**파일**: `apps/frontend/tests/e2e/features/checkouts/suite-next-step/s-next-step.spec.ts:157-173`

S8 terminal 테스트에 `data-urgency` 검증 추가:

```typescript
// 현재:
await expect(panel).toHaveAttribute('data-checkout-id', CHECKOUT_050_ID);

// 수정 후 (terminal 상태는 urgency='normal'이 기대됨):
await expect(panel).toHaveAttribute('data-checkout-id', CHECKOUT_050_ID);
await expect(panel).toHaveAttribute('data-urgency', 'normal');
// 또는 M-18 수정 후:
await expect(panel).toHaveAttribute('data-next-action', 'null');
```

---

## Note

M-18 수정 없이는 M-36 S8 수정도 완성될 수 없음 (terminal panel에 `data-next-action` 자체가 없으므로). 두 항목은 순서대로 M-18 → M-36 수정 필요.
