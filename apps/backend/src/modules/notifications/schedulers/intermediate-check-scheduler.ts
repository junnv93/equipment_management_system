import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from '../notifications.service';
import { CalibrationService } from '../../calibration/calibration.service';

// 알림 주기 정의 (D-30일, D-7일, 당일)
const NOTIFICATION_INTERVALS = [30, 7, 0] as const;

/**
 * 중간점검 알림 스케줄러
 *
 * 이 서비스는 교정 중간점검 예정 알림을 발송합니다.
 * 알림 주기: D-30일, D-7일, 당일
 *
 * 실제 스케줄링은 외부 cron 작업 또는 NotificationsController의 트리거 엔드포인트를 통해 수행됩니다.
 *
 * @Cron 데코레이터를 사용하려면 @nestjs/schedule 패키지를 설치하세요:
 * npm install @nestjs/schedule
 *
 * 그리고 AppModule에 ScheduleModule.forRoot()를 추가하세요.
 */
@Injectable()
export class IntermediateCheckScheduler {
  private readonly logger = new Logger(IntermediateCheckScheduler.name);

  // 중복 알림 방지를 위한 발송 기록 저장소
  // 실제 운영 환경에서는 Redis 또는 데이터베이스를 사용해야 함
  private sentNotifications: Map<string, Set<number>> = new Map();

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly calibrationService: CalibrationService
  ) {}

  /**
   * 중복 알림 방지 키 생성
   * @param calibrationId 교정 ID
   * @param daysUntil 남은 일수
   * @returns 고유 키 문자열
   */
  private getNotificationKey(calibrationId: string, daysUntil: number): string {
    // 일수를 구간으로 매핑 (30, 7, 0)
    let interval: number;
    if (daysUntil >= 30) {
      interval = 30;
    } else if (daysUntil >= 7) {
      interval = 7;
    } else {
      interval = 0;
    }
    return `${calibrationId}_${interval}`;
  }

  /**
   * 알림이 이미 발송되었는지 확인
   */
  private hasAlreadySent(calibrationId: string, daysUntil: number): boolean {
    const intervals = this.sentNotifications.get(calibrationId);
    if (!intervals) return false;

    // 해당 구간에 이미 알림을 보냈는지 확인
    if (daysUntil >= 30) {
      return intervals.has(30);
    } else if (daysUntil >= 7) {
      return intervals.has(7);
    } else {
      return intervals.has(0);
    }
  }

  /**
   * 발송 기록 저장
   */
  private markAsSent(calibrationId: string, daysUntil: number): void {
    if (!this.sentNotifications.has(calibrationId)) {
      this.sentNotifications.set(calibrationId, new Set());
    }

    // 해당 구간 기록
    if (daysUntil >= 30) {
      this.sentNotifications.get(calibrationId)!.add(30);
    } else if (daysUntil >= 7) {
      this.sentNotifications.get(calibrationId)!.add(7);
    } else {
      this.sentNotifications.get(calibrationId)!.add(0);
    }
  }

  /**
   * 당일인지 확인 (0일 남음)
   */
  private shouldSendForInterval(daysUntil: number): boolean {
    // D-30, D-7, 당일(0)에만 알림 발송
    return NOTIFICATION_INTERVALS.includes(daysUntil as (typeof NOTIFICATION_INTERVALS)[number]);
  }

  /**
   * 중간점검 예정 알림을 발송합니다.
   * D-30일, D-7일, 당일에 중간점검 예정 알림을 발송합니다.
   * 중복 알림 방지 로직이 포함되어 있습니다.
   *
   * 이 메서드는 다음 방법으로 호출할 수 있습니다:
   * 1. 외부 cron 작업에서 API 호출
   * 2. 관리자가 수동으로 트리거
   * 3. @nestjs/schedule 설치 후 @Cron 데코레이터 사용
   */
  async handleIntermediateCheckNotifications(days: number = 30) {
    this.logger.log('중간점검 알림 스케줄러 실행 시작 (D-30, D-7, 당일 주기)');

    try {
      // D-30일까지의 중간점검 예정 조회
      const upcomingChecks = await this.calibrationService.findUpcomingIntermediateChecks(days);

      this.logger.log(`${upcomingChecks.length}개의 중간점검 예정 항목 발견`);

      let sentCount = 0;
      let skippedCount = 0;

      for (const calibration of upcomingChecks) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // 날짜만 비교하기 위해 시간 초기화
        const checkDate = new Date(calibration.intermediateCheckDate!);
        checkDate.setHours(0, 0, 0, 0);
        const daysUntilCheck = Math.ceil(
          (checkDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        // D-30, D-7, 당일에만 알림 발송
        if (!this.shouldSendForInterval(daysUntilCheck)) {
          continue;
        }

        // 중복 알림 방지 체크
        if (this.hasAlreadySent(calibration.id, daysUntilCheck)) {
          this.logger.debug(`중복 알림 건너뜀: 교정 ID ${calibration.id}, D-${daysUntilCheck}`);
          skippedCount++;
          continue;
        }

        // 담당자에게 중간점검 알림 발송
        if (calibration.calibrationManagerId) {
          try {
            await this.notificationsService.createIntermediateCheckNotification(
              calibration.id,
              calibration.equipmentId,
              calibration.calibrationManagerId,
              daysUntilCheck,
              `장비 ${calibration.equipmentId}`
            );

            // 발송 기록 저장
            this.markAsSent(calibration.id, daysUntilCheck);
            sentCount++;

            this.logger.log(
              `중간점검 알림 발송 완료: 교정 ID ${calibration.id}, 담당자 ${calibration.calibrationManagerId}, D-${daysUntilCheck}`
            );
          } catch (error) {
            this.logger.error(
              `중간점검 알림 발송 실패: 교정 ID ${calibration.id}`,
              error instanceof Error ? error.stack : String(error)
            );
          }
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
   * 교정 알림과 함께 중간점검 알림을 통합 발송합니다.
   * D-30일, D-7일, 당일에 교정 예정 알림을 발송합니다.
   * 교정 예정일과 중간점검 예정일이 있는 경우 둘 다 알림을 발송합니다.
   * 중복 알림 방지 로직이 포함되어 있습니다.
   */
  async handleCombinedCalibrationNotifications(days: number = 30) {
    this.logger.log('통합 교정/중간점검 알림 스케줄러 실행 시작 (D-30, D-7, 당일 주기)');

    try {
      // D-30일까지의 교정 예정 조회
      const result = await this.calibrationService.findDueCalibrations(days);
      const dueCalibrations = result.items || [];

      this.logger.log(`${dueCalibrations.length}개의 교정 예정 항목 발견`);

      let sentCount = 0;
      let skippedCount = 0;

      for (const calibration of dueCalibrations) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextCalibrationDate = new Date(calibration.nextCalibrationDate);
        nextCalibrationDate.setHours(0, 0, 0, 0);
        const daysUntilCalibration = Math.ceil(
          (nextCalibrationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        // D-30, D-7, 당일에만 알림 발송
        if (!this.shouldSendForInterval(daysUntilCalibration)) {
          continue;
        }

        // 중복 알림 방지 체크 (교정 알림용 키)
        const calibrationKey = `calibration_${calibration.id}`;
        if (this.hasAlreadySent(calibrationKey, daysUntilCalibration)) {
          this.logger.debug(
            `중복 교정 알림 건너뜀: 교정 ID ${calibration.id}, D-${daysUntilCalibration}`
          );
          skippedCount++;
          continue;
        }

        // 교정 예정 알림 발송
        if (calibration.calibrationManagerId) {
          try {
            await this.notificationsService.createCalibrationDueNotification(
              calibration.equipmentId,
              calibration.calibrationManagerId,
              daysUntilCalibration,
              `장비 ${calibration.equipmentId}`
            );

            // 발송 기록 저장
            this.markAsSent(calibrationKey, daysUntilCalibration);
            sentCount++;

            this.logger.log(
              `교정 예정 알림 발송 완료: 장비 ${calibration.equipmentId}, D-${daysUntilCalibration}`
            );
          } catch (error) {
            this.logger.error(
              `교정 예정 알림 발송 실패: 장비 ${calibration.equipmentId}`,
              error instanceof Error ? error.stack : String(error)
            );
          }
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
  async triggerIntermediateCheckNotifications(days: number = 7) {
    this.logger.log(`수동 중간점검 알림 트리거: ${days}일 이내`);

    try {
      const upcomingChecks = await this.calibrationService.findUpcomingIntermediateChecks(days);
      const results: Array<{ calibrationId: string; success: boolean; error?: string }> = [];

      for (const calibration of upcomingChecks) {
        const today = new Date();
        const checkDate = new Date(calibration.intermediateCheckDate!);
        const daysUntilCheck = Math.ceil(
          (checkDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (calibration.calibrationManagerId) {
          try {
            await this.notificationsService.createIntermediateCheckNotification(
              calibration.id,
              calibration.equipmentId,
              calibration.calibrationManagerId,
              daysUntilCheck,
              `장비 ${calibration.equipmentId}`
            );
            results.push({ calibrationId: calibration.id, success: true });
          } catch (error) {
            results.push({
              calibrationId: calibration.id,
              success: false,
              error: error instanceof Error ? error.message : String(error),
            });
          }
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
