'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { isAfter, differenceInDays } from 'date-fns';
import { useTranslations } from 'next-intl';
import { toDate } from '@/lib/utils/date';
import { useDateFormatter } from '@/hooks/use-date-formatter';

interface CalibrationValidityCheckerProps {
  nextCalibrationDate: string;
  usagePeriodEnd: string;
}

/**
 * 교정 유효성 자동 검증 컴포넌트
 *
 * 임시등록(공용/렌탈 장비) 시 차기교정일이 사용 종료일 이후인지 자동으로 검증합니다.
 *
 * 비즈니스 로직:
 * - 차기교정일 > 사용 종료일: 유효 (녹색 알림)
 * - 차기교정일 ≤ 사용 종료일: 무효 (빨간색 경고)
 *
 * @example
 * <CalibrationValidityChecker
 *   nextCalibrationDate="2026-06-30"
 *   usagePeriodEnd="2026-05-31"
 * />
 */
export function CalibrationValidityChecker({
  nextCalibrationDate,
  usagePeriodEnd,
}: CalibrationValidityCheckerProps) {
  const t = useTranslations('equipment.calibrationValidity');
  const { fmtDate } = useDateFormatter();

  if (!nextCalibrationDate || !usagePeriodEnd) {
    return null;
  }

  const nextCalDate = toDate(nextCalibrationDate);
  const endDate = toDate(usagePeriodEnd);
  if (!nextCalDate || !endDate) return null;

  const isValid = isAfter(nextCalDate, endDate);
  const daysBuffer = differenceInDays(nextCalDate, endDate);

  if (!isValid) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t('insufficient.title')}</AlertTitle>
        <AlertDescription>
          {t('insufficient.description', {
            nextCalDate: fmtDate(nextCalDate),
            endDate: fmtDate(endDate),
          })}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-brand-ok bg-brand-ok/10 text-brand-ok">
      <CheckCircle2 className="h-4 w-4" />
      <AlertTitle>{t('verified.title')}</AlertTitle>
      <AlertDescription>{t('verified.description', { days: daysBuffer })}</AlertDescription>
    </Alert>
  );
}
