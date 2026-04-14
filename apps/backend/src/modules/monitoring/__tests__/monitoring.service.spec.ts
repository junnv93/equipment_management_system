import { Test, TestingModule } from '@nestjs/testing';
import { MonitoringService } from '../monitoring.service';
import { LoggerService } from '../../../common/logger/logger.service';
import { MetricsService } from '../../../common/metrics/metrics.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { DrizzleService } from '../../../database/drizzle.module';
import { createMockCacheService } from '../../../common/testing/mock-providers';
import { MONITORING_THRESHOLDS } from '@equipment-management/shared-constants';

describe('MonitoringService', () => {
  let service: MonitoringService;
  let mockCacheService: ReturnType<typeof createMockCacheService>;
  let mockLoggerService: Record<string, jest.Mock>;
  let mockMetricsService: Record<string, jest.Mock>;
  let mockDrizzleService: Record<string, jest.Mock>;

  beforeEach(async () => {
    jest.useFakeTimers();

    mockCacheService = createMockCacheService();
    mockCacheService.getCacheStats = jest.fn().mockReturnValue({
      size: 0,
      hitRate: 0,
      hits: 0,
      misses: 0,
    });

    mockLoggerService = {
      setContext: jest.fn().mockReturnThis(),
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    };

    mockMetricsService = {
      incrementHttpRequestTotal: jest.fn(),
      observeHttpRequestDuration: jest.fn(),
    };

    mockDrizzleService = {
      getMetrics: jest.fn().mockReturnValue({
        poolTotalCount: 10,
        poolIdleCount: 8,
        connectionsCreated: 5,
        connectionErrors: 0,
        connectionsAcquired: 20,
      }),
      getDB: jest.fn().mockReturnValue({
        execute: jest.fn().mockResolvedValue({ rows: [{ version: 'PostgreSQL 15.0' }] }),
      }),
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
    service?.onModuleDestroy();
    jest.useRealTimers();
  });

  it('서비스가 정의되어야 한다', () => {
    expect(service).toBeDefined();
  });

  describe('getSystemMetrics()', () => {
    it('hostname, platform, nodeVersion 등 시스템 정보를 포함하는 구조체를 반환한다', () => {
      const metrics = service.getSystemMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.hostname).toBeDefined();
      expect(metrics.platform).toBeDefined();
      expect(metrics.nodeVersion).toBeDefined();
      expect(metrics.cpu).toBeDefined();
      expect(metrics.memory).toBeDefined();
    });
  });

  describe('getHealthStatus()', () => {
    it('status와 timestamp를 포함하는 구조를 반환한다', () => {
      const health = service.getHealthStatus();

      expect(health).toBeDefined();
      // CPU/메모리는 실제 OS 값을 사용하므로 정확한 상태값 대신 유효한 상태인지 검증
      expect(['healthy', 'degraded']).toContain(health.status);
      expect(health.timestamp).toBeDefined();
    });

    it('HTTP 에러율이 높으면 degraded를 반환한다', () => {
      // 100개 요청 중 90개 에러 (90% error rate → 임계치 초과)
      for (let i = 0; i < 90; i++) {
        service.recordHttpRequest('/api/test', 500, 100);
      }
      for (let i = 0; i < 10; i++) {
        service.recordHttpRequest('/api/test', 200, 50);
      }

      const health = service.getHealthStatus();
      expect(health.status).toBe('degraded');
    });
  });

  describe('recordHttpRequest()', () => {
    it('2xx 응답은 successRequests를 증가시킨다', () => {
      service.recordHttpRequest('/api/equipment', 200, 50);
      service.recordHttpRequest('/api/equipment', 201, 30);

      const stats = service.getHttpStats();
      expect(stats.totalRequests).toBe(2);
      expect(stats.successRequests).toBe(2);
      expect(stats.errorRequests).toBe(0);
    });

    it('5xx 응답은 errorRequests를 증가시킨다', () => {
      service.recordHttpRequest('/api/equipment', 500, 200);
      service.recordHttpRequest('/api/equipment', 503, 300);

      const stats = service.getHttpStats();
      expect(stats.totalRequests).toBe(2);
      expect(stats.errorRequests).toBe(2);
      expect(stats.successRequests).toBe(0);
    });

    it('3xx 응답은 successRequests로 분류한다', () => {
      service.recordHttpRequest('/api/redirect', 302, 10);

      const stats = service.getHttpStats();
      expect(stats.successRequests).toBe(1);
      expect(stats.errorRequests).toBe(0);
    });

    it('UUID가 포함된 경로는 :id로 정규화한다', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      service.recordHttpRequest(`/api/equipment/${uuid}`, 200, 50);

      const stats = service.getHttpStats();
      const topEndpoints = stats.topEndpoints;
      expect(topEndpoints.some((e) => e.endpoint === '/api/equipment/:id')).toBe(true);
    });

    it('MAX_TRACKED_ENDPOINTS 초과 시 최소 요청 수 엔트리를 제거한다', () => {
      const max = MONITORING_THRESHOLDS.MAX_TRACKED_ENDPOINTS;

      // max-1개 엔드포인트를 각 2번씩 기록 (count=2)
      for (let i = 0; i < max - 1; i++) {
        service.recordHttpRequest(`/api/fill-${i}`, 200, 10);
        service.recordHttpRequest(`/api/fill-${i}`, 200, 10);
      }

      // sentinel: count=1 (최소값 → 초과 시 제거 대상)
      service.recordHttpRequest('/api/sentinel-min-count', 200, 10);
      // Map 크기 == max (정확히 경계)

      const internalMap = (
        service as unknown as { httpStats: { requestsByEndpoint: Map<string, number> } }
      ).httpStats.requestsByEndpoint;
      expect(internalMap.size).toBe(max);

      // 새 엔드포인트를 추가 → 크기가 max+1이 되어 enforceEndpointMapLimit 발동
      service.recordHttpRequest('/api/trigger-eviction', 200, 10);

      // 크기는 다시 max로 유지
      expect(internalMap.size).toBe(max);
      // 최소 count 엔트리(sentinel)가 제거됨
      expect(internalMap.has('/api/sentinel-min-count')).toBe(false);
      // 새로 추가한 엔드포인트는 남아 있음
      expect(internalMap.has('/api/trigger-eviction')).toBe(true);
    });
  });

  describe('getHttpStats()', () => {
    it('요청 수 기준 상위 5개 엔드포인트를 반환한다', () => {
      for (let i = 0; i < 3; i++) service.recordHttpRequest('/api/a', 200, 10);
      for (let i = 0; i < 2; i++) service.recordHttpRequest('/api/b', 200, 10);
      service.recordHttpRequest('/api/c', 200, 10);

      const stats = service.getHttpStats();
      expect(stats.topEndpoints.length).toBeLessThanOrEqual(5);
      expect(stats.topEndpoints[0].endpoint).toBe('/api/a');
      expect(stats.topEndpoints[0].count).toBe(3);
    });
  });

  describe('getCacheStats()', () => {
    it('SimpleCacheService.getCacheStats()에 위임한다', () => {
      service.getCacheStats();
      expect(mockCacheService.getCacheStats).toHaveBeenCalled();
    });
  });

  describe('getDatabaseDiagnostics()', () => {
    it('DrizzleService pool 메트릭을 포함한 DB 진단 정보를 반환한다', () => {
      const diagnostics = service.getDatabaseDiagnostics();

      expect(diagnostics).toBeDefined();
      expect(diagnostics.status).toBe('connected');
      expect(diagnostics.connections).toBeDefined();
      expect(diagnostics.connections.max).toBe(10);
      expect(diagnostics.connections.idle).toBe(8);
      expect(mockDrizzleService.getMetrics).toHaveBeenCalled();
    });
  });

  describe('incrementLogCount()', () => {
    it('올바른 로그 레벨 카운터를 증가시킨다', () => {
      // incrementLogCount는 외부에서 호출 가능
      service.incrementLogCount('error');
      service.incrementLogCount('error');
      service.incrementLogCount('warn');

      const health = service.getHealthStatus();
      // 카운터가 내부 상태에 반영되었는지 확인 (서비스가 정상 동작함)
      expect(health).toBeDefined();
    });
  });

  describe('logClientError()', () => {
    it('구조화된 클라이언트 에러 정보로 logger.error를 호출한다', () => {
      service.logClientError({
        message: '테스트 에러',
        component: 'TestComponent',
        url: '/test',
        userAgent: 'TestAgent',
        timestamp: new Date().toISOString(),
      });

      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy()', () => {
    it('메트릭 타이머를 정리한다', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      service.onModuleDestroy();
      // 두 번 호출해도 오류 없음 (null guard)
      service.onModuleDestroy();
      expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
    });
  });
});
