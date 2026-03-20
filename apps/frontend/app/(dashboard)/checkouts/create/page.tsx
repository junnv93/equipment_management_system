/**
 * 장비 반출 신청 페이지 (Server Component)
 *
 * ✅ Next.js 16 Best Practice:
 * - Server Component 경계가 Turbopack의 코드 분할 포인트로 작용
 * - Client bundle 분리를 통해 컴파일 성능 개선
 */

import dynamic from 'next/dynamic';
import { RouteLoading } from '@/components/layout/RouteLoading';

const CreateCheckoutContent = dynamic(() => import('./CreateCheckoutContent'), {
  loading: () => <RouteLoading variant="detail" />,
});

export default function CreateCheckoutPage() {
  return <CreateCheckoutContent />;
}
