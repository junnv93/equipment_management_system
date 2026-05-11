'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronRight, Eye, QrCode, PackageOpen, PackageCheck, AlertTriangle } from 'lucide-react';
import {
  FRONTEND_ROUTES,
  QR_ACTION_I18N_KEYS,
  QR_ACTION_PRIORITY,
  QR_ACTION_GROUP,
  QR_ACTION_GROUP_ORDER,
  type QRAllowedAction,
  type QRActionGroup,
} from '@equipment-management/shared-constants';
import type { HandoverItem } from '@equipment-management/schemas';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { EquipmentQRCode } from '@/components/equipment/EquipmentQRCode';
import { MobileBottomSheet } from './MobileBottomSheet';
import { HandoverPickerSheet } from './HandoverPickerSheet';
import { CSS_VAR_NAMES, cssVar } from '@/lib/design-tokens/css-variables';

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
  /**
   * confirm_handover_* 액션의 대상 checkout 카드 목록. 길이에 따라:
   * - 0/undefined → handover 액션 없음 (서버가 이미 제외)
   * - 1 → 클릭 시 즉시 라우팅
   * - ≥ 2 → `HandoverPickerSheet` 카드 선택
   */
  handovers?: HandoverItem[];
  /**
   * @deprecated qr-visual-redesign 2026-05-11. `handovers[0].id` 와 동일.
   * 새 호출자는 `handovers` 만 사용. 단일 라우팅 시 fallback 으로만 참조.
   */
  handoverCheckoutId?: string;
}

/** 액션 → 아이콘 매핑 (하드코딩 금지 — 이 한 곳에만 정의). */
const ACTION_ICONS: Record<QRAllowedAction, React.ComponentType<{ className?: string }>> = {
  view_detail: Eye,
  view_qr: QrCode,
  request_checkout: PackageOpen,
  mark_checkout_returned: PackageCheck,
  report_nc: AlertTriangle,
  confirm_handover_receive: PackageOpen,
  confirm_handover_return: PackageCheck,
};

function assertNever(x: never): never {
  throw new Error(`Unhandled QRAllowedAction: ${String(x)}`);
}

/**
 * 모바일 액션 시트 — QR 스캔 후 사용자가 장비에 수행 가능한 액션 CTA.
 *
 * 규칙:
 * - CTA 표시 여부는 props.allowedActions 배열 기반 (서버 SSOT)
 * - 클라이언트에서 `useAuth().can()` 추가 판정 금지 (중복 로직 제거)
 * - 라우트는 `FRONTEND_ROUTES` SSOT 경유 — 리터럴 URL 금지
 * - 라벨/설명은 `qr.mobileActionSheet.actions.{i18nKey}` 경유
 * - 그룹 분기는 `QR_ACTION_GROUP` SSOT — urgent/primary/secondary 3 그룹
 *   urgent 그룹 첫 항목만 채움 버튼(brand-urgent), 나머지는 outline.
 * - 다중 handover 시 picker 자동 노출.
 */
export function EquipmentActionSheet({
  equipmentId,
  equipmentName,
  managementNumber,
  teamName,
  allowedActions,
  handovers,
  handoverCheckoutId,
}: EquipmentActionSheetProps) {
  const t = useTranslations('qr.mobileActionSheet');
  const tQr = useTranslations('qr.qrDisplay');
  const router = useRouter();
  const [qrOpen, setQrOpen] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  /** 그룹별 정렬 ({urgent: [...], primary: [...], secondary: [...]}) */
  const grouped = React.useMemo(() => {
    const groups: Record<QRActionGroup, QRAllowedAction[]> = {
      urgent: [],
      primary: [],
      secondary: [],
    };
    for (const action of allowedActions) {
      groups[QR_ACTION_GROUP[action]].push(action);
    }
    for (const key of Object.keys(groups) as QRActionGroup[]) {
      groups[key].sort((a, b) => (QR_ACTION_PRIORITY[b] ?? 0) - (QR_ACTION_PRIORITY[a] ?? 0));
    }
    return groups;
  }, [allowedActions]);

  const handleHandoverAction = React.useCallback(
    (action: 'confirm_handover_receive' | 'confirm_handover_return') => {
      const list = handovers ?? [];
      if (list.length === 0 && handoverCheckoutId) {
        const step = action === 'confirm_handover_receive' ? 'borrower_receive' : 'lender_return';
        router.push(FRONTEND_ROUTES.CHECKOUTS.CHECK_WITH_STEP(handoverCheckoutId, step));
        return;
      }
      if (list.length === 1) {
        const item = list[0];
        const step = item.type === 'receive' ? 'borrower_receive' : 'lender_return';
        router.push(FRONTEND_ROUTES.CHECKOUTS.CHECK_WITH_STEP(item.id, step));
        return;
      }
      setPickerOpen(true);
    },
    [handovers, handoverCheckoutId, router]
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
          router.push(FRONTEND_ROUTES.CHECKOUTS.CREATE_FOR_EQUIPMENT(equipmentId));
          return;
        case 'mark_checkout_returned':
          router.push(FRONTEND_ROUTES.CHECKOUTS.LIST_MINE_ACTIVE(equipmentId));
          return;
        case 'report_nc':
          router.push(FRONTEND_ROUTES.EQUIPMENT.NON_CONFORMANCES_CREATE(equipmentId));
          return;
        case 'confirm_handover_receive':
        case 'confirm_handover_return':
          handleHandoverAction(action);
          return;
        default:
          assertNever(action);
      }
    },
    [equipmentId, handleHandoverAction, router]
  );

  const hasAnyAction = QR_ACTION_GROUP_ORDER.some((g) => grouped[g].length > 0);
  if (!hasAnyAction) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
        <p className="text-sm font-medium text-foreground md:text-base">{t('noActions')}</p>
        <p className="mt-1 text-xs text-foreground/70">{t('noActionsDescription')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {QR_ACTION_GROUP_ORDER.map((groupKey) => {
          const actionsInGroup = grouped[groupKey];
          if (actionsInGroup.length === 0) return null;
          return (
            <section key={groupKey} className="flex flex-col gap-2">
              <h2
                aria-label={t(`groups.${groupKey}`)}
                className={cn(
                  'px-1 text-xs font-semibold uppercase tracking-wider',
                  groupKey === 'urgent' ? 'text-brand-urgent' : 'text-foreground/70'
                )}
              >
                {t(`groups.${groupKey}`)}
              </h2>
              <ul className="flex flex-col gap-2">
                {actionsInGroup.map((action, idx) => {
                  const i18nKey = QR_ACTION_I18N_KEYS[action];
                  const Icon = ACTION_ICONS[action];
                  const isUrgentFirst = groupKey === 'urgent' && idx === 0;
                  return (
                    <li key={action}>
                      <Button
                        type="button"
                        variant={isUrgentFirst ? 'default' : 'outline'}
                        onClick={() => handleActionClick(action)}
                        className={cn(
                          'flex h-auto w-full items-center justify-between gap-3 px-4 py-3 text-left',
                          isUrgentFirst
                            ? 'bg-brand-urgent text-white hover:bg-brand-urgent/90'
                            : groupKey === 'secondary'
                              ? 'text-foreground/80'
                              : 'text-foreground'
                        )}
                        style={{ minHeight: cssVar(CSS_VAR_NAMES.touchTargetMin) }}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={cn(
                              'h-5 w-5 shrink-0',
                              isUrgentFirst ? 'text-white' : 'text-foreground'
                            )}
                            aria-hidden="true"
                          />
                          <div className="flex flex-col">
                            <span
                              className={cn(
                                'text-sm font-semibold md:text-base',
                                isUrgentFirst ? 'text-white' : 'text-foreground'
                              )}
                            >
                              {t(`actions.${i18nKey}.label`)}
                            </span>
                            <span
                              className={cn(
                                'text-xs',
                                isUrgentFirst ? 'text-white/85' : 'text-foreground/70'
                              )}
                            >
                              {t(`actions.${i18nKey}.description`)}
                            </span>
                          </div>
                        </div>
                        <ChevronRight
                          className={cn(
                            'h-4 w-4 shrink-0',
                            isUrgentFirst ? 'text-white' : 'text-foreground/60'
                          )}
                          aria-hidden="true"
                        />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

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

      {handovers && handovers.length > 1 && (
        <HandoverPickerSheet open={pickerOpen} onOpenChange={setPickerOpen} handovers={handovers} />
      )}
    </>
  );
}
