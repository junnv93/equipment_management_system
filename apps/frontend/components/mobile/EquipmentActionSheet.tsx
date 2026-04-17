'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronRight, Eye, QrCode, PackageOpen, PackageCheck, AlertTriangle } from 'lucide-react';
import {
  FRONTEND_ROUTES,
  CHECKOUT_QUERY_PARAMS,
  QR_ACTION_I18N_KEYS,
  QR_ACTION_PRIORITY,
  type QRAllowedAction,
} from '@equipment-management/shared-constants';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { EquipmentQRCode } from '@/components/equipment/EquipmentQRCode';
import { MobileBottomSheet } from './MobileBottomSheet';

interface EquipmentActionSheetProps {
  equipmentId: string;
  equipmentName: string;
  managementNumber: string;
  teamName?: string | null;
  /**
   * 서버가 계산한 허용 액션 목록. 클라이언트는 이 배열만 소비하고
   * 권한/관계 판정을 중복하지 않는다 (SSOT: QRAccessService).
   */
  allowedActions: QRAllowedAction[];
}

/** 액션 → 아이콘 매핑 (하드코딩 금지 — 이 한 곳에만 정의). */
const ACTION_ICONS: Record<QRAllowedAction, React.ComponentType<{ className?: string }>> = {
  view_detail: Eye,
  view_qr: QrCode,
  request_checkout: PackageOpen,
  mark_checkout_returned: PackageCheck,
  report_nc: AlertTriangle,
};

/**
 * 모바일 액션 시트 — QR 스캔 후 사용자가 장비에 수행 가능한 액션 CTA.
 *
 * 규칙:
 * - CTA 표시 여부는 props.allowedActions 배열 기반 (서버 SSOT)
 * - 클라이언트에서 `useAuth().can()` 추가 판정 금지 (중복 로직 제거)
 * - 라우트는 `FRONTEND_ROUTES` SSOT 경유 — 리터럴 URL 금지
 * - 라벨/설명은 `qr.mobileActionSheet.actions.{i18nKey}` 경유
 * - 정렬은 `QR_ACTION_PRIORITY` 기준 (하드코딩된 순서 금지)
 */
export function EquipmentActionSheet({
  equipmentId,
  equipmentName,
  managementNumber,
  teamName,
  allowedActions,
}: EquipmentActionSheetProps) {
  const t = useTranslations('qr.mobileActionSheet');
  const tQr = useTranslations('qr.qrDisplay');
  const router = useRouter();
  const [qrOpen, setQrOpen] = React.useState(false);

  const sortedActions = React.useMemo(
    () =>
      [...allowedActions].sort(
        (a, b) => (QR_ACTION_PRIORITY[b] ?? 0) - (QR_ACTION_PRIORITY[a] ?? 0)
      ),
    [allowedActions]
  );

  const handleActionClick = React.useCallback(
    (action: QRAllowedAction) => {
      switch (action) {
        case 'view_detail':
          router.push(FRONTEND_ROUTES.EQUIPMENT.DETAIL(equipmentId));
          return;
        case 'view_qr':
          setQrOpen(true);
          return;
        case 'request_checkout':
          // `?equipmentId=` 프리필은 CreateCheckoutContent가 처리 (기존 동작)
          router.push(
            `${FRONTEND_ROUTES.CHECKOUTS.CREATE}?${CHECKOUT_QUERY_PARAMS.EQUIPMENT_ID}=${encodeURIComponent(equipmentId)}`
          );
          return;
        case 'mark_checkout_returned':
          // "내가 현재 반출 중인 장비" 딥링크 — 빌더가 scope/view/equipmentId 조합 캡슐화.
          router.push(FRONTEND_ROUTES.CHECKOUTS.LIST_MINE_ACTIVE(equipmentId));
          return;
        case 'report_nc':
          // 기존 NC 관리 페이지로 이동 — 빌더가 `?action=create` intent 조합.
          // 원칙: QR은 경로. 기존 서비스/UI/폼은 재정의하지 않고 재사용만.
          router.push(FRONTEND_ROUTES.EQUIPMENT.NON_CONFORMANCES_CREATE(equipmentId));
          return;
      }
    },
    [equipmentId, router]
  );

  if (sortedActions.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
        <p className="text-sm font-medium text-foreground">{t('noActions')}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t('noActionsDescription')}</p>
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {sortedActions.map((action) => {
          const i18nKey = QR_ACTION_I18N_KEYS[action];
          const Icon = ACTION_ICONS[action];
          return (
            <li key={action}>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleActionClick(action)}
                className={cn(
                  'flex h-auto w-full items-center justify-between gap-3 px-4 py-3 text-left',
                  'min-h-[var(--touch-target-min)]'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 shrink-0 text-foreground" aria-hidden="true" />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">
                      {t(`actions.${i18nKey}.label`)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t(`actions.${i18nKey}.description`)}
                    </span>
                  </div>
                </div>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              </Button>
            </li>
          );
        })}
      </ul>

      <MobileBottomSheet
        open={qrOpen}
        onOpenChange={setQrOpen}
        title={tQr('title')}
        description={tQr('description')}
      >
        <div className="flex justify-center py-4">
          <EquipmentQRCode
            managementNumber={managementNumber}
            displayName={equipmentName}
            subLabel={teamName ?? undefined}
          />
        </div>
      </MobileBottomSheet>
    </>
  );
}
