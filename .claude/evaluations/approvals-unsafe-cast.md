# Evaluation: approvals-unsafe-cast
## Date: 2026-04-12
## Iteration: 1

## MUST Criteria
| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| M1 | `pnpm tsc --noEmit` exit 0 (frontend) | **PASS** | `pnpm --filter frontend exec tsc --noEmit` exited with code 0, no errors emitted. |
| M2 | `pnpm --filter frontend run build` exit 0 | **PASS** | Build completed successfully, all routes rendered without error. |
| M3 | `grep 'as unknown as Record' approvals-api.ts` → 0 hit | **PASS** | grep returned exit code 1 (no matches). Zero occurrences of the double-cast pattern. |
| M4 | `grep 'as unknown as' NotificationsContent.tsx` → 0 hit | **PASS** | grep returned exit code 1 (no matches). No `as unknown as` casts in NotificationsContent.tsx. |
| M5 | 기존 기능 회귀 없음 — caller site 타입 에러 없음 | **PASS** | tsc --noEmit (M1) and build (M2) both pass, confirming no caller-site type errors introduced. |

## SHOULD Criteria
| ID | Criterion | Verdict | Evidence |
|----|-----------|---------|----------|
| S1 | relation 타입이 SSOT (한 곳에서 정의, 재사용) | **PARTIAL** | NC uses `NCRelatedUser` type from its own interface (SSOT). Calibration defines `registeredByUser`/`approvedByUser` inline in the `Calibration` interface in `calibration-api.ts` (lines 53-59). EquipmentImport defines `requester` inline in `BaseEquipmentImport` in `equipment-import-api.ts` (lines 57-63). These three have identical shapes (`{id, name, email, team: {id, name} | null}`) but are defined separately — a shared `RelatedUser` type would be more SSOT-compliant. |

## Findings (Skeptical QA Notes)

### Residual `as Record<string, unknown>` casts in approvals-api.ts

The contract scope was specifically `as unknown as Record<string, unknown>` (double-cast), and those are indeed gone. However, **10 single-step `as Record<string, unknown>` casts remain** in approvals-api.ts at lines 970, 979, 1020-1021, 1141-1143, 1173-1174, 1202. These cover:
- `mapCheckoutToApprovalItem` (checkout.user, user.team)
- `mapDisposalToApprovalItem` (item.equipment, item.requester, requester.team)
- `mapEquipmentRequestToApprovalItem` (item.requester, item.equipment, requester.team)

These are **not** violations of M3 (which tests for the specific double-cast `as unknown as Record`), but they are type-safety concerns that could be addressed in a follow-up.

### NotificationsContent.tsx: `preferences as Partial<Record<string, unknown>>`

Line 111 uses `preferences as Partial<Record<string, unknown>>` — a single-step widening cast that is not caught by M4's grep pattern (`as unknown as`). This is a weaker violation than the double-cast but still erases the actual type. The `preferences` object likely has a known type from `useNotificationPreferences()` that could be used directly.

### Verified positive changes

1. **NC mapper** (line 1090-1117): Uses `nc.corrector`/`nc.discoverer` directly via typed `NCRelatedUser` relation — no casts.
2. **Calibration mapper** (line 984-986): Uses `calibration.registeredByUser` typed field — no casts.
3. **EquipmentImport mapper** (line 1283-1284): Uses `item.requester` typed field — no casts.

## Overall Verdict: **PASS** (all MUST criteria met)

Contract scope was limited to `as unknown as Record<string, unknown>` removal. That specific pattern is fully eliminated. Residual single-step casts and S1 partial compliance are noted for future work.
