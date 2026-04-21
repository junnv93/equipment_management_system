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
        caughtErrorsIgnorePattern: '^_',
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
    // SSOT 회귀 방지: domain status 하드코딩 문자열 리터럴 차단 (비교 패턴)
    'no-restricted-syntax': [
      'error',
      {
        selector:
          "BinaryExpression[operator=/^(===|!==)$/][left.type='MemberExpression'][left.property.name=/^(status|approvalStatus|returnApprovalStatus)$/][right.type='Literal'][right.value=/^(active|approved|available|cancelled|canceled|checked_out|closed|completed|corrected|deleted|disposed|draft|failed|in_progress|inactive|in_use|lender_checked|lender_received|borrower_received|borrower_returned|non_conforming|open|overdue|pending|pending_approval|pending_disposal|quality_approved|rejected|rental|retired|return_approved|returned|reviewed|scheduled|spare|submitted|superseded|temporary)$/]",
        message:
          "Do not compare .status/.approvalStatus against a raw domain literal. Import the matching *StatusValues/*Values constant from '@equipment-management/schemas' (e.g. EquipmentStatusValues.AVAILABLE, CalibrationStatusValues.COMPLETED). For Promise.allSettled (r.status === 'fulfilled'|'rejected'), add: // eslint-disable-next-line no-restricted-syntax -- Promise.allSettled result status",
      },
      // SSOT 회귀 방지: domain status 하드코딩 문자열 리터럴 차단 (객체 할당 패턴)
      {
        selector:
          "Property[key.name=/^(status|approvalStatus|returnApprovalStatus)$/][value.type='Literal'][value.value=/^(active|approved|available|cancelled|canceled|checked_out|closed|completed|corrected|deleted|disposed|draft|failed|in_progress|inactive|in_use|lender_checked|lender_received|borrower_received|borrower_returned|non_conforming|open|overdue|pending|pending_approval|pending_disposal|quality_approved|rejected|rental|retired|return_approved|returned|reviewed|scheduled|spare|submitted|superseded|temporary)$/]",
        message:
          "Do not assign a raw domain literal to .status/.approvalStatus. Import the matching *StatusValues/*Values constant from '@equipment-management/schemas' (e.g. EquipmentStatusValues.AVAILABLE). For Drizzle insert/update objects, use the Values constant.",
      },
      // SSOT 회귀 방지: domain status 하드코딩 문자열 리터럴 차단 (함수 인자 패턴: eq/ne/gt/lt 등)
      {
        selector:
          "CallExpression[arguments.0.type='MemberExpression'][arguments.0.property.name=/^(status|approvalStatus|returnApprovalStatus)$/][arguments.1.type='Literal'][arguments.1.value=/^(active|approved|available|cancelled|canceled|checked_out|closed|completed|corrected|deleted|disposed|draft|failed|in_progress|inactive|in_use|lender_checked|lender_received|borrower_received|borrower_returned|non_conforming|open|overdue|pending|pending_approval|pending_disposal|quality_approved|rejected|rental|retired|return_approved|returned|reviewed|scheduled|spare|submitted|superseded|temporary)$/]",
        message:
          "Do not pass a raw domain literal as function argument for .status/.approvalStatus. Import the matching *StatusValues/*Values constant from '@equipment-management/schemas' (e.g. eq(table.status, EquipmentStatusValues.AVAILABLE)).",
      },
    ],
  },
  overrides: [
    {
      // Controllers must NOT emit events — event dispatch belongs in Service layer (AD-8)
      // Note: ESLint overrides replace (not merge) global rules. Both selectors must be listed here
      // to ensure domain literal restriction also applies inside controllers.
      files: ['**/*.controller.ts'],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector:
              "CallExpression[callee.type='MemberExpression'][callee.property.name='emitAsync']",
            message:
              'Controllers must not call emitAsync. Move event emission to the Service layer.',
          },
          {
            selector:
              "BinaryExpression[operator=/^(===|!==)$/][left.type='MemberExpression'][left.property.name=/^(status|approvalStatus|returnApprovalStatus)$/][right.type='Literal'][right.value=/^(active|approved|available|cancelled|canceled|checked_out|closed|completed|corrected|deleted|disposed|draft|failed|in_progress|inactive|in_use|lender_checked|lender_received|borrower_received|borrower_returned|non_conforming|open|overdue|pending|pending_approval|pending_disposal|quality_approved|rejected|rental|retired|return_approved|returned|reviewed|scheduled|spare|submitted|superseded|temporary)$/]",
            message:
              "Do not compare .status/.approvalStatus against a raw domain literal. Import the matching *StatusValues/*Values constant from '@equipment-management/schemas'.",
          },
          {
            selector:
              "Property[key.name=/^(status|approvalStatus|returnApprovalStatus)$/][value.type='Literal'][value.value=/^(active|approved|available|cancelled|canceled|checked_out|closed|completed|corrected|deleted|disposed|draft|failed|in_progress|inactive|in_use|lender_checked|lender_received|borrower_received|borrower_returned|non_conforming|open|overdue|pending|pending_approval|pending_disposal|quality_approved|rejected|rental|retired|return_approved|returned|reviewed|scheduled|spare|submitted|superseded|temporary)$/]",
            message:
              "Do not assign a raw domain literal to .status/.approvalStatus. Import the matching *StatusValues/*Values constant from '@equipment-management/schemas'.",
          },
          {
            selector:
              "CallExpression[arguments.0.type='MemberExpression'][arguments.0.property.name=/^(status|approvalStatus|returnApprovalStatus)$/][arguments.1.type='Literal'][arguments.1.value=/^(active|approved|available|cancelled|canceled|checked_out|closed|completed|corrected|deleted|disposed|draft|failed|in_progress|inactive|in_use|lender_checked|lender_received|borrower_received|borrower_returned|non_conforming|open|overdue|pending|pending_approval|pending_disposal|quality_approved|rejected|rental|retired|return_approved|returned|reviewed|scheduled|spare|submitted|superseded|temporary)$/]",
            message:
              "Do not pass a raw domain literal as function argument for .status/.approvalStatus. Import the matching *StatusValues/*Values constant from '@equipment-management/schemas'.",
          },
        ],
      },
    },
    {
      // seed-data fixture, 테스트 spec, 테스트 헬퍼는 리터럴 사용이 정상 — SSOT 룰 제외
      files: [
        'src/database/seed-data/**/*.ts',
        '**/__tests__/**/*.spec.ts',
        '**/*.spec.ts',
        '**/testing/**/*.ts',
      ],
      rules: {
        'no-restricted-syntax': 'off',
      },
    },
  ],
};
