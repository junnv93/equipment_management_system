'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { isNotFoundError } from '@/lib/api/error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { queryKeys } from '@/lib/api/query-config';
import equipmentApi from '@/lib/api/equipment-api';
import type { CreateInspectionDto, CreateResultSectionDto } from '@/lib/api/calibration-api';
import type { InspectionJudgment, InspectionResult } from '@equipment-management/schemas';
import { INSPECTION_SPACING, INSPECTION_FORM_LAYOUT } from '@/lib/design-tokens';
import { describeStructureCounts } from '@/lib/inspection/template-utils';
import { templateStructureToPrefill } from '@/lib/inspection/template-source';
import { InspectionFormProvider, useInspectionForm } from '@/lib/inspection/form-context';
import { useFormDialogClose } from '@/hooks/use-form-dialog-close';
import { useLatestTemplate, useTemplateGallery } from '@/hooks/use-inspection-template';
import { useInspectionFork } from '@/hooks/use-inspection-fork';
import type { InspectionTemplateGalleryEntry } from '@/lib/api/inspection-template-api';
import { track } from '@/lib/analytics/track';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
import { getFeatureFlag } from '@/lib/feature-flags';
import { isGallerySkipped } from '@/lib/inspection/template-gallery-skip';
import { SoftForkDialog } from './SoftForkDialog';
import { TemplateGallery } from './TemplateGallery';
import type { Equipment } from '@/lib/api/equipment-api';
import InlineResultSectionsEditor from './InlineResultSectionsEditor';
import { InspectionDialogHeader } from './sections/InspectionDialogHeader';
import { InspectionPrefillNotices } from './sections/InspectionPrefillNotices';
import { InspectionBasicInfoSection } from './sections/InspectionBasicInfoSection';
import { InspectionItemsSection } from './sections/InspectionItemsSection';
import { InspectionConfirmDialogs } from './sections/InspectionConfirmDialogs';
import { MeasurementEquipmentSection } from './sections/MeasurementEquipmentSection';

interface InspectionItemForm {
  checkItem: string;
  checkCriteria: string;
  checkResult: string;
  judgment: InspectionJudgment | '';
}

interface MeasurementEquipmentForm {
  equipmentId: string;
  equipmentName: string;
  managementNumber: string;
  calibrationDate: string;
}

interface InspectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string;
  equipmentName?: string;
  calibrationId?: string;
}

function deriveCalibrationValidityPeriod(
  calibrationCycleMonths: number | string | null | undefined
): string | null {
  if (!calibrationCycleMonths) return null;
  const months = Number(calibrationCycleMonths);
  if (!months || months <= 0) return null;
  if (months % 12 === 0) return `${months / 12}년`;
  return `${months}개월`;
}

/**
 * 외부 export — Provider wrap.
 * Inner는 useInspectionForm() Consumer (Context state 접근).
 * open=false 시 Inner의 useEffect가 resetAll() 호출 → Context state auto-reset.
 */
export default function InspectionFormDialog(props: InspectionFormDialogProps) {
  return (
    <InspectionFormProvider>
      <InspectionFormDialogInner {...props} />
    </InspectionFormProvider>
  );
}

function InspectionFormDialogInner({
  open,
  onOpenChange,
  equipmentId,
  equipmentName,
  calibrationId,
}: InspectionFormDialogProps) {
  const t = useTranslations('calibration');
  const isInspectionTemplateEnabled = getFeatureFlag('INSPECTION_TEMPLATE');

  const inspectionForm = useInspectionForm();
  const {
    state: inspectionFormState,
    applyTemplatePrefill,
    resetLatestPrefill,
    resetAll,
    dismissBanner,
    addMasterPrefilledField,
    removeMasterPrefilledField,
  } = inspectionForm;
  const previousInspectionApplied = inspectionFormState.latest.applied;
  const prefillCounts = inspectionFormState.latest.counts;
  const prefillBannerDismissed = inspectionFormState.latest.bannerDismissed;
  const currentTemplate = inspectionFormState.template;

  const [inspectionDate, setInspectionDate] = useState('');
  const [inspectionCycle, setInspectionCycle] = useState('');
  const [calibrationValidityPeriod, setCalibrationValidityPeriod] = useState('');
  const [overallResult, setOverallResult] = useState<InspectionResult | ''>('');
  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState<InspectionItemForm[]>([]);
  const [resultSections, setResultSections] = useState<CreateResultSectionDto[]>([]);
  const [measurementEquipment, setMeasurementEquipment] = useState<MeasurementEquipmentForm[]>([]);
  const [usePreviousInspection, setUsePreviousInspection] = useState(true);
  const [pendingToggleOffConfirm, setPendingToggleOffConfirm] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [hasShownGallery, setHasShownGallery] = useState(false);

  const close = useFormDialogClose({
    isDirty: () =>
      inspectionDate !== '' ||
      items.length > 0 ||
      resultSections.length > 0 ||
      measurementEquipment.length > 0 ||
      overallResult !== '' ||
      remarks !== '',
    onConfirmClose: () => {
      track(ANALYTICS_EVENTS.INSPECTION_FORM_CLOSE_GUARDED, {
        dialog: 'inspection_form',
        action: 'discard',
        itemCount: items.length,
        sectionCount: resultSections.length,
      });
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (!open) resetAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- self-audit-exception: open=false 트리거 single shot
  }, [open]);

  const {
    data: equipment,
    isLoading: isEquipmentLoading,
    isError: isEquipmentError,
  } = useQuery({
    queryKey: queryKeys.equipment.detail(equipmentId),
    queryFn: () => equipmentApi.getEquipment(equipmentId),
    enabled: open,
  });

  const {
    data: latestTemplate,
    isError: isTemplateError,
    error: templateError,
  } = useLatestTemplate(equipmentId, 'intermediate', {
    enabled: open && isInspectionTemplateEnabled,
  });
  const isTemplateMissing =
    isInspectionTemplateEnabled && isTemplateError && isNotFoundError(templateError);

  const galleryEnabled =
    open &&
    isInspectionTemplateEnabled &&
    isTemplateMissing &&
    !hasShownGallery &&
    !!equipment &&
    !isGallerySkipped(equipment.equipmentType, 'intermediate');
  const { data: galleryData } = useTemplateGallery(
    {
      inspectionType: 'intermediate',
      modelName: equipment?.modelName ?? undefined,
      classificationCode: equipment?.classificationCode ?? undefined,
    },
    { enabled: galleryEnabled }
  );

  useEffect(() => {
    if (!galleryEnabled) return;
    if (!galleryData) return;
    if (galleryData.items.length === 0) {
      setHasShownGallery(true);
      return;
    }
    setGalleryOpen(true);
    setHasShownGallery(true);
  }, [galleryEnabled, galleryData]);

  useEffect(() => {
    if (!open || !equipment) return;
    if (!inspectionCycle) {
      if (equipment.intermediateCheckCycle) {
        setInspectionCycle(`${equipment.intermediateCheckCycle}개월`);
        addMasterPrefilledField('inspectionCycle');
      } else if (equipment.calibrationCycle) {
        const halfCycle = Math.round(Number(equipment.calibrationCycle) / 2);
        setInspectionCycle(`${halfCycle}개월`);
        addMasterPrefilledField('inspectionCycle');
      }
    }
    if (!calibrationValidityPeriod) {
      const derived = deriveCalibrationValidityPeriod(equipment.calibrationCycle);
      if (derived) {
        setCalibrationValidityPeriod(derived);
        addMasterPrefilledField('calibrationValidityPeriod');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- self-audit-exception: open/equipment 변경 시만 prefill 재실행
  }, [open, equipment]);

  const templatePrefill = useMemo(() => {
    if (!isInspectionTemplateEnabled) return null;
    if (!latestTemplate) return null;
    return templateStructureToPrefill(latestTemplate.structure);
  }, [isInspectionTemplateEnabled, latestTemplate]);

  useEffect(() => {
    if (!open || !usePreviousInspection || previousInspectionApplied) return;
    if (!latestTemplate || !templatePrefill) return;
    if (templatePrefill.items.length === 0 && templatePrefill.resultSections.length === 0) return;
    if (items.length > 0 || resultSections.length > 0) return;

    setItems(templatePrefill.items);
    setResultSections(templatePrefill.resultSections);
    applyTemplatePrefill({
      template: {
        id: latestTemplate.id,
        version: latestTemplate.version,
        createdAt: latestTemplate.createdAt,
        createdByName: latestTemplate.createdByName,
      },
      counts: templatePrefill.counts,
      sortOrders: templatePrefill.sortOrders,
    });
    track(ANALYTICS_EVENTS.INSPECTION_TEMPLATE_USED, {
      inspectionType: 'intermediate',
      templateVersion: latestTemplate.version,
      tableCount: templatePrefill.counts.tables,
      photoCount: templatePrefill.counts.photos,
      textCount: templatePrefill.counts.texts,
      itemCount: templatePrefill.items.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- self-audit-exception: template prefill은 체크박스·template fetch 결과 변경 시만 실행
  }, [open, usePreviousInspection, previousInspectionApplied, templatePrefill, latestTemplate]);

  const resetForm = () => {
    setInspectionDate('');
    setInspectionCycle('');
    setCalibrationValidityPeriod('');
    setOverallResult('');
    setRemarks('');
    setItems([]);
    setResultSections([]);
    setMeasurementEquipment([]);
    setUsePreviousInspection(true);
    resetAll();
  };

  const prefillBannerSummary = (() => {
    if (!prefillCounts) return null;
    const desc = describeStructureCounts(prefillCounts);
    if (!desc.hasAny) return null;
    const partKey = {
      tables: 'intermediateInspection.prefill.banner.partTable',
      photos: 'intermediateInspection.prefill.banner.partPhoto',
      texts: 'intermediateInspection.prefill.banner.partText',
    } as const;
    return desc.parts
      .map((p) =>
        t(partKey[p.key] as Parameters<typeof t>[0], { count: p.count } as Record<string, number>)
      )
      .join(' · ');
  })();

  const showNoSourceNotice =
    open && isTemplateMissing && usePreviousInspection && !previousInspectionApplied;

  const hasInvalidItems = items.some(
    (item) => !item.checkItem.trim() || !item.checkCriteria.trim()
  );

  const buildDto = (): CreateInspectionDto => ({
    inspectionDate,
    classification: 'calibrated',
    ...(inspectionCycle ? { inspectionCycle } : {}),
    ...(calibrationValidityPeriod ? { calibrationValidityPeriod } : {}),
    ...(overallResult ? { overallResult } : {}),
    ...(remarks ? { remarks } : {}),
    ...(items.length > 0
      ? {
          items: items.map((item, idx) => ({
            itemNumber: idx + 1,
            checkItem: item.checkItem,
            checkCriteria: item.checkCriteria,
            ...(item.checkResult ? { checkResult: item.checkResult } : {}),
            ...(item.judgment ? { judgment: item.judgment as InspectionJudgment } : {}),
          })),
        }
      : {}),
    ...(resultSections.length > 0 ? { resultSections } : {}),
    ...(measurementEquipment.length > 0
      ? {
          measurementEquipment: measurementEquipment.map((me) => ({
            equipmentId: me.equipmentId,
            ...(me.calibrationDate ? { calibrationDate: me.calibrationDate } : {}),
          })),
        }
      : {}),
  });

  const {
    handleSubmit,
    handleForkChoice,
    softForkOpen,
    setSoftForkOpen,
    softForkDiff,
    canApplyForward,
    isCreatePending,
  } = useInspectionFork({
    equipmentId,
    calibrationId,
    isInspectionTemplateEnabled,
    latestTemplate: latestTemplate ?? null,
    items,
    resultSections,
    hasInvalidItems,
    buildDto,
    onSubmitSuccess: () => {
      close.markCommitted();
      resetForm();
      onOpenChange(false);
    },
    onForceClose: () => {
      close.markCommitted();
      onOpenChange(false);
    },
  });

  const performToggleOffReset = () => {
    setItems([]);
    setResultSections([]);
    setUsePreviousInspection(false);
    resetLatestPrefill();
  };

  const handleTogglePreviousInspection = (checked: boolean) => {
    if (checked) {
      setUsePreviousInspection(true);
      return;
    }
    if (previousInspectionApplied && (items.length > 0 || resultSections.length > 0)) {
      setPendingToggleOffConfirm(true);
      return;
    }
    setUsePreviousInspection(false);
    if (previousInspectionApplied) performToggleOffReset();
  };

  const confirmToggleOff = () => {
    performToggleOffReset();
    setPendingToggleOffConfirm(false);
    track(ANALYTICS_EVENTS.INSPECTION_PREFILL_TOGGLE_OFF, {
      inspectionType: 'intermediate',
      itemCount: items.length,
      sectionCount: resultSections.length,
    });
  };

  const handleAddMeasurementEquipment = (equipmentId: string | undefined) => {
    if (!equipmentId) return;
    if (measurementEquipment.some((me) => me.equipmentId === equipmentId)) return;
    equipmentApi
      .getEquipment(equipmentId)
      .then((eq: Equipment) => {
        setMeasurementEquipment((prev) => [
          ...prev,
          {
            equipmentId: String(eq.id),
            equipmentName: eq.name,
            managementNumber: eq.managementNumber ?? '',
            calibrationDate: eq.lastCalibrationDate
              ? String(eq.lastCalibrationDate).slice(0, 10)
              : '',
          },
        ]);
      })
      .catch(() => {
        // toast는 MeasurementEquipmentSection에서 처리 불가 — 여기서 직접
      });
  };

  const handleGallerySelect = (entry: InspectionTemplateGalleryEntry | null) => {
    if (!entry) return;
    const prefill = templateStructureToPrefill(entry.template.structure);
    setItems(prefill.items);
    setResultSections(prefill.resultSections);
    applyTemplatePrefill({
      template: {
        id: entry.template.id,
        version: 1,
        createdAt: new Date().toISOString(),
        createdByName: null,
      },
      counts: prefill.counts,
      sortOrders: prefill.sortOrders,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          close.requestClose();
        } else {
          onOpenChange(newOpen);
        }
      }}
    >
      <DialogContent
        className="max-h-[90vh] max-w-3xl overflow-y-auto overscroll-contain"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          close.requestClose();
        }}
      >
        <InspectionDialogHeader
          equipmentName={equipmentName}
          isInspectionTemplateEnabled={isInspectionTemplateEnabled}
          currentTemplate={currentTemplate}
          isTemplateMissing={isTemplateMissing}
        />

        <InspectionPrefillNotices
          previousInspectionApplied={previousInspectionApplied}
          prefillBannerSummary={prefillBannerSummary}
          prefillBannerDismissed={prefillBannerDismissed}
          sourceInspectionDate={inspectionFormState.latest.sourceInspectionDate}
          showNoSourceNotice={showNoSourceNotice}
          onDismissBanner={dismissBanner}
        />

        <div className={INSPECTION_SPACING.section}>
          <InspectionBasicInfoSection
            isEquipmentError={isEquipmentError}
            isEquipmentLoading={isEquipmentLoading}
            inspectionDate={inspectionDate}
            onInspectionDateChange={setInspectionDate}
            overallResult={overallResult}
            onOverallResultChange={setOverallResult}
            inspectionCycle={inspectionCycle}
            onInspectionCycleChange={setInspectionCycle}
            calibrationValidityPeriod={calibrationValidityPeriod}
            onCalibrationValidityPeriodChange={setCalibrationValidityPeriod}
            onRemoveMasterPrefilled={removeMasterPrefilledField}
          />

          <InspectionItemsSection
            items={items}
            onAddItem={() =>
              setItems((prev) => [
                ...prev,
                { checkItem: '', checkCriteria: '', checkResult: '', judgment: '' },
              ])
            }
            onRemoveItem={(index) => setItems((prev) => prev.filter((_, i) => i !== index))}
            onItemChange={(index, field, value) =>
              setItems((prev) =>
                prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
              )
            }
            onAddPresetItem={(checkItem, checkCriteria) => {
              setItems((prev) => [
                ...prev,
                { checkItem, checkCriteria, checkResult: '', judgment: '' },
              ]);
              if (checkItem) {
                setResultSections((prev) => [
                  ...prev,
                  { sortOrder: prev.length, sectionType: 'title', title: checkItem },
                ]);
              }
            }}
            templatePrefill={templatePrefill}
            usePreviousInspection={usePreviousInspection}
            previousInspectionApplied={previousInspectionApplied}
            onTogglePreviousInspection={handleTogglePreviousInspection}
          />

          <MeasurementEquipmentSection
            measurementEquipment={measurementEquipment}
            onAdd={handleAddMeasurementEquipment}
            onRemove={(index) =>
              setMeasurementEquipment((prev) => prev.filter((_, i) => i !== index))
            }
          />

          <div className={INSPECTION_SPACING.field}>
            <Label htmlFor="intermediate-inspection-remarks">
              {t('intermediateInspection.remarks')}
            </Label>
            <Textarea
              id="intermediate-inspection-remarks"
              name="intermediateInspectionRemarks"
              autoComplete="off"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={t('intermediateInspection.remarksPlaceholder')}
              rows={3}
            />
          </div>

          <Separator className={INSPECTION_SPACING.divider} />
          <InlineResultSectionsEditor sections={resultSections} onChange={setResultSections} />
        </div>

        <DialogFooter className={INSPECTION_FORM_LAYOUT.stickyFooter}>
          <Button variant="outline" onClick={close.requestClose}>
            {t('intermediateInspection.cancel')}
          </Button>
          <Button
            onClick={() => handleSubmit(inspectionDate)}
            disabled={!inspectionDate || hasInvalidItems || isCreatePending || isEquipmentError}
            loading={isCreatePending}
          >
            {isCreatePending
              ? t('intermediateInspection.saving')
              : t('intermediateInspection.save')}
          </Button>
        </DialogFooter>
      </DialogContent>

      <InspectionConfirmDialogs
        closeConfirmOpen={close.confirmOpen}
        onCloseCancel={close.cancel}
        onCloseConfirm={close.confirm}
        pendingToggleOffConfirm={pendingToggleOffConfirm}
        onCancelToggleOff={() => {
          setUsePreviousInspection(true);
          setPendingToggleOffConfirm(false);
        }}
        onConfirmToggleOff={confirmToggleOff}
        itemCount={items.length}
        sectionCount={resultSections.length}
      />

      {isInspectionTemplateEnabled && softForkDiff && (
        <SoftForkDialog
          open={softForkOpen}
          onOpenChange={setSoftForkOpen}
          diff={softForkDiff}
          canApplyForward={canApplyForward}
          onChoice={handleForkChoice}
          isProcessing={isCreatePending}
          inspectionType="intermediate"
        />
      )}

      {isInspectionTemplateEnabled && galleryData && (
        <TemplateGallery
          open={galleryOpen}
          onOpenChange={setGalleryOpen}
          items={galleryData.items}
          onSelect={handleGallerySelect}
          equipmentTypeId={equipment?.equipmentType}
          inspectionType="intermediate"
        />
      )}
    </Dialog>
  );
}
