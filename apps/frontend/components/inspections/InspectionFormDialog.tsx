'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isConflictError } from '@/lib/api/error';
import { EquipmentErrorCode, getLocalizedErrorInfo } from '@/lib/errors/equipment-errors';
import { Plus, Trash2, Info, ClipboardList, Wrench, AlertCircle, X } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  INSPECTION_PREFILL_NOTICE,
  getJudgmentCardClasses,
  ANIMATION_PRESETS,
} from '@/lib/design-tokens';
import {
  extractStructureFromInspection,
  describeStructureCounts,
} from '@/lib/inspection/template-utils';
import { InspectionFormProvider, useInspectionForm } from '@/lib/inspection/form-context';
import { useFormDialogClose } from '@/hooks/use-form-dialog-close';
import { track } from '@/lib/analytics/track';
import { ANALYTICS_EVENTS } from '@/lib/analytics/events';
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
  const tEquip = useTranslations('equipment');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Phase 1A-b: prefill state는 InspectionFormContext SSOT로 통합.
  // Phase 0A-ext++: master state 이중 sourcing 제거 (addMasterPrefilledField 직접 호출)
  const inspectionForm = useInspectionForm();
  const {
    state: inspectionFormState,
    applyLatestPrefill,
    resetLatestPrefill,
    resetAll,
    dismissBanner,
    addMasterPrefilledField,
    removeMasterPrefilledField,
    isMasterPrefilledField,
  } = inspectionForm;
  const previousInspectionApplied = inspectionFormState.latest.applied;
  const prefillCounts = inspectionFormState.latest.counts;
  const prefillBannerDismissed = inspectionFormState.latest.bannerDismissed;

  // Form state — classification은 항상 "교정기기"로 고정 (중간점검은 교정기기 전용)
  const [inspectionDate, setInspectionDate] = useState('');
  const [inspectionCycle, setInspectionCycle] = useState('');
  const [calibrationValidityPeriod, setCalibrationValidityPeriod] = useState('');
  const [overallResult, setOverallResult] = useState<InspectionResult | ''>('');
  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState<InspectionItemForm[]>([]);
  const [resultSections, setResultSections] = useState<CreateResultSectionDto[]>([]);
  const [measurementEquipment, setMeasurementEquipment] = useState<MeasurementEquipmentForm[]>([]);
  // Phase 0A-ext++: master data prefilled flag — Context master state 직접 사용 (이중 sourcing 제거)
  // 기존 useState<Record<string, boolean>> + setMasterPrefilledFields useEffect 동기화 패턴 폐기.
  // Provider 내부 useReducer state 단일 source.
  /**
   * 직전 점검 prefill 사용 여부 (기본 on).
   * 사용자가 체크박스로 off 하면 복사된 items/sections 를 초기화.
   */
  const [usePreviousInspection, setUsePreviousInspection] = useState(true);
  /** Phase 0A: 토글 OFF 확인 다이얼로그 (작성 중 데이터 손실 방지) */
  const [pendingToggleOffConfirm, setPendingToggleOffConfirm] = useState(false);

  // Phase 0A-ext: cancel/X/Esc 닫기 시 작성 데이터 감지 + confirmation
  const close = useFormDialogClose({
    isDirty: () =>
      inspectionDate !== '' ||
      items.length > 0 ||
      resultSections.length > 0 ||
      measurementEquipment.length > 0 ||
      overallResult !== '' ||
      remarks !== '',
    onConfirmClose: () => {
      // Phase 1A-c: confirm 시 analytics — 사용자가 작성 데이터 폐기
      track(ANALYTICS_EVENTS.INSPECTION_FORM_CLOSE_GUARDED, {
        dialog: 'inspection_form',
        action: 'discard',
        itemCount: items.length,
        sectionCount: resultSections.length,
      });
      onOpenChange(false);
    },
  });

  // Phase 1A-b: dialog 닫힐 때 Context state 자동 reset.
  // (Provider unmount 패턴 대신 useEffect — Radix Dialog transition 호환)
  useEffect(() => {
    if (!open) resetAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- self-audit-exception: open=false 트리거 single shot
  }, [open]);

  // Phase 0A-ext++: prefilled state 제거됨 — 이중 sourcing 폐기. master는 Context 직접 호출.

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
  // Phase 1A: 직전 점검의 resultSections 별도 fetch — list endpoint에는 미포함
  const { data: latestResultSections } = useQuery({
    queryKey: latestInspectionId
      ? queryKeys.intermediateInspections.resultSections(latestInspectionId)
      : ['intermediate-inspections', 'result-sections', 'disabled'],
    queryFn: () =>
      latestInspectionId
        ? calibrationApi.intermediateInspections.resultSections.list(latestInspectionId)
        : Promise.resolve([]),
    enabled: open && !!latestInspectionId && usePreviousInspection,
  });

  // Prefill from equipment master data when dialog opens
  useEffect(() => {
    if (!open || !equipment) return;

    // 점검주기: 중간점검 주기 (intermediateCheckCycle) 사용, fallback으로 교정주기의 절반
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

    // 교정유효기간: calibrationCycle에서 자동 파생, 수정 가능
    if (!calibrationValidityPeriod) {
      const derived = deriveCalibrationValidityPeriod(equipment.calibrationCycle);
      if (derived) {
        setCalibrationValidityPeriod(derived);
        addMasterPrefilledField('calibrationValidityPeriod');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- self-audit-exception: open/equipment 변경 시만 prefill 재실행
  }, [open, equipment]);

  /**
   * 직전 점검 prefill — Phase 1A 확장:
   * 같은 장비의 가장 최근 *승인된* 점검의 items + resultSections 구조 모두 복사.
   * - items: checkItem / checkCriteria 만 복사 (값은 비움)
   * - resultSections: richTableData / tableData / imageWidthCm/Height / title 구조 보존
   *   · 표 셀 값 비움, image cell → text 빈 셀로 변환
   *   · documentId(사진 첨부)는 매번 새로 → 비움
   *   · content(텍스트)는 매번 새로 → 비움
   * - measurementEquipment: 매번 달라질 수 있으므로 복사하지 않음
   * 재적용 방지: previousInspectionApplied flag.
   * 사용자가 체크박스를 off 로 바꾸면 items/sections 초기화 (AlertDialog confirm 후).
   *
   * SSOT: extractStructureFromInspection (lib/inspection/template-utils.ts)
   * 디자인 리뷰 §N: prefill 갭 80% 보완.
   */
  // Phase 1A-c: extractStructureFromInspection useMemo 캐싱 — latestInspection/Sections 변경 시만 재실행
  const extractedStructure = useMemo(() => {
    if (!latestInspection || latestResultSections === undefined) return null;
    return extractStructureFromInspection({
      items: latestInspection.items,
      resultSections: latestResultSections ?? [],
    });
  }, [latestInspection, latestResultSections]);

  useEffect(() => {
    if (!open || !usePreviousInspection || previousInspectionApplied) return;
    if (!extractedStructure) return;
    if (extractedStructure.items.length === 0 && extractedStructure.resultSections.length === 0)
      return;
    if (items.length > 0 || resultSections.length > 0) return; // 사용자가 이미 입력 시작

    setItems(extractedStructure.items);
    setResultSections(extractedStructure.resultSections);
    // previousInspection prefilled은 Context의 latest.applied=true로 추적 (별도 master field 불필요)
    // Phase 1A-b: Context dispatch — applied/counts/sortOrders 동시 atomic update
    if (latestInspection) {
      applyLatestPrefill({
        sourceInspectionId: latestInspection.id,
        sourceInspectionDate: latestInspection.inspectionDate?.slice(0, 10) ?? '',
        counts: extractedStructure.counts,
        sortOrders: extractedStructure.resultSections.map((s) => s.sortOrder),
      });
      // Phase 1A-c: analytics — prefill 적용 추적 (PII 없음, 카운트만)
      track(ANALYTICS_EVENTS.INSPECTION_PREFILL_USED, {
        inspectionType: 'intermediate',
        tableCount: extractedStructure.counts.tables,
        photoCount: extractedStructure.counts.photos,
        textCount: extractedStructure.counts.texts,
        itemCount: extractedStructure.items.length,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- self-audit-exception: 이전 점검 복사는 체크박스·extractedStructure 변경 시만 실행
  }, [open, usePreviousInspection, previousInspectionApplied, extractedStructure]);

  /**
   * 사용자가 체크박스를 off 하면 이전 점검에서 복사된 items/sections 를 초기화.
   * 사용자가 수동으로 추가한 내용도 함께 지워지는 걸 피하기 위해
   * previousInspectionApplied 인 경우에만 동작.
   */
  const performToggleOffReset = () => {
    setItems([]);
    setResultSections([]);
    setUsePreviousInspection(false);
    // Phase 1A-b: Context reset — applied/counts/sortOrders/userModifiedCells 일괄 초기화
    resetLatestPrefill();
  };

  const handleTogglePreviousInspection = (checked: boolean) => {
    if (checked) {
      setUsePreviousInspection(true);
      return;
    }
    // OFF: 작성 중인 데이터가 있으면 confirmation, 없으면 즉시 OFF
    if (previousInspectionApplied && (items.length > 0 || resultSections.length > 0)) {
      setPendingToggleOffConfirm(true);
      return;
    }
    setUsePreviousInspection(false);
    if (previousInspectionApplied) {
      performToggleOffReset();
    }
  };

  const confirmToggleOff = () => {
    performToggleOffReset();
    setPendingToggleOffConfirm(false);
    // Phase 1A-c: analytics — prefill 토글 OFF 추적
    track(ANALYTICS_EVENTS.INSPECTION_PREFILL_TOGGLE_OFF, {
      inspectionType: 'intermediate',
      itemCount: items.length,
      sectionCount: resultSections.length,
    });
  };

  const cancelToggleOff = () => {
    // 사용자가 취소 → 체크박스 상태 원복 (이미 ON이지만 명시적)
    setUsePreviousInspection(true);
    setPendingToggleOffConfirm(false);
  };

  // Phase 1A: prefill banner summary 문자열 (구조 복사 안내)
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

  // Phase 1A: prefill 미동작 사유 — 직전 점검이 승인되지 않은 경우 안내
  // (실측: 현재 latestInspection은 approvalStatus === 'approved' 만 반환)
  const showNoSourceNotice =
    open && !latestInspection && usePreviousInspection && !previousInspectionApplied;

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
    // Phase 1A-b/0A-ext++: Context state(master + latest 모두) 초기화
    resetAll();
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
      // Phase 0A-ext: submit 성공 → 다음 requestClose에서 confirm 우회
      close.markCommitted();
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
        // Phase 0A-ext: CAS 409로 강제 닫기 — confirm 우회 (사용자가 재시도 의도)
        close.markCommitted();
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
    // Phase 0A-ext++: Context master state 직접 조회 (이중 sourcing 제거)
    if (!isMasterPrefilledField(field)) return null;
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
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          // Phase 0A-ext: X 버튼 / Esc / 외부 트리거 닫기 — isDirty 시 confirmation
          close.requestClose();
        } else {
          onOpenChange(newOpen);
        }
      }}
    >
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        // Phase 0A: outside-click → form reset → 작성 중 데이터 손실 방지 (디자인 리뷰 b6)
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        // Phase 0A-ext: Esc 키도 cancel 동선 통일 (작성 데이터 가드)
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          close.requestClose();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t('intermediateInspection.formTitle')}
            <FormNumberBadge formName={FORM_CATALOG['UL-QP-18-03'].name} />
          </DialogTitle>
          {equipmentName && <DialogDescription>{equipmentName}</DialogDescription>}
        </DialogHeader>

        {/* Phase 1A: prefill 안내 banner — 구조 복사 적용 시 */}
        {previousInspectionApplied && prefillBannerSummary && !prefillBannerDismissed && (
          <div role="status" aria-live="polite" className={INSPECTION_PREFILL_NOTICE.banner}>
            <Info className={INSPECTION_PREFILL_NOTICE.icon} aria-hidden="true" />
            <div className={INSPECTION_PREFILL_NOTICE.body}>
              <p className="font-medium">{t('intermediateInspection.prefill.banner.title')}</p>
              <p>
                {t('intermediateInspection.prefill.banner.description', {
                  summary: prefillBannerSummary,
                })}
              </p>
              {latestInspection && (
                <p className={INSPECTION_PREFILL_NOTICE.meta}>
                  {t('intermediateInspection.prefill.banner.meta', {
                    date: latestInspection.inspectionDate?.slice(0, 10) ?? '—',
                  })}
                </p>
              )}
            </div>
            <button
              type="button"
              className={INSPECTION_PREFILL_NOTICE.dismissButton}
              onClick={() => {
                dismissBanner();
                track(ANALYTICS_EVENTS.INSPECTION_PREFILL_BANNER_DISMISSED, {
                  inspectionType: 'intermediate',
                });
              }}
              aria-label={t('intermediateInspection.prefill.banner.dismiss')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Phase 1A: prefill 미동작 사유 안내 — 직전 점검이 승인되지 않음 */}
        {showNoSourceNotice && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-start gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
          >
            <Info className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-medium text-foreground">
                {t('intermediateInspection.prefill.noSourceNotice.title')}
              </p>
              <p>{t('intermediateInspection.prefill.noSourceNotice.description')}</p>
            </div>
          </div>
        )}

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
                    removeMasterPrefilledField('inspectionCycle');
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
                    removeMasterPrefilledField('calibrationValidityPeriod');
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
                    {previousInspectionApplied && (
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
          <Button variant="outline" onClick={close.requestClose}>
            {t('intermediateInspection.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !inspectionDate || hasInvalidItems || createMutation.isPending || isEquipmentError
            }
            loading={createMutation.isPending}
          >
            {createMutation.isPending
              ? t('intermediateInspection.saving')
              : t('intermediateInspection.save')}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Phase 0A-ext: cancel/X/Esc 작성 데이터 가드 (모든 destructive 1단계 안전망) */}
      <AlertDialog
        open={close.confirmOpen}
        onOpenChange={(o) => {
          if (!o) close.cancel();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('intermediateInspection.cancelConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('intermediateInspection.cancelConfirm.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={close.cancel}>
              {t('intermediateInspection.cancelConfirm.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={close.confirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('intermediateInspection.cancelConfirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Phase 0A: prefill 토글 OFF 확인 (디자인 리뷰 b6 — 30셀 손실 방지) */}
      <AlertDialog
        open={pendingToggleOffConfirm}
        onOpenChange={(open) => {
          if (!open) cancelToggleOff();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('intermediateInspection.prefill.toggleOff.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('intermediateInspection.prefill.toggleOff.description', {
                itemCount: items.length,
                sectionCount: resultSections.length,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelToggleOff}>
              {t('intermediateInspection.prefill.toggleOff.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggleOff}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('intermediateInspection.prefill.toggleOff.action')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
