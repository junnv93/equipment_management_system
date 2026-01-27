'use client';

import { useSearchParams } from 'next/navigation';
import { EquipmentHeader } from './EquipmentHeader';
import { EquipmentTabs } from './EquipmentTabs';
import { NonConformanceBanner } from './NonConformanceBanner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import equipmentApi, { type Equipment } from '@/lib/api/equipment-api';
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
 *
 * ✅ 상태 동기화 패턴 (Best Practice):
 * - Server Component에서 초기 데이터를 props로 전달받음
 * - useQuery의 initialData로 hydration 최적화
 * - 부적합 등록 등 상태 변경 시 캐시 무효화로 자동 갱신
 */
export function EquipmentDetailClient({ equipment: initialEquipment }: EquipmentDetailClientProps) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'basic';

  // 장비 식별자: 백엔드는 id 필드에 UUID를 저장
  const equipmentId = String(initialEquipment.id);

  // ✅ 장비 데이터를 React Query로 관리하여 캐시 무효화 시 자동 갱신
  // 캐시 무효화 후 즉시 refetch하여 상태 변경을 반영
  const { data: equipment } = useQuery({
    queryKey: ['equipment', equipmentId],
    queryFn: () => equipmentApi.getEquipment(equipmentId),
    initialData: initialEquipment, // Server Component에서 전달받은 초기 데이터
    staleTime: 0, // 캐시 무효화 시 즉시 stale 처리하여 refetch
    refetchOnMount: true, // 컴포넌트 마운트 시 항상 refetch
    enabled: !!equipmentId,
  });

  // 부적합 기록 조회
  const { data: nonConformances } = useQuery({
    queryKey: ['non-conformances', 'equipment', equipmentId],
    queryFn: () => nonConformancesApi.getEquipmentNonConformances(equipmentId),
    enabled: !!equipmentId,
  });

  // 열린 부적합 확인
  const openNonConformances =
    nonConformances?.filter((nc) => nc.status !== 'closed') || [];

  return (
    <div className="min-h-screen bg-ul-gray-bg dark:bg-gray-950">
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
            equipmentId={equipmentId}
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
