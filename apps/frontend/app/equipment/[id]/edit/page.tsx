'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { EquipmentForm } from '@/components/equipment/EquipmentForm';
import { useEquipment, useUpdateEquipment } from '@/hooks/use-equipment';
import { UpdateEquipmentInput } from '@equipment-management/schemas';
import { ArrowLeft, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import { ApiError, EquipmentErrorCode } from '@/lib/errors/equipment-errors';

export default function EditEquipmentPage() {
  const router = useRouter();
  const params = useParams();
  const equipmentId = params.id as string;
  const { toast } = useToast();

  const { data: equipment, isLoading, isError } = useEquipment(equipmentId);
  const updateEquipment = useUpdateEquipment();

  // 에러 상태 관리
  const [submitError, setSubmitError] = useState<ApiError | Error | null>(null);

  const handleSubmit = async (data: UpdateEquipmentInput, files?: Array<{ file: File }>) => {
    // 에러 상태 초기화
    setSubmitError(null);

    try {
      const fileList = files?.map((f) => f.file);
      const result = await updateEquipment.mutateAsync({
        id: equipmentId,
        data,
        files: fileList,
      });

      // 승인 요청이 생성된 경우
      if ((result as { requestUuid?: string }).requestUuid) {
        toast({
          title: '수정 요청 완료',
          description: '장비 수정 요청이 제출되었습니다. 기술책임자의 승인을 기다려주세요.',
        });
      } else {
        toast({
          title: '수정 완료',
          description: '장비 정보가 성공적으로 수정되었습니다.',
        });
      }

      router.push(`/equipment/${equipmentId}`);
    } catch (error) {
      console.error('Failed to update equipment:', error);

      // ApiError인 경우 상세 정보 유지
      if (error instanceof ApiError) {
        setSubmitError(error);
      } else if (error instanceof Error) {
        setSubmitError(error);
      } else {
        setSubmitError(new ApiError(
          '장비 수정 중 알 수 없는 오류가 발생했습니다.',
          EquipmentErrorCode.UNKNOWN_ERROR
        ));
      }

      // 간단한 toast도 표시
      toast({
        title: '수정 실패',
        description: error instanceof ApiError
          ? error.getUserMessage()
          : '장비 수정 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    router.push(`/equipment/${equipmentId}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6 max-w-5xl">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (isError || !equipment) {
    return (
      <div className="container mx-auto py-6 max-w-5xl">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-lg font-bold mb-2 text-destructive">오류 발생</p>
              <p className="text-muted-foreground mb-4">장비 정보를 불러오는 데 실패했습니다.</p>
              <Button variant="outline" onClick={handleCancel}>
                뒤로 가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 장비 데이터를 폼에 맞게 변환
  const initialData = {
    uuid: equipment.uuid,
    name: equipment.name || undefined,
    managementNumber: equipment.managementNumber || undefined,
    assetNumber: equipment.assetNumber || undefined,
    modelName: equipment.modelName || undefined,
    manufacturer: equipment.manufacturer || undefined,
    manufacturerContact: (equipment as any).manufacturerContact || undefined,
    serialNumber: equipment.serialNumber || undefined,
    location: equipment.location || undefined,
    description: equipment.description || undefined,
    calibrationCycle: equipment.calibrationCycle || undefined,
    lastCalibrationDate: equipment.lastCalibrationDate
      ? new Date(equipment.lastCalibrationDate).toISOString().split('T')[0]
      : undefined,
    nextCalibrationDate: equipment.nextCalibrationDate
      ? new Date(equipment.nextCalibrationDate).toISOString().split('T')[0]
      : undefined,
    calibrationAgency: equipment.calibrationAgency || undefined,
    needsIntermediateCheck: equipment.needsIntermediateCheck || false,
    calibrationMethod: equipment.calibrationMethod || undefined,
    lastIntermediateCheckDate: (equipment as any).lastIntermediateCheckDate
      ? new Date((equipment as any).lastIntermediateCheckDate).toISOString().split('T')[0]
      : undefined,
    intermediateCheckCycle: (equipment as any).intermediateCheckCycle || undefined,
    nextIntermediateCheckDate: (equipment as any).nextIntermediateCheckDate
      ? new Date((equipment as any).nextIntermediateCheckDate).toISOString().split('T')[0]
      : undefined,
    purchaseYear: equipment.purchaseYear || undefined,
    teamId: typeof equipment.teamId === 'number' ? equipment.teamId : equipment.teamId || undefined,
    site: equipment.site || undefined,
    supplier: equipment.supplier || undefined,
    contactInfo: equipment.contactInfo || undefined,
    softwareVersion: equipment.softwareVersion || undefined,
    firmwareVersion: equipment.firmwareVersion || undefined,
    manualLocation: equipment.manualLocation || undefined,
    accessories: equipment.accessories || undefined,
    technicalManager: equipment.technicalManager || undefined,
    initialLocation: (equipment as any).initialLocation || undefined,
    installationDate: (equipment as any).installationDate
      ? new Date((equipment as any).installationDate).toISOString().split('T')[0]
      : undefined,
    status: equipment.status || undefined,
    calibrationResult: equipment.calibrationResult || undefined,
    correctionFactor: equipment.correctionFactor || undefined,
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-5xl">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Edit3 className="h-6 w-6 text-primary" />
            장비 수정
          </h1>
          <p className="text-muted-foreground text-sm">
            {equipment.name}의 정보를 수정합니다
          </p>
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

      {/* 폼 */}
      <EquipmentForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isEdit={true}
        isLoading={updateEquipment.isPending}
      />
    </div>
  );
}
