'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { EquipmentStickyHeader } from './EquipmentStickyHeader';
import { EquipmentTabs } from './EquipmentTabs';
import { EquipmentKpiStrip } from './EquipmentKpiStrip';
import { NonConformanceBanner } from './NonConformanceBanner';
import { UsagePeriodBadge } from './UsagePeriodBadge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import equipmentApi, { type Equipment } from '@/lib/api/equipment-api';
import { useQuery } from '@tanstack/react-query';
import nonConformancesApi from '@/lib/api/non-conformances-api';
import disposalApi from '@/lib/api/disposal-api';
import { DisposalProgressCard } from './disposal/DisposalProgressCard';
import { DisposedBanner } from './disposal/DisposedBanner';
import { DisposalDetailDialog } from './disposal/DisposalDetailDialog';
import { DisposalRequestDialog } from './disposal/DisposalRequestDialog';
import { DisposalCancelDialog } from './disposal/DisposalCancelDialog';
import { DisposalReviewDialog } from './disposal/DisposalReviewDialog';
import { DisposalApprovalDialog } from './disposal/DisposalApprovalDialog';
import {
  EquipmentStatusValues as ESVal,
  type DisposalRequest,
} from '@equipment-management/schemas';
import { useAuth } from '@/hooks/use-auth';
import { queryKeys } from '@/lib/api/query-config';
import { ANIMATION_PRESETS } from '@/lib/design-tokens';

interface EquipmentDetailClientProps {
  equipment: Equipment;
  disposalRequest?: DisposalRequest | null;
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
 * - useQuery의 placeholderData로 즉시 표시 + 백그라운드 refetch
 * - 부적합 등록 등 상태 변경 시 캐시 무효화로 자동 갱신
 */
export function EquipmentDetailClient({
  equipment: initialEquipment,
  disposalRequest: initialDisposalRequest,
}: EquipmentDetailClientProps) {
  const t = useTranslations('equipment');
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'basic';
  const { user } = useAuth();
  const { setDynamicLabel, clearDynamicLabel } = useBreadcrumb();

  // 장비 식별자: 백엔드는 id 필드에 UUID를 저장
  const equipmentId = String(initialEquipment.id);

  // 브레드크럼 동적 라벨 설정
  useEffect(() => {
    const label = `${initialEquipment.name} (${initialEquipment.managementNumber})`;
    setDynamicLabel(equipmentId, label);
    return () => {
      clearDynamicLabel(equipmentId);
    };
  }, [
    equipmentId,
    initialEquipment.name,
    initialEquipment.managementNumber,
    setDynamicLabel,
    clearDynamicLabel,
  ]);

  // sticky 헤더 높이 → CSS 변수 동적 설정 (탭 바 top 위치 계산용)
  // EQUIPMENT_TAB_UNDERLINE_TOKENS.container 의 --sticky-header-height 변수에 사용
  useEffect(() => {
    const header = document.getElementById('equipment-sticky-header');
    if (!header) return;
    const observer = new ResizeObserver(([entry]) => {
      document.documentElement.style.setProperty(
        '--sticky-header-height',
        `${entry.contentRect.height}px`
      );
    });
    observer.observe(header);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--sticky-header-height');
    };
  }, []);

  // 폐기 관련 다이얼로그 상태 (EquipmentStickyHeader에서 리프팅)
  const [disposalRequestOpen, setDisposalRequestOpen] = useState(false);
  const [disposalReviewOpen, setDisposalReviewOpen] = useState(false);
  const [disposalApprovalOpen, setDisposalApprovalOpen] = useState(false);
  const [disposalCancelOpen, setDisposalCancelOpen] = useState(false);
  const [disposalDetailOpen, setDisposalDetailOpen] = useState(false);

  // ✅ 장비 데이터를 React Query로 관리하여 캐시 무효화 시 자동 갱신
  // 캐시 무효화 후 즉시 refetch하여 상태 변경을 반영
  //
  // ⚠️ Smart refetch 전략:
  // - Server Component provides reliable initial data
  // - refetchOnMount: 1시간 이상 오래된 캐시만 refetch (CalibrationOverdueScheduler 간격과 동기화)
  // - 이유: 새 페이지 컨텍스트에서 열 때 stale 데이터 방지
  // - 효과: 상세/목록 페이지 간 일관성 보장
  const { data: equipment = initialEquipment } = useQuery({
    queryKey: queryKeys.equipment.detail(equipmentId), // ✅ 표준화된 키
    queryFn: () => equipmentApi.getEquipment(equipmentId),
    placeholderData: initialEquipment, // Server Component에서 전달받은 초기 데이터
    staleTime: 0, // 캐시 무효화 시 즉시 stale 처리하여 refetch
    refetchOnMount: (query) => {
      // ✅ 스마트 refetch: 캐시가 1시간 이상 오래되면 refetch
      // CalibrationOverdueScheduler 간격(1시간)과 동기화
      const dataUpdatedAt = query.state.dataUpdatedAt;
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      return dataUpdatedAt < oneHourAgo;
    },
    enabled: !!equipmentId,
  });

  // ✅ 폐기 요청 데이터를 React Query로 관리하여 실시간 동기화
  // - placeholderData로 Server Component에서 받은 데이터 즉시 표시 + 백그라운드 refetch
  // - staleTime: 0 으로 캐시 무효화 시 즉시 refetch
  // - enabled: 장비가 pending_disposal 또는 disposed 상태일 때만 활성화
  const { data: disposalRequest } = useQuery({
    queryKey: queryKeys.equipment.currentDisposalRequest(equipmentId),
    queryFn: () => disposalApi.getCurrentDisposalRequest(equipmentId),
    placeholderData: initialDisposalRequest,
    staleTime: 0,
    enabled:
      !!equipmentId &&
      (equipment?.status === ESVal.PENDING_DISPOSAL || equipment?.status === ESVal.DISPOSED),
  });

  // 부적합 기록 조회
  const { data: nonConformances } = useQuery({
    queryKey: queryKeys.equipment.nonConformances(equipmentId), // ✅ 표준화된 키
    queryFn: () => nonConformancesApi.getEquipmentNonConformances(equipmentId),
    enabled: !!equipmentId,
  });

  // 열린 부적합 확인
  const openNonConformances = nonConformances?.filter((nc) => nc.status !== 'closed') || [];

  // 폐기 진행 단계 계산
  // pending: step 1 (요청) is current
  // reviewed: step 2 (검토) is complete, step 3 (승인) is current
  // approved: step 3 (승인) is complete
  const currentStep = disposalRequest
    ? disposalRequest.reviewStatus === 'pending'
      ? 1
      : disposalRequest.reviewStatus === 'reviewed'
        ? 3
        : 4
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* 컴팩트 Sticky 헤더 */}
      <EquipmentStickyHeader
        equipment={equipment}
        disposalRequest={disposalRequest}
        onDisposalRequestOpen={() => setDisposalRequestOpen(true)}
        onDisposalReviewOpen={() => setDisposalReviewOpen(true)}
        onDisposalApprovalOpen={() => setDisposalApprovalOpen(true)}
        onDisposalCancelOpen={() => setDisposalCancelOpen(true)}
        onDisposalDetailOpen={() => setDisposalDetailOpen(true)}
      />

      {/* 컨텐츠 영역 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {/* KPI 스트립 */}
        <EquipmentKpiStrip equipment={equipment} />
        {/* 폐기 진행 중 배너 */}
        {equipment.status === ESVal.PENDING_DISPOSAL && disposalRequest && (
          <div className={`${ANIMATION_PRESETS.slideDown} motion-safe:duration-200`}>
            <DisposalProgressCard
              disposalRequest={disposalRequest}
              currentStep={currentStep}
              onViewDetails={() => setDisposalDetailOpen(true)}
              onCancel={() => {
                // TODO: Implement cancel confirmation dialog
              }}
              canCancel={disposalRequest.requestedBy === user?.id}
            />
          </div>
        )}

        {/* 폐기 완료 배너 */}
        {equipment.status === ESVal.DISPOSED && disposalRequest && (
          <div className={`${ANIMATION_PRESETS.slideDown} motion-safe:duration-200`}>
            <DisposedBanner disposalRequest={disposalRequest} />
          </div>
        )}

        {/* 부적합 상태 경고 배너 (폐기 다음, 공용장비보다 우선) */}
        {openNonConformances.length > 0 && (
          <div className={`${ANIMATION_PRESETS.slideDown} motion-safe:duration-200`}>
            <NonConformanceBanner
              equipmentId={equipmentId}
              nonConformances={openNonConformances}
              showDetails={true}
            />
          </div>
        )}

        {/* 공용장비 안내 배너 */}
        {equipment.isShared && (
          <div className={`${ANIMATION_PRESETS.slideDown} motion-safe:duration-200`}>
            <Alert
              variant="default"
              className="border-brand-info/20 bg-brand-info/5 dark:border-brand-info/30 dark:bg-brand-info/10"
            >
              <AlertTriangle className="h-4 w-4 text-brand-info dark:text-brand-info" />
              <AlertTitle className="text-foreground flex items-center gap-2">
                {t('sharedBanner.title')}
                {/* 임시등록 장비이고 사용 기간이 있는 경우 D-day 표시 */}
                {equipment.status === ESVal.TEMPORARY &&
                  equipment.usagePeriodStart &&
                  equipment.usagePeriodEnd && (
                    <UsagePeriodBadge
                      startDate={equipment.usagePeriodStart}
                      endDate={equipment.usagePeriodEnd}
                    />
                  )}
              </AlertTitle>
              <AlertDescription className="text-muted-foreground">
                {equipment.status === ESVal.TEMPORARY ? (
                  <>
                    {t('sharedBanner.temporaryDesc', { source: equipment.sharedSource || 'other' })}
                    {equipment.usagePeriodEnd && <> {t('sharedBanner.expiryNotice')}</>}
                  </>
                ) : (
                  t('sharedBanner.sharedDesc')
                )}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* 탭 내비게이션 및 컨텐츠 */}
        <EquipmentTabs equipment={equipment} activeTab={activeTab} />
      </div>

      {/* 폐기 관련 다이얼로그 (EquipmentStickyHeader에서 리프팅) */}
      <DisposalRequestDialog
        open={disposalRequestOpen}
        onOpenChange={setDisposalRequestOpen}
        equipmentId={equipmentId}
        equipmentName={equipment.name}
      />
      <DisposalCancelDialog
        open={disposalCancelOpen}
        onOpenChange={setDisposalCancelOpen}
        equipmentId={equipmentId}
        equipmentName={equipment.name}
      />
      {disposalRequest && (
        <>
          <DisposalReviewDialog
            open={disposalReviewOpen}
            onOpenChange={setDisposalReviewOpen}
            equipmentId={equipmentId}
            equipment={equipment}
            disposalRequest={disposalRequest}
          />
          <DisposalApprovalDialog
            open={disposalApprovalOpen}
            onOpenChange={setDisposalApprovalOpen}
            equipmentId={equipmentId}
            equipment={equipment}
            disposalRequest={disposalRequest}
          />
          <DisposalDetailDialog
            open={disposalDetailOpen}
            onOpenChange={setDisposalDetailOpen}
            disposalRequest={disposalRequest}
            equipmentName={equipment.name}
          />
        </>
      )}
    </div>
  );
}
