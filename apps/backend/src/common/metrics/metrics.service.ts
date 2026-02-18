import { Injectable } from '@nestjs/common';
import { Registry, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

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

  getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getContentType(): string {
    return this.registry.contentType;
  }
}
