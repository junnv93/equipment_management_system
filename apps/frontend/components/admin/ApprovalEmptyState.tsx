'use client';

import { useTranslations } from 'next-intl';
import { Clock } from 'lucide-react';

interface ApprovalEmptyStateProps {
  message?: string;
}

/**
 * 승인 페이지 공통 빈 상태 표시
 */
export function ApprovalEmptyState({ message }: ApprovalEmptyStateProps) {
  const t = useTranslations('approvals');
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>{message ?? t('empty.noPending')}</p>
    </div>
  );
}
