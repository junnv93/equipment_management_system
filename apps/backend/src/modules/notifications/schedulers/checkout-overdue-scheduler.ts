import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { AppDatabase } from '@equipment-management/db';
import { and, eq, lte, sql } from 'drizzle-orm';
import * as schema from '@equipment-management/db/schema';
import { SimpleCacheService } from '../../../common/cache/simple-cache.service';
import { NOTIFICATION_EVENTS } from '../events/notification-events';

/**
 * 반출 기한 초과 자동 감지 스케줄러
 *
 * 기능:
 * 1. checked_out 상태 + expectedReturnDate < NOW인 반출을 overdue로 전환
 * 2. CHECKOUT_OVERDUE 이벤트 발행 → 디스패처가 알림 자동 생성
 * 3. 관련 캐시 무효화
 *
 * 중복 방지: WHERE status = 'checked_out' → 이미 overdue인 건은 다시 처리하지 않음
 * (CAS 패턴: status 조건이 내장 dedup 역할)
 *
 * 실행 주기: 매시간 (CalibrationOverdueScheduler와 동일)
 */
@Injectable()
export class CheckoutOverdueScheduler implements OnModuleInit {
  private readonly logger = new Logger(CheckoutOverdueScheduler.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase,
    private readonly eventEmitter: EventEmitter2,
    private readonly cacheService: SimpleCacheService
  ) {}

  /**
   * 앱 시작 시 즉시 실행 (CalibrationOverdueScheduler 패턴)
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('애플리케이션 시작 시 반출 기한 초과 점검 실행...');
    try {
      const result = await this.checkOverdueCheckouts();
      this.logger.log(
        `초기 반출 기한 초과 점검 완료: 검사 ${result.processed}건, 업데이트 ${result.updated}건`
      );
    } catch (error) {
      this.logger.error(
        '초기 반출 기한 초과 점검 실패',
        error instanceof Error ? error.stack : String(error)
      );
    }
  }

  /**
   * 매시간 실행
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleCron(): Promise<void> {
    this.logger.log('반출 기한 초과 자동 점검 시작 (자동 스케줄)');
    try {
      const result = await this.checkOverdueCheckouts();
      if (result.updated > 0) {
        this.logger.log(
          `반출 기한초과 처리 완료: ${result.processed}건 검사, ${result.updated}건 업데이트`
        );
      }
    } catch (error) {
      this.logger.error(
        '반출 기한 초과 자동 점검 실패',
        error instanceof Error ? error.stack : String(error)
      );
    }
  }

  /**
   * 반출 기한 초과 점검 및 상태 전환
   *
   * 크로스 사이트 워크플로우 지원:
   * - requester의 teamId/site를 JOIN으로 조회
   * - checkout_items JOIN으로 장비명/관리번호 조회
   * → RecipientResolver가 scope='team' 수신자를 올바르게 해석
   */
  async checkOverdueCheckouts(): Promise<{ processed: number; updated: number }> {
    const now = new Date();
    let updated = 0;

    // 1. 기한 초과 반출 조회 — requester/equipment 정보 JOIN
    const overdueCheckouts = await this.db
      .select({
        id: schema.checkouts.id,
        requesterId: schema.checkouts.requesterId,
        status: schema.checkouts.status,
        expectedReturnDate: schema.checkouts.expectedReturnDate,
        // requester 정보 (RecipientResolver의 scope='team' 해석용)
        requesterTeamId: schema.users.teamId,
        requesterSite: schema.users.site,
      })
      .from(schema.checkouts)
      .leftJoin(schema.users, eq(schema.users.id, schema.checkouts.requesterId))
      .where(
        and(
          eq(schema.checkouts.status, 'checked_out'),
          lte(schema.checkouts.expectedReturnDate, now)
        )
      );

    for (const checkout of overdueCheckouts) {
      try {
        // 2. 상태 업데이트 (CAS — status='checked_out' 조건이 dedup 역할)
        const [result] = await this.db
          .update(schema.checkouts)
          .set({
            status: 'overdue',
            version: sql`${schema.checkouts.version} + 1`,
            updatedAt: now,
          })
          .where(
            and(eq(schema.checkouts.id, checkout.id), eq(schema.checkouts.status, 'checked_out'))
          )
          .returning({ id: schema.checkouts.id });

        if (!result) continue; // 다른 프로세스가 먼저 변경 → skip

        // 3. checkout_items + equipment JOIN으로 장비 정보 조회
        const [firstItem] = await this.db
          .select({
            equipmentId: schema.checkoutItems.equipmentId,
            equipmentName: schema.equipment.name,
            managementNumber: schema.equipment.managementNumber,
          })
          .from(schema.checkoutItems)
          .leftJoin(schema.equipment, eq(schema.equipment.id, schema.checkoutItems.equipmentId))
          .where(eq(schema.checkoutItems.checkoutId, checkout.id))
          .limit(1);

        const equipmentId = firstItem?.equipmentId || '';

        // 4. 이벤트 발행 — 크로스 사이트 컨텍스트 포함
        this.eventEmitter.emit(NOTIFICATION_EVENTS.CHECKOUT_OVERDUE, {
          checkoutId: checkout.id,
          equipmentId,
          equipmentName: firstItem?.equipmentName ?? '',
          managementNumber: firstItem?.managementNumber ?? '',
          requesterId: checkout.requesterId,
          // RecipientResolver가 scope='team' 해석에 사용
          requesterTeamId: checkout.requesterTeamId ?? '',
          teamId: checkout.requesterTeamId ?? '',
          // RecipientResolver가 scope='site' 해석에 사용
          requesterSite: checkout.requesterSite ?? '',
          site: checkout.requesterSite ?? '',
          actorId: 'system',
          actorName: '시스템',
          timestamp: now,
        });

        // 5. 캐시 무효화 (반출 상세)
        this.cacheService.delete(`checkout:detail:${checkout.id}`);
        if (equipmentId) {
          this.cacheService.delete(`equipment:detail:${equipmentId}`);
        }

        updated++;
      } catch (err) {
        this.logger.error(
          `반출 기한초과 처리 실패: ${checkout.id}`,
          err instanceof Error ? err.stack : String(err)
        );
      }
    }

    return { processed: overdueCheckouts.length, updated };
  }
}
