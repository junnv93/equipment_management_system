import { MetricsService } from '../metrics.service';
import type { SystemErrorEventDropReason } from '../../system-health/contract';

/**
 * Exhaustive guard: Record<SystemErrorEventDropReason, number>
 * 새 reason 추가 시 이 타입이 컴파일타임 에러를 발생시켜 spec 강제 업데이트.
 */
const ALL_REASONS = {
  'rate-limit': 0,
  dedupe: 0,
  'errorcode-truncate': 0,
  'rate-limit-fallback': 0,
} satisfies Record<SystemErrorEventDropReason, number>;

describe('MetricsService — system_error_events_drops_total counter', () => {
  let service: MetricsService;

  beforeEach(() => {
    service = new MetricsService();
  });

  it.each(Object.keys(ALL_REASONS) as SystemErrorEventDropReason[])(
    'reason=%s → system_error_events_drops_total{reason="%s"} = 1 in /metrics output',
    async (reason) => {
      service.incrementSystemErrorEventDrops(reason);

      const output = await service.getMetrics();
      // Prometheus text format: metric_name{label="value"} count
      expect(output).toMatch(new RegExp(`system_error_events_drops_total{reason="${reason}"} 1`));
    }
  );

  it('각 reason이 독립적으로 증가 — cross-contamination 없음', async () => {
    service.incrementSystemErrorEventDrops('rate-limit');
    service.incrementSystemErrorEventDrops('rate-limit');
    service.incrementSystemErrorEventDrops('dedupe');

    const output = await service.getMetrics();
    expect(output).toMatch(/system_error_events_drops_total{reason="rate-limit"} 2/);
    expect(output).toMatch(/system_error_events_drops_total{reason="dedupe"} 1/);
  });

  it('getMetrics() 출력에 counter 메타데이터(HELP/TYPE) 포함', async () => {
    const output = await service.getMetrics();
    expect(output).toContain('system_error_events_drops_total');
    expect(output).toContain('# TYPE system_error_events_drops_total counter');
  });
});
