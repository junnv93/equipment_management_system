const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 주석: Turbopack은 Next.js 16.1에서 아직 실험적 기능입니다.
  // production build는 기본적으로 안정적인 Webpack을 사용합니다.
  // 개발 모드에서는 `pnpm dev`로 Turbopack을 활성화할 수 있습니다.

  // Monorepo 루트 경로 명시 (경고 제거)
  turbopack: {
    root: path.resolve(__dirname, '../..'),
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

module.exports = nextConfig;
