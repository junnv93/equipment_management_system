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
  /** i18n 키 — common 네임스페이스 기준 sub-key (e.g. 'bulk.selectRow'). 'common.' prefix 제외 */
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
  const { isSelected, toggle } = selection;
  const checked = isSelected(key);

  const handleChange = useCallback(() => {
    toggle(key, item);
  }, [toggle, key, item]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // 한글 IME composition 중에는 단축키 처리 금지 — 입력 중 Enter는 조합 확정용
      if (e.nativeEvent.isComposing) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        toggle(key, item);
      }
    },
    [toggle, key, item]
  );

  const ariaLabel = t(ariaLabelKey as Parameters<typeof t>[0], ariaLabelArgs(item));

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
