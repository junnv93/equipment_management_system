import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CacheEventListener, validateDualChannelExclusivity } from '../cache-event-listener';
import { CacheInvalidationHelper } from '../cache-invalidation.helper';
import { SimpleCacheService } from '../simple-cache.service';
import { NOTIFICATION_EVENTS } from '../../../modules/notifications/events/notification-events';
import { CACHE_EVENTS } from '../cache-events';
import { CACHE_INVALIDATION_REGISTRY, type CacheInvalidationRule } from '../cache-event.registry';
import { CACHE_KEY_PREFIXES } from '../cache-key-prefixes';

describe('CacheEventListener', () => {
  let listener: CacheEventListener;
  let eventEmitter: EventEmitter2;
  let mockHelper: Record<string, jest.Mock>;
  let mockCacheService: { deleteByPattern: jest.Mock };

  beforeEach(async () => {
    mockHelper = {
      invalidateAllDashboard: jest.fn().mockResolvedValue(undefined),
      invalidateAllEquipment: jest.fn().mockResolvedValue(undefined),
      invalidateEquipmentDetail: jest.fn().mockResolvedValue(undefined),
      invalidateEquipmentLists: jest.fn().mockResolvedValue(undefined),
      invalidateAfterEquipmentUpdate: jest.fn().mockResolvedValue(undefined),
      invalidateAfterNonConformanceCreation: jest.fn().mockResolvedValue(undefined),
      invalidateAfterNonConformanceStatusChange: jest.fn().mockResolvedValue(undefined),
      invalidateNcDerivedCaches: jest.fn().mockResolvedValue(undefined),
      invalidateAfterDisposal: jest.fn().mockResolvedValue(undefined),
      invalidateAfterCalibrationPlanUpdate: jest.fn().mockResolvedValue(undefined),
    };

    mockCacheService = {
      deleteByPattern: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheEventListener,
        { provide: EventEmitter2, useValue: new EventEmitter2() },
        { provide: CacheInvalidationHelper, useValue: mockHelper },
        { provide: SimpleCacheService, useValue: mockCacheService },
      ],
    }).compile();

    listener = module.get<CacheEventListener>(CacheEventListener);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    // onModuleInit에서 이벤트 리스너를 등록
    listener.onModuleInit();
  });

  describe('onModuleInit()', () => {
    it('레지스트리의 모든 이벤트에 리스너를 등록한다', () => {
      const registeredEvents = Object.keys(CACHE_INVALIDATION_REGISTRY);
      expect(registeredEvents.length).toBeGreaterThan(0);

      // EventEmitter2에 리스너가 등록되었는지 확인
      for (const eventName of registeredEvents) {
        expect(eventEmitter.listenerCount(eventName)).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('checkout 이벤트', () => {
    it('checkout.approved → 대시보드 + 장비 상세 캐시 무효화', async () => {
      eventEmitter.emit(NOTIFICATION_EVENTS.CHECKOUT_APPROVED, {
        checkoutId: 'c-1',
        equipmentId: 'eq-1',
        actorId: 'user-1',
        actorName: 'Test',
        timestamp: new Date(),
      });

      // fire-and-forget이므로 이벤트 루프 대기
      await new Promise((r) => setTimeout(r, 10));

      expect(mockHelper.invalidateAllDashboard).toHaveBeenCalled();
      expect(mockHelper.invalidateEquipmentDetail).toHaveBeenCalledWith('eq-1');
      // wholesale 분해 (cache-wholesale-migration-checkouts) — list/summary/detail sub-prefix
      expect(mockCacheService.deleteByPattern).toHaveBeenCalledWith(
        `${CACHE_KEY_PREFIXES.CHECKOUTS}list:*`
      );
      expect(mockCacheService.deleteByPattern).toHaveBeenCalledWith(
        `${CACHE_KEY_PREFIXES.CHECKOUTS}summary:*`
      );
      expect(mockCacheService.deleteByPattern).toHaveBeenCalledWith(
        `${CACHE_KEY_PREFIXES.CHECKOUTS}detail:*`
      );
    });

    it('checkout.started → 장비 상태 변경 포함 무효화', async () => {
      eventEmitter.emit(NOTIFICATION_EVENTS.CHECKOUT_STARTED, {
        checkoutId: 'c-1',
        equipmentId: 'eq-2',
        actorId: 'user-1',
        actorName: 'Test',
        timestamp: new Date(),
      });

      await new Promise((r) => setTimeout(r, 10));

      expect(mockHelper.invalidateAfterEquipmentUpdate).toHaveBeenCalledWith('eq-2', true, false);
      expect(mockCacheService.deleteByPattern).toHaveBeenCalledWith(
        `${CACHE_KEY_PREFIXES.CHECKOUTS}list:*`
      );
    });
  });

  describe('calibration 이벤트', () => {
    it('calibration.approved → 장비 상태 변경 + 교정 캐시 무효화', async () => {
      eventEmitter.emit(NOTIFICATION_EVENTS.CALIBRATION_APPROVED, {
        calibrationId: 'cal-1',
        equipmentId: 'eq-3',
        actorId: 'user-1',
        actorName: 'Test',
        timestamp: new Date(),
      });

      await new Promise((r) => setTimeout(r, 10));

      expect(mockHelper.invalidateAfterEquipmentUpdate).toHaveBeenCalledWith('eq-3', true, false);
      expect(mockCacheService.deleteByPattern).toHaveBeenCalledWith(
        `${CACHE_KEY_PREFIXES.CALIBRATION}list:*`
      );
      expect(mockCacheService.deleteByPattern).toHaveBeenCalledWith(
        `${CACHE_KEY_PREFIXES.CALIBRATION}pending:*`
      );
    });
  });

  describe('calibrationPlan 이벤트', () => {
    it('calibrationPlan.approved → 대시보드 + 계획 캐시 무효화', async () => {
      eventEmitter.emit(NOTIFICATION_EVENTS.CALIBRATION_PLAN_APPROVED, {
        planId: 'plan-1',
        actorId: 'user-1',
        actorName: 'Test',
        timestamp: new Date(),
      });

      await new Promise((r) => setTimeout(r, 10));

      expect(mockHelper.invalidateAllDashboard).toHaveBeenCalled();
      expect(mockHelper.invalidateAfterCalibrationPlanUpdate).toHaveBeenCalledWith('plan-1');
    });
  });

  describe('non-conformance 이벤트', () => {
    it('nonConformance.created → NC 생성 무효화', async () => {
      eventEmitter.emit(NOTIFICATION_EVENTS.NC_CREATED, {
        ncId: 'nc-1',
        equipmentId: 'eq-4',
        actorId: 'user-1',
        actorName: 'Test',
        timestamp: new Date(),
      });

      await new Promise((r) => setTimeout(r, 10));

      expect(mockHelper.invalidateAfterNonConformanceCreation).toHaveBeenCalledWith('eq-4');
    });

    it('nonConformance.closed → 장비 상태 변경 포함 무효화', async () => {
      eventEmitter.emit(NOTIFICATION_EVENTS.NC_CLOSED, {
        ncId: 'nc-1',
        equipmentId: 'eq-4',
        actorId: 'user-1',
        actorName: 'Test',
        timestamp: new Date(),
      });

      await new Promise((r) => setTimeout(r, 10));

      expect(mockHelper.invalidateAfterNonConformanceStatusChange).toHaveBeenCalledWith(
        'eq-4',
        true
      );
    });

    it('nonConformance.attachmentUploaded (CACHE_EVENT) → invalidateNcDerivedCaches 호출', async () => {
      eventEmitter.emit(CACHE_EVENTS.NC_ATTACHMENT_UPLOADED, {
        ncId: 'nc-1',
        equipmentId: 'eq-4',
        documentId: 'doc-1',
        actorId: 'user-1',
      });

      await new Promise((r) => setTimeout(r, 10));

      expect(mockHelper.invalidateNcDerivedCaches).toHaveBeenCalledWith('eq-4');
      expect(mockHelper.invalidateAfterNonConformanceStatusChange).not.toHaveBeenCalled();
    });

    it('nonConformance.attachmentDeleted (CACHE_EVENT) → invalidateNcDerivedCaches 호출', async () => {
      eventEmitter.emit(CACHE_EVENTS.NC_ATTACHMENT_DELETED, {
        ncId: 'nc-1',
        equipmentId: 'eq-4',
        documentId: 'doc-1',
        actorId: 'user-1',
      });

      await new Promise((r) => setTimeout(r, 10));

      expect(mockHelper.invalidateNcDerivedCaches).toHaveBeenCalledWith('eq-4');
      expect(mockHelper.invalidateAfterNonConformanceStatusChange).not.toHaveBeenCalled();
    });
  });

  describe('SSOT 교차 검증 (regression)', () => {
    it('CACHE_EVENTS의 모든 값이 CACHE_INVALIDATION_REGISTRY에 등재됨', () => {
      const registryKeys = new Set(Object.keys(CACHE_INVALIDATION_REGISTRY));
      for (const eventValue of Object.values(CACHE_EVENTS)) {
        expect(registryKeys.has(eventValue)).toBe(true);
      }
    });
  });

  describe('disposal 이벤트', () => {
    it('disposal.approved → 폐기 무효화', async () => {
      eventEmitter.emit(NOTIFICATION_EVENTS.DISPOSAL_APPROVED, {
        disposalId: 'd-1',
        equipmentId: 'eq-5',
        actorId: 'user-1',
        actorName: 'Test',
        timestamp: new Date(),
      });

      await new Promise((r) => setTimeout(r, 10));

      expect(mockHelper.invalidateAfterDisposal).toHaveBeenCalledWith('eq-5');
    });
  });

  describe('equipment import 이벤트', () => {
    it('equipmentImport.approved → 장비 상태 변경 + 반입 캐시 무효화', async () => {
      eventEmitter.emit(NOTIFICATION_EVENTS.IMPORT_APPROVED, {
        importId: 'imp-1',
        equipmentId: 'eq-6',
        actorId: 'user-1',
        actorName: 'Test',
        timestamp: new Date(),
      });

      await new Promise((r) => setTimeout(r, 10));

      expect(mockHelper.invalidateAfterEquipmentUpdate).toHaveBeenCalledWith('eq-6', true, false);
      // wholesale 분해 (cache-wholesale-migration-equipment-imports) — list/detail sub-prefix
      expect(mockCacheService.deleteByPattern).toHaveBeenCalledWith(
        `${CACHE_KEY_PREFIXES.EQUIPMENT_IMPORTS}list:*`
      );
      expect(mockCacheService.deleteByPattern).toHaveBeenCalledWith(
        `${CACHE_KEY_PREFIXES.EQUIPMENT_IMPORTS}detail:*`
      );
    });
  });

  describe('페이로드 필드 누락', () => {
    it('equipmentId가 없으면 무효화를 건너뛴다', async () => {
      eventEmitter.emit(NOTIFICATION_EVENTS.CHECKOUT_STARTED, {
        checkoutId: 'c-1',
        // equipmentId 누락
        actorId: 'user-1',
        actorName: 'Test',
        timestamp: new Date(),
      });

      await new Promise((r) => setTimeout(r, 10));

      // equipmentId가 없으므로 invalidateAfterEquipmentUpdate 호출 안됨
      expect(mockHelper.invalidateAfterEquipmentUpdate).not.toHaveBeenCalled();
      // 패턴 삭제는 여전히 실행됨 (wholesale 분해 — list/summary/detail)
      expect(mockCacheService.deleteByPattern).toHaveBeenCalledWith(
        `${CACHE_KEY_PREFIXES.CHECKOUTS}list:*`
      );
    });
  });

  describe('에러 처리', () => {
    it('캐시 무효화 실패 시 비즈니스 로직을 차단하지 않는다', async () => {
      mockHelper.invalidateAllDashboard.mockRejectedValueOnce(new Error('Cache error'));

      // 에러가 throw되지 않아야 함
      eventEmitter.emit(NOTIFICATION_EVENTS.CHECKOUT_REJECTED, {
        checkoutId: 'c-1',
        equipmentId: 'eq-1',
        actorId: 'user-1',
        actorName: 'Test',
        timestamp: new Date(),
      });

      await new Promise((r) => setTimeout(r, 10));

      // 에러가 발생해도 프로세스가 중단되지 않음
      expect(mockHelper.invalidateAllDashboard).toHaveBeenCalled();
    });
  });

  describe('dual-channel exclusivity (SOFTWARE_VALIDATION 회귀 차단)', () => {
    it('NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_*는 CACHE_INVALIDATION_REGISTRY에 등록되어 있지 않다', () => {
      // 채널 책임 분리: 알림 이벤트는 알림/SSE/side-effect 전용,
      // 캐시 무효화는 CACHE_EVENTS.SW_VALIDATION_* 채널만 담당.
      // 양 채널 등록 시 중복 invalidateAllDashboard로 p99 latency 증가.
      const registryKeys = new Set(Object.keys(CACHE_INVALIDATION_REGISTRY));
      expect(registryKeys.has(NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_SUBMITTED)).toBe(false);
      expect(registryKeys.has(NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_APPROVED)).toBe(false);
      expect(registryKeys.has(NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_QUALITY_APPROVED)).toBe(
        false
      );
      expect(registryKeys.has(NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_REJECTED)).toBe(false);
    });

    it('CACHE_EVENTS.SW_VALIDATION_* 4개는 모두 CACHE_INVALIDATION_REGISTRY에 등록되어 있다', () => {
      const registryKeys = new Set(Object.keys(CACHE_INVALIDATION_REGISTRY));
      expect(registryKeys.has(CACHE_EVENTS.SW_VALIDATION_SUBMITTED)).toBe(true);
      expect(registryKeys.has(CACHE_EVENTS.SW_VALIDATION_APPROVED)).toBe(true);
      expect(registryKeys.has(CACHE_EVENTS.SW_VALIDATION_QUALITY_APPROVED)).toBe(true);
      expect(registryKeys.has(CACHE_EVENTS.SW_VALIDATION_REJECTED)).toBe(true);
    });

    it('현재 registry 전체에 dual-channel 위반이 없다 (부팅타임 invariant baseline)', () => {
      expect(() => validateDualChannelExclusivity(CACHE_INVALIDATION_REGISTRY)).not.toThrow();
    });

    it('CACHE_EVENTS + NOTIFICATION_EVENTS 양쪽에 동일 signature 등록 시 throw', () => {
      // 회귀 시뮬레이션: software-validation submitted를 양 채널에 동일 규칙으로 등록.
      const violatingRegistry: Record<string, CacheInvalidationRule> = {
        [CACHE_EVENTS.SW_VALIDATION_SUBMITTED]: {
          actions: [{ method: 'invalidateAllDashboard' }],
          patterns: [{ pattern: `${CACHE_KEY_PREFIXES.SOFTWARE_VALIDATIONS}*` }],
        },
        [NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_SUBMITTED]: {
          actions: [{ method: 'invalidateAllDashboard' }],
          patterns: [{ pattern: `${CACHE_KEY_PREFIXES.SOFTWARE_VALIDATIONS}*` }],
        },
      };

      expect(() => validateDualChannelExclusivity(violatingRegistry)).toThrow(
        /dual-channel exclusivity 위반/
      );
    });

    it('actions 순서가 달라도 signature는 동일하게 정규화된다', () => {
      // sorted JSON signature 정규화 검증 — action 배열 순서가 false-negative를 만들지 않아야 함.
      const violatingRegistry: Record<string, CacheInvalidationRule> = {
        [CACHE_EVENTS.SW_VALIDATION_APPROVED]: {
          actions: [{ method: 'invalidateAllDashboard' }, { method: 'invalidateAllEquipment' }],
          patterns: [{ pattern: `${CACHE_KEY_PREFIXES.SOFTWARE_VALIDATIONS}*` }],
        },
        [NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_APPROVED]: {
          actions: [{ method: 'invalidateAllEquipment' }, { method: 'invalidateAllDashboard' }],
          patterns: [{ pattern: `${CACHE_KEY_PREFIXES.SOFTWARE_VALIDATIONS}*` }],
        },
      };

      expect(() => validateDualChannelExclusivity(violatingRegistry)).toThrow(
        /dual-channel exclusivity 위반/
      );
    });

    it('동일 채널 내부 중복 signature는 violation이 아니다', () => {
      // NOTIFICATION_EVENTS.CHECKOUT_REJECTED 와 NOTIFICATION_EVENTS.CHECKOUT_BORROWER_REJECTED 가
      // 동일한 actions+patterns일 수 있으나, 같은 channel이므로 정당.
      const sameChannelRegistry: Record<string, CacheInvalidationRule> = {
        [NOTIFICATION_EVENTS.CHECKOUT_REJECTED]: {
          actions: [{ method: 'invalidateAllDashboard' }],
          patterns: [{ pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}*` }],
        },
        [NOTIFICATION_EVENTS.CHECKOUT_BORROWER_REJECTED]: {
          actions: [{ method: 'invalidateAllDashboard' }],
          patterns: [{ pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}*` }],
        },
      };

      expect(() => validateDualChannelExclusivity(sameChannelRegistry)).not.toThrow();
    });
  });
});
