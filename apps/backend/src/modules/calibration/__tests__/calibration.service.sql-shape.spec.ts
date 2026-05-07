/**
 * CalibrationService SQL-shape 회귀 가드 (methods filter focus)
 *
 * 목적: `findAllInternal`가 `methods` 쿼리 파라미터에 따라 생성하는 WHERE 조건의
 * **형상**(컬럼 + 연산자 + 파라미터 수) 회귀를 감지한다. checkouts.service.sql-shape
 * 패턴을 미러하여 calibration도메인 동일 가드 표면 확보.
 *
 * 접근: `createMockDrizzle()` → `.where(...)` 인자 capture → `renderSQL()` →
 *   PgDialect.sqlToQuery() 로 실제 SQL 렌더 → assertion. 하드코딩 SQL 문자열 0건.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CalibrationService } from '../calibration.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { CacheInvalidationHelper } from '../../../common/cache/cache-invalidation.helper';
import { I18nService } from '../../../common/i18n/i18n.service';
import { FileUploadService } from '../../../common/file-upload/file-upload.service';
import {
  createMockDrizzle,
  renderSQL,
  type MockDrizzleHandle,
} from '../../../common/testing/drizzle-mock';
import {
  createMockCacheService,
  createMockEventEmitter,
  createMockCacheInvalidationHelper,
} from '../../../common/testing/mock-providers';
import type { CalibrationQueryDto } from '../dto/calibration-query.dto';

describe('CalibrationService — SQL shape regression (methods filter)', () => {
  let service: CalibrationService;
  let mockDrizzleHandle: MockDrizzleHandle;

  beforeEach(async () => {
    mockDrizzleHandle = createMockDrizzle();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalibrationService,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDrizzleHandle.drizzle },
        { provide: SimpleCacheService, useValue: createMockCacheService() },
        { provide: CacheInvalidationHelper, useValue: createMockCacheInvalidationHelper() },
        { provide: EventEmitter2, useValue: createMockEventEmitter() },
        { provide: I18nService, useValue: { t: jest.fn().mockReturnValue('') } },
        { provide: FileUploadService, useValue: { uploadFile: jest.fn() } },
      ],
    }).compile();

    service = module.get<CalibrationService>(CalibrationService);
  });

  /**
   * findAll() 호출 → buildQueryConditions 실행 → where(...) 호출 인자 렌더링.
   * methods 필터 단독 검증을 위해 다른 필터는 비움.
   */
  async function captureWhereSql(
    query: CalibrationQueryDto
  ): Promise<{ sql: string; params: readonly unknown[] } | { sql: null; params: [] }> {
    await service.findAll(query);
    const firstWhereCall = mockDrizzleHandle.whereCalls[0];
    expect(firstWhereCall).toBeDefined();
    return renderSQL(firstWhereCall[0]);
  }

  describe('methods filter (UL-QP-18 분류별 조회)', () => {
    it('emits equipment.management_method IN ($1) for single method', async () => {
      const rendered = await captureWhereSql({ methods: ['external_calibration'] });
      expect(rendered.sql).toContain('"management_method" IN (');
      expect(rendered.params).toContain('external_calibration');
      // 단일 토큰 → 정확히 1개 파라미터
      expect(rendered.params.filter((p) => p === 'external_calibration')).toHaveLength(1);
    });

    it('emits IN (...) with two params for two methods', async () => {
      const rendered = await captureWhereSql({
        methods: ['external_calibration', 'self_inspection'],
      });
      expect(rendered.sql).toContain('"management_method" IN (');
      expect(rendered.params).toContain('external_calibration');
      expect(rendered.params).toContain('self_inspection');
      // 2 토큰 → 2개 파라미터 (다른 필터 없음 가정)
      const methodParamsOnly = rendered.params.filter(
        (p) => p === 'external_calibration' || p === 'self_inspection'
      );
      expect(methodParamsOnly).toHaveLength(2);
    });

    it('does not emit management_method condition when methods is undefined', async () => {
      const rendered = await captureWhereSql({});
      // methods 미지정 → SQL에 management_method 조건 없음
      expect(rendered.sql).toBeNull();
    });

    it('emits IN ($1) for not_applicable single method', async () => {
      const rendered = await captureWhereSql({ methods: ['not_applicable'] });
      expect(rendered.sql).toContain('"management_method" IN (');
      expect(rendered.params).toContain('not_applicable');
    });
  });
});
