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
import { CategoryDetails, CategoryBadge } from './detail-renderers';
import { getApprovalStatusBadgeClasses, getApprovalActionButtonClasses } from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';

interface ApprovalDetailModalProps {
  item: ApprovalItem;
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  actionLabel: string;
}

export default function ApprovalDetailModal({
  item,
  isOpen,
  onClose,
  onApprove,
  onReject,
  actionLabel,
}: ApprovalDetailModalProps) {
  const t = useTranslations('approvals');

  // 다단계 승인 여부 확인
  const isMultiStep =
    item.category === 'disposal_review' ||
    item.category === 'disposal_final' ||
    item.category === 'plan_review' ||
    item.category === 'plan_final';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{t('detail.title')}</DialogTitle>
          <DialogDescription>{t('detail.description')}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-4">
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className={getApprovalStatusBadgeClasses(item.status)}>
                  {UNIFIED_APPROVAL_STATUS_LABELS[item.status] || item.status}
                </Badge>
                <CategoryBadge category={item.category} />
                <h3 className="text-lg font-semibold">{item.summary}</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('detail.requester')}</p>
                  <p className="font-medium">{item.requesterName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('detail.department')}</p>
                  <p className="font-medium">{item.requesterTeam || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('detail.requestDate')}</p>
                  <p className="font-medium">{formatDate(item.requestedAt, 'yyyy-MM-dd HH:mm')}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* 다단계 승인 진행 상태 */}
            {isMultiStep && (
              <>
                <div>
                  <h4 className="text-sm font-semibold mb-3">{t('detail.approvalStatus')}</h4>
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
              <h4 className="text-sm font-semibold mb-3">{t('detail.requestDetail')}</h4>
              <div className="bg-muted/50 rounded-lg p-4 divide-y">
                <CategoryDetails category={item.category} details={item.details} />
              </div>
            </div>

            {/* 첨부 파일 */}
            {item.attachments && item.attachments.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-3">{t('detail.attachments')}</h4>
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
                          aria-label={`${attachment.filename} download`}
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
                  <h4 className="text-sm font-semibold mb-3">{t('detail.approvalHistory')}</h4>
                  <ApprovalHistoryCard history={item.approvalHistory} />
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('detail.close')}
          </Button>
          <Button
            type="button"
            onClick={onApprove}
            className={getApprovalActionButtonClasses('approve')}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" aria-hidden="true" />
            {actionLabel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onReject}
            className={getApprovalActionButtonClasses('reject')}
          >
            <XCircle className="h-4 w-4 mr-1" aria-hidden="true" />
            {t('detail.reject')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
