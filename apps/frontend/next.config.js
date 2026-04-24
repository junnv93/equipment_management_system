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
    return {
      // beforeFiles: Next.js 파일 라우팅 전에 실행
      // afterFiles: Next.js 파일 라우팅 후, 동적 라우트 전에 실행
      // fallback: Next.js 파일 라우팅과 동적 라우트 후에 실행 (404 전)
      fallback: [
        {
          // NextAuth 경로를 제외한 나머지 API만 백엔드로 프록시
          source: '/api/:path((?!auth).*)',
          destination: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/:path*',
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
