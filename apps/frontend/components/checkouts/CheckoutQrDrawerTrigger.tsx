'use client';

import { useState } from 'react';
import { QrCode } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { EquipmentQRCode } from '@/components/equipment/EquipmentQRCode';
import { useMediaQuery } from '@/hooks/use-media-query';
import { CHECKOUT_QR_DRAWER_TOKENS } from '@/lib/design-tokens/components/checkout-qr-drawer';

interface CheckoutQrDrawerTriggerProps {
  equipment: { id: string; name: string; managementNumber: string }[];
  /** controlled 모드 — 부모가 open state를 관리할 때 사용 (단축키 연동) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CheckoutQrDrawerTrigger({
  equipment,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CheckoutQrDrawerTriggerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;
  const t = useTranslations('checkouts.qrDrawer');
  const isMobile = useMediaQuery('(max-width: 639px)');

  return (
    <>
      <Button
        variant="outline"
        size="default"
        onClick={() => setOpen(true)}
        aria-label={t('aria.open')}
        type="button"
      >
        <QrCode className="mr-2 h-4 w-4" />
        {t('trigger')}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side={isMobile ? 'bottom' : 'right'} className="sm:w-96 sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>{t('title')}</SheetTitle>
            <SheetDescription>{t('description')}</SheetDescription>
          </SheetHeader>
          <div
            className={`mt-4 flex flex-col ${CHECKOUT_QR_DRAWER_TOKENS.content.itemGap} ${CHECKOUT_QR_DRAWER_TOKENS.content.bodyPadding}`}
          >
            {equipment.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
            ) : (
              equipment.map((equip, index) => (
                <div key={equip.id} className={CHECKOUT_QR_DRAWER_TOKENS.item.wrapper}>
                  {index > 0 && <div className={CHECKOUT_QR_DRAWER_TOKENS.item.divider} />}
                  <EquipmentQRCode
                    managementNumber={equip.managementNumber}
                    displayName={equip.name}
                    hidePrintButton
                    sizePx={160}
                  />
                  <p className={CHECKOUT_QR_DRAWER_TOKENS.item.name}>{equip.name}</p>
                  <p className={CHECKOUT_QR_DRAWER_TOKENS.item.number}>{equip.managementNumber}</p>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
