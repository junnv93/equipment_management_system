'use client';

import * as React from 'react';
import { QrCode } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EquipmentQRCode } from './EquipmentQRCode';

interface EquipmentQRButtonProps {
  managementNumber: string;
  displayName?: string;
  subLabel?: string;
  /** 버튼 크기 변형. 기본 `sm` — sticky 헤더/툴바에 적합. */
  size?: 'sm' | 'default';
  /** 버튼 라벨 숨김(아이콘만) — 모바일 툴바 절약 시. */
  iconOnly?: boolean;
}

/**
 * "QR 보기/인쇄" 버튼 + 다이얼로그.
 *
 * 기존 장비 상세에 붙이는 단일 진입점. Radix Dialog 재사용으로 focus trap/alt +
 * aria 연결 자동 처리. 실제 QR 렌더는 `EquipmentQRCode`에 위임.
 *
 * i18n 네임스페이스: `qr.qrDisplay.*`.
 */
export function EquipmentQRButton({
  managementNumber,
  displayName,
  subLabel,
  size = 'sm',
  iconOnly = false,
}: EquipmentQRButtonProps) {
  const t = useTranslations('qr.qrDisplay');
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={size}
          aria-label={t('buttonAriaLabel')}
          className="print:hidden"
        >
          <QrCode className={iconOnly ? 'h-4 w-4' : 'mr-1.5 h-4 w-4'} aria-hidden="true" />
          {!iconOnly && t('buttonLabel')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-2">
          <EquipmentQRCode
            managementNumber={managementNumber}
            displayName={displayName}
            subLabel={subLabel}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
