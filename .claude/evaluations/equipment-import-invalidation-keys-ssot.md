# Evaluation: equipment-import-invalidation-keys-ssot

## Result

PASS

## Evidence

- Contract checked: `.claude/contracts/equipment-import-invalidation-keys-ssot.md`.
- `EquipmentImportDetail.tsx` has 0 instances of exact inline `invalidateKeys: [queryKeys.equipmentImports.lists()]`.
- The 4 status mutations now use `EquipmentImportCacheInvalidation.statusMutationInvalidateKeys`:
  - approve mutation
  - reject mutation
  - initiate return mutation
  - cancel mutation
- `EquipmentImportCacheInvalidation.statusMutationInvalidateKeys` is defined in `apps/frontend/lib/api/cache-invalidation.ts` as the shared invalidate key surface.
- Canonical source remains `queryKeys.equipmentImports.lists()`; no hardcoded query key array/string was introduced.
- Diff for `EquipmentImportDetail.tsx` only changes the repeated `invalidateKeys` value. Mutation functions, `queryKey`, optimistic status transitions, success messages, error messages, and success/error callback semantics are unchanged.
- Tracker contains completed batch row `equipment-import-invalidation-keys-ssot` and the previous open item is absent from the Open section.
- Verification command passed:

```bash
pnpm --filter frontend type-check
```

## Notes

- Existing direct uses of `queryKeys.equipmentImports.lists()` inside cache invalidation methods remain canonical query-key usage, not duplicate inline `invalidateKeys` at the component mutation call sites.
