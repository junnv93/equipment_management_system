'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-config';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { ArrowLeft } from 'lucide-react';
import equipmentImportApi, {
  type ReceivingCondition,
  type ReceiveEquipmentImportDto,
} from '@/lib/api/equipment-import-api';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import {
  CALIBRATION_METHOD_LABELS,
  CALIBRATION_METHOD_VALUES,
  EQUIPMENT_IMPORT_SOURCE_LABELS,
  type CalibrationMethod,
} from '@equipment-management/schemas';
import { addMonths, format as formatDate } from 'date-fns';

interface Props {
  id: string;
}

/**
 * Equipment Import Receive Form - Unified for rental and internal shared
 *
 * This form is identical for both import types as the receiving process
 * (condition check + calibration info) is the same regardless of source.
 */
export default function ReceiveEquipmentImportForm({ id }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [condition, setCondition] = useState<ReceivingCondition>({
    appearance: 'normal',
    operation: 'normal',
    accessories: 'complete',
    notes: '',
  });

  const [calibrationInfo, setCalibrationInfo] = useState<{
    calibrationMethod: CalibrationMethod;
    calibrationCycle?: number;
    lastCalibrationDate?: string;
    calibrationAgency?: string;
  }>({
    calibrationMethod: 'not_applicable',
  });

  // Auto-calculate next calibration date
  const [nextCalibrationDate, setNextCalibrationDate] = useState<string>('');

  useEffect(() => {
    if (
      calibrationInfo.calibrationMethod === 'external_calibration' &&
      calibrationInfo.calibrationCycle &&
      calibrationInfo.lastCalibrationDate
    ) {
      const next = addMonths(
        new Date(calibrationInfo.lastCalibrationDate),
        calibrationInfo.calibrationCycle
      );
      setNextCalibrationDate(formatDate(next, 'yyyy-MM-dd'));
    } else {
      setNextCalibrationDate('');
    }
  }, [
    calibrationInfo.calibrationCycle,
    calibrationInfo.lastCalibrationDate,
    calibrationInfo.calibrationMethod,
  ]);

  const { data: equipmentImport, isLoading } = useQuery({
    queryKey: queryKeys.equipmentImports.detail(id),
    queryFn: () => equipmentImportApi.getOne(id),
  });

  const receiveMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        receivingCondition: {
          ...condition,
          notes: condition.notes || undefined,
        },
      };

      // Add calibration info for external calibration
      if (calibrationInfo.calibrationMethod === 'external_calibration') {
        payload.calibrationInfo = {
          calibrationMethod: calibrationInfo.calibrationMethod,
          calibrationCycle: calibrationInfo.calibrationCycle,
          lastCalibrationDate: calibrationInfo.lastCalibrationDate,
          calibrationAgency: calibrationInfo.calibrationAgency,
        };
      } else if (calibrationInfo.calibrationMethod !== 'not_applicable') {
        payload.calibrationInfo = {
          calibrationMethod: calibrationInfo.calibrationMethod,
        };
      }

      return equipmentImportApi.receive(id, payload as unknown as ReceiveEquipmentImportDto);
    },
    onSuccess: () => {
      toast({
        title: '수령 확인이 완료되었습니다.',
        description: '장비가 자동으로 등록되었습니다.',
      });
      router.push(FRONTEND_ROUTES.EQUIPMENT_IMPORTS.DETAIL(id));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.equipmentImports.detail(id) });
    },
    onError: (error) => {
      toast({
        title: '수령 확인 실패',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">로딩 중...</div>
    );
  }

  if (!equipmentImport) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        반입 정보를 찾을 수 없습니다.
      </div>
    );
  }

  const sourceLabel = EQUIPMENT_IMPORT_SOURCE_LABELS[equipmentImport.sourceType];
  const ownerLabel =
    equipmentImport.sourceType === 'rental'
      ? equipmentImport.vendorName
      : equipmentImport.ownerDepartment;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push(FRONTEND_ROUTES.EQUIPMENT_IMPORTS.DETAIL(id))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">수령 확인</h1>
          <p className="text-muted-foreground">
            {equipmentImport.equipmentName} — {sourceLabel} ({ownerLabel})
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>상태점검</CardTitle>
          <CardDescription>
            수령한 장비의 상태를 점검하세요. 확인 완료 시 장비가 자동으로 시스템에 등록됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>외관 상태</Label>
              <Select
                value={condition.appearance}
                onValueChange={(value: 'normal' | 'abnormal') =>
                  setCondition((prev) => ({ ...prev, appearance: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">정상</SelectItem>
                  <SelectItem value="abnormal">이상</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>작동 상태</Label>
              <Select
                value={condition.operation}
                onValueChange={(value: 'normal' | 'abnormal') =>
                  setCondition((prev) => ({ ...prev, operation: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">정상</SelectItem>
                  <SelectItem value="abnormal">이상</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>부속품 상태</Label>
              <Select
                value={condition.accessories}
                onValueChange={(value: 'complete' | 'incomplete') =>
                  setCondition((prev) => ({ ...prev, accessories: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="complete">완전</SelectItem>
                  <SelectItem value="incomplete">불완전</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">비고</Label>
            <Textarea
              id="notes"
              value={condition.notes || ''}
              onChange={(e) => setCondition((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="특이사항이 있으면 기록하세요."
            />
          </div>

          {/* Calibration Information Section */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-medium">교정 정보</h3>

            {/* Calibration Method */}
            <div className="space-y-2">
              <Label htmlFor="calibrationMethod">관리 방법 *</Label>
              <Select
                value={calibrationInfo.calibrationMethod}
                onValueChange={(value) =>
                  setCalibrationInfo({
                    ...calibrationInfo,
                    calibrationMethod: value as CalibrationMethod,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CALIBRATION_METHOD_VALUES.map((method) => (
                    <SelectItem key={method} value={method}>
                      {CALIBRATION_METHOD_LABELS[method]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Additional fields for external calibration */}
            {calibrationInfo.calibrationMethod === 'external_calibration' && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Calibration Cycle */}
                  <div className="space-y-2">
                    <Label htmlFor="calibrationCycle">
                      교정 주기 (개월) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="calibrationCycle"
                      type="number"
                      min="1"
                      value={calibrationInfo.calibrationCycle || ''}
                      onChange={(e) =>
                        setCalibrationInfo({
                          ...calibrationInfo,
                          calibrationCycle: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="12"
                    />
                  </div>

                  {/* Last Calibration Date */}
                  <div className="space-y-2">
                    <Label htmlFor="lastCalibrationDate">
                      최종 교정일 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="lastCalibrationDate"
                      type="date"
                      value={calibrationInfo.lastCalibrationDate || ''}
                      onChange={(e) =>
                        setCalibrationInfo({
                          ...calibrationInfo,
                          lastCalibrationDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Calibration Agency */}
                <div className="space-y-2">
                  <Label htmlFor="calibrationAgency">
                    교정 기관 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="calibrationAgency"
                    value={calibrationInfo.calibrationAgency || ''}
                    onChange={(e) =>
                      setCalibrationInfo({
                        ...calibrationInfo,
                        calibrationAgency: e.target.value,
                      })
                    }
                    placeholder="예: HCT, ABC 교정사"
                  />
                </div>

                {/* Next Calibration Date (auto-calculated, read-only) */}
                {nextCalibrationDate && (
                  <div className="space-y-2">
                    <Label htmlFor="nextCalibrationDate">다음 교정일 (자동 계산)</Label>
                    <Input
                      id="nextCalibrationDate"
                      value={nextCalibrationDate}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(FRONTEND_ROUTES.EQUIPMENT_IMPORTS.DETAIL(id))}
          >
            취소
          </Button>
          <Button onClick={() => receiveMutation.mutate()} disabled={receiveMutation.isPending}>
            {receiveMutation.isPending ? '처리 중...' : '수령 확인'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
