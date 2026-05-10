'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useRejectionPresets } from '@/hooks/use-rejection-presets';
import { RejectReasonPresets } from '@/components/checkouts/RejectReasonPresets';

interface CheckoutRejectInlineProps {
  onSubmit: (reason: string) => void;
  onCancel: () => void;
  isPending?: boolean;
}

/**
 * 인라인 반려 사유 입력 컴포넌트.
 *
 * - preset chip 클릭 → textarea 주입 + 추가 편집 가능
 * - Ctrl+Enter 제출, Esc 취소
 * - aria-expanded + aria-controls (프리셋 패널)
 */
export function CheckoutRejectInline({ onSubmit, onCancel, isPending }: CheckoutRejectInlineProps) {
  const [reason, setReason] = useState('');
  const [presetExpanded, setPresetExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const presetPanelId = 'reject-preset-panel';
  const t = useTranslations('checkouts.reject.inline');

  const { data: presets = [] } = useRejectionPresets();

  const handlePresetSelect = useCallback((text: string) => {
    setReason((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}\n${text}` : text;
    });
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
      if (e.key === 'Enter' && e.ctrlKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        if (reason.trim()) onSubmit(reason.trim());
      }
    },
    [reason, onSubmit, onCancel]
  );

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="space-y-1.5">
        <Label htmlFor="reject-reason-inline">{t('title')}</Label>
        <Textarea
          id="reject-reason-inline"
          ref={textareaRef}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('placeholder')}
          rows={3}
          disabled={isPending}
          aria-describedby="reject-shortcut-hint"
        />
        <p id="reject-shortcut-hint" className="text-xs text-muted-foreground">
          {t('submitShortcut')}
        </p>
      </div>

      {presets.length > 0 && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            aria-expanded={presetExpanded}
            aria-controls={presetPanelId}
            onClick={() => setPresetExpanded((prev) => !prev)}
            className="h-auto px-0 text-xs text-muted-foreground hover:text-foreground"
          >
            {presetExpanded ? (
              <ChevronUp className="mr-1 h-3 w-3" />
            ) : (
              <ChevronDown className="mr-1 h-3 w-3" />
            )}
            {t('presetTitle')}
          </Button>
          {presetExpanded && (
            <div id={presetPanelId} className="mt-2">
              <RejectReasonPresets presets={presets} onSelect={handlePresetSelect} />
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" type="button" onClick={onCancel} disabled={isPending}>
          {t('cancel')}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          type="button"
          onClick={() => {
            if (reason.trim()) onSubmit(reason.trim());
          }}
          disabled={!reason.trim() || isPending}
          loading={isPending}
        >
          {t('submit')}
        </Button>
      </div>
    </div>
  );
}
