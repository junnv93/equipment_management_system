/**
 * DashboardCardErrorBoundary — 대시보드 카드 단위 에러 격리 (명세서 §A.17.2).
 *
 * 한 카드의 렌더 실패가 다른 카드를 무너뜨리지 않도록 격리.
 * fallback: 카드 컨테이너 + EmptyState(error) + "다시 시도" CTA.
 *
 * 사용 예:
 *   <DashboardCardErrorBoundary cardName="CheckoutCard">
 *     <CheckoutCard ... />
 *   </DashboardCardErrorBoundary>
 */

'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { EmptyState } from '@/components/dashboard/atoms/EmptyState';

interface DashboardCardErrorBoundaryProps {
  /** 디버깅/식별용 카드 이름 (Sentry/콘솔 로깅 + aria-label 보조). */
  cardName: string;
  children: React.ReactNode;
}

export function DashboardCardErrorBoundary({
  cardName,
  children,
}: DashboardCardErrorBoundaryProps) {
  const t = useTranslations('dashboard.cardError');

  return (
    <ErrorBoundary
      onError={(err) => {
        // 콘솔 로그 + (있다면) Sentry/외부 logger에 전달.
        if (typeof window !== 'undefined') {
          console.error(`[dashboard.${cardName}] render error`, err);
        }
      }}
      fallback={(_error, reset) => (
        <Card className="p-4 flex flex-col h-full" aria-label={cardName}>
          <EmptyState
            variant="error"
            title={t('title')}
            description={t('description')}
            cta={{ label: t('retry'), onClick: reset }}
            className="my-auto"
          />
        </Card>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
