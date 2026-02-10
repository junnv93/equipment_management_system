/**
 * 렌탈 반입 신청 페이지
 * 경로: /checkouts/import
 *
 * 기존 CreateRentalImportContent 컴포넌트를 재사용합니다.
 */
import CreateRentalImportContent from '@/app/(dashboard)/rental-imports/create/CreateRentalImportContent';

export default function ImportCreatePage() {
  return <CreateRentalImportContent />;
}
