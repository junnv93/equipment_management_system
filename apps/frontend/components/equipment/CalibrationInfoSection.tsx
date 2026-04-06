'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Control, useWatch, useFormContext } from 'react-hook-form';
import { CalibrationRequiredValues, ManagementMethodValues } from '@equipment-management/schemas';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { addMonths } from 'date-fns';
import { toDate, formatDate } from '@/lib/utils/date';
import { FormValues } from './BasicInfoSection';
import { FORM_SECTION_TOKENS } from '@/lib/design-tokens';

interface CalibrationInfoSectionProps {
  control: Control<FormValues>;
}

/** calibrationRequired='not_required' 시 선택 가능한 관리 방법 */
const NOT_REQUIRED_METHODS = [
  ManagementMethodValues.SELF_INSPECTION,
  ManagementMethodValues.NOT_APPLICABLE,
] as const;

export function CalibrationInfoSection({ control }: CalibrationInfoSectionProps) {
  const t = useTranslations('equipment');
  const { setValue } = useFormContext<FormValues>();

  // 교정필요여부 감시
  const calibrationRequired = useWatch({ control, name: 'calibrationRequired' });

  // 교정 주기와 최종 교정일 감시
  const calibrationCycle = useWatch({ control, name: 'calibrationCycle' });
  const lastCalibrationDate = useWatch({ control, name: 'lastCalibrationDate' });
  const managementMethod = useWatch({ control, name: 'managementMethod' });

  // 중간점검 관련 필드 감시
  const lastIntermediateCheckDate = useWatch({ control, name: 'lastIntermediateCheckDate' });
  const intermediateCheckCycle = useWatch({ control, name: 'intermediateCheckCycle' });

  const isRequired = calibrationRequired === CalibrationRequiredValues.REQUIRED;
  const isNotRequired = calibrationRequired === CalibrationRequiredValues.NOT_REQUIRED;
  const isNotSelected = !calibrationRequired;

  // 교정필요여부 변경 시 연동 필드 자동 설정
  useEffect(() => {
    if (isRequired) {
      setValue('managementMethod', ManagementMethodValues.EXTERNAL_CALIBRATION);
      setValue('needsIntermediateCheck', true);
    } else if (isNotRequired) {
      // 외부교정 관련 필드 초기화
      setValue('calibrationCycle', undefined);
      setValue('lastCalibrationDate', undefined);
      setValue('nextCalibrationDate', undefined);
      setValue('calibrationAgency', undefined);
      setValue('needsIntermediateCheck', false);
      setValue('lastIntermediateCheckDate', undefined);
      setValue('intermediateCheckCycle', undefined);
      setValue('nextIntermediateCheckDate', undefined);
      // managementMethod가 external_calibration이면 리셋
      if (managementMethod === ManagementMethodValues.EXTERNAL_CALIBRATION) {
        setValue('managementMethod', undefined);
      }
    }
    // managementMethod는 의도적으로 deps에서 제외 (무한 루프 방지)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calibrationRequired, setValue]);

  // 자체점검 선택 시 점검 주기 필드 활성화
  const isSelfInspection = managementMethod === ManagementMethodValues.SELF_INSPECTION;

  // 자체점검 선택/해제 시 점검 필드 초기화
  useEffect(() => {
    if (isNotRequired && !isSelfInspection) {
      setValue('lastIntermediateCheckDate', undefined);
      setValue('intermediateCheckCycle', undefined);
      setValue('nextIntermediateCheckDate', undefined);
    }
  }, [isNotRequired, isSelfInspection, setValue]);

  // 교정 주기 변경 시 다음 교정일 자동 계산
  useEffect(() => {
    if (calibrationCycle && lastCalibrationDate && typeof lastCalibrationDate === 'string') {
      const parsed = toDate(lastCalibrationDate);
      if (parsed) {
        const nextDate = formatDate(addMonths(parsed, calibrationCycle), 'yyyy-MM-dd');
        setValue('nextCalibrationDate', nextDate);
      }
    }
  }, [calibrationCycle, lastCalibrationDate, setValue]);

  // 중간점검/자체점검 주기 변경 시 차기 점검일 자동 계산
  useEffect(() => {
    if (
      intermediateCheckCycle &&
      lastIntermediateCheckDate &&
      typeof lastIntermediateCheckDate === 'string'
    ) {
      const parsed = toDate(lastIntermediateCheckDate);
      if (parsed) {
        const nextDate = formatDate(addMonths(parsed, intermediateCheckCycle), 'yyyy-MM-dd');
        setValue('nextIntermediateCheckDate', nextDate);
      }
    }
  }, [intermediateCheckCycle, lastIntermediateCheckDate, setValue]);

  // 점검 필드 표시 조건: 교정 필요(중간점검) 또는 자체점검 선택
  const showInspectionFields = isRequired || (isNotRequired && isSelfInspection);

  // 점검 필드 라벨: 교정 필요 시 "중간점검", 자체점검 시 "자체점검"
  const inspectionLabel = isRequired
    ? t('form.calibrationInfo.intermediateCheckCycle')
    : t('form.calibrationInfo.selfInspectionCycle');
  const inspectionLastDateLabel = isRequired
    ? t('form.calibrationInfo.lastIntermediateCheckDate')
    : t('form.calibrationInfo.lastSelfInspectionDate');
  const inspectionNextDateLabel = isRequired
    ? t('form.calibrationInfo.nextIntermediateCheckDate')
    : t('form.calibrationInfo.nextSelfInspectionDate');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className={FORM_SECTION_TOKENS.badge}>2</span>
          {t('form.calibrationInfo.title')}
        </CardTitle>
        <CardDescription>{t('form.calibrationInfo.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 미선택 안내 */}
        {isNotSelected && (
          <div className="flex items-center gap-2 p-4 rounded-md border border-dashed text-muted-foreground">
            <Info className="h-4 w-4 shrink-0" />
            <p className="text-sm">{t('form.calibrationInfo.selectCalibrationRequired')}</p>
          </div>
        )}

        {/* 관리 방법 */}
        {!isNotSelected && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={control}
              name="managementMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('fields.managementMethod')} <span className="text-destructive">*</span>
                  </FormLabel>
                  {isRequired ? (
                    // 교정 필요: 외부 교정 고정 (읽기 전용)
                    <div className="flex h-10 w-full items-center rounded-md border bg-muted/50 px-3 text-sm">
                      {t(
                        `filters.managementMethodLabel.${ManagementMethodValues.EXTERNAL_CALIBRATION}` as Parameters<
                          typeof t
                        >[0]
                      )}
                    </div>
                  ) : (
                    // 교정 불필요: 자체점검 / 비대상 선택
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('form.calibrationInfo.methodPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NOT_REQUIRED_METHODS.map((value) => (
                          <SelectItem key={value} value={value}>
                            {t(`filters.managementMethodLabel.${value}` as Parameters<typeof t>[0])}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* 교정 필요 시: 외부 교정 필드 */}
        {isRequired && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 교정 주기 */}
            <FormField
              control={control}
              name="calibrationCycle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('fields.calibrationCycle')} <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={t('form.calibrationInfo.cyclePlaceholder')}
                      min={1}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                      }
                    />
                  </FormControl>
                  <FormDescription>{t('form.calibrationInfo.cycleDescription')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 최종 교정일 */}
            <FormField
              control={control}
              name="lastCalibrationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('fields.lastCalibrationDate')} <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormDescription>{t('form.calibrationInfo.lastDateDescription')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 차기 교정일 */}
            <FormField
              control={control}
              name="nextCalibrationDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.calibrationInfo.nextDateLabel')}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormDescription>{t('form.calibrationInfo.nextDateDescription')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 교정 기관 */}
            <FormField
              control={control}
              name="calibrationAgency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('fields.calibrationAgency')} <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="HCT" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* 점검 필드: 교정 필요(중간점검) 또는 자체점검 */}
        {showInspectionFields && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md bg-muted/30">
            {/* 최종 점검일 */}
            <FormField
              control={control}
              name="lastIntermediateCheckDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {inspectionLastDateLabel} <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 점검 주기 */}
            <FormField
              control={control}
              name="intermediateCheckCycle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {inspectionLabel} <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={t('form.calibrationInfo.intermediateCheckCyclePlaceholder')}
                      min={1}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 차기 점검일 */}
            <FormField
              control={control}
              name="nextIntermediateCheckDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{inspectionNextDateLabel}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormDescription>{t('form.calibrationInfo.autoCalculated')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* 교정 불필요 + 비대상: 안내 메시지 */}
        {isNotRequired && managementMethod === ManagementMethodValues.NOT_APPLICABLE && (
          <div className="flex items-center gap-2 p-4 rounded-md border border-dashed text-muted-foreground">
            <Info className="h-4 w-4 shrink-0" />
            <p className="text-sm">{t('form.calibrationInfo.notApplicableDescription')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
