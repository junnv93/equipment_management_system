# Phase 1: Optimistic Locking - Verification Guide

## Overview

This guide provides comprehensive verification steps for the Phase 1 Optimistic Locking implementation in the Checkout system.

**Implementation Date**: 2026-02-11
**Branch**: main
**Status**: ✅ Frontend Complete, ⏳ Backend Pending

---

## 🎯 What Was Implemented

### Frontend Changes (Day 5 - Completed)

#### 1. CheckoutDetailClient.tsx

- ✅ All 4 mutations pass `checkout.version`
- ✅ Optimistic updates increment version locally
- ✅ Type-safe with proper error handling

#### 2. ApprovalsApi.ts

- ✅ Fetches checkout before mutation to get current version
- ✅ Handles both outgoing and incoming approval flows

#### 3. Supporting Components

- ✅ ReturnCheckoutClient.tsx: Passes version in return DTO
- ✅ ReturnApprovalsContent.tsx: Uses selected checkout version
- ✅ ConditionCheckClient.tsx: Adds version to condition checks
- ✅ EquipmentConditionForm.tsx: Receives version from parent

### Backend Changes (Days 1-3 - TODO)

**Status**: ⚠️ NOT YET IMPLEMENTED

The following backend changes are **required** for this feature to work:

1. Database Migration: Add `version` column to `checkouts` table
2. Drizzle Schema: Update schema with version field
3. DTOs: Add `version` to all mutation DTOs
4. Service Layer: Implement `updateWithVersion()` CAS helper
5. All 9 Mutations: Replace direct updates with CAS operations

**Reference**: See implementation plan in project root.

---

## ✅ Automated Test Verification

### E2E Tests Created

**File**: `apps/frontend/tests/e2e/features/checkouts/race-condition.spec.ts`

#### Test Coverage

| Test ID    | Description                          | Priority | Status     |
| ---------- | ------------------------------------ | -------- | ---------- |
| P0-RACE-01 | Concurrent approve/reject prevention | P0       | ✅ Written |
| P0-RACE-02 | Double approval prevention           | P0       | ✅ Written |
| P1-RACE-03 | Sequential operations with version   | P1       | ✅ Written |
| P1-RACE-04 | Stale version rejection              | P1       | ✅ Written |
| P2-UI-01   | UI auto-retry on conflict            | P2       | ✅ Written |
| P2-UI-02   | Error message display                | P2       | ✅ Written |
| P1-VER-01  | Version increment validation         | P1       | ✅ Written |

### Running E2E Tests

```bash
# Run all checkout tests
pnpm --filter frontend run test:e2e -- checkouts

# Run only race condition tests
pnpm --filter frontend run test:e2e -- race-condition.spec.ts

# Run with UI (headed mode)
pnpm --filter frontend run test:e2e -- race-condition.spec.ts --headed

# Debug specific test
pnpm --filter frontend run test:e2e -- race-condition.spec.ts --grep "P0-RACE-01" --debug
```

**Expected Results (After Backend Implementation)**:

- ✅ All P0 tests pass
- ✅ All P1 tests pass
- ⚠️ P2 tests may fail if Phase 3 (auto-retry) not implemented

---

## 🧪 Manual Testing Checklist

### Prerequisites

- [ ] Backend migrations applied
- [ ] Backend service updated with CAS logic
- [ ] Frontend and backend both running
- [ ] Test data seeded

### Test Scenario 1: Basic Version Propagation

**Objective**: Verify version increments on each mutation

1. [ ] Create new checkout via UI
   - **Verify**: Network tab shows `version: 1` in response
2. [ ] Approve the checkout
   - **Verify**: Request payload includes `version: 1`
   - **Verify**: Response shows `version: 2`
3. [ ] Start the checkout
   - **Verify**: Request payload includes `version: 2`
   - **Verify**: Response shows `version: 3`
4. [ ] Return the checkout
   - **Verify**: Request payload includes `version: 3`
   - **Verify**: Response shows `version: 4`
5. [ ] Approve return
   - **Verify**: Request payload includes `version: 4`
   - **Verify**: Response shows `version: 5`

### Test Scenario 2: Concurrent Modification Detection

**Objective**: Verify 409 conflict when concurrent modifications occur

**Setup**: Use two browser windows/users

**Window 1** (User A - Technical Manager):

1. [ ] Open checkout in "pending" status
2. [ ] Note the current version (should be in DevTools)

**Window 2** (User B - Technical Manager):

1. [ ] Open **same** checkout
2. [ ] Click "승인" (Approve) → Should succeed
3. [ ] Verify status changes to "승인됨"

**Window 1** (User A):

1. [ ] Click "반려" (Reject) → **Should fail**
2. [ ] Verify error toast appears:
   ```
   "상태가 변경되었을 수 있습니다. 페이지가 자동으로 새로고침됩니다."
   ```
3. [ ] Verify page refreshes automatically
4. [ ] Verify status now shows "승인됨" (approved by User B)

**Verify in DevTools**:

```
Request:  PATCH /api/checkouts/{id}/reject
Payload:  { version: 1, reason: "..." }
Response: 409 Conflict
Body:     {
  "message": "다른 사용자가 수정했습니다...",
  "code": "VERSION_CONFLICT",
  "currentVersion": 2,
  "expectedVersion": 1
}
```

### Test Scenario 3: Stale Page Detection

**Objective**: Verify stale version rejection even after page idle

1. [ ] Open checkout detail page (status: approved)
2. [ ] **Do not refresh page for 5 minutes**
3. [ ] In another tab/window, start the checkout (approve → start)
4. [ ] Return to original tab
5. [ ] Click "반출 시작" (Start Checkout)
6. [ ] **Expected**: 409 error + auto-refresh

**Verify**: User sees latest state after refresh

### Test Scenario 4: Approvals Page Flow

**Objective**: Verify version propagation in approval management UI

1. [ ] Navigate to `/approvals`
2. [ ] Find "반출 승인" (Outgoing) tab
3. [ ] Select a pending checkout
4. [ ] Click "승인" (Approve)
5. [ ] **Verify in Network tab**:
   - First request: `GET /api/checkouts/{id}` (fetch version)
   - Second request: `PATCH /api/checkouts/{id}/approve` with `version` field

**Expected**: Two-step process (fetch → mutate)

### Test Scenario 5: Rental 4-Step Flow

**Objective**: Verify version in condition check submissions

1. [ ] Create rental checkout
2. [ ] Approve it
3. [ ] Navigate to `/checkouts/{id}/check`
4. [ ] Submit "반출 전 확인" (pre-checkout condition)
5. [ ] **Verify**: Request includes `version` field
6. [ ] Continue through all 4 steps
7. [ ] **Verify**: Version increments after each condition check

---

## 🔍 Backend Verification (For Developers)

### Database State

After each mutation, verify in PostgreSQL:

```sql
-- Check version increments
SELECT id, status, version, updated_at
FROM checkouts
WHERE id = 'your-checkout-id'
ORDER BY updated_at DESC;

-- Expected: version increments by 1 on each update
```

### Service Layer Verification

**File**: `apps/backend/src/modules/checkouts/checkouts.service.ts`

Verify `updateWithVersion()` is called in all mutation methods:

```typescript
// ✅ Correct pattern
const updated = await this.updateWithVersion(uuid, checkout.version, {
  status: 'approved',
  approverId: approveDto.approverId,
  approvedAt: new Date(),
});

// ❌ Wrong pattern (bypasses version check)
const [updated] = await this.db
  .update(checkouts)
  .set({ status: 'approved' })
  .where(eq(checkouts.id, uuid))
  .returning();
```

### DTO Validation

Verify all mutation DTOs extend `VersionedDto`:

```typescript
// ✅ Correct
export class ApproveCheckoutDto extends VersionedDto {
  // version field automatically included
}

// ❌ Wrong
export class ApproveCheckoutDto {
  // missing version field
}
```

---

## 🐛 Troubleshooting

### Issue: "Property 'version' is missing in type"

**Cause**: DTO doesn't extend `VersionedDto` or include version field
**Fix**: Add `extends VersionedDto` or manually add `version: number` field

### Issue: 409 conflict on every request

**Cause**: Frontend not passing current version
**Fix**: Verify checkout object has `version` property before calling mutation

### Issue: Version always 1 in database

**Cause**: SQL trigger not working or `sql`version + 1`` not used
**Fix**: Check Drizzle update statement uses `version: sql`version + 1``

### Issue: Concurrent requests both succeed

**Cause**: CAS not implemented in backend
**Fix**: Verify `updateWithVersion()` includes version in WHERE clause

### Issue: Auto-refresh not working

**Cause**: `router.refresh()` not called after error
**Fix**: Ensure `onErrorCallback` calls `router.refresh()`

---

## 📊 Performance Verification

### Expected Performance Impact

| Metric           | Before              | After               | Change            |
| ---------------- | ------------------- | ------------------- | ----------------- |
| Mutation latency | ~100ms              | ~110ms              | +10% (acceptable) |
| DB query count   | 1 SELECT + 1 UPDATE | 1 SELECT + 1 UPDATE | No change         |
| Network requests | 1                   | 1                   | No change         |
| Client memory    | N/A                 | N/A                 | No change         |

### Performance Test

1. [ ] Open DevTools Network tab
2. [ ] Execute checkout approval
3. [ ] Verify total request time < 200ms
4. [ ] Check DB query performance:

```sql
EXPLAIN ANALYZE
UPDATE checkouts
SET status = 'approved', version = version + 1
WHERE id = '...' AND version = 1;
```

**Expected**: Index scan on `(id, version)`, < 5ms execution time

---

## ✅ Acceptance Criteria

### Must Have (P0)

- [x] Frontend passes version on all mutations
- [ ] Backend validates version on all mutations
- [ ] 409 error returned on version mismatch
- [ ] Error message includes current/expected version
- [ ] Concurrent approve/reject prevented
- [ ] All existing E2E tests still pass

### Should Have (P1)

- [ ] Auto-refresh on 409 error
- [ ] User-friendly error messages
- [ ] Version increments correctly through lifecycle
- [ ] DB index on (id, version) exists

### Could Have (P2)

- [ ] Auto-retry on 409 (Phase 3)
- [ ] Optimistic UI updates
- [ ] Exponential backoff for retries

---

## 📝 Sign-Off Checklist

### Development

- [x] Frontend code complete
- [ ] Backend code complete
- [ ] Database migration tested
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed

### Testing

- [ ] Unit tests pass
- [ ] E2E tests pass (after backend)
- [ ] Manual testing complete
- [ ] Performance verification done

### Documentation

- [x] Implementation plan documented
- [x] Verification guide created
- [x] E2E tests documented
- [ ] API documentation updated

### Deployment

- [ ] Staging deployment successful
- [ ] Production rollout plan approved
- [ ] Rollback procedure tested
- [ ] Monitoring alerts configured

---

## 🚀 Next Steps

1. **Complete Backend Implementation** (Days 1-3 of plan)

   - Database migration
   - Service layer CAS logic
   - DTO updates

2. **Run E2E Tests** (Day 7)

   ```bash
   pnpm --filter frontend run test:e2e -- race-condition.spec.ts
   ```

3. **Manual Testing** (Day 7)

   - Follow scenarios above
   - Document any issues

4. **Deploy to Staging**

   - Monitor for 24 hours
   - Check error logs for version conflicts

5. **Optional: Implement Phase 3** (Auto-Retry)
   - Update `useOptimisticMutation` hook
   - Add MAX_RETRIES logic
   - Test retry behavior

---

## 📞 Support

**Questions?** Contact the development team or refer to:

- Implementation Plan: `/docs/OPTIMISTIC_LOCKING_PLAN.md`
- SSOT Documentation: `/CLAUDE.md`
- E2E Test README: `./README.md`
