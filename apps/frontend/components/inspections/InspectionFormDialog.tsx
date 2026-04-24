'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isConflictError } from '@/lib/api/error';
import { EquipmentErrorCode, getLocalizedErrorInfo } from '@/lib/errors/equipment-errors';
import { Plus, Trash2, Info, ClipboardList, Wrench, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormNumberBadge } from '@/components/form-templates/FormNumberBadge';
import { FORM_CATALOG } from '@equipment-management/shared-constants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { queryKeys } from '@/lib/api/query-config';
import calibrationApi from '@/lib/api/calibration-api';
import equipmentApi from '@/lib/api/equipment-api';
import type { CreateInspectionDto, CreateResultSectionDto } from '@/lib/api/calibration-api';
import type { InspectionJudgment, InspectionResult } from '@equipment-management/schemas';
import {
  INSPECTION_SPACING,
  INSPECTION_ITEM_CARD,
  INSPECTION_EMPTY_STATE,
  INSPECTION_PREFILL,
  getJudgmentCardClasses,
  ANIMATION_PRESETS,
} from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { EquipmentCombobox } from '@/components/ui/equipment-combobox';
import type { Equipment } from '@/lib/api/equipment-api';
import CheckItemPresetSelect from './CheckItemPresetSelect';
import InlineResultSectionsEditor from './InlineResultSectionsEditor';

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

/**
 * 교정유효기간을 교정주기(개월)에서 파생
 * calibrationCycle은 개월 단위 → "N년" 또는 "N개월" 형식으로 변환
 */
function deriveCalibrationValidityPeriod(
  calibrationCycleMonths: number | string | null | undefined
): string | null {
  if (!calibrationCycleMonths) return null;
  const months = Number(calibrationCycleMonths);
  if (!months || months <= 0) return null;
  if (months % 12 === 0) return `${months / 12}년`;
  return `${months}개월`;
}

export default function InspectionFormDialog({
  open,
  onOpenChange,
  equipmentId,
  equipmentName,
  calibrationId,
}: InspectionFormDialogProps) {
  const t = useTranslations('calibration');
  const tEquip = useTranslations('equipment');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state — classification은 항상 "교정기기"로 고정 (중간점검은 교정기기 전용)
  const [inspectionDate, setInspectionDate] = useState('');
  const [inspectionCycle, setInspectionCycle] = useState('');
  const [calibrationValidityPeriod, setCalibrationValidityPeriod] = useState('');
  const [overallResult, setOverallResult] = useState<InspectionResult | ''>('');
  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState<InspectionItemForm[]>([]);
  const [resultSections, setResultSections] = useState<CreateResultSectionDto[]>([]);
  const [measurementEquipment, setMeasurementEquipment] = useState<MeasurementEquipmentForm[]>([]);
  const [prefilled, setPrefilled] = useState<Record<string, boolean>>({});
  /**
   * 직전 점검 prefill 사용 여부 (기본 on).
   * 사용자가 체크박스로 off 하면 복사된 items/sections 를 초기화.
   */
  const [usePreviousInspection, setUsePreviousInspection] = useState(true);
  /** 이번 dialog 세션에서 직전 점검 prefill 이 이미 적용됐는지 — 재적용 방지 */
  const [previousInspectionApplied, setPreviousInspectionApplied] = useState(false);

  // Fetch equipment data for prefill
  const {
    data: equipment,
    isLoading: isEquipmentLoading,
    isError: isEquipmentError,
  } = useQuery({
    queryKey: queryKeys.equipment.detail(equipmentId),
    queryFn: () => equipmentApi.getEquipment(equipmentId),
    enabled: open,
  });

  /**
   * 장비별 직전 "승인 완료된" 점검 조회.
   *
   * 승인 상태(`approvalStatus === 'approved'`) 인 점검만 prefill 소스로 사용한다.
   * draft / pending / reviewed / rejected 는 아직 검증되지 않았거나 반려된 상태라
   * 신뢰할 수 없는 구조를 복사할 위험이 있음.
   *
   * 백엔드는 DESC createdAt 로 정렬 — 앞에서부터 approved 인 첫 번째 항목이
   * 가장 최근 승인된 점검이다. 같은 쿼리 결과를 재사용 (React Query 캐시 공유).
   */
  const { data: previousInspections } = useQuery({
    queryKey: queryKeys.equipment.intermediateInspections(equipmentId),
    queryFn: () => calibrationApi.intermediateInspections.listByEquipment(equipmentId),
    enabled: open,
  });
  const latestInspectionId = previousInspections?.find(
    (ins) => ins.approvalStatus === 'approved'
  )?.id;
  const { data: latestInspection } = useQuery({
    queryKey: latestInspectionId
      ? queryKeys.intermediateInspections.detail(latestInspectionId)
      : ['intermediate-inspections', 'detail', 'disabled'],
    queryFn: () =>
      latestInspectionId
        ? calibrationApi.intermediateInspections.detail(latestInspectionId)
        : Promise.resolve(null),
    enabled: open && !!latestInspectionId,
  });

  // Prefill from equipment master data when dialog opens
  useEffect(() => {
    if (!open || !equipment) return;

    const newPrefilled: Record<string, boolean> = {};

    // 점검주기: 중간점검 주기 (intermediateCheckCycle) 사용, fallback으로 교정주기의 절반
    if (!inspectionCycle) {
      if (equipment.intermediateCheckCycle) {
        setInspectionCycle(`${equipment.intermediateCheckCycle}개월`);
        newPrefilled.inspectionCycle = true;
      } else if (equipment.calibrationCycle) {
        const halfCycle = Math.round(Number(equipment.calibrationCycle) / 2);
        setInspectionCycle(`${halfCycle}개월`);
        newPrefilled.inspectionCycle = true;
      }
    }

    // 교정유효기간: calibrationCycle에서 자동 파생, 수정 가능
    if (!calibrationValidityPeriod) {
      const derived = deriveCalibrationValidityPeriod(equipment.calibrationCycle);
      if (derived) {
        setCalibrationValidityPeriod(derived);
        newPrefilled.calibrationValidityPeriod = true;
      }
    }

    setPrefilled((prev) => ({ ...prev, ...newPrefilled }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- self-audit-exception: open/equipment 변경 시만 prefill 재실행
  }, [open, equipment]);

  /**
   * 직전 점검 prefill — 같은 장비의 가장 최근 점검의 items / resultSections(title) 구조를 복사.
   * - items: checkItem / checkCriteria 만 복사. checkResult / judgment 는 비워 이번 측정값만 입력하게 함.
   * - resultSections: 각 item 에 대응되는 title 섹션 자동 생성 (기존 `handleAddPresetItem` 과 동일 패턴).
   * - measurementEquipment: 매번 달라질 수 있으므로 복사하지 않음 (사용자가 필요 시 추가).
   * 재적용 방지: previousInspectionApplied flag.
   * 사용자가 체크박스를 off 로 바꾸면 items/sections 초기화.
   */
  useEffect(() => {
    if (!open || !usePreviousInspection || previousInspectionApplied) return;
    if (!latestInspection) return;
    const prevItems = latestInspection.items ?? [];
    if (prevItems.length === 0) return;
    if (items.length > 0) return; // 사용자가 이미 수동 입력했으면 건드리지 않음

    setItems(
      prevItems.map((it) => ({
        checkItem: it.checkItem ?? '',
        checkCriteria: it.checkCriteria ?? '',
        checkResult: '',
        judgment: '',
      }))
    );
    setResultSections((prev) => {
      // 이미 사용자가 수동으로 섹션을 추가했다면 prepend, 아니면 새로 생성
      const titleSections: CreateResultSectionDto[] = prevItems
        .filter((it) => !!it.checkItem?.trim())
        .map((it, idx) => ({
          sortOrder: prev.length + idx,
          sectionType: 'title' as const,
          title: it.checkItem as string,
        }));
      return [...prev, ...titleSections];
    });
    setPrefilled((prev) => ({ ...prev, previousInspection: true }));
    setPreviousInspectionApplied(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- self-audit-exception: 이전 점검 복사는 체크박스·latestInspection 변경 시만 실행
  }, [open, usePreviousInspection, latestInspection, previousInspectionApplied]);

  /**
   * 사용자가 체크박스를 off 하면 이전 점검에서 복사된 items/sections 를 초기화.
   * 사용자가 수동으로 추가한 내용도 함께 지워지는 걸 피하기 위해
   * previousInspectionApplied 인 경우에만 동작.
   */
  const handleTogglePreviousInspection = (checked: boolean) => {
    setUsePreviousInspection(checked);
    if (!checked && previousInspectionApplied) {
      setItems([]);
      setResultSections([]);
      setPrefilled((prev) => ({ ...prev, previousInspection: false }));
      setPreviousInspectionApplied(false);
    }
  };

  const resetForm = () => {
    setInspectionDate('');
    setInspectionCycle('');
    setCalibrationValidityPeriod('');
    setOverallResult('');
    setRemarks('');
    setItems([]);
    setResultSections([]);
    setMeasurementEquipment([]);
    setPrefilled({});
    setPreviousInspectionApplied(false);
    setUsePreviousInspection(true);
  };

  const tErrors = useTranslations('errors');

  const createMutation = useMutation({
    mutationFn: (data: CreateInspectionDto) => {
      if (calibrationId) {
        return calibrationApi.intermediateInspections.create(calibrationId, data);
      }
      return calibrationApi.intermediateInspections.createByEquipment(equipmentId, data);
    },
    onSuccess: () => {
      toast({ description: t('intermediateInspection.toasts.createSuccess') });
      queryClient.invalidateQueries({
        queryKey: queryKeys.equipment.intermediateInspections(equipmentId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.equipment.detail(equipmentId),
      });
      if (calibrationId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.intermediateInspections.byCalibration(calibrationId),
        });
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.calibrations.all,
      });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      const apiError = error as Error & { response?: { code?: string } };
      if (apiError.response?.code === 'NO_ACTIVE_CALIBRATION') {
        toast({
          variant: 'destructive',
          description: tEquip('inspection.noActiveCalibration'),
        });
        return;
      }
      if (isConflictError(error)) {
        const conflictInfo = getLocalizedErrorInfo(EquipmentErrorCode.VERSION_CONFLICT, tErrors);
        toast({
          title: conflictInfo.title,
          description: conflictInfo.message,
          variant: 'destructive',
        });
        // CAS 409: stale 캐시 제거 → 다음 열람 시 최신 version refetch
        queryClient.removeQueries({
          queryKey: queryKeys.equipment.intermediateInspections(equipmentId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.equipment.intermediateInspections(equipmentId),
        });
        if (calibrationId) {
          queryClient.removeQueries({
            queryKey: queryKeys.intermediateInspections.byCalibration(calibrationId),
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.intermediateInspections.byCalibration(calibrationId),
          });
        }
        onOpenChange(false);
        return;
      }
      toast({
        variant: 'destructive',
        description: t('intermediateInspection.toasts.createError'),
      });
    },
  });

  const handleAddPresetItem = (checkItem: string, checkCriteria: string) => {
    setItems((prev) => [...prev, { checkItem, checkCriteria, checkResult: '', judgment: '' }]);
    // 프리셋 항목 추가 시 해당 제목으로 결과 섹션 자동 생성 (title 타입 — 사용자가 결과 형식 선택)
    if (checkItem) {
      setResultSections((prev) => [
        ...prev,
        { sortOrder: prev.length, sectionType: 'title', title: checkItem },
      ]);
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { checkItem: '', checkCriteria: '', checkResult: '', judgment: '' },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // ── 측정 장비 리스트 ──

  const handleAddMeasurementEquipment = (equipmentId: string | undefined) => {
    if (!equipmentId) return;
    // 중복 방지
    if (measurementEquipment.some((me) => me.equipmentId === equipmentId)) return;

    // 장비 정보 fetch
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
        toast({
          variant: 'destructive',
          description: t('intermediateInspection.toasts.createError'),
        });
      });
  };

  const handleRemoveMeasurementEquipment = (index: number) => {
    setMeasurementEquipment((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof InspectionItemForm, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const hasInvalidItems = items.some(
    (item) => !item.checkItem.trim() || !item.checkCriteria.trim()
  );

  const handleSubmit = () => {
    if (!inspectionDate || hasInvalidItems) return;

    const dto: CreateInspectionDto = {
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
    };

    createMutation.mutate(dto);
  };

  const renderPrefillBadge = (field: string) => {
    if (!prefilled[field]) return null;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className={INSPECTION_PREFILL.badge}>
              <Info className={INSPECTION_PREFILL.icon} />
              {t('intermediateInspection.prefill.auto')}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('intermediateInspection.prefill.tooltip')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t('intermediateInspection.formTitle')}
            <FormNumberBadge formName={FORM_CATALOG['UL-QP-18-03'].name} />
          </DialogTitle>
          {equipmentName && <DialogDescription>{equipmentName}</DialogDescription>}
        </DialogHeader>

        <div className={INSPECTION_SPACING.section}>
          {isEquipmentError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{t('intermediateInspection.equipmentLoadError')}</AlertDescription>
            </Alert>
          )}
          {/* 점검일 + 종합 판정 */}
          <div className="grid grid-cols-2 gap-4">
            <div className={INSPECTION_SPACING.field}>
              <Label>{t('intermediateInspection.inspectionDate')}</Label>
              <Input
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                required
              />
            </div>
            <div className={INSPECTION_SPACING.field}>
              <Label>{t('intermediateInspection.overallResult')}</Label>
              <Select
                value={overallResult}
                onValueChange={(v) => setOverallResult(v as InspectionResult)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pass">
                    {t('intermediateInspection.resultOptions.pass')}
                  </SelectItem>
                  <SelectItem value="fail">
                    {t('intermediateInspection.resultOptions.fail')}
                  </SelectItem>
                  <SelectItem value="conditional">
                    {t('intermediateInspection.resultOptions.conditional')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 점검 주기 + 교정 유효기간 */}
          {isEquipmentLoading ? (
            <div className="grid grid-cols-2 gap-4">
              <div className={INSPECTION_SPACING.field}>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className={INSPECTION_SPACING.field}>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className={INSPECTION_SPACING.field}>
                <div className="flex items-center">
                  <Label>{t('intermediateInspection.inspectionCycle')}</Label>
                  {renderPrefillBadge('inspectionCycle')}
                </div>
                <Input
                  value={inspectionCycle}
                  onChange={(e) => {
                    setInspectionCycle(e.target.value);
                    setPrefilled((prev) => ({ ...prev, inspectionCycle: false }));
                  }}
                  placeholder={t('intermediateInspection.inspectionCyclePlaceholder')}
                />
              </div>
              <div className={INSPECTION_SPACING.field}>
                <div className="flex items-center">
                  <Label>{t('intermediateInspection.calibrationValidityPeriod')}</Label>
                  {renderPrefillBadge('calibrationValidityPeriod')}
                </div>
                <Input
                  value={calibrationValidityPeriod}
                  onChange={(e) => {
                    setCalibrationValidityPeriod(e.target.value);
                    setPrefilled((prev) => ({ ...prev, calibrationValidityPeriod: false }));
                  }}
                  placeholder={t('intermediateInspection.validityPeriodPlaceholder')}
                />
              </div>
            </div>
          )}

          {/* 점검 항목 동적 배열 */}
          <div className={INSPECTION_SPACING.group}>
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                {t('intermediateInspection.items.title')}
              </Label>
              <div className="flex gap-2">
                <CheckItemPresetSelect onSelect={handleAddPresetItem} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  aria-label={t('intermediateInspection.items.addItem')}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('intermediateInspection.items.addItem')}
                </Button>
              </div>
            </div>

            {/* 직전 점검 prefill 토글 — 해당 장비에 이전 점검이 존재할 때만 노출 */}
            {latestInspection && latestInspection.items && latestInspection.items.length > 0 && (
              <div className="flex items-start gap-2 rounded-md border border-dashed bg-muted/30 p-3">
                <Checkbox
                  id="use-previous-inspection"
                  checked={usePreviousInspection}
                  onCheckedChange={(checked) => handleTogglePreviousInspection(checked === true)}
                  className="mt-0.5"
                />
                <div className="flex-1 space-y-0.5">
                  <Label
                    htmlFor="use-previous-inspection"
                    className="cursor-pointer text-sm font-medium"
                  >
                    {t('intermediateInspection.prefill.usePreviousLabel')}
                    {prefilled.previousInspection && (
                      <Badge variant="secondary" className={cn(INSPECTION_PREFILL.badge, 'ml-2')}>
                        <Info className={INSPECTION_PREFILL.icon} />
                        {t('intermediateInspection.prefill.auto')}
                      </Badge>
                    )}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('intermediateInspection.prefill.usePreviousDescription', {
                      count: latestInspection.items.length,
                    })}
                  </p>
                </div>
              </div>
            )}

            {items.length === 0 ? (
              <div className={INSPECTION_EMPTY_STATE.container}>
                <ClipboardList className={INSPECTION_EMPTY_STATE.icon} aria-hidden="true" />
                <p className={INSPECTION_EMPTY_STATE.title}>
                  {t('intermediateInspection.items.noItems')}
                </p>
                <p className={INSPECTION_EMPTY_STATE.description}>
                  {t('intermediateInspection.items.noItemsDescription')}
                </p>
              </div>
            ) : (
              <div className={INSPECTION_SPACING.group}>
                {items.map((item, index) => (
                  <div
                    key={index}
                    className={cn(
                      INSPECTION_ITEM_CARD.base,
                      INSPECTION_SPACING.group,
                      getJudgmentCardClasses(item.judgment),
                      ANIMATION_PRESETS.slideUpFade,
                      'motion-safe:duration-200'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={INSPECTION_ITEM_CARD.number}>#{index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        aria-label={t('intermediateInspection.items.removeItem')}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className={INSPECTION_ITEM_CARD.fieldGrid}>
                      <div className={INSPECTION_SPACING.field}>
                        <Label className={INSPECTION_ITEM_CARD.fieldLabel}>
                          {t('intermediateInspection.items.checkItem')}
                        </Label>
                        <Input
                          value={item.checkItem}
                          onChange={(e) => handleItemChange(index, 'checkItem', e.target.value)}
                        />
                      </div>
                      <div className={INSPECTION_SPACING.field}>
                        <Label className={INSPECTION_ITEM_CARD.fieldLabel}>
                          {t('intermediateInspection.items.checkCriteria')}
                        </Label>
                        <Input
                          value={item.checkCriteria}
                          onChange={(e) => handleItemChange(index, 'checkCriteria', e.target.value)}
                        />
                      </div>
                      <div className={INSPECTION_SPACING.field}>
                        <Label className={INSPECTION_ITEM_CARD.fieldLabel}>
                          {t('intermediateInspection.items.checkResult')}
                        </Label>
                        <Input
                          value={item.checkResult}
                          onChange={(e) => handleItemChange(index, 'checkResult', e.target.value)}
                        />
                      </div>
                      <div className={INSPECTION_SPACING.field}>
                        <Label className={INSPECTION_ITEM_CARD.fieldLabel}>
                          {t('intermediateInspection.items.judgment')}
                        </Label>
                        <Select
                          value={item.judgment}
                          onValueChange={(v) => handleItemChange(index, 'judgment', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pass">
                              {t('intermediateInspection.items.judgmentOptions.pass')}
                            </SelectItem>
                            <SelectItem value="fail">
                              {t('intermediateInspection.items.judgmentOptions.fail')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 측정 장비 리스트 */}
          <div className={INSPECTION_SPACING.group}>
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                {t('intermediateInspection.measurementEquipment.title')}
              </Label>
              <EquipmentCombobox
                value={undefined}
                onChange={handleAddMeasurementEquipment}
                placeholder={t('intermediateInspection.measurementEquipment.searchPlaceholder')}
                excludeIds={measurementEquipment.map((me) => me.equipmentId)}
              />
            </div>

            {measurementEquipment.length === 0 ? (
              <div className={INSPECTION_EMPTY_STATE.container}>
                <Wrench className={INSPECTION_EMPTY_STATE.icon} aria-hidden="true" />
                <p className={INSPECTION_EMPTY_STATE.title}>
                  {t('intermediateInspection.measurementEquipment.empty')}
                </p>
                <p className={INSPECTION_EMPTY_STATE.description}>
                  {t('intermediateInspection.measurementEquipment.emptyDescription')}
                </p>
              </div>
            ) : (
              <div className="rounded border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-xs">
                      <th className="text-left px-3 py-2 font-medium">#</th>
                      <th className="text-left px-3 py-2 font-medium">
                        {t('intermediateInspection.measurementEquipment.managementNumber')}
                      </th>
                      <th className="text-left px-3 py-2 font-medium">
                        {t('intermediateInspection.measurementEquipment.equipmentName')}
                      </th>
                      <th className="text-left px-3 py-2 font-medium">
                        {t('intermediateInspection.measurementEquipment.calibrationDate')}
                      </th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {measurementEquipment.map((me, idx) => (
                      <tr key={me.equipmentId} className="border-t hover:bg-muted/30">
                        <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                        <td className="px-3 py-2 font-mono tabular-nums text-xs">
                          {me.managementNumber}
                        </td>
                        <td className="px-3 py-2">{me.equipmentName}</td>
                        <td className="px-3 py-2 font-mono tabular-nums text-xs">
                          {me.calibrationDate || '—'}
                        </td>
                        <td className="px-1 py-2">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveMeasurementEquipment(idx)}
                            aria-label={t('intermediateInspection.items.removeItem')}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 비고 */}
          <div className={INSPECTION_SPACING.field}>
            <Label>{t('intermediateInspection.remarks')}</Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={t('intermediateInspection.remarksPlaceholder')}
              rows={3}
            />
          </div>

          {/* 측정 결과 데이터 인라인 */}
          <Separator className={INSPECTION_SPACING.divider} />
          <InlineResultSectionsEditor sections={resultSections} onChange={setResultSections} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('intermediateInspection.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !inspectionDate || hasInvalidItems || createMutation.isPending || isEquipmentError
            }
          >
            {createMutation.isPending
              ? t('intermediateInspection.saving')
              : t('intermediateInspection.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
