'use client';

import { RouteError } from '@/components/layout/RouteError';

export default function CheckoutsError({
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
      title="반출/반입 관리 오류"
      description="반출/반입 정보를 불러오는 중 문제가 발생했습니다."
    />
  );
}
