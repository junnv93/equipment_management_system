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
        // Supply-Chain SSOT (verify-ssot Step 44): randomUUID는 IdentifierService 경유로만 호출.
        // 정적 grep이 못 잡는 우회 패턴(`* as crypto`, alias rename) 차단을 위해 ESLint 이중 가드.
        // 예외: `apps/backend/src/common/identifiers/identifier.service.ts` (overrides에서 off).
        // 참고: `docs/references/identifier-policy.md`
        paths: [
          {
            name: 'node:crypto',
            importNames: ['randomUUID'],
            message:
              "Use IdentifierService (DI) or generateXxxId() from '@/common/identifiers/identifier.service' instead. See verify-ssot Step 44 / docs/references/identifier-policy.md.",
          },
          {
            name: 'crypto',
            importNames: ['randomUUID'],
            message:
              "Use IdentifierService (DI) or generateXxxId() from '@/common/identifiers/identifier.service' instead. See verify-ssot Step 44 / docs/references/identifier-policy.md.",
          },
        ],
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
      // Supply-Chain SSOT (verify-ssot Step 44): randomUUID member call 차단.
      // `import * as crypto from 'crypto'; crypto.randomUUID()` 우회 패턴 봉쇄.
      // identifier.service.ts는 named import만 사용하므로 영향 없음 (overrides에서 off도 적용).
      {
        selector: "MemberExpression[property.name='randomUUID']",
        message:
          "Do not call .randomUUID() as member access. Use IdentifierService (DI) or generateXxxId() from '@/common/identifiers/identifier.service'. See verify-ssot Step 44 / docs/references/identifier-policy.md.",
      },
      // Computed property 우회 차단: `crypto['randomUUID']()` / `crypto[k]()` (k=Literal).
      // review-architecture A3 권고 — non-computed MemberExpression selector 보완.
      {
        selector: "MemberExpression[computed=true][property.value='randomUUID']",
        message:
          "Do not use computed property access for randomUUID. Use IdentifierService (DI) from '@/common/identifiers/identifier.service'. See verify-ssot Step 44.",
      },
      // 동적 import 우회 차단: `const { randomUUID } = await import('node:crypto')` 패턴.
      // ES module import 구문이 아닌 dynamic import()도 no-restricted-imports가 검사 안 함.
      {
        selector: "CallExpression[callee.type='Import'][arguments.0.value='node:crypto']",
        message:
          "Dynamic import('node:crypto') is not allowed. Use IdentifierService (DI) or generateXxxId() from '@/common/identifiers/identifier.service'. See verify-ssot Step 44 / docs/references/identifier-policy.md.",
      },
      {
        selector: "CallExpression[callee.type='Import'][arguments.0.value='crypto']",
        message:
          "Dynamic import('crypto') is not allowed. Use IdentifierService (DI) or generateXxxId() from '@/common/identifiers/identifier.service'. See verify-ssot Step 44 / docs/references/identifier-policy.md.",
      },
      {
        selector:
          "BinaryExpression[operator=/^(===|!==)$/][left.type='MemberExpression'][left.property.name=/^(status|approvalStatus|returnApprovalStatus)$/][right.type='Literal'][right.value=/^(active|approved|available|cancelled|canceled|checked_out|closed|completed|corrected|deleted|disposed|draft|failed|in_progress|inactive|in_use|lender_checked|lender_received|borrower_returned|non_conforming|open|overdue|pending|pending_approval|pending_disposal|quality_approved|rejected|rental|retired|return_approved|returned|reviewed|scheduled|spare|submitted|superseded|temporary)$/]",
        message:
          "Do not compare .status/.approvalStatus against a raw domain literal. Import the matching *StatusValues/*Values constant from '@equipment-management/schemas' (e.g. EquipmentStatusValues.AVAILABLE, CalibrationStatusValues.COMPLETED). For Promise.allSettled (r.status === 'fulfilled'|'rejected'), add: // eslint-disable-next-line no-restricted-syntax -- Promise.allSettled result status",
      },
      // SSOT 회귀 방지: domain status 하드코딩 문자열 리터럴 차단 (객체 할당 패턴)
      {
        selector:
          "Property[key.name=/^(status|approvalStatus|returnApprovalStatus)$/][value.type='Literal'][value.value=/^(active|approved|available|cancelled|canceled|checked_out|closed|completed|corrected|deleted|disposed|draft|failed|in_progress|inactive|in_use|lender_checked|lender_received|borrower_returned|non_conforming|open|overdue|pending|pending_approval|pending_disposal|quality_approved|rejected|rental|retired|return_approved|returned|reviewed|scheduled|spare|submitted|superseded|temporary)$/]",
        message:
          "Do not assign a raw domain literal to .status/.approvalStatus. Import the matching *StatusValues/*Values constant from '@equipment-management/schemas' (e.g. EquipmentStatusValues.AVAILABLE). For Drizzle insert/update objects, use the Values constant.",
      },
      // SSOT 회귀 방지: domain status 하드코딩 문자열 리터럴 차단 (함수 인자 패턴: eq/ne/gt/lt 등)
      {
        selector:
          "CallExpression[arguments.0.type='MemberExpression'][arguments.0.property.name=/^(status|approvalStatus|returnApprovalStatus)$/][arguments.1.type='Literal'][arguments.1.value=/^(active|approved|available|cancelled|canceled|checked_out|closed|completed|corrected|deleted|disposed|draft|failed|in_progress|inactive|in_use|lender_checked|lender_received|borrower_returned|non_conforming|open|overdue|pending|pending_approval|pending_disposal|quality_approved|rejected|rental|retired|return_approved|returned|reviewed|scheduled|spare|submitted|superseded|temporary)$/]",
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
          // Supply-Chain SSOT (verify-ssot Step 44): controller에서도 randomUUID member call 차단.
          {
            selector: "MemberExpression[property.name='randomUUID']",
            message:
              "Do not call .randomUUID() as member access. Use IdentifierService (DI) from '@/common/identifiers/identifier.service'. See verify-ssot Step 44 / docs/references/identifier-policy.md.",
          },
          // Computed property 우회 차단 (controller scope): review-architecture A3.
          {
            selector: "MemberExpression[computed=true][property.value='randomUUID']",
            message:
              'Do not use computed property access for randomUUID. Use IdentifierService (DI). See verify-ssot Step 44.',
          },
          // 동적 import 우회 차단 (controller scope).
          {
            selector: "CallExpression[callee.type='Import'][arguments.0.value='node:crypto']",
            message:
              "Dynamic import('node:crypto') is not allowed. Use IdentifierService (DI). See verify-ssot Step 44 / docs/references/identifier-policy.md.",
          },
          {
            selector: "CallExpression[callee.type='Import'][arguments.0.value='crypto']",
            message:
              "Dynamic import('crypto') is not allowed. Use IdentifierService (DI). See verify-ssot Step 44 / docs/references/identifier-policy.md.",
          },
          {
            selector:
              "BinaryExpression[operator=/^(===|!==)$/][left.type='MemberExpression'][left.property.name=/^(status|approvalStatus|returnApprovalStatus)$/][right.type='Literal'][right.value=/^(active|approved|available|cancelled|canceled|checked_out|closed|completed|corrected|deleted|disposed|draft|failed|in_progress|inactive|in_use|lender_checked|lender_received|borrower_returned|non_conforming|open|overdue|pending|pending_approval|pending_disposal|quality_approved|rejected|rental|retired|return_approved|returned|reviewed|scheduled|spare|submitted|superseded|temporary)$/]",
            message:
              "Do not compare .status/.approvalStatus against a raw domain literal. Import the matching *StatusValues/*Values constant from '@equipment-management/schemas'.",
          },
          {
            selector:
              "Property[key.name=/^(status|approvalStatus|returnApprovalStatus)$/][value.type='Literal'][value.value=/^(active|approved|available|cancelled|canceled|checked_out|closed|completed|corrected|deleted|disposed|draft|failed|in_progress|inactive|in_use|lender_checked|lender_received|borrower_returned|non_conforming|open|overdue|pending|pending_approval|pending_disposal|quality_approved|rejected|rental|retired|return_approved|returned|reviewed|scheduled|spare|submitted|superseded|temporary)$/]",
            message:
              "Do not assign a raw domain literal to .status/.approvalStatus. Import the matching *StatusValues/*Values constant from '@equipment-management/schemas'.",
          },
          {
            selector:
              "CallExpression[arguments.0.type='MemberExpression'][arguments.0.property.name=/^(status|approvalStatus|returnApprovalStatus)$/][arguments.1.type='Literal'][arguments.1.value=/^(active|approved|available|cancelled|canceled|checked_out|closed|completed|corrected|deleted|disposed|draft|failed|in_progress|inactive|in_use|lender_checked|lender_received|borrower_returned|non_conforming|open|overdue|pending|pending_approval|pending_disposal|quality_approved|rejected|rental|retired|return_approved|returned|reviewed|scheduled|spare|submitted|superseded|temporary)$/]",
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
    {
      // Supply-Chain SSOT (verify-ssot Step 44): identifier.service.ts는 SSOT 정의 파일.
      // randomUUID를 node:crypto에서 직접 import해야 하므로 본 파일만 룰 비활성화.
      // member call 사용처는 없으나 일관성을 위해 syntax 룰도 함께 off.
      files: ['src/common/identifiers/identifier.service.ts'],
      rules: {
        'no-restricted-imports': 'off',
        'no-restricted-syntax': 'off',
      },
    },
  ],
};
