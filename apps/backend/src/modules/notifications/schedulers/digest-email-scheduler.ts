import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { AppDatabase } from '@equipment-management/db';
import { and, eq, inArray, sql, notInArray } from 'drizzle-orm';
import * as schema from '@equipment-management/db/schema';
import {
  EquipmentStatusEnum,
  CalibrationRequiredEnum,
  CheckoutStatusEnum,
} from '@equipment-management/schemas';
import { CALIBRATION_THRESHOLDS } from '@equipment-management/shared-constants';
import { EmailService } from '../services/email.service';
import {
  EmailTemplateService,
  type OverdueEquipmentItem,
  type CalibrationDueSoonItem,
  type OverdueCheckoutItem,
} from '../services/email-template.service';
import { NotificationPreferencesService } from '../services/notification-preferences.service';

/**
 * 일간 다이제스트 이메일 스케줄러
 *
 * 매시간 정각에 실행되어, 해당 시간을 digestTime으로 설정한 사용자에게
 * 기한 초과/예정 장비를 요약한 이메일 1통을 발송한다.
 *
 * 설계:
 * - 사용자별 digestTime 존중 (07:00 ~ 10:00)
 * - 매시간 실행하되, 해당 시간과 digestTime이 일치하는 사용자만 필터
 * - 데이터가 없으면 이메일 발송하지 않음 (불필요한 메일 방지)
 * - 기존 스케줄러(CalibrationOverdue, CheckoutOverdue)와 독립 — 그쪽은 상태 전환만
 *
 * 다이제스트에 포함되는 데이터:
 * 1. 교정 기한 초과 장비 (status = non_conforming + calibration_overdue 부적합 존재)
 * 2. 교정 예정 장비 (D-7 이내)
 * 3. 반출 기한 초과 (status = overdue)
 */
@Injectable()
export class DigestEmailScheduler {
  private readonly logger = new Logger(DigestEmailScheduler.name);

  // 교정 대상에서 제외할 상태
  private readonly CALIBRATION_EXCLUDED_STATUSES = [
    EquipmentStatusEnum.enum.disposed,
    EquipmentStatusEnum.enum.pending_disposal,
    EquipmentStatusEnum.enum.inactive,
  ];

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase,
    private readonly emailService: EmailService,
    private readonly emailTemplateService: EmailTemplateService,
    private readonly preferencesService: NotificationPreferencesService
  ) {}

  /**
   * 매시간 정각 실행
   *
   * 현재 시각(HH:00)과 사용자 digestTime이 일치하면 다이제스트 발송.
   */
  @Cron('0 * * * *')
  async handleCron(): Promise<void> {
    const now = new Date();
    const currentHour = now.getUTCHours().toString().padStart(2, '0') + ':00';

    try {
      const result = await this.sendDigestForTime(currentHour);
      if (result.sent > 0) {
        this.logger.log(
          `다이제스트 발송 완료 (${currentHour} UTC): ${result.sent}명 발송, ${result.skipped}명 건너뜀`
        );
      }
    } catch (err) {
      this.logger.error(
        `다이제스트 발송 실패 (${currentHour} UTC)`,
        err instanceof Error ? err.stack : String(err)
      );
    }
  }

  /**
   * 특정 시간대 다이제스트 발송
   *
   * @param digestTime - 'HH:00' 형식 (UTC)
   */
  async sendDigestForTime(digestTime: string): Promise<{ sent: number; skipped: number }> {
    // 1. 해당 시간 + 이메일 활성화 사용자 조회
    const targetUsers = await this.db
      .select({
        userId: schema.notificationPreferences.userId,
      })
      .from(schema.notificationPreferences)
      .where(
        and(
          eq(schema.notificationPreferences.emailEnabled, true),
          eq(schema.notificationPreferences.digestTime, digestTime)
        )
      );

    if (targetUsers.length === 0) return { sent: 0, skipped: 0 };

    // 2. 다이제스트 데이터 수집 (전체 — 사용자 필터는 이후 적용)
    const [calibrationOverdue, calibrationDueSoon, checkoutOverdue] = await Promise.all([
      this.getCalibrationOverdueItems(),
      this.getCalibrationDueSoonItems(),
      this.getCheckoutOverdueItems(),
    ]);

    const hasData =
      calibrationOverdue.length > 0 || calibrationDueSoon.length > 0 || checkoutOverdue.length > 0;

    if (!hasData) return { sent: 0, skipped: targetUsers.length };

    // 3. 이메일 주소 조회
    const userIds = targetUsers.map((u) => u.userId);
    const users = await this.db
      .select({ id: schema.users.id, email: schema.users.email })
      .from(schema.users)
      .where(inArray(schema.users.id, userIds));

    // 4. 다이제스트 이메일 빌드
    const today = new Date().toISOString().split('T')[0];
    const emailContent = this.emailTemplateService.buildDailyDigestEmail(today, {
      calibrationOverdue: calibrationOverdue.length > 0 ? calibrationOverdue : undefined,
      calibrationDueSoon: calibrationDueSoon.length > 0 ? calibrationDueSoon : undefined,
      checkoutOverdue: checkoutOverdue.length > 0 ? checkoutOverdue : undefined,
    });

    // 5. 병렬 발송
    const results = await Promise.all(
      users
        .filter((u) => u.email)
        .map((u) =>
          this.emailService
            .sendMail({ to: u.email, subject: emailContent.subject, html: emailContent.html })
            .then(() => 'success' as const)
            .catch(() => 'failed' as const)
        )
    );

    const sent = results.filter((r) => r === 'success').length;
    return { sent, skipped: targetUsers.length - sent };
  }

  /** 교정 기한 초과 장비 조회 */
  private async getCalibrationOverdueItems(): Promise<OverdueEquipmentItem[]> {
    const rows = await this.db
      .select({
        name: schema.equipment.name,
        managementNumber: schema.equipment.managementNumber,
        nextCalibrationDate: schema.equipment.nextCalibrationDate,
      })
      .from(schema.equipment)
      .where(
        and(
          eq(schema.equipment.isActive, true),
          eq(schema.equipment.status, EquipmentStatusEnum.enum.non_conforming),
          eq(schema.equipment.calibrationRequired, CalibrationRequiredEnum.enum.required),
          sql`${schema.equipment.nextCalibrationDate} IS NOT NULL`,
          sql`${schema.equipment.nextCalibrationDate} < NOW()`
        )
      );

    return rows.map((r) => ({
      equipmentName: r.name ?? '',
      managementNumber: r.managementNumber ?? '',
      dueDate: r.nextCalibrationDate?.toISOString().split('T')[0] ?? '',
    }));
  }

  /** 교정 예정 장비 조회 (D-7 이내) */
  private async getCalibrationDueSoonItems(): Promise<CalibrationDueSoonItem[]> {
    const thresholdDays = CALIBRATION_THRESHOLDS.WARNING_DAYS;
    const rows = await this.db
      .select({
        name: schema.equipment.name,
        managementNumber: schema.equipment.managementNumber,
        nextCalibrationDate: schema.equipment.nextCalibrationDate,
      })
      .from(schema.equipment)
      .where(
        and(
          eq(schema.equipment.isActive, true),
          eq(schema.equipment.calibrationRequired, CalibrationRequiredEnum.enum.required),
          notInArray(schema.equipment.status, this.CALIBRATION_EXCLUDED_STATUSES),
          sql`${schema.equipment.nextCalibrationDate} IS NOT NULL`,
          sql`${schema.equipment.nextCalibrationDate} >= NOW()`,
          sql`${schema.equipment.nextCalibrationDate} <= NOW() + make_interval(days => ${thresholdDays})`
        )
      );

    const now = new Date();
    return rows.map((r) => {
      const dueDate = r.nextCalibrationDate!;
      const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        equipmentName: r.name ?? '',
        managementNumber: r.managementNumber ?? '',
        daysLeft: Math.max(0, daysLeft),
        dueDate: dueDate.toISOString().split('T')[0],
      };
    });
  }

  /**
   * 반출 기한 초과 조회
   *
   * checkout → checkoutItems는 1:N 관계이므로 fan-out 중복 방지 필요.
   * Map 기반 dedup으로 checkout당 첫 번째 item만 취득 (CheckoutOverdueScheduler 패턴).
   */
  private async getCheckoutOverdueItems(): Promise<OverdueCheckoutItem[]> {
    const rows = await this.db
      .select({
        checkoutId: schema.checkouts.id,
        equipmentName: schema.equipment.name,
        managementNumber: schema.equipment.managementNumber,
        expectedReturnDate: schema.checkouts.expectedReturnDate,
      })
      .from(schema.checkouts)
      .leftJoin(schema.checkoutItems, eq(schema.checkoutItems.checkoutId, schema.checkouts.id))
      .leftJoin(schema.equipment, eq(schema.equipment.id, schema.checkoutItems.equipmentId))
      .where(eq(schema.checkouts.status, CheckoutStatusEnum.enum.overdue));

    // checkout당 첫 번째 item만 (fan-out dedup)
    const seen = new Map<string, OverdueCheckoutItem>();
    for (const r of rows) {
      if (!seen.has(r.checkoutId)) {
        seen.set(r.checkoutId, {
          equipmentName: r.equipmentName ?? '',
          managementNumber: r.managementNumber ?? '',
          expectedReturnDate: r.expectedReturnDate?.toISOString().split('T')[0] ?? '',
        });
      }
    }
    return [...seen.values()];
  }
}
