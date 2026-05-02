# Evaluation: inspection-undo-hook-extraction-reject-spec
iteration: 1
date: 2026-05-02

## MUST Criteria
| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| M1 | reject spec Layer1 Zod — empty/trim-9-char/9-char FAIL, 10-char/trim-10-char PASS | FAIL | trim→FAIL case exists (` `+MIN-1+` ` → reject). trim→PASS case (` `+MIN+` ` → accept) is MISSING. Contract requires "trim-10-char PASS" explicitly. |
| M2 | reject spec Layer2 service fail-close — `EquipmentRequestRejectionReasonRequired` throw | PASS | Lines 123–135: `it.each` with empty/whitespace/MIN-1 → `rejects.toMatchObject({ response: { code: ErrorCode.EquipmentRequestRejectionReasonRequired } })`. All 3 Layer2 cases pass in test run. |
| M3 | reject spec 패턴 — disposal.service.spec.ts와 동일 2-layer describe/it.each 패턴 | PASS | Both files use top-level `describe('... defense-in-depth boundary matrix')`, nested `describe` per layer, `it.each([...])('...%s...')` format, same `const MIN`/`const MAX` from `VALIDATION_RULES`. Structural parity confirmed. |
| M4 | `use-undoable-state.ts` 인터페이스 — `{ push, undo, redo, canUndo, canRedo }`, `current`/`onChange`/`clone`/`limit` options | PASS | `UseUndoableStateOptions<T>` has `current`, `onChange`, `clone`, `limit?`. Return type `UseUndoableStateReturn` has `push`, `undo`, `redo`, `canUndo`, `canRedo`. Line 127: `return { push, undo, redo, canUndo, canRedo }`. |
| M5 | `use-undoable-state.ts` 안정 참조 — push/undo/redo는 useCallback, current·onChange는 ref 경유 | PASS | `push`/`undo`/`redo` each wrapped in `useCallback`. `currentRef.current = current` (line 62), `onChangeRef.current = onChange` (line 64). All internal access via `currentRef.current` / `onChangeRef.current`. Stability confirmed by test at line 124–138. |
| M6 | VisualTableEditor 인라인 undo 제거 — pastRef/futureRef/recomputeUndoRedo/pushHistory/undoStructural/redoStructural 인라인 선언 없음 | PASS | `grep 'const pastRef\|const futureRef\|const recomputeUndoRedo\|const pushHistory =\|const undoStructural =\|const redoStructural ='` returns no matches. Variables only appear as destructured names from useUndoableState. |
| M7 | VisualTableEditor hook 위임 — useUndoableState import + `{ push: pushHistory, undo: undoStructural, redo: redoStructural, ... }` 구조분해 | PASS | Line 34: `import { useUndoableState } from '@/hooks/use-undoable-state'`. Lines 115–127: `const { push: pushHistory, undo: undoStructural, redo: redoStructural, canUndo, canRedo } = useUndoableState<TableSnapshot>(...)`. |
| M8 | 훅 유닛 테스트 — push→undo 복원, push→undo→redo 복원, limit 초과 shift, 빈 stack undo no-op | PASS | Test file lines 10–91: all 4 mandatory cases present and passing. `Tests: 7 passed` confirmed in test run. |
| M9 | frontend tsc PASS | PASS | `pnpm tsc --noEmit` exits 0 with no output. |
| M10 | backend tsc PASS | PASS | `pnpm tsc --noEmit` exits 0 (root-level check covers backend). |
| M11 | backend test PASS (equipment-approval-reject spec 포함) | PASS | `Tests: 1132 passed, 83 suites passed`. equipment-approval-reject: 11/11 PASS confirmed in targeted run. |
| M12 | frontend test PASS (use-undoable-state spec 포함) | PASS | `Tests: 412 passed, 36 suites passed`. use-undoable-state: 7/7 PASS confirmed in targeted run. |

## SHOULD Criteria
| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| S1 | SelfInspectionFormDialog `CheckItemRow` React.memo 추출 + items.map 인라인 arrow 제거 | PASS | `const CheckItemRow = memo(function CheckItemRow(...))` found at line 106. `items.map((item, index) => (<CheckItemRow` at line 738–739 — uses extracted component, not inline arrow. |
| S2 | `useUndoableState`에 optional `enableKeyboard: boolean` 옵션 | PASS | `enableKeyboard?: boolean` option defined (line 17). window Ctrl+Z/Cmd+Z/Ctrl+Y handler with IME guard at lines 97–125. |
| S3 | disposal.service.spec 패턴 완전 대칭 (MIN/MAX 상수명 동일, it.each 포맷 동일) | PASS | Both use `const MIN = VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH`, `const MAX = VALIDATION_RULES.LONG_TEXT_MAX_LENGTH`. Same `it.each([...])('...%s...')` labeling format. |

## Anti-Patterns
| Pattern | Found? | Detail |
|---------|--------|--------|
| `rejectionReason.trim().length === 0` 잔존 (equipment-approval.service.ts) | NOT FOUND | Service uses `rejectionReason.trim().length < VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH` (line 565) — correct pattern, not the anti-pattern. |
| `pastRef`/`futureRef` 인라인 선언 잔존 (VisualTableEditor) | NOT FOUND | `grep 'const pastRef\|const futureRef'` in VisualTableEditor returns no matches. Only appear as destructured from `useUndoableState`. |
| `useUndoableState` 내부에서 `current`를 useState로 관리 | NOT FOUND | Only `canUndo`/`canRedo` are useState. `current` is fully controlled externally; internal access via `currentRef` (ref-only, not useState). |
| `setQueryData` 사용 | NOT FOUND | No `setQueryData` in any of the 4 new/modified files. |
| `any` 타입 비eslint-disable 사용 | NOT FOUND | No `any` type without `eslint-disable` comment in the changed files. |

## Overall Verdict
FAIL

## Issues Found (FAIL items only)

### M1 FAIL — "trim-10-char PASS" test case missing from Layer 1 Zod spec

**Contract requirement**: M1 specifies both FAIL and PASS cases for trimming behavior:
- `trim-9-char FAIL` ✅ covered: `' ' + 'a'.repeat(MIN-1) + ' '` → trim → MIN-1 → reject (line 58–63)
- `trim-10-char PASS` ❌ NOT covered: no test for `' ' + 'a'.repeat(MIN) + ' '` → trim → MIN → accept

**Actual spec**: The "trims surrounding whitespace before length check" test at lines 56–63 only verifies the FAIL direction (whitespace + MIN-1 chars → reject). The PASS direction (whitespace + MIN chars → accept) is absent from Layer 1.

**Impact**: Without a trim→PASS test, there is no regression guard against a schema regression that might apply `.min(MIN)` *before* `.trim()` (which would cause `' ' + 'a'.repeat(MIN) + ' '` to falsely reject since the raw string length is MIN+2 but the `.trim()` order matters). The disposal.service.spec.ts Layer 2 covers trim→PASS for its domain (`'${MIN} chars + 양 끝 공백 trim 후 ${MIN}'` at line 243), but the reject spec has no equivalent Layer 1 trim→PASS case.

**Fix required**: Add to the Layer 1 `rejectRequestSchema.rejectionReason` spec:
```typescript
it.each([
  [`${MIN} chars (boundary MIN)`, 'a'.repeat(MIN)],
  [`${MAX} chars (boundary MAX)`, 'a'.repeat(MAX)],
  [`whitespace + ${MIN} chars + whitespace (trim → ${MIN}, boundary PASS)`, ` ${'a'.repeat(MIN)} `],
])('accepts %s', (_label, rejectionReason) => {
  const result = rejectRequestSchema.safeParse({ ...baseValid, rejectionReason });
  expect(result.success).toBe(true);
});
```

---

## Iteration 2

date: 2026-05-02

### M1 Re-check

**Evidence from spec file (lines 65–72)**:
```typescript
it('trims surrounding whitespace before length check — accept (trim 후 정확히 MIN)', () => {
  // 앞뒤 공백 2자 포함 MIN+2자 → trim 후 MIN자 → accept (.trim().min(MIN) 순서 검증)
  const result = rejectRequestSchema.safeParse({
    ...baseValid,
    rejectionReason: ` ${'a'.repeat(MIN)} `,
  });
  expect(result.success).toBe(true);
});
```

- trim→FAIL case (` ${'a'.repeat(MIN-1)} ` → reject): ✅ present (lines 56–63)
- trim→PASS case (` ${'a'.repeat(MIN)} ` → accept): ✅ now present (lines 65–72) — was missing in iteration 1
- empty FAIL: ✅ present in `it.each` (line 32)
- whitespace-only FAIL: ✅ present (trim → 0 chars)
- 9-char FAIL (`MIN-1`): ✅ present
- 10-char PASS (`MIN`): ✅ present in `accepts` it.each (line 41)

**Test run result** (12/12 passed):
```
✓ rejects empty string
✓ rejects whitespace only (trim → 0)
✓ rejects 9 chars (below MIN)
✓ accepts 10 chars (boundary MIN)
✓ accepts 500 chars (boundary MAX)
✓ rejects 501 chars (above MAX)
✓ trims surrounding whitespace before length check — reject
✓ trims surrounding whitespace before length check — accept (trim 후 정확히 MIN)
✓ throws EquipmentRequestRejectionReasonRequired for empty string
✓ throws EquipmentRequestRejectionReasonRequired for whitespace only (trim → 0)
✓ throws EquipmentRequestRejectionReasonRequired for 9 chars (below MIN)
✓ accepts 10 chars (boundary MIN) and proceeds past fail-close
Tests: 12 passed, 12 total
```

**M1 Verdict: PASS** — All required cases now present and passing (was 11 tests in iter 1, now 12 with trim→PASS added).

### Overall Verdict: PASS

All MUST criteria now pass (M1 fixed, M2–M12 were already PASS in iteration 1). All SHOULD criteria and anti-pattern checks unchanged (PASS / NOT FOUND).
