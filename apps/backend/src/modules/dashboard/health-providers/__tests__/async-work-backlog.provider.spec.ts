import { Test } from '@nestjs/testing';
import { AsyncWorkBacklogProviderImpl } from '../async-work-backlog.provider';
import { MetricsService } from '../../../../common/metrics/metrics.service';

describe('AsyncWorkBacklogProviderImpl', () => {
  let provider: AsyncWorkBacklogProviderImpl;
  let mockMetrics: {
    readPendingApprovalsTotal: jest.Mock;
    readActiveCheckoutsTotal: jest.Mock;
  };

  beforeEach(async () => {
    mockMetrics = {
      readPendingApprovalsTotal: jest.fn().mockResolvedValue(0),
      readActiveCheckoutsTotal: jest.fn().mockResolvedValue(0),
    };

    const module = await Test.createTestingModule({
      providers: [AsyncWorkBacklogProviderImpl, { provide: MetricsService, useValue: mockMetrics }],
    }).compile();

    provider = module.get(AsyncWorkBacklogProviderImpl);
  });

  it('두 gauge 합산 결과를 queueSize 로 노출 (5 + 3 = 8)', async () => {
    mockMetrics.readPendingApprovalsTotal.mockResolvedValueOnce(5);
    mockMetrics.readActiveCheckoutsTotal.mockResolvedValueOnce(3);

    const snapshot = await provider.read();

    expect(snapshot.queueSize).toBe(8);
    expect(snapshot.backend).toBe('pending-work-aggregate');
  });

  it('gauge read 실패 시 0 fallback + backend 식별 유지', async () => {
    mockMetrics.readPendingApprovalsTotal.mockRejectedValueOnce(new Error('registry empty'));

    const snapshot = await provider.read();

    expect(snapshot.queueSize).toBe(0);
    expect(snapshot.backend).toBe('pending-work-aggregate');
  });

  it('두 gauge 모두 0 → queueSize 0 (정상 케이스)', async () => {
    const snapshot = await provider.read();
    expect(snapshot.queueSize).toBe(0);
  });
});
