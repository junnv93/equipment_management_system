'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EquipmentHeader } from './EquipmentHeader';
import { EquipmentTabs } from './EquipmentTabs';
import { NonConformanceBanner } from './NonConformanceBanner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import type { Equipment } from '@/lib/api/equipment-api';
import { useQuery } from '@tanstack/react-query';
import nonConformancesApi from '@/lib/api/non-conformances-api';

interface EquipmentDetailClientProps {
  equipment: Equipment;
}

/**
 * 장비 상세 페이지 - Client Component
 *
 * UL Solutions 브랜딩:
 * - 색상: UL Midnight Blue, UL Red, UL Green 등
 * - 타이포그래피: 깔끔하고 전문적인 레이아웃
 * - 애니메이션: 부드러운 전환 효과
 *
 * Next.js 16 패턴:
 * - useSearchParams로 탭 상태 관리
 * - useAuth로 권한 확인
 */
export function EquipmentDetailClient({ equipment }: EquipmentDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'basic';

  // 부적합 기록 조회
  const { data: nonConformances } = useQuery({
    queryKey: ['non-conformances', 'equipment', equipment.uuid],
    queryFn: () => nonConformancesApi.getEquipmentNonConformances(equipment.uuid),
    enabled: !!equipment.uuid,
  });

  // 열린 부적합 확인
  const openNonConformances =
    nonConformances?.filter((nc) => nc.status !== 'closed') || [];

  return (
    <div className="min-h-screen bg-ul-gray-light dark:bg-gray-950">
      {/* 헤더 */}
      <EquipmentHeader equipment={equipment} />

      {/* 컨텐츠 영역 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 공용장비 안내 배너 */}
        {equipment.isShared && (
          <Alert
            variant="default"
            className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50"
          >
            <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-800 dark:text-blue-200">
              공용장비 안내
            </AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-300">
              이 장비는 공용장비로 등록되어 있어 수정 및 삭제가 불가능합니다. 대여 및
              반출은 가능합니다.
            </AlertDescription>
          </Alert>
        )}

        {/* 부적합 상태 경고 배너 */}
        {openNonConformances.length > 0 && (
          <NonConformanceBanner
            equipmentId={equipment.uuid}
            nonConformances={openNonConformances}
            showDetails={true}
          />
        )}

        {/* 탭 내비게이션 및 컨텐츠 */}
        <EquipmentTabs equipment={equipment} activeTab={activeTab} />
      </div>
    </div>
  );
}
