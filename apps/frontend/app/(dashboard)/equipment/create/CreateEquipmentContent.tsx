'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EquipmentForm, type PendingHistoryData } from '@/components/equipment/EquipmentForm';
import { useCreateEquipment } from '@/hooks/use-equipment';
import { CreateEquipmentInput, UpdateEquipmentInput } from '@equipment-management/schemas';
import { ArrowLeft, PlusCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { isApprovalResponse } from '@/lib/api/equipment-api';
import { ErrorAlert, PartialSuccessAlert } from '@/components/shared/ErrorAlert';
import { ApiError, EquipmentErrorCode } from '@/lib/errors/equipment-errors';
import { saveHistoryInParallel } from '@/lib/utils/equipment-history-utils';
import { getPageContainerClasses } from '@/lib/design-tokens';

interface CreateEquipmentContentProps {
  userDefaults?: {
    site?: string;
    teamId?: string;
  };
}

export default function CreateEquipmentContent({ userDefaults }: CreateEquipmentContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations('equipment');
  const createEquipment = useCreateEquipment();

  // i18n 기반 이력 타입 라벨 (saveHistoryInParallel 결과 표시용)
  const historyTypeLabels: Record<string, string> = {
    location: t('form.historyTypes.location'),
    maintenance: t('form.historyTypes.maintenance'),
    incident: t('form.historyTypes.incident'),
    calibration: t('form.historyTypes.calibration'),
  };

  // 에러 상태 관리
  const [submitError, setSubmitError] = useState<ApiError | Error | null>(null);
  const [partialSuccessInfo, setPartialSuccessInfo] = useState<{
    successMessage: string;
    failedItems: Array<{ type: string; error: string }>;
  } | null>(null);

  const handleSubmit = async (
    data: CreateEquipmentInput | UpdateEquipmentInput,
    files?: Array<{ file: File }>,
    pendingHistory?: PendingHistoryData
  ): Promise<void> => {
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
          title: t('form.create.approvalRequestComplete'),
          description: t('form.create.approvalRequestDescription'),
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
              successMessage: t('form.create.historyPartialSuccess', {
                saved: savedCount,
                total: totalHistory,
              }),
              failedItems,
            });
            toast({
              title: t('form.create.historyPartialTitle'),
              description: t('form.create.historyPartialDescription', {
                count: failedItems.length,
              }),
              variant: 'destructive',
            });
            setTimeout(() => {
              router.push('/equipment');
            }, 5000);
          } else {
            toast({
              title: t('form.create.registrationComplete'),
              description: t('form.create.registrationWithHistory', { count: totalHistory }),
            });
            router.push('/equipment');
          }
        } else {
          toast({
            title: t('form.create.registrationComplete'),
            description: t('form.create.registrationDescription'),
          });
          router.push('/equipment');
        }
      }
    } catch (error) {
      console.error('Failed to create equipment:', error);

      if (error instanceof ApiError) {
        setSubmitError(error);
      } else if (error instanceof Error) {
        setSubmitError(error);
      } else {
        setSubmitError(
          new ApiError(t('form.create.unknownError'), EquipmentErrorCode.UNKNOWN_ERROR)
        );
      }

      toast({
        title: t('form.create.registrationFailed'),
        description:
          error instanceof ApiError ? error.getUserMessage() : t('form.create.registrationError'),
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    router.push('/equipment');
  };

  return (
    <div className={`${getPageContainerClasses()} max-w-5xl`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <PlusCircle className="h-6 w-6 text-primary" />
              {t('form.create.pageTitle')}
            </h1>
            <p className="text-muted-foreground text-sm">{t('form.create.pageDescription')}</p>
          </div>
        </div>

        {/* 공용장비 등록 링크 */}
        <Link href="/equipment/create-shared">
          <Button variant="outline" size="sm" className="gap-2">
            <Info className="h-4 w-4" />
            {t('form.create.sharedLink')}
          </Button>
        </Link>
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

      {/* 폼 */}
      <EquipmentForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isEdit={false}
        isLoading={createEquipment.isPending}
        userDefaults={userDefaults}
      />
    </div>
  );
}
