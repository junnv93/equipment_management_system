import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { AppDatabase } from '@equipment-management/db';
import { and, eq, inArray } from 'drizzle-orm';
import * as schema from '@equipment-management/db/schema';
import {
  EquipmentImportStatusValues as EIVal,
  CheckoutStatusValues as CSVal,
} from '@equipment-management/schemas';
import { NOTIFICATION_CONFIG } from '@equipment-management/shared-constants';
import { NOTIFICATION_EVENTS } from '../events/notification-events';

/**
 * 장비 반입 orphan 감지 스케줄러
 *
 * 콜백 실패로 인해 `RETURN_REQUESTED` 상태에 고아 상태로 남은
 * equipment-import 레코드를 감지하고 자동 복구를 시도한다.
 *
 * 감지 조건:
 *   equipment_imports.status = 'return_requested'
 *   AND linked checkout.status IN ('return_approved', 'canceled')
 *
 * 복구 전략:
 *   - checkout가 return_approved → onReturnCompleted 재시도
 *   - checkout가 canceled → onReturnCanceled 재시도
 *
 * 실행 주기: 6시간 + 앱 시작 시 1회
 */
@Injectable()
export class ImportOrphanScheduler implements OnModuleInit {
  private readonly logger = new Logger(ImportOrphanScheduler.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('애플리케이션 시작 시 반입 orphan 점검 실행...');
    try {
      const result = await this.detectAndRecover();
      this.logger.log(
        `초기 반입 orphan 점검 완료: ${result.detected}건 감지, ${result.recovered}건 복구`
      );
    } catch (error) {
      this.logger.error(
        '초기 반입 orphan 점검 실패',
        error instanceof Error ? error.stack : String(error)
      );
    }
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  async handleCron(): Promise<void> {
    this.logger.log('반입 orphan 자동 점검 시작 (6시간 스케줄)');
    try {
      const result = await this.detectAndRecover();
      if (result.detected > 0) {
        this.logger.log(
          `반입 orphan 처리 완료: ${result.detected}건 감지, ${result.recovered}건 복구`
        );
      }
    } catch (error) {
      this.logger.error(
        '반입 orphan 자동 점검 실패',
        error instanceof Error ? error.stack : String(error)
      );
    }
  }

  /**
   * orphan 감지 및 복구
   *
   * 1. RETURN_REQUESTED 상태 import + 완료/취소된 checkout JOIN 쿼리
   * 2. checkout 상태에 따라 적절한 이벤트 발행 (알림용)
   * 3. 직접 상태 복구 (콜백 재호출 대신 직접 UPDATE — 콜백 재호출은 순환 위험)
   */
  async detectAndRecover(): Promise<{ detected: number; recovered: number }> {
    // checkout 상태가 이미 완료/취소인데 import가 아직 return_requested인 레코드
    const orphans = await this.db
      .select({
        importId: schema.equipmentImports.id,
        importVersion: schema.equipmentImports.version,
        equipmentId: schema.equipmentImports.equipmentId,
        checkoutId: schema.equipmentImports.returnCheckoutId,
        checkoutStatus: schema.checkouts.status,
        equipmentName: schema.equipment.name,
        managementNumber: schema.equipment.managementNumber,
      })
      .from(schema.equipmentImports)
      .innerJoin(
        schema.checkouts,
        eq(schema.equipmentImports.returnCheckoutId, schema.checkouts.id)
      )
      .leftJoin(schema.equipment, eq(schema.equipmentImports.equipmentId, schema.equipment.id))
      .where(
        and(
          eq(schema.equipmentImports.status, EIVal.RETURN_REQUESTED),
          inArray(schema.checkouts.status, [CSVal.RETURN_APPROVED, CSVal.CANCELED])
        )
      );

    if (orphans.length === 0) {
      return { detected: 0, recovered: 0 };
    }

    this.logger.error(
      `반입 orphan ${orphans.length}건 감지 — importIds: ${orphans.map((o) => o.importId).join(', ')}`
    );

    let recovered = 0;

    for (const orphan of orphans) {
      try {
        const targetStatus =
          orphan.checkoutStatus === CSVal.RETURN_APPROVED ? EIVal.RETURNED : EIVal.RECEIVED;

        // 직접 CAS 업데이트 (콜백 재호출 대신 — 순환 위험 방지)
        const result = await this.db
          .update(schema.equipmentImports)
          .set({
            status: targetStatus,
            ...(orphan.checkoutStatus === CSVal.CANCELED ? { returnCheckoutId: null } : {}),
            version: orphan.importVersion + 1,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schema.equipmentImports.id, orphan.importId),
              eq(schema.equipmentImports.version, orphan.importVersion),
              eq(schema.equipmentImports.status, EIVal.RETURN_REQUESTED)
            )
          )
          .returning({ id: schema.equipmentImports.id });

        if (result.length > 0) {
          recovered++;
          this.logger.log(
            `반입 orphan 복구 완료 — importId: ${orphan.importId}, ${EIVal.RETURN_REQUESTED} → ${targetStatus}`
          );

          // 알림 이벤트 발행
          // 스케줄러 컨텍스트 — fire-and-forget (cron, HTTP response 없음).
          // 정책: docs/references/backend-patterns.md "Event Emission: emit vs emitAsync".
          this.eventEmitter.emit(NOTIFICATION_EVENTS.IMPORT_ORPHAN_DETECTED, {
            importId: orphan.importId,
            equipmentId: orphan.equipmentId,
            equipmentName: orphan.equipmentName ?? '',
            managementNumber: orphan.managementNumber ?? '',
            requesterId: '',
            requesterTeamId: '',
            actorId: NOTIFICATION_CONFIG.SYSTEM_ACTOR_ID,
            actorName: '',
            timestamp: new Date(),
          });
        } else {
          this.logger.warn(`반입 orphan 복구 CAS 실패 (동시 수정) — importId: ${orphan.importId}`);
        }
      } catch (error) {
        this.logger.error(
          `반입 orphan 복구 실패 — importId: ${orphan.importId}, error: ${error instanceof Error ? error.message : String(error)}`,
          error instanceof Error ? error.stack : undefined
        );
      }
    }

    return { detected: orphans.length, recovered };
  }
}
