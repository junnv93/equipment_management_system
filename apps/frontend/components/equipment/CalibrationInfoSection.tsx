'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Control, useWatch, useFormContext } from 'react-hook-form';
import { ManagementMethodEnum } from '@equipment-management/schemas';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { addMonths } from 'date-fns';
import { toDate, formatDate } from '@/lib/utils/date';
import { FormValues } from './BasicInfoSection';
import { FORM_SECTION_TOKENS } from '@/lib/design-tokens';

interface CalibrationInfoSectionProps {
  control: Control<FormValues>;
}

export function CalibrationInfoSection({ control }: CalibrationInfoSectionProps) {
  const t = useTranslations('equipment');
  const { setValue } = useFormContext<FormValues>();

  // 교정 주기와 최종 교정일 감시
  const calibrationCycle = useWatch({ control, name: 'calibrationCycle' });
  const lastCalibrationDate = useWatch({ control, name: 'lastCalibrationDate' });
  const managementMethod = useWatch({ control, name: 'managementMethod' });

  // 중간점검 관련 필드 감시
  const needsIntermediateCheck = useWatch({ control, name: 'needsIntermediateCheck' });
  const lastIntermediateCheckDate = useWatch({ control, name: 'lastIntermediateCheckDate' });
  const intermediateCheckCycle = useWatch({ control, name: 'intermediateCheckCycle' });

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

  // 중간점검 주기 변경 시 차기 중간점검일 자동 계산
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

  // 외부 교정인지 확인
  const isExternalCalibration = managementMethod === 'external_calibration';

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 관리 방법 (라벨 변경: 교정 방법 → 관리 방법) */}
          <FormField
            control={control}
            name="managementMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('fields.managementMethod')} <span className="text-destructive">*</span>
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('form.calibrationInfo.methodPlaceholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ManagementMethodEnum.options.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(`filters.managementMethodLabel.${value}` as Parameters<typeof t>[0])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 교정 주기 - 외부 교정일 때만 필수 */}
          <FormField
            control={control}
            name="calibrationCycle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('fields.calibrationCycle')}
                  {isExternalCalibration && <span className="text-destructive"> *</span>}
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

          {/* 최종 교정일 - 외부 교정일 때만 필수 */}
          <FormField
            control={control}
            name="lastCalibrationDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('fields.lastCalibrationDate')}
                  {isExternalCalibration && <span className="text-destructive"> *</span>}
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

          {/* 교정 기관 - 외부 교정일 때만 필수 */}
          <FormField
            control={control}
            name="calibrationAgency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('fields.calibrationAgency')}
                  {isExternalCalibration && <span className="text-destructive"> *</span>}
                </FormLabel>
                <FormControl>
                  <Input placeholder="HCT" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 중간점검 대상 여부 */}
        <FormField
          control={control}
          name="needsIntermediateCheck"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>{t('form.calibrationInfo.intermediateCheck')}</FormLabel>
                <FormDescription>
                  {t('form.calibrationInfo.intermediateCheckDescription')}
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* 중간점검 관련 필드 - 중간점검 대상일 때만 표시 */}
        {needsIntermediateCheck && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-md bg-muted/30">
            {/* 최종 중간 점검일 */}
            <FormField
              control={control}
              name="lastIntermediateCheckDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('form.calibrationInfo.lastIntermediateCheckDate')}{' '}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 중간점검 주기 */}
            <FormField
              control={control}
              name="intermediateCheckCycle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('form.calibrationInfo.intermediateCheckCycle')}{' '}
                    <span className="text-destructive">*</span>
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

            {/* 차기 중간 점검일 */}
            <FormField
              control={control}
              name="nextIntermediateCheckDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.calibrationInfo.nextIntermediateCheckDate')}</FormLabel>
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
      </CardContent>
    </Card>
  );
}
