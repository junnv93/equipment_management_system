# findall-meta-fallback-path-design-closure

## Scope

Resolve the `findAll` meta fallback debt by verifying current call paths and cache semantics.

## MUST

- Confirm the normal checkout list controller passes user permissions and team ID into `findAll`.
- Confirm `getInboundOverview` intentionally calls `findAll` without user permissions.
- Confirm the inbound overview cache key is not user-permission scoped, so injecting user-specific `availableActions` there would risk action-meta leakage.
- Do not remove the optional `userPermissions` branch unless every `findAll` caller can safely provide user-scoped cache context.

## SHOULD

- Treat `getInboundOverview` as a dashboard/BFF summary path unless it starts rendering per-user checkout actions.

## Verification

- Static inspection:
  - `apps/backend/src/modules/checkouts/checkouts.controller.ts`
  - `apps/backend/src/modules/checkouts/checkouts.service.ts`
