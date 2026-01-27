'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

/**
 * 팀 관리 페이지 에러 핸들러
 *
 * Next.js 16 패턴: error.tsx는 'use client' 필수
 * 라우트 레벨에서 발생하는 에러를 캐치하여 사용자 친화적인 UI 표시
 */
export default function TeamsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러 로깅 (실제 환경에서는 에러 모니터링 서비스로 전송)
    console.error('[TeamsError]', error);
  }, [error]);

  return (
    <div className="container mx-auto py-6">
      <div
        role="alert"
        aria-live="assertive"
        className="flex flex-col items-center justify-center min-h-[400px] text-center"
      >
        <div className="bg-red-50 dark:bg-red-950/20 rounded-full p-4 mb-4">
          <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          팀 정보를 불러올 수 없습니다
        </h1>

        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
          {error.message || '서버와 통신 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'}
        </p>

        {error.digest && (
          <p className="text-xs text-gray-500 mb-4 font-mono">
            에러 코드: {error.digest}
          </p>
        )}

        <div className="flex gap-3">
          <Button onClick={reset} variant="default" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </Button>

          <Button variant="outline" asChild className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              홈으로
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
