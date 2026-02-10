'use client';

import { formatDate } from '@/lib/utils/date';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, XCircle, FileText, Download } from 'lucide-react';
import type { ApprovalItem } from '@/lib/api/approvals-api';
import { UNIFIED_APPROVAL_STATUS_LABELS } from '@/lib/api/approvals-api';
import { ApprovalStepIndicator } from './ApprovalStepIndicator';
import { ApprovalHistoryCard } from './ApprovalHistoryCard';
import { renderCategoryDetails, CategoryBadge } from './detail-renderers';

interface ApprovalDetailModalProps {
  item: ApprovalItem;
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  actionLabel: string;
}

// 상태별 스타일
const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-ul-orange text-white',
  pending_review: 'bg-ul-orange text-white',
  reviewed: 'bg-ul-blue text-white',
  approved: 'bg-ul-green text-white',
  rejected: 'bg-ul-red text-white',
};

export default function ApprovalDetailModal({
  item,
  isOpen,
  onClose,
  onApprove,
  onReject,
  actionLabel,
}: ApprovalDetailModalProps) {
  // 다단계 승인 여부 확인
  const isMultiStep =
    item.category === 'disposal_review' ||
    item.category === 'disposal_final' ||
    item.category === 'plan_review' ||
    item.category === 'plan_final';

  const statusStyle = STATUS_STYLES[item.status] || STATUS_STYLES.pending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>승인 요청 상세</DialogTitle>
          <DialogDescription>요청 내용을 확인하고 승인 또는 반려를 진행하세요.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-4">
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className={statusStyle}>
                  {UNIFIED_APPROVAL_STATUS_LABELS[item.status] || item.status}
                </Badge>
                <CategoryBadge category={item.category} />
                <h3 className="text-lg font-semibold">{item.summary}</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">요청자</p>
                  <p className="font-medium">{item.requesterName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">소속</p>
                  <p className="font-medium">{item.requesterTeam || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">요청일시</p>
                  <p className="font-medium">{formatDate(item.requestedAt, 'yyyy-MM-dd HH:mm')}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 다단계 승인 진행 상태 */}
            {isMultiStep && (
              <>
                <div>
                  <h4 className="text-sm font-semibold mb-3">승인 진행 상태</h4>
                  <ApprovalStepIndicator
                    type={
                      item.category === 'disposal_review' || item.category === 'disposal_final'
                        ? 'disposal'
                        : 'calibration_plan'
                    }
                    currentStatus={item.status}
                    history={item.approvalHistory}
                  />
                </div>
                <Separator />
              </>
            )}

            {/* 요청 상세 정보 */}
            <div>
              <h4 className="text-sm font-semibold mb-3">요청 상세</h4>
              <div className="bg-muted/50 rounded-lg p-4 divide-y">
                {renderCategoryDetails(item.category, item.details)}
              </div>
            </div>

            {/* 첨부 파일 */}
            {item.attachments && item.attachments.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-3">첨부 파일</h4>
                  <div className="space-y-2">
                    {item.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          <span className="text-sm">{attachment.filename}</span>
                          <span className="text-xs text-muted-foreground">
                            ({Math.round(attachment.size / 1024)}KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          aria-label={`${attachment.filename} 다운로드`}
                          onClick={() => window.open(attachment.url, '_blank')}
                        >
                          <Download className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* 승인 이력 */}
            {item.approvalHistory && item.approvalHistory.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-3">승인 이력</h4>
                  <ApprovalHistoryCard history={item.approvalHistory} />
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            닫기
          </Button>
          <Button
            type="button"
            onClick={onApprove}
            className="bg-ul-green hover:bg-ul-green-hover text-white"
          >
            <CheckCircle2 className="h-4 w-4 mr-1" aria-hidden="true" />
            {actionLabel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onReject}
            className="bg-ul-red hover:bg-ul-red-hover"
          >
            <XCircle className="h-4 w-4 mr-1" aria-hidden="true" />
            반려
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
