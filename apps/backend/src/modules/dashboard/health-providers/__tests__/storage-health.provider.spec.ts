import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageHealthProviderImpl } from '../storage-health.provider';
import { MonitoringService } from '../../../monitoring/monitoring.service';

describe('StorageHealthProviderImpl', () => {
  let provider: StorageHealthProviderImpl;
  let mockConfig: { get: jest.Mock };
  let mockMonitoring: { getSystemMetrics: jest.Mock };
  let mockDb: { execute: jest.Mock };

  const buildMonitoringSnapshot = (storage: {
    diskUsage: number;
    diskFree: number;
    diskTotal: number;
  }) => ({
    cpu: { usage: 0, loadAvg: [0, 0, 0] },
    memory: { total: 0, free: 0, used: 0, percentage: 0 },
    uptime: 0,
    network: { requestsPerMinute: 0, errorRate: 0, avgResponseTime: 0, isSimulated: false },
    storage: { ...storage, isSimulated: storage.diskTotal === 0 },
    hostname: 'test',
    platform: 'linux',
    arch: 'x64',
    release: '0',
    nodeVersion: 'v20',
    nodeEnv: 'test',
  });

  beforeEach(async () => {
    mockConfig = { get: jest.fn(() => undefined) };
    mockMonitoring = { getSystemMetrics: jest.fn() };
    mockDb = {
      execute: jest.fn().mockResolvedValue({ rows: [{ size: '5000' }] }),
    };

    const module = await Test.createTestingModule({
      providers: [
        StorageHealthProviderImpl,
        { provide: ConfigService, useValue: mockConfig },
        { provide: MonitoringService, useValue: mockMonitoring },
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
      ],
    }).compile();

    provider = module.get(StorageHealthProviderImpl);
  });

  it('env capacity 명시 시 configured-capacity 모드 + storagePct = pg_database_size / capacity', async () => {
    mockConfig.get.mockImplementation((key: string) =>
      key === 'DASHBOARD_STORAGE_CAPACITY_BYTES' ? 1000 : undefined
    );
    mockDb.execute.mockResolvedValueOnce({ rows: [{ size: '250' }] });

    const snapshot = await provider.read();

    expect(snapshot.backend).toBe('configured-capacity');
    expect(snapshot.dbSizeBytes).toBe(250);
    expect(snapshot.storagePct).toBe(25);
    expect(snapshot.diskUsedBytes).toBeNull();
    expect(snapshot.diskTotalBytes).toBeNull();
  });

  it('env capacity 초과 시 100 cap', async () => {
    mockConfig.get.mockImplementation((key: string) =>
      key === 'DASHBOARD_STORAGE_CAPACITY_BYTES' ? 100 : undefined
    );
    mockDb.execute.mockResolvedValueOnce({ rows: [{ size: '500' }] });

    const snapshot = await provider.read();
    expect(snapshot.storagePct).toBe(100);
  });

  it('env 미설정 + monitoring diskTotal > 0 → host-disk 모드 + storagePct = used/total', async () => {
    mockMonitoring.getSystemMetrics.mockReturnValue(
      buildMonitoringSnapshot({ diskUsage: 200, diskFree: 800, diskTotal: 1000 })
    );
    mockDb.execute.mockResolvedValueOnce({ rows: [{ size: '99' }] });

    const snapshot = await provider.read();

    expect(snapshot.backend).toBe('host-disk');
    expect(snapshot.dbSizeBytes).toBe(99);
    expect(snapshot.storagePct).toBe(20);
    expect(snapshot.diskUsedBytes).toBe(200);
    expect(snapshot.diskTotalBytes).toBe(1000);
  });

  it('env 미설정 + monitoring diskTotal = 0 (df 실패) → pg-database fallback + storagePct null', async () => {
    mockMonitoring.getSystemMetrics.mockReturnValue(
      buildMonitoringSnapshot({ diskUsage: 0, diskFree: 0, diskTotal: 0 })
    );
    mockDb.execute.mockResolvedValueOnce({ rows: [{ size: '42' }] });

    const snapshot = await provider.read();

    expect(snapshot.backend).toBe('pg-database');
    expect(snapshot.dbSizeBytes).toBe(42);
    expect(snapshot.storagePct).toBeNull();
    expect(snapshot.diskUsedBytes).toBeNull();
    expect(snapshot.diskTotalBytes).toBeNull();
  });

  it('pg_database_size 쿼리 실패 시 dbSizeBytes=0 + 우선순위 분기는 정상 진행', async () => {
    mockConfig.get.mockImplementation((key: string) =>
      key === 'DASHBOARD_STORAGE_CAPACITY_BYTES' ? 1000 : undefined
    );
    mockDb.execute.mockRejectedValueOnce(new Error('DB connection lost'));

    const snapshot = await provider.read();

    expect(snapshot.dbSizeBytes).toBe(0);
    expect(snapshot.backend).toBe('configured-capacity');
    expect(snapshot.storagePct).toBe(0);
  });

  it('monitoring.getSystemMetrics throw 시 pg-database fallback', async () => {
    mockMonitoring.getSystemMetrics.mockImplementation(() => {
      throw new Error('monitoring offline');
    });
    mockDb.execute.mockResolvedValueOnce({ rows: [{ size: '50' }] });

    const snapshot = await provider.read();

    expect(snapshot.backend).toBe('pg-database');
    expect(snapshot.storagePct).toBeNull();
  });

  it('env capacity 가 0 또는 음수 → host-disk fallback (positive 가드)', async () => {
    mockConfig.get.mockImplementation((key: string) =>
      key === 'DASHBOARD_STORAGE_CAPACITY_BYTES' ? 0 : undefined
    );
    mockMonitoring.getSystemMetrics.mockReturnValue(
      buildMonitoringSnapshot({ diskUsage: 100, diskFree: 900, diskTotal: 1000 })
    );
    mockDb.execute.mockResolvedValueOnce({ rows: [{ size: '50' }] });

    const snapshot = await provider.read();

    expect(snapshot.backend).toBe('host-disk');
    expect(snapshot.storagePct).toBe(10);
  });
});
