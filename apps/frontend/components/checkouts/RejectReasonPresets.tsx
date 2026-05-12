'use client';

import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { type RejectionPreset } from '@/lib/api/checkout-api';

interface RejectReasonPresetsProps {
  presets: RejectionPreset[];
  onSelect: (text: string) => void;
}

/**
 * 반려 사유 프리셋 chip 목록.
 *
 * - chip 표시 = `preset.label` (드롭다운 표시 레이블)
 * - 클릭 시 부모 textarea에 `preset.template ?? preset.label` 주입 (template 우선, 없으면 label).
 *   → admin이 template을 등록한 경우 자세한 내용으로 자동 채움, 미등록 시 label만 주입.
 */
export function RejectReasonPresets({ presets, onSelect }: RejectReasonPresetsProps) {
  const t = useTranslations('checkouts.reject.inline');

  if (presets.length === 0) {
    return <p className="text-xs text-muted-foreground">{t('empty')}</p>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {presets.map((preset) => {
        const injected = preset.template ?? preset.label;
        return (
          <Badge
            key={preset.id}
            variant="outline"
            role="button"
            tabIndex={0}
            className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
            onClick={() => onSelect(injected)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(injected);
              }
            }}
          >
            {preset.label}
          </Badge>
        );
      })}
    </div>
  );
}
