'use client';

import { RouteError } from '@/components/layout/RouteError';

export default function CheckoutCheckError({
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
      title="상태 확인 오류"
      description="대여 장비 상태 확인 페이지를 불러올 수 없습니다. 다시 시도해주세요."
    />
  );
}
