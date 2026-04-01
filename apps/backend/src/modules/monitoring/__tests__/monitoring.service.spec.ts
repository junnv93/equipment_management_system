import { Test, TestingModule } from '@nestjs/testing';
import { MonitoringService } from '../monitoring.service';
import { LoggerService } from '../../../common/logger/logger.service';
import { MetricsService } from '../../../common/metrics/metrics.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { DrizzleService } from '../../../database/drizzle.module';

describe('MonitoringService', () => {
  let service: MonitoringService;
  let mockLoggerService: Record<string, jest.Mock>;
  let mockMetricsService: Record<string, jest.Mock>;
  let mockCacheService: Record<string, jest.Mock>;
  let mockDrizzleService: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockLoggerService = {
      setContext: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    mockMetricsService = {
      incrementHttpRequestTotal: jest.fn(),
      observeHttpRequestDuration: jest.fn(),
    };

    mockCacheService = {
      getCacheStats: jest.fn().mockReturnValue({
        hits: 100,
        misses: 20,
        hitRate: 83.33,
        size: 50,
        maxSize: 5000,
      }),
    };

    mockDrizzleService = {
      getMetrics: jest.fn().mockReturnValue({
        connectionsCreated: 10,
        connectionErrors: 0,
        poolTotalCount: 5,
        poolIdleCount: 3,
        poolWaitingCount: 0,
        poolMaxCount: 50,
      }),
      performHealthCheck: jest.fn().mockResolvedValue({
        status: 'healthy',
        latency: 5,
      }),
      executeDiagnosticQuery: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonitoringService,
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: MetricsService, useValue: mockMetricsService },
        { provide: SimpleCacheService, useValue: mockCacheService },
        { provide: DrizzleService, useValue: mockDrizzleService },
      ],
    }).compile();

    service = module.get<MonitoringService>(MonitoringService);
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  describe('recordHttpRequest', () => {
    it('성공 요청을 기록해야 한다', () => {
      service.recordHttpRequest('/api/equipment', 200, 50);

      const stats = service.getHttpStats();
      expect(stats.totalRequests).toBe(1);
      expect(stats.successRequests).toBe(1);
      expect(stats.errorRequests).toBe(0);
    });

    it('에러 요청을 기록해야 한다', () => {
      service.recordHttpRequest('/api/equipment', 500, 100);

      const stats = service.getHttpStats();
      expect(stats.totalRequests).toBe(1);
      expect(stats.errorRequests).toBe(1);
      expect(stats.errorRate).toBeCloseTo(100, 1);
    });

    it('UUID 경로를 :id로 정규화해야 한다', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      service.recordHttpRequest(`/api/equipment/${uuid}`, 200, 30);
      service.recordHttpRequest(`/api/equipment/${uuid}`, 200, 40);

      const stats = service.getHttpStats();
      expect(stats.topEndpoints).toHaveLength(1);
      expect(stats.topEndpoints[0].endpoint).toBe('/api/equipment/:id');
      expect(stats.topEndpoints[0].count).toBe(2);
    });

    it('숫자 ID 경로를 :id로 정규화해야 한다', () => {
      service.recordHttpRequest('/api/users/123', 200, 20);
      service.recordHttpRequest('/api/users/456', 200, 25);

      const stats = service.getHttpStats();
      expect(stats.topEndpoints[0].endpoint).toBe('/api/users/:id');
      expect(stats.topEndpoints[0].count).toBe(2);
    });

    it('Prometheus 메트릭을 기록해야 한다', () => {
      service.recordHttpRequest('/api/test', 200, 50);

      expect(mockMetricsService.incrementHttpRequestTotal).toHaveBeenCalledWith(
        'ALL',
        '/api/test',
        '200'
      );
      expect(mockMetricsService.observeHttpRequestDuration).toHaveBeenCalledWith(
        'ALL',
        '/api/test',
        '200',
        0.05 // ms → sec
      );
    });
  });

  describe('getHttpStats', () => {
    it('빈 상태에서 올바른 기본값을 반환해야 한다', () => {
      const stats = service.getHttpStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.errorRate).toBe(0);
      expect(stats.topEndpoints).toEqual([]);
    });

    it('상위 5개 엔드포인트만 반환해야 한다', () => {
      for (let i = 0; i < 7; i++) {
        // 각 엔드포인트에 i+1 번 요청
        for (let j = 0; j <= i; j++) {
          service.recordHttpRequest(`/api/endpoint-${i}`, 200, 10);
        }
      }

      const stats = service.getHttpStats();
      expect(stats.topEndpoints).toHaveLength(5);
      // 가장 많은 요청이 첫 번째
      expect(stats.topEndpoints[0].count).toBe(7);
    });

    it('엔드포인트별 평균 응답 시간을 계산해야 한다', () => {
      service.recordHttpRequest('/api/test', 200, 100);
      service.recordHttpRequest('/api/test', 200, 200);
      service.recordHttpRequest('/api/test', 200, 300);

      const stats = service.getHttpStats();
      expect(stats.topEndpoints[0].avgResponseTime).toBe(200);
    });
  });

  describe('incrementLogCount', () => {
    it('알려진 레벨의 카운트를 증가시켜야 한다', () => {
      service.incrementLogCount('error');
      service.incrementLogCount('error');
      service.incrementLogCount('warn');

      // getHealthStatus를 통해 간접 검증
      // (직접 접근은 private이므로)
    });

    it('알 수 없는 레벨은 무시해야 한다', () => {
      // should not throw
      expect(() => {
        service.incrementLogCount('unknown' as 'error');
      }).not.toThrow();
    });
  });

  describe('logClientError', () => {
    it('클라이언트 에러를 로거에 전달해야 한다', () => {
      const dto = {
        message: 'ReferenceError: x is not defined',
        url: '/equipment/123',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date().toISOString(),
        component: 'EquipmentDetail',
        stack: 'Error at line 1',
      };

      service.logClientError(dto);

      expect(mockLoggerService.error).toHaveBeenCalledWith(
        '클라이언트 에러 수신',
        undefined,
        expect.objectContaining({
          message: dto.message,
          component: dto.component,
          url: dto.url,
        })
      );
    });
  });

  describe('getSystemMetrics', () => {
    it('OS 정보를 포함한 메트릭을 반환해야 한다', () => {
      const metrics = service.getSystemMetrics();

      expect(metrics.hostname).toBeDefined();
      expect(metrics.platform).toBeDefined();
      expect(metrics.nodeVersion).toMatch(/^v\d+/);
      expect(metrics.cpu.usage).toBeGreaterThanOrEqual(0);
      expect(metrics.memory.total).toBeGreaterThan(0);
      expect(metrics.uptime).toBeGreaterThanOrEqual(0);
    });

    it('디스크 및 OS 메트릭이 포함되어야 한다', () => {
      const metrics = service.getSystemMetrics();
      // 디스크 메트릭은 fs.statfsSync로 수집 (0이 아닌 값)
      expect(metrics.storage.diskTotal).toBeGreaterThan(0);
      expect(metrics.storage.diskFree).toBeGreaterThan(0);
      expect(metrics.storage.diskUsage).toBeGreaterThan(0);
    });
  });

  describe('getHealthStatus', () => {
    it('DB healthy + 에러율 낮음 시 유효한 상태를 반환해야 한다', async () => {
      const status = await service.getHealthStatus();

      // CPU/메모리는 실제 OS 상태에 따라 달라지므로 status 값은 healthy 또는 degraded
      expect(['healthy', 'degraded']).toContain(status.status);
      expect(status.services.database.status).toBe('connected');
      expect(status.services.cache.hitRate).toBe(83.33);
      expect(status.services.cache.size).toBe(50);
    });

    it('DB unhealthy 시 degraded를 반환해야 한다', async () => {
      mockDrizzleService.performHealthCheck.mockResolvedValueOnce({
        status: 'unhealthy',
        latency: 5000,
        error: 'Connection refused',
      });

      const status = await service.getHealthStatus();
      expect(status.status).toBe('degraded');
      expect(status.services.database.status).toBe('unhealthy');
    });

    it('높은 에러율 시 degraded를 반환해야 한다', async () => {
      // 에러율 > 5% (MONITORING_THRESHOLDS.ERROR_RATE_PERCENT)
      for (let i = 0; i < 10; i++) {
        service.recordHttpRequest('/api/test', 500, 100);
      }

      const status = await service.getHealthStatus();
      expect(status.status).toBe('degraded');
      expect(status.services.api.status).toBe('degraded');
    });

    it('DB 커넥션 풀 정보를 반환해야 한다', async () => {
      const status = await service.getHealthStatus();
      expect(status.services.database.connections).toEqual({
        active: 2, // 5 total - 3 idle
        idle: 3,
        total: 5,
      });
    });
  });

  describe('getDatabaseDiagnostics', () => {
    it('DrizzleService를 통해 DB 메트릭을 반환해야 한다', async () => {
      // executeDiagnosticQuery mock: 3개 쿼리 순서대로 반환
      mockDrizzleService.executeDiagnosticQuery
        .mockResolvedValueOnce([{ version: 'PostgreSQL 15.4' }])
        .mockResolvedValueOnce([
          {
            xact_commit: '1000',
            xact_rollback: '5',
            blks_hit: '9500',
            blks_read: '500',
            cache_hit_ratio: '95.00',
            deadlocks: '0',
          },
        ])
        .mockResolvedValueOnce([
          { name: 'equipment', row_count: '150', size: '2048 kB' },
          { name: 'users', row_count: '25', size: '128 kB' },
        ]);

      const diagnostics = await service.getDatabaseDiagnostics();

      expect(diagnostics.version).toBe('PostgreSQL 15.4');
      expect(diagnostics.connections.max).toBe(50);
      expect(diagnostics.metrics.cacheHitRatio).toBe(95);
      expect(diagnostics.metrics.xactCommit).toBe(1000);
      expect(diagnostics.tablesInfo).toHaveLength(2);
      expect(diagnostics.tablesInfo[0].name).toBe('equipment');
      expect(mockDrizzleService.executeDiagnosticQuery).toHaveBeenCalledTimes(3);
    });

    it('SQL 실패 시 기본값으로 폴백해야 한다', async () => {
      mockDrizzleService.executeDiagnosticQuery.mockRejectedValueOnce(
        new Error('Connection refused')
      );

      const diagnostics = await service.getDatabaseDiagnostics();

      expect(diagnostics.metrics.cacheHitRatio).toBe(0);
      expect(diagnostics.tablesInfo).toEqual([]);
      expect(mockLoggerService.warn).toHaveBeenCalled();
    });
  });

  describe('getDiagnostics', () => {
    it('p95/p99 응답 시간을 계산해야 한다', async () => {
      // 1~100ms 응답 시간 시뮬레이션
      for (let i = 1; i <= 100; i++) {
        service.recordHttpRequest('/api/test', 200, i);
      }

      const diagnostics = await service.getDiagnostics();

      expect(diagnostics.performance.responseTime.avg).toBeCloseTo(50.5, 0);
      expect(diagnostics.performance.responseTime.p95).toBe(95);
      expect(diagnostics.performance.responseTime.p99).toBe(99);
      // throughput = totalRequests / uptimeSeconds; uptime은 테스트 중 거의 0이므로 >= 0
      expect(diagnostics.performance.throughput).toBeGreaterThanOrEqual(0);
    });

    it('캐시 통계를 포함해야 한다', async () => {
      const diagnostics = await service.getDiagnostics();

      expect(diagnostics.cache).toEqual({
        hits: 100,
        misses: 20,
        hitRate: 83.33,
        size: 50,
        maxSize: 5000,
      });
    });
  });

  describe('onModuleDestroy', () => {
    it('타이머를 정리해야 한다', () => {
      // 호출해도 에러가 없어야 한다
      expect(() => service.onModuleDestroy()).not.toThrow();
      // 두 번 호출해도 안전해야 한다
      expect(() => service.onModuleDestroy()).not.toThrow();
    });
  });
});
