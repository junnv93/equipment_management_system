import { Suspense } from 'react';
import { QRScannerView } from '@/components/scan/QRScannerView';

/**
 * QR 스캐너 진입 페이지.
 *
 * Next.js 16 PPR Non-Blocking 패턴 — sync Page + Suspense async 자식.
 * 실제 로직은 Client Component `QRScannerView`에 위임(html5-qrcode 동적 import).
 */
export default function ScanPage() {
  return (
    <Suspense fallback={null}>
      <QRScannerView />
    </Suspense>
  );
}

export const metadata = {
  title: 'QR 스캔',
};
