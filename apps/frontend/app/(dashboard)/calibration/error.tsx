'use client';

import { RouteError } from '@/components/layout/RouteError';

export default function CalibrationError({
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
      title="교정 관리 오류"
      description="교정 정보를 불러오는 중 문제가 발생했습니다."
    />
  );
}
