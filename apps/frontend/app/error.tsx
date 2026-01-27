'use client';

/**
 * 전역 에러 페이지
 *
 * Next.js 16 Best Practice:
 * - 'use client' 필수 (에러 바운더리는 클라이언트 컴포넌트)
 * - error와 reset props 사용
 * - 사용자 친화적인 에러 메시지
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // 에러 로깅 (production에서는 에러 트래킹 서비스로 전송)
    console.error('Global error caught:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* 에러 아이콘 */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>

        {/* 에러 메시지 */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            문제가 발생했습니다
          </h1>
          <p className="text-muted-foreground">
            {error.message || '예기치 않은 오류가 발생했습니다.'}
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/60">
              오류 코드: {error.digest}
            </p>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset} variant="default" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              홈으로 이동
            </Link>
          </Button>
        </div>

        {/* 추가 도움말 */}
        <p className="text-sm text-muted-foreground">
          문제가 지속되면 시스템 관리자에게 문의하세요.
        </p>
      </div>
    </div>
  );
}
