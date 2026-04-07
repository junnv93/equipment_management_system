/**
 * Backend ESLint flat config (v9) — port of legacy .eslintrc.js.
 *
 * Preserves exact rule parity with pre-migration config:
 *   - @typescript-eslint/explicit-function-return-type: error
 *   - @typescript-eslint/explicit-module-boundary-types: error
 *   - @typescript-eslint/no-explicit-any: error
 *   - @typescript-eslint/no-unused-vars: error
 *   - @typescript-eslint/ban-ts-comment: warn
 *   - @typescript-eslint/interface-name-prefix: off
 *   - no-restricted-imports: error (SSOT guard, imported from shared fragment)
 *
 * Test files are intentionally excluded to preserve legacy ignorePatterns parity.
 */
import js from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { sharedRules } from '../../eslint.shared.mjs';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'test/**',
      'scripts/**',
      'test-uploads/**',
      'eslint.config.mjs',
    ],
  },
  {
    files: ['{src,apps,libs}/**/*.ts'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      eslintPluginPrettierRecommended,
    ],
    languageOptions: {
      parserOptions: {
        projectService: {
          // tsconfig.json explicitly excludes seed-test-new.ts (standalone E2E seed script);
          // allow projectService to fall back to default project for it so lint coverage parity is preserved.
          allowDefaultProject: ['src/database/seed-test-new.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowDirectConstAssertionInArrowFunctions: true,
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': [
        'error',
        {
          allowArgumentsExplicitlyTypedAsAny: false,
          allowDirectConstAssertionInArrowFunctions: true,
          allowHigherOrderFunctions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/ban-ts-comment': 'warn',
      ...sharedRules,
    },
  },
);
