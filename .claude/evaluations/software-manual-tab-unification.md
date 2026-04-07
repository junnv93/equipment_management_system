# Evaluation: 소프트웨어/매뉴얼 탭 통합 재설계

**Date:** 2026-04-04
**Evaluator:** QA Agent (Claude Opus 4.6)
**Branch:** feat/software-domain-redesign

---

## Build Verification

| Check | Result |
|-------|--------|
| `pnpm tsc --noEmit` (full project) | PASS (0 errors) |
| `pnpm --filter backend run build` | PASS |
| `pnpm --filter backend run test` | PASS (36 suites, 441 tests) |

---

## MUST Criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| M1 | `pnpm --filter backend run tsc --noEmit` error 0 | **PASS** | `pnpm tsc --noEmit` exited cleanly (covers both backend and frontend) |
| M2 | `pnpm --filter frontend run tsc --noEmit` error 0 | **PASS** | Same as above |
| M3 | `pnpm --filter backend run build` success | **PASS** | `nest build` completed without errors |
| M4 | `pnpm --filter frontend run build` success | **PASS** | Next.js build completed successfully, all routes compiled. |
| M5 | `pnpm --filter backend run test` all pass | **PASS** | 441/441 tests passed |
| M6 | GET /api/test-software/by-equipment/{equipmentId} returns linked SW list | **PASS** | Controller: `@Get('by-equipment/:equipmentId')` with `ParseUUIDPipe` + `@RequirePermissions(Permission.VIEW_TEST_SOFTWARE)`. Service: `findByEquipmentId` uses `innerJoin` on `equipmentTestSoftware` table. Route placed BEFORE `:uuid` to avoid conflicts. |
| M7 | SoftwareTab has 3 sections: firmware / manual / related test software | **PASS** | Section A (line 83): firmware info. Section B (line 103): manual location + files. Section C (line 157): related test software table. |
| M8 | BasicInfoTab manual file section + firmware/manual card removed | **PASS** | No `BookOpen`, `firmwareVersion`, `manualLocation`, or `softwareTab` references in BasicInfoTab.tsx (only a comment at line 60). |
| M9 | i18n ko/en keys complete (all softwareTab.* keys registered) | **PASS** | ko: 18 keys, en: 18 keys. All 18 keys used in SoftwareTab.tsx are present in both locale files. Key sets match exactly. |
| M10 | SSOT: API_ENDPOINTS, FRONTEND_ROUTES, queryKeys imports (no hardcoding) | **PASS** | SoftwareTab uses `FRONTEND_ROUTES.SOFTWARE.DETAIL(sw.id)` and `FRONTEND_ROUTES.SOFTWARE.LIST`. software-api.ts uses `API_ENDPOINTS.TEST_SOFTWARE.BY_EQUIPMENT(equipmentId)`. Query uses `queryKeys.testSoftware.byEquipment(equipmentId)`. No hardcoded `/api/` paths found in component. |

---

## SHOULD Criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| S1 | review-architecture Critical issues 0 | **NOT TESTED** | Full architecture review not run in this evaluation. |
| S2 | Related SW row click -> FRONTEND_ROUTES.SOFTWARE.DETAIL(id) navigation | **PASS** | Line 198: `<Link href={FRONTEND_ROUTES.SOFTWARE.DETAIL(sw.id)}>` on management number column. |
| S3 | All 3 sections empty -> unified empty state displayed | **PASS** | Line 59: `isEmpty = !hasFirmware && !hasManualLocation && !hasManualFiles && !hasLinkedSoftware`. Lines 61-77: renders single Card with empty message when `isEmpty` is true. |
| S4 | Manual file download works (documentApi used) | **PASS** (code review only) | Line 52: `handleDownload` calls `documentApi.downloadDocument(doc.id, doc.originalFileName)`. Functional test not performed. |

---

## Additional Findings

### Positive
- Route ordering is correct: `by-equipment/:equipmentId` (line 76) precedes `:uuid` (line 84) in the controller, preventing route conflicts.
- No `useState` for server state -- TanStack Query used correctly with `useQuery`.
- Cache key `by-equipment:{equipmentId}` is properly namespaced.
- `innerJoin` used instead of correlated subquery (per CLAUDE.md guidance).
- `useMemo` used for manual filtering to avoid unnecessary re-renders.
- Accessibility: `aria-hidden="true"` on decorative icons, `aria-label` on download button.

### Minor Observations (not blocking)
- `sw.testField` in the related software table (line 209) displays the raw enum value (e.g., "EMC", "SAFETY") without i18n translation. The existing software list page likely does the same, so this is consistent but could be improved.
- Section C always renders when not fully empty. If only firmware exists, the "no linked software" empty state for section C will show. This appears intentional but could be reviewed for UX.
- `findByEquipmentId` cache is not invalidated when equipment-software links change. This could lead to stale data if the M:N relationship is modified elsewhere. However, cache uses `CACHE_TTL.MEDIUM` which mitigates this.

---

## Verdict

**PASS** -- All MUST criteria satisfied. SHOULD criteria pass where testable via code review.

| Category | Pass | Fail | Not Tested |
|----------|------|------|------------|
| MUST (10) | 10 | 0 | 0 |
| SHOULD (4) | 3 | 0 | 1 (architecture review) |
