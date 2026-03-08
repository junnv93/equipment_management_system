'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, XCircle, Eye, Calendar, User, Building2, Clock } from 'lucide-react';
import { formatDate, daysBetween } from '@/lib/utils/date';
import type { ApprovalItem } from '@/lib/api/approvals-api';
import { UNIFIED_APPROVAL_STATUS_LABELS } from '@/lib/api/approvals-api';
import { ApprovalStepIndicator } from './ApprovalStepIndicator';
import {
  getApprovalStatusBadgeClasses,
  getApprovalCardBorderClasses,
  getApprovalActionButtonClasses,
  getElapsedDaysClasses,
  APPROVAL_MOTION,
  APPROVAL_INFO_GRID_TOKENS,
  APPROVAL_FOCUS,
  FONT,
} from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface ApprovalItemCardProps {
  item: ApprovalItem;
  isSelected: boolean;
  isMutating?: boolean;
  isExiting?: boolean;
  onToggleSelect: () => void;
  onApprove: () => void;
  onReject: () => void;
  onViewDetail: () => void;
  actionLabel: string;
}

export function ApprovalItemCard({
  item,
  isSelected,
  isMutating = false,
  isExiting = false,
  onToggleSelect,
  onApprove,
  onReject,
  onViewDetail,
  actionLabel,
}: ApprovalItemCardProps) {
  const t = useTranslations('approvals');
  const elapsedDays = daysBetween(item.requestedAt);

  // 다단계 승인 여부 확인
  const isMultiStep =
    item.category === 'disposal_review' ||
    item.category === 'disposal_final' ||
    item.category === 'plan_review' ||
    item.category === 'plan_final';

  return (
    <Card
      className={cn(
        `border-l-4 ${getApprovalCardBorderClasses(item.status)}`,
        APPROVAL_MOTION.cardHover,
        APPROVAL_FOCUS.card,
        isMutating && APPROVAL_MOTION.processing,
        isExiting && APPROVAL_MOTION.exiting
      )}
      data-testid="approval-item"
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {/* 체크박스 */}
          <Checkbox
            id={`select-${item.id}`}
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            aria-label={`${item.summary} ${t('item.select')}`}
            className="mt-1"
          />

          {/* 내용 */}
          <div className="flex-1 space-y-3">
            {/* 상태 뱃지 및 요약 */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className={getApprovalStatusBadgeClasses(item.status)}>
                {UNIFIED_APPROVAL_STATUS_LABELS[item.status] || item.status}
              </Badge>
              <span className={`text-sm font-medium ${FONT.heading}`}>{item.summary}</span>
            </div>

            {/* 요청 정보 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className={APPROVAL_INFO_GRID_TOKENS.iconContainer}>
                  <User className={APPROVAL_INFO_GRID_TOKENS.icon} aria-hidden="true" />
                </div>
                <div>
                  <p className={APPROVAL_INFO_GRID_TOKENS.label}>{t('item.requester')}</p>
                  <p className={APPROVAL_INFO_GRID_TOKENS.value}>{item.requesterName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2" data-testid="requester-team">
                <div className={APPROVAL_INFO_GRID_TOKENS.iconContainer}>
                  <Building2 className={APPROVAL_INFO_GRID_TOKENS.icon} aria-hidden="true" />
                </div>
                <div>
                  <p className={APPROVAL_INFO_GRID_TOKENS.label}>{t('item.team')}</p>
                  <p className={APPROVAL_INFO_GRID_TOKENS.value}>{item.requesterTeam || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={APPROVAL_INFO_GRID_TOKENS.iconContainer}>
                  <Calendar className={APPROVAL_INFO_GRID_TOKENS.icon} aria-hidden="true" />
                </div>
                <div>
                  <p className={APPROVAL_INFO_GRID_TOKENS.label}>{t('item.requestDate')}</p>
                  <p className={`${APPROVAL_INFO_GRID_TOKENS.value} ${FONT.mono}`}>
                    <time dateTime={item.requestedAt}>
                      {formatDate(item.requestedAt, 'yyyy-MM-dd HH:mm')}
                    </time>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={APPROVAL_INFO_GRID_TOKENS.iconContainer}>
                  <Clock className={APPROVAL_INFO_GRID_TOKENS.icon} aria-hidden="true" />
                </div>
                <div>
                  <p className={APPROVAL_INFO_GRID_TOKENS.label}>{t('item.elapsedLabel')}</p>
                  <p className={getElapsedDaysClasses(elapsedDays)}>
                    {elapsedDays === 0
                      ? t('item.elapsedToday')
                      : t('item.elapsedDays', { days: elapsedDays })}
                  </p>
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
                  {t('item.recentAction')}{' '}
                  {item.approvalHistory[item.approvalHistory.length - 1].actorName} (
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
              disabled={isMutating || isExiting}
              aria-describedby={`item-${item.id}`}
            >
              <Eye className="h-4 w-4 mr-1" />
              {t('item.detail')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onApprove}
              disabled={isMutating || isExiting}
              className={getApprovalActionButtonClasses('approve')}
              aria-busy={isMutating}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              {actionLabel}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onReject}
              disabled={isMutating || isExiting}
              className={getApprovalActionButtonClasses('reject')}
            >
              <XCircle className="h-4 w-4 mr-1" />
              {t('item.reject')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
