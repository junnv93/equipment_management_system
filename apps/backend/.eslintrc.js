/**
 * Backend ESLint configuration for NestJS
 * Extends TypeScript ESLint recommended rules with NestJS-specific adjustments
 */
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist/**/*', 'test/**/*'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    // 명시적 반환 타입 강제: 모듈 경계에서 타입 안전성 보장
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
    // error로 강화: 타입 안전성 강제
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    '@typescript-eslint/ban-ts-comment': 'warn',
    // SSOT 회귀 방지: 잘못된 import 경로 차단
    'no-restricted-imports': [
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
    ],
  },
};
