# 평가 리포트: calibration created linked plan item SSE

## Verdict

PASS

## Contract Status

| Criterion | Verdict | Evidence |
|-----------|---------|----------|
| `CALIBRATION_CREATED` notification payload carries `linkedPlanItemId` | PASS | `calibration.service.ts` emits `linkedPlanItemId: dtoWithComputedDate.planItemId ?? null`; `CalibrationNotificationEvent` type includes the field |
| approval SSE sentinel broadcasts linked item identity | PASS | `NotificationSseService.broadcastApprovalChanged()` emits `entityType: 'calibrationPlanItem'` and `entityId` when `linkedPlanItemId` is present |
| frontend invalidates calibration plans on linked item sentinel | PASS | `useNotificationStream` invalidates `queryKeys.calibrationPlans.all` for `entityType === 'calibrationPlanItem'` |
| existing approval counts invalidation remains | PASS | sentinel path still invalidates `queryKeys.approvals.countsAll` before linked-plan handling |
| focused backend SSE test passes | PASS | `NotificationSseService` spec 13/13 PASS with `--detectOpenHandles` |
| backend/frontend type-check passes | PASS | backend `tsc --noEmit` PASS, frontend `tsc --noEmit` PASS |
| SSE lifecycle cleanup coherent | PASS | per-stream heartbeat now terminates via close signal on last unsubscribe, forced disconnect, and module destroy; `ApprovalSseListener` unregisters EventEmitter handlers on destroy |
| frontend error mapper files unchanged | PASS | No edits to `apps/frontend/lib/errors/*` for this item |

## Verification Commands

```bash
pnpm --filter backend exec jest apps/backend/src/modules/notifications/__tests__/notification-sse.service.spec.ts --runInBand --detectOpenHandles
pnpm --filter backend run type-check
pnpm --filter backend run lint:ci
pnpm --filter frontend run type-check
pnpm --filter frontend run lint
```

## Notes

Iteration 2 closed evaluator lifecycle findings:
- `NotificationSseService` per-stream heartbeat interval no longer outlives stream shutdown.
- `ApprovalSseListener` no longer registers anonymous EventEmitter listeners without destroy cleanup.

No blocking SHOULD failures remain for this contract.
