'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CheckCircle2, XCircle, Eye, MoreHorizontal } from 'lucide-react';
import { daysBetween } from '@/lib/utils/date';
import { useDateFormatter } from '@/hooks/use-date-formatter';
import type { ApprovalItem } from '@/lib/api/approvals-api';
import { TAB_META } from '@/lib/api/approvals-api';
import { getLocalizedSummary } from '@/lib/utils/approval-summary-utils';
import {
  getApprovalStatusBadgeClasses,
  getElapsedDaysClasses,
  APPROVAL_MOTION,
  FONT,
  MENU_ITEM_TOKENS,
} from '@/lib/design-tokens';
import { getElapsedDaysUrgency } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useSiteLabels } from '@/lib/i18n/use-enum-labels';

/** Urgency → 좌측 보더 색상 */
const URGENCY_BORDER: Record<string, string> = {
  info: '',
  warning: 'border-l-2 border-l-brand-warning',
  critical: 'border-l-2 border-l-brand-critical',
  emergency: 'border-l-2 border-l-brand-critical',
};

/** Urgency → 행 배경 틴트 */
const URGENCY_BG: Record<string, string> = {
  info: '',
  warning: 'bg-brand-warning/5',
  critical: 'bg-brand-critical/5',
  emergency: 'bg-brand-critical/10',
};

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
 * 승인 테이블 행 — shadcn Table 기반
 *
 * 정렬 보장: native <tr>/<td>로 컬럼 폭 자동 동기화
 * Urgency: 행 좌측 보더 색상으로 표현 (별도 컬럼 불필요)
 * 액션: DropdownMenu overflow 패턴 (업계 표준)
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
  const siteLabels = useSiteLabels();
  const { fmtDate } = useDateFormatter();
  const elapsedDays = daysBetween(item.requestedAt);
  const urgency = getElapsedDaysUrgency(elapsedDays);
  const meta = TAB_META[item.category];
  const localizedSummary = getLocalizedSummary(item, t, siteLabels);

  return (
    <TableRow
      className={cn(
        URGENCY_BORDER[urgency],
        URGENCY_BG[urgency],
        isMutating && APPROVAL_MOTION.processing,
        isExiting === 'success' && APPROVAL_MOTION.exitingSuccess,
        isExiting === 'reject' && APPROVAL_MOTION.exitingReject
      )}
      data-testid="approval-item"
    >
      {/* 체크박스 */}
      <TableCell className="w-10">
        <Checkbox
          id={`select-${item.id}`}
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          aria-label={`${localizedSummary} ${t('item.select')}`}
        />
      </TableCell>

      {/* 요약 + 상태 배지 + 다단계 인디케이터 */}
      <TableCell>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={cn(getApprovalStatusBadgeClasses(item.status), 'text-xs')}>
            {t(`unifiedStatus.${item.status}`)}
          </Badge>
          <span className={cn('text-sm font-medium truncate', FONT.heading)}>
            {localizedSummary}
          </span>
          {meta.multiStep && (
            <span className="text-xs text-muted-foreground font-mono tabular-nums">
              {item.approvalHistory && item.approvalHistory.length > 0
                ? `${'●'.repeat(item.approvalHistory.length)}${'○'.repeat(Math.max(0, (meta.multiStepType === 'disposal' ? 2 : 3) - item.approvalHistory.length))} ${item.approvalHistory.length}/${meta.multiStepType === 'disposal' ? 2 : 3}`
                : `○○${meta.multiStepType === 'calibration_plan' ? '○' : ''} 0/${meta.multiStepType === 'disposal' ? 2 : 3}`}
            </span>
          )}
        </div>
      </TableCell>

      {/* 요청자/팀 */}
      <TableCell className="hidden lg:table-cell">
        <div className="text-sm truncate">{item.requesterName}</div>
        <div className="text-xs text-muted-foreground truncate">{item.requesterTeam || '-'}</div>
      </TableCell>

      {/* 신청일 */}
      <TableCell className="hidden lg:table-cell">
        <time dateTime={item.requestedAt} className={cn('text-sm', FONT.mono)}>
          {fmtDate(item.requestedAt, 'MM-dd')}
        </time>
      </TableCell>

      {/* 경과일 */}
      <TableCell className="hidden lg:table-cell">
        <span className={getElapsedDaysClasses(elapsedDays)}>
          {elapsedDays === 0 ? t('item.elapsedToday') : `${elapsedDays}${t('kpi.dayUnit')}`}
        </span>
      </TableCell>

      {/* 액션 — DropdownMenu */}
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={isMutating || !!isExiting}
              aria-label={t('row.menuAriaLabel', { summary: localizedSummary })}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onViewDetail}>
              <Eye className="h-4 w-4 mr-2" />
              {t('row.tooltipDetail')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onApprove}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {actionLabel}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onReject} className={MENU_ITEM_TOKENS.destructive}>
              <XCircle className="h-4 w-4 mr-2" />
              {t('item.reject')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
