'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Eye, Cog, Package2 } from 'lucide-react';
import {
  ConditionCheckStep,
  ConditionStatus,
  AccessoriesStatus,
  CONDITION_CHECK_STEP_LABELS,
  CONDITION_STATUS_LABELS,
  ACCESSORIES_STATUS_LABELS,
} from '@equipment-management/schemas';
import type { CreateConditionCheckDto } from '@/lib/api/checkout-api';

interface EquipmentConditionFormProps {
  /** 상태 확인 단계 */
  step: ConditionCheckStep;
  /** 제출 콜백 (version 필드 제외) */
  onSubmit: (data: Omit<CreateConditionCheckDto, 'version'>) => void;
  /** 취소 콜백 */
  onCancel: () => void;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 이전 확인 기록 (비교용) */
  previousCheck?: {
    appearanceStatus: ConditionStatus;
    operationStatus: ConditionStatus;
    accessoriesStatus?: AccessoriesStatus;
  };
}

/**
 * 장비 상태 확인 폼
 *
 * 대여 목적 반출 시 양측 4단계 확인을 위한 폼입니다.
 * - ① 반출 전 확인 (빌려주는 측)
 * - ② 인수 시 확인 (빌리는 측)
 * - ③ 반납 전 확인 (빌린 측)
 * - ④ 반입 시 확인 (빌려준 측)
 *
 * 각 단계에서 외관 상태, 작동 상태, 부속품 상태를 기록합니다.
 * 이상이 있는 경우 상세 내용을 기록해야 합니다.
 */
export default function EquipmentConditionForm({
  step,
  onSubmit,
  onCancel,
  isLoading = false,
  previousCheck,
}: EquipmentConditionFormProps) {
  // 폼 상태
  const [appearanceStatus, setAppearanceStatus] = useState<ConditionStatus>('normal');
  const [operationStatus, setOperationStatus] = useState<ConditionStatus>('normal');
  const [accessoriesStatus, setAccessoriesStatus] = useState<AccessoriesStatus | undefined>(
    undefined
  );
  const [abnormalDetails, setAbnormalDetails] = useState('');
  const [comparisonWithPrevious, setComparisonWithPrevious] = useState('');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // 이상 여부 확인
  const hasAbnormal =
    appearanceStatus === 'abnormal' ||
    operationStatus === 'abnormal' ||
    accessoriesStatus === 'incomplete';

  // 반입 확인 단계 (④단계) 여부
  const isReturnStep = step === 'lender_return';

  // 이전 확인과 비교 필요 여부
  const needsComparison = isReturnStep && previousCheck;

  // 유효성 검증
  const validate = (): boolean => {
    // 이상이 있는데 상세 내용이 없는 경우
    if (hasAbnormal && !abnormalDetails.trim()) {
      setValidationError('이상 내용이 있는 경우 상세 내용을 입력해야 합니다.');
      return false;
    }

    // 반입 확인 시 이전과 비교 필요
    if (needsComparison) {
      const hasChange =
        previousCheck!.appearanceStatus !== appearanceStatus ||
        previousCheck!.operationStatus !== operationStatus ||
        (previousCheck!.accessoriesStatus &&
          accessoriesStatus &&
          previousCheck!.accessoriesStatus !== accessoriesStatus);

      if (hasChange && !comparisonWithPrevious.trim()) {
        setValidationError('이전 확인과 다른 점이 있는 경우 비교 내용을 입력해야 합니다.');
        return false;
      }
    }

    setValidationError(null);
    return true;
  };

  // 제출 핸들러
  const handleSubmit = () => {
    if (!validate()) return;

    const data: Omit<CreateConditionCheckDto, 'version'> = {
      step,
      appearanceStatus,
      operationStatus,
      ...(accessoriesStatus && { accessoriesStatus }),
      ...(abnormalDetails.trim() && { abnormalDetails: abnormalDetails.trim() }),
      ...(comparisonWithPrevious.trim() && {
        comparisonWithPrevious: comparisonWithPrevious.trim(),
      }),
      ...(notes.trim() && { notes: notes.trim() }),
    };

    onSubmit(data);
  };

  return (
    <div className="space-y-6">
      {/* 단계 안내 */}
      <div className="p-4 bg-muted rounded-lg">
        <p className="font-medium">{CONDITION_CHECK_STEP_LABELS[step]}</p>
        <p className="text-sm text-muted-foreground mt-1">
          장비의 현재 상태를 확인하고 기록해주세요.
        </p>
      </div>

      {/* 유효성 검증 에러 */}
      {validationError && (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {/* 외관 상태 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4" />
            외관 상태
          </CardTitle>
          <CardDescription>장비의 외관 상태를 확인해주세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={appearanceStatus}
            onValueChange={(value) => setAppearanceStatus(value as ConditionStatus)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="normal" id="appearance-normal" />
              <Label htmlFor="appearance-normal" className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {CONDITION_STATUS_LABELS.normal}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="abnormal" id="appearance-abnormal" />
              <Label htmlFor="appearance-abnormal" className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-red-600" />
                {CONDITION_STATUS_LABELS.abnormal}
              </Label>
            </div>
          </RadioGroup>
          {previousCheck && (
            <p className="text-sm text-muted-foreground mt-2">
              이전 확인: {CONDITION_STATUS_LABELS[previousCheck.appearanceStatus]}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 작동 상태 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Cog className="h-4 w-4" />
            작동 상태
          </CardTitle>
          <CardDescription>장비가 정상적으로 작동하는지 확인해주세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={operationStatus}
            onValueChange={(value) => setOperationStatus(value as ConditionStatus)}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="normal" id="operation-normal" />
              <Label htmlFor="operation-normal" className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {CONDITION_STATUS_LABELS.normal}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="abnormal" id="operation-abnormal" />
              <Label htmlFor="operation-abnormal" className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-red-600" />
                {CONDITION_STATUS_LABELS.abnormal}
              </Label>
            </div>
          </RadioGroup>
          {previousCheck && (
            <p className="text-sm text-muted-foreground mt-2">
              이전 확인: {CONDITION_STATUS_LABELS[previousCheck.operationStatus]}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 부속품 상태 (선택) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package2 className="h-4 w-4" />
            부속품 상태 <span className="text-sm font-normal text-muted-foreground">(선택)</span>
          </CardTitle>
          <CardDescription>부속품이 모두 있는지 확인해주세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={accessoriesStatus || ''}
            onValueChange={(value) =>
              setAccessoriesStatus(value ? (value as AccessoriesStatus) : undefined)
            }
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="complete" id="accessories-complete" />
              <Label htmlFor="accessories-complete" className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {ACCESSORIES_STATUS_LABELS.complete}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="incomplete" id="accessories-incomplete" />
              <Label htmlFor="accessories-incomplete" className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                {ACCESSORIES_STATUS_LABELS.incomplete}
              </Label>
            </div>
          </RadioGroup>
          {previousCheck?.accessoriesStatus && (
            <p className="text-sm text-muted-foreground mt-2">
              이전 확인: {ACCESSORIES_STATUS_LABELS[previousCheck.accessoriesStatus]}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 이상 내용 상세 */}
      {hasAbnormal && (
        <div className="space-y-2">
          <Label htmlFor="abnormalDetails">
            이상 내용 상세 <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="abnormalDetails"
            placeholder="이상 내용을 상세히 기록해주세요"
            value={abnormalDetails}
            onChange={(e) => setAbnormalDetails(e.target.value)}
            rows={3}
            className="border-red-200 focus:border-red-400"
          />
        </div>
      )}

      {/* 이전 확인과 비교 (④단계) */}
      {needsComparison && (
        <div className="space-y-2">
          <Label htmlFor="comparisonWithPrevious">이전 확인과 비교</Label>
          <Textarea
            id="comparisonWithPrevious"
            placeholder="반출 전 상태와 비교하여 변경된 점이 있다면 기록해주세요"
            value={comparisonWithPrevious}
            onChange={(e) => setComparisonWithPrevious(e.target.value)}
            rows={3}
          />
          <p className="text-sm text-muted-foreground">
            상태가 변경된 경우 필수로 입력해야 합니다.
          </p>
        </div>
      )}

      {/* 추가 메모 */}
      <div className="space-y-2">
        <Label htmlFor="notes">추가 메모</Label>
        <Textarea
          id="notes"
          placeholder="추가로 기록할 내용이 있으면 입력해주세요"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>

      {/* 상태 요약 */}
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm font-medium mb-2">확인 상태 요약</p>
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2">
            {appearanceStatus === 'normal' ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span>외관 상태: {CONDITION_STATUS_LABELS[appearanceStatus]}</span>
          </div>
          <div className="flex items-center gap-2">
            {operationStatus === 'normal' ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span>작동 상태: {CONDITION_STATUS_LABELS[operationStatus]}</span>
          </div>
          {accessoriesStatus && (
            <div className="flex items-center gap-2">
              {accessoriesStatus === 'complete' ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-orange-600" />
              )}
              <span>부속품 상태: {ACCESSORIES_STATUS_LABELS[accessoriesStatus]}</span>
            </div>
          )}
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          취소
        </Button>
        <Button type="button" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? '처리 중...' : '확인 완료'}
        </Button>
      </div>
    </div>
  );
}
