import { Card, CardContent } from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils/date';

interface ReviewOpinionCardProps {
  reviewerName: string;
  reviewedAt: string;
  opinion: string;
}

export function ReviewOpinionCard({ reviewerName, reviewedAt, opinion }: ReviewOpinionCardProps) {
  return (
    <Card className="border-l-4 border-l-blue-500 bg-blue-50">
      <CardContent className="pt-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-sm font-semibold text-blue-900">{reviewerName}</span>
          <span className="text-xs text-blue-600">{formatDateTime(reviewedAt)}</span>
        </div>
        <blockquote className="border-l-2 border-blue-300 pl-3 text-sm text-gray-700 italic">
          {opinion}
        </blockquote>
      </CardContent>
    </Card>
  );
}
