'use client';

import { RouteError } from '@/components/layout/RouteError';

export default function AlertsError({
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
      title="알림 센터 오류"
      description="알림 정보를 불러오는 중 문제가 발생했습니다."
    />
  );
}
