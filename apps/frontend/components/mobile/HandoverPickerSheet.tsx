/**
 * HandoverPickerSheet — 다중 핸드오버 picker (qr-visual-redesign TASK 3 / 2026-05-11).
 *
 * 한 사용자가 동시에 여러 건의 수령/반환 대기 checkout 을 가질 때 카드 picker 를 노출.
 * 각 항목: lender 시험소 → borrower 시험소 흐름, 점검자, lender 점검 결과 (외관/작동/부속) 뱃지.
 *
 * 단일 항목이면 본 컴포넌트는 노출되지 않고 호출자 (`EquipmentActionSheet`) 가 즉시 라우팅한다.
 *
 * @see packages/schemas/src/qr-handover.ts (HandoverItem SSOT)
 */
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, User } from 'lucide-react';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import type { HandoverItem } from '@equipment-management/schemas';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MobileBottomSheet } from './MobileBottomSheet';
import { getSemanticBadgeClasses } from '@/lib/design-tokens/brand';
import { CSS_VAR_NAMES, cssVar } from '@/lib/design-tokens/css-variables';

export interface HandoverPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 표시할 handover 카드 목록 (≥ 2 보장 — 단일은 호출자가 자동 라우팅) */
  handovers: HandoverItem[];
}

/**
 * 외관/작동 ConditionStatus → 브랜드 톤. abnormal → urgent.
 */
function getConditionTone(status: 'normal' | 'abnormal'): 'ok' | 'urgent' {
  return status === 'abnormal' ? 'urgent' : 'ok';
}
function getAccessoriesTone(status: 'complete' | 'incomplete'): 'ok' | 'urgent' {
  return status === 'incomplete' ? 'urgent' : 'ok';
}

export function HandoverPickerSheet({ open, onOpenChange, handovers }: HandoverPickerSheetProps) {
  const t = useTranslations('qr.handoverPicker');
  const tStatus = useTranslations('qr.statusBadge');
  const router = useRouter();

  const handleSelect = React.useCallback(
    (item: HandoverItem) => {
      const step = item.type === 'receive' ? 'borrower_receive' : 'lender_return';
      onOpenChange(false);
      router.push(FRONTEND_ROUTES.CHECKOUTS.CHECK_WITH_STEP(item.id, step));
    },
    [router, onOpenChange]
  );

  return (
    <MobileBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('title')}
      description={t('description')}
      showHandle
    >
      <ul className="flex flex-col gap-3 pb-4">
        {handovers.map((item) => {
          const checkedDate = new Date(item.checkedAt);
          const dateLabel = Number.isNaN(checkedDate.getTime())
            ? item.checkedAt
            : checkedDate.toLocaleDateString();
          return (
            <li key={item.id}>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSelect(item)}
                className={cn(
                  'flex h-auto w-full flex-col items-stretch gap-3 px-4 py-3 text-left'
                )}
                style={{ minHeight: cssVar(CSS_VAR_NAMES.touchTargetMin) }}
              >
                <div className="flex items-center gap-2 text-base font-semibold text-foreground label-ko">
                  <span>{item.lenderSiteLabel || t('unknownSite')}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
                  <span>{item.borrowerSiteLabel || t('unknownSite')}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm text-foreground">
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="label-ko">{item.inspectorName || t('unknownInspector')}</span>
                  </span>
                  <span aria-hidden="true" className="text-foreground/40">
                    ·
                  </span>
                  <span className="font-mono tabular-nums">{dateLabel}</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <span
                    className={cn(
                      getSemanticBadgeClasses(getConditionTone(item.lastCheck.appearance)),
                      'text-xs'
                    )}
                  >
                    {t('appearance')}: {tStatus(`condition.${item.lastCheck.appearance}`)}
                  </span>
                  <span
                    className={cn(
                      getSemanticBadgeClasses(getConditionTone(item.lastCheck.operation)),
                      'text-xs'
                    )}
                  >
                    {t('operation')}: {tStatus(`condition.${item.lastCheck.operation}`)}
                  </span>
                  {item.lastCheck.accessories !== undefined && (
                    <span
                      className={cn(
                        getSemanticBadgeClasses(getAccessoriesTone(item.lastCheck.accessories)),
                        'text-xs'
                      )}
                    >
                      {t('accessories')}: {tStatus(`accessories.${item.lastCheck.accessories}`)}
                    </span>
                  )}
                </div>

                <div className="font-mono tabular-nums text-xs text-foreground/60">
                  {t('checkoutIdLabel', { id: item.id.slice(0, 8) })}
                </div>
              </Button>
            </li>
          );
        })}
      </ul>
    </MobileBottomSheet>
  );
}
