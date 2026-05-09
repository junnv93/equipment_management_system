'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
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
  getElapsedDaysClasses,
  APPROVAL_MOTION,
  APPROVAL_ACTION_BUTTON_TOKENS,
  APPROVAL_ROW_TOKENS,
  FONT,
  MENU_ITEM_TOKENS,
} from '@/lib/design-tokens';
import { getElapsedDaysUrgency } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useSiteLabels } from '@/lib/i18n/use-enum-labels';
import { ApprovalRowMiniStepper } from './ApprovalRowMiniStepper';

interface ApprovalRowProps {
  item: ApprovalItem;
  isSelected: boolean;
  isMutating?: boolean;
  isExiting?: 'success' | 'reject' | false;
  onToggleSelect: () => void;
  onApprove: () => void;
  /** canReject: false인 카테고리에서 undefined — 반려 버튼 미표시 (AR-8) */
  onReject?: () => void;
  onViewDetail: () => void;
  actionLabel: string;
}

/**
 * 승인 테이블 행 — shadcn Table 기반
 *
 * 정렬 보장: native <tr>/<td>로 컬럼 폭 자동 동기화
 * Urgency: 행 좌측 보더 색상으로 표현 (별도 컬럼 불필요)
 * 액션: DropdownMenu overflow 패턴 (업계 표준)
 * memo: ApprovalList의 ApprovalRowItem wrapper가 안정적 콜백을 공급 — 부모 재렌더 시 스킵
 */
export const ApprovalRow = memo(function ApprovalRow({
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
        'group',
        APPROVAL_ROW_TOKENS.urgencyBg[urgency],
        isMutating && APPROVAL_MOTION.processing,
        isExiting === 'success' && APPROVAL_MOTION.exitingSuccess,
        isExiting === 'reject' && APPROVAL_MOTION.exitingReject
      )}
      data-testid="approval-item"
    >
      {/* 체크박스 (urgency bar: 토큰 기반 4px 세로 바를 셀 좌측에 절대배치) */}
      <TableCell className="w-10 relative">
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 w-1',
            APPROVAL_ROW_TOKENS.urgencyBorder[urgency]
          )}
          aria-hidden="true"
        />
        <Checkbox
          id={`select-${item.id}`}
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          aria-label={`${localizedSummary} ${t('item.select')}`}
        />
      </TableCell>

      {/* 요약 + 다단계 인디케이터 (배지 컬럼 삭제 — urgency bar로 흡수) */}
      <TableCell>
        <div className="flex items-center gap-2 flex-nowrap min-w-0">
          <span
            className={cn('text-sm font-medium truncate min-w-0', FONT.heading)}
            title={localizedSummary}
          >
            {localizedSummary}
          </span>
          <ApprovalRowMiniStepper
            currentStep={item.approvalHistory?.length ?? 0}
            totalSteps={meta.totalApprovalSteps}
          />
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

      {/* 액션 — hover-inline 버튼 + DropdownMenu (overflow/keyboard/mobile용) */}
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-0.5">
          {/* hover 시 표시되는 인라인 승인/반려 버튼 */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-7 w-7 hidden group-hover:inline-flex',
              APPROVAL_ACTION_BUTTON_TOKENS.approveIcon
            )}
            disabled={isMutating || !!isExiting}
            onClick={onApprove}
            aria-label={t('row.hoverApprove')}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
          </Button>
          {onReject && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-7 w-7 hidden group-hover:inline-flex',
                APPROVAL_ACTION_BUTTON_TOKENS.rejectIcon
              )}
              disabled={isMutating || !!isExiting}
              onClick={onReject}
              aria-label={t('row.hoverReject')}
            >
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          )}

          {/* Dropdown — 항상 노출 (상세 보기 + keyboard/mobile 접근) */}
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
              {onReject && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onReject} className={MENU_ITEM_TOKENS.destructive}>
                    <XCircle className="h-4 w-4 mr-2" />
                    {t('item.reject')}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
});
