import { Injectable, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { AppDatabase } from '@equipment-management/db';
import { eq, and, lt, count, inArray, isNotNull } from 'drizzle-orm';
import * as schema from '@equipment-management/db/schema';
import { CheckoutStatusValues, EquipmentStatusValues } from '@equipment-management/schemas';
import { MetricsService } from './metrics.service';

/**
 * 비즈니스 메트릭 수집기 (30초 주기 스케줄러)
 *
 * 역할:
 * - DB에서 실제 비즈니스 집계 수치를 조회
 * - MetricsService의 Gauge를 업데이트
 * - Prometheus가 /api/metrics 스크래핑 시 최신 값 제공
 *
 * 설계 원칙:
 * - DashboardService 의존 없음 (순환 의존성 방지)
 * - 단순 COUNT 쿼리만 사용 (복잡한 비즈니스 로직 없이)
 * - 실패해도 앱은 계속 동작 (메트릭 수집은 non-critical)
 */
@Injectable()
export class MetricsCollector {
  constructor(
    @Inject('DRIZZLE_INSTANCE') private readonly db: AppDatabase,
    private readonly metricsService: MetricsService
  ) {}

  /**
   * 30초마다 비즈니스 메트릭 수집
   * - Prometheus 기본 scrape_interval(15s)보다 길어야 stable한 값 제공
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async collectBusinessMetrics(): Promise<void> {
    try {
      await Promise.all([
        this.updatePendingApprovals(),
        this.updateActiveCheckouts(),
        this.updateEquipmentStatusMetrics(),
      ]);
    } catch {
      // 메트릭 수집 실패는 앱 동작에 영향 없음 — 로그만 남기고 계속
    }
  }

  /** 대기 중 승인 수 (전체) */
  private async updatePendingApprovals(): Promise<void> {
    const [result] = await this.db
      .select({ count: count() })
      .from(schema.checkouts)
      .where(eq(schema.checkouts.status, CheckoutStatusValues.PENDING));

    this.metricsService.setPendingApprovals(result?.count ?? 0, 'checkout');
  }

  /** 현재 활성(반출 중) 체크아웃 수 */
  private async updateActiveCheckouts(): Promise<void> {
    const activeStatuses = [
      CheckoutStatusValues.CHECKED_OUT,
      CheckoutStatusValues.LENDER_CHECKED,
      CheckoutStatusValues.BORROWER_RECEIVED,
    ];

    const [result] = await this.db
      .select({ count: count() })
      .from(schema.checkouts)
      .where(inArray(schema.checkouts.status, activeStatuses));

    this.metricsService.setActiveCheckouts(result?.count ?? 0);
  }

  /** 교정 초과 + 부적합 장비 수 */
  private async updateEquipmentStatusMetrics(): Promise<void> {
    const [overdueResult] = await this.db
      .select({ count: count() })
      .from(schema.equipment)
      .where(
        and(
          isNotNull(schema.equipment.nextCalibrationDate),
          lt(schema.equipment.nextCalibrationDate, new Date())
        )
      );

    const [nonConformingResult] = await this.db
      .select({ count: count() })
      .from(schema.equipment)
      .where(and(eq(schema.equipment.status, EquipmentStatusValues.NON_CONFORMING)));

    this.metricsService.setCalibrationOverdue(overdueResult?.count ?? 0);
    this.metricsService.setNonConformingEquipment(nonConformingResult?.count ?? 0);
  }
}
