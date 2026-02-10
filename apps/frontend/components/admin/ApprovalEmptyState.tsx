import { Clock } from 'lucide-react';

interface ApprovalEmptyStateProps {
  message?: string;
}

/**
 * 승인 페이지 공통 빈 상태 표시
 */
export function ApprovalEmptyState({
  message = '승인 대기 중인 요청이 없습니다',
}: ApprovalEmptyStateProps) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>{message}</p>
    </div>
  );
}
