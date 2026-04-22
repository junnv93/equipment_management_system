# Checkout Architecture PR-3~PR-11 실행 계획

**날짜**: 2026-04-22
**슬러그**: checkout-arch-pr3-11
**Status**: ACTIVE
**소스**: Checkout 관리 페이지 아키텍처 개선 (FSM 기반 NextStepPanel 도입 + Token Layer 2 확장)

---

## Scope

반출입(Checkout) 관리 페이지의 시각/상호작용 품질을 **FSM 기반 NextStepPanel + Token Layer 2 확장 + i18n/Audit 게이트**로 향상.

| 이슈 | 해결 메커니즘 |
|------|---------------|
| 1. 카드 배경 깊이 표현 일관성 부족 (AP-04) | `ELEVATION_TOKENS.surface` 신규 — flush/raised/floating 3단 |
| 2. 타이포그래피 스케일 하드코딩 (AP-02) | `TYPOGRAPHY_TOKENS` 신규 — heading/body/label/caption |
| 3. 컴포넌트 내부 간격 리듬 비일관 (AP-03) | `SPACING_RHYTHM_TOKENS` 신규 — component-internal spacing |
| 4. 다음 액션 유도 결여 (AP-05) | `NextStepPanel` + `useCheckoutNextStep` — FSM descriptor 소비 |
| 5. Stepper에 next 노드 하이라이트 부재 | `CheckoutStatusStepper` — descriptor.currentStepIndex+1 강조 |
| 6. MiniProgress descriptor 미사용 | `CheckoutMiniProgress` — descriptor 주입 받아 단계 계산 |
| 7. i18n `checkouts.fsm.*` 키 누락 | ko/checkouts.json + `check-i18n-keys.mjs` 게이트 |
| 8. NC 전용 `NC_ELEVATION` 하드코딩 | `ELEVATION_TOKENS.surface`로 승격·대체 |
| 9. FSM 상태 리터럴 직접 사용 리스크 | `self-audit.mjs` FSM 리터럴 감지 패턴 + 번들 baseline |

**범위 외**: 백엔드 FSM 로직 (schemas/fsm/checkout-fsm.ts 유지), Transition 테이블 수정, 신규 반출 상태 추가.

---

## 현재 상태 (조사 결과)

### packages/schemas/src/fsm/checkout-fsm.ts (기존)
- `CheckoutAction` / `NextActor` / `Urgency` 타입 export
- `NextStepDescriptor` 인터페이스 + `NextStepDescriptorSchema` Zod
- `CHECKOUT_TRANSITIONS` 테이블 (Object.freeze, 18+ rules)
- `getNextStep(checkout, userPermissions)` 함수 — 이 함수를 훅이 래핑
- 불변 검증: `assertFsmInvariants`이 module load 시 실행
- **PR-3~11은 이 FSM을 소비만 함 — 수정 금지**

### apps/frontend/lib/design-tokens/
- `semantic.ts`:
  - `ELEVATION_TOKENS` 존재 — `layer`(z-index 7종) + `shadow`(5종) — **`surface` 없음**
  - `TYPOGRAPHY_PRIMITIVES` (primitives.ts)는 있으나 semantic `TYPOGRAPHY_TOKENS`는 없음
  - `SECTION_RHYTHM_TOKENS`는 있으나 component-internal `SPACING_RHYTHM_TOKENS`는 없음
- `components/`: 26개 파일 — checkout.ts 존재, **workflow-panel.ts 없음**
- `index.ts`: ELEVATION_TOKENS / MICRO_TYPO 재수출 중

### apps/frontend/components/checkouts/
- `CheckoutStatusStepper.tsx` — `STEP_STATUSES` 로컬 배열로 단계 정의 (하드코딩). FSM descriptor 미사용.
- `CheckoutMiniProgress.tsx` — `CHECKOUT_MINI_PROGRESS.statusToStepIndex` 기반. descriptor 미사용.
- `CheckoutGroupCard.tsx` — 기존 그룹 카드, FSM 통합 예정
- `NextStepPanel.tsx` **없음** (신규)

### apps/frontend/hooks/
- `use-*` 40+ 훅 존재 — `use-checkout-next-step.ts` **없음** (신규)

### apps/frontend/messages/ko/checkouts.json
- `stepper.*` (line 196~211) — 단계 레이블 존재
- `rentalFlow.*` (line 396+)
- **`fsm.*` 네임스페이스 없음** — FSM transition rule의 `labelKey`/`hintKey` 키가 i18n에 존재하지 않음

### apps/frontend/components/non-conformances/
- NC_ELEVATION 사용 파일 0 (NC 컴포넌트 디렉토리 내에서는 미사용).
- **실제 NC_ELEVATION 소비처는 `lib/design-tokens/components/non-conformance.ts`**: raised/floating 5회 내부 참조.
- PR-10 대상은 `non-conformance.ts` 내부의 5개 참조를 `ELEVATION_TOKENS.surface.*`로 치환.

### scripts/
- `self-audit.mjs` 존재 — 7대 원칙 검사 (URL/eslint-disable/any/SSOT/role 리터럴/setQueryData/a11y)
- `check-bundle-size.mjs` 존재 — First Load JS 250KB 임계값. baseline 파일 없음.
- `check-i18n-keys.mjs` **없음** (신규)

### apps/frontend/i18n/request.ts
- 22개 네임스페이스 동적 로딩 (`checkouts` 포함). 파일 없는 네임스페이스 무시 — **PR-8 시 fsm은 별도 네임스페이스가 아니라 checkouts 내 섹션으로 추가**.

---

## Phase 순서 (의존성 그래프 기반)

```
Phase 1  PR-3 (tokens 확장)  ──────┬─→ Phase 3 PR-4 (NextStepPanel)
                                   ├─→ Phase 4 PR-6 (Stepper next)
                                   ├─→ Phase 4 PR-7 (Stat 계층화)
                                   └─→ Phase 7 PR-10 (NC elevation 승격)
Phase 2  PR-8 (i18n fsm.*)   ──────┘
                                       │
                                       └─→ Phase 5 PR-5 (CheckoutDetailClient 통합)
                                                         │
                                                         └─→ Phase 6 PR-9 (E2E 8 시나리오)

Phase 8  PR-11 (self-audit + bundle baseline) — 독립
```

| Phase | PR | 우선도 | 모드 | 예상 | 의존 |
|-------|-----|--------|------|-----|------|
| 1 | PR-3 | HIGH | 1 | 2h | — |
| 2 | PR-8 | MEDIUM | 0 | 1h | — (병렬) |
| 3 | PR-4 | HIGH | 1 | 2h | PR-3 |
| 4 | PR-6 | HIGH | 1 | 1.5h | PR-3 |
| 4 | PR-7 | MEDIUM | 1 | 1.5h | PR-3 |
| 5 | PR-5 | HIGH | 2 | 3h | PR-4 |
| 6 | PR-9 | MEDIUM | 1 | 2h | PR-5 + PR-8 |
| 7 | PR-10 | MEDIUM | 1 | 0.5h | PR-3 (+ NC e2e 통과) |
| 8 | PR-11 | MEDIUM | 0 | 1h | — |

---

## Phase 1: PR-3 — Design Token Layer 2 확장

**목표**: Layer 2 (semantic) 토큰에 `ELEVATION_TOKENS.surface` / `TYPOGRAPHY_TOKENS` / `SPACING_RHYTHM_TOKENS`, Layer 3에 `workflow-panel.ts` 신설.

**변경 파일**:

1. `apps/frontend/lib/design-tokens/semantic.ts`
   - `ELEVATION_TOKENS` 객체에 `surface` 추가:
     ```typescript
     surface: {
       flush: '',                              // 배경과 동일 (inline 정보)
       raised: 'shadow-sm',                    // 카드 계층 (정보 카드, KPI)
       floating: 'shadow-md ring-1 ring-border/10', // 액션 영역 (NextStepPanel, ActionBar)
     },
     ```
   - `TYPOGRAPHY_TOKENS` 신규 export:
     ```typescript
     export const TYPOGRAPHY_TOKENS = {
       heading: {
         h1: 'text-2xl font-bold leading-tight tracking-tight',
         h2: 'text-xl font-semibold leading-snug',
         h3: 'text-lg font-semibold leading-snug',
         h4: 'text-base font-semibold leading-snug',
       },
       body: {
         base: 'text-sm leading-normal',
         large: 'text-base leading-relaxed',
         small: 'text-xs leading-normal',
       },
       label: {
         base: 'text-xs font-medium uppercase tracking-wide text-muted-foreground',
         compact: `${MICRO_TYPO.label} font-semibold uppercase tracking-wide`,
       },
       caption: {
         base: `${MICRO_TYPO.caption} text-muted-foreground`,
         meta: `${MICRO_TYPO.meta} text-muted-foreground tabular-nums`,
       },
     } as const;
     ```
   - `SPACING_RHYTHM_TOKENS` 신규 export (컴포넌트 내부 간격 — SECTION_RHYTHM_TOKENS와 구분):
     ```typescript
     export const SPACING_RHYTHM_TOKENS = {
       tight:       { padding: 'p-3',  gap: 'gap-2',   stack: 'space-y-2' },
       comfortable: { padding: 'p-4',  gap: 'gap-3',   stack: 'space-y-3' },
       relaxed:     { padding: 'p-5',  gap: 'gap-4',   stack: 'space-y-4' },
       spacious:    { padding: 'p-6',  gap: 'gap-5',   stack: 'space-y-5' },
     } as const;
     export type SpacingRhythm = keyof typeof SPACING_RHYTHM_TOKENS;
     ```
   - 타입 export: `ElevationSurface = keyof typeof ELEVATION_TOKENS.surface`

2. `apps/frontend/lib/design-tokens/components/workflow-panel.ts` (신규)
   - 기존 checkout.ts 패턴 상속 (import FOCUS_TOKENS, MICRO_TYPO, TRANSITION_PRESETS, ELEVATION_TOKENS):
     ```typescript
     import { ELEVATION_TOKENS, FOCUS_TOKENS, MICRO_TYPO, SPACING_RHYTHM_TOKENS } from '../semantic';
     import { TRANSITION_PRESETS } from '../motion';
     import { getSemanticSolidBgClasses, getSemanticLeftBorderClasses } from '../brand';

     export const WORKFLOW_PANEL_TOKENS = {
       container: {
         base: [
           'rounded-lg border border-border/60 bg-card',
           ELEVATION_TOKENS.surface.floating,
           SPACING_RHYTHM_TOKENS.comfortable.padding,
           TRANSITION_PRESETS.fastBgBorder,
         ].join(' '),
         urgency: {
           normal:   getSemanticLeftBorderClasses('info'),
           warning:  getSemanticLeftBorderClasses('warning'),
           critical: getSemanticLeftBorderClasses('critical'),
         },
       },
       header: 'flex items-center justify-between mb-2',
       title: 'text-sm font-semibold text-foreground flex items-center gap-2',
       urgencyDot: {
         normal:   'w-2 h-2 rounded-full bg-brand-info',
         warning:  'w-2 h-2 rounded-full bg-brand-warning animate-pulse',
         critical: 'w-2 h-2 rounded-full bg-brand-critical animate-pulse',
       },
       hint:   'text-sm text-muted-foreground leading-relaxed',
       actor:  `${MICRO_TYPO.label} text-muted-foreground mt-2`,
       action: {
         primary:  'mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90',
         blocked:  'mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-md bg-muted text-muted-foreground cursor-not-allowed',
         focus:    FOCUS_TOKENS.classes.default,
       },
       blockedReason: 'text-xs text-muted-foreground italic mt-1',
       terminal: 'text-sm text-muted-foreground text-center py-4',
     } as const;

     export type WorkflowPanelUrgency = keyof typeof WORKFLOW_PANEL_TOKENS.container.urgency;
     ```

3. `apps/frontend/lib/design-tokens/index.ts`
   - `ELEVATION_TOKENS` 기존 export 유지 (surface 자동 포함)
   - 신규 export 추가:
     ```typescript
     export {
       TYPOGRAPHY_TOKENS,
       SPACING_RHYTHM_TOKENS,
       type ElevationSurface,
       type SpacingRhythm,
     } from './semantic';

     export {
       WORKFLOW_PANEL_TOKENS,
       type WorkflowPanelUrgency,
     } from './components/workflow-panel';
     ```

**성공 기준**:
- [ ] `pnpm --filter frontend run tsc --noEmit` PASS
- [ ] `ELEVATION_TOKENS.surface.flush`, `.raised`, `.floating` 접근 가능
- [ ] `TYPOGRAPHY_TOKENS.heading.h1` ~ `caption.meta` 12개 키 접근 가능
- [ ] `SPACING_RHYTHM_TOKENS.tight|comfortable|relaxed|spacious` 각각 `padding/gap/stack` 제공
- [ ] `workflow-panel.ts` 파일 생성, `components/` 디렉토리에 위치
- [ ] index.ts 재수출 완료 — `import { WORKFLOW_PANEL_TOKENS } from '@/lib/design-tokens'` 컴파일 성공
- [ ] 기존 checkout.ts / non-conformance.ts 영향 0 (회귀 없음)

---

## Phase 2: PR-8 — i18n checkouts.fsm.* 키 추가 + check-i18n-keys.mjs 게이트

**목표**: FSM transition rule의 `labelKey` / `hintKey`를 번역할 수 있도록 `checkouts.fsm.*` 섹션 추가 + 누락 감지 게이트.

**변경 파일**:

1. `apps/frontend/messages/ko/checkouts.json`
   - `stepper` 섹션 뒤(라인 211 이후)에 `fsm` 섹션 신규 추가:
     ```json
     "fsm": {
       "action": {
         "approve": "승인",
         "reject": "반려",
         "cancel": "취소",
         "start": "반출 시작",
         "lender_check": "대여자 확인",
         "borrower_receive": "수령 확인",
         "mark_in_use": "사용 시작",
         "borrower_return": "반납",
         "lender_receive": "수령",
         "submit_return": "반입 처리",
         "approve_return": "반입 승인",
         "reject_return": "반입 반려",
         "terminal": "완료된 반출"
       },
       "hint": {
         "pendingApprove": "승인자의 검토를 기다리고 있습니다.",
         "waitingApprover": "승인자가 확인한 후 반려됩니다.",
         "pendingCancel": "요청자가 직접 취소할 수 있습니다.",
         "approvedStart": "승인되었습니다. 반출을 시작하세요.",
         "approvedLenderCheck": "대여 장비 상태를 확인하고 인계 준비를 하세요.",
         "lenderCheckedBorrowerReceive": "차용자가 수령을 확인해야 합니다.",
         "borrowerReceivedMarkInUse": "사용을 시작하면 기록됩니다.",
         "inUseBorrowerReturn": "반납 시 반납 버튼을 눌러 주세요.",
         "borrowerReturnedLenderReceive": "대여자가 반납 수령을 확인하세요.",
         "checkedOutSubmitReturn": "반입 처리 후 승인자 최종 승인 필요.",
         "overdueReturn": "기한이 초과되었습니다. 즉시 반입하세요.",
         "returnedApproveReturn": "반입 내용을 확인하고 최종 승인하세요.",
         "returnedRejectReturn": "반입 검사 이상 시 반려하면 장비는 반출 상태로 복귀합니다.",
         "terminal": "모든 절차가 완료되었습니다."
       },
       "actor": {
         "requester": "요청자",
         "approver": "승인자",
         "logistics": "반출 담당자",
         "lender": "대여자",
         "borrower": "차용자",
         "system": "시스템",
         "none": "해당 없음"
       },
       "blocked": {
         "permission": "현재 역할에는 이 작업 권한이 없습니다.",
         "role_mismatch": "담당 역할이 아닙니다."
       },
       "urgency": {
         "normal":   "일반",
         "warning":  "주의",
         "critical": "긴급"
       },
       "panelTitle": "다음 단계"
     }
     ```
   - 동일 구조를 `apps/frontend/messages/en/checkouts.json` 에도 추가 (영문 번역).
   - 키 목록은 `CHECKOUT_TRANSITIONS`의 `labelKey` (11개 유니크) + `hintKey` (15개 유니크) + `NextActor` 7개 + blocking 2개 + urgency 3개 전수.

2. `scripts/check-i18n-keys.mjs` (신규)
   - 목적: FSM 변경 시 i18n 키 누락을 빌드 시점에 차단.
   - 로직:
     ```js
     // 1. packages/schemas/src/fsm/checkout-fsm.ts의 CHECKOUT_TRANSITIONS을 import (tsx 또는 정규식 파싱)
     // 2. 유니크한 labelKey / hintKey 집합 추출
     // 3. apps/frontend/messages/ko/checkouts.json과 en/checkouts.json 읽기
     // 4. fsm.action.{labelKey} / fsm.hint.{hintKey}에 모든 키가 존재하는지 검증
     // 5. 누락 시 stderr + exit(1)
     ```
   - 사용법: `node scripts/check-i18n-keys.mjs`
   - 출력:
     ```
     ✅ i18n check: ko/checkouts.json — 11 labels + 15 hints 모두 존재
     ✅ i18n check: en/checkouts.json — 11 labels + 15 hints 모두 존재
     ```
   - 실패 예시:
     ```
     ❌ i18n check: ko/checkouts.json
       누락 fsm.action.approve_return
       누락 fsm.hint.overdueReturn
     ```

3. `apps/backend` 패키지 내 i18n은 변경 없음 (백엔드는 키 문자열만 저장).

**성공 기준**:
- [ ] ko/checkouts.json 및 en/checkouts.json 에 `fsm.action`, `fsm.hint`, `fsm.actor`, `fsm.blocked`, `fsm.urgency`, `fsm.panelTitle` 6개 서브트리 존재
- [ ] `CHECKOUT_TRANSITIONS` 의 모든 labelKey/hintKey가 각 로케일에 존재
- [ ] `node scripts/check-i18n-keys.mjs` 실행 시 종료코드 0
- [ ] 일부러 한 키 삭제 후 재실행 시 종료코드 1 + stderr에 누락 키 출력
- [ ] `pnpm --filter frontend run build` PASS

---

## Phase 3: PR-4 — NextStepPanel 컴포넌트 + useCheckoutNextStep 훅

**목표**: FSM descriptor를 소비하여 "현재 상태에서 다음 액션" 을 UI로 안내하는 재사용 가능한 Panel + Hook.

**변경 파일**:

1. `apps/frontend/hooks/use-checkout-next-step.ts` (신규)
   ```typescript
   import { useMemo } from 'react';
   import { useSession } from 'next-auth/react';
   import {
     getNextStep,
     type CheckoutStatus,
     type CheckoutPurpose,
     type NextStepDescriptor,
   } from '@equipment-management/schemas';
   import { getPermissions, type UserRole } from '@equipment-management/shared-constants';

   interface UseCheckoutNextStepInput {
     status: CheckoutStatus;
     purpose: CheckoutPurpose;
     dueAt?: string | null;
   }

   /**
    * FSM getNextStep을 React hook으로 래핑.
    * - userPermissions를 세션 role로부터 파생
    * - checkout input 메모이제이션
    * - NextStepDescriptor 반환
    */
   export function useCheckoutNextStep(input: UseCheckoutNextStepInput): NextStepDescriptor {
     const { data: session } = useSession();
     const role = (session?.user?.role as UserRole | undefined) ?? 'user';
     const permissions = useMemo(() => getPermissions(role) as readonly string[], [role]);

     return useMemo(
       () => getNextStep(input, permissions),
       [input.status, input.purpose, input.dueAt, permissions]
     );
   }
   ```

2. `apps/frontend/components/checkouts/NextStepPanel.tsx` (신규)
   - FSM descriptor를 시각화. urgency별 색상, 차단 사유 표시, 액션 버튼 상태(활성/차단).
   ```typescript
   'use client';
   import { useTranslations } from 'next-intl';
   import { useRouter } from 'next/navigation';
   import { AlertCircle, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
   import { cn } from '@/lib/utils';
   import type { NextStepDescriptor } from '@equipment-management/schemas';
   import { WORKFLOW_PANEL_TOKENS } from '@/lib/design-tokens';

   interface NextStepPanelProps {
     descriptor: NextStepDescriptor;
     checkoutId: string;
     onAction?: (action: NonNullable<NextStepDescriptor['nextAction']>) => void | Promise<void>;
     className?: string;
   }

   export function NextStepPanel({ descriptor, checkoutId, onAction, className }: NextStepPanelProps) {
     const t = useTranslations('checkouts.fsm');
     const urgency = descriptor.urgency;

     // Terminal state: 완료 표시만
     if (descriptor.nextAction === null) {
       return (
         <section
           role="status"
           aria-label={t('panelTitle')}
           className={cn(WORKFLOW_PANEL_TOKENS.container.base, className)}
         >
           <div className={WORKFLOW_PANEL_TOKENS.terminal}>
             <CheckCircle2 className="inline h-5 w-5 text-brand-ok mr-1" aria-hidden="true" />
             {t(`hint.${descriptor.hintKey}`)}
           </div>
         </section>
       );
     }

     return (
       <section
         role="region"
         aria-label={t('panelTitle')}
         aria-live={urgency === 'critical' ? 'assertive' : 'polite'}
         className={cn(
           WORKFLOW_PANEL_TOKENS.container.base,
           WORKFLOW_PANEL_TOKENS.container.urgency[urgency],
           className,
         )}
         data-checkout-id={checkoutId}
         data-urgency={urgency}
         data-next-action={descriptor.nextAction}
       >
         <header className={WORKFLOW_PANEL_TOKENS.header}>
           <h3 className={WORKFLOW_PANEL_TOKENS.title}>
             <span className={WORKFLOW_PANEL_TOKENS.urgencyDot[urgency]} aria-hidden="true" />
             {t('panelTitle')}
           </h3>
           <span className={WORKFLOW_PANEL_TOKENS.actor}>
             {t(`actor.${descriptor.nextActor}`)}
           </span>
         </header>
         <p className={WORKFLOW_PANEL_TOKENS.hint}>{t(`hint.${descriptor.hintKey}`)}</p>
         {descriptor.availableToCurrentUser ? (
           <button
             type="button"
             className={cn(WORKFLOW_PANEL_TOKENS.action.primary, WORKFLOW_PANEL_TOKENS.action.focus)}
             onClick={() => onAction?.(descriptor.nextAction!)}
             data-testid="next-step-action"
           >
             {t(`action.${descriptor.labelKey}`)}
             <ArrowRight className="h-4 w-4" aria-hidden="true" />
           </button>
         ) : (
           <>
             <button
               type="button"
               disabled
               className={WORKFLOW_PANEL_TOKENS.action.blocked}
               aria-disabled="true"
             >
               {t(`action.${descriptor.labelKey}`)}
             </button>
             {descriptor.blockingReason && (
               <p className={WORKFLOW_PANEL_TOKENS.blockedReason}>
                 {t(`blocked.${descriptor.blockingReason}`)}
               </p>
             )}
           </>
         )}
       </section>
     );
   }
   ```

**성공 기준**:
- [ ] `hooks/use-checkout-next-step.ts` 존재, `useCheckoutNextStep` default/named export
- [ ] `components/checkouts/NextStepPanel.tsx` 존재, FSM descriptor prop 수신
- [ ] 훅은 `getNextStep` SSOT 호출 — 자체 FSM 로직 재구현 0
- [ ] Panel에서 FSM 상태 리터럴(`'pending'` 등) 문자열 비교 0 (descriptor 필드만 사용)
- [ ] `data-testid="next-step-action"` 액션 버튼에 부착 (E2E 훅)
- [ ] `pnpm --filter frontend run tsc --noEmit` PASS

---

## Phase 4a: PR-6 — CheckoutStatusStepper next 노드 + CheckoutMiniProgress descriptor 확장

**목표**: 기존 Stepper/MiniProgress가 FSM descriptor 기반으로 "다음 단계 하이라이트"를 표현.

**변경 파일**:

1. `apps/frontend/components/checkouts/CheckoutStatusStepper.tsx`
   - Props에 optional `nextStepIndex?: number` 추가 (1-based, undefined이면 기존 동작).
   - `STEP_STATUSES` 로컬 하드코딩 유지 (리팩토링 범위 외). currentIndex / nextStepIndex를 비교해 next 노드에 `ring-2 ring-brand-info/40` 프리뷰 링 적용.
   - 모바일/데스크톱 양쪽 레이아웃에 next 하이라이트 적용.
   - 기존 `aria-current="step"` 유지 + next 노드에 `data-step-state="next"` 추가.

2. `apps/frontend/components/checkouts/CheckoutMiniProgress.tsx`
   - Props에 optional `descriptor?: NextStepDescriptor` 추가.
   - descriptor 주어지면 `currentStepIndex` / `totalSteps` / `urgency`를 descriptor에서 가져오고, 없으면 기존 `CHECKOUT_MINI_PROGRESS.statusToStepIndex` fallback.
   - `urgency === 'critical'`이면 `late` 스타일 자동 적용 (기존 overdue 로직과 병합).

3. `apps/frontend/lib/design-tokens/components/checkout.ts`
   - `CHECKOUT_STEPPER_TOKENS.status`에 `next` 서브트리 추가:
     ```typescript
     next: {
       node: 'bg-brand-info/5 ring-2 ring-brand-info/40',
       icon: 'text-brand-info',
       label: 'text-brand-info font-medium',
     },
     ```

**성공 기준**:
- [ ] Stepper가 `nextStepIndex` prop undefined일 때 기존과 동일하게 동작 (회귀 0)
- [ ] `nextStepIndex` 지정 시 해당 노드에 `ring` 프리뷰 적용, `data-step-state="next"` 부착
- [ ] MiniProgress `descriptor` prop 지정 시 descriptor.currentStepIndex / totalSteps 우선 사용
- [ ] descriptor.urgency=='critical'일 때 late(brand-critical) 도트 스타일
- [ ] 기존 props만 전달된 호출부 (CheckoutGroupCard 등) 빌드 에러 없음

---

## Phase 4b: PR-7 — Stat Card 계층화 + Typography·Spacing·Motion (AP-01·02·03·06·09)

**목표**: 대시보드/반출 통계 카드를 새 TYPOGRAPHY_TOKENS + SPACING_RHYTHM_TOKENS + ELEVATION_TOKENS.surface로 재구성.

**변경 파일**:

1. `apps/frontend/lib/design-tokens/components/checkout.ts`
   - `CHECKOUT_STATS_VARIANTS` 각 variant에 elevation/spacing 결합 클래스 추가 예시:
     ```typescript
     // 기존 cursor-pointer border-2 유지 + 아래 추가
     baseContainer: [
       ELEVATION_TOKENS.surface.raised,
       SPACING_RHYTHM_TOKENS.relaxed.padding,
     ].join(' '),
     ```
   - 값 텍스트에 `TYPOGRAPHY_TOKENS.heading.h2` 적용 가능하도록 token 정의.

2. `apps/frontend/components/checkouts/CheckoutStats.tsx` (있다면) — 카드 value/label/icon 에 TYPOGRAPHY_TOKENS / SPACING_RHYTHM_TOKENS 적용.
3. `apps/frontend/components/dashboard/StatsCard.tsx` (있다면) — 동일 적용.

**AP 준수**:
- **AP-01 색상**: 기존 brand semantic 유지 (변경 없음)
- **AP-02 타이포**: 숫자(`tabular-nums` + h2), 레이블(label.base), 캡션(caption.base)
- **AP-03 간격**: SPACING_RHYTHM_TOKENS.relaxed 일관 적용
- **AP-06 모션**: CHECKOUT_MOTION.statsCard (TRANSITION_PRESETS.fastBorderBg — `transition-all` 금지 유지)
- **AP-09 접근성**: value에 `aria-label` (숫자+단위), 카드 전체에 `role="group"` or 버튼 역할

**성공 기준**:
- [ ] stats card value/label에 `TYPOGRAPHY_TOKENS.*` 참조
- [ ] padding/gap이 `SPACING_RHYTHM_TOKENS.relaxed|comfortable` 참조
- [ ] `shadow-sm` 등 직접 하드코딩 제거 → `ELEVATION_TOKENS.surface.raised` 사용
- [ ] `transition-all` 사용 0 (TRANSITION_PRESETS만)
- [ ] 통계 value에 `aria-label` (예: "반출 대기 12건") 존재

---

## Phase 5: PR-5 — CheckoutGroupCard + CheckoutDetailClient FSM 통합 + Feature Flag

**목표**: PR-4 NextStepPanel을 상세 페이지와 그룹 카드에 통합. **Feature Flag `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL`**로 점진 전환.

**변경 파일**:

1. `apps/frontend/lib/features/checkout-flags.ts` (신규, 또는 기존 features 모듈에 추가)
   ```typescript
   /** Feature Flag SSOT — env 변수 읽기 헬퍼 */
   export function isNextStepPanelEnabled(): boolean {
     return process.env.NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL === 'true';
   }
   ```

2. `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx`
   - `useCheckoutNextStep` 훅 호출하여 descriptor 획득.
   - Stepper 위 또는 옆에 `isNextStepPanelEnabled()` gating으로 `<NextStepPanel>` 조건부 렌더:
     ```tsx
     {isNextStepPanelEnabled() && (
       <NextStepPanel
         descriptor={descriptor}
         checkoutId={checkout.id}
         onAction={handleAction}
       />
     )}
     ```
   - `CheckoutStatusStepper`에 `nextStepIndex={descriptor.currentStepIndex + 1}` 전달.
   - 기존 액션 버튼(승인/반려/반입 처리 등)은 유지 — NextStepPanel은 "유도"만, 실제 실행은 기존 컴포넌트에 위임 (중복 UI는 flag로 제어).

3. `apps/frontend/components/checkouts/CheckoutGroupCard.tsx`
   - 그룹 내 개별 checkout 행에 `useCheckoutNextStep` 사용은 N+1 훅 호출 이슈 — **대안**: 그룹 레벨에서 `getNextStep`을 `useMemo`로 계산하여 `CheckoutMiniProgress`에 `descriptor` prop 전달.
   - Feature flag off일 때는 기존 동작 (descriptor prop 없이 MiniProgress 렌더).

4. `.env.example` 또는 `apps/frontend/.env.local.example` (존재 시)
   - `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=false` 기본값 추가 (롤아웃 시 true로 전환).

**성공 기준**:
- [ ] `isNextStepPanelEnabled()` 헬퍼 존재, `process.env.NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL === 'true'` 비교
- [ ] CheckoutDetailClient에서 flag off일 때 NextStepPanel DOM 미렌더
- [ ] flag on일 때 NextStepPanel 상단 렌더 + Stepper에 nextStepIndex 전달
- [ ] GroupCard는 flag 관계없이 빌드 에러 없음 (descriptor prop optional)
- [ ] `pnpm --filter frontend run tsc --noEmit` + `build` PASS
- [ ] flag off 상태에서 기존 E2E 전부 PASS (회귀 없음)

---

## Phase 6: PR-9 — checkouts.next-step.spec.ts E2E 8 시나리오

**목표**: NextStepPanel이 FSM 상태별로 올바르게 렌더되는지 E2E 검증.

**변경 파일**:

1. `apps/frontend/tests/e2e/features/checkouts/suite-next-step/s-next-step.spec.ts` (신규)
   - **실행 조건**: `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=true` 환경에서만 실행 (test.describe.configure + env 가드).
   - 8 시나리오:
     | # | 시나리오 | status | purpose | 역할 | 기대 |
     |---|---------|--------|---------|-----|------|
     | S1 | pending → approver | pending | calibration | approver (lab_manager/tm) | `data-next-action="approve"`, 액션 버튼 enabled |
     | S2 | pending → requester | pending | calibration | 일반 사용자 | blocked 메시지, `data-blocking="permission"` 또는 버튼 disabled |
     | S3 | approved → logistics | approved | calibration | logistics/tm | `data-next-action="start"` |
     | S4 | checked_out → 반입 | checked_out | calibration | approver | `data-next-action="submit_return"` |
     | S5 | overdue urgency critical | overdue | calibration | approver | `data-urgency="critical"`, aria-live=assertive |
     | S6 | rental lender_checked | lender_checked | rental | borrower | `data-next-action="borrower_receive"` |
     | S7 | returned → approve_return | returned | calibration | approver | `data-next-action="approve_return"` |
     | S8 | terminal return_approved | return_approved | calibration | 모든 역할 | Panel 표시, 액션 버튼 없음 (role=status) |

   - 각 시나리오: storageState 기반 역할 로그인 → seeded checkout ID로 이동 → panel selector 검증.

2. `apps/frontend/tests/e2e/fixtures/checkouts-next-step.ts` (필요 시)
   - 8 시나리오용 checkout seed ID 상수 (`CHECKOUT_NEXT_STEP_FIXTURES`) — 기존 jest-global-setup에서 seed 가능 여부 확인 후 필요하면 추가.

**성공 기준**:
- [ ] 8개 test 케이스 작성
- [ ] 각 테스트가 `data-checkout-id`, `data-urgency`, `data-next-action` data attribute로 검증
- [ ] flag off일 때 describe.skip 처리 (env gate 안전성)
- [ ] `pnpm --filter frontend run test:e2e -- next-step` 8개 PASS

---

## Phase 7: PR-10 — NC_ELEVATION → ELEVATION_TOKENS.surface 승격

**목표**: NC 전용 `NC_ELEVATION`을 글로벌 `ELEVATION_TOKENS.surface`로 통합 (SSOT 단일화).

**변경 파일**:

1. `apps/frontend/lib/design-tokens/components/non-conformance.ts`
   - `NC_ELEVATION` 정의 (line 73-77) `ELEVATION_TOKENS.surface` import로 대체:
     ```typescript
     // 제거
     // export const NC_ELEVATION = { flush: '', raised: 'shadow-sm', floating: 'shadow-md ring-1 ring-border/10' };
     // 대체
     import { ELEVATION_TOKENS } from '../semantic';
     /** @deprecated ELEVATION_TOKENS.surface 사용 */
     export const NC_ELEVATION = ELEVATION_TOKENS.surface;
     ```
   - 내부 5개 사용처 (NC_WORKFLOW_TOKENS, NC_INFO_CARD_TOKENS, NC_COLLAPSIBLE_TOKENS, NC_ACTION_BAR_TOKENS, NC_DOCUMENTS_SECTION_TOKENS, MINI_WORKFLOW cards에서 `NC_ELEVATION.raised|floating` 참조)를 모두 `ELEVATION_TOKENS.surface.raised|floating`로 교체.
   - 내부 cardHover 주석(205-207) 갱신 — "NC_ELEVATION" → "ELEVATION_TOKENS.surface"

2. `apps/frontend/lib/design-tokens/index.ts`
   - `NC_ELEVATION` @deprecated 주석 유지 + re-export 유지 (하위 호환, 3주 후 제거 예정 기록).

**성공 기준**:
- [ ] `NC_ELEVATION` 정의 5줄 리터럴이 `ELEVATION_TOKENS.surface` 재export로 대체
- [ ] non-conformance.ts 내 5개 사용처 모두 `ELEVATION_TOKENS.surface.raised|floating` 직접 참조로 전환
- [ ] `grep -r "NC_ELEVATION\." apps/frontend/` 결과 0 (재export 정의 제외)
- [ ] NC 페이지 시각 회귀 없음 (동일 shadow/ring 클래스 렌더)
- [ ] NC E2E 전부 PASS

---

## Phase 8: PR-11 — self-audit.mjs FSM 리터럴 감지 + 번들 크기 baseline

**목표**: FSM 상태 리터럴 직접 사용을 pre-commit에서 차단 + 번들 크기 baseline 생성으로 성능 회귀 감지.

**변경 파일**:

1. `scripts/self-audit.mjs`
   - 체크 ⑧ 신규 추가 (패턴 기반):
     ```js
     const CHECKOUT_STATUS_LITERALS = [
       'pending','approved','rejected','checked_out','returned','return_approved',
       'lender_checked','borrower_received','borrower_returned','lender_received',
       'in_use','overdue','canceled',
     ];
     const FSM_LITERAL_RE = new RegExp(
       `\\b(status|currentStatus|checkoutStatus)\\s*[!=]==\\s*['"\`](${CHECKOUT_STATUS_LITERALS.join('|')})['"\`]`
     );
     function checkFsmLiterals(file, lines) {
       if (isTestFile(file)) return;
       if (isSsotDefinitionFile(file)) return; // checkout-fsm.ts, enums/checkout.ts 제외
       if (file.includes('/design-tokens/')) return; // 토큰 정의 파일 제외
       lines.forEach((raw, i) => {
         const line = stripComments(raw);
         if (FSM_LITERAL_RE.test(line)) {
           fail(
             '⑧ FSM 리터럴',
             file,
             i + 1,
             'CheckoutStatus 문자열 직접 비교 — CheckoutStatusValues (CSVal.X) 상수 또는 getNextStep 사용 필요',
           );
         }
       });
     }
     ```
   - `for (const file of files)` 루프에 `checkFsmLiterals(file, lines)` 추가.
   - `docs/references/self-audit.md`에 체크 ⑧ 설명 섹션 추가 (선택 — 필수 아님).

2. `scripts/check-bundle-size.mjs`
   - baseline 지원 로직 추가:
     ```js
     const BASELINE_PATH = 'scripts/bundle-baseline.json';
     // --baseline 플래그: 현재 측정값을 baseline으로 저장
     // --compare 플래그 (기본): baseline 대비 5% 초과 라우트 경고
     ```
   - baseline 파일 포맷 예시:
     ```json
     {
       "generatedAt": "2026-04-22",
       "routes": {
         "/checkouts/[id]": 178.3,
         "/checkouts": 182.1,
         "/dashboard": 201.5
       },
       "tolerancePct": 5
     }
     ```

3. `scripts/bundle-baseline.json` (신규 — 최초 baseline)
   - PR-5 머지 후 `pnpm --filter frontend build 2>&1 | node scripts/check-bundle-size.mjs --baseline`으로 생성된 값.

**성공 기준**:
- [ ] self-audit 체크 ⑧ (FSM 리터럴) 추가, `--all` / `--staged` 양쪽 모드 지원
- [ ] 테스트 파일 + SSOT 정의 파일(`checkout-fsm.ts`, `enums/checkout.ts`) + design-tokens/ 는 예외
- [ ] 일부러 `status === 'pending'` 삽입 후 `node scripts/self-audit.mjs --staged` 실행 시 체크 ⑧ 위반 보고
- [ ] `scripts/bundle-baseline.json` 생성됨, 키/라우트 형식 JSON 파싱 가능
- [ ] `--baseline` vs `--compare` 모드 둘 다 동작 — compare 시 +5% 초과하면 종료코드 1

---

## 통합 검증 순서 (전 PR 머지 후)

```bash
# 1) 타입
pnpm --filter frontend run tsc --noEmit
pnpm --filter backend  run tsc --noEmit

# 2) 빌드
pnpm --filter frontend run build

# 3) Lint + Self-audit
pnpm --filter frontend run lint
node scripts/self-audit.mjs --all

# 4) i18n 키
node scripts/check-i18n-keys.mjs

# 5) 번들 baseline 비교
pnpm --filter frontend run build 2>&1 | node scripts/check-bundle-size.mjs --compare

# 6) E2E (Feature Flag on)
NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=true \
  pnpm --filter frontend run test:e2e -- --grep "@next-step"
```

---

## 롤백 전략

- **PR-3 롤백**: ELEVATION_TOKENS.surface 제거 → PR-10 (NC 재export 의존) 선 롤백 필요
- **PR-4 롤백**: 파일 2개 삭제 (hook + panel) — PR-5가 import하므로 PR-5 롤백 선행
- **PR-5 롤백 (가장 쉬움)**: `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=false` 환경 변수로 런타임 비활성화. 컴포넌트 import는 유지되나 DOM 미렌더.
- **PR-8 롤백**: fsm.* 섹션만 제거 (기존 stepper.* 영향 없음)
- **PR-11 롤백**: 체크 ⑧ 주석 처리 + bundle-baseline.json 삭제

---

## Risks & Tradeoffs

1. **PR-4 의 useSession 의존**: NextStepPanel이 next-auth에 결합됨. SSR에서는 session=null 가능 → role fallback 'user'. 추후 Server Component 지원 시 props로 role 주입하는 variant 추가 고려.
2. **PR-5 Feature Flag 유효 기간**: flag 장기 잔류는 debt. 머지 후 2 세션 이내 기본값 true 전환 목표 (tech-debt tracker 등록 필수).
3. **PR-6 MiniProgress descriptor optional**: 기존 CHECKOUT_MINI_PROGRESS.statusToStepIndex와 descriptor 중복 — fallback 로직 유지. PR-11 이후 추가 PR로 완전 전환 권장.
4. **PR-8 check-i18n-keys.mjs 파싱 방식**: tsx 의존성 도입을 피하려면 정규식 파싱 (replaceAll(labelKey:'xxx')) 사용 — 1차 구현은 정규식, 추후 AST 전환 가능성.
5. **PR-9 테스트 시드**: 8 시나리오용 checkout seed가 jest-global-setup에 이미 있는지 확인 필요. 없으면 `data-migration` seed 확장 1~2h 추가.
6. **PR-11 bundle baseline 노이즈**: CI 환경에서 next build 출력 포맷이 버전 업에 따라 바뀔 수 있음 — 파싱 실패 시 0건 탐지 경고만 출력하도록 graceful degrade 유지.

---

## 완료 조건 (Definition of Done)

- [ ] 9개 PR 전부 머지
- [ ] `pnpm tsc --noEmit` (frontend + backend) PASS
- [ ] `pnpm --filter frontend run build` PASS
- [ ] `node scripts/self-audit.mjs --all` 체크 ⑧ 포함 위반 0
- [ ] `node scripts/check-i18n-keys.mjs` PASS
- [ ] E2E next-step 8 시나리오 PASS (flag on)
- [ ] `scripts/bundle-baseline.json` 커밋됨, compare 5% 초과 0건
- [ ] tech-debt-tracker에 "Feature Flag 상시화 (PR-5 rollout)" 후속 항목 기록
