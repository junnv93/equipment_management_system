import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InspectionFormTemplatesService } from '../inspection-form-templates.service';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { AuditService } from '../../audit/audit.service';
import { createMockCacheService } from '../../../common/testing/mock-providers';
import { CACHE_EVENTS } from '../../../common/cache/cache-events';
import type { ExtractedInspectionStructure } from '@equipment-management/schemas';

const VALID_STRUCTURE: ExtractedInspectionStructure = {
  items: [{ checkItem: '온도 점검', checkCriteria: '20±2℃', checkResult: '', judgment: '' }],
  resultSections: [{ sortOrder: 0, sectionType: 'text', title: '비고' }],
  counts: { tables: 0, photos: 0, texts: 1 },
};

const MOCK_TEMPLATE = {
  id: 'tmpl-uuid-1',
  equipmentId: 'eq-uuid-1',
  inspectionType: 'intermediate' as const,
  version: 1,
  structure: VALID_STRUCTURE,
  sourceInspectionId: 'insp-uuid-1',
  supersededBy: null,
  createdBy: null,
  createdAt: new Date('2026-05-01'),
  deletedAt: null,
};

describe('InspectionFormTemplatesService', () => {
  let service: InspectionFormTemplatesService;
  let mockCacheService: ReturnType<typeof createMockCacheService>;
  let mockEventEmitter: { emitAsync: jest.Mock };
  let mockAuditService: { create: jest.Mock };
  let mockDb: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    transaction: jest.Mock;
  };

  const createSelectChain = (value: unknown): Record<string, jest.Mock> => {
    const chain: Record<string, jest.Mock> = {};
    for (const m of ['select', 'from', 'where', 'limit', 'innerJoin', 'orderBy']) {
      chain[m] = jest.fn().mockReturnValue(chain);
    }
    (chain as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
      resolve(Array.isArray(value) ? value : [value]);
    return chain;
  };

  beforeEach(async () => {
    mockCacheService = createMockCacheService();
    mockEventEmitter = { emitAsync: jest.fn().mockResolvedValue([]) };
    mockAuditService = { create: jest.fn().mockResolvedValue(undefined) };

    mockDb = {
      select: jest.fn(),
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([MOCK_TEMPLATE]),
        }),
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      }),
      transaction: jest.fn().mockImplementation((fn: (tx: unknown) => unknown) => fn(mockDb)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InspectionFormTemplatesService,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
        { provide: SimpleCacheService, useValue: mockCacheService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<InspectionFormTemplatesService>(InspectionFormTemplatesService);
  });

  it('서비스가 정의되어야 한다', () => {
    expect(service).toBeDefined();
  });

  describe('findCurrent()', () => {
    it('현재 template이 존재하면 반환한다', async () => {
      mockDb.select.mockReturnValueOnce(createSelectChain([MOCK_TEMPLATE]));
      const result = await service.findCurrent('eq-uuid-1', 'intermediate');
      expect(result?.id).toBe('tmpl-uuid-1');
    });

    it('부재 시 null을 반환한다', async () => {
      mockDb.select.mockReturnValueOnce(createSelectChain([]));
      const result = await service.findCurrent('eq-uuid-1', 'intermediate');
      expect(result).toBeNull();
    });
  });

  describe('getCurrentOrThrow()', () => {
    it('부재 시 NotFoundException을 던진다', async () => {
      mockDb.select.mockReturnValueOnce(createSelectChain([]));
      await expect(service.getCurrentOrThrow('eq-uuid-1', 'intermediate')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('autoCreateIfAbsent()', () => {
    it('이미 template 존재 시 silent skip', async () => {
      mockDb.select.mockReturnValueOnce(createSelectChain([MOCK_TEMPLATE]));
      const result = await service.autoCreateIfAbsent({
        equipmentId: 'eq-uuid-1',
        inspectionType: 'intermediate',
        structure: VALID_STRUCTURE,
        sourceInspectionId: 'insp-2',
        triggerActorUserId: 'user-1',
      });
      expect(result).toBeNull();
      expect(mockDb.insert).not.toHaveBeenCalled();
      expect(mockEventEmitter.emitAsync).not.toHaveBeenCalled();
    });

    it('부재 시 새 template 생성 + cache event + audit log', async () => {
      mockDb.select.mockReturnValueOnce(createSelectChain([])); // findCurrent → 없음
      const result = await service.autoCreateIfAbsent({
        equipmentId: 'eq-uuid-1',
        inspectionType: 'intermediate',
        structure: VALID_STRUCTURE,
        sourceInspectionId: 'insp-1',
        triggerActorUserId: 'user-1',
      });
      expect(result?.id).toBe('tmpl-uuid-1');
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith(
        CACHE_EVENTS.INSPECTION_TEMPLATE_CREATED,
        expect.objectContaining({
          templateId: 'tmpl-uuid-1',
          equipmentId: 'eq-uuid-1',
          inspectionType: 'intermediate',
          version: 1,
        })
      );
      expect(mockAuditService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'create',
          entityType: 'inspection_form_template',
          userRole: 'system',
        })
      );
    });

    it('zod 검증 실패 시 throws', async () => {
      mockDb.select.mockReturnValueOnce(createSelectChain([]));
      const invalidStructure = { ...VALID_STRUCTURE, counts: { tables: -1, photos: 0, texts: 0 } };
      await expect(
        service.autoCreateIfAbsent({
          equipmentId: 'eq-uuid-1',
          inspectionType: 'intermediate',
          structure: invalidStructure as ExtractedInspectionStructure,
          sourceInspectionId: 'insp-1',
          triggerActorUserId: null,
        })
      ).rejects.toThrow();
    });
  });

  describe('upsertNewVersion()', () => {
    const validInput = {
      inspectionType: 'intermediate' as const,
      version: 2,
      structure: VALID_STRUCTURE,
      supersededBy: 'tmpl-uuid-1',
      sourceInspectionId: 'insp-2',
      forkChoice: 'apply_forward' as const,
    };

    it('장비 부재 시 NotFoundException', async () => {
      mockDb.select.mockReturnValueOnce(createSelectChain([])); // equipment lookup
      await expect(
        service.upsertNewVersion('eq-uuid-1', validInput, 'user-1', 'Test Admin', 'system_admin')
      ).rejects.toThrow(NotFoundException);
    });

    it('supersededBy 불일치 시 BadRequestException (CAS 보호)', async () => {
      mockDb.select
        .mockReturnValueOnce(createSelectChain([{ id: 'eq-uuid-1' }])) // equipment
        .mockReturnValueOnce(createSelectChain([{ ...MOCK_TEMPLATE, id: 'OTHER-TEMPLATE' }])); // current

      await expect(
        service.upsertNewVersion(
          'eq-uuid-1',
          { ...validInput, supersededBy: 'tmpl-uuid-1' }, // current.id가 OTHER이므로 mismatch
          'user-1',
          'Test Admin',
          'system_admin'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('version 불일치 시 BadRequestException', async () => {
      mockDb.select
        .mockReturnValueOnce(createSelectChain([{ id: 'eq-uuid-1' }]))
        .mockReturnValueOnce(createSelectChain([MOCK_TEMPLATE])); // version=1

      await expect(
        service.upsertNewVersion(
          'eq-uuid-1',
          { ...validInput, version: 5 }, // expected = 2
          'user-1',
          'Test Admin',
          'system_admin'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('정상 흐름: version+1 + supersededBy 체이닝 + cache event + audit', async () => {
      mockDb.select
        .mockReturnValueOnce(createSelectChain([{ id: 'eq-uuid-1' }]))
        .mockReturnValueOnce(createSelectChain([MOCK_TEMPLATE]));

      mockDb.insert.mockReturnValueOnce({
        values: jest.fn().mockReturnValue({
          returning: jest
            .fn()
            .mockResolvedValue([{ ...MOCK_TEMPLATE, id: 'tmpl-uuid-2', version: 2 }]),
        }),
      });

      const result = await service.upsertNewVersion(
        'eq-uuid-1',
        validInput,
        'user-1',
        'Test Admin',
        'system_admin'
      );

      expect(result.id).toBe('tmpl-uuid-2');
      expect(result.version).toBe(2);
      expect(mockEventEmitter.emitAsync).toHaveBeenCalledWith(
        CACHE_EVENTS.INSPECTION_TEMPLATE_VERSION_UP,
        expect.objectContaining({ templateId: 'tmpl-uuid-2', version: 2 })
      );
      expect(mockAuditService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'update',
          entityType: 'inspection_form_template',
          // 자기감사 수정: userName 하드코딩 제거 + UserRoleEnum.safeParse 검증
          userName: 'Test Admin',
          userRole: 'system_admin',
          details: expect.objectContaining({
            additionalInfo: expect.objectContaining({ forkChoice: 'apply_forward' }),
          }),
        })
      );
    });

    it('actorRole이 UserRole enum 외 값이면 audit userRole=unknown', async () => {
      mockDb.select
        .mockReturnValueOnce(createSelectChain([{ id: 'eq-uuid-1' }]))
        .mockReturnValueOnce(createSelectChain([MOCK_TEMPLATE]));
      mockDb.insert.mockReturnValueOnce({
        values: jest.fn().mockReturnValue({
          returning: jest
            .fn()
            .mockResolvedValue([{ ...MOCK_TEMPLATE, id: 'tmpl-uuid-2', version: 2 }]),
        }),
      });

      await service.upsertNewVersion(
        'eq-uuid-1',
        validInput,
        'user-1',
        'Test User',
        'INVALID_ROLE_X' // 부적합 role — type cast `as 'system_admin'` 시 오답이었음
      );

      expect(mockAuditService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userName: 'Test User',
          userRole: 'unknown', // safeParse 실패 → 'unknown' (정확한 fallback)
        })
      );
    });

    it('actorName이 null이면 audit userName=unknown (system이 아님 — userId가 있음)', async () => {
      mockDb.select
        .mockReturnValueOnce(createSelectChain([{ id: 'eq-uuid-1' }]))
        .mockReturnValueOnce(createSelectChain([MOCK_TEMPLATE]));
      mockDb.insert.mockReturnValueOnce({
        values: jest.fn().mockReturnValue({
          returning: jest
            .fn()
            .mockResolvedValue([{ ...MOCK_TEMPLATE, id: 'tmpl-uuid-2', version: 2 }]),
        }),
      });

      await service.upsertNewVersion('eq-uuid-1', validInput, 'user-1', null, 'system_admin');

      expect(mockAuditService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userName: 'unknown',
          userRole: 'system_admin',
        })
      );
    });

    it('unique constraint 충돌 시 ConflictException (CAS 409)', async () => {
      mockDb.select
        .mockReturnValueOnce(createSelectChain([{ id: 'eq-uuid-1' }]))
        .mockReturnValueOnce(createSelectChain([MOCK_TEMPLATE]));

      mockDb.insert.mockReturnValueOnce({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue({ code: '23505' }), // PG unique violation
        }),
      });

      await expect(
        service.upsertNewVersion('eq-uuid-1', validInput, 'user-1', 'Test Admin', 'system_admin')
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findGallery()', () => {
    it('modelName/classificationCode가 없으면 DB 조회 없이 빈 배열', async () => {
      const result = await service.findGallery({
        inspectionType: 'intermediate',
      });

      expect(result).toEqual([]);
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it('modelName 정확 일치 priority=2', async () => {
      mockDb.select.mockReturnValueOnce(
        createSelectChain([
          {
            template: MOCK_TEMPLATE,
            equipModelName: 'Model-X',
            equipClassificationCode: 'E',
            equipName: 'Test Equipment',
          },
        ])
      );
      const result = await service.findGallery({
        inspectionType: 'intermediate',
        modelName: 'Model-X',
      });
      expect(result).toHaveLength(1);
      expect(result[0].matchReason).toBe('modelName');
    });

    it('classificationCode fallback', async () => {
      mockDb.select.mockReturnValueOnce(
        createSelectChain([
          {
            template: MOCK_TEMPLATE,
            equipModelName: 'Other-Model',
            equipClassificationCode: 'E',
            equipName: 'Test Equipment',
          },
        ])
      );
      const result = await service.findGallery({
        inspectionType: 'intermediate',
        classificationCode: 'E',
      });
      expect(result).toHaveLength(1);
      expect(result[0].matchReason).toBe('classificationCode');
    });

    it('매칭 안되면 빈 배열', async () => {
      mockDb.select.mockReturnValueOnce(
        createSelectChain([
          {
            template: MOCK_TEMPLATE,
            equipModelName: 'Other',
            equipClassificationCode: 'X',
            equipName: 'Test',
          },
        ])
      );
      const result = await service.findGallery({
        inspectionType: 'intermediate',
        modelName: 'Different',
        classificationCode: 'Y',
      });
      expect(result).toEqual([]);
    });
  });
});
