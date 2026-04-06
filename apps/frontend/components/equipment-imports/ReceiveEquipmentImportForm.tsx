'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-config';
import { useToast } from '@/components/ui/use-toast';
import { getErrorMessage } from '@/lib/api/error';
import { isConflictError, ERROR_MESSAGES, EquipmentErrorCode } from '@/lib/errors/equipment-errors';
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
import { FRONTEND_ROUTES, DOCUMENT_FILE_RULES } from '@equipment-management/shared-constants';
import {
  MANAGEMENT_METHOD_VALUES,
  EquipmentImportSourceValues as EISrcVal,
  type ManagementMethod,
} from '@equipment-management/schemas';
import { addMonths, format as formatDate } from 'date-fns';
import { Upload, X, FileText } from 'lucide-react';
import { validateFile } from '@/lib/utils/file-validation';
import { TRANSITION_PRESETS } from '@/lib/design-tokens';

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
  const tCalibration = useTranslations('calibration');
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

  const [files, setFiles] = useState<File[]>([]);

  const [calibrationInfo, setCalibrationInfo] = useState<{
    managementMethod: ManagementMethod;
    calibrationCycle?: number;
    lastCalibrationDate?: string;
    calibrationAgency?: string;
  }>({
    managementMethod: 'not_applicable',
  });

  // Auto-calculate next calibration date
  const [nextCalibrationDate, setNextCalibrationDate] = useState<string>('');

  useEffect(() => {
    if (
      calibrationInfo.managementMethod === 'external_calibration' &&
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
    calibrationInfo.managementMethod,
  ]);

  const { data: equipmentImport, isLoading } = useQuery({
    queryKey: queryKeys.equipmentImports.detail(id),
    queryFn: () => equipmentImportApi.getOne(id),
  });

  const receiveMutation = useMutation({
    mutationFn: async () => {
      // fresh fetch로 최신 version 획득 — 캐시 stale 버전 사용 시 409 VERSION_CONFLICT 발생 가능
      const fresh = await equipmentImportApi.getOne(id);
      const payload: ReceiveEquipmentImportDto = {
        version: fresh.version,
        receivingCondition: {
          ...condition,
          notes: condition.notes || undefined,
        },
      };

      // Add calibration info for external calibration
      if (calibrationInfo.managementMethod === 'external_calibration') {
        payload.calibrationInfo = {
          managementMethod: calibrationInfo.managementMethod,
          calibrationCycle: calibrationInfo.calibrationCycle,
          lastCalibrationDate: calibrationInfo.lastCalibrationDate,
          calibrationAgency: calibrationInfo.calibrationAgency,
        };
      } else if (calibrationInfo.managementMethod !== 'not_applicable') {
        payload.calibrationInfo = {
          managementMethod: calibrationInfo.managementMethod,
        };
      }

      return equipmentImportApi.receive(id, payload, files.length > 0 ? files : undefined);
    },
    onSuccess: async () => {
      await EquipmentImportCacheInvalidation.invalidateAfterReceive(queryClient, id);
      toast({
        title: t('receiveEquipmentImport.toasts.success'),
        description: t('receiveEquipmentImport.toasts.successDesc'),
      });
      router.push(FRONTEND_ROUTES.EQUIPMENT_IMPORTS.DETAIL(id));
    },
    onError: (error) => {
      if (isConflictError(error)) {
        queryClient.invalidateQueries({ queryKey: queryKeys.equipmentImports.detail(id) });
        const conflictInfo = ERROR_MESSAGES[EquipmentErrorCode.VERSION_CONFLICT];
        toast({
          title: conflictInfo.title,
          description: conflictInfo.message,
          variant: 'destructive',
        });
        return;
      }
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

  const sourceLabel = t(`importSource.${equipmentImport.sourceType}`);
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
              <Label htmlFor="managementMethod">
                {t('fields.managementMethod')} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={calibrationInfo.managementMethod}
                onValueChange={(value) =>
                  setCalibrationInfo({
                    ...calibrationInfo,
                    managementMethod: value as ManagementMethod,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MANAGEMENT_METHOD_VALUES.map((method) => (
                    <SelectItem key={method} value={method}>
                      {tCalibration(`method.${method}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Additional fields for external calibration */}
            {calibrationInfo.managementMethod === 'external_calibration' && (
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

          {/* Calibration Certificate Upload */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-medium">
              {t('receiveEquipmentImport.calibrationCertificate.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('receiveEquipmentImport.calibrationCertificate.description')}
            </p>

            <div className="space-y-3">
              <Label
                htmlFor="calibrationFiles"
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-muted-foreground ${TRANSITION_PRESETS.fastBgColor} hover:border-primary hover:text-primary`}
              >
                <Upload className="h-5 w-5" />
                <span>{t('receiveEquipmentImport.calibrationCertificate.upload')}</span>
                <input
                  id="calibrationFiles"
                  type="file"
                  multiple
                  accept={DOCUMENT_FILE_RULES.calibration_certificate.accept}
                  className="hidden"
                  onChange={(e) => {
                    const selected = Array.from(e.target.files || []);
                    const valid = selected.filter((file) => {
                      const error = validateFile(file, {
                        accept: DOCUMENT_FILE_RULES.calibration_certificate.accept,
                      });
                      if (error) {
                        toast({
                          title:
                            error.type === 'size'
                              ? t('form.temporary.fileSizeError')
                              : t('form.temporary.fileTypeError'),
                          description: error.fileName,
                          variant: 'destructive',
                        });
                        return false;
                      }
                      return true;
                    });
                    if (valid.length > 0) {
                      setFiles((prev) => [...prev, ...valid]);
                    }
                    e.target.value = '';
                  }}
                />
              </Label>

              {files.length > 0 && (
                <ul className="space-y-2">
                  {files.map((file, idx) => (
                    <li
                      key={`${file.name}-${idx}`}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate max-w-[200px]">{file.name}</span>
                        <span className="text-muted-foreground">
                          ({(file.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
