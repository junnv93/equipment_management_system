import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq, gte, inArray } from 'drizzle-orm';
import * as schema from '@equipment-management/db/schema';
import { CalibrationService } from '../../calibration/calibration.service';
import { SettingsService } from '../../settings/settings.service';
import { NOTIFICATION_EVENTS } from '../events/notification-events';

/**
 * 중간점검 알림 스케줄러
 *
 * 이 서비스는 교정 중간점검 예정 알림을 발송합니다.
 * 알림 주기: D-30일, D-7일, 당일
 *
 * 중복 방지: DB 기반 (notifications 테이블 조회)
 * → 서버 재시작, 멀티 인스턴스에서도 안전
 */
@Injectable()
export class IntermediateCheckScheduler {
  private readonly logger = new Logger(IntermediateCheckScheduler.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly calibrationService: CalibrationService,
    private readonly settingsService: SettingsService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  /**
   * DB 기반 중복 알림 체크
   *
   * notifications 테이블에서 같은 type + entityId로 최근 hoursBack 시간 내
   * 알림이 존재하는지 확인한다.
   * idx_notifications_entity (entityType, entityId) 인덱스 활용.
   */
  private async hasRecentNotification(
    entityType: string,
    entityId: string,
    type: string,
    hoursBack: number = 25
  ): Promise<boolean> {
    const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    const [existing] = await this.db
      .select({ id: schema.notifications.id })
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.entityType, entityType),
          eq(schema.notifications.entityId, entityId),
          eq(schema.notifications.type, type),
          gte(schema.notifications.createdAt, cutoff)
        )
      )
      .limit(1);
    return !!existing;
  }

  /**
   * 장비 정보 배치 조회 (N+1 방지)
   *
   * 이벤트 페이로드에 필요한 equipmentName, managementNumber, teamId, site를
   * 한 번의 쿼리로 조회하여 Map으로 반환.
   */
  private async getEquipmentMap(
    equipmentIds: string[]
  ): Promise<
    Map<string, { name: string; managementNumber: string; teamId: string; site: string }>
  > {
    const uniqueIds = [...new Set(equipmentIds.filter(Boolean))];
    if (uniqueIds.length === 0) return new Map();

    const rows = await this.db
      .select({
        id: schema.equipment.id,
        name: schema.equipment.name,
        managementNumber: schema.equipment.managementNumber,
        teamId: schema.equipment.teamId,
        site: schema.equipment.site,
      })
      .from(schema.equipment)
      .where(inArray(schema.equipment.id, uniqueIds));

    return new Map(
      rows.map((r) => [
        r.id,
        {
          name: r.name ?? '',
          managementNumber: r.managementNumber ?? '',
          teamId: r.teamId ?? '',
          site: r.site ?? '',
        },
      ])
    );
  }

  /**
   * 설정된 알림 주기에 해당하는 날짜인지 확인
   * DB system_settings에서 동적으로 로드한 alertDays 사용
   */
  private shouldSendForInterval(daysUntil: number, alertDays: number[]): boolean {
    return alertDays.includes(daysUntil);
  }

  /**
   * 중간점검 예정 알림을 발송합니다.
   * D-30일, D-7일, 당일에 중간점검 예정 알림을 발송합니다.
   */
  async handleIntermediateCheckNotifications(
    days: number = 30
  ): Promise<{ success: boolean; processed: number; sent: number; skipped: number }> {
    const alertDays = await this.settingsService.getCalibrationAlertDays();
    this.logger.log(`중간점검 알림 스케줄러 실행 시작 (알림 주기: D-${alertDays.join(', D-')})`);

    try {
      const upcomingChecks = await this.calibrationService.findUpcomingIntermediateChecks(days);

      this.logger.log(`${upcomingChecks.length}개의 중간점검 예정 항목 발견`);

      // 배치 장비 조회 (N+1 방지)
      const equipmentMap = await this.getEquipmentMap(
        upcomingChecks.map((c) => c.equipmentId).filter(Boolean)
      );

      let sentCount = 0;
      let skippedCount = 0;

      for (const calibration of upcomingChecks) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(calibration.intermediateCheckDate!);
        checkDate.setHours(0, 0, 0, 0);
        const daysUntilCheck = Math.ceil(
          (checkDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (!this.shouldSendForInterval(daysUntilCheck, alertDays)) {
          continue;
        }

        // DB 기반 중복 체크 (서버 재시작 무관)
        const isDuplicate = await this.hasRecentNotification(
          'calibration',
          calibration.id,
          'calibration_dueSoon'
        );
        if (isDuplicate) {
          this.logger.debug(`중복 알림 건너뜀(DB): 교정 ID ${calibration.id}, D-${daysUntilCheck}`);
          skippedCount++;
          continue;
        }

        // 이벤트 발행 (수신자 해석은 NOTIFICATION_REGISTRY가 자동 처리)
        try {
          const equip = equipmentMap.get(calibration.equipmentId) ?? {
            name: '',
            managementNumber: '',
            teamId: '',
            site: '',
          };

          this.eventEmitter.emit(NOTIFICATION_EVENTS.CALIBRATION_DUE_SOON, {
            calibrationId: calibration.id,
            equipmentId: calibration.equipmentId,
            equipmentName: equip.name,
            managementNumber: equip.managementNumber,
            teamId: equip.teamId,
            site: equip.site,
            daysUntil: daysUntilCheck,
            actorId: 'system',
            actorName: '시스템',
            timestamp: new Date(),
          });

          sentCount++;

          this.logger.log(
            `중간점검 알림 발행 완료: 교정 ID ${calibration.id}, 장비 ${equip.managementNumber || calibration.equipmentId}, D-${daysUntilCheck}`
          );
        } catch (error) {
          this.logger.error(
            `중간점검 알림 발행 실패: 교정 ID ${calibration.id}`,
            error instanceof Error ? error.stack : String(error)
          );
        }
      }

      this.logger.log(
        `중간점검 알림 스케줄러 실행 완료: 발송 ${sentCount}건, 중복 건너뜀 ${skippedCount}건`
      );
      return {
        success: true,
        processed: upcomingChecks.length,
        sent: sentCount,
        skipped: skippedCount,
      };
    } catch (error) {
      this.logger.error(
        '중간점검 알림 스케줄러 실행 실패',
        error instanceof Error ? error.stack : String(error)
      );
      throw error;
    }
  }

  /**
   * 매일 오전 8시 자동 실행 — 교정 예정 + 중간점검 통합 알림
   */
  @Cron('0 8 * * *')
  async handleScheduledCheck(): Promise<void> {
    this.logger.log('교정 중간점검 예정 알림 자동 점검 시작 (자동 스케줄)');
    try {
      await this.handleCombinedCalibrationNotifications();
    } catch (error) {
      this.logger.error(
        '교정 중간점검 예정 알림 자동 점검 실패',
        error instanceof Error ? error.stack : String(error)
      );
    }
  }

  /**
   * 교정 예정 + 중간점검 통합 알림 발송
   */
  async handleCombinedCalibrationNotifications(
    days: number = 30
  ): Promise<{ success: boolean; processed: number; sent: number; skipped: number }> {
    const alertDays = await this.settingsService.getCalibrationAlertDays();
    this.logger.log(
      `통합 교정/중간점검 알림 스케줄러 실행 시작 (알림 주기: D-${alertDays.join(', D-')})`
    );

    try {
      const result = await this.calibrationService.findDueCalibrations(days);
      const dueCalibrations = result.items || [];

      this.logger.log(`${dueCalibrations.length}개의 교정 예정 항목 발견`);

      // 배치 장비 조회 (N+1 방지)
      const equipmentMap = await this.getEquipmentMap(
        dueCalibrations.map((c) => c.equipmentId).filter(Boolean)
      );

      let sentCount = 0;
      let skippedCount = 0;

      for (const calibration of dueCalibrations) {
        if (!calibration.nextCalibrationDate) {
          continue;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextCalibrationDate = new Date(calibration.nextCalibrationDate);
        nextCalibrationDate.setHours(0, 0, 0, 0);
        const daysUntilCalibration = Math.ceil(
          (nextCalibrationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (!this.shouldSendForInterval(daysUntilCalibration, alertDays)) {
          continue;
        }

        // DB 기반 중복 체크 (서버 재시작 무관)
        const isDuplicate = await this.hasRecentNotification(
          'calibration',
          calibration.id,
          'calibration_dueSoon'
        );
        if (isDuplicate) {
          this.logger.debug(
            `중복 교정 알림 건너뜀(DB): 교정 ID ${calibration.id}, D-${daysUntilCalibration}`
          );
          skippedCount++;
          continue;
        }

        try {
          const equip = equipmentMap.get(calibration.equipmentId) ?? {
            name: '',
            managementNumber: '',
            teamId: '',
            site: '',
          };

          this.eventEmitter.emit(NOTIFICATION_EVENTS.CALIBRATION_DUE_SOON, {
            calibrationId: calibration.id,
            equipmentId: calibration.equipmentId,
            equipmentName: equip.name,
            managementNumber: equip.managementNumber,
            teamId: equip.teamId,
            site: equip.site,
            daysUntil: daysUntilCalibration,
            actorId: 'system',
            actorName: '시스템',
            timestamp: new Date(),
          });

          sentCount++;

          this.logger.log(
            `교정 예정 알림 발행 완료: 장비 ${equip.managementNumber || calibration.equipmentId}, D-${daysUntilCalibration}`
          );
        } catch (error) {
          this.logger.error(
            `교정 예정 알림 발행 실패: 장비 ${calibration.equipmentId}`,
            error instanceof Error ? error.stack : String(error)
          );
        }
      }

      this.logger.log(
        `통합 교정/중간점검 알림 스케줄러 실행 완료: 발송 ${sentCount}건, 중복 건너뜀 ${skippedCount}건`
      );
      return {
        success: true,
        processed: dueCalibrations.length,
        sent: sentCount,
        skipped: skippedCount,
      };
    } catch (error) {
      this.logger.error(
        '통합 교정/중간점검 알림 스케줄러 실행 실패',
        error instanceof Error ? error.stack : String(error)
      );
      throw error;
    }
  }

  /**
   * 수동으로 중간점검 알림을 트리거합니다. (테스트 및 관리용)
   */
  async triggerIntermediateCheckNotifications(days: number = 7): Promise<{
    totalChecks: number;
    notificationsSent: number;
    notificationsFailed: number;
    details: { calibrationId: string; success: boolean; error?: string | undefined }[];
  }> {
    this.logger.log(`수동 중간점검 알림 트리거: ${days}일 이내`);

    try {
      const upcomingChecks = await this.calibrationService.findUpcomingIntermediateChecks(days);
      const results: Array<{ calibrationId: string; success: boolean; error?: string }> = [];

      // 배치 장비 조회 (N+1 방지)
      const equipmentMap = await this.getEquipmentMap(
        upcomingChecks.map((c) => c.equipmentId).filter(Boolean)
      );

      for (const calibration of upcomingChecks) {
        const today = new Date();
        const checkDate = new Date(calibration.intermediateCheckDate!);
        const daysUntilCheck = Math.ceil(
          (checkDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        try {
          const equip = equipmentMap.get(calibration.equipmentId) ?? {
            name: '',
            managementNumber: '',
            teamId: '',
            site: '',
          };

          this.eventEmitter.emit(NOTIFICATION_EVENTS.CALIBRATION_DUE_SOON, {
            calibrationId: calibration.id,
            equipmentId: calibration.equipmentId,
            equipmentName: equip.name,
            managementNumber: equip.managementNumber,
            teamId: equip.teamId,
            site: equip.site,
            daysUntil: daysUntilCheck,
            actorId: 'system',
            actorName: '시스템',
            timestamp: new Date(),
          });
          results.push({ calibrationId: calibration.id, success: true });
        } catch (error) {
          results.push({
            calibrationId: calibration.id,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      return {
        totalChecks: upcomingChecks.length,
        notificationsSent: results.filter((r) => r.success).length,
        notificationsFailed: results.filter((r) => !r.success).length,
        details: results,
      };
    } catch (error) {
      this.logger.error(
        '수동 중간점검 알림 트리거 실패',
        error instanceof Error ? error.stack : String(error)
      );
      throw error;
    }
  }
}
