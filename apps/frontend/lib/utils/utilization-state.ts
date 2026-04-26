import { UTILIZATION_THRESHOLDS } from '@/lib/config/dashboard-config';

export type UtilizationState = 'good' | 'warning' | 'danger';

/**
 * 가동률 상태 계산 — ±2%p hysteresis 적용
 *
 * 경계값 진동 방지: 이전 상태에 따라 진입 임계값과 이탈 임계값을 다르게 설정.
 * prev 미전달 시 순수 임계값 비교(초기 상태 결정).
 */
export function computeUtilizationState(pct: number, prev?: UtilizationState): UtilizationState {
  const { HIGH, MEDIUM, HYSTERESIS } = UTILIZATION_THRESHOLDS;

  if (prev === 'good') {
    if (pct >= HIGH - HYSTERESIS) return 'good';
    if (pct >= MEDIUM) return 'warning';
    return 'danger';
  }

  if (prev === 'warning') {
    if (pct >= HIGH + HYSTERESIS) return 'good';
    if (pct >= MEDIUM - HYSTERESIS) return 'warning';
    return 'danger';
  }

  if (prev === 'danger') {
    if (pct >= HIGH) return 'good';
    if (pct >= MEDIUM + HYSTERESIS) return 'warning';
    return 'danger';
  }

  // 초기 상태 (prev 미전달)
  if (pct >= HIGH) return 'good';
  if (pct >= MEDIUM) return 'warning';
  return 'danger';
}
