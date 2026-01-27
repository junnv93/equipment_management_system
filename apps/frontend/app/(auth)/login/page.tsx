import type { Metadata } from 'next';
import { BrandingSection } from '@/components/auth/BrandingSection';
import { LoginPageContent } from '@/components/auth/LoginPageContent';

/**
 * 로그인 페이지 메타데이터
 * - SEO 최적화: 검색 엔진 인덱싱 방지
 */
export const metadata: Metadata = {
  title: '로그인 - 장비 관리 시스템',
  description: '장비 관리 시스템에 로그인하여 장비 등록, 교정 관리, 대여/반출 기능을 이용하세요.',
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * 로그인 페이지 (Server Component)
 *
 * Next.js 16 패턴:
 * - Server Component로 메타데이터 생성 (SEO)
 * - BrandingSection: Server Component (정적 콘텐츠)
 * - LoginPageContent: Client Component (상호작용)
 *
 * 성능 최적화:
 * - 정적 콘텐츠는 서버에서 렌더링하여 번들 크기 최소화
 * - 상호작용 필요한 부분만 클라이언트로 분리
 */
export default function LoginPage() {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="flex min-h-screen w-full">
      {/* 좌측: 브랜딩 섹션 (Server Component - lg 이상에서만 표시) */}
      <BrandingSection />

      {/* 우측: 로그인 폼 섹션 (Client Component) */}
      <LoginPageContent showDevAccounts={isDevelopment} />
    </div>
  );
}
