import { Injectable, Logger } from '@nestjs/common';
import { SimpleCacheService } from './simple-cache.service';
import { CACHE_KEY_PREFIXES } from './cache-key-prefixes';

/**
 * 중앙화된 캐시 무효화 헬퍼
 *
 * 목적:
 * - 장비 상태 변경 시 일관된 캐시 무효화
 * - 상세/목록 페이지 간 데이터 동기화 보장
 * - CalibrationOverdueScheduler와 같은 백그라운드 작업도 캐시 무효화
 *
 * 사용 위치:
 * - EquipmentService.update()
 * - CalibrationOverdueScheduler
 * - DisposalService
 * - NonConformancesService
 * - DashboardService (dashboard:* 패턴)
 */
@Injectable()
export class CacheInvalidationHelper {
  private readonly logger = new Logger(CacheInvalidationHelper.name);

  constructor(private readonly cacheService: SimpleCacheService) {}

  /**
   * 모든 대시보드 캐시 무효화
   *
   * 사용 시점:
   * - 장비 상태 변경 (equipment update, NC 생성, 폐기 등)
   * - 체크아웃 상태 변경 (승인, 반출, 반입 등)
   * - 교정 변경
   *
   * 패턴: dashboard:*
   * 영향: 모든 대시보드 통계, 팀별 현황, 교정 현황, 승인 카운트 캐시
   */
  async invalidateAllDashboard(): Promise<void> {
    await Promise.all([
      this.cacheService.deleteByPattern(`${CACHE_KEY_PREFIXES.DASHBOARD}*`),
      this.cacheService.deleteByPattern(`${CACHE_KEY_PREFIXES.APPROVALS}*`),
    ]);
    this.logger.debug('✓ Invalidated all dashboard + approval caches');
  }

  /**
   * 승인 카운트 캐시 무효화
   *
   * 사용 시점: 승인/반려 처리 후, 새 승인 요청 생성 후
   * 패턴: approvals:*
   */
  async invalidateApprovalCounts(): Promise<void> {
    await this.cacheService.deleteByPattern(`${CACHE_KEY_PREFIXES.APPROVALS}*`);
    this.logger.debug('✓ Invalidated all approval count caches');
  }

  /**
   * 모든 장비 관련 캐시 무효화
   *
   * 사용 시점:
   * - 대량 장비 상태 변경 (스케줄러 등)
   * - 전체 재동기화 필요 시
   *
   * 패턴: equipment:*
   * 영향: 모든 목록, 상세, 카운트 캐시
   */
  async invalidateAllEquipment(): Promise<void> {
    await this.cacheService.deleteByPattern(`${CACHE_KEY_PREFIXES.EQUIPMENT}*`);
    this.logger.debug('✓ Invalidated all equipment caches');
  }

  /**
   * 특정 장비 상세 캐시 무효화
   *
   * 패턴: equipment:detail:{"uuid":"<equipmentId>"...}
   *
   * 참고:
   * - SimpleCacheService의 캐시 키는 JSON 문자열 포함
   * - 정규식 패턴으로 UUID 매칭
   */
  async invalidateEquipmentDetail(equipmentId: string): Promise<void> {
    await this.cacheService.deleteByPattern(
      `${CACHE_KEY_PREFIXES.EQUIPMENT}detail:\\{"uuid":"${equipmentId}".*`
    );
    this.logger.debug(`✓ Invalidated equipment detail: ${equipmentId}`);
  }

  /**
   * 장비 목록 캐시 무효화 (모든 필터 변형)
   *
   * 패턴:
   * - equipment:list:* (모든 필터 조합)
   * - equipment:count:* (페이지네이션 카운트)
   *
   * 왜 필요한가?
   * - 상태 변경 시 필터링 결과 달라짐
   *   (예: available → non_conforming 시 status=available 필터에서 제외)
   * - 팀 변경 시 팀별 목록 달라짐
   * - 검색 결과 캐시도 무효화 필요
   */
  async invalidateEquipmentLists(): Promise<void> {
    await Promise.all([
      this.cacheService.deleteByPattern(`${CACHE_KEY_PREFIXES.EQUIPMENT}list:*`),
      this.cacheService.deleteByPattern(`${CACHE_KEY_PREFIXES.EQUIPMENT}count:*`),
    ]);
    this.logger.debug('✓ Invalidated all equipment list caches');
  }

  /**
   * 장비 업데이트 후 스마트 무효화
   *
   * 무효화 전략:
   * 1. 특정 장비 상세 (항상)
   * 2. 모든 목록 캐시 (상태 변경 시)
   * 3. 팀 기반 캐시 (팀 변경 시)
   *
   * @param equipmentId - 장비 UUID
   * @param statusChanged - 상태가 변경되었는가? (기본: true)
   * @param teamIdChanged - 팀이 변경되었는가? (기본: false)
   *
   * 사용 예시:
   * ```typescript
   * // 상태만 변경 (NC 생성, 교정 기한 초과 등)
   * await invalidateAfterEquipmentUpdate(equipmentId, true, false);
   *
   * // 팀 변경
   * await invalidateAfterEquipmentUpdate(equipmentId, false, true);
   *
   * // 상태 + 팀 모두 변경
   * await invalidateAfterEquipmentUpdate(equipmentId, true, true);
   * ```
   */
  async invalidateAfterEquipmentUpdate(
    equipmentId: string,
    statusChanged: boolean = true,
    teamIdChanged: boolean = false
  ): Promise<void> {
    const tasks: Promise<void>[] = [
      // 1. 특정 장비 상세 무효화 (항상)
      this.invalidateEquipmentDetail(equipmentId),
      // 2. 대시보드 캐시 무효화 (장비 변경은 통계에 영향)
      this.invalidateAllDashboard(),
    ];

    // 3. 상태 변경 시 모든 목록 + 연관 엔티티 캐시 무효화
    if (statusChanged) {
      tasks.push(this.invalidateEquipmentLists());
      // 장비 상태가 변경되면 checkout 목록의 장비 참조도 stale 됨 (동기 — in-memory cache)
      this.cacheService.deleteByPattern(`${CACHE_KEY_PREFIXES.CHECKOUTS}*`);
    }

    // 4. 팀 변경 시 팀별 캐시 무효화
    if (teamIdChanged) {
      tasks.push(
        Promise.resolve(this.cacheService.deleteByPattern(`${CACHE_KEY_PREFIXES.EQUIPMENT}team:*`))
      );
    }

    await Promise.all(tasks);

    this.logger.debug(
      `✓ Smart invalidation for ${equipmentId} ` +
        `(status: ${statusChanged}, team: ${teamIdChanged})`
    );
  }

  /**
   * 부적합(NC) 생성 시 캐시 무효화
   *
   * 부적합은 장비 상태를 'non_conforming'으로 변경하므로:
   * - 장비 상세/목록 캐시 무효화 (상태 변경)
   *
   * Note: NC detail 캐시는 서비스 레벨에서 개별 삭제됨 (buildCacheKey)
   */
  async invalidateAfterNonConformanceCreation(equipmentId: string): Promise<void> {
    await this.invalidateAfterEquipmentUpdate(equipmentId, true, false);

    this.logger.debug(`✓ Invalidated caches after NC creation for equipment: ${equipmentId}`);
  }

  /**
   * 부적합(NC) 상태 변경 시 캐시 무효화
   *
   * 반려(corrected→open), 종료(corrected→closed) 시:
   * - 장비 상세/목록 캐시 무효화 (장비 상태가 변경될 수 있음)
   *
   * Note: NC detail 캐시는 서비스 레벨에서 개별 삭제됨 (buildCacheKey)
   *
   * @param equipmentId - 장비 UUID
   * @param equipmentStatusChanged - 장비 상태가 변경되었는가? (close 시 available 복원 등)
   */
  async invalidateAfterNonConformanceStatusChange(
    equipmentId: string,
    equipmentStatusChanged: boolean = false
  ): Promise<void> {
    // 장비 상태가 변경된 경우 (close 시 available 복원): 상세 + 목록 무효화
    // 변경되지 않은 경우 (rejection): 상세만 무효화
    if (equipmentStatusChanged) {
      await this.invalidateAfterEquipmentUpdate(equipmentId, true, false);
    } else {
      await this.invalidateEquipmentDetail(equipmentId);
    }

    this.logger.debug(
      `✓ Invalidated caches after NC status change for equipment: ${equipmentId} ` +
        `(equipmentStatusChanged: ${equipmentStatusChanged})`
    );
  }

  /**
   * 폐기 요청 처리 후 캐시 무효화
   *
   * 폐기는 장비 상태를 'retired'로 변경하므로:
   * - 장비 상세/목록 캐시 무효화
   * - 폐기 요청 목록 캐시 무효화
   */
  async invalidateAfterDisposal(equipmentId: string): Promise<void> {
    await Promise.all([
      this.invalidateAfterEquipmentUpdate(equipmentId, true, false), // 대시보드 무효화 포함
      this.cacheService.deleteByPattern(`${CACHE_KEY_PREFIXES.DISPOSAL_REQUESTS}*`),
    ]);

    this.logger.debug(`✓ Invalidated caches after disposal for equipment: ${equipmentId}`);
  }

  /**
   * 교정계획서 업데이트 후 캐시 무효화
   *
   * 무효화 대상:
   * - 특정 계획 상세 캐시
   * - 모든 목록 캐시 (상태/필터 변경 영향)
   */
  async invalidateAfterCalibrationPlanUpdate(planId: string): Promise<void> {
    await Promise.all([
      this.cacheService.delete(`${CACHE_KEY_PREFIXES.CALIBRATION_PLANS}detail:${planId}`),
      this.cacheService.deleteByPattern(`${CACHE_KEY_PREFIXES.CALIBRATION_PLANS}list:*`),
    ]);

    this.logger.debug(`✓ Invalidated calibration plan caches: ${planId}`);
  }
}
