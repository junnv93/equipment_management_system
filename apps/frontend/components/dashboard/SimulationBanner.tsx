/**
 * SimulationBanner — SYSTEM_ADMIN의 역할 시뮬레이션 모드 알림 (대시보드 개선안 §A.19.3).
 *
 * `?simulateRole=test_engineer` 같은 쿼리로 시뮬 활성 시 상단 yellow strip 노출.
 * "종료" 버튼 클릭 시 URL에서 simulateRole 쿼리 제거.
 */

'use client';

import { useTranslations } from 'next-intl';
import { Eye } from 'lucide-react';
import { useEffectiveRole } from '@/hooks/use-effective-role';

export function SimulationBanner() {
  const t = useTranslations('dashboard.simulation');
  const tRoles = useTranslations('navigation.roles');
  const { simulating, effectiveRole, exitSimulation } = useEffectiveRole();

  if (!simulating || !effectiveRole) return null;

  // 안전한 i18n 키 매핑 — UserRole은 enum으로 제한됨.
  const roleLabel = tRoles(effectiveRole as Parameters<typeof tRoles>[0]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-4 flex items-center gap-2.5 rounded-lg border border-brand-warning/40 bg-brand-warning/10 px-3 py-2 text-sm"
    >
      <Eye className="h-4 w-4 flex-shrink-0 text-brand-warning" aria-hidden="true" />
      <span className="font-semibold text-brand-warning">{t('label', { role: roleLabel })}</span>
      <button
        type="button"
        onClick={exitSimulation}
        className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-md bg-brand-warning/20 hover:bg-brand-warning/30 text-xs font-medium text-brand-warning motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-warning"
      >
        {t('exit')}
      </button>
    </div>
  );
}
