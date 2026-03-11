import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CacheInvalidationHelper } from './cache-invalidation.helper';
import { SimpleCacheService } from './simple-cache.service';
import { CACHE_INVALIDATION_REGISTRY, type CacheInvalidationAction } from './cache-event.registry';

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
    const eventNames = Object.keys(CACHE_INVALIDATION_REGISTRY);

    for (const eventName of eventNames) {
      this.eventEmitter.on(eventName, (payload: Record<string, unknown>) => {
        this.handleEvent(eventName, payload).catch((err) => {
          this.logger.error(
            `캐시 무효화 실패 [${eventName}]: ${err instanceof Error ? err.message : String(err)}`,
            err instanceof Error ? err.stack : undefined
          );
        });
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
