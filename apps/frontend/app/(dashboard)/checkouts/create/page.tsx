/**
 * 장비 반출 신청 페이지 (Server Component)
 *
 * Server Component 경계가 코드 분할 포인트로 작용하며,
 * CreateCheckoutContent(Client Component)를 dynamic import로 lazy-load합니다.
 */

import dynamic from 'next/dynamic';
import { RouteLoading } from '@/components/layout/RouteLoading';

const CreateCheckoutContent = dynamic(() => import('./CreateCheckoutContent'), {
  loading: () => <RouteLoading variant="detail" />,
});

export default function CreateCheckoutPage() {
  return <CreateCheckoutContent />;
}
