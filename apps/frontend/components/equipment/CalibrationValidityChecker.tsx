'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { isAfter, differenceInDays } from 'date-fns';
import { toDate, formatDate } from '@/lib/utils/date';

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
  // 빈 값 체크
  if (!nextCalibrationDate || !usagePeriodEnd) {
    return null;
  }

  // 차기교정일이 사용 종료일 이후인지 자동 검증
  const nextCalDate = toDate(nextCalibrationDate);
  const endDate = toDate(usagePeriodEnd);
  if (!nextCalDate || !endDate) return null;

  const isValid = isAfter(nextCalDate, endDate);
  const daysBuffer = differenceInDays(nextCalDate, endDate);

  if (!isValid) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>교정 유효기간 부족</AlertTitle>
        <AlertDescription>
          차기교정일({formatDate(nextCalDate, 'yyyy-MM-dd')})이 사용 종료일(
          {formatDate(endDate, 'yyyy-MM-dd')}) 이후여야 합니다. 교정성적서를 확인하거나 사용 기간을
          조정해주세요.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-brand-ok bg-brand-ok/10 text-brand-ok">
      <CheckCircle2 className="h-4 w-4" />
      <AlertTitle>교정 유효기간 확인됨</AlertTitle>
      <AlertDescription>
        차기교정일까지 {daysBuffer}일 여유가 있습니다. 사용 기간 동안 교정이 유효합니다.
      </AlertDescription>
    </Alert>
  );
}
