import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from '../settings.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import {
  createMockCacheService,
  createMockCacheInvalidationHelper,
} from '../../../common/testing/mock-providers';
import { CacheInvalidationHelper } from '../../../common/cache/cache-invalidation.helper';
import {
  DEFAULT_CALIBRATION_ALERT_DAYS,
  DEFAULT_SYSTEM_SETTINGS,
} from '@equipment-management/schemas';

describe('SettingsService', () => {
  let service: SettingsService;
  let mockDb: Record<string, jest.Mock>;
  let mockCacheService: Record<string, jest.Mock>;
  let mockCacheInvalidation: Record<string, jest.Mock>;

  // thenable chain builder
  const createSelectChain = (rows: unknown[]): Record<string, jest.Mock> => {
    const chain: Record<string, jest.Mock> = {};
    const self = (): Record<string, jest.Mock> => chain;
    chain.from = jest.fn().mockImplementation(self);
    chain.where = jest.fn().mockImplementation(self);
    chain.limit = jest.fn().mockImplementation(self);
    chain.then = jest.fn().mockImplementation((resolve: (v: unknown) => void) => resolve(rows));
    return chain;
  };

  const createUpdateChain = (): { set: jest.Mock; where: jest.Mock } => {
    const chain = {
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue(undefined),
    };
    return chain;
  };

  const createInsertChain = (): { values: jest.Mock } => ({
    values: jest.fn().mockResolvedValue(undefined),
  });

  beforeEach(async () => {
    mockCacheService = createMockCacheService();
    mockCacheInvalidation = {
      ...createMockCacheInvalidationHelper(),
      invalidateSettings: jest.fn().mockResolvedValue(undefined),
    };

    mockDb = {
      select: jest.fn(),
      update: jest.fn().mockReturnValue(createUpdateChain()),
      insert: jest.fn().mockReturnValue(createInsertChain()),
      transaction: jest.fn().mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
        // tx는 mockDb 자신으로 사용
        await fn(mockDb);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
        { provide: SimpleCacheService, useValue: mockCacheService },
        { provide: CacheInvalidationHelper, useValue: mockCacheInvalidation },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  describe('getCalibrationAlertDays', () => {
    it('DB에 값이 없으면 기본값을 반환해야 한다', async () => {
      // getOrSet pass-through → getSettingValue → select 빈 결과
      mockDb.select.mockReturnValue(createSelectChain([]));

      const result = await service.getCalibrationAlertDays();

      expect(result.alertDays).toEqual(DEFAULT_CALIBRATION_ALERT_DAYS);
    });

    it('DB에 저장된 값을 반환해야 한다', async () => {
      const customDays = [30, 14, 7];
      // site 미지정 → global 조회만 실행 (select 1회)
      mockDb.select.mockReturnValue(createSelectChain([{ value: customDays }]));

      const result = await service.getCalibrationAlertDays();

      expect(result.alertDays).toEqual(customDays);
    });

    it('site 지정 시 사이트별 값을 우선 반환해야 한다', async () => {
      const siteDays = [60, 30, 14];
      mockDb.select.mockReturnValue(createSelectChain([{ value: siteDays }]));

      const result = await service.getCalibrationAlertDays('SUW');

      expect(result.alertDays).toEqual(siteDays);
    });
  });

  describe('updateCalibrationAlertDays', () => {
    it('내림차순 정렬 후 저장하고 캐시를 무효화해야 한다', async () => {
      // setSettingValue 내부: select(existing check) → insert/update
      mockDb.select.mockReturnValue(createSelectChain([])); // 기존 row 없음 → insert

      const result = await service.updateCalibrationAlertDays([7, 30, 14], 'admin-1');

      expect(result.alertDays).toEqual([30, 14, 7]); // 내림차순
      expect(mockCacheInvalidation.invalidateSettings).toHaveBeenCalled();
    });

    it('기존 row가 있으면 update를 실행해야 한다', async () => {
      mockDb.select.mockReturnValue(createSelectChain([{ id: 'setting-1', value: [30, 7] }]));

      await service.updateCalibrationAlertDays([60, 30], 'admin-1');

      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe('getSystemSettings', () => {
    it('DB가 비어있으면 기본 시스템 설정을 반환해야 한다', async () => {
      mockDb.select.mockReturnValue(createSelectChain([]));

      const result = await service.getSystemSettings();

      expect(result).toEqual(DEFAULT_SYSTEM_SETTINGS);
    });

    it('DB 값을 기본값에 병합해야 한다', async () => {
      const dbRows = [{ key: 'notificationRetentionDays', value: 180 }];
      mockDb.select.mockReturnValue(createSelectChain(dbRows));

      const result = await service.getSystemSettings();

      expect(result).toEqual({
        ...DEFAULT_SYSTEM_SETTINGS,
        notificationRetentionDays: 180,
      });
    });
  });

  describe('updateSystemSettings', () => {
    it('트랜잭션으로 여러 설정을 업데이트해야 한다', async () => {
      // transaction 호출 확인
      mockDb.select.mockReturnValue(createSelectChain([]));

      await service.updateSystemSettings({ notificationRetentionDays: 180 }, 'admin-1');

      expect(mockDb.transaction).toHaveBeenCalled();
      expect(mockCacheInvalidation.invalidateSettings).toHaveBeenCalled();
    });

    it('undefined 값은 건너뛰어야 한다', async () => {
      mockDb.select.mockReturnValue(createSelectChain([]));

      await service.updateSystemSettings(
        { notificationRetentionDays: undefined } as Partial<Record<string, unknown>> as never,
        'admin-1'
      );

      expect(mockDb.transaction).toHaveBeenCalled();
      // insert/update가 호출되지 않아야 함
      // transaction 내부에서 undefined이면 skip
    });
  });
});
