---
slug: inspection-undo-hook-extraction-reject-spec
type: mode1
date: 2026-05-02
status: active
---

# Contract: inspection-undo-hook-extraction-reject-spec

두 클러스터 통합 — equipment reject boundary spec + useUndoableState 훅 추출 + SelfInspectionFormDialog 최적화

## Scope (6 files)

| File | Change | Priority |
|------|--------|----------|
| `apps/backend/src/modules/equipment/__tests__/equipment-approval-reject.service.spec.ts` | 신규 — 반려 사유 boundary 2-layer spec | P0 MUST |
| `apps/frontend/hooks/use-undoable-state.ts` | 신규 — generic `useUndoableState<T>` 훅 | MUST |
| `apps/frontend/components/inspections/result-sections/VisualTableEditor.tsx` | 수정 — 인라인 undo history → hook으로 위임 | MUST |
| `apps/frontend/hooks/__tests__/use-undoable-state.test.ts` | 신규 — 훅 유닛 테스트 | MUST |
| `apps/frontend/components/inspections/SelfInspectionFormDialog.tsx` | 수정 — CheckItemRow 추출 + React.memo | SHOULD |

## MUST Criteria

| # | Criterion | Pass Condition |
|---|-----------|----------------|
| M1 | reject spec Layer1 Zod | `rejectRequestSchema.safeParse` — empty/trim-9-char/9-char FAIL, 10-char/trim-10-char PASS |
| M2 | reject spec Layer2 service fail-close | `rejectionReason.trim().length < MIN` → `EquipmentRequestRejectionReasonRequired` throw |
| M3 | reject spec 패턴 | `disposal.service.spec.ts`와 동일 2-layer describe/it.each 패턴 |
| M4 | `use-undoable-state.ts` 인터페이스 | `{ push, undo, redo, canUndo, canRedo }` 반환, `current`/`onChange`/`clone`/`limit` 옵션 |
| M5 | `use-undoable-state.ts` 안정 참조 | `push/undo/redo`는 `useCallback`으로 안정, `current`·`onChange`는 ref 경유 (deps 최소화) |
| M6 | VisualTableEditor 인라인 undo 제거 | `pastRef`/`futureRef`/`recomputeUndoRedo`/`pushHistory`/`undoStructural`/`redoStructural` 인라인 선언 없음 |
| M7 | VisualTableEditor hook 위임 | `useUndoableState` import + `{ push: pushHistory, undo: undoStructural, redo: redoStructural, ... }` 구조분해 사용 |
| M8 | 훅 유닛 테스트 | push→undo 복원, push→undo→redo 복원, limit 초과 shift, 빈 stack undo no-op 4개 케이스 |
| M9 | frontend tsc | `pnpm --filter frontend run tsc --noEmit` PASS |
| M10 | backend tsc | `pnpm --filter backend run tsc --noEmit` PASS |
| M11 | backend test | `pnpm --filter backend run test` PASS (equipment-approval-reject spec 포함) |
| M12 | frontend test | `pnpm --filter frontend run test` PASS (use-undoable-state spec 포함) |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | SelfInspectionFormDialog `CheckItemRow` React.memo 추출로 items.map 인라인 arrow 제거 |
| S2 | `useUndoableState`에 optional `enableKeyboard: boolean` 옵션 — window Ctrl+Z 바인딩 내장 |
| S3 | disposal.service.spec 패턴 완전 대칭 (MIN/MAX 상수명 동일, it.each 포맷 동일) |

## Anti-Patterns (즉시 FAIL)

- `rejectionReason.trim().length === 0` 패턴 잔존 (M2 위반)
- VisualTableEditor에 `pastRef`/`futureRef` 인라인 선언 잔존 (M6 위반)
- `useUndoableState` 내부에서 `current`를 useState로 관리 (훅이 state를 소유하면 controlled component 원칙 위반)
- `setQueryData` 사용
- `any` 타입 비eslint-disable 사용
