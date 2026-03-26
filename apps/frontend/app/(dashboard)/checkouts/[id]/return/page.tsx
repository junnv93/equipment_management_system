import { Suspense, cache } from 'react';
import { notFound } from 'next/navigation';
import ReturnCheckoutClient from './ReturnCheckoutClient';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getCheckoutServer, getConditionChecksServer } from '@/lib/api/checkout-api-server';
import {
  CheckoutStatusValues as CSVal,
  CheckoutPurposeValues as CPVal,
  type CheckoutPurpose,
} from '@equipment-management/schemas';
import { getTranslations } from 'next-intl/server';
import { getPageContainerClasses } from '@/lib/design-tokens';

/**
 * React.cache()로 같은 render pass에서 중복 호출 방지
 */
const getCheckoutCached = cache(async (id: string) => {
  return getCheckoutServer(id);
});

const getConditionChecksCached = cache(async (id: string) => {
  try {
    return await getConditionChecksServer(id);
  } catch {
    return [];
  }
});

// Next.js 16 PageProps 타입 정의
type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * 반입 허용 상태 확인
 */
function canReturn(status: string, purpose: string): boolean {
  // 교정/수리: checked_out 또는 overdue 상태에서 반입 가능
  if (purpose === CPVal.CALIBRATION || purpose === CPVal.REPAIR) {
    return status === CSVal.CHECKED_OUT || status === CSVal.OVERDUE;
  }

  // 대여: lender_received 또는 overdue 상태에서 반입 가능 (4단계 확인 완료 후)
  if (purpose === CPVal.RENTAL) {
    return status === CSVal.LENDER_RECEIVED || status === CSVal.OVERDUE;
  }

  return false;
}

/**
 * 반입 처리 페이지 - PPR Non-Blocking
 *
 * 비즈니스 로직 (UL-QP-18):
 * - 교정/수리: 반출 중 상태에서 직접 반입 처리
 * - 대여: 양측 4단계 확인 완료 후 반입 처리
 * - 반입 시 검사 항목 확인 (교정확인, 수리확인, 작동여부)
 *
 * PPR 패턴:
 * - Page 함수 동기 → 즉시 static shell 전송
 * - Suspense 자식에서 params await + 데이터 fetching
 * - ReturnSkeleton 즉시 표시 → 데이터 로드 후 콘텐츠 스트리밍
 */
export default function ReturnCheckoutPage(props: PageProps) {
  return (
    <Suspense fallback={<ReturnSkeleton />}>
      <ReturnCheckoutAsync paramsPromise={props.params} />
    </Suspense>
  );
}

async function ReturnCheckoutAsync({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;

  let checkout;
  let conditionChecks;

  try {
    checkout = await getCheckoutCached(id);

    // 대여 목적인 경우 상태 확인 기록도 조회
    if (checkout.purpose === CPVal.RENTAL) {
      conditionChecks = await getConditionChecksCached(id);
    }
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.message.includes('404') || error.message.includes('찾을 수 없'))
    ) {
      notFound();
    }
    throw error;
  }

  // 반입 가능 상태가 아닌 경우
  if (!canReturn(checkout.status, checkout.purpose)) {
    notFound();
  }

  return <ReturnCheckoutClient checkout={checkout} conditionChecks={conditionChecks || []} />;
}

/**
 * 메타데이터 생성
 */
export async function generateMetadata(props: PageProps) {
  const { id } = await props.params;

  try {
    const [checkout, t] = await Promise.all([getCheckoutCached(id), getTranslations('checkouts')]);
    const purposeLabel = t(`purpose.${checkout.purpose}` as Parameters<typeof t>[0]);

    return {
      title: t('metadata.returnTitle', { purpose: purposeLabel }),
      description: t('metadata.returnDescription', {
        purpose: purposeLabel,
        destination: checkout.destination,
      }),
    };
  } catch {
    const t = await getTranslations('checkouts');
    return {
      title: t('metadata.returnFallbackTitle'),
      description: t('metadata.returnFallbackDescription'),
    };
  }
}

/**
 * 로딩 스켈레톤
 */
function ReturnSkeleton() {
  return (
    <div className={getPageContainerClasses('form')}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-5 w-5" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
          <Skeleton className="h-24 w-full" />
          <div className="flex justify-end gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
