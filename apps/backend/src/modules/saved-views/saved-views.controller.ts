import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UsePipes,
} from '@nestjs/common';
import { z } from 'zod';

import { SavedViewsService, type SavedViewActor } from './saved-views.service';
import {
  CreateSavedViewValidationPipe,
  type CreateSavedViewInput,
} from './dto/create-saved-view.dto';
import {
  UpdateSavedViewValidationPipe,
  type UpdateSavedViewInput,
} from './dto/update-saved-view.dto';
import {
  ReorderSavedViewsValidationPipe,
  type ReorderSavedViewsInput,
} from './dto/reorder-saved-views.dto';
import {
  BulkImportSavedViewsValidationPipe,
  type BulkImportSavedViewsInput,
} from './dto/bulk-import-saved-views.dto';

import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { SavedViewModuleEnum } from '@equipment-management/schemas';
import type { SavedView } from '@equipment-management/db/schema';
import type { AuthenticatedRequest } from '../../types/auth';
import { extractUserId } from '../../common/utils/extract-user';

const listQuerySchema = z.object({ module: SavedViewModuleEnum });
type ListQueryInput = z.infer<typeof listQuerySchema>;
const ListQueryValidationPipe = new ZodValidationPipe(listQuerySchema, { targets: ['query'] });

/**
 * Saved Views REST 엔드포인트
 *
 * - 모든 mutation 은 JWT 에서 사용자 ID 추출 (Rule 2). Body 에 ownerId 받지 않음.
 * - GLOBAL scope write 가드는 service 가 derivePermissionsFromRoles 로 enforce.
 *   별도 `@RequirePermissions` 는 PRIVATE/TEAM 도 함께 막아버리므로 service-layer 동적 검사가 정합.
 * - AuditLog: create/update/delete/reorder/bulk-import 모두 saved_view 엔티티.
 */
@Controller('saved-views')
export class SavedViewsController {
  constructor(private readonly savedViewsService: SavedViewsService) {}

  private toActor(req: AuthenticatedRequest): SavedViewActor {
    const userId = extractUserId(req);
    return {
      userId,
      teamId: req.user?.teamId,
      roles: (req.user?.roles ?? []) as readonly string[],
    };
  }

  @Get()
  list(
    @Query(ListQueryValidationPipe) query: ListQueryInput,
    @Request() req: AuthenticatedRequest
  ): Promise<SavedView[]> {
    return this.savedViewsService.listVisible(this.toActor(req), query.module);
  }

  @Get(':uuid')
  findOne(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Request() req: AuthenticatedRequest
  ): Promise<SavedView> {
    return this.savedViewsService.findOne(this.toActor(req), uuid);
  }

  @Post()
  @AuditLog({
    action: 'create',
    entityType: 'saved_view',
    entityIdPath: 'response.id',
    entityNamePath: 'response.name',
  })
  @UsePipes(CreateSavedViewValidationPipe)
  create(
    @Body() dto: CreateSavedViewInput,
    @Request() req: AuthenticatedRequest
  ): Promise<SavedView> {
    return this.savedViewsService.create(this.toActor(req), dto);
  }

  @Patch('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuditLog({ action: 'update', entityType: 'saved_view' })
  @UsePipes(ReorderSavedViewsValidationPipe)
  async reorder(
    @Body() dto: ReorderSavedViewsInput,
    @Request() req: AuthenticatedRequest
  ): Promise<void> {
    await this.savedViewsService.reorder(this.toActor(req), dto);
  }

  @Post('bulk-import')
  @AuditLog({ action: 'create', entityType: 'saved_view' })
  @UsePipes(BulkImportSavedViewsValidationPipe)
  bulkImport(
    @Body() dto: BulkImportSavedViewsInput,
    @Request() req: AuthenticatedRequest
  ): Promise<SavedView[]> {
    return this.savedViewsService.bulkImport(this.toActor(req), dto);
  }

  @Patch(':uuid')
  @AuditLog({
    action: 'update',
    entityType: 'saved_view',
    entityIdPath: 'params.uuid',
    entityNamePath: 'response.name',
  })
  @UsePipes(UpdateSavedViewValidationPipe)
  update(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() dto: UpdateSavedViewInput,
    @Request() req: AuthenticatedRequest
  ): Promise<SavedView> {
    return this.savedViewsService.update(this.toActor(req), uuid, dto);
  }

  @Delete(':uuid')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuditLog({ action: 'delete', entityType: 'saved_view', entityIdPath: 'params.uuid' })
  async remove(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Request() req: AuthenticatedRequest
  ): Promise<void> {
    await this.savedViewsService.delete(this.toActor(req), uuid);
  }
}
