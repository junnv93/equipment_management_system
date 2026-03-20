/**
 * 보정계수 승인 관리 페이지 (Server Component)
 *
 * ✅ Next.js 16 Best Practice:
 * - Server Component 경계가 Turbopack의 코드 분할 포인트로 작용
 * - Client bundle 분리를 통해 컴파일 성능 개선
 */

import { Suspense } from 'react';
import { TablePageSkeleton } from '@/components/ui/list-page-skeleton';
import CalibrationFactorApprovalsContent from './CalibrationFactorApprovalsContent';

export default function CalibrationFactorApprovalsPage() {
  return (
    <Suspense fallback={<TablePageSkeleton />}>
      <CalibrationFactorApprovalsContent />
    </Suspense>
  );
}
