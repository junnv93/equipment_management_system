'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Search, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import equipmentApi, { Equipment } from '@/lib/api/equipment-api';
import calibrationApi, { CreateCalibrationDto } from '@/lib/api/calibration-api';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';

type UserRole = 'test_operator' | 'technical_manager' | 'site_admin';

export default function CalibrationRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  // URL 파라미터에서 equipmentId 추출
  const equipmentIdFromUrl = searchParams.get('equipmentId');

  // 사용자 역할 결정 (기본값: test_operator)
  const userRole: UserRole = (session?.user as any)?.role || 'test_operator';
  const isTechnicalManager = userRole === 'technical_manager' || userRole === 'site_admin';

  // 상태 관리
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(equipmentIdFromUrl);

  // 폼 상태
  const [formData, setFormData] = useState<
    Omit<CreateCalibrationDto, 'equipmentId'> & {
      registrarComment?: string;
      intermediateCheckDate?: string;
    }
  >({
    calibrationDate: format(new Date(), 'yyyy-MM-dd'),
    nextCalibrationDate: '',
    calibrationAgency: '',
    calibrationCycle: 12,
    calibrationResult: 'PASS',
    notes: '',
    registrarComment: '',
    intermediateCheckDate: '',
  });

  // 장비 목록 불러오기
  const {
    data: equipmentData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['equipment'],
    queryFn: () =>
      equipmentApi.getEquipmentList({
        pageSize: 100,
      }),
  });

  // 선택된 장비 정보
  const selectedEquipment = selectedEquipmentId
    ? equipmentData?.data?.find((item: Equipment) => item.id === selectedEquipmentId)
    : null;

  // URL에서 장비 ID가 제공되었다면 해당 장비의 상세 정보 가져오기
  useEffect(() => {
    if (selectedEquipmentId && selectedEquipment) {
      if (selectedEquipment.calibrationCycle) {
        updateFormData('calibrationCycle', selectedEquipment.calibrationCycle);
      }

      const date = new Date(formData.calibrationDate);
      date.setMonth(date.getMonth() + formData.calibrationCycle);
      updateFormData('nextCalibrationDate', format(date, 'yyyy-MM-dd'));

      // 중간점검일 자동 계산 (교정 주기의 절반)
      const intermediateDate = new Date(formData.calibrationDate);
      intermediateDate.setMonth(
        intermediateDate.getMonth() + Math.floor(formData.calibrationCycle / 2)
      );
      updateFormData('intermediateCheckDate', format(intermediateDate, 'yyyy-MM-dd'));
    }
  }, [selectedEquipmentId, selectedEquipment]);

  // 필터링된 장비 목록
  const filteredEquipment =
    equipmentData?.data?.filter(
      (equipment: Equipment) =>
        equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        equipment.managementNumber.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  // 교정일 변경 시 다음 교정일 및 중간점검일 자동 계산
  const handleCalibrationDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCalibrationDate = e.target.value;
    updateFormData('calibrationDate', newCalibrationDate);

    if (formData.calibrationCycle) {
      const date = new Date(newCalibrationDate);
      date.setMonth(date.getMonth() + formData.calibrationCycle);
      updateFormData('nextCalibrationDate', format(date, 'yyyy-MM-dd'));

      // 중간점검일 자동 계산
      const intermediateDate = new Date(newCalibrationDate);
      intermediateDate.setMonth(
        intermediateDate.getMonth() + Math.floor(formData.calibrationCycle / 2)
      );
      updateFormData('intermediateCheckDate', format(intermediateDate, 'yyyy-MM-dd'));
    }
  };

  // 교정 주기 변경 시 다음 교정일 및 중간점검일 자동 계산
  const handleCalibrationCycleChange = (value: string) => {
    const cycle = parseInt(value, 10);
    updateFormData('calibrationCycle', cycle);

    if (formData.calibrationDate) {
      const date = new Date(formData.calibrationDate);
      date.setMonth(date.getMonth() + cycle);
      updateFormData('nextCalibrationDate', format(date, 'yyyy-MM-dd'));

      // 중간점검일 자동 계산
      const intermediateDate = new Date(formData.calibrationDate);
      intermediateDate.setMonth(intermediateDate.getMonth() + Math.floor(cycle / 2));
      updateFormData('intermediateCheckDate', format(intermediateDate, 'yyyy-MM-dd'));
    }
  };

  // 폼 데이터 업데이트
  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 교정 등록 mutation
  const registerCalibrationMutation = useMutation({
    mutationFn: (data: CreateCalibrationDto) => {
      return calibrationApi.createCalibration(data);
    },
    onSuccess: () => {
      const message = isTechnicalManager
        ? '교정 정보가 등록 및 승인되었습니다.'
        : '교정 정보가 등록되었습니다. 기술책임자의 승인을 기다려주세요.';
      toast({
        title: '교정 정보 등록 완료',
        description: message,
      });
      queryClient.invalidateQueries({ queryKey: ['calibration-history'] });
      queryClient.invalidateQueries({ queryKey: ['calibration-summary'] });
      queryClient.invalidateQueries({ queryKey: ['calibration-overdue'] });
      queryClient.invalidateQueries({ queryKey: ['calibration-upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      router.push('/calibration');
    },
    onError: (error: any) => {
      toast({
        title: '교정 정보 등록 실패',
        description: error?.message || '교정 정보 등록 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  // 폼 제출 처리
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEquipmentId) {
      toast({
        title: '장비를 선택해주세요',
        description: '교정 정보를 등록할 장비를 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    // 기술책임자는 등록자 코멘트 필수
    if (isTechnicalManager && !formData.registrarComment?.trim()) {
      toast({
        title: '등록자 코멘트를 입력해주세요',
        description: '기술책임자는 검토 코멘트를 반드시 입력해야 합니다.',
        variant: 'destructive',
      });
      return;
    }

    const calibrationData: CreateCalibrationDto = {
      equipmentId: selectedEquipmentId,
      calibrationDate: formData.calibrationDate,
      nextCalibrationDate: formData.nextCalibrationDate,
      calibrationAgency: formData.calibrationAgency,
      calibrationCycle: formData.calibrationCycle,
      calibrationResult: formData.calibrationResult,
      notes: formData.notes,
      registeredBy: session?.user?.id as string,
      registeredByRole: isTechnicalManager ? 'technical_manager' : 'test_operator',
      registrarComment: formData.registrarComment,
      intermediateCheckDate: formData.intermediateCheckDate,
    };

    registerCalibrationMutation.mutate(calibrationData);
  };

  return (
    <div className="p-6 space-y-6">
      {/* 상단 헤더 */}
      <div className="flex items-center">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold ml-2">교정 정보 등록</h1>
      </div>

      {/* 역할 안내 */}
      <Alert
        variant={isTechnicalManager ? 'default' : 'destructive'}
        className={!isTechnicalManager ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : ''}
      >
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {isTechnicalManager ? (
            <>
              <strong>기술책임자</strong>로 로그인되어 있습니다. 등록한 교정 정보는{' '}
              <strong>즉시 승인</strong>됩니다. 검토 코멘트를 반드시 입력해주세요.
            </>
          ) : (
            <>
              <strong>시험실무자</strong>로 로그인되어 있습니다. 등록한 교정 정보는{' '}
              <strong>기술책임자의 승인</strong> 후 적용됩니다.
            </>
          )}
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 장비 선택 패널 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>장비 선택</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="장비명, 관리번호 검색..."
                className="pl-8"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="border rounded-md h-[350px] overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <p>장비 목록을 불러오는 중...</p>
                </div>
              ) : isError ? (
                <div className="flex justify-center items-center h-full text-red-500">
                  <p>장비 목록을 불러오는 중 오류가 발생했습니다.</p>
                </div>
              ) : filteredEquipment.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <p>검색 결과가 없습니다.</p>
                </div>
              ) : (
                <ul className="divide-y">
                  {filteredEquipment.map((equipment: Equipment) => (
                    <li
                      key={equipment.id}
                      className={`p-3 hover:bg-gray-100 cursor-pointer ${
                        selectedEquipmentId === String(equipment.id)
                          ? 'bg-blue-50 border-l-4 border-blue-500'
                          : ''
                      }`}
                      onClick={() => setSelectedEquipmentId(String(equipment.id))}
                    >
                      <div className="font-medium">{equipment.name}</div>
                      <div className="text-sm text-gray-500">
                        관리번호: {equipment.managementNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        현재 상태: {equipment.status === 'available' ? '사용 가능' : '사용 중'}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 교정 정보 등록 폼 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>교정 정보 입력</CardTitle>
            <CardDescription>
              {isTechnicalManager
                ? '교정 정보를 검토 후 등록하세요. 코멘트 입력은 필수입니다.'
                : '교정 정보를 입력하세요. 기술책임자의 승인 후 반영됩니다.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedEquipment ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 선택된 장비 정보 요약 */}
                <div className="bg-gray-50 p-3 rounded-md mb-4">
                  <h3 className="font-medium">선택된 장비: {selectedEquipment.name}</h3>
                  <p className="text-sm">관리번호: {selectedEquipment.managementNumber}</p>
                  <p className="text-sm">
                    마지막 교정일:{' '}
                    {selectedEquipment.lastCalibrationDate
                      ? format(new Date(selectedEquipment.lastCalibrationDate), 'yyyy-MM-dd')
                      : '없음'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 교정일 */}
                  <div className="space-y-2">
                    <Label htmlFor="calibrationDate">교정일</Label>
                    <Input
                      id="calibrationDate"
                      name="calibrationDate"
                      type="date"
                      value={formData.calibrationDate}
                      onChange={handleCalibrationDateChange}
                      required
                    />
                  </div>

                  {/* 교정 주기 */}
                  <div className="space-y-2">
                    <Label htmlFor="calibrationCycle">교정 주기 (개월)</Label>
                    <Select
                      value={formData.calibrationCycle.toString()}
                      onValueChange={handleCalibrationCycleChange}
                    >
                      <SelectTrigger id="calibrationCycle">
                        <SelectValue placeholder="교정 주기 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3개월</SelectItem>
                        <SelectItem value="6">6개월</SelectItem>
                        <SelectItem value="12">12개월</SelectItem>
                        <SelectItem value="24">24개월</SelectItem>
                        <SelectItem value="36">36개월</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 다음 교정일 */}
                  <div className="space-y-2">
                    <Label htmlFor="nextCalibrationDate">다음 교정일</Label>
                    <Input
                      id="nextCalibrationDate"
                      name="nextCalibrationDate"
                      type="date"
                      value={formData.nextCalibrationDate}
                      onChange={(e) => updateFormData('nextCalibrationDate', e.target.value)}
                      required
                    />
                  </div>

                  {/* 중간점검일 */}
                  <div className="space-y-2">
                    <Label htmlFor="intermediateCheckDate">중간점검일</Label>
                    <Input
                      id="intermediateCheckDate"
                      name="intermediateCheckDate"
                      type="date"
                      value={formData.intermediateCheckDate}
                      onChange={(e) => updateFormData('intermediateCheckDate', e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      교정 주기의 중간 시점에 점검 알림이 발송됩니다.
                    </p>
                  </div>

                  {/* 교정 기관 */}
                  <div className="space-y-2">
                    <Label htmlFor="calibrationAgency">교정 기관</Label>
                    <Input
                      id="calibrationAgency"
                      name="calibrationAgency"
                      placeholder="교정을 수행한 기관 이름"
                      value={formData.calibrationAgency}
                      onChange={(e) => updateFormData('calibrationAgency', e.target.value)}
                      required
                    />
                  </div>

                  {/* 교정 결과 */}
                  <div className="space-y-2">
                    <Label htmlFor="calibrationResult">교정 결과</Label>
                    <Select
                      value={formData.calibrationResult}
                      onValueChange={(value) => updateFormData('calibrationResult', value)}
                    >
                      <SelectTrigger id="calibrationResult">
                        <SelectValue placeholder="교정 결과 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PASS">적합</SelectItem>
                        <SelectItem value="FAIL">부적합</SelectItem>
                        <SelectItem value="CONDITIONAL">조건부 적합</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 비고 */}
                <div className="space-y-2">
                  <Label htmlFor="notes">비고</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="교정 관련 추가 정보"
                    value={formData.notes || ''}
                    onChange={(e) => updateFormData('notes', e.target.value)}
                  />
                </div>

                {/* 기술책임자 등록자 코멘트 (기술책임자만 표시) */}
                {isTechnicalManager && (
                  <div className="space-y-2 border-t pt-4">
                    <Label htmlFor="registrarComment" className="text-blue-600 font-medium">
                      등록자 코멘트 (필수)
                    </Label>
                    <Textarea
                      id="registrarComment"
                      name="registrarComment"
                      placeholder="교정 결과 검토 내용을 입력해주세요."
                      value={formData.registrarComment || ''}
                      onChange={(e) => updateFormData('registrarComment', e.target.value)}
                      required
                      className="border-blue-200 focus:border-blue-500"
                    />
                    <p className="text-xs text-blue-600">
                      기술책임자로서 교정 결과 검토 완료를 표시하는 코멘트를 입력해야 합니다.
                    </p>
                  </div>
                )}

                {/* 제출 버튼 */}
                <div className="flex justify-end gap-2 mt-6">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    취소
                  </Button>
                  <Button
                    type="submit"
                    disabled={registerCalibrationMutation.isPending || !selectedEquipmentId}
                  >
                    {registerCalibrationMutation.isPending
                      ? '처리 중...'
                      : isTechnicalManager
                        ? '교정 정보 등록 및 승인'
                        : '교정 정보 등록 (승인 요청)'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-center">
                <p className="text-gray-500 mb-2">교정 정보를 등록할 장비를 선택해주세요.</p>
                <p className="text-sm text-gray-400">
                  좌측 패널에서 장비를 검색하고 선택할 수 있습니다.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
