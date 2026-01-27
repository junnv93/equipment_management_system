'use client';

import { RouteError } from '@/components/layout/RouteError';

export default function AdminError({
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
      title="관리자 페이지 오류"
      description="관리자 페이지를 불러오는 중 문제가 발생했습니다."
    />
  );
}
