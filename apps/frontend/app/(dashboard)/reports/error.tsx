'use client';

import { RouteError } from '@/components/layout/RouteError';

export default function ReportsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      error={error}
      reset={reset}
      title="보고서 오류"
      description="보고서를 불러오는 중 문제가 발생했습니다."
    />
  );
}
