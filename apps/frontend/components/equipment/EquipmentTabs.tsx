'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Calendar,
  Gauge,
  FileOutput,
  MapPin,
  Wrench,
  AlertTriangle,
  Code,
  Paperclip,
} from 'lucide-react';
import type { Equipment } from '@/lib/api/equipment-api';
import { BasicInfoTab } from './BasicInfoTab';
import { CalibrationHistoryTab } from './CalibrationHistoryTab';
import { CalibrationFactorsTab } from './CalibrationFactorsTab';
import { CheckoutHistoryTab } from './CheckoutHistoryTab';
import { LocationHistoryTab } from './LocationHistoryTab';
import { MaintenanceHistoryTab } from './MaintenanceHistoryTab';
import { IncidentHistoryTab } from './IncidentHistoryTab';
import { SoftwareTab } from './SoftwareTab';
import { AttachmentsTab } from './AttachmentsTab';

interface EquipmentTabsProps {
  equipment: Equipment;
  activeTab: string;
}

interface TabConfig {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType<{ equipment: Equipment }>;
}

/**
 * 장비 상세 탭 컴포넌트
 *
 * UL Solutions 브랜딩:
 * - 탭: 아이콘 + 텍스트, 활성 탭 하단 UL Red 라인
 * - URL 쿼리 파라미터로 탭 상태 관리
 * - 각 탭 컨텐츠는 lazy loading
 */
export function EquipmentTabs({ equipment, activeTab }: EquipmentTabsProps) {
  const router = useRouter();
  const pathname = usePathname();

  // 탭 설정
  const tabs: TabConfig[] = [
    {
      value: 'basic',
      label: '기본 정보',
      icon: FileText,
      component: BasicInfoTab,
    },
    {
      value: 'calibration',
      label: '교정 이력',
      icon: Calendar,
      component: CalibrationHistoryTab,
    },
    {
      value: 'factors',
      label: '보정계수',
      icon: Gauge,
      component: CalibrationFactorsTab,
    },
    {
      value: 'checkout',
      label: '반출 이력',
      icon: FileOutput,
      component: CheckoutHistoryTab,
    },
    {
      value: 'location',
      label: '위치 변동',
      icon: MapPin,
      component: LocationHistoryTab,
    },
    {
      value: 'maintenance',
      label: '유지보수',
      icon: Wrench,
      component: MaintenanceHistoryTab,
    },
    {
      value: 'incident',
      label: '사고 이력',
      icon: AlertTriangle,
      component: IncidentHistoryTab,
    },
    {
      value: 'software',
      label: '소프트웨어',
      icon: Code,
      component: SoftwareTab,
    },
    {
      value: 'attachments',
      label: '첨부파일',
      icon: Paperclip,
      component: AttachmentsTab,
    },
  ];

  // 탭 변경 핸들러 (URL 쿼리 파라미터 업데이트)
  const handleTabChange = (tab: string) => {
    router.push(`${pathname}?tab=${tab}`, { scroll: false });
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
      {/* 탭 리스트 */}
      <TabsList className="inline-flex h-auto bg-white dark:bg-gray-900 p-1 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
        {tabs.map(({ value, label, icon: Icon }) => (
          <TabsTrigger
            key={value}
            value={value}
            className="data-[state=active]:bg-ul-midnight data-[state=active]:text-white data-[state=inactive]:text-gray-700 dark:data-[state=inactive]:text-gray-300 px-4 py-2.5 rounded-md transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={`${label} 탭`}
          >
            <Icon className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">{label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {/* 탭 컨텐츠 */}
      {tabs.map(({ value, component: Component }) => (
        <TabsContent
          key={value}
          value={value}
          className="space-y-4 animate-in fade-in-50 duration-300"
          role="tabpanel"
          aria-labelledby={`${value}-tab`}
        >
          <Component equipment={equipment} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
