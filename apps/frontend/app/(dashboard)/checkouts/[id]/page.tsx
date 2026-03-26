import { Suspense, cache } from 'react';
import { notFound } from 'next/navigation';
import CheckoutDetailClient from './CheckoutDetailClient';
import { RouteLoading } from '@/components/layout/RouteLoading';
import { getCheckoutServer, getConditionChecksServer } from '@/lib/api/checkout-api-server';
import {
  type CheckoutPurpose,
  CheckoutPurposeValues as CPVal,
} from '@equipment-management/schemas';
import { getTranslations } from 'next-intl/server';

/**
 * React.cache()로 같은 render pass에서 중복 호출 방지
 *
 * generateMetadata()와 Page()에서 각각 호출해도 한 번만 fetch됩니다.
 */
const getCheckoutCached = cache(async (id: string) => {
  return getCheckoutServer(id);
});

// Next.js 16 PageProps 타입 정의
type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * 반출 상세 페이지 - PPR Non-Blocking
 *
 * 비즈니스 로직 (UL-QP-18):
 * - 반출 상세 정보 표시 (장비, 목적, 반출지, 상태 등)
 * - 반출 유형별 상태 진행 표시 (교정/수리: 5단계, 대여: 8단계)
 * - 대여 목적: 양측 4단계 확인 이력 표시
 * - 역할별 액션 버튼 (승인, 반려, 반입 처리 등)
 *
 * PPR 패턴:
 * - Page 함수 동기 → 즉시 static shell 전송
 * - Suspense 자식에서 params await + 데이터 fetching
 * - RouteLoading(detail) 즉시 표시 → 데이터 로드 후 콘텐츠 스트리밍
 */
export default function CheckoutDetailPage(props: PageProps) {
  return (
    <Suspense fallback={<RouteLoading variant="detail" />}>
      <CheckoutDetailAsync paramsPromise={props.params} />
    </Suspense>
  );
}

async function CheckoutDetailAsync({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  // Next.js 16: params는 Promise, await 필수
  const { id } = await paramsPromise;

  let checkout;
  let conditionChecks;

  try {
    // Server Component에서 데이터 fetching (React.cache로 메모이제이션)
    checkout = await getCheckoutCached(id);

    // 대여 목적인 경우 상태 확인 기록도 조회
    if (checkout.purpose === CPVal.RENTAL) {
      try {
        conditionChecks = await getConditionChecksServer(id);
      } catch {
        // 상태 확인 기록 조회 실패 시 빈 배열로 처리
        conditionChecks = [];
      }
    }
  } catch (error: unknown) {
    // 404 에러인 경우 not-found 페이지로
    if (
      error instanceof Error &&
      (error.message.includes('404') || error.message.includes('찾을 수 없'))
    ) {
      notFound();
    }
    // 그 외 에러는 error.tsx에서 처리
    throw error;
  }

  return <CheckoutDetailClient checkout={checkout} conditionChecks={conditionChecks || []} />;
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
      title: t('metadata.detailTitle', {
        purpose: purposeLabel,
        destination: checkout.destination,
      }),
      description: t('metadata.detailDescription', {
        purpose: purposeLabel,
        destination: checkout.destination,
      }),
    };
  } catch {
    const t = await getTranslations('checkouts');
    return {
      title: t('metadata.detailFallbackTitle'),
      description: t('metadata.detailFallbackDescription'),
    };
  }
}
