import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { Permission } from '@equipment-management/shared-constants';
import type { ExtractedInspectionStructure } from '@equipment-management/schemas';
import { PERMISSIONS_KEY } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedRequest } from '../../../types/auth';
import {
  EquipmentInspectionTemplateController,
  InspectionTemplatesGalleryController,
} from '../inspection-form-templates.controller';
import { InspectionFormTemplatesService } from '../inspection-form-templates.service';
import { UpsertInspectionTemplateValidationPipe } from '../dto/upsert-template.dto';
import { GalleryQueryValidationPipe } from '../dto/gallery-query.dto';

const VALID_STRUCTURE: ExtractedInspectionStructure = {
  items: [{ checkItem: '온도 점검', checkCriteria: '20±2℃', checkResult: '', judgment: '' }],
  resultSections: [{ sortOrder: 0, sectionType: 'text', title: '비고' }],
  counts: { tables: 0, photos: 0, texts: 1 },
};

const CREATED_AT = new Date('2026-05-01T00:00:00.000Z');

type MockInspectionTemplateService = {
  getCurrentWithCreatorOrThrow: jest.Mock;
  upsertNewVersion: jest.Mock;
  findGallery: jest.Mock;
};

function getMethodPermissions(controller: object, methodName: string): Permission[] | undefined {
  const handler = Object.getPrototypeOf(controller)[methodName] as (...args: unknown[]) => unknown;
  return Reflect.getMetadata(PERMISSIONS_KEY, handler) as Permission[] | undefined;
}

describe('Inspection form template controllers', () => {
  let equipmentController: EquipmentInspectionTemplateController;
  let galleryController: InspectionTemplatesGalleryController;
  let service: MockInspectionTemplateService;

  beforeEach(async () => {
    service = {
      getCurrentWithCreatorOrThrow: jest.fn(),
      upsertNewVersion: jest.fn(),
      findGallery: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipmentInspectionTemplateController, InspectionTemplatesGalleryController],
      providers: [{ provide: InspectionFormTemplatesService, useValue: service }],
    }).compile();

    equipmentController = module.get(EquipmentInspectionTemplateController);
    galleryController = module.get(InspectionTemplatesGalleryController);
  });

  it('declares the expected permission boundary on every endpoint', () => {
    expect(getMethodPermissions(equipmentController, 'getLatest')).toEqual([
      Permission.VIEW_EQUIPMENT,
    ]);
    expect(getMethodPermissions(equipmentController, 'upsert')).toEqual([
      Permission.MANAGE_INSPECTION_TEMPLATE,
    ]);
    expect(getMethodPermissions(galleryController, 'getGallery')).toEqual([
      Permission.VIEW_EQUIPMENT,
    ]);
  });

  it('getLatest rejects invalid inspection type before reaching service', async () => {
    await expect(
      equipmentController.getLatest('550e8400-e29b-41d4-a716-446655440001', 'daily')
    ).rejects.toThrow(BadRequestException);
    expect(service.getCurrentWithCreatorOrThrow).not.toHaveBeenCalled();
  });

  it('getLatest maps service template to latest response shape', async () => {
    service.getCurrentWithCreatorOrThrow.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440101',
      equipmentId: '550e8400-e29b-41d4-a716-446655440001',
      inspectionType: 'intermediate',
      version: 3,
      structure: VALID_STRUCTURE,
      sourceInspectionId: '550e8400-e29b-41d4-a716-446655440201',
      createdBy: '550e8400-e29b-41d4-a716-446655440301',
      createdByName: '작성자',
      createdAt: CREATED_AT,
    });

    const result = await equipmentController.getLatest(
      '550e8400-e29b-41d4-a716-446655440001',
      'intermediate'
    );

    expect(service.getCurrentWithCreatorOrThrow).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440001',
      'intermediate'
    );
    expect(result).toEqual(
      expect.objectContaining({
        version: 3,
        inspectionType: 'intermediate',
        createdByName: '작성자',
        createdAt: CREATED_AT,
      })
    );
  });

  it('upsert validates body schema and forwards server-side actor metadata', async () => {
    const body = UpsertInspectionTemplateValidationPipe.transform(
      {
        inspectionType: 'self',
        version: 2,
        structure: VALID_STRUCTURE,
        forkChoice: 'apply_forward',
      },
      { type: 'body', metatype: undefined, data: undefined }
    );
    const req = {
      user: {
        userId: '550e8400-e29b-41d4-a716-446655440301',
        name: '품질책임자',
        roles: ['quality_manager'],
      },
    } as unknown as AuthenticatedRequest;
    service.upsertNewVersion.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440101',
      version: 2,
      inspectionType: 'self',
      createdAt: CREATED_AT,
    });

    const result = await equipmentController.upsert(
      '550e8400-e29b-41d4-a716-446655440001',
      body as Parameters<EquipmentInspectionTemplateController['upsert']>[1],
      req
    );

    expect(service.upsertNewVersion).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440001',
      body,
      '550e8400-e29b-41d4-a716-446655440301',
      '품질책임자',
      'quality_manager'
    );
    expect(result).toEqual({
      id: '550e8400-e29b-41d4-a716-446655440101',
      version: 2,
      inspectionType: 'self',
      createdAt: CREATED_AT,
    });
  });

  it('upsert validation rejects malformed structure before controller service call', () => {
    expect(() =>
      UpsertInspectionTemplateValidationPipe.transform(
        {
          inspectionType: 'self',
          version: 1,
          structure: { ...VALID_STRUCTURE, counts: { tables: -1, photos: 0, texts: 0 } },
        },
        { type: 'body', metatype: undefined, data: undefined }
      )
    ).toThrow(BadRequestException);
  });

  it('gallery query pipe coerces limit and controller maps gallery results', async () => {
    const query = GalleryQueryValidationPipe.transform(
      { inspectionType: 'intermediate', modelName: ' E5071C ', limit: '3' },
      { type: 'query', metatype: undefined, data: undefined }
    );
    service.findGallery.mockResolvedValue([
      {
        template: {
          id: '550e8400-e29b-41d4-a716-446655440101',
          equipmentId: '550e8400-e29b-41d4-a716-446655440001',
          inspectionType: 'intermediate',
          version: 4,
          structure: VALID_STRUCTURE,
          createdAt: CREATED_AT,
        },
        matchReason: 'modelName',
        modelName: 'E5071C',
        equipmentName: '네트워크 분석기',
      },
    ]);

    const result = await galleryController.getGallery(
      query as Parameters<InspectionTemplatesGalleryController['getGallery']>[0]
    );

    expect(service.findGallery).toHaveBeenCalledWith({
      inspectionType: 'intermediate',
      modelName: 'E5071C',
      limit: 3,
    });
    expect(result.items).toEqual([
      expect.objectContaining({
        matchReason: 'modelName',
        modelName: 'E5071C',
        equipmentName: '네트워크 분석기',
      }),
    ]);
  });
});
