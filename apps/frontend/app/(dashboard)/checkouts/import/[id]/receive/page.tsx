import { Metadata } from 'next';
import { ReceiveEquipmentImportForm } from '@/components/equipment-imports';

export const metadata: Metadata = {
  title: '수령 확인',
  description: '반입 장비의 수령 상태를 점검하고 확인합니다.',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Equipment Import Receive Page - Unified for rental and internal shared
 *
 * Allows users to confirm receipt of imported equipment with condition checks.
 * The form is identical for both rental and internal shared imports.
 * Upon confirmation, equipment is automatically registered in the system.
 */
export default async function ReceiveEquipmentImportPage(props: PageProps) {
  const { id } = await props.params;

  return <ReceiveEquipmentImportForm id={id} />;
}
