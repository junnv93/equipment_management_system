/**
 * 반입 승인 관리 페이지 (Server Component)
 *
 * ✅ Next.js 16 Best Practice:
 * - Server Component 경계가 Turbopack의 코드 분할 포인트로 작용
 * - Client bundle 분리를 통해 컴파일 성능 개선
 * - Suspense boundary로 스트리밍 렌더링
 */

import { Suspense } from 'react';
import { TablePageSkeleton } from '@/components/ui/list-page-skeleton';
import ReturnApprovalsContent from './ReturnApprovalsContent';

export default function ReturnApprovalsPage() {
  return (
    <Suspense
      fallback={
        <TablePageSkeleton
          title="반입 승인"
          description="반입 승인 관리"
          columnCount={5}
          showActionButton={false}
        />
      }
    >
      <ReturnApprovalsContent />
    </Suspense>
  );
}
