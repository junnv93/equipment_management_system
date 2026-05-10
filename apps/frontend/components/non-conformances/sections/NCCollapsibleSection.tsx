'use client';

import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NC_COLLAPSIBLE_TOKENS } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

export interface CollapsibleSectionProps {
  title: React.ReactNode;
  contentId: string;
  isOpen: boolean;
  onToggle: () => void;
  canEdit?: boolean;
  isEditing?: boolean;
  onEdit?: () => void;
  children: React.ReactNode;
}

/**
 * Collapsible 섹션
 *
 * grid-rows 애니메이션: isOpen && 조건부 렌더 대신 항상 DOM에 존재하며 CSS만 변경.
 * grid-rows-[0fr] → grid-rows-[1fr] + min-h-0 패턴이 height 트랜지션 가능하게 함.
 */
export function CollapsibleSection({
  title,
  contentId,
  isOpen,
  onToggle,
  canEdit,
  isEditing,
  onEdit,
  children,
}: CollapsibleSectionProps) {
  const t = useTranslations('non-conformances');
  return (
    <div className={NC_COLLAPSIBLE_TOKENS.container}>
      <div className="flex items-center">
        <button
          type="button"
          className={cn(NC_COLLAPSIBLE_TOKENS.trigger, 'flex-1')}
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={contentId}
        >
          <span className="flex items-center gap-1.5">{title}</span>
          {isOpen ? (
            <ChevronUp className={cn('h-4 w-4', NC_COLLAPSIBLE_TOKENS.triggerIcon)} />
          ) : (
            <ChevronDown className={cn('h-4 w-4', NC_COLLAPSIBLE_TOKENS.triggerIcon)} />
          )}
        </button>
        {canEdit && !isEditing && onEdit && (
          <Button variant="ghost" size="sm" className="h-7 px-2 mr-2" onClick={onEdit}>
            <Pencil className="h-3 w-3 mr-1" />
            {t('detail.actionBar.edit')}
          </Button>
        )}
      </div>
      <div
        id={contentId}
        className={cn(
          NC_COLLAPSIBLE_TOKENS.contentWrapper,
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className={NC_COLLAPSIBLE_TOKENS.contentInner}>
          <div className={NC_COLLAPSIBLE_TOKENS.content}>{children}</div>
        </div>
      </div>
    </div>
  );
}
