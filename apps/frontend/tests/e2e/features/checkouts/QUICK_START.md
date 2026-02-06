# Checkout Full Flow Test - Quick Start Guide

**Test File**: `apps/frontend/tests/e2e/checkouts/group-4-processing/4d-full-flow.spec.ts`

---

## 1. Start Servers (Required)

### Terminal 1: Backend

```bash
cd apps/backend
pnpm dev
```

Wait for: `✓ NestJS application successfully started on: http://localhost:3001`

### Terminal 2: Frontend

```bash
cd apps/frontend
pnpm dev
```

Wait for: `✓ Ready on http://localhost:3000`

---

## 2. Seed Test Data (One-Time Setup)

```bash
cd apps/backend
pnpm db:seed:test
```

Expected output:

```
✓ Test users created
✓ Test equipment created
✓ Test teams created
Database seeded successfully
```

---

## 3. Run the Test

### Option A: Normal Mode

```bash
cd apps/frontend
pnpm test:e2e tests/e2e/checkouts/group-4-processing/4d-full-flow.spec.ts
```

### Option B: UI Mode (Recommended - Visual Debugging)

```bash
pnpm test:e2e --ui tests/e2e/checkouts/group-4-processing/4d-full-flow.spec.ts
```

### Option C: Debug Mode (Step-by-Step)

```bash
pnpm test:e2e --debug tests/e2e/checkouts/group-4-processing/4d-full-flow.spec.ts
```

### Option D: Headed Mode (See Browser)

```bash
pnpm test:e2e --headed tests/e2e/checkouts/group-4-processing/4d-full-flow.spec.ts
```

---

## Expected Result

```
✅ Test passes in ~30-45 seconds

Console output:
[Test] Created checkout ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
[Test] ✓ Checkout created with status: pending
[Test] ✓ Checkout status changed to: approved
[Test] ✓ Checkout status changed to: checked_out
[Test] ✓ Equipment status changed to: checked_out
[Test] ✓ Checkout status changed to: returned
[Test] ✓ Checkout status changed to: return_approved
[Test] ✓ Equipment status restored to: available
[Test] ✅ Full flow validation completed successfully
```

---

## Troubleshooting

### ❌ "Backend server is not accessible"

→ Start backend: `cd apps/backend && pnpm dev`

### ❌ "Equipment not found"

→ Seed database: `cd apps/backend && pnpm db:seed:test`

### ❌ "Login failed"

→ Check NODE_ENV: `echo $NODE_ENV` (should be "development")

### ❌ Test timeout

→ Run in headed mode to see what's happening: `pnpm test:e2e --headed ...`

---

## What This Test Does

```
1. Create checkout (as test_engineer)
   ↓
2. Approve checkout (as technical_manager)
   ↓
3. Start checkout (equipment status → checked_out)
   ↓
4. Return checkout with inspections
   ↓
5. Approve return (equipment status → available)
```

**Status Transitions Tested**: pending → approved → checked_out → returned → return_approved  
**Equipment Lifecycle Tested**: available → checked_out → available

---

## Full Documentation

- **Comprehensive Guide**: `README.md`
- **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`
- **Helper Functions**: `helpers/checkout-helpers.ts`
- **Assertion Utilities**: `helpers/assertions.ts`

---

**Test Type**: CRITICAL - Tests core business workflow  
**Duration**: ~30-45 seconds  
**Roles Used**: test_engineer, technical_manager  
**Equipment**: Spectrum Analyzer (SUW-E0001)
