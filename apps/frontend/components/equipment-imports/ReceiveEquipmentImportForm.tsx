'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-config';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';
import { EquipmentImportCacheInvalidation } from '@/lib/api/cache-invalidation';
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
import { getPageContainerClasses } from '@/lib/design-tokens';
import { PageHeader } from '@/components/shared/PageHeader';
import equipmentImportApi, {
  type ReceivingCondition,
  type ReceiveEquipmentImportDto,
} from '@/lib/api/equipment-import-api';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import {
  CALIBRATION_METHOD_LABELS,
  CALIBRATION_METHOD_VALUES,
  EQUIPMENT_IMPORT_SOURCE_LABELS,
  EquipmentImportSourceValues as EISrcVal,
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
  const t = useTranslations('equipment');
  const tCommon = useTranslations('common');
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
      EquipmentImportCacheInvalidation.invalidateAfterReceive(queryClient, id);
      toast({
        title: t('receiveEquipmentImport.toasts.success'),
        description: t('receiveEquipmentImport.toasts.successDesc'),
      });
      router.push(FRONTEND_ROUTES.EQUIPMENT_IMPORTS.DETAIL(id));
    },
    onError: (error) => {
      toast({
        title: t('receiveEquipmentImport.toasts.error'),
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        {tCommon('status.loading')}
      </div>
    );
  }

  if (!equipmentImport) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        {t('receiveEquipmentImport.notFound')}
      </div>
    );
  }

  const sourceLabel = EQUIPMENT_IMPORT_SOURCE_LABELS[equipmentImport.sourceType];
  const ownerLabel =
    equipmentImport.sourceType === EISrcVal.RENTAL
      ? equipmentImport.vendorName
      : equipmentImport.ownerDepartment;

  return (
    <div className={getPageContainerClasses('form')}>
      <PageHeader
        title={t('receiveEquipmentImport.title')}
        subtitle={`${equipmentImport.equipmentName} — ${sourceLabel} (${ownerLabel})`}
        onBack={() => router.push(FRONTEND_ROUTES.EQUIPMENT_IMPORTS.DETAIL(id))}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t('receiveEquipmentImport.conditionCheck.title')}</CardTitle>
          <CardDescription>
            {t('receiveEquipmentImport.conditionCheck.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>{t('receiveEquipmentImport.conditionCheck.appearance')}</Label>
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
                  <SelectItem value="normal">
                    {t('receiveEquipmentImport.conditionCheck.normal')}
                  </SelectItem>
                  <SelectItem value="abnormal">
                    {t('receiveEquipmentImport.conditionCheck.abnormal')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('receiveEquipmentImport.conditionCheck.operation')}</Label>
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
                  <SelectItem value="normal">
                    {t('receiveEquipmentImport.conditionCheck.normal')}
                  </SelectItem>
                  <SelectItem value="abnormal">
                    {t('receiveEquipmentImport.conditionCheck.abnormal')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('receiveEquipmentImport.conditionCheck.accessories')}</Label>
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
                  <SelectItem value="complete">
                    {t('receiveEquipmentImport.conditionCheck.complete')}
                  </SelectItem>
                  <SelectItem value="incomplete">
                    {t('receiveEquipmentImport.conditionCheck.incomplete')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">{t('fields.notes')}</Label>
            <Textarea
              id="notes"
              value={condition.notes || ''}
              onChange={(e) => setCondition((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder={t('receiveEquipmentImport.conditionCheck.notesPlaceholder')}
            />
          </div>

          {/* Calibration Information Section */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-medium">{t('form.calibrationInfo')}</h3>

            {/* Calibration Method */}
            <div className="space-y-2">
              <Label htmlFor="calibrationMethod">
                {t('fields.calibrationMethod')} <span className="text-destructive">*</span>
              </Label>
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
                      {t('fields.calibrationCycle')} <span className="text-destructive">*</span>
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
                      {t('fieldLabels.lastCalibrationDate')}{' '}
                      <span className="text-destructive">*</span>
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
                    {t('fieldLabels.calibrationAgency')} <span className="text-destructive">*</span>
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
                    placeholder={t('receiveEquipmentImport.calibrationAgencyPlaceholder')}
                  />
                </div>

                {/* Next Calibration Date (auto-calculated, read-only) */}
                {nextCalibrationDate && (
                  <div className="space-y-2">
                    <Label htmlFor="nextCalibrationDate">
                      {t('receiveEquipmentImport.nextCalibrationLabel')}
                    </Label>
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
            {tCommon('actions.cancel')}
          </Button>
          <Button onClick={() => receiveMutation.mutate()} disabled={receiveMutation.isPending}>
            {receiveMutation.isPending
              ? tCommon('status.processing')
              : t('receiveEquipmentImport.submit')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
