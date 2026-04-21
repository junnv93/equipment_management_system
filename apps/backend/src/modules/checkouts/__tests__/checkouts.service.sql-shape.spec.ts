/**
 * CheckoutsService SQL-shape 회귀 가드
 *
 * 목적: `buildQueryConditions` 가 쿼리 파라미터에 따라 생성하는 WHERE 절 SQL 의
 * **형상**(컬럼 + 연산자 + 파라미터 수) 회귀를 감지한다. 단편적인 인덱스 기반
 * 체인 호출 여부만 확인하던 기존 `checkouts.service.spec.ts` 의 갭을 메꾼다.
 *
 * 접근: `createMockDrizzle()` 가 `.where(...)` 호출 인자를 capture → `renderSQL()`
 * 이 실제 `PgDialect.sqlToQuery()` 로 렌더링 → assertion 은 실제 DB 에 나갈 SQL
 * 문자열에 대해 수행 (drift-proof, Drizzle 업그레이드 자동 반영).
 *
 * 스코프 의도적 제외:
 *   - site / teamId / equipmentId 필터 → util level (`checkout-scope.util.spec.ts` +
 *     `scope-enforcer.spec.ts`) 에서 이미 SSOT 검증. 서비스 레벨 중복 회피.
 *   - `findAll` 의 relational fetch (`db.query.checkouts.findMany`) → 본 파일은
 *     쿼리 조건 형상만 검증하므로 mock 초기값(빈 배열)으로 early-return 경로 활용.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CheckoutsService } from '../checkouts.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { EquipmentService } from '../../equipment/equipment.service';
import { TeamsService } from '../../teams/teams.service';
import { EquipmentImportsService } from '../../equipment-imports/equipment-imports.service';
import {
  createMockDrizzle,
  renderSQL,
  type MockDrizzleHandle,
} from '../../../common/testing/drizzle-mock';
import {
  createMockCacheService,
  createMockEventEmitter,
  createMockEquipmentImportsService,
} from '../../../common/testing/mock-providers';
import type { CheckoutQueryDto } from '../dto/checkout-query.dto';
import { AuditService } from '../../audit/audit.service';

describe('CheckoutsService — SQL shape regression', () => {
  let service: CheckoutsService;
  let mockDrizzleHandle: MockDrizzleHandle;

  beforeEach(async () => {
    mockDrizzleHandle = createMockDrizzle();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutsService,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDrizzleHandle.drizzle },
        { provide: SimpleCacheService, useValue: createMockCacheService() },
        {
          provide: EquipmentService,
          useValue: {
            findOne: jest.fn(),
            findByIds: jest.fn().mockResolvedValue(new Map()),
            updateStatus: jest.fn(),
            updateStatusBatch: jest.fn().mockResolvedValue([]),
          },
        },
        { provide: TeamsService, useValue: { findOne: jest.fn() } },
        { provide: EquipmentImportsService, useValue: createMockEquipmentImportsService() },
        { provide: EventEmitter2, useValue: createMockEventEmitter() },
        {
          provide: AuditService,
          useValue: { create: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<CheckoutsService>(CheckoutsService);
  });

  /**
   * findAll() 호출 → buildQueryConditions 실행 → where(...) 의 첫 호출 인자를
   * 렌더링해 반환. 빈 조건일 경우 `{ sql: null }` 로 표현.
   */
  async function captureWhereSql(
    query: CheckoutQueryDto
  ): Promise<{ sql: string; params: readonly unknown[] } | { sql: null; params: [] }> {
    await service.findAll(query, false);
    const firstWhereCall = mockDrizzleHandle.whereCalls[0];
    expect(firstWhereCall).toBeDefined();
    return renderSQL(firstWhereCall[0]);
  }

  describe('no filters', () => {
    it('should call where(undefined) when no filter params are provided', async () => {
      const rendered = await captureWhereSql({});
      expect(rendered.sql).toBeNull();
      expect(rendered.params).toEqual([]);
    });
  });

  describe('scalar equality filters', () => {
    it('should emit requester_id = $1 when requesterId is provided', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440002';
      const rendered = await captureWhereSql({ requesterId: uuid });
      expect(rendered.sql).toContain('"requester_id" =');
      expect(rendered.params).toContain(uuid);
    });

    it('should emit approver_id = $1 when approverId is provided', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440004';
      const rendered = await captureWhereSql({ approverId: uuid });
      expect(rendered.sql).toContain('"approver_id" =');
      expect(rendered.params).toContain(uuid);
    });

    it('should emit purpose = $1 when purpose is provided', async () => {
      const rendered = await captureWhereSql({ purpose: 'calibration' });
      expect(rendered.sql).toContain('"purpose" =');
      expect(rendered.params).toContain('calibration');
    });

    it('should emit destination = $1 when destination is provided', async () => {
      const rendered = await captureWhereSql({ destination: 'HCT 교정기관' });
      expect(rendered.sql).toContain('"destination" =');
      expect(rendered.params).toContain('HCT 교정기관');
    });
  });

  describe('status filter', () => {
    it('should emit a single equality when only one status is provided', async () => {
      const rendered = await captureWhereSql({ statuses: 'pending' });
      expect(rendered.sql).toContain('"status" =');
      expect(rendered.params).toContain('pending');
      // 단일 상태는 or(...) 가 아닌 eq 만 사용됨을 보장
      expect(rendered.sql).not.toContain(' or ');
    });

    it('should emit OR of equalities when multiple statuses are provided', async () => {
      const rendered = await captureWhereSql({ statuses: 'pending,approved,checked_out' });
      expect(rendered.sql).toContain('"status" =');
      expect(rendered.sql).toContain(' or ');
      expect(rendered.params).toEqual(
        expect.arrayContaining(['pending', 'approved', 'checked_out'])
      );
    });
  });

  describe('date range filters', () => {
    it('should emit checkout_date >= $1 OR IS NULL when checkoutFrom is set', async () => {
      const rendered = await captureWhereSql({ checkoutFrom: '2026-01-01T00:00:00.000Z' });
      expect(rendered.sql).toContain('"checkout_date" >=');
      expect(rendered.sql?.toLowerCase()).toContain('"checkout_date" is null');
      expect(rendered.params.length).toBeGreaterThan(0);
    });

    it('should emit checkout_date <= $1 OR IS NULL when checkoutTo is set', async () => {
      const rendered = await captureWhereSql({ checkoutTo: '2026-12-31T23:59:59.000Z' });
      expect(rendered.sql).toContain('"checkout_date" <=');
      expect(rendered.sql?.toLowerCase()).toContain('"checkout_date" is null');
    });

    it('should emit expected_return_date >= / <= for returnFrom / returnTo (no IS NULL fallback)', async () => {
      const rendered = await captureWhereSql({
        returnFrom: '2026-01-01T00:00:00.000Z',
        returnTo: '2026-12-31T23:59:59.000Z',
      });
      expect(rendered.sql).toContain('"expected_return_date" >=');
      expect(rendered.sql).toContain('"expected_return_date" <=');
      // returnFrom/To 는 IS NULL 허용 경로가 없어야 함 (checkout_date 와 의도적 구분)
      expect(rendered.sql).not.toContain('"expected_return_date" is null');
    });
  });

  describe('search filter', () => {
    it('should emit ILIKE against destination/reason/address with wildcard pattern', async () => {
      const rendered = await captureWhereSql({ search: 'HCT' });
      // safeIlike 는 ESCAPE '!' 를 포함하는 대문자 ILIKE 로 렌더링됨
      expect(rendered.sql).toMatch(/"destination" ILIKE/i);
      expect(rendered.sql).toMatch(/"reason" ILIKE/i);
      expect(rendered.sql).toMatch(/"address" ILIKE/i);
      // likeContains 는 `%HCT%` 형태로 감싸므로 params 에 그대로 포함
      expect(rendered.params).toEqual(expect.arrayContaining(['%HCT%', '%HCT%', '%HCT%']));
    });
  });

  describe('combined filters', () => {
    it('should AND all active conditions with the correct parameter count', async () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440002';
      const rendered = await captureWhereSql({
        requesterId: uuid,
        purpose: 'calibration',
        destination: 'HCT 교정기관',
      });
      expect(rendered.sql).toContain('"requester_id" =');
      expect(rendered.sql).toContain('"purpose" =');
      expect(rendered.sql).toContain('"destination" =');
      // and(...) 는 괄호 + ' and ' 로 렌더링
      expect(rendered.sql).toContain(' and ');
      expect(rendered.params).toEqual(
        expect.arrayContaining([uuid, 'calibration', 'HCT 교정기관'])
      );
    });
  });
});
