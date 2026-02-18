'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { format, addMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Wrench, Clock, User, DollarSign, ClipboardCheck } from 'lucide-react';
import { queryKeys } from '@/lib/api/query-config';
import equipmentApi, { Equipment } from '@/lib/api/equipment-api';

/**
 * 점검 정보가 포함된 장비 타입
 *
 * 일부 장비는 정기 점검 주기(maintenancePeriod)를 가지고 있습니다.
 * 이 필드는 DB에 아직 추가되지 않았으나, 점검 등록 시 사용됩니다.
 *
 * TODO: maintenancePeriod 필드를 DB 스키마에 추가하고 이 타입을 제거
 */
interface EquipmentWithMaintenance extends Equipment {
  maintenancePeriod?: number;
}
import maintenanceApi, {
  CreateMaintenanceDto,
  MaintenanceType,
  MaintenanceStatus,
  MaintenanceResult,
} from '@/lib/api/maintenance-api';
// ToastAction import removed - not currently used

export function CreateMaintenanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const t = useTranslations('maintenance.create');
  const tTypes = useTranslations('maintenance.types');
  const tStatus = useTranslations('maintenance.status');
  const tResult = useTranslations('maintenance.result');

  // URL에서 장비 ID 파라미터 가져오기
  const equipmentIdParam = searchParams.get('equipmentId');

  // 폼 상태 관리
  const [equipmentId, setEquipmentId] = useState<string>(equipmentIdParam || '');
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceType>('regular');
  const [maintenanceDate, setMaintenanceDate] = useState<Date>(new Date());
  const [performedBy, setPerformedBy] = useState('');
  const [performedByContact, setPerformedByContact] = useState('');
  const [cost, setCost] = useState<string>('');
  const [status, setStatus] = useState<MaintenanceStatus>('scheduled');
  const [result, setResult] = useState<MaintenanceResult>('pending');
  const [notes, setNotes] = useState('');
  const [parts, setParts] = useState<string[]>([]);
  const [newPart, setNewPart] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [maintenancePeriod, setMaintenancePeriod] = useState<string>('0');
  const [useRegularPeriod, setUseRegularPeriod] = useState(true);
  const [calculatedNextDate, setCalculatedNextDate] = useState<Date | null>(null);

  // 장비 목록 조회
  const { data: equipmentData, isLoading: equipmentLoading } = useQuery({
    queryKey: queryKeys.equipment.search(searchTerm),
    queryFn: async () => {
      if (equipmentIdParam) {
        // 특정 장비 정보만 가져오기
        const equipment = await equipmentApi.getEquipment(equipmentIdParam);
        return [equipment];
      } else {
        // 목록 가져오기
        const response = await equipmentApi.getEquipmentList({
          search: searchTerm || undefined,
          pageSize: 100,
        });
        return response.data;
      }
    },
  });

  // 선택된 장비 정보 조회
  const { data: selectedEquipment, isLoading: selectedEquipmentLoading } = useQuery({
    queryKey: queryKeys.equipment.detail(equipmentId),
    queryFn: async (): Promise<EquipmentWithMaintenance> => {
      const equipment = await equipmentApi.getEquipment(equipmentId);
      return equipment as EquipmentWithMaintenance;
    },
    enabled: !!equipmentId && equipmentId !== '',
  });

  // 다음 점검일 계산
  useEffect(() => {
    if (maintenanceDate && parseInt(maintenancePeriod) > 0) {
      setCalculatedNextDate(addMonths(maintenanceDate, parseInt(maintenancePeriod)));
    } else {
      setCalculatedNextDate(null);
    }
  }, [maintenanceDate, maintenancePeriod]);

  // 선택된 장비의 정기 점검 주기 가져오기
  useEffect(() => {
    if (selectedEquipment && useRegularPeriod && maintenanceType === 'regular') {
      const period = selectedEquipment.maintenancePeriod ?? 0;
      setMaintenancePeriod(period.toString());
    }
  }, [selectedEquipment, useRegularPeriod, maintenanceType]);

  const createMaintenanceMutation = useMutation({
    mutationFn: (data: CreateMaintenanceDto) => maintenanceApi.createMaintenance(data),
    onSuccess: () => {
      toast({
        title: t('toasts.success'),
        description: t('toasts.successDesc'),
      });
      router.push('/maintenance');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.maintenance.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.equipment.all });
    },
    onError: (error: unknown) => {
      toast({
        title: t('toasts.error'),
        description: getErrorMessage(error, t('toasts.error')),
        variant: 'destructive',
      });
      console.error(error);
    },
  });

  // 부품 항목 추가
  const handleAddPart = () => {
    if (newPart.trim()) {
      setParts([...parts, newPart.trim()]);
      setNewPart('');
    }
  };

  // 부품 항목 제거
  const handleRemovePart = (index: number) => {
    const newParts = [...parts];
    newParts.splice(index, 1);
    setParts(newParts);
  };

  // 점검 등록 제출 처리
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!equipmentId) {
      toast({
        title: t('toasts.equipmentRequired'),
        description: t('toasts.equipmentRequiredDesc'),
        variant: 'destructive',
      });
      return;
    }

    if (!performedBy) {
      toast({
        title: t('toasts.performerRequired'),
        description: t('toasts.performerRequiredDesc'),
        variant: 'destructive',
      });
      return;
    }

    // 점검 데이터 생성
    const costValue = cost ? parseFloat(cost) : undefined;
    const periodValue = maintenancePeriod ? parseInt(maintenancePeriod) : undefined;

    const maintenanceData: CreateMaintenanceDto = {
      equipmentId,
      maintenanceType,
      maintenanceDate: maintenanceDate.toISOString(),
      nextMaintenanceDate: calculatedNextDate ? calculatedNextDate.toISOString() : undefined,
      maintenancePeriod: periodValue,
      performedBy,
      performedByContact,
      cost: costValue,
      result,
      status,
      parts: parts.length > 0 ? parts : undefined,
      notes,
    };

    // 점검 등록 제출
    createMaintenanceMutation.mutate(maintenanceData);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/maintenance')}>
          {t('backToList')}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('equipmentSelection.title')}</CardTitle>
            <CardDescription>
              {t('equipmentSelection.description')}{' '}
              {equipmentIdParam ? t('equipmentSelection.autoSelected') : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!equipmentIdParam && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder={t('equipmentSelection.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {equipmentLoading ? (
                    <p>{t('equipmentSelection.loading')}</p>
                  ) : equipmentData?.length === 0 ? (
                    <p>{t('equipmentSelection.empty')}</p>
                  ) : (
                    equipmentData?.map((equipment: Equipment) => (
                      <Card
                        key={equipment.id}
                        className={`cursor-pointer transition-colors ${equipmentId === String(equipment.id) ? 'border-primary' : ''}`}
                        onClick={() => setEquipmentId(String(equipment.id))}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium">{equipment.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {equipment.managementNumber}
                              </p>
                              <p className="text-sm mt-1">
                                {equipment.model} ({equipment.manufacturer})
                              </p>
                            </div>
                            <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center mt-1">
                              {equipmentId === String(equipment.id) && (
                                <div className="h-2 w-2 rounded-full bg-white" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}

            {equipmentId && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <h3 className="font-medium mb-2">{t('equipmentSelection.selectedTitle')}</h3>
                {selectedEquipmentLoading ? (
                  <p>{t('equipmentSelection.selectedLoading')}</p>
                ) : selectedEquipment ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('equipmentFields.name')}</p>
                      <p className="font-medium">{selectedEquipment.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t('equipmentFields.managementNumber')}
                      </p>
                      <p className="font-medium">{selectedEquipment.managementNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('equipmentFields.model')}</p>
                      <p className="font-medium">{selectedEquipment.model}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {t('equipmentFields.manufacturer')}
                      </p>
                      <p className="font-medium">{selectedEquipment.manufacturer}</p>
                    </div>
                    {selectedEquipment.maintenancePeriod && maintenanceType === 'regular' && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground">
                          {t('equipmentFields.regularPeriod')}
                        </p>
                        <p className="font-medium">
                          {t('equipmentFields.periodUnit', {
                            count: selectedEquipment.maintenancePeriod,
                          })}
                        </p>
                        <div className="flex items-center mt-2">
                          <Checkbox
                            id="useRegularPeriod"
                            checked={useRegularPeriod}
                            onCheckedChange={(checked) => setUseRegularPeriod(checked as boolean)}
                          />
                          <label htmlFor="useRegularPeriod" className="ml-2 text-sm">
                            {t('equipmentFields.useRegularPeriod')}
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p>{t('equipmentSelection.selectedEmpty')}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('info.title')}</CardTitle>
            <CardDescription>{t('info.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="maintenanceType">{t('fields.type')}</Label>
                <Select
                  value={maintenanceType}
                  onValueChange={(value: string) => setMaintenanceType(value as MaintenanceType)}
                >
                  <SelectTrigger id="maintenanceType">
                    <div className="flex items-center">
                      <Wrench className="mr-2 h-4 w-4" />
                      <SelectValue placeholder={t('fields.typePlaceholder')} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">{tTypes('regular')}</SelectItem>
                    <SelectItem value="repair">{tTypes('repair')}</SelectItem>
                    <SelectItem value="inspection">{tTypes('inspection')}</SelectItem>
                    <SelectItem value="other">{tTypes('other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">{t('fields.status')}</Label>
                <Select
                  value={status}
                  onValueChange={(value: string) => setStatus(value as MaintenanceStatus)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder={t('fields.statusPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">{tStatus('scheduled')}</SelectItem>
                    <SelectItem value="in_progress">{tStatus('in_progress')}</SelectItem>
                    <SelectItem value="completed">{tStatus('completed')}</SelectItem>
                    <SelectItem value="canceled">{tStatus('canceled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t('fields.date')}</Label>
                <DatePicker
                  selected={maintenanceDate}
                  onSelect={(date) => date && setMaintenanceDate(date)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="maintenancePeriod">{t('fields.period')}</Label>
                  {maintenanceType === 'regular' &&
                    selectedEquipment?.maintenancePeriod &&
                    !useRegularPeriod && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setMaintenancePeriod(
                            selectedEquipment.maintenancePeriod?.toString() ?? '0'
                          );
                        }}
                        className="text-xs"
                      >
                        {t('fields.applyDefault')}
                      </Button>
                    )}
                </div>
                <Input
                  id="maintenancePeriod"
                  type="number"
                  min="0"
                  step="1"
                  value={maintenancePeriod}
                  onChange={(e) => setMaintenancePeriod(e.target.value)}
                  disabled={
                    maintenanceType === 'regular' &&
                    useRegularPeriod &&
                    !!selectedEquipment?.maintenancePeriod
                  }
                />
                {calculatedNextDate && (
                  <div className="text-sm text-muted-foreground mt-1 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>
                      {t('fields.nextDate', {
                        date: format(calculatedNextDate, 'yyyy-MM-dd', { locale: ko }),
                      })}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="performedBy">{t('fields.performer')}</Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="performedBy"
                    placeholder={t('fields.performerPlaceholder')}
                    value={performedBy}
                    onChange={(e) => setPerformedBy(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="performedByContact">{t('fields.performerContact')}</Label>
                <Input
                  id="performedByContact"
                  placeholder={t('fields.performerContactPlaceholder')}
                  value={performedByContact}
                  onChange={(e) => setPerformedByContact(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">{t('fields.cost')}</Label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="cost"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder={t('fields.costPlaceholder')}
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="result">{t('fields.result')}</Label>
                <Select
                  value={result}
                  onValueChange={(value: string) => setResult(value as MaintenanceResult)}
                >
                  <SelectTrigger id="result">
                    <div className="flex items-center">
                      <ClipboardCheck className="mr-2 h-4 w-4" />
                      <SelectValue placeholder={t('fields.resultPlaceholder')} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{tResult('pending')}</SelectItem>
                    <SelectItem value="completed">{tResult('completed')}</SelectItem>
                    <SelectItem value="failed">{tResult('failed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="parts">{t('fields.parts')}</Label>
                <div className="flex space-x-2">
                  <Input
                    id="parts"
                    placeholder={t('fields.partsPlaceholder')}
                    value={newPart}
                    onChange={(e) => setNewPart(e.target.value)}
                  />
                  <Button type="button" onClick={handleAddPart} disabled={!newPart.trim()}>
                    {t('fields.partsAdd')}
                  </Button>
                </div>
                {parts.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {parts.map((part, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded-md"
                      >
                        <span>{part}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePart(index)}
                          className="h-6 w-6 p-0 text-red-500"
                        >
                          &times;
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="notes">{t('fields.notes')}</Label>
                <Textarea
                  id="notes"
                  placeholder={t('fields.notesPlaceholder')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/maintenance')}>
              {t('actions.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={createMaintenanceMutation.isPending || !equipmentId || !performedBy}
            >
              {createMaintenanceMutation.isPending ? t('actions.submitting') : t('actions.submit')}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
