'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Eye, XCircle } from 'lucide-react';
import {
  type DisposalRequest,
  DisposalReviewStatusValues as DRSVal,
} from '@equipment-management/schemas';
import { DisposalProgressStepper } from './DisposalProgressStepper';
import { ReviewOpinionCard } from './ReviewOpinionCard';
import { formatDateTime } from '@/lib/utils/date';
import { DISPOSAL_PROGRESS_CARD_TOKENS } from '@/lib/design-tokens';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('disposal');

  const getCurrentStageText = () => {
    if (disposalRequest.reviewStatus === DRSVal.PENDING) {
      return t('progressCard.pendingReview');
    }
    if (disposalRequest.reviewStatus === DRSVal.REVIEWED) {
      return t('progressCard.pendingApproval');
    }
    return t('progressCard.complete');
  };

  return (
    <Alert className={DISPOSAL_PROGRESS_CARD_TOKENS.container}>
      <AlertCircle className="h-5 w-5 text-brand-repair" />
      <AlertTitle className={DISPOSAL_PROGRESS_CARD_TOKENS.title}>
        {t('progressCard.title')}
      </AlertTitle>
      <AlertDescription>
        <div className="mt-4 space-y-4">
          <DisposalProgressStepper currentStep={currentStep} />

          <div className={DISPOSAL_PROGRESS_CARD_TOKENS.text}>
            <p className="font-medium">{getCurrentStageText()}</p>
            <p className={`${DISPOSAL_PROGRESS_CARD_TOKENS.subtext} mt-1`}>
              {t('common.requester')} {disposalRequest.requestedByName} |{' '}
              {formatDateTime(disposalRequest.requestedAt)}
            </p>
          </div>

          {disposalRequest.reviewStatus === DRSVal.REVIEWED &&
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
              className={DISPOSAL_PROGRESS_CARD_TOKENS.viewButton}
            >
              <Eye className="mr-2 h-4 w-4" />
              {t('progressCard.viewDetails')}
            </Button>
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className={DISPOSAL_PROGRESS_CARD_TOKENS.cancelButton}
              >
                <XCircle className="mr-2 h-4 w-4" />
                {t('progressCard.cancelRequest')}
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
