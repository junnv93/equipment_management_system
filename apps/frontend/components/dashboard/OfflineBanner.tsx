/**
 * OfflineBanner — 네트워크 끊김 시 상단 알림 (대시보드 개선안 §A.17.3).
 *
 * `useOnlineStatus()` 훅으로 상태 감지. offline일 때만 렌더.
 * "오프라인 — 표시된 데이터는 마지막 동기화 시점입니다 ({mm:ss ago})"
 */

'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';

function formatElapsed(from: Date, now: Date): string {
  const diffSec = Math.max(0, Math.floor((now.getTime() - from.getTime()) / 1000));
  const mm = Math.floor(diffSec / 60);
  const ss = diffSec % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(mm)}:${pad(ss)}`;
}

export function OfflineBanner() {
  const t = useTranslations('dashboard.offline');
  const { online, lastOnlineAt } = useOnlineStatus();
  const [now, setNow] = useState<Date>(() => new Date());

  // offline 진입 시 1초마다 elapsed 갱신.
  useEffect(() => {
    if (online || !lastOnlineAt) return;
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [online, lastOnlineAt]);

  if (online) return null;

  const elapsed = lastOnlineAt ? formatElapsed(lastOnlineAt, now) : '00:00';

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-4 flex items-center gap-2.5 rounded-lg border border-brand-warning/40 bg-brand-warning/10 px-3 py-2 text-sm text-brand-warning"
    >
      <WifiOff className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span className="font-semibold">{t('label')}</span>
      <span className="text-foreground/80">{t('description')}</span>
      <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
        {elapsed}
      </span>
    </div>
  );
}
