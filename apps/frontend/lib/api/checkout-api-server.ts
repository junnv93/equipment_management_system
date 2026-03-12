/**
 * ============================================================================
 * Server-Side Checkout API
 * ============================================================================
 *
 * ⚠️ IMPORTANT: Server Component 전용 API
 *
 * 이 파일은 Server Components에서만 사용됩니다.
 * - Next.js 16 Server Components에서 안전하게 사용 가능
 * - createServerApiClient()를 통해 NextAuth 세션 토큰 자동 주입
 * - 절대로 'use client' 컴포넌트에서 import하지 마세요
 *
 * 사용 예시:
 *   // app/checkouts/[id]/page.tsx (Server Component)
 *   import { getCheckoutServer } from '@/lib/api/checkout-api-server';
 *
 *   export default async function Page(props: PageProps) {
 *     const checkout = await getCheckoutServer(id);
 *     return <CheckoutDetailClient checkout={checkout} />;
 *   }
 *
 * ============================================================================
 */

import { createServerApiClient } from './server-api-client';
import { transformSingleResponse } from './utils/response-transformers';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import type { Checkout, ConditionCheck } from './checkout-api';

/**
 * Server Component에서 특정 반출 정보를 조회합니다.
 * NextAuth 세션 토큰이 자동으로 주입됩니다.
 */
export async function getCheckoutServer(id: string): Promise<Checkout> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.get(API_ENDPOINTS.CHECKOUTS.GET(id));
  return transformSingleResponse<Checkout>(response);
}

/**
 * Server Component에서 특정 반출의 상태 확인 기록을 조회합니다.
 * 대여 목적 반출의 양측 4단계 확인 이력을 조회합니다.
 */
export async function getConditionChecksServer(checkoutId: string): Promise<ConditionCheck[]> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.get(API_ENDPOINTS.CHECKOUTS.CONDITION_CHECKS(checkoutId));
  return response.data?.data || response.data || [];
}
