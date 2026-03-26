'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, XCircle, Eye } from 'lucide-react';
import { daysBetween } from '@/lib/utils/date';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import type { ApprovalItem } from '@/lib/api/approvals-api';
import {
  TAB_META,
  UNIFIED_APPROVAL_STATUS_LABELS,
  getLocalizedSummary,
} from '@/lib/api/approvals-api';
import {
  getApprovalStatusBadgeClasses,
  getApprovalActionButtonClasses,
  getElapsedDaysClasses,
  APPROVAL_ROW_TOKENS,
  APPROVAL_MOTION,
  APPROVAL_FOCUS,
  FONT,
} from '@/lib/design-tokens';
import { getElapsedDaysUrgency } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface ApprovalRowProps {
  item: ApprovalItem;
  isSelected: boolean;
  isMutating?: boolean;
  isExiting?: 'success' | 'reject' | false;
  onToggleSelect: () => void;
  onApprove: () => void;
  onReject: () => void;
  onViewDetail: () => void;
  actionLabel: string;
}

/**
 * 승인 컴팩트 로우 — ApprovalItemCard 대체 (~64px vs ~150px)
 *
 * Desktop (lg+): 7-column grid
 * Mobile (<lg): stacked card-like flex
 */
export function ApprovalRow({
  item,
  isSelected,
  isMutating = false,
  isExiting = false,
  onToggleSelect,
  onApprove,
  onReject,
  onViewDetail,
  actionLabel,
}: ApprovalRowProps) {
  const t = useTranslations('approvals');
  const { fmtDate } = useDateFormatter();
  const elapsedDays = daysBetween(item.requestedAt);
  const urgency = getElapsedDaysUrgency(elapsedDays);
  const tokens = APPROVAL_ROW_TOKENS;
  const meta = TAB_META[item.category];
  const localizedSummary = getLocalizedSummary(item, t);

  return (
    <div
      className={cn(
        tokens.container.base,
        tokens.container.desktop,
        tokens.container.mobile,
        tokens.hover,
        tokens.urgencyBg[urgency],
        APPROVAL_FOCUS.card,
        isMutating && APPROVAL_MOTION.processing,
        isExiting === 'success' && APPROVAL_MOTION.exitingSuccess,
        isExiting === 'reject' && APPROVAL_MOTION.exitingReject
      )}
      data-testid="approval-item"
    >
      {/* 1. Checkbox */}
      <div className="flex items-center justify-center">
        <Checkbox
          id={`select-${item.id}`}
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          aria-label={`${localizedSummary} ${t('item.select')}`}
        />
      </div>

      {/* 2. Urgency left border (4px bar) — desktop only */}
      <div
        className={cn(
          'hidden lg:block w-1 self-stretch rounded-full',
          tokens.urgencyBorder[urgency]
        )}
        aria-hidden="true"
      />

      {/* 3. Summary + Meta */}
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={cn(getApprovalStatusBadgeClasses(item.status), 'text-xs')}>
            {UNIFIED_APPROVAL_STATUS_LABELS[item.status] || item.status}
          </Badge>
          <span className={cn('text-sm font-medium truncate', FONT.heading)}>
            {localizedSummary}
          </span>
          {meta.multiStep && (
            <span className={tokens.stepBadge} aria-label={t('row.stepBadge')}>
              {item.approvalHistory && item.approvalHistory.length > 0
                ? `${'●'.repeat(item.approvalHistory.length)}${'○'.repeat(Math.max(0, (meta.multiStepType === 'disposal' ? 2 : 3) - item.approvalHistory.length))} ${item.approvalHistory.length}/${meta.multiStepType === 'disposal' ? 2 : 3}`
                : `○○${meta.multiStepType === 'calibration_plan' ? '○' : ''} 0/${meta.multiStepType === 'disposal' ? 2 : 3}`}
            </span>
          )}
        </div>
        {/* Mobile: show requester/team/date inline */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground lg:hidden">
          <span>{item.requesterName}</span>
          {item.requesterTeam && (
            <>
              <span aria-hidden="true">·</span>
              <span>{item.requesterTeam}</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <time dateTime={item.requestedAt}>{fmtDate(item.requestedAt)}</time>
        </div>
      </div>

      {/* 4. Requester/Team — desktop only */}
      <div className="hidden lg:block min-w-0">
        <div className="text-sm truncate">{item.requesterName}</div>
        <div className="text-xs text-muted-foreground truncate">{item.requesterTeam || '-'}</div>
      </div>

      {/* 5. Date — desktop only */}
      <div className="hidden lg:block">
        <time dateTime={item.requestedAt} className={cn('text-sm', FONT.mono)}>
          {fmtDate(item.requestedAt, 'MM-dd')}
        </time>
      </div>

      {/* 6. Elapsed days */}
      <div className="hidden lg:block">
        <span className={getElapsedDaysClasses(elapsedDays)}>
          {elapsedDays === 0 ? t('item.elapsedToday') : `${elapsedDays}${t('kpi.dayUnit')}`}
        </span>
      </div>

      {/* 7. Actions */}
      <div className={tokens.actions.container}>
        {/* Desktop: icon-only with tooltip */}
        <div className="hidden lg:flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={onViewDetail}
                disabled={isMutating || !!isExiting}
                className={tokens.actions.iconButton}
              >
                <Eye className="h-4 w-4" />
                <span className="sr-only">{t('row.tooltipDetail')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('row.tooltipDetail')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={onApprove}
                disabled={isMutating || !!isExiting}
                className={cn(
                  tokens.actions.iconButton,
                  getApprovalActionButtonClasses('approveIcon')
                )}
                aria-busy={isMutating}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span className="sr-only">{t('row.tooltipApprove')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{actionLabel}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={onReject}
                disabled={isMutating || !!isExiting}
                className={cn(
                  tokens.actions.iconButton,
                  getApprovalActionButtonClasses('rejectIcon')
                )}
              >
                <XCircle className="h-4 w-4" />
                <span className="sr-only">{t('row.tooltipReject')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('item.reject')}</TooltipContent>
          </Tooltip>
        </div>

        {/* Mobile: text buttons */}
        <div className="flex items-center gap-2 lg:hidden">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onViewDetail}
            disabled={isMutating || !!isExiting}
          >
            <Eye className="h-4 w-4 mr-1" />
            {t('item.detail')}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onApprove}
            disabled={isMutating || !!isExiting}
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
            disabled={isMutating || !!isExiting}
            className={getApprovalActionButtonClasses('reject')}
          >
            <XCircle className="h-4 w-4 mr-1" />
            {t('item.reject')}
          </Button>
        </div>
      </div>
    </div>
  );
}
