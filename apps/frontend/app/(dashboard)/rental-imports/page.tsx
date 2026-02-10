import { redirect } from 'next/navigation';

/**
 * 레거시 경로 리다이렉트
 * /rental-imports → /checkouts?view=inbound
 */
export default function RentalImportsPage() {
  redirect('/checkouts?view=inbound');
}
