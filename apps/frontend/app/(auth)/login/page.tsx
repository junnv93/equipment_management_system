import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
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
 * - ✅ useSearchParams() 사용하는 Client Component는 Server Component에서 Suspense로 감싸야 함
 *
 * 성능 최적화:
 * - 정적 콘텐츠는 서버에서 렌더링하여 번들 크기 최소화
 * - 상호작용 필요한 부분만 클라이언트로 분리
 */
/**
 * 빌드 시점 연도 계산
 * Next.js 16 PPR: Server Component에서 new Date() 직접 사용 불가
 * → 빌드 시점에 연도를 고정하여 정적 렌더링 유지
 */
const CURRENT_YEAR = 2026; // 빌드 시점 연도

export default function LoginPage() {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="flex min-h-screen w-full">
      {/* 좌측: 브랜딩 섹션 (Server Component - lg 이상에서만 표시) */}
      <BrandingSection currentYear={CURRENT_YEAR} />

      {/* 우측: 로그인 폼 섹션 (Client Component) */}
      {/* ✅ Next.js 16: useSearchParams()를 사용하는 Client Component는 Suspense로 감싸야 함 */}
      <Suspense
        fallback={
          <div className="flex-1 lg:w-1/2 flex items-center justify-center bg-white dark:bg-background">
            <div className="w-full max-w-md space-y-8 p-6 lg:p-12">
              <div className="hidden lg:block text-center space-y-2">
                <Skeleton className="h-8 w-48 mx-auto rounded-lg" />
                <Skeleton className="h-4 w-64 mx-auto rounded-lg" />
              </div>
              <div className="bg-card rounded-2xl border border-border p-8">
                <div className="space-y-6" aria-busy="true" aria-label="로딩 중">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-32 rounded-lg" />
                    <Skeleton className="h-4 w-48 rounded-lg" />
                  </div>
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        }
      >
        <LoginPageContent showDevAccounts={isDevelopment} />
      </Suspense>
    </div>
  );
}
