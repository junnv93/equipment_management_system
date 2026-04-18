'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import type { RowSelectionAPI } from '@/hooks/use-bulk-selection';

// ────────────────────────────────────────────────────────────────────────────
// AD-6: Row 체크박스 SSOT — aria-label, 키보드(Space/Enter), indeterminate 전파
// ────────────────────────────────────────────────────────────────────────────

export interface RowSelectCellProps<T> {
  item: T;
  keyFn: (item: T) => string;
  selection: Pick<RowSelectionAPI<T>, 'isSelected' | 'toggle'>;
  /** i18n 키 (common.bulk.selectRow 등) — {name} 인자 사용 */
  ariaLabelKey?: string;
  /** aria-label 인자 빌더 */
  ariaLabelArgs: (item: T) => Record<string, string | number>;
  disabled?: boolean;
}

export function RowSelectCell<T>({
  item,
  keyFn,
  selection,
  ariaLabelKey = 'bulk.selectRow',
  ariaLabelArgs,
  disabled,
}: RowSelectCellProps<T>): React.ReactElement {
  const t = useTranslations('common');
  const key = keyFn(item);
  const checked = selection.isSelected(key);

  const handleChange = useCallback(() => {
    selection.toggle(key, item);
  }, [selection, key, item]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        selection.toggle(key, item);
      }
    },
    [selection, key, item]
  );

  // i18n 키를 dotted path로 resolve (e.g. 'bulk.selectRow' → t('bulk.selectRow', args))
  const labelKey = ariaLabelKey.replace(/^common\./, '');
  const ariaLabel = t(labelKey as Parameters<typeof t>[0], ariaLabelArgs(item));

  return (
    <TableCell className="w-10 [&:has([role=checkbox])]:pr-0">
      <Checkbox
        checked={checked}
        onCheckedChange={handleChange}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel}
        disabled={disabled}
      />
    </TableCell>
  );
}
