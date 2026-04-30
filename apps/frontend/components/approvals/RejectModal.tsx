'use client';

import { useState, useEffect } from 'react';
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
import {
  RejectReasonSchema,
  REJECTION_MIN_LENGTH,
  REJECTION_MAX_LENGTH,
} from '@/lib/api/approvals-api';
import { getLocalizedSummary } from '@/lib/utils/approval-summary-utils';
import { getApprovalActionButtonClasses, REQUIRED_FIELD_TOKENS } from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';
import { useSiteLabels } from '@/lib/i18n/use-enum-labels';

/**
 * RejectModal — discriminated union mode prop (AP-03)
 *
 * mode='single': 단건 반려 (item 필요, onConfirm 콜백)
 * mode='bulk':   일괄 반려 (count만 필요, onBulkConfirm 콜백)
 *
 * 검증 SSOT: RejectReasonSchema (min/max via Zod)
 * state 단일화: useActionState 폐기 → local useState만 사용
 */
type RejectModalProps =
  | {
      mode: 'single';
      item: ApprovalItem;
      isOpen: boolean;
      onClose: () => void;
      onConfirm: (reason: string) => Promise<void>;
    }
  | {
      mode: 'bulk';
      count: number;
      isOpen: boolean;
      onClose: () => void;
      onBulkConfirm: (reason: string) => Promise<void>;
    };

const TEMPLATE_KEYS = ['spec', 'schedule', 'calibration', 'document', 'other'] as const;

export default function RejectModal(props: RejectModalProps) {
  const { mode, isOpen, onClose } = props;
  const t = useTranslations('approvals');
  const siteLabels = useSiteLabels();

  // 통합 로컬 상태 — useActionState + 외부 setState 패턴 폐기
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  // 모달 열릴 때 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError(null);
      setIsPending(false);
    }
  }, [isOpen]);

  const rejectTemplates = [
    { value: '', label: t('rejectModal.directInput') },
    ...TEMPLATE_KEYS.map((key) => ({
      value: t(`rejectModal.templates.${key}`),
      label: t(`rejectModal.templates.${key}`),
    })),
  ];

  const handleReasonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setReason(value);
    if (error) {
      const parsed = RejectReasonSchema.safeParse(value.trim());
      if (parsed.success) setError(null);
    }
  };

  // 템플릿 선택 → 비어있을 때만 자동 입력 (사용자 작성 중인 내용 보호)
  const handleTemplateSelect = (value: string) => {
    const resolved = value === 'direct' ? '' : value;
    if (!reason.trim()) {
      setReason(resolved);
      if (error && resolved.trim()) setError(null);
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = RejectReasonSchema.safeParse(reason.trim());
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setIsPending(true);
    try {
      if (props.mode === 'single') {
        await props.onConfirm(reason.trim());
      } else {
        await props.onBulkConfirm(reason.trim());
        props.onClose();
      }
    } catch {
      setError(t('toasts.rejectError'));
    } finally {
      setIsPending(false);
    }
  };

  const title = mode === 'bulk' ? t('bulk.reject') : t('rejectModal.title');

  const description =
    mode === 'bulk'
      ? t('rejectModal.bulk.description', { count: props.count })
      : t('rejectModal.single.description', {
          summary: getLocalizedSummary(props.item, t, siteLabels),
        });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription id="reject-modal-desc">{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 템플릿 선택 (single 모드에서만 표시) */}
          {mode === 'single' && (
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
          )}

          {/* 반려 사유 */}
          <div className="space-y-2">
            <Label htmlFor="reject-reason">{t('rejectModal.reasonLabel')} *</Label>
            <Textarea
              id="reject-reason"
              name="reason"
              value={reason}
              onChange={handleReasonChange}
              placeholder={t('rejectModal.reasonPlaceholder')}
              className="min-h-[120px]"
              aria-describedby={error ? 'reject-error' : 'reject-modal-desc'}
              maxLength={REJECTION_MAX_LENGTH}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                {t('rejectModal.minLengthHint', { min: REJECTION_MIN_LENGTH })}
              </p>
              <p
                className={
                  reason.length >= REJECTION_MAX_LENGTH
                    ? `${REQUIRED_FIELD_TOKENS.charCount} text-destructive`
                    : reason.length >= Math.floor(REJECTION_MAX_LENGTH * 0.8)
                      ? `${REQUIRED_FIELD_TOKENS.charCount} text-warning`
                      : REQUIRED_FIELD_TOKENS.charCount
                }
                aria-live="polite"
                role="status"
              >
                {t('rejectModal.charsRemaining', {
                  remaining: REJECTION_MAX_LENGTH - reason.length,
                })}
              </p>
            </div>
            {error && (
              <p
                id="reject-error"
                className="text-sm text-destructive"
                role="alert"
                aria-live="assertive"
              >
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              loading={isPending}
            >
              {t('rejectModal.cancel')}
            </Button>
            <Button
              type="submit"
              variant="outline"
              disabled={isPending}
              loading={isPending}
              aria-busy={isPending}
              className={getApprovalActionButtonClasses('reject')}
            >
              <XCircle className="h-4 w-4 mr-1" aria-hidden="true" />
              {isPending ? t('processing') : title}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
