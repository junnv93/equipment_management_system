'use client';

import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';

interface Preset {
  id: string;
  text: string;
}

interface RejectReasonPresetsProps {
  presets: Preset[];
  onSelect: (text: string) => void;
}

/**
 * 반려 사유 프리셋 chip 목록.
 * 클릭 시 부모 textarea에 텍스트를 주입 (추가 편집 가능).
 */
export function RejectReasonPresets({ presets, onSelect }: RejectReasonPresetsProps) {
  const t = useTranslations('checkouts.reject.inline');

  if (presets.length === 0) {
    return <p className="text-xs text-muted-foreground">{t('empty')}</p>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {presets.map((preset) => (
        <Badge
          key={preset.id}
          variant="outline"
          role="button"
          tabIndex={0}
          className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
          onClick={() => onSelect(preset.text)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(preset.text);
            }
          }}
        >
          {preset.text}
        </Badge>
      ))}
    </div>
  );
}
