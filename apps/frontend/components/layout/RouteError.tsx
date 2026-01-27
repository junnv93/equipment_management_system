'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
}

/**
 * 라우트별 에러 컴포넌트 (error.tsx에서 사용)
 *
 * Next.js 16 Best Practice:
 * - 'use client' 필수 (error.tsx는 Client Component)
 * - error, reset props 필수
 * - 사용자 친화적 에러 메시지
 */
export function RouteError({
  error,
  reset,
  title = '오류가 발생했습니다',
  description = '페이지를 불러오는 중 문제가 발생했습니다.',
}: RouteErrorProps) {
  useEffect(() => {
    // 에러 로깅 (프로덕션에서는 에러 추적 서비스로 전송)
    console.error('[RouteError]', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-md bg-muted p-3 text-xs font-mono text-muted-foreground overflow-auto max-h-32">
              {error.message}
              {error.digest && <div className="mt-1 text-xs opacity-50">Digest: {error.digest}</div>}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={reset} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              다시 시도
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                홈으로
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
