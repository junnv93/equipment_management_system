'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
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
import { EQUIPMENT_TAB_TOKENS, ANIMATION_PRESETS } from '@/lib/design-tokens';

// 탭 로딩 스켈레톤 컴포넌트
function TabSkeleton() {
  return (
    <div className="space-y-4 p-4" aria-busy="true" aria-label="Loading tab content">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <div className="grid grid-cols-2 gap-4 mt-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    </div>
  );
}

// 동적 import로 탭 컴포넌트 지연 로딩
// ✅ Vercel Best Practice: bundle-dynamic-imports + ssr: false
// - 사용자가 해당 탭을 클릭할 때만 번들이 로드됨
// - ssr: false로 서버 번들 크기 감소 (탭은 클라이언트 상호작용 후에만 필요)
const BasicInfoTab = dynamic(
  () => import('./BasicInfoTab').then((mod) => ({ default: mod.BasicInfoTab })),
  { loading: () => <TabSkeleton />, ssr: false }
);

const CalibrationHistoryTab = dynamic(
  () => import('./CalibrationHistoryTab').then((mod) => ({ default: mod.CalibrationHistoryTab })),
  { loading: () => <TabSkeleton />, ssr: false }
);

const CalibrationFactorsTab = dynamic(
  () => import('./CalibrationFactorsTab').then((mod) => ({ default: mod.CalibrationFactorsTab })),
  { loading: () => <TabSkeleton />, ssr: false }
);

const CheckoutHistoryTab = dynamic(
  () => import('./CheckoutHistoryTab').then((mod) => ({ default: mod.CheckoutHistoryTab })),
  { loading: () => <TabSkeleton />, ssr: false }
);

const LocationHistoryTab = dynamic(
  () => import('./LocationHistoryTab').then((mod) => ({ default: mod.LocationHistoryTab })),
  { loading: () => <TabSkeleton />, ssr: false }
);

const MaintenanceHistoryTab = dynamic(
  () => import('./MaintenanceHistoryTab').then((mod) => ({ default: mod.MaintenanceHistoryTab })),
  { loading: () => <TabSkeleton />, ssr: false }
);

const IncidentHistoryTab = dynamic(
  () => import('./IncidentHistoryTab').then((mod) => ({ default: mod.IncidentHistoryTab })),
  { loading: () => <TabSkeleton />, ssr: false }
);

const SoftwareTab = dynamic(
  () => import('./SoftwareTab').then((mod) => ({ default: mod.SoftwareTab })),
  { loading: () => <TabSkeleton />, ssr: false }
);

const AttachmentsTab = dynamic(
  () => import('./AttachmentsTab').then((mod) => ({ default: mod.AttachmentsTab })),
  { loading: () => <TabSkeleton />, ssr: false }
);

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
  const t = useTranslations('equipment');
  const router = useRouter();
  const pathname = usePathname();

  // 탭 설정
  const tabs: TabConfig[] = [
    {
      value: 'basic',
      label: t('tabs.basic'),
      icon: FileText,
      component: BasicInfoTab,
    },
    {
      value: 'calibration',
      label: t('tabs.calibration'),
      icon: Calendar,
      component: CalibrationHistoryTab,
    },
    {
      value: 'factors',
      label: t('tabs.factors'),
      icon: Gauge,
      component: CalibrationFactorsTab,
    },
    {
      value: 'checkout',
      label: t('tabs.checkout'),
      icon: FileOutput,
      component: CheckoutHistoryTab,
    },
    {
      value: 'location',
      label: t('tabs.location'),
      icon: MapPin,
      component: LocationHistoryTab,
    },
    {
      value: 'maintenance',
      label: t('tabs.maintenance'),
      icon: Wrench,
      component: MaintenanceHistoryTab,
    },
    {
      value: 'incident',
      label: t('tabs.incident'),
      icon: AlertTriangle,
      component: IncidentHistoryTab,
    },
    {
      value: 'software',
      label: t('tabs.software'),
      icon: Code,
      component: SoftwareTab,
    },
    {
      value: 'attachments',
      label: t('tabs.attachments'),
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
      {/* 탭 리스트 - 스크롤 가능한 반응형 레이아웃 */}
      <div className={EQUIPMENT_TAB_TOKENS.mobileScroll.container}>
        <TabsList
          className="inline-flex h-auto bg-card p-1 rounded-lg shadow-sm border border-border min-w-max"
          aria-label={t('tabs.ariaLabel')}
        >
          {tabs.map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              id={`${value}-tab`}
              className={[
                'data-[state=active]:bg-ul-midnight data-[state=active]:text-white',
                EQUIPMENT_TAB_TOKENS.trigger.inactive,
                EQUIPMENT_TAB_TOKENS.trigger.base,
                'rounded-md hover:bg-muted',
                EQUIPMENT_TAB_TOKENS.trigger.focus,
              ].join(' ')}
              aria-label={t('tabs.tabAriaLabel', { label })}
            >
              <Icon
                className={`${EQUIPMENT_TAB_TOKENS.icon.size} mr-2 shrink-0`}
                aria-hidden="true"
              />
              <span className="text-sm font-medium whitespace-nowrap">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* 탭 컨텐츠 */}
      {tabs.map(({ value, label, component: Component }) => (
        <TabsContent
          key={value}
          value={value}
          className={[
            'space-y-4',
            ANIMATION_PRESETS.fadeIn,
            'motion-safe:fade-in-50 motion-safe:duration-300',
            'focus-visible:outline-none',
          ].join(' ')}
          role="tabpanel"
          aria-labelledby={`${value}-tab`}
          aria-label={t('tabs.panelAriaLabel', { label })}
          tabIndex={0}
        >
          <Component equipment={equipment} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
