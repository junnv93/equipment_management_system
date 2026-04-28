const path = require('path');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  // ANALYZE_MODE=json → .next/analyze/client.json 생성 (measure-bundle.mjs 전용)
  // ANALYZE_MODE=static (기본) → HTML 뷰어 생성 (수동 분석용)
  analyzerMode: process.env.ANALYZE_MODE ?? 'static',
  // ANALYZE_OPEN=false → 브라우저 자동 열기 비활성 (CI/스크립트 환경)
  openAnalyzer: process.env.ANALYZE_OPEN !== 'false',
});
const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
const withSerwist = require('@serwist/next').default;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',

  // ✅ Cache Components (Next.js 16 — experimental.ppr 후속)
  //
  // Suspense 경계가 있는 라우트에 Partial Prerendering 적용:
  // - 정적 셸(Suspense fallback)은 빌드 시 프리렌더 → CDN 즉시 제공 (FCP < 200ms)
  // - 동적 홀(Suspense children)은 요청 시 서버에서 스트리밍
  //
  // revalidate(ISR)와 독립적 — ISR 페이지에는 Suspense 경계 없으므로 PPR 미적용
  // 롤백: false로 변경하면 기존 SSR로 복귀
  cacheComponents: true,

  // Monorepo workspace 패키지를 소스에서 직접 트랜스파일
  // dist/ 빌드 없이 소스 변경 즉시 반영 (HMR 지원)
  transpilePackages: ['@equipment-management/shared-constants', '@equipment-management/schemas'],

  // Monorepo 루트 경로 명시 (경고 제거)
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },

  // ✅ 대형 패키지 import 최적화는 Turbopack(Next.js 16)이 자동 처리
  // optimizePackageImports 수동 설정 불필요 — 제거됨

  async headers() {
    // CSP SSOT — `proxy.ts`가 per-request nonce 기반 CSP를 주입.
    // next.config.js는 nonce를 생성할 수 없으므로(빌드 타임에 resolve됨) CSP 여기 선언 금지.
    // 나머지 정적 보안 헤더만 여기서 선언.
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          // camera=(self): html5-qrcode getUserMedia 전제조건.
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ];
  },

  async rewrites() {
    // ─────────────────────────────────────────────────────────────────────────
    // Same-Origin Reverse-Proxy (ADR-0006)
    //
    // dev에서 frontend(:3000)가 받은 `/api/*` 요청을 backend(:3001)로 프록시한다.
    // production은 nginx가 동일 분기를 처리하므로 본 rewrites는 dev/standalone build에서만 유효.
    //
    // 분기 규칙:
    //   - `/api/auth/(csrf|session|providers|signin|signout|callback|error|verify-request)`
    //     → frontend NextAuth route handler(`app/api/auth/[...nextauth]/route.ts`)가 처리
    //   - 그 외 `/api/*` (backend auth 경로 `/api/auth/login`, `/refresh`, `/logout`,
    //     `/profile`, `/test-login` 등 포함) → backend로 forward
    //
    // ⚠️ SSOT 동기화 의무: 아래 NEXTAUTH_HANDLER_REGEX_GROUP은
    //   `packages/shared-constants/src/api-routing.ts`의 `NEXTAUTH_HANDLER_PATHS`와
    //   동일해야 한다. verify-routing-origin 스킬이 두 파일을 grep으로 검증한다.
    //
    // ⚠️ path-to-regexp(Next.js 16) 제약:
    //   capturing group은 source에서 금지 → 반드시 non-capturing group `(?:...)` 사용.
    //   이 제약을 어기면 dev 부팅 시 `Capturing groups are not allowed` 에러로 즉시 실패.
    // ─────────────────────────────────────────────────────────────────────────
    const NEXTAUTH_HANDLER_REGEX_GROUP =
      '(?:csrf|session|providers|signin|signout|callback|error|verify-request)';

    // server-side에서 backend를 직접 호출 — NEXT_PUBLIC_API_URL은 client용이므로 사용 금지
    const internalBackendUrl = process.env.INTERNAL_BACKEND_URL || 'http://localhost:3001';

    return {
      // beforeFiles: Next.js 파일 라우팅 전에 실행
      // afterFiles: Next.js 파일 라우팅 후, 동적 라우트 전에 실행
      // fallback: Next.js 파일 라우팅과 동적 라우트 후에 실행 (404 전)
      fallback: [
        {
          // path-to-regexp lookahead로 NextAuth 핸들러 경로만 제외하고 fallback에서 처리.
          // path 변수는 capture한 segment 전체 (예: `equipment`, `auth/login`).
          source: `/api/:path((?!auth/${NEXTAUTH_HANDLER_REGEX_GROUP}).*)`,
          // destination에 `/api` prefix 보존 — backend는 setGlobalPrefix('api') 사용
          destination: `${internalBackendUrl}/api/:path*`,
        },
      ],
    };
  },
};

module.exports = withSerwist({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  // 개발 환경에서는 서비스워커 비활성 — HMR 캐싱 충돌 방지
  disable: process.env.NODE_ENV === 'development',
})(withBundleAnalyzer(withNextIntl(nextConfig)));
