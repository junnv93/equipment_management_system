/**
 * Shared ESLint rule fragment (SSOT for no-restricted-imports guard).
 *
 * Imported by:
 *   - ./eslint.config.mjs (root, covers packages/**)
 *   - apps/backend/eslint.config.mjs
 *   - apps/frontend/eslint.config.mjs
 *
 * DO NOT duplicate these patterns elsewhere.
 */
export const noRestrictedImportsRule = [
  'error',
  {
    patterns: [
      {
        group: ['**/auth/rbac/roles.enum'],
        message: 'Import UserRole from @equipment-management/schemas instead.',
      },
      {
        group: ['**/auth/rbac/permissions.enum'],
        message: 'Import Permission from @equipment-management/shared-constants instead.',
      },
    ],
  },
];

export const sharedRules = {
  'no-restricted-imports': noRestrictedImportsRule,
};
