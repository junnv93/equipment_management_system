'use client';

import { RouteError } from '@/components/layout/RouteError';

export default function ApprovalsError({
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
      title="승인 관리 페이지 오류"
      description="승인 목록을 불러오는 중 문제가 발생했습니다."
    />
  );
}
