import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { eq, and } from 'drizzle-orm';
import { Inject } from '@nestjs/common';
import type { AppDatabase } from '@equipment-management/db';
import { savedViews } from '@equipment-management/db/schema';
import { DOMAIN_EVENTS, type TeamDeletedPayload } from '../../../common/events/domain-events';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { CACHE_KEY_PREFIXES } from '../../../common/cache/cache-key-prefixes';

/**
 * 팀 삭제 시 orphan saved-views 정합성 리스너 (G-5).
 *
 * 팀이 삭제되면 해당 teamId를 가진 TEAM scope saved-views가
 * unreachable 상태(enforceReadScope의 `row.teamId === actor.teamId` 불일치)가 됨.
 * 이 리스너가 해당 rows를 PRIVATE으로 자동 강등하여 소유자만 접근 가능하도록 복구.
 *
 * 정책: fire-and-forget (@OnEvent async) — 팀 삭제 응답 지연 없이 비동기 처리.
 * 실패 시 logger.error 기록 (재처리 불필요 — 다음 접근 시 강등 재시도 불필요, 이미 unreachable).
 */
@Injectable()
export class SavedViewsTeamListener {
  private readonly logger = new Logger(SavedViewsTeamListener.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase,
    private readonly cacheService: SimpleCacheService
  ) {}

  @OnEvent(DOMAIN_EVENTS.TEAM_DELETED, { async: true })
  async handleTeamDeleted(payload: TeamDeletedPayload): Promise<void> {
    const { teamId } = payload;

    try {
      const affected = await this.db
        .update(savedViews)
        .set({ scope: 'PRIVATE', teamId: null })
        .where(and(eq(savedViews.scope, 'TEAM'), eq(savedViews.teamId, teamId)))
        .returning({ id: savedViews.id, ownerId: savedViews.ownerId });

      if (affected.length > 0) {
        this.logger.log(
          `[G-5] 팀 삭제(${teamId}) — orphan TEAM scope saved-views ${affected.length}건 PRIVATE 강등`
        );

        // 영향받은 소유자들의 list 캐시 무효화
        const ownerIds = [...new Set(affected.map((r) => r.ownerId))];
        for (const ownerId of ownerIds) {
          this.cacheService.deleteByPrefix(`${CACHE_KEY_PREFIXES.SAVED_VIEWS}list:${ownerId}:`);
        }
      }
    } catch (err) {
      this.logger.error(`[G-5] saved-views orphan cleanup 실패 (teamId=${teamId})`, err);
    }
  }
}
