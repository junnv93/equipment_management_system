import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { SelfInspectionsService } from '../self-inspections.service';

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
  status: 'completed',
  confirmedBy: null,
  confirmedAt: null,
  version: 1,
  createdAt: new Date('2026-01-15'),
  updatedAt: new Date('2026-01-15'),
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
// Tests
// ---------------------------------------------------------------------------
describe('SelfInspectionsService', () => {
  let service: SelfInspectionsService;
  let mockDb: Record<string, unknown>;
  let chain: ReturnType<typeof createDrizzleChain>;

  beforeEach(async () => {
    chain = createDrizzleChain([MOCK_INSPECTION]);

    mockDb = {
      select: jest.fn().mockReturnValue(chain),
      insert: jest.fn().mockReturnValue(chain),
      update: jest.fn().mockReturnValue(chain),
      delete: jest.fn().mockReturnValue(chain),
      transaction: jest
        .fn()
        .mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(mockDb)),
      query: {
        equipment: { findFirst: jest.fn() },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SelfInspectionsService, { provide: 'DRIZZLE_INSTANCE', useValue: mockDb }],
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
      // equipment lookup returns a row
      (mockDb.select as jest.Mock).mockReturnValueOnce(createDrizzleChain([MOCK_EQUIPMENT]));
      // inside transaction: insert inspection → returning
      const txInsertChain = createDrizzleChain([MOCK_INSPECTION]);
      // inside transaction: insert items → returning
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

    it('should update inspection with CAS', async () => {
      const updatedInspection = { ...MOCK_INSPECTION, overallResult: 'fail', version: 2 };
      // findById: select inspection, select items
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(createDrizzleChain([MOCK_INSPECTION]))
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));
      // transaction: update returning, then select items
      (mockDb.update as jest.Mock).mockReturnValueOnce(createDrizzleChain([updatedInspection]));
      // items re-fetch inside tx
      (mockDb.select as jest.Mock).mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));

      const result = await service.update(INSPECTION_ID, updateDto, USER_ID);

      expect(result.version).toBe(2);
    });

    it('should throw ConflictException on version mismatch', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(createDrizzleChain([{ ...MOCK_INSPECTION, version: 2 }]))
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));

      await expect(
        service.update(INSPECTION_ID, { ...updateDto, version: 1 }, USER_ID)
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException when already confirmed', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(createDrizzleChain([{ ...MOCK_INSPECTION, status: 'confirmed' }]))
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));

      await expect(service.update(INSPECTION_ID, updateDto, USER_ID)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  // -----------------------------------------------------------------------
  // confirm()
  // -----------------------------------------------------------------------
  describe('confirm()', () => {
    it('should confirm a completed inspection', async () => {
      const confirmedInspection = {
        ...MOCK_INSPECTION,
        status: 'confirmed',
        confirmedBy: USER_ID,
        version: 2,
      };
      // findById
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(createDrizzleChain([MOCK_INSPECTION]))
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));
      // update
      (mockDb.update as jest.Mock).mockReturnValueOnce(createDrizzleChain([confirmedInspection]));
      // items refetch
      (mockDb.select as jest.Mock).mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));

      const result = await service.confirm(INSPECTION_ID, USER_ID, 1);

      expect(result.status).toBe('confirmed');
      expect(result.confirmedBy).toBe(USER_ID);
    });

    it('should throw BadRequestException when already confirmed', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(createDrizzleChain([{ ...MOCK_INSPECTION, status: 'confirmed' }]))
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));

      await expect(service.confirm(INSPECTION_ID, USER_ID, 1)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when status is not completed', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(createDrizzleChain([{ ...MOCK_INSPECTION, status: 'draft' }]))
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));

      await expect(service.confirm(INSPECTION_ID, USER_ID, 1)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException on version mismatch', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(createDrizzleChain([MOCK_INSPECTION]))
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));

      await expect(service.confirm(INSPECTION_ID, USER_ID, 999)).rejects.toThrow(ConflictException);
    });
  });

  // -----------------------------------------------------------------------
  // delete()
  // -----------------------------------------------------------------------
  describe('delete()', () => {
    it('should delete a non-confirmed inspection', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(createDrizzleChain([MOCK_INSPECTION]))
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));

      await expect(service.delete(INSPECTION_ID)).resolves.toBeUndefined();
    });

    it('should throw BadRequestException when confirmed', async () => {
      (mockDb.select as jest.Mock)
        .mockReturnValueOnce(createDrizzleChain([{ ...MOCK_INSPECTION, status: 'confirmed' }]))
        .mockReturnValueOnce(createDrizzleChain(MOCK_ITEMS));

      await expect(service.delete(INSPECTION_ID)).rejects.toThrow(BadRequestException);
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
