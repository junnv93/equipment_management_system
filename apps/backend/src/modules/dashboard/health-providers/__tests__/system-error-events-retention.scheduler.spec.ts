import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SystemErrorEventsRetentionScheduler } from '../system-error-events-retention.scheduler';

describe('SystemErrorEventsRetentionScheduler', () => {
  let scheduler: SystemErrorEventsRetentionScheduler;
  let mockLogger: { log: jest.Mock; error: jest.Mock };
  let mockConfig: { get: jest.Mock };

  /** db.execute() mock — rowCount 반환 */
  const buildExecuteMock = (rowCount = 3) => ({
    execute: jest.fn().mockResolvedValue({ rowCount }),
  });

  let mockDb: { execute: jest.Mock };

  const buildModule = async (envOverrides: Record<string, string | undefined> = {}) => {
    const defaultEnv: Record<string, string | undefined> = {
      SYSTEM_ERROR_EVENTS_RETENTION_DAYS: undefined,
      ...envOverrides,
    };
    mockConfig = { get: jest.fn((key: string) => defaultEnv[key]) };
    mockDb = buildExecuteMock();

    const module = await Test.createTestingModule({
      providers: [
        SystemErrorEventsRetentionScheduler,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    scheduler = module.get(SystemErrorEventsRetentionScheduler);

    mockLogger = { log: jest.fn(), error: jest.fn() };
    Object.assign((scheduler as unknown as { logger: object }).logger, mockLogger);
  };

  beforeEach(async () => {
    await buildModule();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('handleCron() 호출 시 db.execute 가 1회 호출됨', async () => {
    await scheduler.handleCron();
    expect(mockDb.execute).toHaveBeenCalledTimes(1);
  });

  it('실행된 SQL이 DELETE FROM system_error_events 포함', async () => {
    await scheduler.handleCron();
    const [sqlArg] = mockDb.execute.mock.calls[0] as [{ queryChunks?: unknown[] }];
    const sqlStr = JSON.stringify(sqlArg);
    expect(sqlStr).toMatch(/system_error_events/);
  });

  it('rowCount 기반 count 로 logger.log 호출 — .returning() 없음', async () => {
    await scheduler.handleCron();
    expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('deleted 3 rows'));
  });

  it('SYSTEM_ERROR_EVENTS_RETENTION_DAYS 미설정 → 기본 90일 사용', async () => {
    await scheduler.handleCron();
    expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('90 days'));
  });

  it('SYSTEM_ERROR_EVENTS_RETENTION_DAYS=30 설정 → 30일 사용', async () => {
    await buildModule({ SYSTEM_ERROR_EVENTS_RETENTION_DAYS: '30' });
    await scheduler.handleCron();
    expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('30 days'));
  });

  it('SYSTEM_ERROR_EVENTS_RETENTION_DAYS 비정상값(NaN) → 기본 90일 fallback', async () => {
    await buildModule({ SYSTEM_ERROR_EVENTS_RETENTION_DAYS: 'invalid' });
    await scheduler.handleCron();
    expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('90 days'));
  });

  it('db.execute reject 시 throw 하지 않음 + logger.error 호출 (cron 흐름 보호)', async () => {
    mockDb.execute.mockRejectedValueOnce(new Error('DB 연결 끊김'));

    await expect(scheduler.handleCron()).resolves.toBeUndefined();
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('retention cleanup failed'),
      expect.any(String)
    );
  });
});
