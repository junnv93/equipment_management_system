import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { cache } from 'react';
import { parseManagementNumber } from '@equipment-management/schemas';
import * as equipmentApi from '@/lib/api/equipment-api-server';
import { EquipmentLandingClient } from '@/components/mobile/EquipmentLandingClient';
import type { EquipmentQRLanding } from '@/hooks/use-equipment-by-management-number';
import { isNotFoundError } from '@/lib/api/error';

type PageParams = Promise<{ managementNumber: string }>;

/**
 * QR 모바일 랜딩 — Next.js 16 PPR Non-Blocking 패턴.
 *
 * 원칙:
 * - sync Page → 정적 셸 즉시 전송 (FCP 최소화)
 * - Suspense 내부 async 자식이 Dynamic API 호출 (params Promise await)
 * - `parseManagementNumber` SSOT로 1차 유효성 → 실패 시 notFound()
 * - 서버 fetch 실패 시 notFound() → not-found.tsx 렌더
 * - 기존 `/equipment/[id]/page.tsx` PPR 관례 미러링
 */
export default function QRLandingPage({ params }: { params: PageParams }) {
  return (
    <Suspense fallback={null}>
      <QRLandingPageAsync params={params} />
    </Suspense>
  );
}

async function QRLandingPageAsync({ params }: { params: PageParams }) {
  const { managementNumber: raw } = await params;
  const decoded = decodeURIComponent(raw);

  if (!parseManagementNumber(decoded)) {
    notFound();
  }

  const equipment = await getEquipmentCached(decoded);
  return <EquipmentLandingClient initialData={equipment} />;
}

/**
 * Server Component 중복 fetch 방지 — generateMetadata와 Page가 같은 요청에서
 * 호출될 때 한 번만 실제 요청이 나간다.
 */
const getEquipmentCached = cache(async (managementNumber: string): Promise<EquipmentQRLanding> => {
  try {
    return await equipmentApi.getEquipmentByManagementNumber(managementNumber);
  } catch (error) {
    if (isNotFoundError(error)) {
      notFound();
    }
    throw error;
  }
});

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { managementNumber: raw } = await params;
  const decoded = decodeURIComponent(raw);

  if (!parseManagementNumber(decoded)) {
    return { title: 'Equipment not found' };
  }

  try {
    const equipment = await getEquipmentCached(decoded);
    return {
      title: `${equipment.name} (${equipment.managementNumber})`,
      description: `${equipment.name} - ${equipment.managementNumber}`,
    };
  } catch {
    return { title: 'Equipment not found' };
  }
}
