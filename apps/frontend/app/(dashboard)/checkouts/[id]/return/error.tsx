'use client';

import { RouteError } from '@/components/layout/RouteError';

export default function CheckoutReturnError({
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
      title="반입 처리 오류"
      description="장비 반입 처리 페이지를 불러올 수 없습니다. 다시 시도해주세요."
    />
  );
}
