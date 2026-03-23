import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { AppDatabase } from '@equipment-management/db';
import { and, eq, inArray, lte, sql } from 'drizzle-orm';
import * as schema from '@equipment-management/db/schema';
import { CheckoutStatusEnum } from '@equipment-management/schemas';
import { CacheInvalidationHelper } from '../../../common/cache/cache-invalidation.helper';
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
 * 성능: 배치 UPDATE + 배치 checkout_items 조회로 N+1 방지
 * (2N queries → 3 queries)
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
    private readonly cacheInvalidationHelper: CacheInvalidationHelper
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
   * 반출 기한 초과 점검 및 상태 전환 (배치 최적화)
   *
   * 크로스 사이트 워크플로우 지원:
   * - requester의 teamId/site를 JOIN으로 조회
   * - checkout_items JOIN으로 장비명/관리번호 배치 조회
   * → RecipientResolver가 scope='team' 수신자를 올바르게 해석
   *
   * 성능: 배치 UPDATE + 배치 checkout_items 조회 (2N → 3 queries)
   */
  async checkOverdueCheckouts(): Promise<{ processed: number; updated: number }> {
    const now = new Date();

    // 1. 기한 초과 반출 조회 — requester/equipment 정보 JOIN
    const overdueCheckouts = await this.db
      .select({
        id: schema.checkouts.id,
        requesterId: schema.checkouts.requesterId,
        status: schema.checkouts.status,
        expectedReturnDate: schema.checkouts.expectedReturnDate,
        requesterTeamId: schema.users.teamId,
        requesterSite: schema.users.site,
      })
      .from(schema.checkouts)
      .leftJoin(schema.users, eq(schema.users.id, schema.checkouts.requesterId))
      .where(
        and(
          eq(schema.checkouts.status, CheckoutStatusEnum.enum.checked_out),
          lte(schema.checkouts.expectedReturnDate, now)
        )
      );

    if (overdueCheckouts.length === 0) {
      return { processed: 0, updated: 0 };
    }

    // 2. 배치 UPDATE (CAS — status='checked_out' 조건이 dedup 역할)
    const overdueIds = overdueCheckouts.map((c) => c.id);
    const updatedRows = await this.db
      .update(schema.checkouts)
      .set({
        status: CheckoutStatusEnum.enum.overdue,
        version: sql`${schema.checkouts.version} + 1`,
        updatedAt: now,
      })
      .where(
        and(
          inArray(schema.checkouts.id, overdueIds),
          eq(schema.checkouts.status, CheckoutStatusEnum.enum.checked_out)
        )
      )
      .returning({ id: schema.checkouts.id });

    const updatedIdSet = new Set(updatedRows.map((r) => r.id));
    if (updatedIdSet.size === 0) {
      return { processed: overdueCheckouts.length, updated: 0 };
    }

    // 3. 배치 checkout_items + equipment JOIN (N+1 방지)
    const updatedIdArray = [...updatedIdSet];
    const itemRows = await this.db
      .select({
        checkoutId: schema.checkoutItems.checkoutId,
        equipmentId: schema.checkoutItems.equipmentId,
        equipmentName: schema.equipment.name,
        managementNumber: schema.equipment.managementNumber,
      })
      .from(schema.checkoutItems)
      .leftJoin(schema.equipment, eq(schema.equipment.id, schema.checkoutItems.equipmentId))
      .where(inArray(schema.checkoutItems.checkoutId, updatedIdArray));

    // checkoutId → first item Map
    const itemMap = new Map<
      string,
      { equipmentId: string; equipmentName: string; managementNumber: string }
    >();
    for (const row of itemRows) {
      if (!itemMap.has(row.checkoutId)) {
        itemMap.set(row.checkoutId, {
          equipmentId: row.equipmentId ?? '',
          equipmentName: row.equipmentName ?? '',
          managementNumber: row.managementNumber ?? '',
        });
      }
    }

    // 4. 이벤트 발행 + 캐시 무효화 (DB 쿼리 없음)
    for (const checkout of overdueCheckouts) {
      if (!updatedIdSet.has(checkout.id)) continue;

      try {
        const item = itemMap.get(checkout.id) ?? {
          equipmentId: '',
          equipmentName: '',
          managementNumber: '',
        };

        this.eventEmitter.emit(NOTIFICATION_EVENTS.CHECKOUT_OVERDUE, {
          checkoutId: checkout.id,
          equipmentId: item.equipmentId,
          equipmentName: item.equipmentName,
          managementNumber: item.managementNumber,
          requesterId: checkout.requesterId,
          requesterTeamId: checkout.requesterTeamId ?? '',
          teamId: checkout.requesterTeamId ?? '',
          requesterSite: checkout.requesterSite ?? '',
          site: checkout.requesterSite ?? '',
          actorId: 'system',
          actorName: '시스템',
          timestamp: now,
        });

        await this.cacheInvalidationHelper.invalidateAfterCheckoutStatusChange(
          checkout.id,
          item.equipmentId || undefined
        );
      } catch (err) {
        this.logger.error(
          `반출 기한초과 처리 실패: ${checkout.id}`,
          err instanceof Error ? err.stack : String(err)
        );
      }
    }

    return { processed: overdueCheckouts.length, updated: updatedIdSet.size };
  }
}
