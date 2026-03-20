'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, AlertCircle } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { useQuery } from '@tanstack/react-query';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import equipmentApi, { Equipment } from '@/lib/api/equipment-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { SELECTOR_PAGE_SIZE } from '@equipment-management/shared-constants';
import calibrationApi, { CreateCalibrationDto, Calibration } from '@/lib/api/calibration-api';
import { format, addMonths } from 'date-fns';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import {
  type UserRole,
  UserRoleValues as URVal,
  EquipmentStatusValues as ESVal,
} from '@equipment-management/schemas';
import {
  getEquipmentSelectionClasses,
  CALIBRATION_SELECTION,
  CALIBRATION_EMPTY_STATE,
  getPageContainerClasses,
} from '@/lib/design-tokens';
import { PageHeader } from '@/components/shared/PageHeader';

export function CalibrationRegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { toast } = useToast();
  const t = useTranslations('calibration');

  // URL 파라미터에서 equipmentId 추출
  const equipmentIdFromUrl = searchParams.get('equipmentId');

  // 사용자 역할 결정 (기본값: test_engineer)
  const userRole: UserRole =
    (session?.user as { role?: UserRole } | undefined)?.role || URVal.TEST_ENGINEER;

  // UL-QP-18 직무분리 원칙: 시험실무자만 교정 등록 가능
  const canRegisterCalibration = userRole === URVal.TEST_ENGINEER;
  const isUnauthorized = !canRegisterCalibration;

  // 상태 관리
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(equipmentIdFromUrl);

  // 폼 상태 (calibrationCycle은 UI 계산용으로만 사용, API에는 전송하지 않음)
  const [formData, setFormData] = useState<
    Omit<CreateCalibrationDto, 'equipmentId'> & {
      calibrationCycle: number;
    }
  >({
    calibrationDate: format(new Date(), 'yyyy-MM-dd'),
    nextCalibrationDate: '',
    calibrationAgency: '',
    calibrationCycle: 12,
    result: 'pass',
    notes: '',
    intermediateCheckDate: '',
  });

  // 장비 목록 불러오기
  const {
    data: equipmentData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.equipment.list({ pageSize: SELECTOR_PAGE_SIZE }),
    queryFn: () =>
      equipmentApi.getEquipmentList({
        pageSize: SELECTOR_PAGE_SIZE,
      }),
    ...QUERY_CONFIG.EQUIPMENT_LIST,
  });

  // 선택된 장비 정보
  const selectedEquipment = selectedEquipmentId
    ? equipmentData?.data?.find((item: Equipment) => item.id === selectedEquipmentId)
    : null;

  // 폼 데이터 업데이트
  const updateFormData = useCallback((field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // URL에서 장비 ID가 제공되었다면 해당 장비의 상세 정보 가져오기
  useEffect(() => {
    if (selectedEquipmentId && selectedEquipment) {
      const cycle = selectedEquipment.calibrationCycle || formData.calibrationCycle;
      if (selectedEquipment.calibrationCycle) {
        updateFormData('calibrationCycle', selectedEquipment.calibrationCycle);
      }

      updateFormData(
        'nextCalibrationDate',
        format(addMonths(new Date(formData.calibrationDate), cycle), 'yyyy-MM-dd')
      );

      // 중간점검일 자동 계산 (교정 주기의 절반)
      updateFormData(
        'intermediateCheckDate',
        format(addMonths(new Date(formData.calibrationDate), Math.floor(cycle / 2)), 'yyyy-MM-dd')
      );
    }
  }, [
    selectedEquipmentId,
    selectedEquipment,
    formData.calibrationDate,
    formData.calibrationCycle,
    updateFormData,
  ]);

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
      updateFormData(
        'nextCalibrationDate',
        format(addMonths(new Date(newCalibrationDate), formData.calibrationCycle), 'yyyy-MM-dd')
      );

      // 중간점검일 자동 계산
      updateFormData(
        'intermediateCheckDate',
        format(
          addMonths(new Date(newCalibrationDate), Math.floor(formData.calibrationCycle / 2)),
          'yyyy-MM-dd'
        )
      );
    }
  };

  // 교정 주기 변경 시 다음 교정일 및 중간점검일 자동 계산
  const handleCalibrationCycleChange = (value: string) => {
    const cycle = parseInt(value, 10);
    updateFormData('calibrationCycle', cycle);

    if (formData.calibrationDate) {
      updateFormData(
        'nextCalibrationDate',
        format(addMonths(new Date(formData.calibrationDate), cycle), 'yyyy-MM-dd')
      );

      // 중간점검일 자동 계산
      updateFormData(
        'intermediateCheckDate',
        format(addMonths(new Date(formData.calibrationDate), Math.floor(cycle / 2)), 'yyyy-MM-dd')
      );
    }
  };

  // ✅ 교정 등록 mutation - Optimistic Update 패턴
  const registerCalibrationMutation = useOptimisticMutation<
    Calibration,
    CreateCalibrationDto,
    Equipment
  >({
    mutationFn: (data) => calibrationApi.createCalibration(data),
    queryKey: selectedEquipmentId
      ? queryKeys.equipment.detail(selectedEquipmentId)
      : queryKeys.equipment.all,
    optimisticUpdate: (oldEquipment, data): Equipment => {
      // ✅ oldEquipment가 없으면 원본 그대로 반환 (빈 객체 대신)
      if (!oldEquipment) {
        return {} as Equipment; // Type assertion for undefined case
      }

      // ✅ 해당 장비만 즉시 업데이트 (D-day 배지 실시간 반영)
      return {
        ...oldEquipment,
        lastCalibrationDate: data.calibrationDate,
        nextCalibrationDate: data.nextCalibrationDate,
        status: ESVal.AVAILABLE, // 교정 완료 후 사용 가능 상태로
      } as unknown as Equipment;
    },
    invalidateKeys: [
      queryKeys.calibrations.historyList(),
      queryKeys.calibrations.summary(),
      queryKeys.calibrations.overdue(),
      queryKeys.calibrations.upcoming(),
    ],
    successMessage: t('toasts.registerSuccess'),
    errorMessage: t('toasts.registerError'),
    onSuccessCallback: () => router.push('/calibration'),
  });

  // 폼 제출 처리
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.id) {
      toast({
        title: t('register.toasts.sessionError'),
        description: t('register.toasts.sessionErrorDesc'),
        variant: 'destructive',
      });
      return;
    }

    if (!selectedEquipmentId) {
      toast({
        title: t('register.toasts.selectEquipment'),
        description: t('register.toasts.selectEquipmentDesc'),
        variant: 'destructive',
      });
      return;
    }

    const calibrationData: CreateCalibrationDto = {
      equipmentId: selectedEquipmentId,
      calibrationDate: formData.calibrationDate,
      nextCalibrationDate: formData.nextCalibrationDate,
      calibrationAgency: formData.calibrationAgency,
      result: formData.result,
      notes: formData.notes,
      calibrationManagerId: session.user.id,
      registeredBy: session.user.id,
      intermediateCheckDate: formData.intermediateCheckDate,
    };

    registerCalibrationMutation.mutate(calibrationData);
  };

  return (
    <div className={getPageContainerClasses()}>
      {/* 상단 헤더 */}
      <PageHeader
        title={t('register.title')}
        subtitle={t('register.subtitle')}
        onBack={() => router.back()}
      />

      {/* 권한 안내 */}
      <Alert variant={isUnauthorized ? 'destructive' : 'default'}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {isUnauthorized ? (
            <>
              <strong>{t('register.unauthorized.title')}</strong>:{' '}
              {t('register.unauthorized.description')}
              <br />
              {t('register.unauthorized.currentRole')}: <strong>{userRole}</strong> —{' '}
              {t('register.unauthorized.approvalOnly')}
            </>
          ) : (
            <>
              <strong>{t('register.authorized.role')}</strong>
              {t('register.authorized.description')}
            </>
          )}
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 장비 선택 패널 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t('register.equipmentSelection.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('register.equipmentSelection.searchPlaceholder')}
                className="pl-8"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="border rounded-md h-[350px] overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <p>{t('register.equipmentSelection.loading')}</p>
                </div>
              ) : isError ? (
                <div className="flex justify-center items-center h-full text-destructive">
                  <p>{t('register.equipmentSelection.error')}</p>
                </div>
              ) : filteredEquipment.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <p>{t('register.equipmentSelection.noResults')}</p>
                </div>
              ) : (
                <ul className="divide-y" role="listbox">
                  {filteredEquipment.map((equipment: Equipment) => {
                    const isSelected = selectedEquipmentId === String(equipment.id);
                    return (
                      <li
                        key={equipment.id}
                        className={getEquipmentSelectionClasses(isSelected)}
                        onClick={() => setSelectedEquipmentId(String(equipment.id))}
                        role="option"
                        aria-selected={isSelected}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedEquipmentId(String(equipment.id));
                          }
                        }}
                      >
                        <div className="font-medium">{equipment.name}</div>
                        <div className={CALIBRATION_SELECTION.infoText}>
                          {t('register.equipmentSelection.managementNumber')}:{' '}
                          {equipment.managementNumber}
                        </div>
                        <div className={CALIBRATION_SELECTION.infoText}>
                          {t('register.equipmentSelection.currentStatus')}:{' '}
                          {equipment.status === ESVal.AVAILABLE
                            ? t('register.equipmentSelection.statusAvailable')
                            : t('register.equipmentSelection.statusInUse')}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 교정 정보 등록 폼 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('register.form.title')}</CardTitle>
            <CardDescription>{t('register.form.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedEquipment ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 선택된 장비 정보 요약 */}
                <div className="bg-muted p-3 rounded-md mb-4">
                  <h3 className="font-medium">
                    {t('register.form.selectedEquipment')}: {selectedEquipment.name}
                  </h3>
                  <p className="text-sm">
                    {t('register.form.managementNumber')}: {selectedEquipment.managementNumber}
                  </p>
                  <p className="text-sm">
                    {t('register.form.lastCalibrationDate')}:{' '}
                    {selectedEquipment.lastCalibrationDate
                      ? format(new Date(selectedEquipment.lastCalibrationDate), 'yyyy-MM-dd')
                      : t('register.form.noDate')}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 교정일 */}
                  <div className="space-y-2">
                    <Label htmlFor="calibrationDate">{t('register.form.calibrationDate')}</Label>
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
                    <Label htmlFor="calibrationCycle">{t('register.form.calibrationCycle')}</Label>
                    <Select
                      value={formData.calibrationCycle.toString()}
                      onValueChange={handleCalibrationCycleChange}
                    >
                      <SelectTrigger id="calibrationCycle">
                        <SelectValue placeholder={t('register.form.calibrationCyclePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">
                          {t('register.form.cycleMonths', { count: 3 })}
                        </SelectItem>
                        <SelectItem value="6">
                          {t('register.form.cycleMonths', { count: 6 })}
                        </SelectItem>
                        <SelectItem value="12">
                          {t('register.form.cycleMonths', { count: 12 })}
                        </SelectItem>
                        <SelectItem value="24">
                          {t('register.form.cycleMonths', { count: 24 })}
                        </SelectItem>
                        <SelectItem value="36">
                          {t('register.form.cycleMonths', { count: 36 })}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 다음 교정일 */}
                  <div className="space-y-2">
                    <Label htmlFor="nextCalibrationDate">
                      {t('register.form.nextCalibrationDate')}
                    </Label>
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
                    <Label htmlFor="intermediateCheckDate">
                      {t('register.form.intermediateCheckDate')}
                    </Label>
                    <Input
                      id="intermediateCheckDate"
                      name="intermediateCheckDate"
                      type="date"
                      value={formData.intermediateCheckDate}
                      onChange={(e) => updateFormData('intermediateCheckDate', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('register.form.intermediateCheckHint')}
                    </p>
                  </div>

                  {/* 교정 기관 */}
                  <div className="space-y-2">
                    <Label htmlFor="calibrationAgency">
                      {t('register.form.calibrationAgency')}
                    </Label>
                    <Input
                      id="calibrationAgency"
                      name="calibrationAgency"
                      placeholder={t('register.form.calibrationAgencyPlaceholder')}
                      value={formData.calibrationAgency}
                      onChange={(e) => updateFormData('calibrationAgency', e.target.value)}
                      required
                    />
                  </div>

                  {/* 교정 결과 */}
                  <div className="space-y-2">
                    <Label htmlFor="result">{t('register.form.result')}</Label>
                    <Select
                      value={formData.result}
                      onValueChange={(value) => updateFormData('result', value)}
                    >
                      <SelectTrigger id="result">
                        <SelectValue placeholder={t('register.form.resultPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pass">{t('register.form.resultPass')}</SelectItem>
                        <SelectItem value="fail">{t('register.form.resultFail')}</SelectItem>
                        <SelectItem value="conditional">
                          {t('register.form.resultConditional')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 비고 */}
                <div className="space-y-2">
                  <Label htmlFor="notes">{t('register.form.notes')}</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder={t('register.form.notesPlaceholder')}
                    value={formData.notes || ''}
                    onChange={(e) => updateFormData('notes', e.target.value)}
                  />
                </div>

                {/* 제출 버튼 */}
                <div className="flex justify-end gap-2 mt-6">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    {t('register.actions.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      registerCalibrationMutation.isPending ||
                      !selectedEquipmentId ||
                      isUnauthorized
                    }
                  >
                    {registerCalibrationMutation.isPending
                      ? t('register.actions.processing')
                      : t('register.actions.submit')}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-center">
                <p className={`${CALIBRATION_EMPTY_STATE.description} mb-2`}>
                  {t('register.emptyState.title')}
                </p>
                <p className="text-sm text-muted-foreground/70">{t('register.emptyState.hint')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
