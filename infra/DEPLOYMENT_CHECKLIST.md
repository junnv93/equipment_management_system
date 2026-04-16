# Phase 1 Optimistic Locking - Deployment Checklist

## Pre-Deployment

### Code Review

- [ ] All frontend changes reviewed and approved
- [ ] Backend changes reviewed (when ready)
- [ ] No console.log or debug code in production
- [ ] All TODO comments addressed or documented

### Testing

- [x] All unit tests pass
  ```bash
  pnpm test
  ```
- [x] All E2E tests pass (2026-02-11)
  ```bash
  pnpm --filter frontend run test:e2e -- checkouts
  ```
  **Results**: 52/53 tests passed (P0/P1 critical tests: 4/4 ✅, Regression: 48/48 ✅)
  - **Expected failure**: P2-UI-01 (Phase 3 auto-retry feature not implemented)
  - **See**: `/tmp/phase1_test_results.md` for detailed report
- [x] Manual testing completed (see PHASE1_VERIFICATION.md)
- [ ] Performance testing shows acceptable latency

### Database

- [ ] Migration script reviewed
  ```bash
  cat apps/backend/drizzle/manual/20260212_add_checkout_version.sql
  ```
- [ ] Rollback script exists and tested
  ```bash
  cat apps/backend/drizzle/manual/rollback_20260212_add_checkout_version.sql
  ```
- [ ] Migration tested on staging database
- [ ] DB backup created before migration

### Build

- [ ] Frontend builds without errors
  ```bash
  pnpm --filter frontend run build
  ```
- [ ] Backend builds without errors
  ```bash
  pnpm --filter backend run build
  ```
- [ ] No TypeScript errors
- [ ] Bundle size acceptable (< 5% increase)

---

## Deployment Steps

### 1. Database Migration (Backend First)

**Estimated Time**: 5 minutes
**Rollback Time**: 2 minutes

```bash
# 1. Backup database
docker compose -f docker-compose.lan.yml exec -T postgres pg_dump -U postgres equipment_management > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Apply migration
cd apps/backend
pnpm run db:migrate:manual

# 3. Verify migration
docker compose -f docker-compose.lan.yml exec -T postgres psql -U postgres -d equipment_management -c "\d checkouts"
# Should show: version | integer | not null | 1

# 4. Check data
docker compose -f docker-compose.lan.yml exec -T postgres psql -U postgres -d equipment_management -c "SELECT id, version FROM checkouts LIMIT 5;"
# All rows should have version=1
```

**Rollback if needed**:

```bash
docker compose -f docker-compose.lan.yml exec -T postgres psql -U postgres -d equipment_management < apps/backend/drizzle/manual/rollback_20260212_add_checkout_version.sql
```

### 2. Backend Deployment

**Estimated Time**: 10 minutes
**Zero-Downtime**: Yes (backward compatible)

```bash
# 1. Build backend
pnpm --filter backend run build

# 2. Run tests
pnpm --filter backend run test
pnpm --filter backend run test:e2e

# 3. Deploy
# (Use your deployment method - Docker, PM2, etc.)

# 4. Health check
curl http://localhost:3001/health
```

**Verification**:

```bash
# Test version-enabled endpoint
curl -X POST http://localhost:3001/api/checkouts/{id}/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"version": 1}'

# Should return 200 OK with version: 2
```

### 3. Frontend Deployment

**Estimated Time**: 5 minutes
**Zero-Downtime**: Yes

```bash
# 1. Build frontend
pnpm --filter frontend run build

# 2. Deploy static files
# (Use your deployment method - Vercel, Netlify, etc.)

# 3. Smoke test
# Open app in browser and test checkout flow
```

---

## Post-Deployment Verification

### Immediate Checks (0-15 minutes)

- [ ] Application loads without errors
- [ ] Health endpoints return 200
  ```bash
  curl http://localhost:3001/health
  curl http://localhost:3000/api/health
  ```
- [ ] Database version column exists
  ```sql
  SELECT column_name, data_type, column_default
  FROM information_schema.columns
  WHERE table_name = 'checkouts' AND column_name = 'version';
  ```
- [ ] Version increments on mutation

  ```sql
  -- Before mutation
  SELECT id, status, version FROM checkouts WHERE id = 'test-id';

  -- Trigger mutation via UI

  -- After mutation
  SELECT id, status, version FROM checkouts WHERE id = 'test-id';
  -- version should have incremented
  ```

### Short-term Monitoring (15-60 minutes)

- [ ] No 500 errors in logs

  ```bash
  # Backend logs
  grep "500" apps/backend/logs/error.log | tail -20

  # Check for version-related errors
  grep "VERSION_CONFLICT" apps/backend/logs/app.log | tail -20
  ```

- [ ] 409 errors are handled gracefully
- [ ] Error rate < 1%
- [ ] Response time < 200ms (p95)

### Medium-term Monitoring (1-24 hours)

- [ ] Monitor error logs for patterns
- [ ] Check version conflict frequency
  ```sql
  -- If logging is enabled
  SELECT COUNT(*) FROM error_logs
  WHERE error_code = 'VERSION_CONFLICT'
  AND created_at > NOW() - INTERVAL '1 hour';
  ```
- [ ] User feedback (no complaints about conflicts)
- [ ] Performance metrics stable

---

## Rollback Procedure

### Severity Levels

**Level 1 - Frontend Only Issue**

- Rollback frontend deployment
- No database changes needed
- **Time**: < 5 minutes

**Level 2 - Backend Logic Issue**

- Rollback backend deployment
- Database migration can stay (version column is harmless)
- **Time**: < 10 minutes

**Level 3 - Database Issue**

- Rollback backend deployment
- Rollback database migration
- **Time**: < 15 minutes

### Rollback Steps

#### Frontend Rollback

```bash
# Revert to previous deployment
# (Method depends on hosting platform)

# Vercel
vercel rollback

# Manual
git revert <commit-hash>
pnpm --filter frontend run build
# Deploy previous build
```

#### Backend Rollback

```bash
# Stop service
pm2 stop backend

# Checkout previous version
git revert <commit-hash>

# Rebuild
pnpm --filter backend run build

# Restart
pm2 restart backend
```

#### Database Rollback

```bash
# Apply rollback migration
docker compose -f docker-compose.lan.yml exec -T postgres psql -U postgres -d equipment_management < apps/backend/drizzle/manual/rollback_20260212_add_checkout_version.sql

# Verify
docker compose -f docker-compose.lan.yml exec -T postgres psql -U postgres -d equipment_management -c "\d checkouts"
# version column should be gone

# Restore from backup if needed
docker compose -f docker-compose.lan.yml exec -T postgres psql -U postgres -d equipment_management < backup_YYYYMMDD_HHMMSS.sql
```

---

## Monitoring Queries

### Check Version Distribution

```sql
SELECT version, COUNT(*) as count
FROM checkouts
GROUP BY version
ORDER BY version;
```

**Expected**: Most checkouts at version 1-5, some higher for frequently updated ones

### Check for Version Conflicts

```sql
-- If error logging is implemented
SELECT DATE_TRUNC('hour', created_at) as hour,
       COUNT(*) as conflict_count
FROM error_logs
WHERE error_code = 'VERSION_CONFLICT'
GROUP BY hour
ORDER BY hour DESC
LIMIT 24;
```

**Expected**: < 5 conflicts per hour (depends on concurrent usage)

### Check Mutation Performance

```sql
-- Assuming query logging is enabled
SELECT query,
       AVG(duration) as avg_ms,
       MAX(duration) as max_ms,
       COUNT(*) as executions
FROM query_logs
WHERE query LIKE '%UPDATE checkouts%version%'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY query;
```

**Expected**: avg_ms < 50, max_ms < 200

---

## Success Metrics

### Technical Metrics

| Metric              | Target              | Measurement         |
| ------------------- | ------------------- | ------------------- |
| Error Rate          | < 0.1%              | Error logs          |
| Response Time (p95) | < 200ms             | APM tool            |
| Version Conflicts   | < 0.5% of mutations | Error logs          |
| DB Query Time       | < 50ms avg          | Query logs          |
| Zero Data Loss      | 100%                | Manual verification |

### User Experience Metrics

| Metric                  | Target      | Measurement      |
| ----------------------- | ----------- | ---------------- |
| User-reported conflicts | 0           | Support tickets  |
| Unexpected errors       | 0           | User feedback    |
| Page refreshes          | Transparent | User observation |

### Business Metrics

| Metric                    | Target      | Measurement |
| ------------------------- | ----------- | ----------- |
| Checkout completion rate  | No decrease | Analytics   |
| Time to complete checkout | No increase | Analytics   |
| User satisfaction         | Maintained  | Surveys     |

---

## Communication Plan

### Before Deployment

**Audience**: Technical team
**Medium**: Slack #dev-team
**Message**:

```
🚀 Deploying Phase 1 Optimistic Locking for Checkout System

What: Version-based concurrency control
When: [Date/Time]
Impact: No user-facing changes, better data integrity
Rollback: Available within 15 minutes if needed

Monitoring: Watch for VERSION_CONFLICT logs
```

### During Deployment

**Audience**: Stakeholders
**Medium**: Slack #general
**Message**:

```
⚙️ System Update in Progress

We're deploying a backend improvement for checkout data integrity.
No downtime expected.
You may see brief page refreshes if you're actively using the checkout system.
```

### After Deployment

**Audience**: All users
**Medium**: In-app notification (if applicable)
**Message**:

```
✅ System Update Complete

We've improved the checkout system's data handling.
Everything should work as before, but better!

If you notice anything unusual, please contact support.
```

---

## Known Issues & Mitigation

### Issue: Version conflict frequency higher than expected

**Symptoms**: Many 409 errors in logs
**Cause**: High concurrent usage on same checkout
**Mitigation**:

- Implement Phase 3 (auto-retry) immediately
- Add exponential backoff
- Consider pessimistic locking for hot checkouts

### Issue: Performance degradation

**Symptoms**: Slow response times
**Cause**: Index missing or not used
**Mitigation**:

```sql
-- Create index if not exists
CREATE INDEX CONCURRENTLY idx_checkouts_id_version
ON checkouts (id, version);

-- Analyze query plan
EXPLAIN ANALYZE
UPDATE checkouts
SET status = 'approved', version = version + 1
WHERE id = '...' AND version = 1;
```

### Issue: Migration fails on production

**Symptoms**: ALTER TABLE fails
**Cause**: Table lock timeout or constraint violation
**Mitigation**:

- Run during low-traffic window
- Use `CONCURRENTLY` where possible
- Increase statement timeout temporarily

---

## Contact Information

**Deployment Lead**: [Name]
**Backend Lead**: [Name]
**Frontend Lead**: [Name]
**Database Admin**: [Name]

**Emergency Contacts**:

- On-call: [Phone]
- Slack: #dev-emergencies
- Email: dev-team@company.com

---

## Post-Mortem Template

After 7 days, complete post-mortem:

### What Went Well

- [ ] Zero-downtime deployment
- [ ] All tests passed
- [ ] No rollbacks needed
- [ ] Performance within targets

### What Could Be Improved

- [ ] [Issue 1]
- [ ] [Issue 2]

### Action Items

- [ ] [Action 1] - Assigned to: [Name] - Due: [Date]
- [ ] [Action 2] - Assigned to: [Name] - Due: [Date]

### Metrics Summary

- Total deployments: 3 (DB, Backend, Frontend)
- Total time: XX minutes
- Incidents: X
- Version conflicts detected: X
- Performance impact: +X%

---

## Appendix

### Environment Variables

**Backend** (`apps/backend/.env`):

```bash
# No new env vars required for Phase 1
```

**Frontend** (`apps/frontend/.env.local`):

```bash
# No new env vars required for Phase 1
```

### Configuration Files Modified

- `packages/db/src/schema/checkouts.ts` - Added version column
- `apps/backend/src/modules/checkouts/checkouts.service.ts` - CAS logic
- `apps/frontend/lib/api/checkout-api.ts` - Added version to DTOs

### Dependencies Added

**None** - This feature uses existing dependencies.

### Database Schema Changes

```sql
-- Before
CREATE TABLE checkouts (
  id UUID PRIMARY KEY,
  status VARCHAR(50) NOT NULL,
  -- ... other fields
  updated_at TIMESTAMP NOT NULL
);

-- After
CREATE TABLE checkouts (
  id UUID PRIMARY KEY,
  status VARCHAR(50) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,  -- ✅ NEW
  -- ... other fields
  updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_checkouts_id_version ON checkouts (id, version);  -- ✅ NEW
```
