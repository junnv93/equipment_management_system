'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Edit, Trash2, FileOutput } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SharedEquipmentBadge } from './SharedEquipmentBadge';
import type { Equipment } from '@/lib/api/equipment-api';
import { useAuth } from '@/hooks/use-auth';
import { useEquipmentWithInitialData } from '@/hooks/use-equipment';
import { cn } from '@/lib/utils';
import { shouldDisplayCalibrationStatus } from '@/lib/constants/equipment-status-styles';
import { DisposalButton } from './disposal/DisposalButton';
import { DisposalRequestDialog } from './disposal/DisposalRequestDialog';
import { DisposalReviewDialog } from './disposal/DisposalReviewDialog';
import { DisposalApprovalDialog } from './disposal/DisposalApprovalDialog';
import { DisposalCancelDialog } from './disposal/DisposalCancelDialog';
import { useDisposalPermissions } from '@/hooks/use-disposal-permissions';
import type { DisposalRequest } from '@equipment-management/schemas';
import {
  EQUIPMENT_STATUS_TOKENS,
  DEFAULT_STATUS_CONFIG,
  CALIBRATION_BADGE_TOKENS,
  EQUIPMENT_HEADER_TOKENS,
  getEquipmentHeaderButtonClasses,
} from '@/lib/design-tokens';

interface EquipmentHeaderProps {
  equipment: Equipment;
  disposalRequest?: DisposalRequest | null;
}

/**
 * 장비 상세 페이지 헤더
 *
 * UL Solutions 브랜딩:
 * - 배경: UL Midnight Blue 그라데이션
 * - 텍스트: 흰색
 * - 상태 뱃지: UL 색상 팔레트
 * - 액션 버튼: 권한별 표시/숨김
 *
 * Client-Side Cache 구독:
 * - Server Component에서 받은 초기 데이터를 initialData로 사용
 * - mutation 후 React Query 캐시가 갱신되면 즉시 UI 반영 (예: 부적합 등록)
 */
export function EquipmentHeader({
  equipment: initialEquipment,
  disposalRequest,
}: EquipmentHeaderProps) {
  const t = useTranslations('equipment');
  const { hasRole } = useAuth();

  // 폐기 관련 다이얼로그 상태
  const [disposalRequestOpen, setDisposalRequestOpen] = useState(false);
  const [disposalReviewOpen, setDisposalReviewOpen] = useState(false);
  const [disposalApprovalOpen, setDisposalApprovalOpen] = useState(false);
  const [disposalCancelOpen, setDisposalCancelOpen] = useState(false);
  const [_disposalDetailOpen, _setDisposalDetailOpen] = useState(false);

  // ✅ SSOT: Client-side 캐시 구독 훅 사용
  // Server Component에서 받은 초기 데이터를 placeholderData로 즉시 표시하고,
  // 백그라운드에서 항상 최신 데이터 refetch + mutation 후 캐시 갱신 즉시 반영
  const { data: equipment } = useEquipmentWithInitialData(initialEquipment);

  // 장비 식별자: 백엔드는 id 필드에 UUID를 저장
  const equipmentId = String(equipment.id);

  /**
   * 권한 확인 (UL-QP-18 기준)
   *
   * 수정 권한:
   * - 모든 역할이 장비 수정 요청 가능 (시험실무자는 승인 필요)
   * - 공용장비(isShared)만 수정 불가
   * - 폐기(retired) 상태 장비는 수정 불가
   *
   * 삭제 권한:
   * - lab_manager, system_admin만 삭제 가능
   * - 공용장비(isShared)는 삭제 불가
   * - 승인 전(pending_approval) 또는 반려(rejected) 상태만 삭제 가능
   */
  const canEdit = equipment.status !== 'retired'; // ✅ isShared 제약 제거 - 공용장비도 수정 가능
  const canDelete =
    hasRole(['lab_manager', 'system_admin']) &&
    !equipment.isShared &&
    (equipment.approvalStatus === 'pending_approval' || equipment.approvalStatus === 'rejected');

  // 폐기 권한 확인
  const disposalPermissions = useDisposalPermissions(equipment, disposalRequest);
  /**
   * 반출 가능 상태 확인
   *
   * UL-QP-18 기준:
   * - 반출 중(checked_out), 폐기(retired), 사용 중(in_use)인 장비는 반출 불가
   * - 부적합(non_conforming), 교정기한초과(calibration_overdue)도 교정/수리 목적 반출 가능
   */
  const STATUS_NOT_ALLOWED_FOR_CHECKOUT = ['checked_out', 'retired', 'in_use'];
  const currentStatus = equipment.status || 'available';
  const canCheckout = !STATUS_NOT_ALLOWED_FOR_CHECKOUT.includes(currentStatus);

  /**
   * 교정 상태 계산 (동적)
   *
   * 기본 상태(가용성)와 별도로 교정 상태를 계산하여 복합 상태 표현 가능
   * - 폐기(retired) 장비는 교정 상태 표시 안함
   * - 부적합(non_conforming) 상태에서도 교정기한 초과인 경우 일수 배지 표시
   *
   * SSOT: CALIBRATION_BADGE_TOKENS (design-tokens) 사용
   */
  const calibrationStatus = useMemo(() => {
    const isNonConforming = equipment.status === 'non_conforming';
    const shouldSkipCalibration = !shouldDisplayCalibrationStatus(equipment.status);

    if (shouldSkipCalibration && !isNonConforming) {
      return null;
    }

    if (!equipment.calibrationRequired || equipment.calibrationMethod === 'not_applicable') {
      return null;
    }

    const nextCalibrationDate = equipment.nextCalibrationDate
      ? new Date(equipment.nextCalibrationDate)
      : null;

    if (!nextCalibrationDate) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    nextCalibrationDate.setHours(0, 0, 0, 0);

    const diffTime = nextCalibrationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      const token = CALIBRATION_BADGE_TOKENS.overdue;
      return {
        type: 'overdue' as const,
        days: overdueDays,
        label: t('calibration.overdaysDays', { days: overdueDays }),
        color: token.header.textColor,
        bg: token.header.bgClasses,
        icon: token.icon,
      };
    } else if (isNonConforming) {
      return null;
    } else if (diffDays <= 30) {
      const severity = diffDays <= 7 ? 'urgent' : 'warning';
      const token = CALIBRATION_BADGE_TOKENS[severity];
      return {
        type: 'upcoming' as const,
        days: diffDays,
        label:
          diffDays === 0
            ? t('calibration.expiresToday')
            : t('calibration.expiresInDays', { days: diffDays }),
        color: token.header.textColor,
        bg: token.header.bgClasses,
        icon: token.icon,
      };
    }

    return null;
  }, [
    equipment.status,
    equipment.calibrationRequired,
    equipment.calibrationMethod,
    equipment.nextCalibrationDate,
  ]);

  /**
   * 기본 상태 설정 (가용성 기준)
   *
   * SSOT: EQUIPMENT_STATUS_TOKENS (design-tokens)
   * - calibration_scheduled → available (교정 상태는 별도 배지)
   * - calibration_overdue → non_conforming (부적합 + 교정 일수 배지)
   */
  const getStatusToken = (status: string) => {
    const normalizedStatus = status === 'calibration_scheduled' ? 'available' : status;
    const finalStatus =
      normalizedStatus === 'calibration_overdue' ? 'non_conforming' : normalizedStatus;

    const token = EQUIPMENT_STATUS_TOKENS[finalStatus] || DEFAULT_STATUS_CONFIG;
    return {
      color: token.header.textColor,
      bg: token.header.bgClasses,
      label: token.label,
      icon: token.icon,
    };
  };

  const statusConfig = getStatusToken(equipment.status || 'available');

  return (
    <div
      className={cn(EQUIPMENT_HEADER_TOKENS.background, EQUIPMENT_HEADER_TOKENS.text, 'shadow-xl')}
    >
      <div className={cn(EQUIPMENT_HEADER_TOKENS.container, EQUIPMENT_HEADER_TOKENS.padding)}>
        {/* 목록으로 버튼 */}
        <div className="mb-6">
          <Link href="/equipment">
            <Button variant="ghost" size="sm" className={getEquipmentHeaderButtonClasses('back')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('detail.backToList')}
            </Button>
          </Link>
        </div>

        <div className="space-y-6">
          {/* 장비명 및 기본 정보 */}
          <div>
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              {/* 왼쪽: 장비명, 모델명, 관리번호 */}
              <div className="space-y-3 flex-1">
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-balance">
                  {equipment.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-white/80">
                  <span className="text-base">
                    {t('header.model')}{' '}
                    <span className="font-medium text-white">{equipment.modelName}</span>
                  </span>
                  <span className="text-white/40">•</span>
                  <span className="text-base">
                    {t('header.managementNumber')}{' '}
                    <span className="font-mono font-medium text-white">
                      {equipment.managementNumber}
                    </span>
                  </span>
                  {equipment.serialNumber && (
                    <>
                      <span className="text-white/40">•</span>
                      <span className="text-base">
                        {t('header.serialNumber')}{' '}
                        <span className="font-mono font-medium text-white">
                          {equipment.serialNumber}
                        </span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* 오른쪽: 액션 버튼 - 시각적 계층구조 준수 */}
              <div className="flex flex-wrap gap-3">
                {canCheckout && (
                  <Link href={`/equipment/${equipmentId}/checkout`}>
                    <Button
                      variant="default"
                      className="bg-white text-ul-midnight hover:bg-gray-100 shadow-lg font-semibold hover:scale-[1.02] active:scale-[0.98]"
                      aria-label={t('header.checkoutAriaLabel')}
                    >
                      <FileOutput className="h-4 w-4 mr-2" aria-hidden="true" />
                      {t('header.checkoutRequest')}
                    </Button>
                  </Link>
                )}
                {canEdit && (
                  <Link href={`/equipment/${equipmentId}/edit`}>
                    <Button
                      variant="outline"
                      className={cn(
                        getEquipmentHeaderButtonClasses('primary'),
                        'border-white/60 hover:border-white font-medium shadow-md backdrop-blur-sm'
                      )}
                      aria-label={t('header.editAriaLabel')}
                    >
                      <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                      {t('header.edit')}
                    </Button>
                  </Link>
                )}

                {/* 폐기 버튼 */}
                {disposalPermissions.showDisposalButton && (
                  <DisposalButton
                    equipment={equipment}
                    disposalRequest={disposalRequest || null}
                    onRequestOpen={() => setDisposalRequestOpen(true)}
                    onReviewOpen={() => setDisposalReviewOpen(true)}
                    onApproveOpen={() => setDisposalApprovalOpen(true)}
                    onCancelOpen={() => setDisposalCancelOpen(true)}
                    onDetailOpen={() => _setDisposalDetailOpen(true)}
                    permissions={disposalPermissions}
                  />
                )}

                {canDelete && (
                  <Button
                    variant="outline"
                    className={cn(
                      getEquipmentHeaderButtonClasses('destructive'),
                      'border-red-300/70 font-medium shadow-md backdrop-blur-sm'
                    )}
                    aria-label={t('header.deleteAriaLabel')}
                  >
                    <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                    {t('header.delete')}
                  </Button>
                )}
              </div>
            </div>

            {/* 상태 뱃지 (접근성: 아이콘+텍스트로 색상 외 상태 구분) */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {/* 기본 상태 배지 (가용성) */}
              <Badge
                variant="outline"
                className={cn(
                  'px-3 py-1.5 text-sm font-semibold border-2 inline-flex items-center gap-1.5',
                  statusConfig.bg,
                  statusConfig.color
                )}
                role="status"
                aria-label={t('header.statusAriaLabel', { status: statusConfig.label })}
              >
                <statusConfig.icon className="h-4 w-4" aria-hidden="true" />
                <span>{statusConfig.label}</span>
              </Badge>

              {/* 교정 상태 배지 (별도 표시) - 복합 상태 지원 */}
              {calibrationStatus && (
                <Badge
                  variant="outline"
                  className={cn(
                    'px-3 py-1.5 text-sm font-semibold border-2 inline-flex items-center gap-1.5',
                    calibrationStatus.bg,
                    calibrationStatus.color
                  )}
                  role="status"
                  aria-label={t('header.calibrationStatusAriaLabel', {
                    status: calibrationStatus.label,
                  })}
                >
                  <calibrationStatus.icon className="h-4 w-4" aria-hidden="true" />
                  <span>{calibrationStatus.label}</span>
                </Badge>
              )}

              {/* 공용장비 배지 */}
              {equipment.isShared && (
                <SharedEquipmentBadge sharedSource={equipment.sharedSource} size="default" />
              )}
            </div>
          </div>

          {/* 운영책임자 정보 - 나중에 구현 */}
        </div>
      </div>

      {/* 폐기 관련 다이얼로그 */}
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
        </>
      )}
    </div>
  );
}
