import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2 } from 'lucide-react';
import type { DisposalRequest } from '@equipment-management/schemas';
import { DISPOSAL_REASON_LABELS } from '@equipment-management/schemas';
import { formatDateTime } from '@/lib/utils/date';

interface DisposedBannerProps {
  disposalRequest: DisposalRequest;
}

export function DisposedBanner({ disposalRequest }: DisposedBannerProps) {
  return (
    <Alert className="border-l-4 border-l-gray-500 bg-gray-100 border-gray-300" role="status">
      <CheckCircle2 className="h-5 w-5 text-gray-600" />
      <AlertTitle className="text-gray-900 font-semibold">장비 폐기 완료</AlertTitle>
      <AlertDescription className="text-sm text-gray-700">
        <div className="mt-2 space-y-1">
          <p>
            <span className="font-medium">폐기 사유:</span>{' '}
            {DISPOSAL_REASON_LABELS[disposalRequest.reason]}
          </p>
          {disposalRequest.approvedByName && disposalRequest.approvedAt && (
            <p>
              <span className="font-medium">승인자:</span> {disposalRequest.approvedByName} |{' '}
              {formatDateTime(disposalRequest.approvedAt)}
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
