import { Card, CardContent } from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils/date';
import { REVIEW_OPINION_CARD_TOKENS } from '@/lib/design-tokens';

interface ReviewOpinionCardProps {
  reviewerName: string;
  reviewedAt: string;
  opinion: string;
}

export function ReviewOpinionCard({ reviewerName, reviewedAt, opinion }: ReviewOpinionCardProps) {
  return (
    <Card className={REVIEW_OPINION_CARD_TOKENS.container}>
      <CardContent className="pt-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className={REVIEW_OPINION_CARD_TOKENS.reviewerName}>{reviewerName}</span>
          <span className={REVIEW_OPINION_CARD_TOKENS.timestamp}>{formatDateTime(reviewedAt)}</span>
        </div>
        <blockquote className={REVIEW_OPINION_CARD_TOKENS.blockquote}>{opinion}</blockquote>
      </CardContent>
    </Card>
  );
}
