const path = require('path');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

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
    const isProduction = process.env.NODE_ENV === 'production';

    // CSP 2-tier 전략:
    //   - Edge(Nginx)가 SSOT. prod 배포 경로는 Nginx가 proxy_hide_header로 이 헤더를 덮어씀.
    //   - Next.js dev(`pnpm dev`, Nginx 미경유) 환경에서는 이 헤더가 최종값.
    //   - 개발 HMR은 eval/인라인 필요 → isProduction 분기로 허용 범위 차별화.
    //   - camera=(self)는 QR 스캐너(html5-qrcode getUserMedia) 전제조건.
    const cspDirectives = [
      "default-src 'self'",
      isProduction
        ? "script-src 'self' 'unsafe-inline'"
        : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "media-src 'self' blob: mediastream:",
      isProduction ? "connect-src 'self'" : "connect-src 'self' ws: wss: http://localhost:*",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ];
    if (isProduction) cspDirectives.push('upgrade-insecure-requests');

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Content-Security-Policy', value: cspDirectives.join('; ') },
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

module.exports = withBundleAnalyzer(withNextIntl(nextConfig));
