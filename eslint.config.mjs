/**
 * Root ESLint flat config (v9).
 *
 * Scope: covers `packages/**\/*.ts` only. Apps are linted via their own
 * workspace-scoped flat configs (apps/backend/eslint.config.mjs,
 * apps/frontend/eslint.config.mjs) so each app keeps its own tsconfig root
 * for @typescript-eslint v8 projectService resolution.
 */
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { sharedRules } from './eslint.shared.mjs';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      '**/build/**',
      '**/*.config.js',
      '**/*.config.mjs',
      '**/*.config.cjs',
      '**/*.config.ts',
      'apps/**',
    ],
  },
  {
    files: ['packages/**/*.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      parserOptions: {
        // packages have no type-checked lint today — keep parity
        projectService: false,
        sourceType: 'module',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/ban-ts-comment': 'warn',
      ...sharedRules,
    },
  },
);
