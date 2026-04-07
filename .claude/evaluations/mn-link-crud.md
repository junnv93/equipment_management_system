# Evaluation: M:N 장비↔시험용SW 링크 CRUD

## Slug: mn-link-crud
## Date: 2026-04-05
## Evaluator: QA Agent (Claude Opus 4.6)

---

## MUST Criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| M1 | `pnpm tsc --noEmit` error 0 | **PASS** | Pre-verified by submitter |
| M2 | `pnpm --filter backend run build` 성공 | **PASS** | Pre-verified by submitter |
| M3 | `pnpm --filter frontend run build` 성공 | **PASS** | Pre-verified by submitter |
| M4 | `pnpm --filter backend run test` 전체 통과 | **PASS** | 441/441 passed per submitter |
| M5 | POST /api/test-software/:id/equipment로 장비 연결 가능 | **PASS** | Controller line 85-90: `@Post(':uuid/equipment')` with `LinkEquipmentPipe`, Service `linkEquipment()` inserts into `equipmentTestSoftware` table |
| M6 | DELETE /api/test-software/:id/equipment/:equipmentId로 연결 해제 가능 | **PASS** | Controller line 93-101: `@Delete(':uuid/equipment/:equipmentId')`, Service `unlinkEquipment()` deletes and returns 404 on miss |
| M7 | GET /api/test-software/:id/equipment로 연결된 장비 목록 조회 가능 | **PASS** | Controller line 79-83: `@Get(':uuid/equipment')`, Service `findLinkedEquipment()` JOINs equipment table |
| M8 | 중복 연결 시 409 Conflict 반환 (500 아님) | **PASS** | Service lines 408-421: catches PostgreSQL error code `23505` and throws `ConflictException` with code `EQUIPMENT_ALREADY_LINKED` |
| M9 | 미존재 연결 해제 시 404 반환 | **PASS** | Service lines 438-442: checks `deleted.length === 0` and throws `NotFoundException` with code `EQUIPMENT_LINK_NOT_FOUND` |
| M10 | 백엔드 캐시 무효화: by-equipment + linked-equipment 양방향 | **PASS** | `invalidateLinkCaches()` at service line 372-376: deletes `by-equipment:{equipmentId}`, `linked-equipment:{testSoftwareId}`, and `list:*` prefix. Called in both `linkEquipment` (line 400) and `unlinkEquipment` (line 445) |
| M11 | @RequirePermissions 3개 엔드포인트 모두 적용 | **PASS** | GET: `Permission.VIEW_TEST_SOFTWARE` (line 80), POST: `Permission.UPDATE_TEST_SOFTWARE` (line 86), DELETE: `Permission.UPDATE_TEST_SOFTWARE` (line 94) |
| M12 | ParseUUIDPipe 모든 UUID 파라미터에 적용 | **PASS** | GET uuid (line 81), POST uuid (line 89), DELETE uuid (line 97), DELETE equipmentId (line 98) -- all have `ParseUUIDPipe` |
| M13 | API_ENDPOINTS SSOT -- 프론트엔드 하드코딩 없음 | **PASS** | `api-endpoints.ts` defines `LINKED_EQUIPMENT`, `LINK_EQUIPMENT`, `UNLINK_EQUIPMENT`. `software-api.ts` imports and uses `API_ENDPOINTS.TEST_SOFTWARE.*` for all 3 endpoints. No hardcoded paths in production frontend code (only e2e test helper has a hardcoded path, which is acceptable) |
| M14 | queryKeys.testSoftware.linkedEquipment(id) 등록 | **PASS** | `query-config.ts` line 444: `linkedEquipment: (softwareId: string) => [...queryKeys.testSoftware.all, 'linked-equipment', softwareId] as const` |
| M15 | SoftwareTab.tsx에 연결/해제 UI 존재 | **PASS** | Link button (line 242-245), unlink button per row (line 302-310), link dialog (line 344-374), uses `TestSoftwareCombobox` for selection |
| M16 | TestSoftwareDetailContent.tsx에 연결된 장비 섹션 존재 | **PASS** | Linked equipment card (lines 413-490), link dialog (lines 493-526), uses `EquipmentCombobox`, table with unlink buttons |

**MUST Result: 16/16 PASS**

---

## SHOULD Criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| S1 | @AuditLog 데코레이터 link/unlink에 적용 | **PASS** | POST link: `@AuditLog({ action: 'update', ... })` (line 87), DELETE unlink: `@AuditLog({ action: 'delete', ... })` (line 95) |
| S2 | Toast 피드백 (성공/에러) | **PASS** | SoftwareTab: `onSuccess` toast (line 85), `onError` toast with ALREADY_LINKED check (line 91-94). TestSoftwareDetailContent: success/error toasts in both mutations |
| S3 | 해제 전 확인 다이얼로그 | **PASS** | SoftwareTab line 128: `if (!confirm(...)) return;`. TestSoftwareDetailContent line 121: `if (!confirm(...)) return;` |
| S4 | i18n en/ko 키 완전 | **PASS** | `equipment.json` en/ko both have full `softwareTab.*` keys (lines 559-590). `software.json` en/ko both have full `linkedEquipment.*` keys (lines 106-123). All keys used in components are present in both locales |
| S5 | 프론트엔드 mutation onSettled에서 양방향 캐시 무효화 | **FAIL** | **BUG in SoftwareTab.tsx**: `linkMutation.onSuccess` (line 85) clears `selectedSoftwareId` to `undefined` BEFORE `onSettled` (line 96) calls `invalidateLinkCaches()`. Since `invalidateLinkCaches` checks `if (selectedSoftwareId)` (line 73), the `linkedEquipment` cache for the software side is never invalidated after linking. **Additionally**, `unlinkMutation.onSettled` (lines 112-114) only invalidates `byEquipment(equipmentId)` but never invalidates `linkedEquipment(softwareId)` for the software's own cache. TestSoftwareDetailContent handles this correctly in both mutations. |

**SHOULD Result: 4/5 PASS**

---

## Defects Found

### DEF-1: SoftwareTab.tsx linkMutation race condition (S5 violation)

**File:** `apps/frontend/components/equipment/SoftwareTab.tsx`
**Lines:** 78-97

`onSuccess` sets `selectedSoftwareId = undefined` at line 85. `onSettled` fires after `onSuccess` and calls `invalidateLinkCaches()` which conditionally invalidates `linkedEquipment(selectedSoftwareId)` only if `selectedSoftwareId` is truthy (line 73-76). Result: the software-side `linkedEquipment` cache is stale after linking from the equipment detail page.

**Fix:** Capture `selectedSoftwareId` in the mutation variables rather than reading it from state in `onSettled`, or move the invalidation to `onSuccess` before clearing state.

### DEF-2: SoftwareTab.tsx unlinkMutation missing bidirectional invalidation

**File:** `apps/frontend/components/equipment/SoftwareTab.tsx`
**Lines:** 99-115

`unlinkMutation.onSettled` only invalidates `queryKeys.testSoftware.byEquipment(equipmentId)` but does NOT invalidate `queryKeys.testSoftware.linkedEquipment(softwareId)`. The `softwareId` is available from the mutation variable (`data.softwareId`) but is not used. If a user unlinks from the equipment detail page and then navigates to the software detail page, the software's linked equipment list will show stale data until the cache expires.

**Fix:** Add `queryClient.invalidateQueries({ queryKey: queryKeys.testSoftware.linkedEquipment(softwareId) })` in `onSettled`, extracting `softwareId` from the mutation variable.

---

## Summary

| Category | Pass | Total | Rate |
|----------|------|-------|------|
| MUST | 16 | 16 | 100% |
| SHOULD | 4 | 5 | 80% |

**Verdict: PASS** -- All 16 MUST criteria are satisfied. 1 SHOULD criterion (S5) fails due to incomplete bidirectional cache invalidation in `SoftwareTab.tsx`. Two related defects (DEF-1, DEF-2) should be addressed before merging to prevent stale cache scenarios when navigating between equipment and software detail pages.
