/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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