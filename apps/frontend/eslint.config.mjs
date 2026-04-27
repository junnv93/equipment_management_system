import { dirname } from 'path';
import { fileURLToPath } from 'url';
import nextPlugin from '@next/eslint-plugin-next';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('eslint').Linter.FlatConfig[]} */
const eslintConfig = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'public/**',
      '*.config.js',
      '*.config.mjs',
      'tests/e2e/**',
      '*.setup.js',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      '@next/next': nextPlugin,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      // TypeScript rules - error로 강화하여 컴파일 타임에 강제
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',

      // React rules - error로 강화하여 런타임 버그 방지
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',

      // Next.js rules
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-img-element': 'warn',

      // SSOT 회귀 방지: 잘못된 import 경로 차단 (error로 강화)
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
      // SSOT 회귀 방지: obj.status 도메인 리터럴 직접 비교 금지
      // 허용 예외: Promise.allSettled r.status === 'rejected'|'fulfilled', 로컬 UI 타입
      //           → eslint-disable-next-line no-restricted-syntax -- <사유> 로 명시
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "BinaryExpression[operator=/^(===|!==)$/][left.type='MemberExpression'][left.property.name='status'][right.type='Literal'][right.value=/^(active|approved|canceled|closed|completed|deleted|disposed|draft|inactive|maintenance|open|overdue|pending|quality_approved|rejected|rental|returned|submitted|superseded|temporary)$/]",
          message:
            "Do not compare .status against a raw domain literal. Use the matching *StatusValues constant from '@equipment-management/schemas' (e.g. EquipmentStatusValues.TEMPORARY, NonConformanceStatusValues.OPEN). For Promise.allSettled or local UI state types, add: // eslint-disable-next-line no-restricted-syntax -- <reason>",
        },
      ],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  // @deprecated 토큰 회귀 방지 가드 (typed linting — 점진 확장)
  // 스코프 1: design-tokens 내부 — 토큰 간 상호 deprecated 참조 방지
  // 스코프 2: checkout 컴포넌트/페이지 — deprecated checkout 토큰 소비처 방지
  // index.ts 제외: 배럴 파일은 하위호환 유지를 위해 의도적으로 deprecated 심볼을 re-export
  {
    files: [
      'lib/design-tokens/**/*.ts',
      'components/checkouts/**/*.{ts,tsx}',
      'app/(dashboard)/checkouts/**/*.{ts,tsx}',
    ],
    ignores: ['lib/design-tokens/index.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      '@typescript-eslint/no-deprecated': 'error',
    },
  },
];

export default eslintConfig;
