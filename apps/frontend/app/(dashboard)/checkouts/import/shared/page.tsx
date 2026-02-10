import { Metadata } from 'next';
import { CreateEquipmentImportForm } from '@/components/equipment-imports';

export const metadata: Metadata = {
  title: '내부 공용장비 반입 신청',
  description: '타 부서의 공용장비를 임시로 반입합니다.',
};

/**
 * Internal Shared Equipment Import Creation Page
 *
 * Creates a new import request for equipment borrowed from other internal departments
 * (e.g., Safety Lab, Battery Lab). After creation, the request enters the approval workflow.
 */
export default function CreateInternalSharedImportPage() {
  return <CreateEquipmentImportForm sourceType="internal_shared" />;
}
