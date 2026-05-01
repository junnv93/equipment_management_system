'use client';

/**
 * SoftForkDialog (Phase 1B-E)
 *
 * UL-QP-18 Build-Once Workflow — 사용자가 점검 작성 중 *표 구조*를 변경한 경우,
 * 제출 직전에 노출되어 *명시적 의사결정*을 요구.
 *
 * LIMS 표준 (LabWare / Veeva Vault / Beamex CMX): 양식 변경은 *암묵적 적용 금지*.
 * 사용자가 다음 3가지 중 선택:
 * - this_only: 이번 점검만 변경된 구조 사용. template은 그대로.
 * - apply_forward: 다음 점검부터도 변경 적용. template version+1 (admin 권한 필요).
 * - cancel: 폼 편집 복귀. 제출 안 함.
 *
 * 권한 분기:
 * - admin/시험소장 (Permission.MANAGE_INSPECTION_TEMPLATE 보유): 3옵션 모두 활성
 * - 일반 사용자: apply_forward 옵션 disabled + 사유 표시 (메모리: "Disabled + 사유 우선")
 *
 * 접근성 (WCAG 2.2 AA — contract M-12.1, M-12.2):
 * - role="dialog" + aria-labelledby/describedby (Radix Dialog 자동)
 * - focus trap (Radix Dialog 자동) + ESC 닫기 (cancel 동등)
 * - RadioGroup keyboard navigation (Radix RadioGroup 자동 — 화살표 키)
 * - 라디오 옵션 aria-labelledby (각 옵션의 title id 참조)
 */

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Minus, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  INSPECTION_TEMPLATE_DIFF_TOKENS,
  INSPECTION_TEMPLATE_FORK_RADIO_TOKENS,
} from '@/lib/design-tokens';
import { ForkChoiceEnum, type ForkChoice, type StructureDiff } from '@equipment-management/schemas';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics/track';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';

interface SoftForkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 현재 폼 vs template structure 비교 결과 */
  diff: StructureDiff;
  /** 사용자가 apply_forward 권한 보유 여부 (Permission.MANAGE_INSPECTION_TEMPLATE) */
  canApplyForward: boolean;
  /** 사용자 선택 콜백 — cancel 시 onOpenChange(false) 별도 호출 권장 */
  onChoice: (choice: ForkChoice) => void;
  /** mutation 진행 중 — submit 버튼 disabled */
  isProcessing: boolean;
  /** 점검 종류 — analytics + i18n namespace 분기 */
  inspectionType: 'intermediate' | 'self';
}

export function SoftForkDialog({
  open,
  onOpenChange,
  diff,
  canApplyForward,
  onChoice,
  isProcessing,
  inspectionType,
}: SoftForkDialogProps) {
  const t = useTranslations(inspectionType === 'intermediate' ? 'calibration' : 'equipment');
  const tPrefix = inspectionType === 'intermediate' ? 'intermediateInspection' : 'selfInspection';
  // ⚠️ Type-checked path keys for next-intl `t()` — Parameters<typeof t>[0]로 캐스트 회피
  const k = (suffix: string) => `${tPrefix}.softFork.${suffix}` as Parameters<typeof t>[0];

  const titleId = useId();
  const descId = useId();

  // Default 선택: 권한 있으면 apply_forward 권장 (양식 통제 표준), 없으면 this_only
  const [selectedChoice, setSelectedChoice] = useState<ForkChoice>(
    canApplyForward ? 'apply_forward' : 'this_only'
  );
  const [showDetail, setShowDetail] = useState(false);

  const addedCount = diff.itemsAdded.length + diff.sectionsAdded.length;
  const removedCount = diff.itemsRemoved.length + diff.sectionsRemoved.length;
  const changedCount = diff.itemsChanged.length + diff.sectionsTypeChanged.length;

  const handleConfirm = () => {
    track(ANALYTICS_EVENTS.INSPECTION_SOFT_FORK, {
      inspectionType,
      choice: selectedChoice,
      itemsAdded: diff.itemsAdded.length,
      itemsRemoved: diff.itemsRemoved.length,
      itemsChanged: diff.itemsChanged.length,
      sectionsAdded: diff.sectionsAdded.length,
      sectionsRemoved: diff.sectionsRemoved.length,
      sectionsTypeChanged: diff.sectionsTypeChanged.length,
    });
    onChoice(selectedChoice);
  };

  const handleCancel = () => {
    track(ANALYTICS_EVENTS.INSPECTION_SOFT_FORK, {
      inspectionType,
      choice: 'cancel',
      itemsAdded: diff.itemsAdded.length,
      itemsRemoved: diff.itemsRemoved.length,
      itemsChanged: diff.itemsChanged.length,
      sectionsAdded: diff.sectionsAdded.length,
      sectionsRemoved: diff.sectionsRemoved.length,
      sectionsTypeChanged: diff.sectionsTypeChanged.length,
    });
    onChoice('cancel');
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isProcessing) handleCancel();
      }}
    >
      <DialogContent
        className="max-w-xl"
        aria-labelledby={titleId}
        aria-describedby={descId}
        // ESC = cancel (focus trap은 Radix가 자동 제공)
        onEscapeKeyDown={(e) => {
          if (isProcessing) {
            e.preventDefault();
            return;
          }
          // Default behavior triggers onOpenChange(false) → handleCancel
        }}
      >
        <DialogHeader>
          <DialogTitle id={titleId}>{t(k('title'))}</DialogTitle>
          <DialogDescription id={descId}>{t(k('description'))}</DialogDescription>
        </DialogHeader>

        {/* Diff 요약 — 추가/삭제/변경 카운트 chip */}
        <div className={INSPECTION_TEMPLATE_DIFF_TOKENS.summary} role="status" aria-live="polite">
          {addedCount > 0 && (
            <span className={INSPECTION_TEMPLATE_DIFF_TOKENS.added.badge}>
              <Plus className={INSPECTION_TEMPLATE_DIFF_TOKENS.added.icon} aria-hidden="true" />
              {t(k('diff.addedSummary'), { count: addedCount })}
            </span>
          )}
          {removedCount > 0 && (
            <span className={INSPECTION_TEMPLATE_DIFF_TOKENS.removed.badge}>
              <Minus className={INSPECTION_TEMPLATE_DIFF_TOKENS.removed.icon} aria-hidden="true" />
              {t(k('diff.removedSummary'), { count: removedCount })}
            </span>
          )}
          {changedCount > 0 && (
            <span className={INSPECTION_TEMPLATE_DIFF_TOKENS.changed.badge}>
              <RefreshCw
                className={INSPECTION_TEMPLATE_DIFF_TOKENS.changed.icon}
                aria-hidden="true"
              />
              {t(k('diff.changedSummary'), { count: changedCount })}
            </span>
          )}
        </div>

        {/* 자세히 보기 토글 — 큰 diff에서 시각 노이즈 회피 */}
        {(addedCount > 0 || removedCount > 0 || changedCount > 0) && (
          <button
            type="button"
            onClick={() => setShowDetail((s) => !s)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            aria-expanded={showDetail}
            aria-controls="soft-fork-diff-detail"
          >
            {showDetail ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {t(k(showDetail ? 'diff.hideDetail' : 'diff.showDetail'))}
          </button>
        )}

        {showDetail && (
          <div
            id="soft-fork-diff-detail"
            className={INSPECTION_TEMPLATE_DIFF_TOKENS.detailContainer}
          >
            {diff.itemsAdded.map((name) => (
              <div key={`ia-${name}`} className={INSPECTION_TEMPLATE_DIFF_TOKENS.detailRow}>
                <Plus
                  className={cn(
                    INSPECTION_TEMPLATE_DIFF_TOKENS.added.icon,
                    INSPECTION_TEMPLATE_DIFF_TOKENS.added.text
                  )}
                  aria-hidden="true"
                />
                <span>{t(k('diff.itemAdded'), { name })}</span>
              </div>
            ))}
            {diff.itemsRemoved.map((name) => (
              <div key={`ir-${name}`} className={INSPECTION_TEMPLATE_DIFF_TOKENS.detailRow}>
                <Minus
                  className={cn(
                    INSPECTION_TEMPLATE_DIFF_TOKENS.removed.icon,
                    INSPECTION_TEMPLATE_DIFF_TOKENS.removed.text
                  )}
                  aria-hidden="true"
                />
                <span>{t(k('diff.itemRemoved'), { name })}</span>
              </div>
            ))}
            {diff.itemsChanged.map((c) => (
              <div key={`ic-${c.checkItem}`} className={INSPECTION_TEMPLATE_DIFF_TOKENS.detailRow}>
                <RefreshCw
                  className={cn(
                    INSPECTION_TEMPLATE_DIFF_TOKENS.changed.icon,
                    INSPECTION_TEMPLATE_DIFF_TOKENS.changed.text
                  )}
                  aria-hidden="true"
                />
                <span>{t(k('diff.itemChanged'), { name: c.checkItem })}</span>
              </div>
            ))}
            {diff.sectionsAdded.map((s) => (
              <div key={`sa-${s.sortOrder}`} className={INSPECTION_TEMPLATE_DIFF_TOKENS.detailRow}>
                <Plus
                  className={cn(
                    INSPECTION_TEMPLATE_DIFF_TOKENS.added.icon,
                    INSPECTION_TEMPLATE_DIFF_TOKENS.added.text
                  )}
                  aria-hidden="true"
                />
                <span>
                  {t(k('diff.sectionAdded'), {
                    type: s.sectionType,
                    title: s.title ?? '',
                  })}
                </span>
              </div>
            ))}
            {diff.sectionsRemoved.map((s) => (
              <div key={`sr-${s.sortOrder}`} className={INSPECTION_TEMPLATE_DIFF_TOKENS.detailRow}>
                <Minus
                  className={cn(
                    INSPECTION_TEMPLATE_DIFF_TOKENS.removed.icon,
                    INSPECTION_TEMPLATE_DIFF_TOKENS.removed.text
                  )}
                  aria-hidden="true"
                />
                <span>
                  {t(k('diff.sectionRemoved'), {
                    type: s.sectionType,
                    title: s.title ?? '',
                  })}
                </span>
              </div>
            ))}
            {diff.sectionsTypeChanged.map((s) => (
              <div key={`stc-${s.sortOrder}`} className={INSPECTION_TEMPLATE_DIFF_TOKENS.detailRow}>
                <RefreshCw
                  className={cn(
                    INSPECTION_TEMPLATE_DIFF_TOKENS.changed.icon,
                    INSPECTION_TEMPLATE_DIFF_TOKENS.changed.text
                  )}
                  aria-hidden="true"
                />
                <span>
                  {t(k('diff.sectionTypeChanged'), {
                    typeBefore: s.typeBefore,
                    typeAfter: s.typeAfter,
                  })}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 3-radio 선택 */}
        <RadioGroup
          value={selectedChoice}
          onValueChange={(v) => {
            const parsed = ForkChoiceEnum.safeParse(v);
            if (parsed.success) setSelectedChoice(parsed.data);
          }}
          aria-labelledby={titleId}
          className="gap-3"
        >
          {/* this_only */}
          <ForkRadioOption
            value="this_only"
            titleKey={t(k('option.thisOnly.title'))}
            descKey={t(k('option.thisOnly.description'))}
            isSelected={selectedChoice === 'this_only'}
          />

          {/* apply_forward — 권한 없으면 disabled + 사유 */}
          <ForkRadioOption
            value="apply_forward"
            titleKey={t(k('option.applyForward.title'))}
            descKey={
              canApplyForward
                ? t(k('option.applyForward.description'))
                : t(k('option.applyForward.descriptionDisabled'))
            }
            isSelected={selectedChoice === 'apply_forward'}
            disabled={!canApplyForward}
            disabledIcon={!canApplyForward}
          />
        </RadioGroup>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isProcessing}
            aria-label={t(k('cancelAriaLabel'))}
          >
            {t(k('cancel'))}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            loading={isProcessing}
            aria-label={t(k('confirmAriaLabel'))}
          >
            {t(k('confirm'))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ForkRadioOptionProps {
  value: ForkChoice;
  titleKey: string;
  descKey: string;
  isSelected: boolean;
  disabled?: boolean;
  disabledIcon?: boolean;
}

function ForkRadioOption({
  value,
  titleKey,
  descKey,
  isSelected,
  disabled = false,
  disabledIcon = false,
}: ForkRadioOptionProps) {
  const titleId = useId();
  const descId = useId();
  return (
    <Label
      htmlFor={`fork-${value}`}
      className={cn(
        INSPECTION_TEMPLATE_FORK_RADIO_TOKENS.optionCard,
        disabled && 'cursor-not-allowed opacity-60'
      )}
      data-state={isSelected ? 'checked' : 'unchecked'}
    >
      <RadioGroupItem
        value={value}
        id={`fork-${value}`}
        disabled={disabled}
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="mt-0.5"
      />
      <div className="flex-1">
        <div className={INSPECTION_TEMPLATE_FORK_RADIO_TOKENS.optionHeader}>
          <span id={titleId} className={INSPECTION_TEMPLATE_FORK_RADIO_TOKENS.optionTitle}>
            {titleKey}
          </span>
          {disabledIcon && (
            <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
        <p id={descId} className={INSPECTION_TEMPLATE_FORK_RADIO_TOKENS.optionDescription}>
          {descKey}
        </p>
      </div>
    </Label>
  );
}
