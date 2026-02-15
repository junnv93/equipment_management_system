'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { createErrorBoundaryReporter } from '@/lib/error-reporter';

const reportError = createErrorBoundaryReporter('equipment');

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function EquipmentError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Report error to monitoring service
    reportError(error, error.digest);
  }, [error]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-8 w-8" />
          <h1 className="text-2xl font-bold">장비 목록을 불러올 수 없습니다</h1>
        </div>

        <p className="text-muted-foreground text-center max-w-md">
          일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 p-4 border rounded-lg bg-muted max-w-2xl">
            <summary className="cursor-pointer font-semibold mb-2">
              개발자 정보 (프로덕션에서 숨겨짐)
            </summary>
            <pre className="text-xs overflow-auto">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
              {error.digest && `\n\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}

        <div className="flex gap-2 mt-4">
          <Button onClick={reset}>다시 시도</Button>
          <Button variant="outline" onClick={() => (window.location.href = '/dashboard')}>
            대시보드로 이동
          </Button>
        </div>
      </div>
    </div>
  );
}
