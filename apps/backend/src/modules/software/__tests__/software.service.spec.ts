import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { SoftwareService } from '../software.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import {
  createMockCacheService,
  createMockEventEmitter,
} from '../../../common/testing/mock-providers';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('SoftwareService', () => {
  let service: SoftwareService;
  let mockDb: Record<string, jest.Mock>;
  let mockCacheService: Record<string, jest.Mock>;
  let mockEventEmitter: Record<string, jest.Mock>;

  // thenable chain builder
  const createSelectChain = (rows: unknown[]): Record<string, jest.Mock> => {
    const chain: Record<string, jest.Mock> = {};
    const self = (): Record<string, jest.Mock> => chain;
    chain.from = jest.fn().mockImplementation(self);
    chain.where = jest.fn().mockImplementation(self);
    chain.orderBy = jest.fn().mockImplementation(self);
    chain.limit = jest.fn().mockImplementation(self);
    chain.offset = jest.fn().mockImplementation(self);
    chain.leftJoin = jest.fn().mockImplementation(self);
    chain.innerJoin = jest.fn().mockImplementation(self);
    chain.groupBy = jest.fn().mockImplementation(self);
    chain.then = jest.fn().mockImplementation((resolve: (v: unknown) => void) => resolve(rows));
    return chain;
  };

  const createInsertChain = (returning: unknown[]): { values: jest.Mock } => ({
    values: jest.fn().mockReturnValue({
      returning: jest.fn().mockResolvedValue(returning),
    }),
  });

  const sampleRecord = {
    id: 'sw-1',
    equipmentId: 'eq-1',
    softwareName: 'LabView',
    previousVersion: '2023.1',
    newVersion: '2024.1',
    changedBy: 'user-1',
    verificationRecord: 'Verified OK',
    approvalStatus: 'pending',
    approvedBy: null,
    approvedAt: null,
    approverComment: null,
    changedAt: new Date('2025-01-01'),
    version: 1,
  };

  // protected 메서드 spyOn 헬퍼
  function spyOnUpdateWithVersion(): jest.SpyInstance {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return jest.spyOn(service as any, 'updateWithVersion');
  }

  beforeEach(async () => {
    mockCacheService = createMockCacheService();
    mockEventEmitter = createMockEventEmitter();

    mockDb = {
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SoftwareService,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
        { provide: SimpleCacheService, useValue: mockCacheService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<SoftwareService>(SoftwareService);
  });

  describe('create', () => {
    it('검증 기록 없이 생성하면 BadRequestException을 던져야 한다', async () => {
      await expect(
        service.create(
          {
            equipmentId: 'eq-1',
            softwareName: 'LabView',
            newVersion: '2024.1',
            verificationRecord: '',
          } as never,
          'user-1'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('존재하지 않는 장비에 대해 NotFoundException을 던져야 한다', async () => {
      mockDb.select.mockReturnValue(createSelectChain([]));

      await expect(
        service.create(
          {
            equipmentId: 'nonexistent',
            softwareName: 'LabView',
            newVersion: '2024.1',
            verificationRecord: 'Verified OK',
          } as never,
          'user-1'
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('정상적으로 소프트웨어 변경 요청을 생성해야 한다', async () => {
      mockDb.select.mockReturnValue(createSelectChain([{ id: 'eq-1' }]));
      mockDb.insert.mockReturnValue(createInsertChain([sampleRecord]));

      const result = await service.create(
        {
          equipmentId: 'eq-1',
          softwareName: 'LabView',
          newVersion: '2024.1',
          verificationRecord: 'Verified OK',
        } as never,
        'user-1'
      );

      expect(result.softwareName).toBe('LabView');
      expect(mockCacheService.deleteByPrefix).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('존재하는 레코드를 반환해야 한다', async () => {
      mockDb.select.mockReturnValue(createSelectChain([sampleRecord]));

      const result = await service.findOne('sw-1');
      expect(result.id).toBe('sw-1');
    });

    it('존재하지 않는 레코드에 NotFoundException을 던져야 한다', async () => {
      mockDb.select.mockReturnValue(createSelectChain([]));

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('approve', () => {
    it('PENDING 상태의 요청을 승인해야 한다', async () => {
      mockDb.select.mockReturnValue(createSelectChain([sampleRecord]));

      const approvedRecord = {
        ...sampleRecord,
        approvalStatus: 'approved',
        approvedBy: 'approver-1',
        version: 2,
      };
      spyOnUpdateWithVersion().mockResolvedValue(approvedRecord);

      const result = await service.approve('sw-1', {
        version: 1,
        approverId: 'approver-1',
        approverComment: 'LGTM',
      });

      expect(result.approvalStatus).toBe('approved');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        expect.stringContaining('software'),
        expect.objectContaining({ softwareHistoryId: 'sw-1' })
      );
      expect(mockCacheService.delete).toHaveBeenCalled();
    });

    it('PENDING이 아닌 상태에서 BadRequestException을 던져야 한다', async () => {
      const approvedRecord = { ...sampleRecord, approvalStatus: 'approved' };
      mockDb.select.mockReturnValue(createSelectChain([approvedRecord]));

      await expect(
        service.approve('sw-1', {
          version: 1,
          approverId: 'approver-1',
          approverComment: '',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('버전 충돌 시 캐시를 무효화하고 ConflictException을 전파해야 한다', async () => {
      mockDb.select.mockReturnValue(createSelectChain([sampleRecord]));
      spyOnUpdateWithVersion().mockRejectedValue(new ConflictException('VERSION_CONFLICT'));

      await expect(
        service.approve('sw-1', {
          version: 1,
          approverId: 'approver-1',
          approverComment: '',
        })
      ).rejects.toThrow(ConflictException);

      expect(mockCacheService.delete).toHaveBeenCalled();
    });
  });

  describe('reject', () => {
    it('PENDING 상태의 요청을 반려해야 한다', async () => {
      mockDb.select.mockReturnValue(createSelectChain([sampleRecord]));

      const rejectedRecord = {
        ...sampleRecord,
        approvalStatus: 'rejected',
        version: 2,
      };
      spyOnUpdateWithVersion().mockResolvedValue(rejectedRecord);

      const result = await service.reject('sw-1', {
        version: 1,
        approverId: 'approver-1',
        rejectionReason: '버전 호환성 문제',
      });

      expect(result.approvalStatus).toBe('rejected');
      expect(mockEventEmitter.emit).toHaveBeenCalled();
    });

    it('PENDING이 아닌 상태에서 BadRequestException을 던져야 한다', async () => {
      const rejectedRecord = { ...sampleRecord, approvalStatus: 'rejected' };
      mockDb.select.mockReturnValue(createSelectChain([rejectedRecord]));

      await expect(
        service.reject('sw-1', {
          version: 1,
          approverId: 'approver-1',
          rejectionReason: '이유',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('버전 충돌 시 캐시를 무효화하고 ConflictException을 전파해야 한다', async () => {
      mockDb.select.mockReturnValue(createSelectChain([sampleRecord]));
      spyOnUpdateWithVersion().mockRejectedValue(new ConflictException('VERSION_CONFLICT'));

      await expect(
        service.reject('sw-1', {
          version: 1,
          approverId: 'approver-1',
          rejectionReason: '충돌',
        })
      ).rejects.toThrow(ConflictException);

      expect(mockCacheService.delete).toHaveBeenCalled();
    });
  });

  describe('getSoftwareSiteAndTeam', () => {
    it('소프트웨어 이력의 사이트와 팀을 반환해야 한다', async () => {
      mockDb.select.mockReturnValue(createSelectChain([{ site: 'SUW', teamId: 'team-1' }]));

      const result = await service.getSoftwareSiteAndTeam('sw-1');
      expect(result).toEqual({ site: 'SUW', teamId: 'team-1' });
    });

    it('존재하지 않는 이력에 NotFoundException을 던져야 한다', async () => {
      mockDb.select.mockReturnValue(createSelectChain([]));

      await expect(service.getSoftwareSiteAndTeam('nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
