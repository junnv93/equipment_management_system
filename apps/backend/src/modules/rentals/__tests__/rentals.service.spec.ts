import { Test, TestingModule } from '@nestjs/testing';
import { RentalsService } from '../rentals.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { EquipmentService } from '../../equipment/equipment.service';
import { TeamsService } from '../../teams/teams.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('RentalsService', () => {
  let service: RentalsService;

  // Mock dependencies
  const mockDrizzle = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    deleteByPattern: jest.fn(),
    getOrSet: jest.fn(),
  };

  const mockEquipmentService = {
    findOne: jest.fn(),
    updateStatus: jest.fn(),
  };

  const mockTeamsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RentalsService,
        {
          provide: 'DRIZZLE_INSTANCE',
          useValue: mockDrizzle,
        },
        {
          provide: SimpleCacheService,
          useValue: mockCacheService,
        },
        {
          provide: EquipmentService,
          useValue: mockEquipmentService,
        },
        {
          provide: TeamsService,
          useValue: mockTeamsService,
        },
      ],
    }).compile();

    service = module.get<RentalsService>(RentalsService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a loan by id', async () => {
      const mockLoan = {
        id: 'test-loan-id',
        equipmentId: 'test-equipment-id',
        borrowerId: 'test-borrower-id',
        status: 'pending',
      };

      // Mock the cache to call the factory function directly
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });

      // Mock the drizzle select chain
      mockDrizzle.limit.mockResolvedValue([mockLoan]);

      const result = await service.findOne('test-loan-id');

      expect(result).toBeDefined();
      expect(result.id).toBe('test-loan-id');
    });

    it('should throw NotFoundException when loan not found', async () => {
      mockCacheService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });

      mockDrizzle.limit.mockResolvedValue([]);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('approve', () => {
    it('should approve a pending loan', async () => {
      const mockLoan = {
        id: 'test-loan-id',
        equipmentId: 'test-equipment-id',
        borrowerId: 'test-borrower-id',
        status: 'pending',
      };

      const approvedLoan = {
        ...mockLoan,
        status: 'approved',
        approverId: 'test-approver-id',
        approverComment: '승인합니다',
        autoApproved: false,
      };

      // Mock findOne to return pending loan
      jest.spyOn(service, 'findOne').mockResolvedValue(mockLoan as any);

      // Mock checkTeamPermission to pass
      mockEquipmentService.findOne.mockResolvedValue({
        teamId: 'test-team-id',
      });

      // Mock update
      mockDrizzle.returning.mockResolvedValue([approvedLoan]);

      const result = await service.approve('test-loan-id', 'test-approver-id', 'test-team-id', {
        comment: '승인합니다',
      });

      expect(result.status).toBe('approved');
      expect(result.approverId).toBe('test-approver-id');
      expect(result.approverComment).toBe('승인합니다');
    });

    it('should throw BadRequestException when approving non-pending loan', async () => {
      const mockLoan = {
        id: 'test-loan-id',
        equipmentId: 'test-equipment-id',
        borrowerId: 'test-borrower-id',
        status: 'approved', // Already approved
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockLoan as any);

      await expect(
        service.approve('test-loan-id', 'test-approver-id', 'test-team-id')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reject', () => {
    it('should reject a pending loan with reason', async () => {
      const mockLoan = {
        id: 'test-loan-id',
        equipmentId: 'test-equipment-id',
        borrowerId: 'test-borrower-id',
        status: 'pending',
      };

      const rejectedLoan = {
        ...mockLoan,
        status: 'rejected',
        approverId: 'test-approver-id',
        rejectionReason: '장비 사용 불가',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockLoan as any);
      mockDrizzle.returning.mockResolvedValue([rejectedLoan]);

      const result = await service.reject('test-loan-id', 'test-approver-id', '장비 사용 불가');

      expect(result.status).toBe('rejected');
      expect(result.rejectionReason).toBe('장비 사용 불가');
    });

    it('should throw BadRequestException when rejecting without reason', async () => {
      const mockLoan = {
        id: 'test-loan-id',
        status: 'pending',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockLoan as any);

      await expect(service.reject('test-loan-id', 'test-approver-id', '')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('cancel', () => {
    it('should cancel a pending loan', async () => {
      const mockLoan = {
        id: 'test-loan-id',
        status: 'pending',
      };

      const canceledLoan = {
        ...mockLoan,
        status: 'canceled',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockLoan as any);
      mockDrizzle.returning.mockResolvedValue([canceledLoan]);

      const result = await service.cancel('test-loan-id');

      expect(result.status).toBe('canceled');
    });

    it('should throw BadRequestException when canceling non-pending loan', async () => {
      const mockLoan = {
        id: 'test-loan-id',
        status: 'approved',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockLoan as any);

      await expect(service.cancel('test-loan-id')).rejects.toThrow(BadRequestException);
    });
  });

  describe('isSameTeam (auto-approval)', () => {
    it('should return true when borrower team matches equipment team', async () => {
      mockEquipmentService.findOne.mockResolvedValue({
        teamId: 'same-team-id',
      });

      // Access the private method using bracket notation for testing
      const isSameTeam = await (service as any).isSameTeam('test-equipment-id', 'same-team-id');

      expect(isSameTeam).toBe(true);
    });

    it('should return false when borrower team does not match equipment team', async () => {
      mockEquipmentService.findOne.mockResolvedValue({
        teamId: 'different-team-id',
      });

      const isSameTeam = await (service as any).isSameTeam('test-equipment-id', 'other-team-id');

      expect(isSameTeam).toBe(false);
    });

    it('should return false when borrower team is not provided', async () => {
      const isSameTeam = await (service as any).isSameTeam('test-equipment-id', undefined);

      expect(isSameTeam).toBe(false);
    });
  });
});
