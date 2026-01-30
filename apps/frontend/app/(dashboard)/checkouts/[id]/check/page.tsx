import { Suspense, cache } from 'react';
import { notFound } from 'next/navigation';
import ConditionCheckClient from './ConditionCheckClient';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import checkoutApi from '@/lib/api/checkout-api';
import { CheckoutStatus, ConditionCheckStep } from '@equipment-management/schemas';

/**
 * React.cache()로 같은 render pass에서 중복 호출 방지
 */
const getCheckoutCached = cache(async (id: string) => {
  return checkoutApi.getCheckout(id);
});

const getConditionChecksCached = cache(async (id: string) => {
  try {
    return await checkoutApi.getConditionChecks(id);
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
 * 현재 상태에서 필요한 확인 단계 결정
 *
 * 대여 목적 반출의 상태 전이:
 * approved → lender_checked (①반출 전 확인)
 * lender_checked → borrower_received (②인수 확인)
 * borrower_received → in_use (사용 시작)
 * in_use → borrower_returned (③반납 전 확인)
 * borrower_returned → lender_received (④반입 확인)
 */
function getNextCheckStep(status: CheckoutStatus): ConditionCheckStep | null {
  const stepMap: Partial<Record<CheckoutStatus, ConditionCheckStep>> = {
    approved: 'lender_checkout', // 승인됨 → 반출 전 확인 필요
    checked_out: 'lender_checkout', // 반출 중 (교정/수리에서 전환된 경우)
    lender_checked: 'borrower_receive', // 반출 전 확인 완료 → 인수 확인 필요
    borrower_received: 'borrower_return', // 인수 확인 완료 (사용 중) → 반납 전 확인 필요
    in_use: 'borrower_return', // 사용 중 → 반납 전 확인 필요
    borrower_returned: 'lender_return', // 반납 전 확인 완료 → 반입 확인 필요
  };

  return stepMap[status] || null;
}

/**
 * 상태 확인 페이지 - Server Component
 *
 * 비즈니스 로직 (UL-QP-18):
 * - 대여 목적 반출 시 양측 4단계 확인
 * - 현재 상태에 따라 적절한 확인 단계를 결정
 * - 이전 확인 기록과 비교하여 변경 사항 추적
 *
 * Next.js 16 패턴:
 * - params는 Promise 타입
 * - Server Component에서 데이터 fetching
 * - Client Component로 UI 렌더링 위임
 */
export default async function ConditionCheckPage(props: PageProps) {
  const { id } = await props.params;

  let checkout;
  let conditionChecks;
  let nextStep: ConditionCheckStep | null;

  try {
    // Server Component에서 데이터 fetching
    checkout = await getCheckoutCached(id);
    conditionChecks = await getConditionChecksCached(id);
    nextStep = getNextCheckStep(checkout.status);
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.message.includes('404') || error.message.includes('찾을 수 없'))
    ) {
      notFound();
    }
    throw error;
  }

  // 대여 목적이 아닌 경우
  if (checkout.purpose !== 'rental') {
    notFound();
  }

  // 확인이 필요하지 않은 상태인 경우
  if (!nextStep) {
    notFound();
  }

  // 이전 확인 기록 찾기 (비교용)
  const previousCheck = conditionChecks.find((check) => {
    // ④반입 확인 시 ①반출 전 확인과 비교
    if (nextStep === 'lender_return') {
      return check.step === 'lender_checkout';
    }
    // ③반납 전 확인 시 ②인수 확인과 비교
    if (nextStep === 'borrower_return') {
      return check.step === 'borrower_receive';
    }
    return false;
  });

  return (
    <Suspense fallback={<ConditionCheckSkeleton />}>
      <ConditionCheckClient
        checkout={checkout}
        nextStep={nextStep}
        previousCheck={previousCheck}
        conditionChecks={conditionChecks}
      />
    </Suspense>
  );
}

/**
 * 메타데이터 생성
 */
export async function generateMetadata(props: PageProps) {
  const { id } = await props.params;

  try {
    const checkout = await getCheckoutCached(id);
    return {
      title: `상태 확인 - ${checkout.destination}`,
      description: `${checkout.destination}으로의 대여 반출 상태 확인`,
    };
  } catch {
    return {
      title: '상태 확인',
      description: '장비 상태 확인',
    };
  }
}

/**
 * 로딩 스켈레톤
 */
function ConditionCheckSkeleton() {
  return (
    <div className="container mx-auto py-6 max-w-2xl space-y-6">
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
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
