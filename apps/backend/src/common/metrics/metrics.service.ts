import { Injectable } from '@nestjs/common';
import { Registry, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
import type { SystemErrorEventDropReason } from '../system-health/contract';

@Injectable()
export class MetricsService {
  private readonly registry: Registry;
  private readonly httpRequestTotal: Counter;
  private readonly httpRequestDuration: Histogram;
  private readonly httpRequestsInProgress: Gauge;
  private readonly pendingApprovalsGauge: Gauge;
  private readonly activeCheckoutsGauge: Gauge;
  private readonly calibrationOverdueGauge: Gauge;
  private readonly nonConformingEquipmentGauge: Gauge;
  private readonly systemErrorEventDropsCounter: Counter;
  private readonly zodValidationIssuesCounter: Counter;

  constructor() {
    this.registry = new Registry();
    collectDefaultMetrics({ register: this.registry });

    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'],
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
      registers: [this.registry],
    });

    this.httpRequestsInProgress = new Gauge({
      name: 'http_requests_in_progress',
      help: 'Number of HTTP requests currently in progress',
      labelNames: ['method', 'route'],
      registers: [this.registry],
    });

    this.pendingApprovalsGauge = new Gauge({
      name: 'equipment_pending_approvals_total',
      help: '현재 대기 중인 승인 요청 수',
      labelNames: ['type'],
      registers: [this.registry],
    });

    this.activeCheckoutsGauge = new Gauge({
      name: 'equipment_active_checkouts_total',
      help: '현재 활성(반출 중인) 체크아웃 수',
      registers: [this.registry],
    });

    this.calibrationOverdueGauge = new Gauge({
      name: 'equipment_calibration_overdue_total',
      help: '교정 기한이 초과된 장비 수',
      registers: [this.registry],
    });

    this.nonConformingEquipmentGauge = new Gauge({
      name: 'equipment_non_conforming_total',
      help: '부적합 상태 장비 수',
      registers: [this.registry],
    });

    this.systemErrorEventDropsCounter = new Counter({
      name: 'system_error_events_drops_total',
      help: 'Total system error events dropped by rate-limit/dedupe/truncate/fallback gates.',
      labelNames: ['reason'],
      registers: [this.registry],
    });

    this.zodValidationIssuesCounter = new Counter({
      name: 'zod_validation_issues_total',
      help: 'Total Zod validation issues emitted per response, bucketed by issue count (ADR-0008 §4).',
      labelNames: ['domain_route', 'issue_count_bucket'],
      registers: [this.registry],
    });
  }

  incrementHttpRequestTotal(method: string, route: string, status: string): void {
    this.httpRequestTotal.inc({ method, route, status });
  }

  observeHttpRequestDuration(
    method: string,
    route: string,
    status: string,
    duration: number
  ): void {
    this.httpRequestDuration.observe({ method, route, status }, duration);
  }

  incrementHttpRequestsInProgress(method: string, route: string): void {
    this.httpRequestsInProgress.inc({ method, route });
  }

  decrementHttpRequestsInProgress(method: string, route: string): void {
    this.httpRequestsInProgress.dec({ method, route });
  }

  setPendingApprovals(count: number, type: string = 'all'): void {
    this.pendingApprovalsGauge.set({ type }, count);
  }

  setActiveCheckouts(count: number): void {
    this.activeCheckoutsGauge.set(count);
  }

  setCalibrationOverdue(count: number): void {
    this.calibrationOverdueGauge.set(count);
  }

  setNonConformingEquipment(count: number): void {
    this.nonConformingEquipmentGauge.set(count);
  }

  /**
   * Async-work-backlog provider 가 사용하는 read API.
   *
   * 모든 label 값을 합산 — `equipment_pending_approvals_total{type=...}` 라벨 다중 시 (예: checkout/calibration)
   * 전체 backlog 를 의미. 라벨이 없으면 단일 값. gauge 가 한 번도 set 되지 않았으면 0.
   */
  async readPendingApprovalsTotal(): Promise<number> {
    const snapshot = await this.pendingApprovalsGauge.get();
    return snapshot.values.reduce((sum, entry) => sum + (entry.value ?? 0), 0);
  }

  async readActiveCheckoutsTotal(): Promise<number> {
    const snapshot = await this.activeCheckoutsGauge.get();
    return snapshot.values.reduce((sum, entry) => sum + (entry.value ?? 0), 0);
  }

  incrementSystemErrorEventDrops(reason: SystemErrorEventDropReason): void {
    this.systemErrorEventDropsCounter.inc({ reason });
  }

  observeZodIssueCount(domainRoute: string, issueCount: number): void {
    const bucket: '1' | '2-5' | '6-10' | '11+' =
      issueCount <= 1 ? '1' : issueCount <= 5 ? '2-5' : issueCount <= 10 ? '6-10' : '11+';
    this.zodValidationIssuesCounter.inc({ domain_route: domainRoute, issue_count_bucket: bucket });
  }

  getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }
}
