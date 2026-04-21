'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import {
  MANUAL_NC_TYPES,
  NonConformanceStatusValues as NCStatusVal,
  DocumentTypeValues,
  type NonConformanceType,
} from '@equipment-management/schemas';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import nonConformancesApi, { type NonConformance } from '@/lib/api/non-conformances-api';
import { documentApi } from '@/lib/api/document-api';
import { queryKeys } from '@/lib/api/query-config';
import { EquipmentCacheInvalidation } from '@/lib/api/cache-invalidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
 * - **i18n**: `non-conformances.management.*` 네임스페이스 (SSOT).
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
  const [photos, setPhotos] = useState<File[]>([]);
  // Photo upload는 별도 토스트/상태 (NC는 optimistic, 사진은 NC 생성 이후 실제 업로드)
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

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
    successMessage: t('management.toasts.createSuccess'),
    errorMessage: t('management.toasts.createError'),
    onSuccessCallback: async (createdNc) => {
      // 사진 첨부: NC 생성 후 반환된 id로 병렬 업로드.
      // Promise.allSettled — 일부 실패해도 나머지 진행 + partial 토스트.
      if (photos.length > 0 && createdNc?.id) {
        setIsUploadingPhotos(true);
        // 전용 엔드포인트 사용 — UPLOAD_NON_CONFORMANCE_ATTACHMENT permission 경계
        const results = await Promise.allSettled(
          photos.map((file) =>
            documentApi.uploadNonConformanceAttachment(
              createdNc.id,
              file,
              DocumentTypeValues.EQUIPMENT_PHOTO,
              t('management.form.photoDescription')
            )
          )
        );
        const failed = results.filter((r) => r.status === 'rejected').length; // eslint-disable-line no-restricted-syntax -- Promise.allSettled result status; self-audit-exception
        setIsUploadingPhotos(false);

        if (failed > 0) {
          toast({
            title: t('management.toasts.photoPartialFailed', { failed }),
            variant: 'destructive',
          });
        }

        // NC 첨부 목록 캐시 무효화 — Documents 탭이 nonConformanceId로 조회
        await queryClient.invalidateQueries({
          queryKey: queryKeys.documents.byNonConformance(createdNc.id),
        });
      }

      setForm({ cause: '', ncType: 'other', actionPlan: '' });
      setPhotos([]);
      // 교차 엔티티 캐시 무효화 (장비 목록, NC 전체 목록, 대시보드 KPI)
      // await 필수 — 무효화 완료 전 onSuccess(모달 닫기) 시 Navigate-Before-Invalidate 안티패턴
      await EquipmentCacheInvalidation.invalidateAfterNonConformanceCreation(
        queryClient,
        equipmentId
      );
      onSuccess?.();
    },
  });

  const handleSubmit = () => {
    if (!form.cause.trim()) {
      toast({
        title: t('management.form.causeRequired'),
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
    setPhotos([]);
    onCancel?.();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setPhotos(Array.from(files));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="nc-type">
          {t('management.form.ncType')} <span className="text-destructive">*</span>
        </Label>
        <Select
          value={form.ncType}
          onValueChange={(v) => setForm({ ...form, ncType: v as NonConformanceType })}
        >
          <SelectTrigger id="nc-type" ref={ncTypeTriggerRef} className="mt-1.5">
            <SelectValue placeholder={t('management.form.ncTypePlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {MANUAL_NC_TYPES.map((ncType) => (
              <SelectItem key={ncType} value={ncType}>
                {t(`management.form.${NC_TYPE_I18N_KEY[ncType]}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1.5">{t('management.form.ncTypeHint')}</p>
      </div>
      <div>
        <Label htmlFor="nc-cause">
          {t('management.form.cause')} <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="nc-cause"
          value={form.cause}
          onChange={(e) => setForm({ ...form, cause: e.target.value })}
          rows={3}
          className="mt-1.5"
          placeholder={t('management.form.causePlaceholder')}
        />
      </div>
      <div>
        <Label htmlFor="nc-action-plan">{t('management.form.actionPlan')}</Label>
        <Textarea
          id="nc-action-plan"
          value={form.actionPlan}
          onChange={(e) => setForm({ ...form, actionPlan: e.target.value })}
          rows={2}
          className="mt-1.5"
          placeholder={t('management.form.actionPlanPlaceholder')}
        />
      </div>
      <div>
        <Label htmlFor="nc-photos">{t('management.form.photos')}</Label>
        <Input
          id="nc-photos"
          type="file"
          accept="image/*"
          multiple
          // capture='environment' — 모바일(QR 현장)에서 후면 카메라 직접 실행. 데스크톱은 파일 선택.
          capture="environment"
          onChange={handlePhotoChange}
          className="mt-1.5"
          aria-describedby="nc-photos-hint"
        />
        <p id="nc-photos-hint" className="text-xs text-muted-foreground mt-1.5">
          {t('management.form.photosHint')}
        </p>
        {photos.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1" aria-live="polite">
            {t('management.form.photosSelected', { count: photos.length })}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <Button
          variant="destructive"
          onClick={handleSubmit}
          disabled={createMutation.isPending || isUploadingPhotos}
        >
          {isUploadingPhotos
            ? t('management.form.uploadingPhotos')
            : createMutation.isPending
              ? t('management.form.registering')
              : t('management.form.register')}
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={handleCancel}>
            {t('management.form.cancel')}
          </Button>
        )}
      </div>
    </div>
  );
}
