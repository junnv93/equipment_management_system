import { Metadata } from 'next';
import { EquipmentImportDetail } from '@/components/equipment-imports';

export const metadata: Metadata = {
  title: '반입 신청 상세',
  description: '장비 반입 신청의 상세 정보를 확인합니다.',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Equipment Import Detail Page - Unified for rental and internal shared
 *
 * Displays import request details with conditional sections based on sourceType.
 * Supports action buttons for approval, rejection, cancellation, receiving, and return.
 */
export default async function EquipmentImportDetailPage(props: PageProps) {
  const { id } = await props.params;

  return <EquipmentImportDetail id={id} />;
}
