import { Metadata } from 'next';
import { CreateEquipmentImportForm } from '@/components/equipment-imports';

export const metadata: Metadata = {
  title: '외부 렌탈 반입 신청',
  description: '외부 업체로부터 렌탈 장비를 반입합니다.',
};

/**
 * External Rental Import Creation Page
 *
 * Creates a new import request for equipment rented from external vendors.
 * After creation, the request enters the approval workflow.
 */
export default function CreateRentalImportPage() {
  return <CreateEquipmentImportForm sourceType="rental" />;
}
