'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { MANUAL_NC_TYPES, type NonConformanceType } from '@equipment-management/schemas';
import { DocumentTypeValues } from '@equipment-management/schemas';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileUpload, type UploadedFile } from '@/components/shared/FileUpload';
import nonConformancesApi from '@/lib/api/non-conformances-api';
import { documentApi } from '@/lib/api/document-api';
import { queryKeys } from '@/lib/api/query-config';
import { toast } from '@/components/ui/use-toast';

interface MobileNCRQuickFormProps {
  equipmentId: string;
  equipmentName: string;
  /** 제출 성공 후 부모(시트) 닫기 콜백. */
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * QR 랜딩 모바일 액션 시트에서 호출되는 원탭 NCR 폼.
 *
 * 필수 필드: `ncType`, `cause`, `discoveryDate` (기본 오늘).
 * 선택 필드: `photos` (FileUpload `capture="environment"` — 후면 카메라 직접 활성).
 *
 * 제출 순서:
 * 1) `nonConformancesApi.createNonConformance({...})` → ncUuid 확보
 * 2) `photos.length > 0`이면 각 파일을 `documentApi.uploadDocument(file, 'equipment_photo',
 *    { equipmentId, description: 'NCR-{ncUuid}' })` 병렬 업로드
 * 3) 모두 성공 → `invalidateQueries(byEquipment)` + toast + `onSuccess()`
 * 4) 사진 부분 실패 → NCR은 성공 보고, 사진 재시도 안내 (NCR DTO 확장 없음, documents 모듈
 *    미지원 `nonConformanceId` 필드 대신 `description` 프리픽스로 연결 — Phase 2 결정)
 */
export function MobileNCRQuickForm({
  equipmentId,
  equipmentName,
  onSuccess,
  onCancel,
}: MobileNCRQuickFormProps) {
  const t = useTranslations('qr.ncrQuick');
  const tType = useTranslations('non-conformances.type');
  const queryClient = useQueryClient();

  const [ncType, setNcType] = React.useState<NonConformanceType | ''>('');
  const [cause, setCause] = React.useState('');
  const [discoveryDate, setDiscoveryDate] = React.useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [files, setFiles] = React.useState<UploadedFile[]>([]);
  const [photoUploadErrors, setPhotoUploadErrors] = React.useState<string[]>([]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!ncType) throw new Error('ncType is required');
      return nonConformancesApi.createNonConformance({
        equipmentId,
        discoveryDate,
        cause: cause.trim(),
        ncType,
      });
    },
    onSuccess: async (nc) => {
      // Phase 1 규칙: setQueryData 금지, invalidateQueries만 사용
      void queryClient.invalidateQueries({
        queryKey: queryKeys.equipment.nonConformances(equipmentId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.equipment.openNonConformances(equipmentId),
      });

      // 사진이 있으면 병렬 업로드 (Post-NCR-Create 순서)
      const validFiles = files.filter((f) => f.file instanceof File);
      if (validFiles.length === 0) {
        toast({ description: t('successToast', { equipmentName }) });
        onSuccess?.();
        return;
      }

      const results = await Promise.allSettled(
        validFiles.map((f) =>
          documentApi.uploadDocument(f.file, DocumentTypeValues.EQUIPMENT_PHOTO, {
            equipmentId,
            description: `NCR-${nc.id}`,
          })
        )
      );

      const failed = results
        .map((r, idx) => (r.status === 'rejected' ? validFiles[idx].file.name : null))
        .filter((x): x is string => x !== null);

      if (failed.length === 0) {
        toast({ description: t('successToastWithPhotos', { equipmentName }) });
        onSuccess?.();
      } else {
        setPhotoUploadErrors(failed);
        toast({
          variant: 'destructive',
          description: t('photoUploadPartialFail', { count: failed.length }),
        });
      }
    },
    onError: () => {
      toast({
        variant: 'destructive',
        description: t('submitFailed'),
      });
    },
  });

  const isSubmitting = createMutation.isPending;
  const canSubmit = !!ncType && cause.trim().length > 0 && !isSubmitting;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) void createMutation.mutate();
      }}
    >
      <div className="flex items-start gap-2 rounded-md border border-brand-warning/30 bg-brand-warning/10 p-3">
        <AlertTriangle className="h-4 w-4 shrink-0 text-brand-warning" aria-hidden="true" />
        <p className="text-xs text-foreground">{t('description', { equipmentName })}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ncr-quick-type">{t('fields.ncType.label')}</Label>
        <Select
          value={ncType}
          onValueChange={(v) => setNcType(v as NonConformanceType)}
          disabled={isSubmitting}
        >
          <SelectTrigger id="ncr-quick-type" className="min-h-[var(--touch-target-min)]">
            <SelectValue placeholder={t('fields.ncType.placeholder')} />
          </SelectTrigger>
          <SelectContent>
            {MANUAL_NC_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {tType(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ncr-quick-cause">{t('fields.cause.label')}</Label>
        <Textarea
          id="ncr-quick-cause"
          placeholder={t('fields.cause.placeholder')}
          value={cause}
          onChange={(e) => setCause(e.target.value)}
          rows={3}
          maxLength={500}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ncr-quick-date">{t('fields.discoveryDate.label')}</Label>
        <Input
          id="ncr-quick-date"
          type="date"
          value={discoveryDate}
          onChange={(e) => setDiscoveryDate(e.target.value)}
          disabled={isSubmitting}
          className="min-h-[var(--touch-target-min)]"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>{t('fields.photos.label')}</Label>
        <FileUpload
          files={files}
          onChange={setFiles}
          accept="image/*"
          maxFiles={3}
          capture="environment"
          description={t('fields.photos.hint')}
          attachmentType="equipment_photo"
          disabled={isSubmitting}
        />
        {photoUploadErrors.length > 0 && (
          <p role="alert" aria-live="polite" className="text-xs text-brand-critical">
            {t('photoFailList', {
              files: photoUploadErrors.join(', '),
            })}
          </p>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 min-h-[var(--touch-target-min)]"
          >
            {t('cancel')}
          </Button>
        )}
        <Button
          type="submit"
          disabled={!canSubmit}
          className="flex-1 min-h-[var(--touch-target-min)]"
        >
          {isSubmitting ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          {isSubmitting ? t('submitting') : t('submit')}
        </Button>
      </div>
    </form>
  );
}
