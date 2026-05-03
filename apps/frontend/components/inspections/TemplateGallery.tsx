'use client';

/**
 * TemplateGallery (Phase 1B-F)
 *
 * UL-QP-18 Build-Once Workflow — 첫 점검 + template 부재인 신규 장비를 위한
 * 비슷한 장비의 검증된 template 가져오기 다이얼로그.
 *
 * 자동 노출 조건 (호출자 InspectionFormDialog 책임):
 * - 첫 점검 (사용자가 다른 점검 작성 안 한 상태)
 * - template 부재 (useLatestTemplate 404)
 * - gallery 결과 ≥ 1
 * - localStorage skip 플래그 미설정
 *
 * 카드 종류:
 * - 첫 카드: "빈 양식으로 시작" (blank — 사용자가 직접 작성)
 * - 나머지: 매칭 template + 매칭 이유 chip (modelName / classificationCode)
 *
 * 접근성 (WCAG 2.2 AA):
 * - role="dialog" + aria-labelledby/describedby (Radix Dialog 자동)
 * - 카드: button semantic + aria-label에 매칭 이유 포함
 * - skip checkbox: aria-label + tab order 정상
 */

import { useId, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ClipboardList, FilePlus2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { INSPECTION_TEMPLATE_GALLERY_CARD_TOKENS } from '@/lib/design-tokens';
import type { InspectionTemplateGalleryEntry } from '@/lib/api/inspection-template-api';
import { markGallerySkipped } from '@/lib/inspection/template-gallery-skip';
import { track } from '@/lib/analytics/track';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';

interface TemplateGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Gallery 결과 — 빈 배열이면 "비슷한 양식 없음" 안내 (호출자가 사전 필터해도 OK) */
  items: InspectionTemplateGalleryEntry[];
  /** 사용자가 카드 선택 시 호출 — null이면 빈 양식 시작 */
  onSelect: (entry: InspectionTemplateGalleryEntry | null) => void;
  /** equipmentTypeId — skip 플래그 키 분리 */
  equipmentTypeId: string | null | undefined;
  /** 점검 종류 — analytics + skip 플래그 분리 */
  inspectionType: 'intermediate' | 'self';
}

export function TemplateGallery({
  open,
  onOpenChange,
  items,
  onSelect,
  equipmentTypeId,
  inspectionType,
}: TemplateGalleryProps) {
  const t = useTranslations(inspectionType === 'intermediate' ? 'calibration' : 'equipment');
  const tPrefix = inspectionType === 'intermediate' ? 'intermediateInspection' : 'selfInspection';
  const k = (suffix: string) => `${tPrefix}.gallery.${suffix}` as Parameters<typeof t>[0];

  const titleId = useId();
  const descId = useId();
  const [skipNextTime, setSkipNextTime] = useState(false);

  const handleClose = (selectedEntry: InspectionTemplateGalleryEntry | null) => {
    if (skipNextTime) {
      markGallerySkipped(equipmentTypeId, inspectionType);
    }
    track(ANALYTICS_EVENTS.GALLERY_USED, {
      inspectionType,
      matchingReason: selectedEntry?.matchReason ?? 'blank',
      skippedNextTime: skipNextTime,
      candidateCount: items.length,
    });
    onSelect(selectedEntry);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl" aria-labelledby={titleId} aria-describedby={descId}>
        <DialogHeader>
          <DialogTitle id={titleId}>{t(k('title'))}</DialogTitle>
          <DialogDescription id={descId}>{t(k('description'))}</DialogDescription>
        </DialogHeader>

        <div className={INSPECTION_TEMPLATE_GALLERY_CARD_TOKENS.grid}>
          {/* 첫 카드: 빈 양식으로 시작 */}
          <button
            type="button"
            onClick={() => handleClose(null)}
            className={INSPECTION_TEMPLATE_GALLERY_CARD_TOKENS.blankCard}
            aria-label={t(k('blankAriaLabel'))}
          >
            <FilePlus2 className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <span className={INSPECTION_TEMPLATE_GALLERY_CARD_TOKENS.cardTitle}>
              {t(k('blankCard.title'))}
            </span>
            <span className={INSPECTION_TEMPLATE_GALLERY_CARD_TOKENS.cardMeta}>
              {t(k('blankCard.description'))}
            </span>
          </button>

          {/* 매칭된 template 카드 */}
          {items.map((entry) => (
            <button
              key={entry.template.id}
              type="button"
              onClick={() => handleClose(entry)}
              className={INSPECTION_TEMPLATE_GALLERY_CARD_TOKENS.card}
              aria-label={t(k('cardAriaLabel'), {
                equipmentName: entry.equipmentName,
                version: entry.template.version,
                reason: t(k(`matchReason.${entry.matchReason}`)),
              })}
            >
              <ClipboardList className="h-5 w-5 text-brand-info" aria-hidden="true" />
              <span className={INSPECTION_TEMPLATE_GALLERY_CARD_TOKENS.cardTitle}>
                {entry.equipmentName}
              </span>
              <span className={INSPECTION_TEMPLATE_GALLERY_CARD_TOKENS.matchReasonChip}>
                {t(k(`matchReason.${entry.matchReason}`))}
              </span>
              <span className={INSPECTION_TEMPLATE_GALLERY_CARD_TOKENS.cardMeta}>
                {t(k('cardMeta'), {
                  version: entry.template.version,
                  date: entry.template.createdAt.slice(0, 10),
                })}
              </span>
            </button>
          ))}
        </div>

        {items.length === 0 && (
          <p className="text-sm text-muted-foreground" role="status">
            {t(k('empty'))}
          </p>
        )}

        {/* skip 체크박스 */}
        <div className={INSPECTION_TEMPLATE_GALLERY_CARD_TOKENS.skipCheckboxRow}>
          <Checkbox
            id="gallery-skip-next-time"
            checked={skipNextTime}
            onCheckedChange={(checked) => setSkipNextTime(checked === true)}
          />
          <Label htmlFor="gallery-skip-next-time" className="cursor-pointer">
            {t(k('skipNextTime'))}
          </Label>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(null)}
            aria-label={t(k('cancelAriaLabel'))}
          >
            {t(k('cancel'))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
