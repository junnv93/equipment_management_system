import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { AppDatabase } from '@equipment-management/db';
import { and, asc, eq, inArray, or, sql } from 'drizzle-orm';
import { savedViews, type SavedView, type NewSavedView } from '@equipment-management/db/schema';
import {
  MAX_SAVED_VIEWS_PER_MODULE,
  type SavedViewModule,
  type SavedViewScope,
} from '@equipment-management/schemas';
import {
  Permission,
  derivePermissionsFromRoles,
  CACHE_TTL,
} from '@equipment-management/shared-constants';

import { VersionedBaseService } from '../../common/base/versioned-base.service';
import { SimpleCacheService } from '../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES } from '../../common/cache/cache-key-prefixes';
import { SAVED_VIEW_ERROR_CODES } from './saved-views-error-codes';
import type { CreateSavedViewInput } from './dto/create-saved-view.dto';
import type { UpdateSavedViewInput } from './dto/update-saved-view.dto';
import type { ReorderSavedViewsInput } from './dto/reorder-saved-views.dto';
import type { BulkImportSavedViewsInput } from './dto/bulk-import-saved-views.dto';

/**
 * 권한 결정 컨텍스트 — controller 가 service 에 전달.
 *
 * `roles` 만 받고 permission 은 service 가 직접 derive (controller 누락 방지 + Rule 2 정합).
 */
export interface SavedViewActor {
  userId: string;
  teamId?: string;
  roles: readonly string[];
}

@Injectable()
export class SavedViewsService extends VersionedBaseService {
  private readonly logger = new Logger(SavedViewsService.name);
  private readonly CACHE_PREFIX = CACHE_KEY_PREFIXES.SAVED_VIEWS;

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    protected readonly db: AppDatabase,
    private readonly cacheService: SimpleCacheService
  ) {
    super();
  }

  // ── 캐시 키 / 무효화 ─────────────────────────────────────────────

  private listCacheKey(
    userId: string,
    teamId: string | undefined,
    module: SavedViewModule
  ): string {
    return `${this.CACHE_PREFIX}list:${userId}:${teamId ?? '_'}:${module}`;
  }

  private detailCacheKey(id: string): string {
    return `${this.CACHE_PREFIX}detail:${id}`;
  }

  /** 한 사용자 + module 영역의 list 캐시만 무효화. cross-user TEAM 동기화는 SHORT TTL 로 수용. */
  private invalidateUserListCache(userId: string): void {
    this.cacheService.deleteByPrefix(`${this.CACHE_PREFIX}list:${userId}:`);
  }

  private invalidateAfterMutation(actorUserId: string, id?: string): void {
    if (id) this.cacheService.delete(this.detailCacheKey(id));
    this.invalidateUserListCache(actorUserId);
  }

  protected async onVersionConflict(id: string): Promise<void> {
    this.cacheService.delete(this.detailCacheKey(id));
  }

  // ── Read API ────────────────────────────────────────────────────

  /**
   * 사용자가 볼 수 있는 saved view 목록 — sortOrder 오름차순.
   *
   * 가시성 룰 (DB WHERE 절):
   *   ownerId == userId                              (PRIVATE/TEAM/GLOBAL 본인 row)
   *   OR scope=GLOBAL                                 (모두)
   *   OR (scope=TEAM AND teamId == userTeamId)       (같은 팀 멤버)
   */
  async listVisible(actor: SavedViewActor, module: SavedViewModule): Promise<SavedView[]> {
    const cacheKey = this.listCacheKey(actor.userId, actor.teamId, module);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const conditions = [eq(savedViews.ownerId, actor.userId), eq(savedViews.scope, 'GLOBAL')];
        if (actor.teamId) {
          const teamCondition = and(
            eq(savedViews.scope, 'TEAM'),
            eq(savedViews.teamId, actor.teamId)
          );
          if (teamCondition) conditions.push(teamCondition);
        }

        return await this.db
          .select()
          .from(savedViews)
          .where(and(eq(savedViews.module, module), or(...conditions)))
          .orderBy(asc(savedViews.sortOrder), asc(savedViews.createdAt));
      },
      CACHE_TTL.SHORT
    );
  }

  async findOne(actor: SavedViewActor, id: string): Promise<SavedView> {
    const [row] = await this.db.select().from(savedViews).where(eq(savedViews.id, id)).limit(1);
    if (!row) {
      throw new NotFoundException({
        code: SAVED_VIEW_ERROR_CODES.NotFound,
        message: 'Saved view not found.',
      });
    }
    this.enforceReadScope(actor, row);
    return row;
  }

  // ── Write API ───────────────────────────────────────────────────

  async create(actor: SavedViewActor, dto: CreateSavedViewInput): Promise<SavedView> {
    this.assertScopeWriteAllowed(actor, dto.scope, dto.teamId ?? null);

    const ownedCount = await this.countOwnedByModule(actor.userId, dto.module);
    if (ownedCount >= MAX_SAVED_VIEWS_PER_MODULE) {
      throw new ConflictException({
        code: SAVED_VIEW_ERROR_CODES.MaxReached,
        message: `사용자당 module 별 ${MAX_SAVED_VIEWS_PER_MODULE}개를 초과할 수 없습니다.`,
      });
    }

    const nextSortOrder = await this.nextSortOrder(actor.userId, dto.module);

    const insertData: NewSavedView = {
      name: dto.name,
      params: dto.params,
      ownerId: actor.userId,
      module: dto.module,
      scope: dto.scope,
      teamId: dto.scope === 'TEAM' ? (dto.teamId ?? null) : null,
      sortOrder: nextSortOrder,
    };

    const [inserted] = await this.db.insert(savedViews).values(insertData).returning();
    this.invalidateAfterMutation(actor.userId);
    return inserted;
  }

  async update(actor: SavedViewActor, id: string, dto: UpdateSavedViewInput): Promise<SavedView> {
    const existing = await this.loadForWrite(actor, id);

    const nextScope: SavedViewScope = dto.scope ?? existing.scope;
    const nextTeamId = nextScope === 'TEAM' ? (dto.teamId ?? existing.teamId ?? null) : null;

    if (dto.scope && dto.scope !== existing.scope) {
      this.assertScopeWriteAllowed(actor, nextScope, nextTeamId);
    }
    if (nextScope === 'TEAM' && !nextTeamId) {
      throw new BadRequestException({
        code: SAVED_VIEW_ERROR_CODES.TeamRequiredForScope,
        message: 'TEAM scope 는 teamId 가 필요합니다.',
      });
    }
    if (
      nextScope === 'TEAM' &&
      nextTeamId &&
      actor.teamId &&
      nextTeamId !== actor.teamId &&
      !this.hasGlobalScopePermission(actor)
    ) {
      throw new ForbiddenException({
        code: SAVED_VIEW_ERROR_CODES.ScopeForbidden,
        message: '본인 팀의 view 만 TEAM scope 로 지정할 수 있습니다.',
      });
    }

    const updateData: Record<string, unknown> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.params !== undefined) updateData.params = dto.params;
    if (dto.scope !== undefined) updateData.scope = nextScope;
    if (dto.scope !== undefined || dto.teamId !== undefined) updateData.teamId = nextTeamId;

    const updated = await this.updateWithVersion<SavedView>(
      savedViews,
      id,
      dto.version,
      updateData,
      'Saved view',
      undefined,
      SAVED_VIEW_ERROR_CODES.NotFound
    );

    this.invalidateAfterMutation(actor.userId, id);
    return updated;
  }

  async delete(actor: SavedViewActor, id: string): Promise<void> {
    const existing = await this.loadForWrite(actor, id);
    await this.db.delete(savedViews).where(eq(savedViews.id, existing.id));
    this.invalidateAfterMutation(actor.userId, id);
  }

  async reorder(actor: SavedViewActor, dto: ReorderSavedViewsInput): Promise<void> {
    if (dto.orders.length === 0) return;
    const ids = dto.orders.map((o) => o.id);
    const rows = await this.db
      .select()
      .from(savedViews)
      .where(and(eq(savedViews.module, dto.module), inArray(savedViews.id, ids)));

    if (rows.length !== dto.orders.length) {
      throw new NotFoundException({
        code: SAVED_VIEW_ERROR_CODES.NotFound,
        message: '일부 항목을 찾을 수 없거나 module 이 일치하지 않습니다.',
      });
    }
    for (const row of rows) {
      this.enforceWriteScope(actor, row);
    }

    // 단일 쿼리 batch UPDATE — verify-sql-safety Step 4 (N+1 차단).
    // `unnest($ids::uuid[], $orders::int[])` 로 (id, sortOrder) 페어 가상 테이블 생성 후
    // 단일 UPDATE...FROM 으로 모든 row 동시 갱신 (최대 50 → 1 round-trip).
    const idArray = dto.orders.map((o) => o.id);
    const sortOrderArray = dto.orders.map((o) => o.sortOrder);
    await this.db.execute(
      sql`UPDATE ${savedViews} SET sort_order = pairs.sort_order, updated_at = now()
          FROM (SELECT unnest(${idArray}::uuid[]) AS id, unnest(${sortOrderArray}::int[]) AS sort_order) AS pairs
          WHERE ${savedViews.id} = pairs.id`
    );

    this.invalidateAfterMutation(actor.userId);
  }

  async bulkImport(actor: SavedViewActor, dto: BulkImportSavedViewsInput): Promise<SavedView[]> {
    if (dto.views.length === 0) return [];

    const ownedCount = await this.countOwnedByModule(actor.userId, dto.module);
    if (ownedCount + dto.views.length > MAX_SAVED_VIEWS_PER_MODULE) {
      throw new ConflictException({
        code: SAVED_VIEW_ERROR_CODES.MaxReached,
        message: `사용자당 module 별 ${MAX_SAVED_VIEWS_PER_MODULE}개를 초과합니다. (현재 ${ownedCount}개)`,
      });
    }

    const baseSort = await this.nextSortOrder(actor.userId, dto.module);
    const rowsToInsert: NewSavedView[] = dto.views.map((v, idx) => ({
      name: v.name,
      params: v.params,
      ownerId: actor.userId,
      module: dto.module,
      scope: 'PRIVATE' as const,
      teamId: null,
      sortOrder: v.sortOrder ?? baseSort + idx,
    }));

    const inserted = await this.db.insert(savedViews).values(rowsToInsert).returning();
    this.invalidateAfterMutation(actor.userId);
    return inserted;
  }

  // ── 권한 / 스코프 (fail-close 우선순위 보장) ──────────────────────
  //
  // 4 개의 enforce/assert 함수는 모두 본 헬퍼 한 곳을 경유한다 (DRY + 회귀 차단):
  //   - canReadScope(actor, row)             — 가시성
  //   - canWriteOwnedRow(actor, row)         — owner 기반 write
  //   - hasGlobalScopePermission(actor)      — GLOBAL scope write 권한
  //
  // 신규 scope 추가 시 헬퍼만 갱신하면 4 호출자가 자동 정합.

  private hasGlobalScopePermission(actor: SavedViewActor): boolean {
    return derivePermissionsFromRoles(actor.roles).includes(Permission.MANAGE_SAVED_VIEWS_GLOBAL);
  }

  private canReadScope(actor: SavedViewActor, row: SavedView): boolean {
    if (row.ownerId === actor.userId) return true;
    if (row.scope === 'GLOBAL') return true;
    if (row.scope === 'TEAM' && actor.teamId && row.teamId === actor.teamId) return true;
    return false;
  }

  private enforceReadScope(actor: SavedViewActor, row: SavedView): void {
    if (this.canReadScope(actor, row)) return;
    throw new ForbiddenException({
      code: SAVED_VIEW_ERROR_CODES.ScopeForbidden,
      message: '이 saved view 에 대한 접근 권한이 없습니다.',
    });
  }

  private enforceWriteScope(actor: SavedViewActor, row: SavedView): void {
    if (row.scope === 'GLOBAL') {
      if (!this.hasGlobalScopePermission(actor)) {
        throw new ForbiddenException({
          code: SAVED_VIEW_ERROR_CODES.ScopeForbidden,
          message: '전체 공유 saved view 는 관리 권한자만 수정할 수 있습니다.',
        });
      }
      return;
    }
    if (row.ownerId !== actor.userId) {
      throw new ForbiddenException({
        code: SAVED_VIEW_ERROR_CODES.ScopeForbidden,
        message: '본인이 작성한 saved view 만 수정할 수 있습니다.',
      });
    }
  }

  private assertScopeWriteAllowed(
    actor: SavedViewActor,
    nextScope: SavedViewScope,
    nextTeamId: string | null
  ): void {
    if (nextScope === 'GLOBAL') {
      if (!this.hasGlobalScopePermission(actor)) {
        throw new ForbiddenException({
          code: SAVED_VIEW_ERROR_CODES.ScopeForbidden,
          message: '전체 공유 saved view 는 관리 권한자만 작성할 수 있습니다.',
        });
      }
    }
    if (nextScope === 'TEAM') {
      if (!nextTeamId) {
        throw new BadRequestException({
          code: SAVED_VIEW_ERROR_CODES.TeamRequiredForScope,
          message: 'TEAM scope 는 teamId 가 필요합니다.',
        });
      }
      if (!actor.teamId) {
        throw new ForbiddenException({
          code: SAVED_VIEW_ERROR_CODES.ScopeForbidden,
          message: '팀에 소속된 사용자만 TEAM scope 를 사용할 수 있습니다.',
        });
      }
      if (nextTeamId !== actor.teamId && !this.hasGlobalScopePermission(actor)) {
        throw new ForbiddenException({
          code: SAVED_VIEW_ERROR_CODES.ScopeForbidden,
          message: '본인 팀의 view 만 TEAM scope 로 지정할 수 있습니다.',
        });
      }
    }
  }

  private async loadForWrite(actor: SavedViewActor, id: string): Promise<SavedView> {
    const [row] = await this.db.select().from(savedViews).where(eq(savedViews.id, id)).limit(1);
    if (!row) {
      throw new NotFoundException({
        code: SAVED_VIEW_ERROR_CODES.NotFound,
        message: 'Saved view not found.',
      });
    }
    // Write 검사가 read 검사보다 엄격 — 자동으로 read 가시성도 충족
    this.enforceWriteScope(actor, row);
    return row;
  }

  private async countOwnedByModule(userId: string, module: SavedViewModule): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(savedViews)
      .where(and(eq(savedViews.ownerId, userId), eq(savedViews.module, module)));
    return row?.count ?? 0;
  }

  private async nextSortOrder(userId: string, module: SavedViewModule): Promise<number> {
    const [row] = await this.db
      .select({ max: sql<number | null>`max(${savedViews.sortOrder})::int` })
      .from(savedViews)
      .where(and(eq(savedViews.ownerId, userId), eq(savedViews.module, module)));
    return (row?.max ?? -1) + 1;
  }
}
