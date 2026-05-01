import {
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
import { type InspectionType } from '@equipment-management/schemas';
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
 *   → current template 조회 (모든 인증 사용자)
 * - POST /api/equipment/:uuid/inspection-template
 *   → SoftFork apply_forward 또는 admin 명시 수정 (Permission.MANAGE_INSPECTION_TEMPLATE)
 */
@Controller('equipment')
export class EquipmentInspectionTemplateController {
  constructor(private readonly service: InspectionFormTemplatesService) {}

  /**
   * 현재 template 조회 — 부재 시 404. Frontend useLatestTemplate hook용.
   *
   * 권한: VIEW_CALIBRATIONS or VIEW_SELF_INSPECTIONS — 점검 자체 조회 권한자라면 양식 구조도 조회 가능.
   * 보수적으로 두 권한 중 하나라도 있으면 OK (점검 작성 흐름에서 자연스러운 노출).
   */
  @Get(':uuid/inspection-template/latest')
  @RequirePermissions(Permission.VIEW_CALIBRATIONS) // 중간점검 작성 흐름과 같은 권한
  async getLatest(
    @Param('uuid', ParseUUIDPipe) equipmentId: string,
    @Query('type') type: string
  ): Promise<{
    id: string;
    equipmentId: string;
    inspectionType: InspectionType;
    version: number;
    structure: unknown;
    sourceInspectionId: string | null;
    createdBy: string | null;
    createdAt: Date;
  }> {
    if (type !== 'intermediate' && type !== 'self') {
      // type 검증 — Zod pipe 적용 못 함 (path param + simple query)
      // 명시적 BadRequest로 변환되도록 throw
      throw new Error(`Invalid type: ${type}. Must be 'intermediate' or 'self'.`);
    }
    const tpl = await this.service.getCurrentOrThrow(equipmentId, type);
    return {
      id: tpl.id,
      equipmentId: tpl.equipmentId,
      inspectionType: tpl.inspectionType,
      version: tpl.version,
      structure: tpl.structure,
      sourceInspectionId: tpl.sourceInspectionId,
      createdBy: tpl.createdBy,
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
   */
  @Post(':uuid/inspection-template')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions(Permission.MANAGE_INSPECTION_TEMPLATE)
  @UsePipes(UpsertInspectionTemplateValidationPipe)
  async upsert(
    @Param('uuid', ParseUUIDPipe) equipmentId: string,
    @Body() body: UpsertInspectionTemplateInput,
    @Request() req: AuthenticatedRequest
  ): Promise<{
    id: string;
    version: number;
    inspectionType: InspectionType;
    createdAt: Date;
  }> {
    const actorUserId = req.user?.userId ?? null;
    // JWT roles[]에서 첫 번째 역할 — audit log에 actorRole로 기록 (단일 role 가정)
    const actorRole = req.user?.roles?.[0] ?? null;
    const created = await this.service.upsertNewVersion(equipmentId, body, actorUserId, actorRole);
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
 *   → 비슷한 장비의 검증된 template 목록 (모든 인증 사용자 허용)
 */
@Controller('inspection-templates')
export class InspectionTemplatesGalleryController {
  constructor(private readonly service: InspectionFormTemplatesService) {}

  /**
   * Gallery 매칭 — 첫 점검 + template 부재인 장비를 위한 reference 목록.
   * 권한: 인증 사용자 (RequirePermissions 미사용 — auth guard만 통과).
   * 매칭 이유(matchReason)는 frontend chip 표시용.
   */
  @Get('gallery')
  @RequirePermissions(Permission.VIEW_CALIBRATIONS) // 인증 + 점검 흐름 사용자라는 최소 보증
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
