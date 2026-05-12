import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CacheInvalidationHelper } from './cache-invalidation.helper';
import { SimpleCacheService } from './simple-cache.service';
import {
  CACHE_INVALIDATION_REGISTRY,
  type CacheInvalidationAction,
  type CacheInvalidationRule,
} from './cache-event.registry';
import { CACHE_EVENTS } from './cache-events';
import { NOTIFICATION_EVENTS } from '../../modules/notifications/events/notification-events';

/**
 * 도메인 이름 동의어 — CACHE_EVENTS와 NOTIFICATION_EVENTS의 네이밍이 다른 경우.
 *
 * CACHE_EVENTS의 도메인 표기 → NOTIFICATION_EVENTS의 도메인 표기.
 * 예: `cache.swValidation.submitted` ↔ `softwareValidation.submitted`.
 *
 * 새 도메인 동의어가 도입되면 여기에 등록.
 */
const CACHE_TO_NOTIFICATION_DOMAIN_SYNONYM: Readonly<Record<string, string>> = {
  swValidation: 'softwareValidation',
};

/**
 * Dual-channel exclusivity 검증 — 부팅타임 invariant.
 *
 * 원칙: 동일 logical 비즈니스 이벤트(예: software validation submitted)의 캐시 무효화는
 * 단일 채널만 담당해야 한다.
 *   - CACHE_EVENTS 채널: 캐시 무효화 전용
 *   - NOTIFICATION_EVENTS 채널: 알림 발송 + downstream side-effect 전용 (캐시 무효화 금지)
 *
 * 회귀 시나리오 (검출 대상):
 *   service.emitAsync(CACHE_EVENTS.SW_VALIDATION_SUBMITTED)
 *     → registry rule R1 실행 (invalidateAllDashboard + 패턴 삭제)
 *   service.emitAsync(NOTIFICATION_EVENTS.SOFTWARE_VALIDATION_SUBMITTED)
 *     → registry rule R2 실행 (R1과 동일한 무효화)
 *   동일 status 전이마다 R1 + R2가 2x 실행됨 → p99 latency 증가
 *
 * 검출 방식: 네이밍 규약 기반 mirror pair 탐지.
 *   CACHE_EVENTS의 값이 `cache.<domain>.<verb>` 형태이면, `<domain>` 동의어 변환 후
 *   `<domain>.<verb>` 형태가 NOTIFICATION_EVENTS 값에 존재하는지 검사.
 *   양쪽 모두 registry에 등록되어 있고 actions+patterns가 일치하면 violation.
 *
 * 신규 도메인 명명 규칙:
 *   - CACHE_EVENTS: `cache.<domainCamel>.<verbCamel>` (e.g. `cache.calibration.created`)
 *   - NOTIFICATION_EVENTS: `<domainCamel>.<verbCamel>` (e.g. `calibration.created`)
 *   이 규칙을 따르면 자동으로 mirror 보호됨.
 *
 * 정당한 cross-channel rule duplication (false positive 회피):
 *   - `TEST_SOFTWARE_REVALIDATION_REQUIRED` (NOTIFICATION)와 `SW_VALIDATION_*` (CACHE)는
 *     동일 cache prefix를 무효화하지만 서로 다른 비즈니스 이벤트 (system 자동 vs 사용자 status 전이).
 *     이름이 mirror가 아니므로 본 invariant에서 자동 제외됨.
 */
export function validateDualChannelExclusivity(
  registry: Record<string, CacheInvalidationRule> = CACHE_INVALIDATION_REGISTRY
): void {
  const notificationEventValues = new Set<string>(Object.values(NOTIFICATION_EVENTS));

  const signatureOf = (rule: CacheInvalidationRule): string => {
    const sortedActions = [...rule.actions]
      .map((a) => JSON.stringify(a, Object.keys(a).sort()))
      .sort();
    const sortedPatterns = [...(rule.patterns ?? [])].map((p) => p.pattern).sort();
    return JSON.stringify({ actions: sortedActions, patterns: sortedPatterns });
  };

  /**
   * `cache.<domain>.<verb>` → `<normalizedDomain>.<verb>` 으로 변환 (mirror 후보 도출).
   * `cache.` prefix가 없으면 null (mirror 가능성 없음).
   */
  const deriveNotificationMirror = (cacheEventValue: string): string | null => {
    if (!cacheEventValue.startsWith('cache.')) return null;
    const stripped = cacheEventValue.slice('cache.'.length);
    const dotIndex = stripped.indexOf('.');
    if (dotIndex < 0) return null;
    const domain = stripped.slice(0, dotIndex);
    const rest = stripped.slice(dotIndex);
    const normalizedDomain = CACHE_TO_NOTIFICATION_DOMAIN_SYNONYM[domain] ?? domain;
    return `${normalizedDomain}${rest}`;
  };

  const violations: string[] = [];
  for (const cacheEventValue of Object.values(CACHE_EVENTS)) {
    const mirror = deriveNotificationMirror(cacheEventValue);
    if (!mirror) continue;
    if (!notificationEventValues.has(mirror)) continue;

    const cacheRule = registry[cacheEventValue];
    const notiRule = registry[mirror];
    if (!cacheRule || !notiRule) continue;

    if (signatureOf(cacheRule) === signatureOf(notiRule)) {
      violations.push(
        `  CACHE_EVENTS:        ${cacheEventValue}\n` +
          `  NOTIFICATION_EVENTS: ${mirror}\n` +
          `  → 동일 logical 이벤트의 mirror pair가 양 채널에 동일 invalidation rule로 등록됨.\n` +
          `    NOTIFICATION_EVENTS는 알림 전용으로 유지하고 캐시 무효화는 CACHE_EVENTS 채널로 통합하세요\n` +
          `    (cache-event.registry.ts — calibration 도메인 패턴 참조).`
      );
    }
  }

  if (violations.length > 0) {
    throw new Error(
      `[CacheEventListener] dual-channel exclusivity 위반 — ${violations.length}건 발견:\n\n${violations.join('\n\n')}`
    );
  }
}

/**
 * 이벤트 기반 캐시 무효화 리스너
 *
 * NotificationEventListener와 동일한 패턴:
 * - onModuleInit에서 CACHE_INVALIDATION_REGISTRY의 모든 이벤트에 리스너 자동 등록
 * - fire-and-forget: 캐시 무효화 실패가 비즈니스 로직을 차단하지 않음
 * - 선언적: 새 이벤트 = cache-event.registry.ts에 규칙 추가 → 코드 변경 0
 *
 * 기존 수동 캐시 무효화와의 관계:
 * - 이 리스너는 대시보드/교차 엔티티 캐시 무효화를 보장하는 안전망 역할
 * - 서비스 내부의 로컬 캐시 무효화(detail 키 삭제 등)는 트랜잭션 동기적 무효화로 유지
 * - 중복 무효화는 성능 영향 무시 가능 (in-memory Map 삭제 = O(1))
 */
@Injectable()
export class CacheEventListener implements OnModuleInit {
  private readonly logger = new Logger(CacheEventListener.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly cacheHelper: CacheInvalidationHelper,
    private readonly cacheService: SimpleCacheService
  ) {}

  onModuleInit(): void {
    // 부팅타임 invariant: dual-channel exclusivity 위반은 즉시 fail-fast.
    // 회귀 시나리오 — NOTIFICATION_EVENTS/CACHE_EVENTS 양쪽이 동일 캐시 무효화를 수행하면
    // status 전이마다 중복 invalidateAllDashboard + 패턴 삭제 → p99 latency 증가.
    validateDualChannelExclusivity();

    const eventNames = Object.keys(CACHE_INVALIDATION_REGISTRY);

    for (const eventName of eventNames) {
      // async 콜백: Promise 반환 → emitter.emitAsync(...)가 await하여 read-after-write 일관성 보장.
      // 에러는 내부에서 catch하여 로그만 남기고 resolve (비즈니스 로직 차단 금지 원칙 유지).
      this.eventEmitter.on(eventName, async (payload: Record<string, unknown>) => {
        try {
          await this.handleEvent(eventName, payload);
        } catch (err) {
          this.logger.error(
            `캐시 무효화 실패 [${eventName}]: ${err instanceof Error ? err.message : String(err)}`,
            err instanceof Error ? err.stack : undefined
          );
        }
      });
    }

    this.logger.log(`${eventNames.length}개 캐시 무효화 이벤트 리스너 등록 완료`);
  }

  private async handleEvent(eventName: string, payload: Record<string, unknown>): Promise<void> {
    const rule = CACHE_INVALIDATION_REGISTRY[eventName];
    if (!rule) return;

    const tasks: Promise<void>[] = [];

    // 1. CacheInvalidationHelper 메서드 호출
    for (const action of rule.actions) {
      tasks.push(this.executeAction(action, payload));
    }

    // 2. 패턴 기반 캐시 삭제 (동기 — Map.delete)
    if (rule.patterns) {
      for (const { pattern } of rule.patterns) {
        this.cacheService.deleteByPattern(pattern);
      }
    }

    // 3. CacheInvalidationHelper 비동기 작업 완료 대기
    await Promise.all(tasks);

    this.logger.debug(
      `✓ [${eventName}] 캐시 무효화 완료 (${rule.actions.length} actions, ${rule.patterns?.length ?? 0} patterns)`
    );
  }

  private async executeAction(
    action: CacheInvalidationAction,
    payload: Record<string, unknown>
  ): Promise<void> {
    switch (action.method) {
      case 'invalidateAllDashboard':
        return this.cacheHelper.invalidateAllDashboard();

      case 'invalidateAllEquipment':
        return this.cacheHelper.invalidateAllEquipment();

      case 'invalidateEquipmentDetail': {
        const equipmentId = this.extractField(payload, action.equipmentIdField ?? 'equipmentId');
        if (equipmentId) return this.cacheHelper.invalidateEquipmentDetail(equipmentId);
        return;
      }

      case 'invalidateEquipmentLists':
        return this.cacheHelper.invalidateEquipmentLists();

      case 'invalidateAfterEquipmentUpdate': {
        const equipmentId = this.extractField(payload, action.equipmentIdField ?? 'equipmentId');
        if (equipmentId) {
          return this.cacheHelper.invalidateAfterEquipmentUpdate(
            equipmentId,
            action.statusChanged ?? true,
            action.teamIdChanged ?? false
          );
        }
        return;
      }

      case 'invalidateAfterNonConformanceCreation': {
        const equipmentId = this.extractField(payload, action.equipmentIdField ?? 'equipmentId');
        if (equipmentId) return this.cacheHelper.invalidateAfterNonConformanceCreation(equipmentId);
        return;
      }

      case 'invalidateAfterNonConformanceStatusChange': {
        const equipmentId = this.extractField(payload, action.equipmentIdField ?? 'equipmentId');
        if (equipmentId) {
          return this.cacheHelper.invalidateAfterNonConformanceStatusChange(
            equipmentId,
            action.equipmentStatusChanged ?? false
          );
        }
        return;
      }

      case 'invalidateNcDerivedCaches': {
        const equipmentId = this.extractField(payload, action.equipmentIdField ?? 'equipmentId');
        if (equipmentId) return this.cacheHelper.invalidateNcDerivedCaches(equipmentId);
        return;
      }

      case 'invalidateAfterDisposal': {
        const equipmentId = this.extractField(payload, action.equipmentIdField ?? 'equipmentId');
        if (equipmentId) return this.cacheHelper.invalidateAfterDisposal(equipmentId);
        return;
      }

      case 'invalidateAfterCalibrationPlanUpdate': {
        const planId = this.extractField(payload, action.planIdField ?? 'planId');
        if (planId) return this.cacheHelper.invalidateAfterCalibrationPlanUpdate(planId);
        return;
      }
    }
  }

  private extractField(payload: Record<string, unknown>, field: string): string | null {
    const value = payload[field];
    if (typeof value === 'string' && value.length > 0) return value;

    this.logger.warn(`페이로드에 '${field}' 필드 없음 — 무효화 건너뜀`);
    return null;
  }
}
