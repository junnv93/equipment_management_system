'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Edit, Trash2, FileOutput, Download } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SharedEquipmentBadge } from './SharedEquipmentBadge';
import type { Equipment } from '@/lib/api/equipment-api';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import {
  shouldDisplayCalibrationStatus,
  STATUS_NOT_ALLOWED_FOR_CHECKOUT,
  getDisplayStatus,
} from '@/lib/constants/equipment-status-styles';
import { DisposalButton } from './disposal/DisposalButton';
import { useDisposalPermissions } from '@/hooks/use-disposal-permissions';
import {
  EquipmentStatusValues as ESVal,
  type EquipmentStatus,
  type DisposalRequest,
  CalibrationApprovalStatusValues as CASVal,
} from '@equipment-management/schemas';
import { Permission, FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import {
  EQUIPMENT_STATUS_TOKENS,
  DEFAULT_STATUS_CONFIG,
  CALIBRATION_BADGE_TOKENS,
  EQUIPMENT_DETAIL_HEADER_TOKENS,
} from '@/lib/design-tokens';

interface EquipmentStickyHeaderProps {
  /** 부모(EquipmentDetailClient)의 TanStack Query 구독 데이터 — 직접 구독하지 않음 */
  equipment: Equipment;
  disposalRequest?: DisposalRequest | null;
  onDisposalRequestOpen: () => void;
  onDisposalReviewOpen: () => void;
  onDisposalApprovalOpen: () => void;
  onDisposalCancelOpen: () => void;
  onDisposalDetailOpen: () => void;
}

/**
 * 장비 상세 페이지 컴팩트 Sticky 헤더 — 프레젠테이셔널 컴포넌트
 *
 * 설계 원칙:
 * - 데이터 구독 없음 — 부모(EquipmentDetailClient)에서 live equipment를 props으로 받음
 * - 폐기 다이얼로그 상태 없음 — 부모에서 콜백으로 제어
 * - bg-background semantic token 사용 (하드코딩 금지)
 * - WCAG 대비: light bg + text-foreground/muted-foreground 자동 충족
 */
export function EquipmentStickyHeader({
  equipment,
  disposalRequest,
  onDisposalRequestOpen,
  onDisposalReviewOpen,
  onDisposalApprovalOpen,
  onDisposalCancelOpen,
  onDisposalDetailOpen,
}: EquipmentStickyHeaderProps) {
  const t = useTranslations('equipment');
  const { can } = useAuth();

  const equipmentId = String(equipment.id);

  // 권한 계산 — SSOT: Permission enum + STATUS 조건 조합
  const canEdit = can(Permission.UPDATE_EQUIPMENT) && equipment.status !== ESVal.RETIRED;
  const canDelete =
    can(Permission.DELETE_EQUIPMENT) &&
    !equipment.isShared &&
    (equipment.approvalStatus === CASVal.PENDING_APPROVAL ||
      equipment.approvalStatus === CASVal.REJECTED);

  const disposalPermissions = useDisposalPermissions(equipment, disposalRequest);

  // SSOT: Permission + STATUS_NOT_ALLOWED_FOR_CHECKOUT (equipment-status-styles.ts)
  const canCheckout =
    can(Permission.CREATE_CHECKOUT) &&
    !STATUS_NOT_ALLOWED_FOR_CHECKOUT.includes(
      (equipment.status ?? ESVal.AVAILABLE) as (typeof STATUS_NOT_ALLOWED_FOR_CHECKOUT)[number]
    );

  // 상태 정규화: DISPLAY_STATUS_OVERRIDES SSOT 사용
  const getStatusToken = (status: string) => {
    const final = getDisplayStatus(status as EquipmentStatus);
    const token = EQUIPMENT_STATUS_TOKENS[final] || DEFAULT_STATUS_CONFIG;
    return {
      label: t(`status.${final}` as Parameters<typeof t>[0]),
      icon: token.icon,
      bg: token.card.className,
    };
  };

  const statusConfig = getStatusToken(equipment.status || ESVal.AVAILABLE);

  // 교정 D-day 배지
  const calibrationStatus = useMemo(() => {
    const isNonConforming = equipment.status === ESVal.NON_CONFORMING;
    const shouldSkip = !shouldDisplayCalibrationStatus(equipment.status);
    if (shouldSkip && !isNonConforming) return null;
    if (!equipment.calibrationRequired || equipment.calibrationMethod === 'not_applicable')
      return null;
    if (!equipment.nextCalibrationDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next = new Date(equipment.nextCalibrationDate);
    next.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const token = CALIBRATION_BADGE_TOKENS.overdue;
      return {
        label: t('calibration.overdaysDays', { days: Math.abs(diffDays) }),
        className: token.card,
        icon: token.icon,
      };
    } else if (isNonConforming) {
      return null;
    } else if (diffDays <= 30) {
      const severity = diffDays <= 7 ? 'urgent' : 'warning';
      const token = CALIBRATION_BADGE_TOKENS[severity];
      return {
        label:
          diffDays === 0
            ? t('calibration.expiresToday')
            : t('calibration.expiresInDays', { days: diffDays }),
        className: token.card,
        icon: token.icon,
      };
    }
    return null;
  }, [
    equipment.status,
    equipment.calibrationRequired,
    equipment.calibrationMethod,
    equipment.nextCalibrationDate,
    t,
  ]);

  return (
    <div className={EQUIPMENT_DETAIL_HEADER_TOKENS.container} id="equipment-sticky-header">
      {/* 브레드크럼 행 */}
      <div className={EQUIPMENT_DETAIL_HEADER_TOKENS.breadcrumbRow}>
        <span className="truncate max-w-[60%]">
          {t('title')} › {equipment.name}
        </span>
        {/* SSOT: EQUIPMENT_DETAIL_HEADER_TOKENS.backLink (getTransitionClasses 포함) */}
        <Link href="/equipment" className={EQUIPMENT_DETAIL_HEADER_TOKENS.backLink}>
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {t('detail.backToList')}
        </Link>
      </div>

      {/* 메인 행 */}
      <div className={EQUIPMENT_DETAIL_HEADER_TOKENS.mainRow}>
        {/* 왼쪽: 장비명 + 배지 + 메타 */}
        <div className={cn(EQUIPMENT_DETAIL_HEADER_TOKENS.nameGroup, 'flex-1 min-w-0')}>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className={EQUIPMENT_DETAIL_HEADER_TOKENS.name}>{equipment.name}</h1>
            {/* 상태 배지 */}
            <Badge
              variant="outline"
              className={cn('text-xs font-semibold px-2 py-0.5 border', statusConfig.bg)}
              role="status"
              aria-label={t('header.statusAriaLabel', { status: statusConfig.label })}
            >
              <statusConfig.icon className="h-3 w-3 mr-1 inline" aria-hidden="true" />
              {statusConfig.label}
            </Badge>
            {/* 교정 배지 */}
            {calibrationStatus && (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs font-semibold px-2 py-0.5 border',
                  calibrationStatus.className
                )}
                role="status"
                aria-label={t('header.calibrationStatusAriaLabel', {
                  status: calibrationStatus.label,
                })}
              >
                <calibrationStatus.icon className="h-3 w-3 mr-1 inline" aria-hidden="true" />
                {calibrationStatus.label}
              </Badge>
            )}
            {/* 공용장비 배지 */}
            {equipment.isShared && (
              <SharedEquipmentBadge sharedSource={equipment.sharedSource} size="sm" />
            )}
          </div>
          <div className={EQUIPMENT_DETAIL_HEADER_TOKENS.meta}>
            <span>
              {t('header.model')}{' '}
              <span className="font-medium text-foreground">{equipment.modelName}</span>
            </span>
            <span className="text-border">·</span>
            <span>
              {t('header.managementNumber')}{' '}
              <span className="font-mono font-medium text-foreground">
                {equipment.managementNumber}
              </span>
            </span>
            {equipment.serialNumber && (
              <>
                <span className="text-border">·</span>
                <span>
                  S/N{' '}
                  <span className="font-mono font-medium text-foreground">
                    {equipment.serialNumber}
                  </span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* 오른쪽: 액션 버튼 */}
        <div className={EQUIPMENT_DETAIL_HEADER_TOKENS.actions}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              import('@/lib/api/reports-api').then(({ downloadHistoryCard }) =>
                downloadHistoryCard(equipmentId)
              );
            }}
            aria-label={t('header.historyCardExportAriaLabel')}
          >
            <Download className="h-4 w-4 mr-1.5" aria-hidden="true" />
            {t('header.exportHistoryCard')}
          </Button>
          {canCheckout && (
            <Link href={`${FRONTEND_ROUTES.CHECKOUTS.CREATE}?equipmentId=${equipmentId}`}>
              <Button size="sm" aria-label={t('header.checkoutAriaLabel')}>
                <FileOutput className="h-4 w-4 mr-1.5" aria-hidden="true" />
                {t('header.checkoutRequest')}
              </Button>
            </Link>
          )}
          {canEdit && (
            <Link href={`/equipment/${equipmentId}/edit`}>
              <Button variant="outline" size="sm" aria-label={t('header.editAriaLabel')}>
                <Edit className="h-4 w-4 mr-1.5" aria-hidden="true" />
                {t('header.edit')}
              </Button>
            </Link>
          )}
          {disposalPermissions.showDisposalButton && (
            <DisposalButton
              equipment={equipment}
              disposalRequest={disposalRequest || null}
              onRequestOpen={onDisposalRequestOpen}
              onReviewOpen={onDisposalReviewOpen}
              onApproveOpen={onDisposalApprovalOpen}
              onCancelOpen={onDisposalCancelOpen}
              onDetailOpen={onDisposalDetailOpen}
              permissions={disposalPermissions}
            />
          )}
          {canDelete && (
            <Button
              variant="outline"
              size="sm"
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              aria-label={t('header.deleteAriaLabel')}
            >
              <Trash2 className="h-4 w-4 mr-1.5" aria-hidden="true" />
              {t('header.delete')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
