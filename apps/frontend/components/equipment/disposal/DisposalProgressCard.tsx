'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Eye, XCircle } from 'lucide-react';
import type { DisposalRequest } from '@equipment-management/schemas';
import { DisposalProgressStepper } from './DisposalProgressStepper';
import { ReviewOpinionCard } from './ReviewOpinionCard';
import { formatDateTime } from '@/lib/utils/date';

interface DisposalProgressCardProps {
  disposalRequest: DisposalRequest;
  currentStep: number;
  onViewDetails: () => void;
  onCancel: () => void;
  canCancel: boolean;
}

export function DisposalProgressCard({
  disposalRequest,
  currentStep,
  onViewDetails,
  onCancel,
  canCancel,
}: DisposalProgressCardProps) {
  const getCurrentStageText = () => {
    if (disposalRequest.reviewStatus === 'pending') {
      return '기술책임자 검토 대기 중';
    }
    if (disposalRequest.reviewStatus === 'reviewed') {
      return '시험소장 승인 대기 중';
    }
    return '처리 완료';
  };

  return (
    <Alert className="border-l-4 border-l-orange-500 bg-orange-50 border-orange-200">
      <AlertCircle className="h-5 w-5 text-orange-600" />
      <AlertTitle className="text-orange-900 font-semibold">장비 폐기 진행 중</AlertTitle>
      <AlertDescription>
        <div className="mt-4 space-y-4">
          <DisposalProgressStepper currentStep={currentStep} />

          <div className="text-sm text-orange-800">
            <p className="font-medium">{getCurrentStageText()}</p>
            <p className="text-xs text-orange-600 mt-1">
              요청자: {disposalRequest.requestedByName} |{' '}
              {formatDateTime(disposalRequest.requestedAt)}
            </p>
          </div>

          {disposalRequest.reviewStatus === 'reviewed' &&
            disposalRequest.reviewOpinion &&
            disposalRequest.reviewedByName &&
            disposalRequest.reviewedAt && (
              <ReviewOpinionCard
                reviewerName={disposalRequest.reviewedByName}
                reviewedAt={disposalRequest.reviewedAt}
                opinion={disposalRequest.reviewOpinion}
              />
            )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewDetails}
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <Eye className="mr-2 h-4 w-4" />
              상세 보기
            </Button>
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <XCircle className="mr-2 h-4 w-4" />
                요청 취소
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
