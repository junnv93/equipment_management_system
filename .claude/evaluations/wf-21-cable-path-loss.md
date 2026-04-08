# Evaluation: wf-21-cable-path-loss
**Date**: 2026-04-08
**Iteration**: 1
**Verdict**: PASS

## MUST Criteria
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Spec file exists | PASS | apps/frontend/tests/e2e/workflows/wf-21-cable-path-loss.spec.ts |
| 2 | find *cable* hit | PASS | 1 match returned |
| 3 | frontend tsc --noEmit | PASS | no output |
| 4 | playwright exit 0 | PASS | 10 passed (9.7s), including 4 WF-21 steps |
| 5a | Cable register ELLLX-NNN | PASS | `ELLLX-${Date.now()%1000}`, 3-digit padded, line 29 |
| 5b | POST measurements ≥2 dataPoints | PASS | 4 dataPoints (30/1000/3000/6000 MHz), lines 75-80 |
| 5c | GET /api/cables/:id reflects measurement | PASS | measurements list length ≥1 + lastMeasurementDate truthy, lines 96-108 |
| 5d | Export 200 + spreadsheetml.sheet + >1000 bytes | PASS | status 200, content-type asserted, length>1000, PK magic bytes, lines 123-132 |
| 6 | Fixture usage | PASS | `testOperatorPage` from shared/fixtures/auth.fixture, line 13 |
| 7 | No CSS selectors | PASS | grep for `page.locator('[|.|#` returned 0 hits (API-only spec) |
| 8 | No fabricated domain data | PASS | ELLLX-NNN pattern, dummy dB values 0.5/1.0/1.5/2.0 |
| 9 | Isolation via unique mgmt number | PASS | Date.now()%1000 suffix |
| 10 | CAS step omitted | PASS | Not present in spec |

## SHOULD Criteria
- serial mode: PASS (line 34)
- clearBackendCache before step 3 & 4: PASS (lines 93, 115)
- getBackendToken('test_engineer'): PASS (line 117)

## Backend Fix Verification (form-template-export.service.ts:1290-1307)
- `cableIds.length > 0` guarded at line 1293 before IN clause — safe (empty IN would be invalid SQL).
- `sql.join(cableIds.map(id => sql\`${id}\`), sql\`, \`)` generates parameterized `$1, $2, ...` list — valid PG IN syntax, not vulnerable to injection.
- Replaces prior `ANY(${cableIds})` which Drizzle was treating as a single parameterized value (similar to the documented correlated-subquery bug). Fix is correct.
- `measurementIds.length > 0` check at line 1321 also guards the subsequent `inArray` call.

## Issues Found
none

## Verification Output
```
$ find apps/frontend/tests/e2e -iname '*cable*'
apps/frontend/tests/e2e/workflows/wf-21-cable-path-loss.spec.ts

$ pnpm --filter frontend exec tsc --noEmit
(no output)

$ pnpm --filter backend exec tsc --noEmit
(no output)

$ pnpm --filter frontend exec playwright test wf-21-cable-path-loss --project=chromium --reporter=line
[7/10] WF-21 Step 1: 케이블 등록
[8/10] WF-21 Step 2: Path Loss 측정 추가
[9/10] WF-21 Step 3: 케이블 상세 조회
[10/10] WF-21 Step 4: QP-18-08 XLSX export
10 passed (9.7s)
```
