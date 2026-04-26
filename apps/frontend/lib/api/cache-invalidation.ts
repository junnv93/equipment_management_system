import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from './query-config';

/**
 * 장비 캐시 무효화 헬퍼
 *
 * 목적:
 * - React Query 캐시 무효화 로직 중앙화
 * - 상세/목록 페이지 간 데이터 동기화 보장
 * - 일관된 무효화 패턴 적용
 *
 * SSOT 원칙:
 * - queryKeys (query-config.ts)에서 정의된 키 구조 사용
 * - 중복 코드 제거 (Promise.all([invalidate...]) 패턴 통합)
 *
 * 사용 위치:
 * - NC 생성/업데이트 시
 * - 장비 상태 변경 시
 * - 폐기 요청 처리 시
 * - 사고 이력 등록 시
 */
export class EquipmentCacheInvalidation {
  /**
   * 모든 장비 캐시 무효화 (목록 + 상세)
   *
   * 사용 시점:
   * - 대량 장비 변경 (예: 스케줄러 실행 후)
   * - 전체 재동기화 필요 시
   * - 여러 장비가 영향받는 작업 후
   *
   * 무효화 범위:
   * - 모든 목록 변형 (필터 조합 무관)
   * - 모든 장비 상세
   * - 모든 하위 리소스 (NC, 사고 이력 등)
   *
   * @example
   * ```typescript
   * // 대량 상태 변경 후
   * await EquipmentCacheInvalidation.invalidateAll(queryClient);
   * ```
   */
  static async invalidateAll(queryClient: QueryClient): Promise<void> {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.equipment.all,
      exact: false, // 하위 모든 쿼리 매칭
    });
  }

  /**
   * 특정 장비 상세 + 목록 무효화
   *
   * 사용 시점:
   * - 단일 장비 업데이트 (상태, 정보 등)
   * - NC 생성 (장비 상태 → non_conforming)
   * - 폐기 처리 (장비 상태 → retired)
   * - 사고 이력 등록 (장비 상태 영향 가능)
   *
   * 무효화 전략:
   * 1. 특정 장비 상세 + 모든 하위 리소스
   *    (NC, 사고 이력, 폐기 요청 등)
   * 2. 모든 목록 변형
   *    (상태 변경 시 필터링 결과 달라짐)
   *
   * 왜 목록도 무효화?
   * - 예: available → non_conforming 시
   *   status=available 필터 결과에서 제외됨
   * - 예: 팀 변경 시 teamId 필터 결과 달라짐
   *
   * @param queryClient - React Query 클라이언트
   * @param equipmentId - 장비 UUID
   *
   * @example
   * ```typescript
   * // NC 생성 후
   * await EquipmentCacheInvalidation.invalidateEquipment(queryClient, equipmentId);
   *
   * // 장비 정보 수정 후
   * await EquipmentCacheInvalidation.invalidateEquipment(queryClient, equipmentId);
   * ```
   */
  static async invalidateEquipment(queryClient: QueryClient, equipmentId: string): Promise<void> {
    await Promise.all([
      // 1. 특정 장비 상세 + 하위 리소스
      queryClient.invalidateQueries({
        queryKey: queryKeys.equipment.detail(equipmentId),
        exact: false, // 하위 리소스도 함께 무효화
      }),
      // 2. 모든 목록 변형 (상태 변경으로 필터링 영향)
      queryClient.invalidateQueries({
        queryKey: queryKeys.equipment.lists(),
        exact: false, // 모든 필터 조합 매칭
      }),
      // 3. 대시보드 캐시 무효화 (장비 상태 변경 시 통계 영향)
      DashboardCacheInvalidation.invalidateAll(queryClient),
    ]);
  }

  /**
   * 장비 데이터 즉시 refetch (중요 업데이트용)
   *
   * 사용 시점:
   * - 사용자가 즉시 UI 업데이트 기대
   * - 상태 배지가 최신 상태 반영해야 함
   * - 무효화만으로는 느릴 때 (마운트 안 된 쿼리는 refetch 안 됨)
   *
   * invalidate vs refetch:
   * - invalidate: 데이터를 stale로 표시 (다음 mount/focus 시 refetch)
   * - refetch: 즉시 데이터 재요청 (마운트된 쿼리만 해당)
   *
   * @param queryClient - React Query 클라이언트
   * @param equipmentId - 장비 UUID
   *
   * @example
   * ```typescript
   * // NC 생성 후 즉시 UI 업데이트
   * await EquipmentCacheInvalidation.invalidateEquipment(queryClient, equipmentId);
   * await EquipmentCacheInvalidation.refetchEquipment(queryClient, equipmentId);
   * ```
   */
  static async refetchEquipment(queryClient: QueryClient, equipmentId: string): Promise<void> {
    await Promise.all([
      // 1. 상세 페이지 refetch (마운트된 경우만)
      queryClient.refetchQueries({
        queryKey: queryKeys.equipment.detail(equipmentId),
        type: 'active', // 마운트된 쿼리만 refetch
      }),
      // 2. 목록 페이지 refetch (마운트된 경우만)
      queryClient.refetchQueries({
        queryKey: queryKeys.equipment.lists(),
        type: 'active', // 마운트된 쿼리만 refetch
      }),
    ]);
  }

  /**
   * NC 생성 후 캐시 무효화
   *
   * 무효화 대상:
   * - 장비 상세 + 목록 (상태 변경)
   * - NC 목록 (새 NC 추가)
   *
   * @param queryClient - React Query 클라이언트
   * @param equipmentId - 장비 UUID
   * @param ncId - 생성된 NC UUID (선택)
   *
   * @example
   * ```typescript
   * await EquipmentCacheInvalidation.invalidateAfterNonConformanceCreation(
   *   queryClient,
   *   equipmentId,
   *   ncId
   * );
   * ```
   */
  static async invalidateAfterNonConformanceCreation(
    queryClient: QueryClient,
    equipmentId: string,
    ncId?: string
  ): Promise<void> {
    await Promise.all([
      // 1. 장비 관련 캐시
      this.invalidateEquipment(queryClient, equipmentId),
      // 2. NC 목록 캐시
      queryClient.invalidateQueries({
        queryKey: queryKeys.nonConformances.all,
        exact: false,
      }),
      // 3. 특정 NC 상세 (ncId 제공 시)
      ncId
        ? queryClient.invalidateQueries({
            queryKey: queryKeys.nonConformances.detail(ncId),
          })
        : Promise.resolve(),
    ]);
  }

  /**
   * 폐기 처리 후 캐시 무효화
   *
   * 무효화 대상:
   * - 장비 상세 + 목록 (상태 → retired)
   * - 폐기 요청 목록
   *
   * @param queryClient - React Query 클라이언트
   * @param equipmentId - 장비 UUID
   *
   * @example
   * ```typescript
   * await EquipmentCacheInvalidation.invalidateAfterDisposal(
   *   queryClient,
   *   equipmentId
   * );
   * ```
   */
  static async invalidateAfterDisposal(
    queryClient: QueryClient,
    equipmentId: string
  ): Promise<void> {
    await Promise.all([
      // 1. 장비 관련 캐시
      this.invalidateEquipment(queryClient, equipmentId),
      // 2. 폐기 요청 목록
      queryClient.invalidateQueries({
        queryKey: queryKeys.disposal.all,
        exact: false,
      }),
    ]);
  }

  /**
   * 사고 이력 등록 후 캐시 무효화
   *
   * 무효화 대상:
   * - 장비 사고 이력 목록
   * - 장비 상세 (사고로 상태 변경 가능)
   *
   * @param queryClient - React Query 클라이언트
   * @param equipmentId - 장비 UUID
   *
   * @example
   * ```typescript
   * await EquipmentCacheInvalidation.invalidateAfterIncidentHistory(
   *   queryClient,
   *   equipmentId
   * );
   * ```
   */
  static async invalidateAfterIncidentHistory(
    queryClient: QueryClient,
    equipmentId: string
  ): Promise<void> {
    await Promise.all([
      // 1. 장비 사고 이력
      queryClient.invalidateQueries({
        queryKey: queryKeys.equipment.incidentHistory(equipmentId),
      }),
      // 2. 장비 상세 (사고로 상태 변경 가능)
      queryClient.invalidateQueries({
        queryKey: queryKeys.equipment.detail(equipmentId),
        exact: false,
      }),
      // 3. 목록도 무효화 (상태 변경 시 필터링 영향)
      queryClient.invalidateQueries({
        queryKey: queryKeys.equipment.lists(),
        exact: false,
      }),
    ]);
  }
}

/**
 * 장비 반입 캐시 무효화 헬퍼
 *
 * 장비 반입(equipment-imports) 상태 변경 후 관련 캐시를 무효화.
 * 반입 상태 변경은 승인 카운트, 장비 목록, 대시보드 통계에도 영향하므로 교차 무효화 포함.
 *
 * 교차 엔티티 영향:
 * - approve/reject: 승인 카운트 변동
 * - receive: 장비 자동 생성 → 장비 목록 + 대시보드
 * - initiateReturn: checkout 생성 → checkout 목록 + 장비 상태
 * - cancel: 승인 카운트 변동
 */
export class EquipmentImportCacheInvalidation {
  /**
   * 모든 장비 반입 캐시 무효화 (목록 + 상세)
   */
  static async invalidateAll(queryClient: QueryClient): Promise<void> {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.equipmentImports.all,
      exact: false,
    });
  }

  /**
   * 특정 장비 반입 상세 + 목록 무효화
   */
  static async invalidateImport(queryClient: QueryClient, importId: string): Promise<void> {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.equipmentImports.detail(importId),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.equipmentImports.lists(),
        exact: false,
      }),
    ]);
  }

  /**
   * 승인/반려 후 무효화 (승인 카운트 + 알림 포함)
   *
   * 사용 시점:
   * - approve: pending → approved (승인 카운트 감소)
   * - reject: pending → rejected (승인 카운트 감소)
   */
  static async invalidateAfterApprovalAction(
    queryClient: QueryClient,
    importId: string
  ): Promise<void> {
    await Promise.all([
      this.invalidateImport(queryClient, importId),
      DashboardCacheInvalidation.invalidateAll(queryClient),
      queryClient.invalidateQueries({
        queryKey: queryKeys.approvals.countsAll,
        exact: false,
      }),
      NotificationCacheInvalidation.invalidateAll(queryClient),
    ]);
  }

  /**
   * 수령 확인 후 무효화 (장비 자동 생성 → 장비 + 대시보드 교차 무효화)
   *
   * 사용 시점:
   * - receive: approved → received (장비 자동 등록됨)
   */
  static async invalidateAfterReceive(queryClient: QueryClient, importId: string): Promise<void> {
    await Promise.all([
      this.invalidateImport(queryClient, importId),
      // 장비 자동 생성 → 장비 목록 무효화
      EquipmentCacheInvalidation.invalidateAll(queryClient),
      DashboardCacheInvalidation.invalidateAll(queryClient),
    ]);
  }

  /**
   * 반납 시작 후 무효화 (checkout 생성 + 장비 상태 변경)
   *
   * 사용 시점:
   * - initiateReturn: received → return_requested (checkout 자동 생성)
   */
  static async invalidateAfterInitiateReturn(
    queryClient: QueryClient,
    importId: string
  ): Promise<void> {
    await Promise.all([
      this.invalidateImport(queryClient, importId),
      // checkout 자동 생성 → checkout 목록 뷰 무효화 (view.all() 축)
      CheckoutCacheInvalidation.invalidateViews(queryClient),
      // 장비 상태 변경 → 장비 목록 무효화
      EquipmentCacheInvalidation.invalidateAll(queryClient),
      DashboardCacheInvalidation.invalidateAll(queryClient),
    ]);
  }

  /**
   * 취소 후 무효화 (승인 카운트 변동)
   *
   * 사용 시점:
   * - cancel: pending/approved → canceled
   */
  static async invalidateAfterCancel(queryClient: QueryClient, importId: string): Promise<void> {
    await Promise.all([
      this.invalidateImport(queryClient, importId),
      queryClient.invalidateQueries({
        queryKey: queryKeys.approvals.countsAll,
        exact: false,
      }),
    ]);
  }
}

/**
 * 부적합 관리 캐시 무효화 헬퍼
 *
 * NC 상태 변경, 종결, 반려 후 관련 캐시를 무효화.
 * NC 상태 변경은 장비 상태와 대시보드 통계에도 영향하므로 교차 무효화 포함.
 */
export class NonConformanceCacheInvalidation {
  /**
   * 모든 부적합 캐시 무효화 (목록 + 상세)
   */
  static async invalidateAll(queryClient: QueryClient): Promise<void> {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.nonConformances.all,
      exact: false,
    });
  }

  /**
   * 특정 부적합 상세 + 목록 무효화
   */
  static async invalidateNC(queryClient: QueryClient, ncId: string): Promise<void> {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.nonConformances.detail(ncId),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.nonConformances.lists(),
        exact: false,
      }),
    ]);
  }

  /**
   * NC 상태 변경 후 무효화 (장비 + 대시보드 포함)
   *
   * 사용 시점:
   * - 조치 완료 (open → corrected)
   * - 종결 (corrected → closed) → 장비 상태 available 복원
   * - 반려 (corrected → open)
   */
  static async invalidateAfterStatusChange(
    queryClient: QueryClient,
    ncId: string,
    equipmentId?: string
  ): Promise<void> {
    await Promise.all([
      this.invalidateNC(queryClient, ncId),
      // 장비 상태 영향 (closed 시 non_conforming → available)
      equipmentId
        ? EquipmentCacheInvalidation.invalidateEquipment(queryClient, equipmentId)
        : Promise.resolve(),
      // 대시보드 통계 영향
      DashboardCacheInvalidation.invalidateAll(queryClient),
      // 승인 카운트 영향 (corrected 목록 변동)
      queryClient.invalidateQueries({
        queryKey: queryKeys.approvals.countsAll,
        exact: false,
      }),
    ]);
  }
}

/**
 * 알림 캐시 무효화 헬퍼
 *
 * 승인/반려 등 상태 변경 후 알림 캐시를 무효화하여
 * 배지 카운트와 드롭다운이 최신 상태를 반영하도록 한다.
 */
export class NotificationCacheInvalidation {
  /**
   * 모든 알림 캐시 무효화 (목록 + 미읽음 카운트)
   *
   * 사용 시점:
   * - 승인/반려 처리 후 (관련 알림 발생)
   * - 벌크 승인 후
   * - 알림 설정 변경 후
   */
  static async invalidateAll(queryClient: QueryClient): Promise<void> {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.notifications.all,
      exact: false,
    });
  }
}

/**
 * 교정계획서 캐시 무효화 헬퍼
 */
export class CalibrationPlansCacheInvalidation {
  /**
   * 모든 교정계획서 캐시 무효화
   */
  static async invalidateAll(queryClient: QueryClient): Promise<void> {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.calibrationPlans.all,
      exact: false,
    });
  }

  /**
   * 특정 교정계획서 상세 + 목록 + 버전 히스토리 무효화
   * versions는 REFETCH_STRATEGIES.STATIC이므로 명시적 invalidate 필수
   */
  static async invalidatePlan(queryClient: QueryClient, planId: string): Promise<void> {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.calibrationPlans.detail(planId),
        exact: false,
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.calibrationPlans.lists(),
        exact: false,
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.calibrationPlans.versions(planId),
        exact: false,
      }),
    ]);
  }

  /**
   * 상태 변경 후 무효화 (대시보드 포함)
   */
  static async invalidateAfterStatusChange(
    queryClient: QueryClient,
    planId: string
  ): Promise<void> {
    await Promise.all([
      this.invalidatePlan(queryClient, planId),
      DashboardCacheInvalidation.invalidateAll(queryClient),
    ]);
  }
}

/**
 * 교정 캐시 무효화 헬퍼
 *
 * 교정 승인/반려 후 관련 캐시를 무효화.
 * 승인 시 장비(교정일 업데이트) + NC(overdue 자동 조치) + 대시보드에 교차 영향.
 * 반려 시 대시보드 승인 카운트만 영향 (장비 상태 변경 없음).
 */
export class CalibrationCacheInvalidation {
  /** 교정 승인 후 무효화 대상 키 — 장비/NC/대시보드 교차 무효화 */
  static readonly APPROVE_KEYS: ReadonlyArray<readonly unknown[]> = [
    queryKeys.calibrations.all,
    queryKeys.equipment.all,
    queryKeys.nonConformances.all,
    queryKeys.dashboard.all,
    queryKeys.approvals.countsAll,
    queryKeys.notifications.all,
  ];

  /** 교정 반려 후 무효화 대상 키 — 장비 상태 변경 없으므로 대시보드만 */
  static readonly REJECT_KEYS: ReadonlyArray<readonly unknown[]> = [
    queryKeys.calibrations.all,
    queryKeys.dashboard.all,
    queryKeys.approvals.countsAll,
    queryKeys.notifications.all,
  ];

  /** 교정 등록 후 무효화 — 전체 교정 키 + 장비/문서/승인/알림 교차 무효화 */
  static async invalidateAfterCreate(queryClient: QueryClient, equipmentId: string): Promise<void> {
    const keys = [
      queryKeys.calibrations.all, // summary/overdue/upcoming/pending/historyList 포함
      queryKeys.documents.byEquipment(equipmentId),
      queryKeys.equipment.detail(equipmentId),
      queryKeys.equipment.lists(),
      queryKeys.dashboard.all,
      queryKeys.approvals.countsAll, // 승인 대기 카운트 (pending_approval 상태)
      queryKeys.notifications.all, // 승인자 알림 즉시 반영
      queryKeys.calibrationPlans.all, // 계획 item actualCalibrationId 링크 반영
    ];
    await Promise.all(
      keys.map((key) => queryClient.invalidateQueries({ queryKey: key, refetchType: 'active' }))
    );
  }
}

/**
 * 체크아웃 캐시 무효화 헬퍼
 *
 * 체크아웃 승인/반려/반입 후 관련 캐시를 무효화.
 * 체크아웃 상태 변경은 승인 카운트에도 영향하므로 교차 무효화 포함.
 */
export class CheckoutCacheInvalidation {
  /** 체크아웃 승인/반려 후 무효화 대상 키 */
  static readonly APPROVAL_KEYS: ReadonlyArray<readonly unknown[]> = [
    queryKeys.checkouts.all, // view.* + resource.* 전체 (광역)
    queryKeys.equipment.all,
    queryKeys.approvals.all,
    queryKeys.approvals.countsAll,
    queryKeys.dashboard.all, // 승인 대기 건수 변동 → 대시보드 통계 영향
  ];

  /** 반출 시작 후 무효화 대상 키 (장비 상태 checked_out 전이) */
  static readonly START_KEYS: ReadonlyArray<readonly unknown[]> = [
    queryKeys.checkouts.all,
    queryKeys.equipment.all, // 장비 상태 → checked_out
    queryKeys.dashboard.all, // 대시보드 통계 영향
  ];

  /** 반입 승인 후 무효화 대상 키 (장비 상태 available 복원) */
  static readonly RETURN_APPROVAL_KEYS: ReadonlyArray<readonly unknown[]> = [
    queryKeys.checkouts.all,
    queryKeys.equipment.all, // 장비 상태 → available 복원
    queryKeys.approvals.all,
    queryKeys.approvals.countsAll,
    queryKeys.dashboard.all, // 대시보드 통계 영향
  ];

  /** 반입 제출(반출→반입) 후 무효화 대상 키 */
  static readonly RETURN_KEYS: ReadonlyArray<readonly unknown[]> = [
    queryKeys.checkouts.all,
    queryKeys.equipment.all, // 반입 처리 시 장비 상태 변경 대비
    queryKeys.approvals.all,
    queryKeys.approvals.countsAll,
    queryKeys.dashboard.all, // 승인 대기 건수 변동 → 대시보드 통계 영향
  ];

  /**
   * 상수 기반 캐시 무효화 범용 메서드
   *
   * *_KEYS 상수를 SSOT로 활용하여 일관된 무효화 수행.
   * invalidateKeys 파라미터에 직접 상수를 전달하는 선언적 패턴과 동일한 효과.
   */
  static async invalidateByKeys(
    queryClient: QueryClient,
    keys: ReadonlyArray<readonly unknown[]>
  ): Promise<void> {
    await Promise.all(
      keys.map((key) => queryClient.invalidateQueries({ queryKey: key, exact: false }))
    );
  }

  /**
   * 체크아웃 승인/반려 후 캐시 무효화
   * SSOT: APPROVAL_KEYS 상수 기반
   */
  static async invalidateAfterApproval(queryClient: QueryClient): Promise<void> {
    await CheckoutCacheInvalidation.invalidateByKeys(queryClient, this.APPROVAL_KEYS);
  }

  /**
   * 목록 뷰 축만 무효화 (view.* prefix)
   *
   * 사용 시점:
   * - 새 반출 생성 후 목록만 갱신 (상세/카운트 무관)
   * - 외부 반입 → 반출 전환 후 inbound 목록 갱신
   *
   * view.all() = ['checkouts', 'view'] — resource.* 는 영향 없음
   */
  static async invalidateViews(queryClient: QueryClient): Promise<void> {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.checkouts.view.all(),
      exact: false,
    });
  }
}

/**
 * 대시보드 캐시 무효화 헬퍼
 */
export class DashboardCacheInvalidation {
  /**
   * 모든 대시보드 캐시 무효화
   *
   * 사용 시점:
   * - 장비 상태 변경 (통계 영향)
   * - 팀 필터 변경
   * - 권한 변경
   */
  static async invalidateAll(queryClient: QueryClient): Promise<void> {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard.all,
      exact: false,
    });
  }
}
