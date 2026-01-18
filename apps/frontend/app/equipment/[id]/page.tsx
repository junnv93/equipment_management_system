'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Edit,
  Settings,
  MapPin,
  Tag,
  Clipboard,
  Clock,
  Plus,
  Wrench,
  ClipboardList,
  History,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useEquipment } from '@/hooks/use-equipment';
import { useQuery } from '@tanstack/react-query';
import calibrationApi from '@/lib/api/calibration-api';
import maintenanceApi from '@/lib/api/maintenance-api';
import dayjs from 'dayjs';

export default function EquipmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const equipmentId = params.id as string;
  const [activeTab, setActiveTab] = useState('info');

  // 커스텀 훅을 사용하여 장비 정보 가져오기
  const { data: equipment, isLoading, isError } = useEquipment(equipmentId);

  // 교정 이력 가져오기
  const {
    data: calibrations,
    isLoading: isCalibrationLoading,
    isError: isCalibrationError,
  } = useQuery({
    queryKey: ['calibration', 'equipment', equipmentId],
    queryFn: () => calibrationApi.getEquipmentCalibrations(equipmentId),
    enabled: !!equipmentId,
  });

  // 점검 이력 가져오기
  const {
    data: maintenances,
    isLoading: isMaintenanceLoading,
    isError: isMaintenanceError,
  } = useQuery({
    queryKey: ['maintenance', 'equipment', equipmentId],
    queryFn: () => maintenanceApi.getEquipmentMaintenances(equipmentId),
    enabled: !!equipmentId && activeTab === 'maintenance',
  });

  // API 데이터 로딩 중 표시
  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p>장비 정보를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  // API 에러 표시
  if (isError || !equipment) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <div className="text-center text-red-500">
          <p className="text-lg font-bold mb-2">오류 발생</p>
          <p>장비 정보를 불러오는 데 실패했습니다.</p>
          <Button variant="outline" onClick={() => router.back()} className="mt-4">
            뒤로 가기
          </Button>
        </div>
      </div>
    );
  }

  // 상태에 따른 뱃지 컴포넌트
  const getStatusBadge = (status: string | undefined) => {
    if (!status) return null;
    const statusConfig: Record<string, { class: string; label: string }> = {
      AVAILABLE: { class: 'bg-green-100 text-green-800', label: '사용 가능' },
      IN_USE: { class: 'bg-blue-100 text-blue-800', label: '사용 중' },
      MAINTENANCE: { class: 'bg-yellow-100 text-yellow-800', label: '유지보수 중' },
      CALIBRATION: { class: 'bg-purple-100 text-purple-800', label: '교정 중' },
      DISPOSAL: { class: 'bg-red-100 text-red-800', label: '폐기' },
    };

    const config = statusConfig[status] || {
      class: 'bg-gray-100 text-gray-800',
      label: '알 수 없음',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  // 교정 결과에 따른 뱃지
  const getCalibrationResultBadge = (result: string) => {
    const resultConfig: Record<string, { variant: string; label: string }> = {
      PASS: { variant: 'success', label: '적합' },
      FAIL: { variant: 'destructive', label: '부적합' },
      CONDITIONAL: { variant: 'warning', label: '조건부 적합' },
    };

    const config = resultConfig[result] || { variant: 'outline', label: '미확인' };

    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  // 점검 상태에 따른 배지 스타일
  const getMaintenanceStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-800 hover:bg-blue-50">
            예정됨
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 hover:bg-yellow-50">
            진행 중
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-800 hover:bg-green-50">
            완료됨
          </Badge>
        );
      case 'canceled':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-800 hover:bg-gray-50">
            취소됨
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // 점검 결과에 따른 배지 스타일
  const getMaintenanceResultBadge = (result: string) => {
    switch (result) {
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-800 hover:bg-green-50">
            통과
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 hover:bg-yellow-50">
            보류
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-800 hover:bg-red-50">
            불합격
          </Badge>
        );
      default:
        return <Badge variant="outline">{result}</Badge>;
    }
  };

  // 점검 유형에 따른 한글 표시
  const getMaintenanceTypeText = (type: string) => {
    switch (type) {
      case 'regular':
        return '정기 점검';
      case 'repair':
        return '수리';
      case 'inspection':
        return '검사';
      case 'other':
        return '기타';
      default:
        return type;
    }
  };

  // 날짜 포맷 함수
  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return '-';
    try {
      return dayjs(dateString).format('YYYY-MM-DD');
    } catch (error) {
      return String(dateString);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{equipment.name}</h1>
          {equipment.status && getStatusBadge(equipment.status)}
        </div>
        <div className="flex gap-2">
          <Link href={`/equipment/${equipmentId}/rent`}>
            <Button>장비 대여</Button>
          </Link>
          <Link href={`/equipment/${equipmentId}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              수정
            </Button>
          </Link>
        </div>
      </div>

      {/* 탭 내비게이션 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">기본 정보</TabsTrigger>
          <TabsTrigger value="calibration">교정 정보</TabsTrigger>
          <TabsTrigger value="rental">대여 이력</TabsTrigger>
          <TabsTrigger value="checkout">반출 이력</TabsTrigger>
          <TabsTrigger value="maintenance">점검 이력</TabsTrigger>
        </TabsList>

        {/* 기본 정보 탭 */}
        <TabsContent value="info" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">관리번호</p>
                    <p className="font-medium">{equipment.managementNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">모델명</p>
                    <p className="font-medium">{equipment.model}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">제조사</p>
                    <p className="font-medium">{equipment.manufacturer}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">일련번호</p>
                    <p className="font-medium">{equipment.serialNumber || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">구입일</p>
                    <p className="font-medium">
                      {equipment.purchaseYear
                        ? `${equipment.purchaseYear}년`
                        : formatDate(equipment.purchaseDate)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">카테고리</p>
                    <p className="font-medium">{(equipment as any).category || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>위치 및 관리 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">현재 위치</p>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                      <p className="font-medium">{equipment.location}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">소속 팀</p>
                    <div className="flex items-center">
                      <Tag className="h-4 w-4 mr-1 text-gray-500" />
                      <p className="font-medium">{equipment.teamName || '-'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {equipment.description && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>상세 설명</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{equipment.description}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* 교정 정보 탭 */}
        <TabsContent value="calibration" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>교정 정보</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/calibration/register?equipmentId=${equipmentId}`)}
              >
                <Plus className="h-4 w-4 mr-1" />
                교정 등록
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">교정 주기 (개월)</p>
                  <p className="font-medium">{equipment.calibrationCycle || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">마지막 교정일</p>
                  <p className="font-medium">{formatDate(equipment.lastCalibrationDate)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">다음 교정 예정일</p>
                  <p className="font-medium">{formatDate(equipment.nextCalibrationDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 교정 이력 */}
          <Card>
            <CardHeader>
              <CardTitle>교정 이력</CardTitle>
              <CardDescription>이 장비의 모든 교정 이력을 확인할 수 있습니다</CardDescription>
            </CardHeader>
            <CardContent>
              {isCalibrationLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-center">
                    <div className="w-6 h-6 border-2 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">교정 이력을 불러오는 중...</p>
                  </div>
                </div>
              ) : isCalibrationError ? (
                <div className="flex justify-center py-4 text-red-500">
                  <p>교정 이력을 불러오는 중 오류가 발생했습니다.</p>
                </div>
              ) : calibrations && calibrations.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>교정일</TableHead>
                      <TableHead>다음 교정일</TableHead>
                      <TableHead>교정 기관</TableHead>
                      <TableHead>결과</TableHead>
                      <TableHead>비고</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calibrations.map((calibration) => (
                      <TableRow key={calibration.id}>
                        <TableCell className="font-medium">
                          {formatDate(calibration.calibrationDate)}
                        </TableCell>
                        <TableCell>{formatDate(calibration.nextCalibrationDate)}</TableCell>
                        <TableCell>{calibration.calibrationAgency}</TableCell>
                        <TableCell>
                          {getCalibrationResultBadge(calibration.calibrationResult)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {calibration.notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  <p>등록된 교정 이력이 없습니다.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => router.push(`/calibration/register?equipmentId=${equipmentId}`)}
                  >
                    교정 정보 등록하기
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 대여 이력 탭 */}
        <TabsContent value="rental" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>대여 이력</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center py-4 text-gray-500">
                대여 이력 데이터는 현재 준비 중입니다.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 유지보수 탭 */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>점검 이력</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/maintenance/create?equipmentId=${equipmentId}`)}
              >
                <Plus className="h-4 w-4 mr-1" />
                점검 등록
              </Button>
            </CardHeader>
            <CardContent>
              {isMaintenanceLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="text-center">
                    <div className="w-6 h-6 border-2 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">점검 이력을 불러오는 중...</p>
                  </div>
                </div>
              ) : isMaintenanceError ? (
                <div className="flex justify-center py-4 text-red-500">
                  <p>점검 이력을 불러오는 중 오류가 발생했습니다.</p>
                </div>
              ) : maintenances && maintenances.data && maintenances.data.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>점검 유형</TableHead>
                      <TableHead>점검일</TableHead>
                      <TableHead>다음 점검일</TableHead>
                      <TableHead>담당자</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>결과</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenances.data.map((maintenance) => (
                      <TableRow
                        key={maintenance.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/maintenance/${maintenance.id}`)}
                      >
                        <TableCell>{getMaintenanceTypeText(maintenance.maintenanceType)}</TableCell>
                        <TableCell className="font-medium">
                          {formatDate(maintenance.maintenanceDate)}
                        </TableCell>
                        <TableCell>{formatDate(maintenance.nextMaintenanceDate)}</TableCell>
                        <TableCell>{maintenance.performedBy}</TableCell>
                        <TableCell>{getMaintenanceStatusBadge(maintenance.status)}</TableCell>
                        <TableCell>{getMaintenanceResultBadge(maintenance.result)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Wrench className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  <p>등록된 점검 이력이 없습니다.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => router.push(`/maintenance/create?equipmentId=${equipmentId}`)}
                  >
                    점검 정보 등록하기
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
