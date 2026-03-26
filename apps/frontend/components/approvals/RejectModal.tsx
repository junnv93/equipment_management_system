'use client';

import { useActionState, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { XCircle } from 'lucide-react';
import type { ApprovalItem } from '@/lib/api/approvals-api';
import { REJECTION_MIN_LENGTH } from '@/lib/api/approvals-api';
import { getLocalizedSummary } from '@/lib/utils/approval-summary-utils';
import { getApprovalActionButtonClasses } from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';

interface RejectModalProps {
  item: ApprovalItem;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

interface RejectFormState {
  error: string | null;
  success: boolean;
}

const TEMPLATE_KEYS = ['spec', 'schedule', 'calibration', 'document', 'other'] as const;

export default function RejectModal({ item, isOpen, onClose, onConfirm }: RejectModalProps) {
  const t = useTranslations('approvals');

  // 반려 사유 템플릿 (i18n)
  const rejectTemplates = [
    { value: '', label: t('rejectModal.directInput') },
    ...TEMPLATE_KEYS.map((key) => ({
      value: t(`rejectModal.templates.${key}`),
      label: t(`rejectModal.templates.${key}`),
    })),
  ];

  // Local state for real-time validation
  const [reasonValue, setReasonValue] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setReasonValue('');
      setValidationError(null);
    }
  }, [isOpen]);

  // useActionState 패턴 사용 (Next.js 16)
  const [state, formAction, isPending] = useActionState<RejectFormState, FormData>(
    async (prevState, formData) => {
      const reason = formData.get('reason') as string;

      // 반려 사유 10자 이상 검증
      if (!reason || reason.trim().length < REJECTION_MIN_LENGTH) {
        setValidationError(t('rejectModal.validation'));
        return {
          error: null,
          success: false,
        };
      }

      try {
        await onConfirm(reason.trim());
        return { error: null, success: true };
      } catch {
        return {
          error: t('toasts.rejectError'),
          success: false,
        };
      }
    },
    { error: null, success: false }
  );

  // Real-time validation on input change
  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setReasonValue(value);

    // Clear validation error if user enters valid input
    if (value.trim().length >= REJECTION_MIN_LENGTH) {
      setValidationError(null);
    }
  };

  const handleTemplateSelect = (value: string) => {
    // 'direct' = 직접 입력 (빈 문자열 대체값) → textarea 초기화
    const resolvedValue = value === 'direct' ? '' : value;
    setReasonValue(resolvedValue);
    if (resolvedValue.trim().length >= REJECTION_MIN_LENGTH) {
      setValidationError(null);
    }
  };

  // Use validation error from real-time validation or form submission
  const displayError = validationError || state.error;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('rejectModal.title')}</DialogTitle>
          <DialogDescription>
            {t('rejectModal.description', { summary: getLocalizedSummary(item, t) })}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {/* 템플릿 선택 */}
          <div className="space-y-2">
            <Label htmlFor="template">{t('rejectModal.templatesLabel')}</Label>
            <Select onValueChange={handleTemplateSelect}>
              <SelectTrigger id="template">
                <SelectValue placeholder={t('rejectModal.templateSelectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {rejectTemplates.map((template) => (
                  <SelectItem key={template.value || 'direct'} value={template.value || 'direct'}>
                    {template.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 반려 사유 */}
          <div className="space-y-2">
            <Label htmlFor="reject-reason">{t('rejectModal.reasonLabel')} *</Label>
            <Textarea
              id="reject-reason"
              name="reason"
              value={reasonValue}
              onChange={handleReasonChange}
              placeholder={t('rejectModal.reasonPlaceholder')}
              className="min-h-[120px]"
              aria-describedby={displayError ? 'reject-error' : undefined}
            />
            {displayError && (
              <p
                id="reject-error"
                className="text-sm text-destructive"
                role="alert"
                aria-live="assertive"
              >
                {displayError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              {t('rejectModal.cancel')}
            </Button>
            <Button
              type="submit"
              variant="outline"
              disabled={isPending}
              aria-busy={isPending}
              className={getApprovalActionButtonClasses('reject')}
            >
              <XCircle className="h-4 w-4 mr-1" />
              {isPending ? t('processing') : t('rejectModal.title')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
