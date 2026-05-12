# Architecture Review — software-design-review-p0-p1-p2

> Date: 2026-05-12
> Reviewer: senior architect (sonnet)
> Verdict: APPROVED WITH GAPS

## Summary

The sprint correctly solves the three core design problems (P0: workflow visibility + validation status column + actor names, P1: responsive list + identifier stacking + dialog sizing, P2: design tokens + grid layout + row overlay). The layered architecture is sound: backend enrichment is isolated to `findOne` / `findAll` read paths, cache invalidation is coherent across the event registry, and the new SSOT components (`SoftwareValidationStepper`, `SoftwareEmptyState`, `ResponsiveListFallback`) follow established project patterns. Two structural gaps were identified — one concerning the controller return-type annotation and one concerning the event-channel duplication — that do not cause runtime bugs today but create maintenance risk.

---

## Cross-layer Trace

### Trace 1: latestValidationStatus (P0-3)

**DB → Service**: `findAll` / `findOne` / `findByEquipmentId` each execute a single query with `LEFT JOIN softwareValidations ON softwareValidations.id = testSoftware.latestValidationId`. This is a **point-lookup JOIN on an indexed FK** (`latestValidationId`), not a subquery or N+1. No performance risk.

**Service → Controller**: `findAll` → `TestSoftwareWithManagers[]`. `findOne` → uses `ReturnType<>` inference (correct). `findByEquipmentId` → controller declares `Promise<TestSoftware[]>` (annotation gap — see Gap #1).

**Controller → DTO → Frontend**: The frontend `TestSoftware` interface declares `latestValidationStatus: ValidationStatus | null` as a **required** field. Mutation endpoints (`create`, `update`, `toggleAvailability`) return raw `TestSoftware` from `updateWithVersion` — which does NOT include `latestValidationStatus`. However:
- `useOptimisticMutation` uses `{ ...old, ...fields }` in `optimisticUpdate`, preserving `latestValidationStatus` from the stale cache.
- `onSettled` always calls `invalidateQueries({ queryKey })`, which triggers a server refetch from the enriched `findOne` endpoint. The cache is eventually consistent. ✓
- `latestValidationStatus` is only rendered from LIST responses (which use `findAll` — enriched) and the DETAIL query (which uses `findOne` — enriched). The mutation response is never directly rendered for this field. ✓

**Cache coherence**: When `ValidationStatus` changes (submit/approve/reject/qualityApprove), `SoftwareValidationsService.invalidateCache()` synchronously clears `sw-validations:detail:`, `sw-validations:list:`, `sw-validations:pending:`, and `test-software:detail:{testSoftwareId}`. The event registry additionally flushes `TEST_SOFTWARE:*` and `SOFTWARE_VALIDATIONS:*` asynchronously. The `test-software:list:` cache (which contains `latestValidationStatus`) is covered by the `TEST_SOFTWARE:*` wildcard pattern in the registry. ✓

**Listener race condition (quality_approved path)**: `qualityApprove()` emits `NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_QUALITY_APPROVED` (step 1) then `CACHE_EVENTS.SW_VALIDATION_QUALITY_APPROVED` (step 2), both awaited via `emitAsync`. Step 1 triggers: (a) `SoftwareValidationListener.handleQualityApproved` (DB update to `latestValidationId` + clears `test-software:detail:`) and (b) the registry listener (flushes `TEST_SOFTWARE:*` + `SOFTWARE_VALIDATIONS:*`). Since both (a) and (b) are async handlers under the same `emitAsync` call and both return Promises, they complete before step 2. The DB write to `latestValidationId` is guaranteed to precede any subsequent cache re-population. ✓

### Trace 2: SoftwareValidationWithActors enrichment (P0-1)

**Service**: `findOne` uses `getTableColumns(softwareValidations)` + three `sql<string | null>` alias projections (`.name` only — no PII exposure). The three user JOINs are LEFT (safe for null actor states). ✓

**Controller**: `GET /software-validations/:uuid` → `Promise<SoftwareValidationWithActors>`. All mutation endpoints (`update`, `submit`, `approve`, `quality-approve`, `reject`, `revise`) → `Promise<SoftwareValidation>` (plain, no actor names). This is correct: mutation callers do not need actor names and should not receive them. ✓

**Frontend type contract**: `SoftwareValidation.submitterName?: string | null` (optional). This correctly signals "present only in `findOne` responses, absent from list/mutation responses." The `ValidationDetailContent` uses `validation.submitterName ? { name: ... } : null` guard. ✓

**List endpoints (`findAll`, `findByTestSoftware`, `findPending`)**: These return `SoftwareValidation[]` — no actor names. `SoftwareValidationsListContent` renders only `status` and `validationType` from list items, never accessing actor names. ✓

### Trace 3: Cache invalidation when validation status changes

| Transition | Service sync clear | CACHE_EVENTS emit | NOTIFICATION_EVENTS emit | listener DB side-effect |
|---|---|---|---|---|
| `create` | sw-validations list/pending + test-software detail | ✗ | ✗ | ✗ |
| `update` (draft only) | sw-validations detail + list/pending + test-software detail | ✗ | ✗ | ✗ |
| `submit` | sw-validations detail + list/pending + test-software detail | SW_VALIDATION_SUBMITTED | SW_VALIDATION_SUBMITTED | ✗ |
| `approve` | sw-validations detail + list/pending + test-software detail | SW_VALIDATION_APPROVED | SW_VALIDATION_APPROVED | ✗ |
| `qualityApprove` | sw-validations detail + list/pending + test-software detail | SW_VALIDATION_QUALITY_APPROVED | SW_VALIDATION_QUALITY_APPROVED | updates `latestValidationId` in DB + clears test-software detail |
| `reject` | sw-validations detail + list/pending + test-software detail | SW_VALIDATION_REJECTED | SW_VALIDATION_REJECTED | ✗ |
| `revise` (rejected → draft) | sw-validations detail + list/pending + test-software detail | ✗ | ✗ | ✗ |

**`revise()` no-event analysis**: `revise` transitions `rejected → draft`. Dashboard pending counts (via `ApprovalsService.getApprovalCountsByScope`) count `SUBMITTED` and `APPROVED` states. `rejected → draft` does not affect these counts. No dashboard cache invalidation is needed. ✓

### Trace 4: Stepper SSOT isolation

`SoftwareValidationStepper` imports only `SoftwareValidationStepDescriptor` and `ProgressStepState` from `@equipment-management/schemas`. It does not import from `CheckoutProgressStepper` or share any component code with it. The shared primitives (`PROGRESS_STEP_STATES`, `deriveProgressStepState`, `TerminationKind`) live in `progress-step.ts` and are reused without duplication. `software-validation-step.ts` adds domain-specific types (`SoftwareValidationStepKey`, `SoftwareValidationStepDescriptor`, domain-specific helper functions) without re-defining existing checkout FSM concepts. ✓

---

## Identified Gaps

| # | Severity | Area | Description | Recommendation |
|---|----------|------|-------------|----------------|
| 1 | MEDIUM | Controller / Type Contract | `TestSoftwareController.findByEquipment` is annotated `Promise<TestSoftware[]>` but the service returns `Promise<TestSoftwareWithManagers[]>` (which includes `latestValidationStatus`, `primaryManagerName`, `secondaryManagerName`). TypeScript accepts this silently (structural subtype), but API consumers reading the controller signature get an incorrect picture of the response shape. Any future code that consumes this endpoint via the controller type will miss the enriched fields. | Change the controller annotation to `ReturnType<TestSoftwareService['findByEquipmentId']>` (matching the `findOne` pattern used elsewhere in the same controller). |
| 2 | LOW | Cache invalidation redundancy | `submit/approve/qualityApprove/reject` each emit both `NOTIFICATION_EVENTS.*` and `CACHE_EVENTS.*`. Both event channels trigger the registry to flush `SOFTWARE_VALIDATIONS:*` and `TEST_SOFTWARE:*`. Additionally, the service's synchronous `invalidateCache()` already clears the local keys before events fire. This results in 3× invalidation of the same key set (service-sync + NOTIFICATION registry + CACHE_EVENTS registry). Functionally harmless (in-memory Map delete = O(1)), but the design contract documented in `invalidateCache()` JSDoc ("APPROVALS:* は이벤트 발행 후 registry가 처리") implies CACHE_EVENTS is sufficient for cross-domain. The NOTIFICATION_EVENTS channel duplicates this work without adding value for cache purposes. | Tech-debt: evaluate removing NOTIFICATION_EVENTS from the cache invalidation registry for the SW_VALIDATION* entries, leaving only CACHE_EVENTS. This reduces the mental overhead of tracking two invalidation paths for the same domain. |
| 3 | LOW | Unit test coverage — findOne enrichment | The existing `software-validations.service.spec.ts` `findOne` test case asserts only `result.id === 'val-uuid-1'` — it does not verify that `submitterName`, `technicalApproverName`, or `qualityApproverName` fields are present or correctly null-coalesced. The mock likely doesn't simulate the user JOIN. If the LEFT JOIN alias changes (e.g., `submitter.name` aliasing), the regression will be invisible to unit tests. | Add a test case that provides a mock returning `{ submitterName: 'Alice', technicalApproverName: null, qualityApproverName: null }` and asserts those fields on the result. |
| 4 | LOW | `late` state is unreachable dead code in stepper | `SoftwareValidationStepper` defines `STEP_CIRCLE_BY_STATE.late` and `STEP_LABEL_BY_STATE.late` tokens. The sr-only state text ternary does not handle `late` (falls through to `stateFuture` — semantically wrong). `deriveProgressStepState(index, currentIdx, false, ...)` is always called with `isOverdue=false` in `use-software-validation-progress-steps.ts` because the validation domain has no `dueAt` concept. The `late` state will never render. | Document this explicitly in the hook (JSDoc: "`isOverdue` is always `false` — the software validation domain has no deadline concept; `late` state is reserved for future SLA enforcement"). Add a comment in `StepNode` noting the sr-only fallback behavior. This is documentation-only, no code change required. |
| 5 | LOW | API contract drift: list vs detail for actor fields | `GET /software-validations` (list) returns `SoftwareValidation` (no actor names). `GET /software-validations/:uuid` (detail) returns `SoftwareValidationWithActors`. The frontend `SoftwareValidation` interface unifies both shapes with `submitterName?: string | null`. This is currently correct. However, if a future developer adds actor names to a list response, the optional field becomes structurally ambiguous (is it from list or detail?). | No immediate action needed. Consider adding a JSDoc comment to the frontend `SoftwareValidation` interface explicitly marking `submitterName/technicalApproverName/qualityApproverName` as "detail-only enrichment fields — not present in list or mutation responses." The comment currently exists (`findOne (detail) 응답에만 포함`) but is on the type definition rather than each field. |

---

## Strengths

**Cache invalidation layering**: The service-layer sync clear + event-registry async flush architecture is correctly wired. The `invalidateCache(id, testSoftwareId)` signature cleanly scopes test-software cache invalidation to the specific entity rather than prefix-flushing the entire namespace when the target ID is known (see the `testSoftwareId` branch in `invalidateCache`). This is a well-considered optimization.

**CAS coherence**: The `onVersionConflict` hook in both `TestSoftwareService` and `SoftwareValidationsService` ensures that a 409 response triggers detail cache eviction before the client retries. No stale-version loop risk. The sprint did not change the `version` field semantics; `TestSoftwareWithManagers` and `SoftwareValidationWithActors` both inherit the `version` field from their base types unchanged.

**SSOT placement correctness**: `SOFTWARE_VALIDATION_STATUS_BADGE_TOKENS` uses `as const satisfies Record<ValidationStatus, string>`, providing compile-time exhaustiveness over all 5 `ValidationStatus` values. `VALIDATION_INFO_CARD_TOKENS` is correctly placed at Layer 3 (component-level, `software.ts`) rather than Layer 2 (semantic.ts) because it is a domain-specific `<dl>` pattern, not a general semantic token. `software-validation-step.ts` reuses `PROGRESS_STEP_STATES` / `deriveProgressStepState` from `progress-step.ts` without re-defining them.

**Security layer**: The three `users` JOINs in `findOne` select only `.name` — no email, role, or ID fields are exposed beyond what was already in the base `SoftwareValidation` type (submittedBy, technicalApproverId, etc. are already present as IDs). The enrichment adds display names only. `actorName: ''` in notification events is a known stub (notifications service presumably resolves names independently).

**ResponsiveListFallback pattern**: Rendering both slots in the DOM (CSS `hidden/block`) avoids hydration mismatches without needing `useLayoutEffect` or `window` checks. For read-only lists with no component state (no `useState` inside list items), the 2× VDOM cost is negligible and acceptable.

**Stepper hook purity**: `useSoftwareValidationProgressSteps` is a pure computation wrapped in `useMemo` with stable dependency array entries (`submitter?.name` not `submitter` object). No side effects, no queries — the adapter pattern is correctly isolated.

**Dual approval guard**: `assertIndependentApprover` is called in both `approve()` (submitter ≠ technical approver) and `qualityApprove()` (technical approver ≠ quality approver), enforcing ISO/IEC 17025 §6.2.2 independence at the service layer, not just at the permission layer. This is defense-in-depth.

**`software-validation-step.ts` compile-time sanity check**: The `_StepValuesSubsetOfStatus` type-level assertion (`SoftwareValidationStepKey extends ValidationStatus ? true : never`) ensures the step values remain a strict subset of the domain enum. If a status value is renamed or removed from `ValidationStatus`, the compiler will catch the drift immediately.

---

## Final Verdict

**APPROVED WITH GAPS**

The sprint is architecturally sound and production-safe as shipped. No data integrity risks, no security regressions, no cache correctness bugs. The two structural gaps (controller annotation mismatch and event-channel duplication) are low-urgency technical debt items that should be tracked for the next cleanup sprint. Gap #1 (controller type annotation) is the highest priority because it degrades code readability and could mislead future developers consuming `findByEquipmentId` via the controller interface. Gaps #3–5 are documentation/test coverage items with no runtime impact.

**Recommended follow-up items for tech-debt tracker**:
- `controller-return-type-findByEquipment`: Change annotation to `ReturnType<>` (15-minute fix).
- `sw-validation-findone-enrichment-spec`: Add unit test covering actor name fields in `findOne` mock.
- `notification-cache-event-registry-dedup`: Evaluate removing NOTIFICATION_EVENTS from SW_VALIDATION cache registry (CACHE_EVENTS channel is sufficient).
