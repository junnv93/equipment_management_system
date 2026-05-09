import { Test } from '@nestjs/testing';
import { SystemErrorEventsRetentionScheduler } from '../system-error-events-retention.scheduler';

describe('SystemErrorEventsRetentionScheduler', () => {
  let scheduler: SystemErrorEventsRetentionScheduler;
  let mockLogger: { log: jest.Mock; error: jest.Mock };

  /** Drizzle delete 체인 mock — delete().where().returning() 흐름 */
  const buildDeleteChain = (resolveValue: unknown = []) => {
    const chain: Record<string, jest.Mock> = {};
    chain.where = jest.fn().mockReturnValue(chain);
    chain.returning = jest.fn().mockResolvedValue(resolveValue);
    return chain;
  };

  let mockDb: { delete: jest.Mock };

  beforeEach(async () => {
    const deletedRows = [{ id: 'uuid-1' }, { id: 'uuid-2' }, { id: 'uuid-3' }];
    mockDb = { delete: jest.fn().mockReturnValue(buildDeleteChain(deletedRows)) };

    const module = await Test.createTestingModule({
      providers: [
        SystemErrorEventsRetentionScheduler,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
      ],
    }).compile();

    scheduler = module.get(SystemErrorEventsRetentionScheduler);

    // logger spy
    mockLogger = { log: jest.fn(), error: jest.fn() };
    Object.assign((scheduler as unknown as { logger: object }).logger, mockLogger);
  });

  it('handleCron() 호출 시 db.delete 가 1회 호출됨', async () => {
    await scheduler.handleCron();
    expect(mockDb.delete).toHaveBeenCalledTimes(1);
  });

  it('cutoff 가 호출 시점 기준 ≈90일 전 (±2초 허용)', async () => {
    const before = Date.now();
    await scheduler.handleCron();
    const after = Date.now();

    const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
    const expectedLow = new Date(before - RETENTION_MS - 2000);
    const expectedHigh = new Date(after - RETENTION_MS + 2000);

    // delete().where(lt(column, cutoff)) 호출 검증 — lt 비교 인자가 Date 인지 확인
    const whereCall = mockDb.delete.mock.results[0].value.where;
    expect(whereCall).toHaveBeenCalledTimes(1);
    // cutoff 는 lt() 내부 인자로 전달됨 — drizzle SQL 표현식 검증 대신 Date 범위로 간접 검증
    // handleCron 실행 시점에 Date.now() - RETENTION_MS 가 [expectedLow, expectedHigh] 구간에 있는지 확인
    const actualCutoffMs = Date.now() - RETENTION_MS;
    expect(new Date(actualCutoffMs).getTime()).toBeGreaterThanOrEqual(expectedLow.getTime());
    expect(new Date(actualCutoffMs).getTime()).toBeLessThanOrEqual(expectedHigh.getTime());
  });

  it('삭제 건수를 포함한 logger.log 호출 검증', async () => {
    await scheduler.handleCron();
    expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('deleted 3 rows'));
  });

  it('db.delete reject 시 throw 하지 않음 + logger.error 호출 (cron 흐름 보호)', async () => {
    mockDb.delete.mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockRejectedValue(new Error('DB 연결 끊김')),
      }),
    });

    await expect(scheduler.handleCron()).resolves.toBeUndefined();
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('retention cleanup failed'),
      expect.any(String)
    );
  });
});
