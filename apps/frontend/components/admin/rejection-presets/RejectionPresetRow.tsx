'use client';

import { useTranslations } from 'next-intl';
import { ChevronUp, ChevronDown, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { type RejectionPreset } from '@/lib/api/checkout-api';
import { useReorderRejectionPresetsMutation } from '@/hooks/use-rejection-preset-mutations';

interface RejectionPresetRowProps {
  preset: RejectionPreset;
  index: number;
  total: number;
  rows: RejectionPreset[];
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * 반려 사유 프리셋 행 (admin).
 *
 * - 정렬: ↑/↓ 버튼으로 인접 행과 sortOrder swap (reorder mutation).
 * - 편집: 모달 열기 (parent state).
 * - 삭제: AlertDialog (parent state). isDefault=true row는 disabled + tooltip.
 */
export function RejectionPresetRow({
  preset,
  index,
  total,
  rows,
  onEdit,
  onDelete,
}: RejectionPresetRowProps) {
  const t = useTranslations('admin.rejectionPresets');
  const reorderMutation = useReorderRejectionPresetsMutation();

  const handleMoveUp = () => {
    if (index === 0) return;
    const prev = rows[index - 1];
    reorderMutation.mutate({
      orders: [
        { id: preset.id, sortOrder: prev.sortOrder },
        { id: prev.id, sortOrder: preset.sortOrder },
      ],
    });
  };

  const handleMoveDown = () => {
    if (index >= total - 1) return;
    const next = rows[index + 1];
    reorderMutation.mutate({
      orders: [
        { id: preset.id, sortOrder: next.sortOrder },
        { id: next.id, sortOrder: preset.sortOrder },
      ],
    });
  };

  const isDeleteDisabled = preset.isDefault;
  const deleteTooltipMessage = isDeleteDisabled ? t('cannotDeleteDefault') : t('deleteBtn');

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleMoveUp}
            disabled={index === 0 || reorderMutation.isPending}
            aria-label={t('aria.moveUp')}
          >
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleMoveDown}
            disabled={index >= total - 1 || reorderMutation.isPending}
            aria-label={t('aria.moveDown')}
          >
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </TableCell>
      <TableCell className="font-medium">{preset.label}</TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {preset.template ? (
          <span className="line-clamp-2">{preset.template}</span>
        ) : (
          <span className="text-xs italic">{t('noTemplate')}</span>
        )}
      </TableCell>
      <TableCell>
        {preset.isDefault && (
          <Badge variant="secondary" aria-label={t('aria.isDefault')}>
            {t('isDefaultBadge')}
          </Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            aria-label={t('aria.editBtn', { label: preset.label })}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </Button>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDelete}
                    disabled={isDeleteDisabled}
                    aria-label={t('aria.deleteBtn', { label: preset.label })}
                    aria-describedby={isDeleteDisabled ? `delete-disabled-${preset.id}` : undefined}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent id={`delete-disabled-${preset.id}`} role="tooltip">
                {deleteTooltipMessage}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
    </TableRow>
  );
}
