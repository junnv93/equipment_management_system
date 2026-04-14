import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { SelfInspectionsService } from '../self-inspections.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { createMockCacheService } from '../../../common/testing/mock-providers';

// ---------------------------------------------------------------------------
// Drizzle ORM chain mock
// ---------------------------------------------------------------------------
const createDrizzleChain = (finalValue: unknown): Record<string, jest.Mock> => {
  const chain: Record<string, jest.Mock> = {};
  const methods = [
    'select',
    'from',
    'where',
    'groupBy',
    'orderBy',
    'limit',
    'offset',
    'leftJoin',
    'innerJoin',
    'insert',
    'values',
    'returning',
    'update',
    'set',
    'delete',
  ];
  for (const m of methods) {
    chain[m] = jest.fn().mockReturnValue(chain);
  }
  chain.returning.mockResolvedValue(finalValue);
  (chain as Record<string, unknown>).then = (resolve: (v: unknown) => void) => resolve(finalValue);
  return chain;
};

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const EQUIPMENT_ID = 'eq-uuid-1';
const INSPECTION_ID = 'insp-uuid-1';
const USER_ID = 'user-uuid-1';
const OTHER_USER_ID = 'user-uuid-2';

const MOCK_EQUIPMENT = { id: EQUIPMENT_ID };

const MOCK_INSPECTION = {
  id: INSPECTION_ID,
  equipmentId: EQUIPMENT_ID,
  inspectorId: USER_ID,
  inspectionDate: new Date('2026-01-15'),
  appearance: 'pass',
  functionality: 'pass',
  safety: 'pass',
  calibrationStatus: 'pass',
  overallResult: 'pass',
  remarks: null,
  specialNotes: null,
  inspectionCycle: 6,
  nextInspectionDate: '2026-07-15',
  approvalStatus: 'draft',
  submittedBy: null,
  submittedAt: null,
  approvedBy: null,
  approvedAt: null,
  rejectedBy: null,
  rejectedAt: null,
  rejectionReason: null,
  createdBy: USER_ID,
  version: 1,
  createdAt: new Date('2026-01-15'),
  updatedAt: new Date('2026-01-15'),
};

const MOCK_INSPECTION_SUBMITTED = {
  ...MOCK_INSPECTION,
  approvalStatus: 'submitted',
  submittedBy: USER_ID,
  submittedAt: new Date('2026-01-16'),
  version: 2,
};

const MOCK_ITEMS = [
  {
    id: 'item-uuid-1',
    inspectionId: INSPECTION_ID,
    itemNumber: 1,
    checkItem: '외관 검사',
    checkResult: 'pass',
  },
  {
    id: 'item-uuid-2',
    inspectionId: INSPECTION_ID,
    itemNumber: 2,
    checkItem: '기능 점검',
    checkResult: 'pass',
  },
];

// ---------------------------------------------------------------------------
// SimpleCacheService mock
// ---------------------------------------------------------------------------
const mockCacheService = createMockCacheService();

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('SelfInspectionsService', () => {
  let service: SelfInspectionsService;
  let mockDb: Record<string, unknown>;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockDb = {
      select: jest.fn().mockReturnValue(createDrizzleChain([MOCK_INSPECTION])),
      insert: jest.fn().mockReturnValue(createDrizzleChain([MOCK_INSPECTION])),
      update: jest.fn().mockReturnValue(createDrizzleChain([MOCK_INSPECTION])),
      delete: jest.fn().mockReturnValue(createDrizzleChain([])),
      transaction: jest
        .fn()
        .mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(mockDb)),
      query: {
        equipment: { findFirst: jest.fn() },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SelfInspectionsService,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
        { provide: SimpleCacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<SelfInspectionsService>(SelfInspectionsService);
  });

  // -----------------------------------------------------------------------
  // create()
  // -----------------------------------------------------------------------
  describe('create()', () => {
    const dto = {
      inspectionDate: '2026-01-15',
      overallResult: 'pass' as const,
      inspectionCycle: 6,
      items: [
        { itemNumber: 1, checkItem: '외관 검사', checkResult: 'pass' as const },
        { itemNumber: 2, checkItem: '기능 점검', checkResult: 'pass' as const },
      ],
    };

    it('should create self-inspection with items', async () => {
      (mockDb.select as jest.Mock).mockReturnValueOnce(createDrizzleChain([MOCK_EQUIPMENT]));
      const txInsertChain = createDrizzleChain([MOCK_INSPECTION]);
      const txItemsChain = createDrizzleChain(MOCK_ITEMS);
      (mockDb.insert as jest.Mock)
        .mockReturnValueOnce(txInsertChain)
        .mockReturnValueOnce(txItemsChain);

      const result = await service.create(EQUIPMENT_ID, dto, USER_ID);

      expect(result).toBeDefined();
      expect(result.id).toBe(INSPECTION_ID);
      expect(result.items).toEqual(MOCK_ITEMS);
    });

    it('should throw NotFoundException when equipment does not exist', async () => {
      (mockDb.select as jest.Mock).mockReturnValueOnce(createDrizzleChain([]));

      await expect(service.create(EQUIPMENT_ID, dto, USER_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------------------------------------------------
  // findById()
  // -----------------------------------------------------------------------
  describe('findById()', () => {
    it('should return inspection with items', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(createDrizzleChain([MOCK_INSPECTION]))
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));

      const result = await service.findById(INSPECTION_ID);

      expect(result.id).toBe(INSPECTION_ID);
      expect(result.items).toEqual(MOCK_ITEMS);
    });

    it('should throw NotFoundException when not found', async () => {
      (mockDb.select as jest.Mock).mockReturnValueOnce(createDrizzleChain([]));

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------------------------------------------------
  // findByEquipment()
  // -----------------------------------------------------------------------
  describe('findByEquipment()', () => {
    it('should return paginated inspections with items', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(createDrizzleChain([MOCK_INSPECTION]))
        .mockReturnValueOnce(createDrizzleChain([{ count: 1 }]))
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));

      const result = await service.findByEquipment(EQUIPMENT_ID);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should skip items query when no inspections found', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(createDrizzleChain([]))
        .mockReturnValueOnce(createDrizzleChain([{ count: 0 }]));

      const result = await service.findByEquipment(EQUIPMENT_ID);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // update()
  // -----------------------------------------------------------------------
  describe('update()', () => {
    const updateDto = {
      version: 1,
      overallResult: 'fail' as const,
    };

    it('should update draft inspection with CAS', async () => {
      const updatedInspection = { ...MOCK_INSPECTION, overallResult: 'fail', version: 2 };
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(createDrizzleChain([MOCK_INSPECTION]))
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));
      (mockDb.update as jest.Mock).mockReturnValueOnce(createDrizzleChain([updatedInspection]));
      (mockDb.select as jest.Mock).mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));

      const result = await service.update(INSPECTION_ID, updateDto, USER_ID);

      expect(result.version).toBe(2);
    });

    it('should throw ConflictException on version mismatch', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(createDrizzleChain([{ ...MOCK_INSPECTION, version: 2 }]))
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));
      (mockDb.update as jest.Mock).mockReturnValueOnce(createDrizzleChain([]));
      (mockDb.select as jest.Mock).mockReturnValueOnce(
        createDrizzleChain([{ id: INSPECTION_ID, version: 2 }])
      );

      await expect(
        service.update(INSPECTION_ID, { ...updateDto, version: 1 }, USER_ID)
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException when not in draft status', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(
          createDrizzleChain([{ ...MOCK_INSPECTION, approvalStatus: 'submitted' }])
        )
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));

      await expect(service.update(INSPECTION_ID, updateDto, USER_ID)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  // -----------------------------------------------------------------------
  // submit() — draft → submitted
  // -----------------------------------------------------------------------
  describe('submit()', () => {
    it('should submit a draft inspection', async () => {
      const submittedInspection = { ...MOCK_INSPECTION_SUBMITTED };
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(createDrizzleChain([MOCK_INSPECTION]))
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));
      (mockDb.update as jest.Mock).mockReturnValueOnce(createDrizzleChain([submittedInspection]));
      (mockDb.select as jest.Mock).mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));

      const result = await service.submit(INSPECTION_ID, 1, USER_ID);

      expect(result.approvalStatus).toBe('submitted');
      expect(result.submittedBy).toBe(USER_ID);
    });

    it('should throw BadRequestException when not in draft status', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(createDrizzleChain([MOCK_INSPECTION_SUBMITTED]))
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));

      await expect(service.submit(INSPECTION_ID, 2, USER_ID)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException on version mismatch', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(createDrizzleChain([MOCK_INSPECTION]))
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));
      (mockDb.update as jest.Mock).mockReturnValueOnce(createDrizzleChain([]));
      (mockDb.select as jest.Mock).mockReturnValueOnce(
        createDrizzleChain([{ id: INSPECTION_ID, version: 1 }])
      );

      await expect(service.submit(INSPECTION_ID, 999, USER_ID)).rejects.toThrow(ConflictException);
    });
  });

  // -----------------------------------------------------------------------
  // withdraw() — submitted → draft (제출자만)
  // -----------------------------------------------------------------------
  describe('withdraw()', () => {
    it('should withdraw a submitted inspection by the submitter', async () => {
      const draftInspection = { ...MOCK_INSPECTION };
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(createDrizzleChain([MOCK_INSPECTION_SUBMITTED]))
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));
      (mockDb.update as jest.Mock).mockReturnValueOnce(createDrizzleChain([draftInspection]));
      (mockDb.select as jest.Mock).mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));

      const result = await service.withdraw(INSPECTION_ID, 2, USER_ID);

      expect(result.approvalStatus).toBe('draft');
    });

    it('should throw ForbiddenException when not the submitter', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(createDrizzleChain([MOCK_INSPECTION_SUBMITTED]))
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));

      await expect(service.withdraw(INSPECTION_ID, 2, OTHER_USER_ID)).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw BadRequestException when not in submitted status', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(createDrizzleChain([MOCK_INSPECTION]))
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));

      await expect(service.withdraw(INSPECTION_ID, 1, USER_ID)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  // -----------------------------------------------------------------------
  // approve() — submitted → approved
  // -----------------------------------------------------------------------
  describe('approve()', () => {
    it('should approve a submitted inspection', async () => {
      const approvedInspection = {
        ...MOCK_INSPECTION_SUBMITTED,
        approvalStatus: 'approved',
        approvedBy: OTHER_USER_ID,
        approvedAt: new Date(),
        version: 3,
      };
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(createDrizzleChain([MOCK_INSPECTION_SUBMITTED]))
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));
      (mockDb.update as jest.Mock).mockReturnValueOnce(createDrizzleChain([approvedInspection]));
      (mockDb.select as jest.Mock).mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));

      const result = await service.approve(INSPECTION_ID, 2, OTHER_USER_ID);

      expect(result.approvalStatus).toBe('approved');
      expect(result.approvedBy).toBe(OTHER_USER_ID);
    });

    it('should throw BadRequestException when not in submitted status', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(createDrizzleChain([MOCK_INSPECTION]))
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));

      await expect(service.approve(INSPECTION_ID, 1, OTHER_USER_ID)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  // -----------------------------------------------------------------------
  // reject() — submitted → rejected
  // -----------------------------------------------------------------------
  describe('reject()', () => {
    it('should reject a submitted inspection with a reason', async () => {
      const rejectedInspection = {
        ...MOCK_INSPECTION_SUBMITTED,
        approvalStatus: 'rejected',
        rejectedBy: OTHER_USER_ID,
        rejectedAt: new Date(),
        rejectionReason: '점검 항목 누락',
        version: 3,
      };
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(createDrizzleChain([MOCK_INSPECTION_SUBMITTED]))
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));
      (mockDb.update as jest.Mock).mockReturnValueOnce(createDrizzleChain([rejectedInspection]));
      (mockDb.select as jest.Mock).mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));

      const result = await service.reject(INSPECTION_ID, 2, OTHER_USER_ID, '점검 항목 누락');

      expect(result.approvalStatus).toBe('rejected');
      expect(result.rejectionReason).toBe('점검 항목 누락');
    });

    it('should throw BadRequestException when not in submitted status', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(createDrizzleChain([MOCK_INSPECTION]))
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));

      await expect(service.reject(INSPECTION_ID, 1, OTHER_USER_ID, '사유')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  // -----------------------------------------------------------------------
  // resubmit() — rejected → draft
  // -----------------------------------------------------------------------
  describe('resubmit()', () => {
    it('should resubmit a rejected inspection', async () => {
      const rejectedInspection = {
        ...MOCK_INSPECTION,
        approvalStatus: 'rejected',
        rejectedBy: OTHER_USER_ID,
        rejectionReason: '점검 항목 누락',
        version: 3,
      };
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(createDrizzleChain([rejectedInspection]))
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));
      (mockDb.update as jest.Mock).mockReturnValueOnce(createDrizzleChain([MOCK_INSPECTION]));
      (mockDb.select as jest.Mock).mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));

      const result = await service.resubmit(INSPECTION_ID, 3, USER_ID);

      expect(result.approvalStatus).toBe('draft');
    });

    it('should throw BadRequestException when not in rejected status', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(createDrizzleChain([MOCK_INSPECTION]))
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));

      await expect(service.resubmit(INSPECTION_ID, 1, USER_ID)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  // -----------------------------------------------------------------------
  // delete()
  // -----------------------------------------------------------------------
  describe('delete()', () => {
    it('should delete a draft inspection (allowApproved=false)', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(createDrizzleChain([MOCK_INSPECTION]))
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS))
        // transaction 내부: selfInspectionItems id 조회
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS.map((i) => ({ id: i.id }))));

      await expect(service.delete(INSPECTION_ID, false)).resolves.toBeUndefined();
    });

    it('should throw BadRequestException when approved and allowApproved=false', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(
          createDrizzleChain([{ ...MOCK_INSPECTION, approvalStatus: 'approved' }])
        )
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));

      await expect(service.delete(INSPECTION_ID, false)).rejects.toThrow(BadRequestException);
    });

    it('should delete an approved inspection when allowApproved=true', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(
          createDrizzleChain([{ ...MOCK_INSPECTION, approvalStatus: 'approved' }])
        )
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS))
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS.map((i) => ({ id: i.id }))));

      await expect(service.delete(INSPECTION_ID, true)).resolves.toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // getEquipmentSiteInfo()
  // -----------------------------------------------------------------------
  describe('getEquipmentSiteInfo()', () => {
    it('should return site info', async () => {
      (
        mockDb.query as Record<string, Record<string, jest.Mock>>
      ).equipment.findFirst.mockResolvedValue({
        site: 'suwon',
        teamId: 'team-uuid-1',
      });

      const result = await service.getEquipmentSiteInfo(EQUIPMENT_ID);

      expect(result.site).toBe('suwon');
    });

    it('should throw NotFoundException when equipment not found', async () => {
      (
        mockDb.query as Record<string, Record<string, jest.Mock>>
      ).equipment.findFirst.mockResolvedValue(null);

      await expect(service.getEquipmentSiteInfo(EQUIPMENT_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // -----------------------------------------------------------------------
  // getEquipmentSiteInfoBySelfInspectionId()
  // -----------------------------------------------------------------------
  describe('getEquipmentSiteInfoBySelfInspectionId()', () => {
    it('should return site info via join', async () => {
      (mockDb.select as jest.Mock).mockReturnValueOnce(
        createDrizzleChain([{ site: 'suwon', teamId: 'team-uuid-1' }])
      );

      const result = await service.getEquipmentSiteInfoBySelfInspectionId(INSPECTION_ID);

      expect(result.site).toBe('suwon');
    });

    it('should throw NotFoundException when not found', async () => {
      (mockDb.select as jest.Mock).mockReturnValueOnce(createDrizzleChain([]));

      await expect(service.getEquipmentSiteInfoBySelfInspectionId('non-existent')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
