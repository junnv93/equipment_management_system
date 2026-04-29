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
 *
 * 허용 예외: `**\/lib/design-tokens/**` glob (아래 ignores 블록에서 일괄 exempt).
 * 즉 `DDAY_TONE_CLASSES` 정의가 들어 있는 `dday-tone.ts`처럼 CSS 클래스 리터럴이
 * 포함된 design-tokens 파일은 디렉토리 단위로 룰 적용 대상에서 제외된다.
 *
 * 주의: `dday-tone.ts`의 type union (`'overdue' | 'urgent' | ...`) 값 자체는
 * 본 selector(`(text|bg|border|ring)-...`)에 매칭되지 않으므로 룰의 직접 위반
 * 대상이 아니며, exempt가 필요한 것은 `DDAY_TONE_CLASSES`의 `text-overdue` 등
 * 클래스 리터럴이다.
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

/**
 * components/shared/ 도메인 네임스페이스 결합 차단.
 *
 * shared/ 컴포넌트는 cross-cutting namespace (common, navigation, notifications,
 * errors, auth)만 직접 호출 가능. 도메인 namespace (checkouts.*, equipment.* 등)는
 * props 주입 강제. 위반 시 컴포넌트가 단일 도메인에 결합돼 재사용성 훼손.
 *
 * 해결 패턴:
 *   // ❌ shared 컴포넌트 내부
 *   const t = useTranslations('checkouts.fsm');
 *   // ✅ props로 주입
 *   interface Props { labels: { action: string; hint: string } }
 *
 * 예외: 실제 cross-cutting namespace는 허용. 도메인 결합이 불가피한 경우
 *   `// eslint-disable-next-line no-restricted-syntax -- <사유>` 명시 후 팀 리뷰.
 */
const SHARED_COMPONENT_DOMAIN_NS_RULE = {
  selector:
    "CallExpression[callee.name='useTranslations'][arguments.0.type='Literal'][arguments.0.value=/^(?!(common|navigation|notifications|errors|auth)(\\.|$))/]",
  message:
    "components/shared/ is only allowed to use cross-cutting namespaces (common, navigation, notifications, errors, auth). Domain namespaces (checkouts.*, equipment.*, etc.) must be injected via props. See docs/references/frontend-patterns.md.",
};

/**
 * Nested interactive 회귀 차단: `<Link>` 안 `<Link>` 패턴 금지.
 *
 * 배경: React 19 + Next.js 16에서 `<a>` 안 `<a>`는 HTML Interactive Content Model
 * 위반으로 hydration error를 유발한다. `next/link`의 `Link`는 anchor를 렌더하므로
 * Link in Link도 동일 위반. SidebarItem + NavBadge에서 발생한 표면 회귀를 정적으로 차단.
 *
 * 해결 패턴: 행 컨테이너 + sibling anchor (`NavRowWithSecondaryAction`).
 * 상세: docs/references/frontend-patterns.md "Row with Secondary Action Pattern".
 *
 * 예외 정책: 정당한 polymorphic 컴포넌트 충돌(예: shadcn Slot가 Link로 변환되는 경우)이
 * 발생하면 `// eslint-disable-next-line no-restricted-syntax -- <사유>` 명시.
 */
const NESTED_LINK_RULE = {
  selector:
    "JSXElement[openingElement.name.name='Link'] JSXElement[openingElement.name.name='Link']",
  message:
    "Nested <Link> inside <Link> forbidden — invalid HTML (Interactive Content Model) and causes React hydration error. Use sibling anchors via NavRowWithSecondaryAction or split into independent rows. See docs/references/frontend-patterns.md 'Row with Secondary Action Pattern'.",
};

/**
 * Nested interactive 회귀 차단: `<a>` 안 `<a>` (raw HTML anchor 케이스).
 */
const NESTED_ANCHOR_RULE = {
  selector:
    "JSXElement[openingElement.name.name='a'] JSXElement[openingElement.name.name='a']",
  message:
    "Nested <a> inside <a> forbidden — invalid HTML and causes React hydration error. Use sibling anchors. See docs/references/frontend-patterns.md.",
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
      '**/*.stories.{ts,tsx}',
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
      // - NESTED_LINK_RULE / NESTED_ANCHOR_RULE: nested interactive 회귀 차단
      'no-restricted-syntax': [
        'error',
        STATUS_LITERAL_RULE,
        HEX_COLOR_RULE,
        DDAY_TONE_RULE,
        NESTED_LINK_RULE,
        NESTED_ANCHOR_RULE,
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
      // hex/dday 리터럴은 데이터 자체이므로 STATUS만 유지.
      // NESTED_*는 markup 패턴이므로 이 영역에도 동등 적용 (실 위반 위험은 거의 없음).
      'no-restricted-syntax': [
        'error',
        STATUS_LITERAL_RULE,
        NESTED_LINK_RULE,
        NESTED_ANCHOR_RULE,
      ],
    },
  },
  // brand-assets — 외부 SVG 자산 직접 노출 허용.
  // 이유: public/images/*.svg 같은 디자이너 공급 원본을 inline `<svg>` 변환 없이 사용. next/image의
  // 자동 최적화는 vector SVG에 무의미하고, className으로 사이즈 자유 조정이 필요해 일반 `<img>`가 적합.
  {
    files: ['**/lib/brand-assets/**/*.{ts,tsx}'],
    rules: {
      '@next/next/no-img-element': 'off',
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
        NESTED_LINK_RULE,
        NESTED_ANCHOR_RULE,
      ],
    },
  },
  // components/shared/ — 도메인 namespace 결합 추가 차단
  // 글로벌 룰(STATUS/HEX/DDAY/NESTED) + SHARED_COMPONENT_DOMAIN_NS_RULE 합성
  {
    files: ['**/components/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        STATUS_LITERAL_RULE,
        HEX_COLOR_RULE,
        DDAY_TONE_RULE,
        NESTED_LINK_RULE,
        NESTED_ANCHOR_RULE,
        SHARED_COMPONENT_DOMAIN_NS_RULE,
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
    ignores: ['**/lib/design-tokens/index.ts', '**/*.stories.{ts,tsx}'],
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
