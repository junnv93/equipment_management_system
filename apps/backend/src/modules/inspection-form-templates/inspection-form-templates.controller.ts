import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
  UsePipes,
} from '@nestjs/common';
import { Permission } from '@equipment-management/shared-constants';
import {
  INSPECTION_TYPE_VALUES,
  InspectionTypeEnum,
  type InspectionType,
  type InspectionTemplateLatestResponse,
  type UpsertInspectionTemplateResponse,
} from '@equipment-management/schemas';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import type { AuthenticatedRequest } from '../../types/auth';
import { InspectionFormTemplatesService } from './inspection-form-templates.service';
import {
  type UpsertInspectionTemplateInput,
  UpsertInspectionTemplateValidationPipe,
} from './dto/upsert-template.dto';
import { type GalleryQueryInput, GalleryQueryValidationPipe } from './dto/gallery-query.dto';

/**
 * Inspection Form Templates — equipment-scoped endpoints (Phase 1B-B)
 *
 * Routes:
 * - GET /api/equipment/:uuid/inspection-template/latest?type=intermediate|self
 *   → current template 조회 (장비 조회 권한자라면 누구나 — 양식은 장비 종속 자원)
 * - POST /api/equipment/:uuid/inspection-template
 *   → SoftFork apply_forward 또는 admin 명시 수정 (Permission.MANAGE_INSPECTION_TEMPLATE)
 *
 * 권한 정책 결정 (Phase 1B-B-3 자기감사 수정):
 * - 점검 양식(template)은 *장비의 종속 자원* — 장비를 볼 수 있는 사용자라면 양식 구조도 조회 가능.
 * - VIEW_EQUIPMENT 권한 사용 — 모든 점검 작성 role(test_engineer / technical_manager /
 *   quality_manager / lab_manager / system_admin)이 보유.
 * - 이전 (VIEW_CALIBRATIONS) 사용은 self-inspection 작성자가 거부될 수 있는 미스매치 (수정됨).
 */
@Controller('equipment')
export class EquipmentInspectionTemplateController {
  constructor(private readonly service: InspectionFormTemplatesService) {}

  /**
   * 현재 template 조회 — 부재 시 404. Frontend useLatestTemplate hook용.
   *
   * type 검증: INSPECTION_TYPE_VALUES SSOT 경유 (인라인 string 비교 금지).
   * 부적절한 type → BadRequestException + 명시적 error code.
   */
  /**
   * Response shape SSOT: `InspectionTemplateLatestResponse` (packages/schemas).
   * Frontend api client(`getLatestTemplate`)도 동일 schema로 parse — backend ↔ frontend 단일 정의.
   * createdAt은 Date 객체로 반환 — JSON 직렬화 시 ISO string (frontend Zod schema가 z.string() 검증).
   */
  @Get(':uuid/inspection-template/latest')
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  async getLatest(
    @Param('uuid', ParseUUIDPipe) equipmentId: string,
    @Query('type') type: string
  ): Promise<Omit<InspectionTemplateLatestResponse, 'createdAt'> & { createdAt: Date }> {
    const parsed = InspectionTypeEnum.safeParse(type);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'INVALID_INSPECTION_TYPE',
        message: `Invalid inspection type. Must be one of: ${INSPECTION_TYPE_VALUES.join(', ')}.`,
        received: type,
      });
    }
    const tpl = await this.service.getCurrentWithCreatorOrThrow(equipmentId, parsed.data);
    return {
      id: tpl.id,
      equipmentId: tpl.equipmentId,
      inspectionType: tpl.inspectionType,
      version: tpl.version,
      structure: tpl.structure as InspectionTemplateLatestResponse['structure'],
      sourceInspectionId: tpl.sourceInspectionId,
      createdBy: tpl.createdBy,
      createdByName: tpl.createdByName,
      createdAt: tpl.createdAt,
    };
  }

  /**
   * Template upsert (version+1) — SoftFork apply_forward 또는 admin 명시 수정.
   *
   * 권한: MANAGE_INSPECTION_TEMPLATE (quality_manager / lab_manager / system_admin).
   * 시스템 자동 호출(approve hook)은 controller 우회 — service.autoCreateIfAbsent 직접 호출.
   *
   * Server-side user extraction (Rule 2 보안): req.user.userId 사용, body 신뢰 금지.
   * audit log에 actor name + role 모두 정확히 주입 (UL-QP-18 §7.5 양식 통제 추적).
   */
  @Post(':uuid/inspection-template')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(Permission.MANAGE_INSPECTION_TEMPLATE)
  @UsePipes(UpsertInspectionTemplateValidationPipe)
  async upsert(
    @Param('uuid', ParseUUIDPipe) equipmentId: string,
    @Body() body: UpsertInspectionTemplateInput,
    @Request() req: AuthenticatedRequest
  ): Promise<Omit<UpsertInspectionTemplateResponse, 'createdAt'> & { createdAt: Date }> {
    const actorUserId = req.user?.userId ?? null;
    const actorName = req.user?.name ?? null;
    // JWT roles[]에서 첫 번째 역할 — audit log에 actorRole로 기록 (단일 role 가정)
    const actorRole = req.user?.roles?.[0] ?? null;
    const created = await this.service.upsertNewVersion(
      equipmentId,
      body,
      actorUserId,
      actorName,
      actorRole
    );
    return {
      id: created.id,
      version: created.version,
      inspectionType: created.inspectionType,
      createdAt: created.createdAt,
    };
  }
}

/**
 * Inspection Form Templates — gallery endpoint (Phase 1B-B)
 *
 * Route: GET /api/inspection-templates/gallery
 *   → 비슷한 장비의 검증된 template 목록 (장비 조회 권한자 모두 허용)
 */
@Controller('inspection-templates')
export class InspectionTemplatesGalleryController {
  constructor(private readonly service: InspectionFormTemplatesService) {}

  /**
   * Gallery 매칭 — 첫 점검 + template 부재인 장비를 위한 reference 목록.
   * 권한: VIEW_EQUIPMENT — 점검 양식은 장비의 종속 자원 (작성 흐름 위계와 일관).
   * 매칭 이유(matchReason)는 frontend chip 표시용.
   */
  @Get('gallery')
  @RequirePermissions(Permission.VIEW_EQUIPMENT)
  @UsePipes(GalleryQueryValidationPipe)
  async getGallery(@Query() query: GalleryQueryInput): Promise<{
    items: Array<{
      template: {
        id: string;
        equipmentId: string;
        inspectionType: InspectionType;
        version: number;
        structure: unknown;
        createdAt: Date;
      };
      matchReason: 'modelName' | 'classificationCode';
      modelName: string | null;
      equipmentName: string;
    }>;
  }> {
    const matched = await this.service.findGallery(query);
    return {
      items: matched.map((m) => ({
        template: {
          id: m.template.id,
          equipmentId: m.template.equipmentId,
          inspectionType: m.template.inspectionType,
          version: m.template.version,
          structure: m.template.structure,
          createdAt: m.template.createdAt,
        },
        matchReason: m.matchReason,
        modelName: m.modelName,
        equipmentName: m.equipmentName,
      })),
    };
  }
}
