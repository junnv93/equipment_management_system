'use client';

import { memo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { CheckoutStatusBadge } from '@/components/checkouts/CheckoutStatusBadge';
import { CheckoutMiniProgress } from '@/components/checkouts/CheckoutMiniProgress';
import { NextStepPanel } from '@/components/checkouts/NextStepPanel';
import type { OverflowAction, EquipmentRowData } from '@/lib/types/checkout-ui';
export type { EquipmentRowData };
import {
  CHECKOUT_ITEM_ROW_TOKENS,
  ANIMATION_PRESETS,
  getStaggerFadeInStyle,
  shouldUseStaggerFadeIn,
  getPurposeBarClass,
  getCheckoutDday4TierClasses,
  formatDday,
  MICRO_TYPO,
  getManagementNumberClasses,
} from '@/lib/design-tokens';
import { calculateDaysRemaining } from '@/lib/utils/dday-utils';
import {
  CheckoutStatusValues as CSVal,
  type CheckoutAction,
  type UserRole,
} from '@equipment-management/schemas';

// ── Types ────────────────────────────────────────────────────────────────────

// EquipmentRowData is defined in @/lib/types/checkout-ui and re-exported above.

interface CheckoutEquipmentRowProps {
  row: EquipmentRowData;
  rowIndex: number;
  showRowCheckbox: boolean;
  isRowSelected: boolean;
  rowSelectable: boolean;
  onToggleRow?: (rowId: string) => void;
  /** data-checkout-id 기반 이벤트 위임 핸들러 (부모 useCallback 안정 참조) */
  onRowClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  onRowKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  /** NextStepPanel 액션 핸들러 — 부모가 체크아웃별 curried 함수 전달 */
  onAction: (action: CheckoutAction) => void;
  overflowActions: OverflowAction[];
  userRole: UserRole;
  isApprovePending: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

function CheckoutEquipmentRowInner({
  row,
  rowIndex,
  showRowCheckbox,
  isRowSelected,
  rowSelectable,
  onToggleRow,
  onRowClick,
  onRowKeyDown,
  onAction,
  overflowActions,
  userRole,
  isApprovePending,
}: CheckoutEquipmentRowProps) {
  const t = useTranslations('checkouts');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const daysRemaining = row.expectedReturnDate
    ? calculateDaysRemaining(row.expectedReturnDate)
    : null;
  const isRowOverdue = row.status === CSVal.OVERDUE;
  const rowBaseClass = isRowOverdue
    ? `${CHECKOUT_ITEM_ROW_TOKENS.container} ${CHECKOUT_ITEM_ROW_TOKENS.containerOverdue}`
    : CHECKOUT_ITEM_ROW_TOKENS.container;
  const shouldAnimateRow = shouldUseStaggerFadeIn(rowIndex);

  return (
    <div
      role="row"
      tabIndex={0}
      data-checkout-id={row.checkoutId}
      aria-label={t('groupCard.rowAria', {
        equipment: row.equipmentName,
        status: t(`status.${row.status}`),
        dday: daysRemaining !== null ? formatDday(daysRemaining) : '',
      })}
      aria-selected={showRowCheckbox ? isRowSelected : undefined}
      onClick={onRowClick}
      onKeyDown={onRowKeyDown}
      className={cn(
        rowBaseClass,
        showRowCheckbox ? CHECKOUT_ITEM_ROW_TOKENS.gridWithCheckbox : CHECKOUT_ITEM_ROW_TOKENS.grid,
        shouldAnimateRow && ANIMATION_PRESETS.staggerFadeInItem
      )}
      style={shouldAnimateRow ? getStaggerFadeInStyle(rowIndex, 'grid') : undefined}
    >
      {/* Zone 0: row 체크박스 — bulk-selection 활성 시에만 노출 */}
      {showRowCheckbox && (
        <div role="gridcell" className={CHECKOUT_ITEM_ROW_TOKENS.zoneCheckbox}>
          <Checkbox
            data-testid="row-checkbox"
            checked={isRowSelected}
            disabled={!rowSelectable}
            onCheckedChange={() => {
              if (rowSelectable) onToggleRow?.(row.checkoutId);
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                if (rowSelectable) onToggleRow?.(row.checkoutId);
              }
            }}
            aria-label={
              rowSelectable
                ? t('groupCard.selectRowAria', {
                    equipment: row.equipmentName,
                    status: t(`status.${row.status}`),
                  })
                : t('groupCard.selectRowDisabled')
            }
            className="shrink-0"
          />
        </div>
      )}

      {/* Zone 1: purposeBar (3px) */}
      <span
        className={cn(CHECKOUT_ITEM_ROW_TOKENS.purposeBar.base, getPurposeBarClass(row.purpose))}
        aria-hidden="true"
      />

      {/* Zone 2: status + D-day 세로 스택 (72px) */}
      <div role="gridcell" className={CHECKOUT_ITEM_ROW_TOKENS.zoneStatus}>
        <CheckoutStatusBadge
          status={row.status}
          className={`${MICRO_TYPO.badge} py-0 max-w-[68px] truncate`}
        />
        {daysRemaining !== null && (
          <span
            className={`${CHECKOUT_ITEM_ROW_TOKENS.dday} ${getCheckoutDday4TierClasses(daysRemaining)}`}
          >
            {formatDday(daysRemaining)}
          </span>
        )}
      </div>

      {/* Zone 3: identity — 장비명 + meta (1fr) */}
      <div role="gridcell" className={CHECKOUT_ITEM_ROW_TOKENS.zoneIdentity}>
        <div className={CHECKOUT_ITEM_ROW_TOKENS.nameRow}>
          <span className={CHECKOUT_ITEM_ROW_TOKENS.name}>{row.equipmentName}</span>
          <code className={`${CHECKOUT_ITEM_ROW_TOKENS.mgmt} ${getManagementNumberClasses()}`}>
            {row.managementNumber}
          </code>
        </div>
        <p className={CHECKOUT_ITEM_ROW_TOKENS.meta}>
          {row.destination && <>{row.destination} · </>}
          {row.expectedReturnDate && (
            <>
              {t('groupCard.expectedReturn')}{' '}
              {new Date(row.expectedReturnDate).toLocaleDateString(locale, {
                month: 'long',
                day: 'numeric',
              })}{' '}
              ·{' '}
            </>
          )}
          {row.userName}
        </p>
      </div>

      {/* Zone 4: NextStepPanel compact + MiniProgress tooltip (auto) */}
      <div role="gridcell" className={CHECKOUT_ITEM_ROW_TOKENS.zoneAction}>
        {row.descriptor && (
          <NextStepPanel
            variant="compact"
            descriptor={row.descriptor}
            currentUserRole={userRole}
            onActionClick={onAction}
            isPending={isApprovePending}
            overflowActions={overflowActions}
            loadingLabel={tCommon('status.loading')}
          />
        )}
        <CheckoutMiniProgress
          variant="tooltipButton"
          currentStatus={row.status}
          checkoutType={row.checkoutType}
          descriptor={row.descriptor}
        />
      </div>
    </div>
  );
}

export const CheckoutEquipmentRow = memo(CheckoutEquipmentRowInner);
