const path = require('path');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Monorepo workspace 패키지를 소스에서 직접 트랜스파일
  // dist/ 빌드 없이 소스 변경 즉시 반영 (HMR 지원)
  transpilePackages: ['@equipment-management/shared-constants', '@equipment-management/schemas'],

  // Monorepo 루트 경로 명시 (경고 제거)
  turbopack: {
    root: path.resolve(__dirname, '../..'),
  },

  // ✅ 대형 패키지 import 최적화 (Barrel Import 자동 변환)
  //
  // Barrel import(index.ts re-export)는 패키지 전체를 파싱하므로
  // cold 컴파일 당 200-800ms의 추가 비용이 발생합니다.
  // optimizePackageImports는 빌드 타임에 직접 import로 자동 변환합니다.
  //
  // 📖 https://vercel.com/blog/how-we-optimized-package-imports-in-next-js
  //
  // ⚠️ 새 대형 패키지 추가 시 반드시 여기에도 등록하세요.
  //    단일 export만 있는 패키지(예: @radix-ui/react-slot)는 제외합니다.
  optimizePackageImports: [
    // ── 아이콘/유틸리티 ──
    'lucide-react', // 37MB, 3496 아이콘
    'date-fns',
    'lodash',
    'react-icons',
    // ── 데이터 ──
    '@tanstack/react-query',
    // ── 차트 ──
    'recharts',
    // ── 폼 ──
    'react-hook-form',
    '@hookform/resolvers',
    'react-day-picker',
    // ── Radix UI ──
    '@radix-ui/react-alert-dialog',
    '@radix-ui/react-avatar',
    '@radix-ui/react-checkbox',
    '@radix-ui/react-collapsible',
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-label',
    '@radix-ui/react-popover',
    '@radix-ui/react-progress',
    '@radix-ui/react-radio-group',
    '@radix-ui/react-select',
    '@radix-ui/react-separator',
    '@radix-ui/react-switch',
    '@radix-ui/react-tabs',
    '@radix-ui/react-toast',
    '@radix-ui/react-tooltip',
  ],

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

module.exports = withBundleAnalyzer(nextConfig);
