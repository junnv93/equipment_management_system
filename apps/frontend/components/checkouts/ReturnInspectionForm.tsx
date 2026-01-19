'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export interface InspectionFormData {
  calibrationChecked: boolean;
  repairChecked: boolean;
  workingStatusChecked: boolean;
  inspectionNotes: string;
}

interface ReturnInspectionFormProps {
  purpose: string; // 반출 목적: calibration, repair, external_rental
  onSubmit: (data: InspectionFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const PURPOSE_LABELS: Record<string, string> = {
  calibration: '교정',
  repair: '수리',
  external_rental: '외부 대여',
};

export default function ReturnInspectionForm({
  purpose,
  onSubmit,
  onCancel,
  isLoading = false,
}: ReturnInspectionFormProps) {
  const [calibrationChecked, setCalibrationChecked] = useState(false);
  const [repairChecked, setRepairChecked] = useState(false);
  const [workingStatusChecked, setWorkingStatusChecked] = useState(false);
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // 필수 검사 항목 결정
  const isCalibrationRequired = purpose === 'calibration';
  const isRepairRequired = purpose === 'repair';

  // 유효성 검증
  const validate = (): boolean => {
    // 모든 유형: workingStatusChecked 필수
    if (!workingStatusChecked) {
      setValidationError('작동 여부 확인은 필수입니다.');
      return false;
    }

    // 교정 목적: calibrationChecked 필수
    if (isCalibrationRequired && !calibrationChecked) {
      setValidationError('교정 목적 반출의 경우 교정 확인은 필수입니다.');
      return false;
    }

    // 수리 목적: repairChecked 필수
    if (isRepairRequired && !repairChecked) {
      setValidationError('수리 목적 반출의 경우 수리 확인은 필수입니다.');
      return false;
    }

    setValidationError(null);
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSubmit({
      calibrationChecked,
      repairChecked,
      workingStatusChecked,
      inspectionNotes,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        반출 목적: <span className="font-medium">{PURPOSE_LABELS[purpose] || purpose}</span>
      </div>

      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {/* 교정 확인 (교정 목적 시 필수) */}
        <div className="flex items-start space-x-3">
          <Checkbox
            id="calibrationChecked"
            checked={calibrationChecked}
            onCheckedChange={(checked) => setCalibrationChecked(checked as boolean)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor="calibrationChecked" className="flex items-center gap-2">
              교정 확인
              {isCalibrationRequired && (
                <span className="text-xs text-red-500 font-medium">* 필수</span>
              )}
            </Label>
            <p className="text-sm text-muted-foreground">
              교정 성적서 확인 및 교정 결과가 적합한지 검토
            </p>
          </div>
        </div>

        {/* 수리 확인 (수리 목적 시 필수) */}
        <div className="flex items-start space-x-3">
          <Checkbox
            id="repairChecked"
            checked={repairChecked}
            onCheckedChange={(checked) => setRepairChecked(checked as boolean)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor="repairChecked" className="flex items-center gap-2">
              수리 확인
              {isRepairRequired && <span className="text-xs text-red-500 font-medium">* 필수</span>}
            </Label>
            <p className="text-sm text-muted-foreground">수리 완료 여부 및 수리 내역 확인</p>
          </div>
        </div>

        {/* 작동 여부 확인 (모든 유형 필수) */}
        <div className="flex items-start space-x-3">
          <Checkbox
            id="workingStatusChecked"
            checked={workingStatusChecked}
            onCheckedChange={(checked) => setWorkingStatusChecked(checked as boolean)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor="workingStatusChecked" className="flex items-center gap-2">
              작동 여부 확인
              <span className="text-xs text-red-500 font-medium">* 필수</span>
            </Label>
            <p className="text-sm text-muted-foreground">장비가 정상적으로 작동하는지 확인</p>
          </div>
        </div>
      </div>

      {/* 검사 비고 */}
      <div className="space-y-2">
        <Label htmlFor="inspectionNotes">검사 비고</Label>
        <Textarea
          id="inspectionNotes"
          placeholder="검사 결과에 대한 특이사항을 입력하세요"
          value={inspectionNotes}
          onChange={(e) => setInspectionNotes(e.target.value)}
          rows={4}
        />
      </div>

      {/* 검사 상태 요약 */}
      <div className="bg-muted p-4 rounded-lg">
        <p className="text-sm font-medium mb-2">검사 상태 요약</p>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2
              className={`h-4 w-4 ${workingStatusChecked ? 'text-green-500' : 'text-gray-300'}`}
            />
            <span>작동 여부: {workingStatusChecked ? '확인 완료' : '미확인'}</span>
          </div>
          {(isCalibrationRequired || calibrationChecked) && (
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={`h-4 w-4 ${calibrationChecked ? 'text-green-500' : 'text-gray-300'}`}
              />
              <span>교정 확인: {calibrationChecked ? '확인 완료' : '미확인'}</span>
            </div>
          )}
          {(isRepairRequired || repairChecked) && (
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={`h-4 w-4 ${repairChecked ? 'text-green-500' : 'text-gray-300'}`}
              />
              <span>수리 확인: {repairChecked ? '확인 완료' : '미확인'}</span>
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
          {isLoading ? '처리 중...' : '반입 처리'}
        </Button>
      </div>
    </div>
  );
}
