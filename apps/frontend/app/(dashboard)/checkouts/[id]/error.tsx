'use client';

import { RouteError } from '@/components/layout/RouteError';

export default function CheckoutDetailError({
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
      title="반출 상세 오류"
      description="반출 상세 정보를 불러올 수 없습니다. 네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요."
    />
  );
}
