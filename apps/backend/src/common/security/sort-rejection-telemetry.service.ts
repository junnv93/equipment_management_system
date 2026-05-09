import { Injectable, Logger } from '@nestjs/common';
import type { SortRejectionEvent, SortRejectionTelemetry } from './contract';

/**
 * SortRejectionTelemetryService — sort 필드 reject 이벤트 SIEM-friendly logger.
 *
 * 설계 결정 (시니어 표준):
 *  - **별도 DB 테이블 신설 회피**: system_error_events 는 5xx 전용 SSOT (의도 위반 금지).
 *    sort rejection 은 4xx (422) → Logger.warn 으로 충분. winston/pino/Sentry 가 표준 ingest.
 *  - **fire-and-forget**: throw 안 함 — 어떤 logger 실패도 응답 흐름 차단 금지.
 *  - **In-memory rate limit + dedupe**: 단일 인스턴스 가정.
 *    클러스터 (PM2/K8s) 시 Redis Lua atomic counter 로 격상 (system-health 패턴, SHOULD 후속).
 *  - **PII deny-list 강제**: 호출자가 검증된 SortRejectionEvent 만 전달 — 본 service 는 PII 검증 안 함.
 *
 * Logger.warn 출력 형식 (SIEM 파싱 가능):
 *   `Sort field rejection: route=... method=... reason=... invalidValue=... userId=...`
 *
 * 보안팀 SIEM 통합 시 Prometheus counter `sort_rejection_total{route, reason}` 로 격상 가능 (S-3).
 */
@Injectable()
export class SortRejectionTelemetryService implements SortRejectionTelemetry {
  private readonly logger = new Logger(SortRejectionTelemetryService.name);

  /** 분당 최대 logging 건수. 폭주 시 drop. */
  private readonly maxLogsPerMinute = 60;

  /** dedupe 윈도우 — 동일 (route, invalidValue) 키. */
  private readonly dedupeWindowMs = 60_000;

  /** Map size 정리 임계치 — 상한 도달 시 stale 제거. */
  private readonly mapSizeSweepThreshold = 1000;

  /** rate limit 카운터 — 분당 윈도우. */
  private currentMinuteWindow = 0;
  private currentMinuteCount = 0;

  /** dedupe 트래커 — key = `${route}|${invalidValue}` → 마지막 logging 시각. */
  private readonly recentRejections = new Map<string, number>();

  recordSortRejection(event: SortRejectionEvent): void {
    try {
      const now = Date.now();

      // 1. rate limit — 분당 maxLogsPerMinute 초과 시 silent drop
      const minuteWindow = Math.floor(now / 60_000);
      if (minuteWindow !== this.currentMinuteWindow) {
        this.currentMinuteWindow = minuteWindow;
        this.currentMinuteCount = 0;
      }
      if (this.currentMinuteCount >= this.maxLogsPerMinute) {
        return;
      }

      // 2. dedupe — 동일 (route, invalidValue) 1분 내 중복 호출 drop
      // invalidValue 는 호출자가 truncate 가정 (200 자 cap).
      const dedupeKey = `${event.normalizedRoute}|${event.invalidValue}`;
      const lastSeen = this.recentRejections.get(dedupeKey);
      if (lastSeen !== undefined && now - lastSeen < this.dedupeWindowMs) {
        return;
      }

      // 3. Map size sweep — 상한 도달 시 stale 제거 (메모리 누수 방지)
      if (this.recentRejections.size >= this.mapSizeSweepThreshold) {
        for (const [k, t] of this.recentRejections) {
          if (now - t > this.dedupeWindowMs) {
            this.recentRejections.delete(k);
          }
        }
      }

      this.recentRejections.set(dedupeKey, now);
      this.currentMinuteCount += 1;

      // 4. structured log — SIEM 파싱 가능 형식
      // `Logger.warn(message, context)` — context 객체는 winston/pino 가 JSON 으로 직렬화.
      this.logger.warn(
        `Sort field rejection: route=${event.normalizedRoute} method=${event.httpMethod} reason=${event.reason} invalidValue=${event.invalidValue} userId=${event.userId ?? 'anonymous'}`,
        {
          event: 'sort_rejection',
          reason: event.reason,
          route: event.normalizedRoute,
          httpMethod: event.httpMethod,
          invalidValue: event.invalidValue,
          userId: event.userId,
        }
      );
    } catch (err: unknown) {
      // fire-and-forget — telemetry 자체 실패가 응답 흐름 차단 금지
      this.logger.error(
        `SortRejectionTelemetry record failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
}
