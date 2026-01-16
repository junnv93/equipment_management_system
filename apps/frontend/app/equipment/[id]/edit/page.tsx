'use client';

import { useParams, useRouter } from 'next/navigation';
import { EquipmentForm } from '@/components/equipment/EquipmentForm';
import { useEquipment, useUpdateEquipment } from '@/hooks/use-equipment';
import { UpdateEquipmentInput } from '@equipment-management/schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditEquipmentPage() {
  const router = useRouter();
  const params = useParams();
  const equipmentId = params.id as string;

  const { data: equipment, isLoading, isError } = useEquipment(equipmentId);
  const updateEquipment = useUpdateEquipment();

  const handleSubmit = async (data: UpdateEquipmentInput) => {
    try {
      await updateEquipment.mutateAsync({
        id: equipmentId,
        data,
      });
      router.push(`/equipment/${equipmentId}`);
    } catch (error) {
      // 에러는 훅에서 처리됨
      console.error('Failed to update equipment:', error);
    }
  };

  const handleCancel = () => {
    router.push(`/equipment/${equipmentId}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !equipment) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-500">
              <p className="text-lg font-bold mb-2">오류 발생</p>
              <p>장비 정보를 불러오는 데 실패했습니다.</p>
              <Button variant="outline" onClick={handleCancel} className="mt-4">
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
    name: equipment.name,
    managementNumber: equipment.managementNumber,
    assetNumber: equipment.assetNumber,
    modelName: equipment.modelName,
    manufacturer: equipment.manufacturer,
    serialNumber: equipment.serialNumber,
    location: equipment.location,
    description: equipment.description,
    calibrationCycle: equipment.calibrationCycle,
    lastCalibrationDate: equipment.lastCalibrationDate,
    nextCalibrationDate: equipment.nextCalibrationDate,
    calibrationAgency: equipment.calibrationAgency,
    needsIntermediateCheck: equipment.needsIntermediateCheck,
    calibrationMethod: equipment.calibrationMethod,
    purchaseYear: equipment.purchaseYear,
    teamId: typeof equipment.teamId === 'number' ? equipment.teamId : undefined,
    managerId: equipment.managerId,
    supplier: equipment.supplier,
    contactInfo: equipment.contactInfo,
    softwareVersion: equipment.softwareVersion,
    firmwareVersion: equipment.firmwareVersion,
    manualLocation: equipment.manualLocation,
    accessories: equipment.accessories,
    mainFeatures: equipment.mainFeatures,
    technicalManager: equipment.technicalManager,
    status: equipment.status,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">장비 수정</h1>
          <p className="text-muted-foreground">{equipment.name}의 정보를 수정합니다</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>장비 정보 수정</CardTitle>
          <CardDescription>수정할 항목을 변경한 후 수정 버튼을 클릭하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <EquipmentForm
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isEdit={true}
            isLoading={updateEquipment.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
