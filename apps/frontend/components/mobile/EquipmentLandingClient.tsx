'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import {
  useEquipmentByManagementNumber,
  type EquipmentQRLanding,
} from '@/hooks/use-equipment-by-management-number';
import { EquipmentActionSheet } from './EquipmentActionSheet';
import { AutoProgressCountdown } from './AutoProgressCountdown';
import { HandoverPickerSheet } from './HandoverPickerSheet';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CalibrationDueBadge } from '@/components/calibration/CalibrationDueBadge';
import {
  FRONTEND_ROUTES,
  QR_ACTION_PRIORITY,
  QR_ACTION_I18N_KEYS,
  type QRAllowedAction,
} from '@equipment-management/shared-constants';
import { SITE_LABELS, type Site, type EquipmentStatus } from '@equipment-management/schemas';

interface EquipmentLandingClientProps {
  initialData: EquipmentQRLanding;
}

const AUTO_PROGRESS_PRIORITY_THRESHOLD = 100;

/** 자동 진행 후보 액션인지 판정 — `priority >= 100` 즉시성 액션만 통과. */
function isAutoProgressCandidate(action: QRAllowedAction, handoverCount: number): boolean {
  if ((QR_ACTION_PRIORITY[action] ?? 0) < AUTO_PROGRESS_PRIORITY_THRESHOLD) return false;
  if (
    (action === 'confirm_handover_receive' || action === 'confirm_handover_return') &&
    handoverCount > 1
  ) {
    return false;
  }
  return true;
}

/**
 * 모바일 QR 랜딩 Client 컴포넌트.
 *
 * 서버에서 hydration한 초기 데이터를 표시하고 TanStack Query 캐시에 시딩한다.
 * 상단: 장비 요약 카드 (이름/관리번호/상태 4-tier/교정 임박 D-N)
 * 하단: 액션 시트 (서버 계산 allowedActions 기반, 그룹 분기)
 * 1액션 자동 진행: 가능한 액션이 1개 + priority >= 100 + 핸드오버 ≤ 1 → 2초 카운트다운 후 라우팅
 *
 * 모든 문자열은 `qr.landing.*` 또는 `qr.statusBadge.*` i18n 네임스페이스.
 */
export function EquipmentLandingClient({ initialData }: EquipmentLandingClientProps) {
  const t = useTranslations('qr.landing');
  const tActions = useTranslations('qr.mobileActionSheet.actions');
  const router = useRouter();

  const { data = initialData } = useEquipmentByManagementNumber(
    initialData.managementNumber,
    initialData
  );

  const siteLabel = data.site ? SITE_LABELS[data.site as Site] : '-';
  const handoverCount = data.handovers?.length ?? 0;

  // 자동 진행 조건 — props 기반 1회 판정 (마운트 시).
  const autoProgressAction = React.useMemo<QRAllowedAction | null>(() => {
    if (data.allowedActions.length !== 1) return null;
    const action = data.allowedActions[0];
    return isAutoProgressCandidate(action, handoverCount) ? action : null;
  }, [data.allowedActions, handoverCount]);

  const [autoProgressCancelled, setAutoProgressCancelled] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const handleAutoComplete = React.useCallback(() => {
    if (!autoProgressAction) return;
    switch (autoProgressAction) {
      case 'confirm_handover_receive':
      case 'confirm_handover_return': {
        const item = data.handovers?.[0];
        if (item) {
          const step = item.type === 'receive' ? 'borrower_receive' : 'lender_return';
          router.push(FRONTEND_ROUTES.CHECKOUTS.CHECK_WITH_STEP(item.id, step));
        }
        return;
      }
      case 'mark_checkout_returned':
        router.push(FRONTEND_ROUTES.CHECKOUTS.LIST_MINE_ACTIVE(String(data.id)));
        return;
      case 'request_checkout':
        router.push(FRONTEND_ROUTES.CHECKOUTS.CREATE_FOR_EQUIPMENT(String(data.id)));
        return;
      default:
        return;
    }
  }, [autoProgressAction, data.handovers, data.id, router]);

  const showAutoProgress = autoProgressAction !== null && !autoProgressCancelled;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-6 safe-area-bottom">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h1 className="text-lg font-semibold text-foreground md:text-xl label-ko">
                {data.name}
              </h1>
              <p className="text-mono text-foreground/70">{data.managementNumber}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <StatusBadge status={data.status as EquipmentStatus} size="base" />
              <CalibrationDueBadge nextCalibrationDate={data.nextCalibrationDate ?? null} />
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="flex flex-col">
              <dt className="text-xs text-foreground/70">{t('siteLabel')}</dt>
              <dd className="font-medium text-foreground">{siteLabel}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-xs text-foreground/70">{t('teamLabel')}</dt>
              <dd className="font-medium text-foreground label-ko">{data.teamName ?? '-'}</dd>
            </div>
            <div className="col-span-2 flex flex-col">
              <dt className="text-xs text-foreground/70">{t('nextCalibrationLabel')}</dt>
              <dd className="font-mono tabular-nums font-medium text-foreground">
                {data.nextCalibrationDate
                  ? new Date(data.nextCalibrationDate).toISOString().slice(0, 10)
                  : '-'}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {showAutoProgress && autoProgressAction ? (
        <AutoProgressCountdown
          actionLabel={tActions(`${QR_ACTION_I18N_KEYS[autoProgressAction]}.label`)}
          onComplete={() => {
            if (
              (autoProgressAction === 'confirm_handover_receive' ||
                autoProgressAction === 'confirm_handover_return') &&
              handoverCount > 1
            ) {
              setPickerOpen(true);
              return;
            }
            handleAutoComplete();
          }}
          onCancel={() => setAutoProgressCancelled(true)}
        />
      ) : (
        <EquipmentActionSheet
          equipmentId={String(data.id)}
          equipmentName={data.name}
          managementNumber={data.managementNumber}
          teamName={data.teamName}
          allowedActions={data.allowedActions}
          handovers={data.handovers}
        />
      )}

      {data.handovers && data.handovers.length > 1 && (
        <HandoverPickerSheet
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          handovers={data.handovers}
        />
      )}
    </div>
  );
}
