'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { useTranslations } from 'next-intl';
import { EquipmentForm, type PendingHistoryData } from '@/components/equipment/EquipmentForm';
import { type UploadedFile } from '@/components/shared/FileUpload';
import { useCreateEquipment } from '@/hooks/use-equipment';
import { isApprovalResponse } from '@/lib/api/equipment-api';
import { ErrorAlert, PartialSuccessAlert } from '@/components/shared/ErrorAlert';
import { ApiError, EquipmentErrorCode } from '@/lib/errors/equipment-errors';
import type { CreateEquipmentInput } from '@equipment-management/schemas';
import { saveHistoryInParallel } from '@/lib/utils/equipment-history-utils';
import { getPageContainerClasses } from '@/lib/design-tokens';

/**
 * 공용/렌탈 장비 임시등록 페이지
 *
 * EquipmentForm을 mode='temporary'로 사용하여 임시등록 필드를 표시합니다.
 * useCreateEquipment 공통 훅 + isApprovalResponse 타입 가드로 응답 분기.
 */
interface CreateSharedEquipmentContentProps {
  userDefaults?: {
    site?: string;
    teamId?: string;
  };
}

export default function CreateSharedEquipmentContent({
  userDefaults,
}: CreateSharedEquipmentContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations('equipment');
  const createEquipment = useCreateEquipment();

  // i18n 기반 이력 타입 라벨
  const historyTypeLabels: Record<string, string> = {
    location: t('form.historyTypes.location'),
    maintenance: t('form.historyTypes.maintenance'),
    incident: t('form.historyTypes.incident'),
    calibration: t('form.historyTypes.calibration'),
  };

  const [submitError, setSubmitError] = useState<ApiError | Error | null>(null);
  const [partialSuccessInfo, setPartialSuccessInfo] = useState<{
    successMessage: string;
    failedItems: Array<{ type: string; error: string }>;
  } | null>(null);

  const handleSubmit = async (
    data: Record<string, unknown>,
    files?: UploadedFile[],
    pendingHistory?: PendingHistoryData
  ) => {
    setSubmitError(null);
    setPartialSuccessInfo(null);

    try {
      const fileList = files?.map((f) => f.file);
      const result = await createEquipment.mutateAsync({
        data: data as CreateEquipmentInput,
        files: fileList,
      });

      if (isApprovalResponse(result)) {
        toast({
          title: t('form.createShared.approvalRequestComplete'),
          description: t('form.createShared.approvalRequestDescription'),
        });
        router.push('/equipment');
      } else {
        const equipmentUuid = String(result.id);

        if (pendingHistory) {
          const saveResults = await saveHistoryInParallel(
            equipmentUuid,
            pendingHistory,
            t('form.toasts.saveFailed')
          );
          const failedItems = saveResults
            .filter((r) => r.status === 'rejected')
            .map((r) => ({
              type: r.type,
              error: `${historyTypeLabels[r.type]} ${r.index + 1}: ${r.error}`,
            }));

          const totalHistory =
            pendingHistory.locationHistory.length +
            pendingHistory.maintenanceHistory.length +
            pendingHistory.incidentHistory.length +
            (pendingHistory.calibrationHistory?.length || 0);

          const savedCount = totalHistory - failedItems.length;

          if (failedItems.length > 0) {
            setPartialSuccessInfo({
              successMessage: t('form.createShared.historyPartialSuccess', {
                saved: savedCount,
                total: totalHistory,
              }),
              failedItems,
            });
            toast({
              title: t('form.createShared.historyPartialTitle'),
              description: t('form.createShared.historyPartialDescription', {
                count: failedItems.length,
              }),
              variant: 'destructive',
            });
            setTimeout(() => {
              router.push('/equipment');
            }, 5000);
          } else {
            toast({
              title: t('form.createShared.tempRegistrationComplete'),
              description: t('form.createShared.tempRegistrationWithHistory', {
                count: totalHistory,
              }),
            });
            router.push(`/equipment/${equipmentUuid}`);
          }
        } else {
          toast({
            title: t('form.createShared.tempRegistrationComplete'),
            description: t('form.createShared.tempRegistrationDescription'),
          });
          router.push(`/equipment/${equipmentUuid}`);
        }
      }
    } catch (error) {
      console.error('Failed to create shared equipment:', error);

      if (error instanceof ApiError) {
        setSubmitError(error);
      } else if (error instanceof Error) {
        setSubmitError(error);
      } else {
        setSubmitError(
          new ApiError(t('form.createShared.unknownError'), EquipmentErrorCode.UNKNOWN_ERROR)
        );
      }

      toast({
        title: t('form.createShared.registrationFailed'),
        description:
          error instanceof ApiError
            ? error.getUserMessage()
            : t('form.createShared.registrationError'),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className={getPageContainerClasses('detail')}>
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Share2 className="h-6 w-6 text-primary" />
            {t('form.createShared.pageTitle')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('form.createShared.pageDescription')}</p>
        </div>
      </div>

      {/* 에러 알림 */}
      {submitError && (
        <ErrorAlert
          error={submitError}
          onRetry={() => setSubmitError(null)}
          onDismiss={() => setSubmitError(null)}
          showDetails={true}
          showSolutions={true}
        />
      )}

      {/* 부분 성공 알림 */}
      {partialSuccessInfo && (
        <PartialSuccessAlert
          successMessage={partialSuccessInfo.successMessage}
          failedItems={partialSuccessInfo.failedItems}
          onDismiss={() => {
            setPartialSuccessInfo(null);
            router.push('/equipment');
          }}
        />
      )}

      {/* 공용/렌탈 장비 안내 */}
      <Alert>
        <Share2 className="h-4 w-4" />
        <AlertTitle>{t('form.createShared.guideTitle')}</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>
              <strong>{t('form.temporary.commonEquipment')}</strong>
              {': '}
              {t('form.createShared.guideCommon')}
            </li>
            <li>
              <strong>{t('form.temporary.rentalEquipment')}</strong>
              {': '}
              {t('form.createShared.guideRental')}
            </li>
            <li>
              <strong>{t('form.temporary.calibrationCertificate')}</strong>
              {': '}
              {t('form.createShared.guideCertRequired')}
            </li>
            <li>{t('form.createShared.guideExpiry')}</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* EquipmentForm (mode='temporary') */}
      <EquipmentForm
        mode="temporary"
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isLoading={createEquipment.isPending}
        userDefaults={userDefaults}
      />
    </div>
  );
}
