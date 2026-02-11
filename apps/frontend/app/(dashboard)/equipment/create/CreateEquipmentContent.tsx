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
import equipmentApi from '@/lib/api/equipment-api';
import calibrationApi from '@/lib/api/calibration-api';
import { ErrorAlert, PartialSuccessAlert } from '@/components/shared/ErrorAlert';
import { ApiError, EquipmentErrorCode } from '@/lib/errors/equipment-errors';

/**
 * ★ Best Practice: 이력 저장 결과 타입 정의
 * - Promise.allSettled 결과를 타입 안전하게 처리
 */
interface HistorySaveResult {
  type: 'location' | 'maintenance' | 'incident' | 'calibration';
  index: number;
  status: 'fulfilled' | 'rejected';
  error?: string;
}

/**
 * ★ Best Practice: 이력 일괄 저장 함수 (병렬 처리)
 * - for 루프 대신 Promise.allSettled 사용으로 성능 향상
 * - 부분 실패 시에도 나머지 저장 계속 진행
 */
async function saveHistoryInParallel(
  equipmentUuid: string,
  pendingHistory: PendingHistoryData
): Promise<HistorySaveResult[]> {
  // 모든 이력 저장 Promise 생성
  const locationPromises = pendingHistory.locationHistory.map((item, index) =>
    equipmentApi
      .createLocationHistory(equipmentUuid, item)
      .then(() => ({ type: 'location' as const, index, status: 'fulfilled' as const }))
      .catch((err) => ({
        type: 'location' as const,
        index,
        status: 'rejected' as const,
        error: err instanceof ApiError ? err.getUserMessage() : '저장 실패',
      }))
  );

  const maintenancePromises = pendingHistory.maintenanceHistory.map((item, index) =>
    equipmentApi
      .createMaintenanceHistory(equipmentUuid, item)
      .then(() => ({ type: 'maintenance' as const, index, status: 'fulfilled' as const }))
      .catch((err) => ({
        type: 'maintenance' as const,
        index,
        status: 'rejected' as const,
        error: err instanceof ApiError ? err.getUserMessage() : '저장 실패',
      }))
  );

  const incidentPromises = pendingHistory.incidentHistory.map((item, index) =>
    equipmentApi
      .createIncidentHistory(equipmentUuid, item)
      .then(() => ({ type: 'incident' as const, index, status: 'fulfilled' as const }))
      .catch((err) => ({
        type: 'incident' as const,
        index,
        status: 'rejected' as const,
        error: err instanceof ApiError ? err.getUserMessage() : '저장 실패',
      }))
  );

  const calibrationPromises = (pendingHistory.calibrationHistory || []).map((item, index) =>
    calibrationApi
      .createCalibration({
        equipmentId: equipmentUuid,
        calibrationDate: item.calibrationDate,
        nextCalibrationDate: item.nextCalibrationDate,
        calibrationAgency: item.calibrationAgency,
        calibrationCycle: item.calibrationCycle,
        calibrationResult: item.calibrationResult,
        notes: item.notes,
      })
      .then(() => ({ type: 'calibration' as const, index, status: 'fulfilled' as const }))
      .catch((err) => ({
        type: 'calibration' as const,
        index,
        status: 'rejected' as const,
        error: err instanceof ApiError ? err.getUserMessage() : '저장 실패',
      }))
  );

  // 모든 Promise를 병렬로 실행
  const allResults = await Promise.all([
    ...locationPromises,
    ...maintenancePromises,
    ...incidentPromises,
    ...calibrationPromises,
  ]);

  return allResults;
}

/**
 * ★ Best Practice: 이력 타입별 한글 라벨 매핑
 */
const HISTORY_TYPE_LABELS: Record<string, string> = {
  location: '위치 변동',
  maintenance: '유지보수',
  incident: '손상/수리',
  calibration: '교정',
};

interface CreateEquipmentContentProps {
  userDefaults?: {
    site?: string;
    teamId?: string;
  };
}

export default function CreateEquipmentContent({ userDefaults }: CreateEquipmentContentProps) {
  const router = useRouter();
  const { toast } = useToast();
  const createEquipment = useCreateEquipment();

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
    // 에러 상태 초기화
    setSubmitError(null);
    setPartialSuccessInfo(null);

    try {
      const fileList = files?.map((f) => f.file);
      const result = (await createEquipment.mutateAsync({
        data: data as CreateEquipmentInput,
        files: fileList,
      })) as { uuid?: string; requestUuid?: string };

      // 승인 요청이 생성된 경우
      if (result.requestUuid) {
        toast({
          title: '등록 요청 완료',
          description: '장비 등록 요청이 제출되었습니다. 기술책임자의 승인을 기다려주세요.',
        });
        router.push('/equipment');
      } else if (result.uuid) {
        // 직접 승인된 경우 - 이력 일괄 저장 (병렬 처리)
        const equipmentUuid = result.uuid;

        // 임시 이력 데이터가 있으면 병렬로 일괄 저장
        if (pendingHistory) {
          /**
           * ★ Best Practice: Promise.allSettled 기반 병렬 처리
           * - 기존 for 루프: O(n) 순차 실행 → 네트워크 지연 누적
           * - 개선된 Promise.all: O(1) 병렬 실행 → 전체 시간 = 가장 느린 요청 시간
           */
          const saveResults = await saveHistoryInParallel(equipmentUuid, pendingHistory);

          // 실패 항목 추출
          const failedItems = saveResults
            .filter((r) => r.status === 'rejected')
            .map((r) => ({
              type: r.type,
              error: `${HISTORY_TYPE_LABELS[r.type]} ${r.index + 1}: ${r.error}`,
            }));

          const totalHistory =
            pendingHistory.locationHistory.length +
            pendingHistory.maintenanceHistory.length +
            pendingHistory.incidentHistory.length +
            (pendingHistory.calibrationHistory?.length || 0);

          const savedCount = totalHistory - failedItems.length;

          if (failedItems.length > 0) {
            // 일부 실패 시 부분 성공 알림 표시
            setPartialSuccessInfo({
              successMessage: `장비가 등록되었습니다. 이력 ${savedCount}/${totalHistory}건 저장 완료.`,
              failedItems,
            });
            toast({
              title: '장비 등록 완료 (일부 이력 저장 실패)',
              description: `장비는 등록되었지만 이력 ${failedItems.length}건 저장에 실패했습니다.`,
              variant: 'destructive',
            });
            // 부분 실패 시 페이지에서 알림 표시 후 5초 뒤 이동
            setTimeout(() => {
              router.push('/equipment');
            }, 5000);
          } else {
            toast({
              title: '장비 등록 완료',
              description: `새 장비가 등록되었습니다. (이력 ${totalHistory}건 저장됨)`,
            });
            router.push('/equipment');
          }
        } else {
          toast({
            title: '장비 등록 완료',
            description: '새 장비가 성공적으로 등록되었습니다.',
          });
          router.push('/equipment');
        }
      } else {
        router.push('/equipment');
      }
    } catch (error) {
      console.error('Failed to create equipment:', error);

      // ApiError인 경우 상세 정보 유지
      if (error instanceof ApiError) {
        setSubmitError(error);
      } else if (error instanceof Error) {
        setSubmitError(error);
      } else {
        setSubmitError(
          new ApiError(
            '장비 등록 중 알 수 없는 오류가 발생했습니다.',
            EquipmentErrorCode.UNKNOWN_ERROR
          )
        );
      }

      // 간단한 toast도 표시 (스크롤 위치와 관계없이 알림)
      toast({
        title: '등록 실패',
        description:
          error instanceof ApiError ? error.getUserMessage() : '장비 등록 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    router.push('/equipment');
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-5xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <PlusCircle className="h-6 w-6 text-primary" />
              장비 등록
            </h1>
            <p className="text-muted-foreground text-sm">새로운 장비를 시스템에 등록합니다</p>
          </div>
        </div>

        {/* 공용장비 등록 링크 */}
        <Link href="/equipment/create-shared">
          <Button variant="outline" size="sm" className="gap-2">
            <Info className="h-4 w-4" />
            공용장비 등록
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
