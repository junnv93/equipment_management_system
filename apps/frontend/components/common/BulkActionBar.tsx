'use client';

import { useTranslations } from 'next-intl';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { BULK_ACTION_BAR_TOKENS } from '@/lib/design-tokens/components/bulk-action-bar';
import { cn } from '@/lib/utils';

// ────────────────────────────────────────────────────────────────────────────
// AD-5: 도메인 무관 generic BulkActionBar — 도메인 버튼은 actions slot에 주입
// ────────────────────────────────────────────────────────────────────────────

export interface BulkActionBarLabels {
  /** 선택 카운트 문자열 (e.g. "3개 선택됨") — 미제공 시 common.bulk.selected 사용 */
  selected?: string;
  /** 전체 선택 버튼 라벨 — 미제공 시 common.bulk.selectAll */
  selectAll?: string;
  /** 선택 해제 버튼 라벨 — 미제공 시 common.bulk.clearSelection */
  clearSelection?: string;
}

export interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  isAllPageSelected: boolean;
  isIndeterminate: boolean;
  onSelectAll: () => void;
  onClear: () => void;
  /** 도메인 특화 액션 버튼들 (AlertDialog 포함 가능) */
  actions?: React.ReactNode;
  variant?: 'sticky-top' | 'sticky-bottom' | 'inline';
  labels?: BulkActionBarLabels;
  ariaLabel?: string;
  className?: string;
}

export function BulkActionBar({
  selectedCount,
  totalCount,
  isAllPageSelected,
  isIndeterminate,
  onSelectAll,
  onClear,
  actions,
  variant = 'inline',
  labels,
  ariaLabel,
  className,
}: BulkActionBarProps): React.ReactElement | null {
  const t = useTranslations('common.bulk');

  if (selectedCount === 0) return null;

  const variantClass =
    variant === 'sticky-top'
      ? BULK_ACTION_BAR_TOKENS.stickyTop
      : variant === 'sticky-bottom'
        ? BULK_ACTION_BAR_TOKENS.stickyBottom
        : BULK_ACTION_BAR_TOKENS.inline;

  const checkedState: boolean | 'indeterminate' = isIndeterminate
    ? 'indeterminate'
    : isAllPageSelected;

  const selectedLabel =
    labels?.selected ??
    (totalCount > 0
      ? t('selectedOf', { count: selectedCount, total: totalCount })
      : t('selected', { count: selectedCount }));

  return (
    <div
      role="toolbar"
      aria-label={ariaLabel ?? selectedLabel}
      className={cn(
        BULK_ACTION_BAR_TOKENS.container,
        variantClass,
        BULK_ACTION_BAR_TOKENS.inner,
        className
      )}
    >
      {/* Radix CheckboxPrimitive이 checked='indeterminate'일 때 aria-checked="mixed"를 자동 설정 */}
      <Checkbox
        checked={checkedState}
        onCheckedChange={(checked) => {
          if (checked) onSelectAll();
          else onClear();
        }}
        aria-label={
          isAllPageSelected
            ? (labels?.clearSelection ?? t('clearSelection'))
            : (labels?.selectAll ?? t('selectAll'))
        }
        className={BULK_ACTION_BAR_TOKENS.indeterminateFill}
      />

      <span className={BULK_ACTION_BAR_TOKENS.countText}>{selectedLabel}</span>

      <div className={BULK_ACTION_BAR_TOKENS.separator} aria-hidden="true" />

      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className={BULK_ACTION_BAR_TOKENS.actionButton}
      >
        {labels?.clearSelection ?? t('clearSelection')}
      </Button>

      {actions && (
        <>
          <div className={BULK_ACTION_BAR_TOKENS.separator} aria-hidden="true" />
          {actions}
        </>
      )}
    </div>
  );
}
