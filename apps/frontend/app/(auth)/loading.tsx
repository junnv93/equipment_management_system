import { Skeleton } from '@/components/ui/skeleton';

/**
 * 인증 라우트 로딩 상태
 * - 라우트 전환 시 자동으로 표시됨 (Next.js Suspense 기반)
 * - 스플릿 레이아웃 유지하며 스켈레톤 UI 표시
 */
export default function AuthLoading() {
  return (
    <div className="flex min-h-screen w-full">
      {/* 좌측: 브랜딩 섹션 스켈레톤 (lg 이상에서만 표시) */}
      <div
        className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-ul-midnight"
        aria-hidden="true"
      >
        <div className="relative z-10 flex flex-col h-full p-10 lg:p-12">
          {/* 로고 영역 스켈레톤 */}
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-xl bg-white/10" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32 bg-white/10" />
              <Skeleton className="h-4 w-48 bg-white/10" />
            </div>
          </div>

          {/* 중앙 영역 스켈레톤 */}
          <div className="flex-1 flex flex-col justify-center py-12">
            <div className="space-y-4">
              <Skeleton className="h-10 w-64 bg-white/10" />
              <Skeleton className="h-10 w-48 bg-white/10" />
              <Skeleton className="h-6 w-80 bg-white/10 mt-4" />
            </div>

            {/* 기능 하이라이트 스켈레톤 */}
            <div className="mt-12 space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <Skeleton className="w-10 h-10 rounded-lg bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32 bg-white/10" />
                    <Skeleton className="h-4 w-48 bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 하단 스켈레톤 */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-40 bg-white/10" />
            <Skeleton className="h-3 w-64 bg-white/10" />
          </div>
        </div>
      </div>

      {/* 우측: 로그인 폼 섹션 스켈레톤 */}
      <div className="flex-1 lg:w-1/2 flex flex-col bg-white dark:bg-background">
        {/* 모바일 헤더 스켈레톤 (lg 미만에서만 표시) */}
        <div className="lg:hidden flex items-center gap-3 p-6 border-b border-border bg-ul-midnight">
          <Skeleton className="w-10 h-10 rounded-lg bg-white/10" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-28 bg-white/10" />
            <Skeleton className="h-3 w-40 bg-white/10" />
          </div>
        </div>

        {/* 로그인 폼 컨테이너 스켈레톤 */}
        <div
          className="flex-1 flex items-center justify-center p-6 lg:p-12"
          role="main"
          aria-busy="true"
          aria-label="로그인 페이지 로딩 중"
        >
          <div className="w-full max-w-md">
            {/* 카드 스켈레톤 */}
            <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
              {/* 헤더 스켈레톤 */}
              <div className="text-center mb-8 space-y-3">
                <Skeleton className="h-8 w-40 mx-auto" />
                <Skeleton className="h-4 w-48 mx-auto" />
              </div>

              {/* 폼 스켈레톤 */}
              <div className="space-y-5">
                {/* 이메일 필드 */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-12 w-full rounded-md" />
                </div>

                {/* 비밀번호 필드 */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-12 w-full rounded-md" />
                </div>

                {/* 로그인 버튼 */}
                <Skeleton className="h-12 w-full rounded-md" />
              </div>
            </div>

            {/* 하단 텍스트 스켈레톤 */}
            <div className="flex justify-center mt-6">
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
