'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, AlertCircle, Package2, Eye, Cog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CSS_VAR_NAMES, cssVar } from '@/lib/design-tokens/css-variables';
import type { ConditionStatus, AccessoriesStatus } from '@equipment-management/schemas';
import type { BulkReceiveCondition } from '@/hooks/use-checkout-bulk-receive-mutation';

interface InboundBulkReceiveModalProps {
  count: number;
  isOpen: boolean;
  onClose: () => void;
  /**
   * 일괄 수령 확인 콜백 — `Promise<void>` 강제.
   * Dialog 내부 handleSubmit이 await 후 close하므로 호출자는 mutateAsync를 return해야 한다.
   */
  onConfirm: (condition: BulkReceiveCondition) => Promise<void>;
  isPending?: boolean;
}

const DEFAULT_CONDITION: BulkReceiveCondition = {
  appearanceStatus: 'normal',
  operationStatus: 'normal',
  accessoriesStatus: undefined,
  abnormalDetails: undefined,
  notes: undefined,
};

export function InboundBulkReceiveModal({
  count,
  isOpen,
  onClose,
  onConfirm,
  isPending = false,
}: InboundBulkReceiveModalProps) {
  const t = useTranslations('checkouts');

  const [appearanceStatus, setAppearanceStatus] = useState<ConditionStatus>('normal');
  const [operationStatus, setOperationStatus] = useState<ConditionStatus>('normal');
  const [accessoriesStatus, setAccessoriesStatus] = useState<AccessoriesStatus | undefined>(
    undefined
  );
  const [abnormalDetails, setAbnormalDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const hasAbnormal =
    appearanceStatus === 'abnormal' ||
    operationStatus === 'abnormal' ||
    accessoriesStatus === 'incomplete';

  const resetState = useCallback(() => {
    setAppearanceStatus(DEFAULT_CONDITION.appearanceStatus);
    setOperationStatus(DEFAULT_CONDITION.operationStatus);
    setAccessoriesStatus(DEFAULT_CONDITION.accessoriesStatus);
    setAbnormalDetails('');
    setNotes('');
    setValidationError(null);
    setIsProcessing(false);
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetState();
      onClose();
    }
  };

  const validate = (): boolean => {
    if (hasAbnormal && !abnormalDetails.trim()) {
      setValidationError(t('inbound.receive.abnormalDetailsRequired'));
      return false;
    }
    setValidationError(null);
    return true;
  };

  const buildCondition = (
    appearance: ConditionStatus,
    operation: ConditionStatus,
    accessories: AccessoriesStatus | undefined,
    details: string,
    note: string
  ): BulkReceiveCondition => ({
    appearanceStatus: appearance,
    operationStatus: operation,
    ...(accessories !== undefined && { accessoriesStatus: accessories }),
    ...(details.trim() && { abnormalDetails: details.trim() }),
    ...(note.trim() && { notes: note.trim() }),
  });

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsProcessing(true);
    try {
      await onConfirm(
        buildCondition(appearanceStatus, operationStatus, accessoriesStatus, abnormalDetails, notes)
      );
      resetState();
      onClose();
    } catch {
      // 네트워크/5xx 에러 → toast는 mutation onError에서 처리. dialog 유지하여 retry 가능.
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAllNormal = async () => {
    setIsProcessing(true);
    try {
      await onConfirm(DEFAULT_CONDITION);
      resetState();
      onClose();
    } catch {
      // same as handleSubmit
    } finally {
      setIsProcessing(false);
    }
  };

  const isDisabled = isPending || isProcessing;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('inbound.bulk.receiveTitle', { count })}</DialogTitle>
          <DialogDescription>{t('inbound.bulk.receiveDescription', { count })}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* "모두 정상으로 수령 확인" 단축 버튼 */}
          <Button
            type="button"
            onClick={handleAllNormal}
            disabled={isDisabled}
            className="flex w-full items-center justify-center gap-2 bg-brand-ok text-white hover:bg-brand-ok/90"
            style={{ minHeight: '56px' }}
          >
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-semibold label-ko">
              {t('inbound.receive.allNormal')}
            </span>
          </Button>

          {validationError && (
            <Alert variant="destructive" role="alert" aria-live="assertive">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {/* 외관 상태 */}
          <ConditionFieldGroup
            icon={Eye}
            label={t('inbound.receive.appearance')}
            value={appearanceStatus}
            onChange={setAppearanceStatus}
            groupId="bulk-receive-appearance"
            disabled={isDisabled}
          />

          {/* 작동 상태 */}
          <ConditionFieldGroup
            icon={Cog}
            label={t('inbound.receive.operation')}
            value={operationStatus}
            onChange={setOperationStatus}
            groupId="bulk-receive-operation"
            disabled={isDisabled}
          />

          {/* 부속품 상태 (선택) */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-sm font-medium">
              <Package2 className="h-4 w-4" aria-hidden="true" />
              {t('inbound.receive.accessoriesOptional')}
            </Label>
            <div role="group" aria-label={t('inbound.receive.accessoriesOptional')} className="flex gap-2">
              <AccessoriesSegmentedButton
                isActive={accessoriesStatus === 'complete'}
                tone="ok"
                onClick={() =>
                  setAccessoriesStatus((prev) => (prev === 'complete' ? undefined : 'complete'))
                }
                label={t('condition.accessoriesStatusLabels.complete')}
                icon={CheckCircle2}
                disabled={isDisabled}
              />
              <AccessoriesSegmentedButton
                isActive={accessoriesStatus === 'incomplete'}
                tone="critical"
                onClick={() =>
                  setAccessoriesStatus((prev) => (prev === 'incomplete' ? undefined : 'incomplete'))
                }
                label={t('condition.accessoriesStatusLabels.incomplete')}
                icon={AlertCircle}
                disabled={isDisabled}
              />
            </div>
          </div>

          {/* 이상 상세 — 이상 항목이 있을 때만 표시 */}
          {hasAbnormal && (
            <div className="space-y-1.5 rounded-lg border border-brand-critical/40 bg-brand-critical/5 p-3">
              <Label htmlFor="bulk-receive-abnormal-details" className="text-sm font-semibold">
                {t('inbound.receive.abnormalDetails')}{' '}
                <span className="text-brand-critical" aria-hidden="true">*</span>
              </Label>
              <Textarea
                id="bulk-receive-abnormal-details"
                rows={3}
                value={abnormalDetails}
                onChange={(e) => setAbnormalDetails(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.nativeEvent.isComposing) e.preventDefault();
                }}
                className="border-brand-critical/40 focus-visible:border-brand-critical/60 focus-visible:ring-brand-critical/40"
                disabled={isDisabled}
                aria-required="true"
                aria-describedby={validationError ? 'bulk-receive-error' : undefined}
              />
            </div>
          )}

          {/* 비고 (선택) */}
          <div className="space-y-1.5">
            <Label htmlFor="bulk-receive-notes" className="text-sm font-medium">
              {t('inbound.receive.notes')}
            </Label>
            <Textarea
              id="bulk-receive-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.nativeEvent.isComposing) e.preventDefault();
              }}
              disabled={isDisabled}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDisabled}
            style={{ minHeight: cssVar(CSS_VAR_NAMES.touchTargetMin) }}
          >
            {t('inbound.receive.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isDisabled}
            style={{ minHeight: cssVar(CSS_VAR_NAMES.touchTargetMin) }}
          >
            {isProcessing
              ? t('actions.processing')
              : t('inbound.receive.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────────────────────

function ConditionFieldGroup({
  icon: Icon,
  label,
  value,
  onChange,
  groupId,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: ConditionStatus;
  onChange: (v: ConditionStatus) => void;
  groupId: string;
  disabled: boolean;
}) {
  const t = useTranslations('checkouts');
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-sm font-medium">
        <Icon className="h-4 w-4" aria-hidden="true" />
        {label}
      </Label>
      <div role="group" aria-label={label} className="flex gap-2">
        <ConditionSegmentedButton
          id={`${groupId}-normal`}
          isActive={value === 'normal'}
          tone="ok"
          onClick={() => onChange('normal')}
          label={t('condition.conditionStatus.normal')}
          icon={CheckCircle2}
          disabled={disabled}
        />
        <ConditionSegmentedButton
          id={`${groupId}-abnormal`}
          isActive={value === 'abnormal'}
          tone="critical"
          onClick={() => onChange('abnormal')}
          label={t('condition.conditionStatus.abnormal')}
          icon={AlertCircle}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function ConditionSegmentedButton({
  id,
  isActive,
  tone,
  onClick,
  label,
  icon: Icon,
  disabled,
}: {
  id: string;
  isActive: boolean;
  tone: 'ok' | 'critical';
  onClick: () => void;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled: boolean;
}) {
  const baseInactive = 'border-border bg-card text-foreground/70 hover:bg-muted';
  const activeOk = 'border-brand-ok bg-brand-ok/10 text-brand-ok';
  const activeCritical = 'border-brand-critical bg-brand-critical/10 text-brand-critical';
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isActive}
      className={cn(
        'flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        isActive ? (tone === 'ok' ? activeOk : activeCritical) : baseInactive
      )}
      style={{ minHeight: cssVar(CSS_VAR_NAMES.touchTargetMin) }}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="label-ko">{label}</span>
    </button>
  );
}

function AccessoriesSegmentedButton({
  isActive,
  tone,
  onClick,
  label,
  icon: Icon,
  disabled,
}: {
  isActive: boolean;
  tone: 'ok' | 'critical';
  onClick: () => void;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled: boolean;
}) {
  const baseInactive = 'border-border bg-card text-foreground/70 hover:bg-muted';
  const activeOk = 'border-brand-ok bg-brand-ok/10 text-brand-ok';
  const activeCritical = 'border-brand-critical bg-brand-critical/10 text-brand-critical';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isActive}
      className={cn(
        'flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        isActive ? (tone === 'ok' ? activeOk : activeCritical) : baseInactive
      )}
      style={{ minHeight: cssVar(CSS_VAR_NAMES.touchTargetMin) }}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="label-ko">{label}</span>
    </button>
  );
}
