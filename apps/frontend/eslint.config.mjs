import { dirname } from 'path';
import { fileURLToPath } from 'url';
import nextPlugin from '@next/eslint-plugin-next';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * SSOT 회귀 방지: obj.status 도메인 리터럴 직접 비교 금지
 * 허용 예외: Promise.allSettled r.status === 'rejected'|'fulfilled', 로컬 UI 타입
 *           → eslint-disable-next-line no-restricted-syntax -- <사유> 로 명시
 */
const STATUS_LITERAL_RULE = {
  selector:
    "BinaryExpression[operator=/^(===|!==)$/][left.type='MemberExpression'][left.property.name='status'][right.type='Literal'][right.value=/^(active|approved|canceled|closed|completed|deleted|disposed|draft|inactive|maintenance|open|overdue|pending|quality_approved|rejected|rental|returned|submitted|superseded|temporary)$/]",
  message:
    "Do not compare .status against a raw domain literal. Use the matching *StatusValues constant from '@equipment-management/schemas' (e.g. EquipmentStatusValues.TEMPORARY, NonConformanceStatusValues.OPEN). For Promise.allSettled or local UI state types, add: // eslint-disable-next-line no-restricted-syntax -- <reason>",
};

/**
 * 디자인 토큰 SSOT 강제: hex 컬러 리터럴 직접 사용 금지.
 * 허용 예외: design-tokens 정의, app/globals.css, API 메타데이터(팀 색상),
 *           Canvas/PDF 워커(raw fillStyle).
 */
const HEX_COLOR_RULE = {
  selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
  message:
    "Hardcoded hex color forbidden. Use design tokens from '@/lib/design-tokens' or CSS variables in app/globals.css.",
};

/**
 * D-day tone 클래스 SSOT 강제: raw `text-overdue|urgent|soon|normal` 등 직접 사용 금지.
 * 허용 예외: design-tokens/components/dday-tone.ts (정의 자체).
 */
const DDAY_TONE_RULE = {
  selector:
    "Literal[value=/(text|bg|border|ring)-(overdue|urgent|soon|normal)\\b/]",
  message:
    "Direct dday tone class forbidden. Use DDAY_TONE_CLASSES / resolveDdayTone from '@/lib/design-tokens'.",
};

/**
 * 대시보드 i18n 강제: components/dashboard/** JSX text node에 한글 직접 작성 금지.
 * 사용 예외 없음 — 모든 사용자 가시 텍스트는 useTranslations() 경유.
 */
const DASHBOARD_KO_JSX_RULE = {
  selector: "JSXText[value=/[\\uAC00-\\uD7A3]/]",
  message:
    "Korean literal in dashboard JSX forbidden. Use useTranslations() with key under messages/{ko,en}/dashboard.json.",
};

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
      // SSOT 회귀 방지 — 룰 정의는 파일 상단 const 참조 (DRY).
      // - STATUS_LITERAL_RULE: obj.status 도메인 리터럴 비교 금지
      // - HEX_COLOR_RULE: hex 컬러 직접 사용 금지 (design tokens 강제)
      // - DDAY_TONE_RULE: raw dday tone 클래스 금지
      'no-restricted-syntax': [
        'error',
        STATUS_LITERAL_RULE,
        HEX_COLOR_RULE,
        DDAY_TONE_RULE,
      ],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  // 글로벌 룰 예외: 디자인 토큰 정의 / 외부 브랜드 자산 / API 메타데이터 /
  // Canvas-PDF 워커는 hex/dday tone 리터럴이 데이터 자체이므로 룰을 status-only로 재정의한다.
  //
  // 패턴 주의: lint-staged는 root cwd에서 절대 경로 인자로 실행 →
  // `lib/design-tokens/**` 같은 상대 패턴은 cwd=root일 때 매칭 실패.
  // `**/lib/design-tokens/**` globstar 패턴은 cwd=root / cwd=apps/frontend 양쪽 호환.
  {
    files: [
      '**/lib/design-tokens/**/*.{ts,tsx}',
      '**/lib/brand-assets/**/*.{ts,tsx}',
      '**/lib/api/teams-api.ts',
      '**/lib/api/sites-api.ts',
      '**/lib/qr/**/*.ts',
      '**/*.worker.ts',
    ],
    rules: {
      'no-restricted-syntax': ['error', STATUS_LITERAL_RULE],
    },
  },
  // 대시보드 컴포넌트 — 글로벌 룰 + 한글 JSXText 금지 (i18n 강제)
  {
    files: ['**/components/dashboard/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        STATUS_LITERAL_RULE,
        HEX_COLOR_RULE,
        DDAY_TONE_RULE,
        DASHBOARD_KO_JSX_RULE,
      ],
    },
  },
  // 테스트 파일 — Playwright/Vitest 진행 로그 console 허용
  {
    files: ['**/tests/**/*.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/*.test.{ts,tsx}'],
    rules: {
      'no-console': 'off',
    },
  },
  // @deprecated 토큰 회귀 방지 가드 (typed linting — 점진 확장)
  // 스코프 1: design-tokens 내부 — 토큰 간 상호 deprecated 참조 방지
  // 스코프 2: checkout 컴포넌트/페이지 — deprecated checkout 토큰 소비처 방지
  // index.ts 제외: 배럴 파일은 하위호환 유지를 위해 의도적으로 deprecated 심볼을 re-export
  // globstar 패턴: lint-staged root cwd + 일반 lint apps/frontend cwd 양쪽 호환 (F1 동일 정책).
  {
    files: [
      '**/lib/design-tokens/**/*.ts',
      '**/components/checkouts/**/*.{ts,tsx}',
      '**/app/(dashboard)/checkouts/**/*.{ts,tsx}',
    ],
    ignores: ['**/lib/design-tokens/index.ts'],
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
