'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, XCircle, Eye, Calendar, User, Building2 } from 'lucide-react';
import { formatDate } from '@/lib/utils/date';
import type { ApprovalItem } from '@/lib/api/approvals-api';
import { UNIFIED_APPROVAL_STATUS_LABELS } from '@/lib/api/approvals-api';
import { ApprovalStepIndicator } from './ApprovalStepIndicator';

interface ApprovalItemCardProps {
  item: ApprovalItem;
  isSelected: boolean;
  onToggleSelect: () => void;
  onApprove: () => void;
  onReject: () => void;
  onViewDetail: () => void;
  actionLabel: string;
}

// 상태별 스타일 (SSOT: Tailwind config UL 브랜드 색상 사용)
const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-ul-orange text-white',
  pending_review: 'bg-ul-orange text-white',
  reviewed: 'bg-ul-blue text-white',
  approved: 'bg-ul-green text-white',
  rejected: 'bg-ul-red text-white',
};

// 상태별 왼쪽 보더 색상
const BORDER_COLORS: Record<string, string> = {
  pending: 'border-l-ul-orange',
  pending_review: 'border-l-ul-orange',
  reviewed: 'border-l-ul-blue',
  approved: 'border-l-ul-green',
  rejected: 'border-l-ul-red',
};

export function ApprovalItemCard({
  item,
  isSelected,
  onToggleSelect,
  onApprove,
  onReject,
  onViewDetail,
  actionLabel,
}: ApprovalItemCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onApprove();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = () => {
    onReject();
  };

  const statusStyle = STATUS_STYLES[item.status] || STATUS_STYLES.pending;
  const borderColor = BORDER_COLORS[item.status] || BORDER_COLORS.pending;

  // 다단계 승인 여부 확인
  const isMultiStep =
    item.category === 'disposal_review' ||
    item.category === 'disposal_final' ||
    item.category === 'plan_review' ||
    item.category === 'plan_final';

  return (
    <Card
      className={`border-l-4 ${borderColor} transition-all hover:shadow-md`}
      data-testid="approval-item"
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {/* 체크박스 */}
          <Checkbox
            id={`select-${item.id}`}
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            aria-label={`${item.summary} 선택`}
            className="mt-1"
          />

          {/* 내용 */}
          <div className="flex-1 space-y-3">
            {/* 상태 뱃지 및 요약 */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className={statusStyle}>
                {UNIFIED_APPROVAL_STATUS_LABELS[item.status] || item.status}
              </Badge>
              <span className="text-sm font-medium">{item.summary}</span>
            </div>

            {/* 요청 정보 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">요청자</p>
                  <p className="font-medium">{item.requesterName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2" data-testid="requester-team">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">팀</p>
                  <p className="font-medium">{item.requesterTeam || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">요청일시</p>
                  <p className="font-medium">{formatDate(item.requestedAt, 'yyyy-MM-dd HH:mm')}</p>
                </div>
              </div>
            </div>

            {/* 다단계 승인 진행 표시 */}
            {isMultiStep && (
              <ApprovalStepIndicator
                type={
                  item.category === 'disposal_review' || item.category === 'disposal_final'
                    ? 'disposal'
                    : 'calibration_plan'
                }
                currentStatus={item.status}
                history={item.approvalHistory}
              />
            )}

            {/* 승인 이력이 있는 경우 마지막 처리 정보 표시 */}
            {item.approvalHistory && item.approvalHistory.length > 0 && (
              <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm">
                <p className="text-muted-foreground">
                  최근 처리: {item.approvalHistory[item.approvalHistory.length - 1].actorName} (
                  {item.approvalHistory[item.approvalHistory.length - 1].actorRole})
                </p>
                {item.approvalHistory[item.approvalHistory.length - 1].comment && (
                  <p className="mt-1 italic">
                    &quot;{item.approvalHistory[item.approvalHistory.length - 1].comment}&quot;
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onViewDetail}
              aria-describedby={`item-${item.id}`}
            >
              <Eye className="h-4 w-4 mr-1" />
              상세
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApprove}
              disabled={isProcessing}
              className="bg-ul-green hover:bg-ul-green-hover text-white"
              aria-busy={isProcessing}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              {actionLabel}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing}
              className="bg-ul-red hover:bg-ul-red-hover"
            >
              <XCircle className="h-4 w-4 mr-1" />
              반려
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
