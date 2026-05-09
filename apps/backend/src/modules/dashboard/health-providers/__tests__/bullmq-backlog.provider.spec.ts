import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BullmqBacklogProviderImpl } from '../bullmq-backlog.provider';

// BullMQ Queue 정적 mock — 실제 Redis/네트워크 I/O 0
const mockGetJobCounts = jest.fn();
const mockClose = jest.fn().mockResolvedValue(undefined);

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    getJobCounts: mockGetJobCounts,
    close: mockClose,
  })),
}));

describe('BullmqBacklogProviderImpl', () => {
  let provider: BullmqBacklogProviderImpl;
  let mockConfig: { get: jest.Mock };

  const buildModule = async (envOverrides: Record<string, unknown> = {}) => {
    const defaultEnv: Record<string, unknown> = {
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379,
      REDIS_PASSWORD: undefined,
      ASYNC_WORK_QUEUE_NAMES: 'email,reports',
      ...envOverrides,
    };
    mockConfig = { get: jest.fn((key: string) => defaultEnv[key]) };

    const module = await Test.createTestingModule({
      providers: [BullmqBacklogProviderImpl, { provide: ConfigService, useValue: mockConfig }],
    }).compile();

    provider = module.get(BullmqBacklogProviderImpl);
    provider.onModuleInit();
    return module;
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('다중 큐 getJobCounts waiting+active+delayed 합산 (2+1+0 + 0+3+1 = 7)', async () => {
    mockGetJobCounts
      .mockResolvedValueOnce({ waiting: 2, active: 1, delayed: 0, completed: 10, failed: 1 })
      .mockResolvedValueOnce({ waiting: 0, active: 3, delayed: 1, completed: 5, failed: 0 });

    await buildModule({ ASYNC_WORK_QUEUE_NAMES: 'q1,q2' });
    const snapshot = await provider.read();

    expect(snapshot.queueSize).toBe(7);
    expect(snapshot.backend).toBe('bullmq');
  });

  it('ASYNC_WORK_QUEUE_NAMES 미설정 → queueSize: 0 + backend: bullmq graceful', async () => {
    await buildModule({ ASYNC_WORK_QUEUE_NAMES: undefined });
    const snapshot = await provider.read();

    expect(snapshot.queueSize).toBe(0);
    expect(snapshot.backend).toBe('bullmq');
    expect(mockGetJobCounts).not.toHaveBeenCalled();
  });

  it('getJobCounts reject (Redis 연결 실패) → queueSize: 0 + backend: bullmq + throw 없음', async () => {
    mockGetJobCounts.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    await buildModule({ ASYNC_WORK_QUEUE_NAMES: 'email' });

    const mockLogger = { warn: jest.fn(), log: jest.fn(), error: jest.fn() };
    Object.assign((provider as unknown as { logger: object }).logger, mockLogger);

    const snapshot = await provider.read();

    expect(snapshot.queueSize).toBe(0);
    expect(snapshot.backend).toBe('bullmq');
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('BullMQ backlog read 실패')
    );
  });

  it('onModuleDestroy 시 모든 큐 close 호출', async () => {
    await buildModule({ ASYNC_WORK_QUEUE_NAMES: 'q1,q2' });
    await provider.onModuleDestroy();

    expect(mockClose).toHaveBeenCalledTimes(2);
  });
});
