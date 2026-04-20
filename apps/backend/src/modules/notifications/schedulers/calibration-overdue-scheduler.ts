import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { eq, and, inArray, isNull, notInArray, sql } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import { equipment, equipmentIncidentHistory } from '@equipment-management/db/schema';
import { nonConformances } from '@equipment-management/db/schema/non-conformances';
import {
  NOTIFICATION_CONFIG,
  EXCLUDED_OVERDUE_EQUIPMENT_STATUSES,
} from '@equipment-management/shared-constants';
import {
  EquipmentStatusEnum,
  NonConformanceStatusEnum,
  NonConformanceTypeEnum,
  IncidentTypeEnum,
  DEFAULT_LOCALE,
  CalibrationRequiredEnum,
} from '@equipment-management/schemas';
import { NotificationsService } from '../notifications.service';
import { CacheInvalidationHelper } from '../../../common/cache/cache-invalidation.helper';
import { I18nService } from '../../../common/i18n/i18n.service';
import { getUtcStartOfDay } from '../../../common/utils';
import { NOTIFICATION_EVENTS } from '../events/notification-events';

/**
 * 교정 기한 초과 자동 부적합 전환 스케줄러
 *
 * 기능:
 * 1. 교정 기한이 초과된 장비를 자동으로 non_conforming 상태로 전환
 * 2. calibration_overdue 유형의 부적합 기록 생성
 * 3. 사고 이력(incident_history)에 자동 등록
 * 4. 관리자에게 알림 발송
 *
 * 실행 주기: 매일 자정 (00:00 UTC)
 *
 * 제외 조건:
 * - 이미 non_conforming 상태인 장비
 * - disposed, pending_disposal, retired, inactive 상태 장비
 * - calibrationRequired != 'required' 장비
 * - 이미 calibration_overdue 유형 부적합이 존재하는 장비
 *
 * 성능: 배치 inArray 쿼리로 기존 부적합 중복 확인 (N+1 방지)
 */
@Injectable()
export class CalibrationOverdueScheduler implements OnModuleInit {
  private readonly logger = new Logger(CalibrationOverdueScheduler.name);

  constructor(
    @Inject('DRIZZLE_INSTANCE')
    private readonly db: AppDatabase,
    private readonly notificationsService: NotificationsService,
    private readonly cacheInvalidationHelper: CacheInvalidationHelper,
    private readonly eventEmitter: EventEmitter2,
    private readonly i18n: I18nService
  ) {}

  /**
   * 앱 시작 시 즉시 실행 (CheckoutOverdueScheduler 패턴과 동일)
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('애플리케이션 시작 시 교정 기한 초과 점검 실행...');
    try {
      const result = await this.handleCalibrationOverdueCheck();
      this.logger.log(
        `초기 교정 기한 초과 점검 완료: 처리 ${result.processed}건, 생성 ${result.created}건, 건너뜀 ${result.skipped}건`
      );
    } catch (error) {
      this.logger.error(
        '초기 교정 기한 초과 점검 실패',
        error instanceof Error ? error.stack : String(error)
      );
    }
  }

  /**
   * 매 시간 정각(00분)에 자동 실행
   *
   * 변경 이유: 매일 자정만 실행하면 교정기한 초과 직후 반영 지연
   * 해결책: 1시간마다 실행하여 신속한 상태 전환 보장
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleCron(): Promise<void> {
    this.logger.log('교정 기한 초과 자동 점검 시작 (자동 스케줄)');
    try {
      const result = await this.handleCalibrationOverdueCheck();
      this.logger.log(
        `교정 기한 초과 자동 점검 완료: 처리 ${result.processed}건, 생성 ${result.created}건, 건너뜀 ${result.skipped}건`
      );
    } catch (error) {
      this.logger.error(
        '교정 기한 초과 자동 점검 실패',
        error instanceof Error ? error.stack : String(error)
      );
    }
  }

  /**
   * 교정 기한 초과 장비 점검 및 부적합 자동 생성
   *
   * @returns 처리 결과 통계
   */
  async handleCalibrationOverdueCheck(): Promise<{
    processed: number;
    created: number;
    skipped: number;
    details: Array<{
      equipmentId: string;
      managementNumber: string;
      action: 'created' | 'skipped';
      reason?: string;
    }>;
  }> {
    const today = getUtcStartOfDay();
    const details: Array<{
      equipmentId: string;
      managementNumber: string;
      action: 'created' | 'skipped';
      reason?: string;
    }> = [];

    let created = 0;
    let skipped = 0;

    try {
      // 1. 교정 기한 초과 + 활성 상태 장비 조회
      // 조건: nextCalibrationDate < today AND status NOT IN excluded AND calibrationRequired = 'required'
      const overdueEquipment = await this.db
        .select({
          id: equipment.id,
          managementNumber: equipment.managementNumber,
          name: equipment.name,
          status: equipment.status,
          nextCalibrationDate: equipment.nextCalibrationDate,
          teamId: equipment.teamId,
          site: equipment.site,
        })
        .from(equipment)
        .where(
          and(
            eq(equipment.isActive, true),
            eq(equipment.calibrationRequired, CalibrationRequiredEnum.enum.required),
            sql`${equipment.nextCalibrationDate} IS NOT NULL`,
            sql`${equipment.nextCalibrationDate} < ${today.toISOString()}::timestamp`,
            notInArray(equipment.status, [...EXCLUDED_OVERDUE_EQUIPMENT_STATUSES])
          )
        );

      this.logger.log(`교정 기한 초과 장비 ${overdueEquipment.length}개 발견`);

      if (overdueEquipment.length === 0) {
        return { processed: 0, created: 0, skipped: 0, details: [] };
      }

      // 2. 배치 중복 확인: 이미 calibration_overdue 부적합이 있는 장비 ID 조회 (N+1 방지)
      const overdueIds = overdueEquipment.map((e) => e.id);
      const existingNcRows = await this.db
        .select({ equipmentId: nonConformances.equipmentId })
        .from(nonConformances)
        .where(
          and(
            inArray(nonConformances.equipmentId, overdueIds),
            eq(nonConformances.ncType, NonConformanceTypeEnum.enum.calibration_overdue),
            isNull(nonConformances.deletedAt),
            eq(nonConformances.status, NonConformanceStatusEnum.enum.open)
          )
        );
      const existingNcSet = new Set(existingNcRows.map((r) => r.equipmentId));

      // 3. 각 장비에 대해 처리
      for (const equip of overdueEquipment) {
        try {
          // 배치 조회 결과로 O(1) 중복 확인
          if (existingNcSet.has(equip.id)) {
            // 이미 처리 중인 부적합 존재 → 건너뜀
            this.logger.debug(
              `장비 ${equip.managementNumber}(${equip.id}): 기존 calibration_overdue 부적합 존재, 건너뜀`
            );
            details.push({
              equipmentId: equip.id,
              managementNumber: equip.managementNumber,
              action: 'skipped',
              reason: '기존 calibration_overdue 부적합 존재',
            });
            skipped++;
            continue;
          }

          // 3-1. 트랜잭션으로 부적합 생성 + 장비 상태 변경 + 사고 이력 등록
          const txResult = await this.db.transaction(async (tx) => {
            // TOCTOU 방어: 트랜잭션 내에서 중복 재확인
            // (배치 체크는 fast path 최적화, 여기가 실제 안전 게이트)
            const [existingInTx] = await tx
              .select({ id: nonConformances.id })
              .from(nonConformances)
              .where(
                and(
                  eq(nonConformances.equipmentId, equip.id),
                  eq(nonConformances.ncType, NonConformanceTypeEnum.enum.calibration_overdue),
                  isNull(nonConformances.deletedAt),
                  eq(nonConformances.status, NonConformanceStatusEnum.enum.open)
                )
              )
              .limit(1);

            if (existingInTx) {
              this.logger.debug(
                `장비 ${equip.managementNumber}(${equip.id}): 트랜잭션 내 중복 발견, 건너뜀`
              );
              return 'skipped' as const;
            }

            const discoveryDate = today.toISOString().split('T')[0];

            // (A) 부적합 생성 (previousEquipmentStatus: close 시 장비 상태 복원에 사용)
            const [nc] = await tx
              .insert(nonConformances)
              .values({
                equipmentId: equip.id,
                discoveryDate,
                discoveredBy: null, // 시스템 자동 생성
                cause: this.i18n.t('system.calibrationOverdue.ncCause', DEFAULT_LOCALE, {
                  nextCalibrationDate: equip.nextCalibrationDate?.toISOString().split('T')[0] ?? '',
                }),
                ncType: NonConformanceTypeEnum.enum.calibration_overdue,
                actionPlan: this.i18n.t(
                  'system.calibrationOverdue.defaultActionPlan',
                  DEFAULT_LOCALE
                ),
                status: NonConformanceStatusEnum.enum.open,
                previousEquipmentStatus: equip.status,
              })
              .returning();

            // (B) 장비 상태를 non_conforming으로 변경 (version bump로 CAS 일관성 보장)
            await tx
              .update(equipment)
              .set({
                status: EquipmentStatusEnum.enum.non_conforming,
                version: sql`version + 1`,
                updatedAt: new Date(),
              } as Record<string, unknown>)
              .where(eq(equipment.id, equip.id));

            // (C) 사고 이력 자동 등록
            await tx.insert(equipmentIncidentHistory).values({
              equipmentId: equip.id,
              occurredAt: today,
              incidentType: IncidentTypeEnum.enum.calibration_overdue,
              content: this.i18n.t('system.calibrationOverdue.incidentContent', DEFAULT_LOCALE),
              reportedBy: null, // 시스템 자동
              nonConformanceId: nc.id, // 구조적 FK로 부적합 연결
            });

            this.logger.log(
              `장비 ${equip.managementNumber}(${equip.id}): 부적합 생성 완료 (NC ID: ${nc.id})`
            );
            return 'created' as const;
          });

          // 트랜잭션 내 중복 감지로 건너뛴 경우
          if (txResult === 'skipped') {
            details.push({
              equipmentId: equip.id,
              managementNumber: equip.managementNumber,
              action: 'skipped',
              reason: '트랜잭션 내 중복 발견 (TOCTOU 방어)',
            });
            skipped++;
            continue;
          }

          // 3-2. 캐시 무효화 (트랜잭션 완료 후)
          await this.cacheInvalidationHelper.invalidateAfterEquipmentUpdate(
            equip.id,
            true, // statusChanged: available → non_conforming
            false // teamIdChanged
          );

          this.logger.debug(`장비 ${equip.managementNumber}(${equip.id}): 캐시 무효화 완료`);

          // 3-3. 알림 이벤트 발행 (레지스트리 기반 수신자 자동 해석)
          // 스케줄러 컨텍스트 — fire-and-forget 의도:
          // HTTP response 경로 아님, 알림 전송 실패가 배치 로직을 차단하지 않는다.
          // NotificationEventListener 콜백은 sync 이므로 emitAsync로 바꿔도 동작 동일.
          // 자세한 정책: docs/references/backend-patterns.md "Event Emission: emit vs emitAsync".
          try {
            this.eventEmitter.emit(NOTIFICATION_EVENTS.CALIBRATION_OVERDUE, {
              equipmentId: equip.id,
              equipmentName: equip.name ?? '',
              managementNumber: equip.managementNumber ?? '',
              teamId: equip.teamId ?? '',
              // RecipientResolver가 scope='site' 해석에 사용 (크로스 사이트 워크플로우)
              site: equip.site ?? '',
              nextCalibrationDate: equip.nextCalibrationDate?.toISOString().split('T')[0] ?? '',
              actorId: NOTIFICATION_CONFIG.SYSTEM_ACTOR_ID,
              actorName: '',
              timestamp: new Date(),
            });
          } catch (notifyError) {
            // 알림 실패는 전체 프로세스에 영향 주지 않음
            this.logger.warn(`알림 발송 실패 (장비: ${equip.managementNumber}): ${notifyError}`);
          }

          details.push({
            equipmentId: equip.id,
            managementNumber: equip.managementNumber,
            action: 'created',
          });
          created++;
        } catch (equipError) {
          // Partial unique index 위반 (23505) → 동시 실행 중복 → 정상 스킵
          const pgCode =
            (equipError as Record<string, unknown>)?.code ??
            ((equipError as Record<string, unknown>)?.cause as Record<string, unknown>)?.code;
          if (pgCode === '23505') {
            this.logger.debug(
              `장비 ${equip.managementNumber}(${equip.id}): unique constraint 중복 → 건너뜀`
            );
            details.push({
              equipmentId: equip.id,
              managementNumber: equip.managementNumber,
              action: 'skipped',
              reason: 'unique constraint 위반 (동시 실행 중복)',
            });
            skipped++;
          } else {
            this.logger.error(
              `장비 ${equip.managementNumber}(${equip.id}) 처리 실패: ${equipError}`
            );
            details.push({
              equipmentId: equip.id,
              managementNumber: equip.managementNumber,
              action: 'skipped',
              reason: equipError instanceof Error ? equipError.message : String(equipError),
            });
            skipped++;
          }
        }
      }

      return {
        processed: overdueEquipment.length,
        created,
        skipped,
        details,
      };
    } catch (error) {
      this.logger.error(
        '교정 기한 초과 점검 실패',
        error instanceof Error ? error.stack : String(error)
      );
      throw error;
    }
  }
}
