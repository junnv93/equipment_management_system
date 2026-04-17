'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  MANUAL_NC_TYPES,
  NonConformanceStatusValues as NCStatusVal,
  type NonConformanceType,
} from '@equipment-management/schemas';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import nonConformancesApi, { type NonConformance } from '@/lib/api/non-conformances-api';
import { queryKeys } from '@/lib/api/query-config';
import { EquipmentCacheInvalidation } from '@/lib/api/cache-invalidation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

/**
 * NC 유형 enum → i18n 키 매핑.
 * SSOT 재사용을 위해 기존 NonConformanceManagementClient에서 동일 매핑을 추출.
 */
const NC_TYPE_I18N_KEY: Record<string, string> = {
  damage: 'damage',
  malfunction: 'malfunction',
  calibration_failure: 'calibrationFailure',
  measurement_error: 'measurementError',
  other: 'other',
};

interface CreateNonConformanceFormProps {
  equipmentId: string;
  /** 제출 성공 시 호출 (시트 닫기, 리다이렉트 등 부모 책임). */
  onSuccess?: () => void;
  /** 취소 버튼 클릭 시 호출. 미제공 시 취소 버튼 숨김. */
  onCancel?: () => void;
  /**
   * 마운트 시 첫 입력 필드(ncType Select)로 focus 이동.
   * `?action=create` 딥링크 진입 시 활성화 권장 — 키보드/스크린리더 사용자의
   * "폼이 자동 오픈됨" 인지 보조.
   */
  autoFocus?: boolean;
}

/**
 * 장비에 대한 부적합(NC) 등록 폼 — 재사용 가능한 presentational 컴포넌트.
 *
 * ## 설계 원칙
 * - **SSOT**: 모든 진입점(기존 NC 관리 페이지 / QR 모바일 액션 시트 / 이메일 알림 딥링크 등)이
 *   이 컴포넌트를 공유. 폼 로직 중복 0.
 * - **Optimistic update + CAS + cross-entity invalidation** — `useOptimisticMutation` SSOT
 *   패턴 사용. `setQueryData` 직접 호출 0.
 * - **i18n**: `non-conformances.nonConformanceManagement.*` 네임스페이스 재사용.
 *   QR 경로도 동일 문자열을 쓰므로 별도 네임스페이스 불필요.
 *
 * ## 사용 예
 * ```tsx
 * // 기존 NC 관리 페이지 (showCreateForm 토글):
 * {showCreateForm && <CreateNonConformanceForm equipmentId={id} onSuccess={...} onCancel={...} />}
 *
 * // QR 진입은 동일 페이지로 router.push — 이 컴포넌트를 모바일 시트/모달로 중복 렌더 금지
 * ```
 */
export function CreateNonConformanceForm({
  equipmentId,
  onSuccess,
  onCancel,
  autoFocus = false,
}: CreateNonConformanceFormProps) {
  const t = useTranslations('non-conformances');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({
    cause: '',
    ncType: 'other' as NonConformanceType,
    actionPlan: '',
  });

  // 접근성: autoFocus 시 첫 필드(ncType Select trigger)로 focus 이동.
  // 딥링크 자동 오픈된 폼을 키보드/스크린리더 사용자가 즉시 인지하도록 보조.
  const ncTypeTriggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (autoFocus) ncTypeTriggerRef.current?.focus();
  }, [autoFocus]);

  const createMutation = useOptimisticMutation<
    NonConformance,
    {
      equipmentId: string;
      discoveryDate: string;
      cause: string;
      ncType: NonConformanceType;
      actionPlan?: string;
    },
    { data: NonConformance[] }
  >({
    mutationFn: (data) => nonConformancesApi.createNonConformance(data),
    queryKey: queryKeys.nonConformances.byEquipment(equipmentId),
    optimisticUpdate: (old, data) => {
      const newItem: NonConformance = {
        id: 'temp-' + Date.now(),
        ...data,
        status: NCStatusVal.OPEN,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as NonConformance;

      return {
        data: [...(old?.data || []), newItem],
      };
    },
    invalidateKeys: [queryKeys.equipment.detail(equipmentId)],
    successMessage: t('nonConformanceManagement.toasts.createSuccess'),
    errorMessage: t('nonConformanceManagement.toasts.createError'),
    onSuccessCallback: () => {
      setForm({ cause: '', ncType: 'other', actionPlan: '' });
      // 교차 엔티티 캐시 무효화 (장비 목록, NC 전체 목록, 대시보드 KPI)
      EquipmentCacheInvalidation.invalidateAfterNonConformanceCreation(queryClient, equipmentId);
      onSuccess?.();
    },
  });

  const handleSubmit = () => {
    if (!form.cause.trim()) {
      toast({
        title: t('nonConformanceManagement.form.causeRequired'),
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate({
      equipmentId,
      discoveryDate: new Date().toISOString().split('T')[0],
      cause: form.cause,
      ncType: form.ncType,
      actionPlan: form.actionPlan || undefined,
    });
  };

  const handleCancel = () => {
    setForm({ cause: '', ncType: 'other', actionPlan: '' });
    onCancel?.();
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="nc-type">
          {t('nonConformanceManagement.form.ncType')} <span className="text-destructive">*</span>
        </Label>
        <Select
          value={form.ncType}
          onValueChange={(v) => setForm({ ...form, ncType: v as NonConformanceType })}
        >
          <SelectTrigger id="nc-type" ref={ncTypeTriggerRef} className="mt-1.5">
            <SelectValue placeholder={t('nonConformanceManagement.form.ncTypePlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {MANUAL_NC_TYPES.map((ncType) => (
              <SelectItem key={ncType} value={ncType}>
                {t(`nonConformanceManagement.form.${NC_TYPE_I18N_KEY[ncType]}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1.5">
          {t('nonConformanceManagement.form.ncTypeHint')}
        </p>
      </div>
      <div>
        <Label htmlFor="nc-cause">
          {t('nonConformanceManagement.form.cause')} <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="nc-cause"
          value={form.cause}
          onChange={(e) => setForm({ ...form, cause: e.target.value })}
          rows={3}
          className="mt-1.5"
          placeholder={t('nonConformanceManagement.form.causePlaceholder')}
        />
      </div>
      <div>
        <Label htmlFor="nc-action-plan">{t('nonConformanceManagement.form.actionPlan')}</Label>
        <Textarea
          id="nc-action-plan"
          value={form.actionPlan}
          onChange={(e) => setForm({ ...form, actionPlan: e.target.value })}
          rows={2}
          className="mt-1.5"
          placeholder={t('nonConformanceManagement.form.actionPlanPlaceholder')}
        />
      </div>
      <div className="flex gap-3">
        <Button variant="destructive" onClick={handleSubmit} disabled={createMutation.isPending}>
          {createMutation.isPending
            ? t('nonConformanceManagement.form.registering')
            : t('nonConformanceManagement.form.register')}
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={handleCancel}>
            {t('nonConformanceManagement.form.cancel')}
          </Button>
        )}
      </div>
    </div>
  );
}
