---
slug: checkout-descriptor-phase-fields
type: contract
date: 2026-04-24
depends: [checkout-fsm-resolve-action]
sprint: 1
sprint_step: 1.2
---

# Contract: Sprint 1.2 — `NextStepDescriptor` 확장: `nextStepIndex` + `RentalPhase` 필드 신설

## Context

V2 리뷰 지적 2건:

1. **F-3 (P1)**: 호출부가 `descriptor.currentStepIndex + 1`을 직접 계산 (`CheckoutDetailClient.tsx` L728-730, `CheckoutStatusStepper.tsx` L54-56). 스키마가 `nextStepIndex`를 직접 제공해야 함.
2. **C-2 (P1)**: 목록 5단계(`CheckoutMiniProgress.stepCount.rental=5`) vs 상세 Stepper 8단계 의미 불일치. 사용자 결정(2026-04-24): **Phase-based '1/3 phase'** 표기로 목록/상세 통일. 목록은 phase 요약, 상세는 drill-down 8-step.

본 contract는 Sprint 4.4의 UI 변경(`CheckoutPhaseIndicator` 신규, `WorkflowTimeline` phase 접힘/펼침)을 뒷받침하는 **스키마 계약**. UI 구현은 별개 Sprint 4 contract.

---

## Scope

### 수정 대상
- `packages/schemas/src/fsm/checkout-fsm.ts` — `NextStepDescriptor` 인터페이스 4개 필드 신설 + `NextStepDescriptorSchema` Zod 업데이트. `getNextStep` 본체에서 필드 채움.
- `packages/schemas/src/fsm/__tests__/checkout-fsm.table.test.ts` (Sprint 1.1 결과물) — fixture 확장. 신규 필드까지 포함한 expected 추가.
- `packages/schemas/src/fsm/__tests__/fixtures/descriptor-table.ts` — snapshot 재생성.

### 신규 생성
- `packages/schemas/src/fsm/rental-phase.ts` — `RentalPhase` enum + `getRentalPhase(status)` + `getPhaseIndex(status)` + `getStepsInPhase(phase)` + `PHASE_STEP_COUNT`. `satisfies Record<CheckoutStatus, RentalPhase | null>` 매핑 강제.

### 수정 금지
- `apps/frontend/components/checkouts/CheckoutMiniProgress.tsx`, `CheckoutPhaseIndicator.tsx`, `WorkflowTimeline.tsx` — Sprint 4.4 contract 소관.
- 백엔드 checkouts 서비스 로직 — 본 contract는 스키마 필드 추가만. service는 `getNextStep` 재호출만으로 자동 수혜.

---

## 신설 타입 정의 (참조 · 실제는 구현자가 작성)

```typescript
// packages/schemas/src/fsm/rental-phase.ts
export const RENTAL_PHASES = ['approve', 'handover', 'return'] as const;
export type RentalPhase = (typeof RENTAL_PHASES)[number];

export const RENTAL_STATUS_TO_PHASE = {
  pending: 'approve',
  borrower_approved: 'approve',
  approved: 'approve',
  lender_checked: 'handover',
  borrower_received: 'handover',
  in_use: 'return',
  overdue: 'return',
  borrower_returned: 'return',
  lender_received: 'return',
  returned: 'return',
  return_approved: 'return',
  rejected: null, // terminal outside phases
  canceled: null,
  checked_out: null, // non-rental 전용
} as const satisfies Record<CheckoutStatus, RentalPhase | null>;

export function getRentalPhase(status: CheckoutStatus, purpose: CheckoutPurpose): RentalPhase | null {
  if (purpose !== 'rental') return null;
  return RENTAL_STATUS_TO_PHASE[status];
}
```

```typescript
// packages/schemas/src/fsm/checkout-fsm.ts · NextStepDescriptor 추가 필드
export interface NextStepDescriptor {
  // ...existing...
  readonly nextStepIndex: number | null; // currentStepIndex + 1 또는 terminal=null
  readonly phase: RentalPhase | null;    // rental 전용, non-rental=null
  readonly phaseIndex: number | null;    // 0/1/2
  readonly totalPhases: number | null;   // rental=3, non-rental=null
}
```

---

## MUST Criteria (실패 시 루프 차단)

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm tsc --noEmit` exit 0 | 빌드 통과 |
| M2 | `pnpm --filter schemas run test` 전체 통과, 208 table test 업데이트된 fixture 통과 | 테스트 실행 |
| M3 | `packages/schemas/src/fsm/rental-phase.ts` 신규 파일 존재 + `RENTAL_PHASES`, `RentalPhase`, `getRentalPhase`, `getPhaseIndex`, `getStepsInPhase`, `PHASE_STEP_COUNT` export | grep 확인 |
| M4 | `RENTAL_STATUS_TO_PHASE`가 `as const satisfies Record<CheckoutStatus, RentalPhase \| null>` 표기로 컴파일 타임 누락 검증 | `grep -n "as const satisfies Record<CheckoutStatus" packages/schemas/src/fsm/rental-phase.ts` = 1+ hit |
| M5 | `NextStepDescriptor`에 `nextStepIndex`, `phase`, `phaseIndex`, `totalPhases` 필드 추가 (readonly) | grep + 타입 컴파일 |
| M6 | `NextStepDescriptorSchema` (Zod)에 동일 4개 필드 정의 — `nextStepIndex: z.number().int().nullable()`, `phase: z.enum(RENTAL_PHASES).nullable()`, `phaseIndex: z.number().int().min(0).max(2).nullable()`, `totalPhases: z.literal(3).nullable()` | 코드 확인 |
| M7 | `getNextStep` 본체에서 신규 필드 4개를 모든 반환 경로(terminal 포함)에서 채움 | 각 return 문 확인 |
| M8 | Rental 상태일 때: `getRentalPhase(status, 'rental')` 결과가 `phase` 필드와 일치 — terminal 제외 | table test 검증 |
| M9 | Non-rental: `phase=null`, `phaseIndex=null`, `totalPhases=null` 일관 | table test 검증 |
| M10 | `nextStepIndex` 계산 규칙: `nextAction === null`(terminal) → `null`, else → `currentStepIndex + 1` (but capped at `totalSteps`) | logic check via test |
| M11 | `rental-phase.ts`의 `RENTAL_STATUS_TO_PHASE`는 **새 CheckoutStatus 추가 시 컴파일 에러 발생** | negative test: `// @ts-expect-error` 주석으로 누락 매핑 시뮬레이션 |
| M12 | 호출부(frontend hooks/components) 수정 0건 — 본 contract는 **스키마 확장만** | `git diff --name-only apps/frontend/` = 0 파일 |
| M13 | fixture `DESCRIPTOR_TABLE` 208 entry 모두 `nextStepIndex`, `phase`, `phaseIndex`, `totalPhases` 포함 | runtime check |
| M14 | 변경 파일 = `checkout-fsm.ts` + `rental-phase.ts`(신규) + fixture + test = 총 4 | `git diff --name-only \| grep -v '^\.claude/' \| wc -l` = 4 |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | `RENTAL_PHASES`에 i18n key alias 상수 추가: `RENTAL_PHASE_I18N_KEY = { approve: 'rentalPhase.approve.label', ... } as const satisfies Record<RentalPhase, string>` | `rental-phase-i18n-map` |
| S2 | `getPhaseIndex(status)` JSDoc에 "phase 순서: approve=0, handover=1, return=2" 명시 | `rental-phase-jsdoc` |
| S3 | Sprint 1.5 exhaustive satisfies와 합류 시 `computeStepIndex` 내부 `Partial<Record<CheckoutStatus, number>>`도 동시 전환 (본 contract 범위는 아니지만 권고) | `exhaustive-satisfies-align` |
| S4 | non-rental purpose에 대해서도 phase 개념을 도입할지 향후 논의용 comment 추가 (예: "calibration-repair 2-phase") | `phase-concept-extension-study` |

---

## Verification Commands

```bash
# 1. 타입 + 테스트
pnpm --filter schemas exec tsc --noEmit
pnpm --filter schemas run test

# 2. 신규 파일 존재
test -f packages/schemas/src/fsm/rental-phase.ts && echo "OK" || echo "MISSING"

# 3. MUST grep
grep -c "nextStepIndex\|^\s*phase:\|phaseIndex\|totalPhases" packages/schemas/src/fsm/checkout-fsm.ts
# 기대: 10+ (interface + schema + getNextStep 본체 각 return)

grep -n "as const satisfies Record<CheckoutStatus, RentalPhase" packages/schemas/src/fsm/rental-phase.ts
# 기대: 1 hit

grep -rn "getRentalPhase\|RentalPhase" apps/frontend/ apps/backend/ 2>/dev/null | grep -v ".next\|dist"
# 기대: 0 hit (본 contract는 스키마만. 호출부는 Sprint 4.4)

# 4. 변경 파일 수
git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: 4
```

---

## Test 데이터 확장 — Sprint 1.1 fixture와의 합류

Sprint 1.1에서 `DESCRIPTOR_TABLE`을 baseline으로 만든 후, 본 contract에서 재생성:

```typescript
// packages/schemas/src/fsm/__tests__/fixtures/descriptor-table.ts (확장)
export const DESCRIPTOR_TABLE = {
  'pending:rental:test_engineer': {
    nextAction: 'borrower_approve',
    nextActor: 'borrower',
    availableToCurrentUser: true,
    currentStepIndex: 1,
    nextStepIndex: 2,      // NEW
    phase: 'approve',      // NEW
    phaseIndex: 0,         // NEW
    totalPhases: 3,        // NEW
  },
  'pending:calibration:test_engineer': {
    // ...
    nextStepIndex: 2,
    phase: null,
    phaseIndex: null,
    totalPhases: null,
  },
  // ...207 entries
} as const satisfies Record<string, Partial<NextStepDescriptor>>;
```

---

## Acceptance

루프 완료 조건 = 위 MUST 14개 모두 PASS + 208 table test 신규 필드까지 포함해 통과.
Sprint 4.4 UI 구현이 시작 가능한 상태(schema 계약 고정).
SHOULD 미달 항목은 `tech-debt-tracker.md`에 등록 후 루프 종료.

---

## 연계 contracts

- Sprint 1.1 · `checkout-fsm-resolve-action.md` — 본 contract가 확장하는 baseline. 208 table test 선행.
- Sprint 1.5 · `checkout-fsm-exhaustive-satisfies.md` — `computeStepIndex` satisfies 전환과 시점 조율 (같은 PR 내 병합 권장).
- Sprint 4.4 · `rental-phase-ui.md` (신규 작성 예정) — `CheckoutPhaseIndicator` 컴포넌트, `WorkflowTimeline` phase 접힘, i18n 키 추가. 본 contract의 `phase` 필드 소비.
