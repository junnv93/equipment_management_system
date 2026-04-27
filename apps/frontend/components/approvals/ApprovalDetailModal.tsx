'use client';

import { useDateFormatter } from '@/hooks/use-date-formatter';
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
import { TAB_META } from '@/lib/api/approvals-api';
import { computeUrgency } from '@equipment-management/schemas';
import type { CheckoutStatus } from '@equipment-management/schemas';
import { getLocalizedSummary } from '@/lib/utils/approval-summary-utils';
import { ApprovalStepIndicator } from './ApprovalStepIndicator';
import { ApprovalHistoryCard } from './ApprovalHistoryCard';
import { CategoryDetails, CategoryBadge } from './detail-renderers';
import {
  getApprovalStatusBadgeClasses,
  getApprovalActionButtonClasses,
  getElapsedDaysClasses,
  APPROVAL_DETAIL_SECTION_TOKENS,
} from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';
import { useSiteLabels } from '@/lib/i18n/use-enum-labels';

interface ApprovalDetailModalProps {
  item: ApprovalItem;
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  actionLabel: string;
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-3">{title}</h4>
      {children}
    </div>
  );
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
  const siteLabels = useSiteLabels();
  const { fmtDateTime } = useDateFormatter();

  const meta = TAB_META[item.category];
  const isMultiStep = meta.totalApprovalSteps > 1;

  const elapsedDays = item.requestedAt
    ? Math.floor((Date.now() - new Date(item.requestedAt).getTime()) / 86_400_000)
    : 0;

  // checkout 카테고리에서만 긴급도 표시 — computeUrgency SSOT (schemas 패키지) 경유
  // 승인 대기 컨텍스트: status는 항상 pending/approved이므로 overdue 분기 비활성화
  const isCheckoutCategory = item.category === 'outgoing' || item.category === 'incoming';
  const urgency = (() => {
    if (!isCheckoutCategory) return null;
    const dueAt = item.details.expectedReturnDate;
    if (typeof dueAt !== 'string') return 'normal' as const;
    return computeUrgency({ status: 'pending' as CheckoutStatus, dueAt });
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] data-[state=open]:motion-safe:duration-300 data-[state=open]:motion-safe:ease-spring-pop">
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
                  {t(`unifiedStatus.${item.status}`)}
                </Badge>
                <CategoryBadge category={item.category} />
                <h3 className="text-lg font-semibold">
                  {getLocalizedSummary(item, t, siteLabels)}
                </h3>
              </div>

              {/* 메타 그리드: 요청자/부서/요청일 + 경과일/긴급도 */}
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
                  <p className="font-medium">{fmtDateTime(item.requestedAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('detail.elapsedDays')}</p>
                  <p className={`font-medium tabular-nums ${getElapsedDaysClasses(elapsedDays)}`}>
                    {t('detail.elapsedDaysValue', { days: elapsedDays })}
                  </p>
                </div>
                {urgency !== null && (
                  <div>
                    <p className="text-muted-foreground">{t('detail.urgencyLabel')}</p>
                    <p
                      className={`font-medium ${urgency === 'critical' ? 'text-brand-critical' : urgency === 'warning' ? 'text-brand-warning' : 'text-muted-foreground'}`}
                    >
                      {urgency === 'critical'
                        ? t('detail.urgencyCritical')
                        : urgency === 'warning'
                          ? t('detail.urgencyWarning')
                          : t('detail.urgencyNormal')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* 다단계 승인 진행 상태 — TAB_META SSOT (AR-3) */}
            {isMultiStep && (
              <>
                <DetailSection title={t('detail.approvalStatus')}>
                  <ApprovalStepIndicator
                    type={meta.multiStepType!}
                    currentStatus={item.status}
                    history={item.approvalHistory}
                  />
                </DetailSection>
                <Separator />
              </>
            )}

            {/* 요청 상세 정보 */}
            <DetailSection title={t('detail.requestDetail')}>
              <div className={APPROVAL_DETAIL_SECTION_TOKENS.sectionBody}>
                <CategoryDetails category={item.category} details={item.details} />
              </div>
            </DetailSection>

            {/* 첨부 파일 */}
            {item.attachments && item.attachments.length > 0 && (
              <>
                <Separator />
                <DetailSection title={t('detail.attachments')}>
                  <div className="space-y-2">
                    {item.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className={`flex items-center justify-between ${APPROVAL_DETAIL_SECTION_TOKENS.sectionBody}`}
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
                          aria-label={t('detail.downloadAttachment', {
                            filename: attachment.filename,
                          })}
                          onClick={() => window.open(attachment.url, '_blank')}
                        >
                          <Download className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </DetailSection>
              </>
            )}

            {/* 승인 이력 */}
            {item.approvalHistory && item.approvalHistory.length > 0 && (
              <>
                <Separator />
                <DetailSection title={t('detail.approvalHistory')}>
                  <ApprovalHistoryCard history={item.approvalHistory} />
                </DetailSection>
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
            variant="outline"
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
