import { ApiProperty } from '@nestjs/swagger';

/**
 * 대시보드 요약 정보 DTO
 */
export class DashboardSummaryDto {
  @ApiProperty({ description: '전체 장비 수' })
  totalEquipment: number;

  @ApiProperty({ description: '사용 가능 장비 수' })
  availableEquipment: number;

  @ApiProperty({ description: '활성 반출 수 (대여 포함)' })
  activeCheckouts: number;

  @ApiProperty({ description: '교정 예정 장비 수' })
  upcomingCalibrations: number;
}

/**
 * 팀별 장비 현황 DTO
 */
export class EquipmentByTeamDto {
  @ApiProperty({ description: '팀 ID' })
  id: string;

  @ApiProperty({ description: '팀 이름' })
  name: string;

  @ApiProperty({ description: '장비 수' })
  count: number;
}

/**
 * 교정 지연 장비 DTO
 */
export class OverdueCalibrationDto {
  @ApiProperty({ description: '장비 ID' })
  id: string;

  @ApiProperty({ description: '장비명' })
  name: string;

  @ApiProperty({ description: '교정 예정일' })
  dueDate: string;

  @ApiProperty({ description: '지연 일수' })
  daysOverdue: number;

  @ApiProperty({ description: '관리번호' })
  managementNumber: string;

  @ApiProperty({ description: '팀 이름', required: false })
  teamName?: string;
}

/**
 * 교정 예정 장비 DTO
 */
export class UpcomingCalibrationDto {
  @ApiProperty({ description: '장비 ID' })
  id: string;

  @ApiProperty({ description: '장비명' })
  equipmentName: string;

  @ApiProperty({ description: '장비 ID (별칭)' })
  equipmentId: string;

  @ApiProperty({ description: '교정 예정일' })
  dueDate: string;

  @ApiProperty({ description: '남은 일수' })
  daysUntilDue: number;

  @ApiProperty({ description: '관리번호' })
  managementNumber: string;
}

/**
 * 반출 지연 DTO (대여/교정/수리 포함)
 *
 * checkout-checkoutItem 1:N 관계에서 각 행은 checkoutItem 단위.
 * id = checkout ID (상세 링크용), checkoutItemId = 고유 행 식별자 (React key용).
 */
export class OverdueCheckoutDto {
  @ApiProperty({ description: '반출 ID (checkout)' })
  id: string;

  @ApiProperty({ description: '반출 항목 ID (checkout_item, 고유 행 식별자)' })
  checkoutItemId: string;

  @ApiProperty({ description: '장비 ID' })
  equipmentId: string;

  @ApiProperty({ description: '장비 정보', required: false })
  equipment?: {
    id: string;
    name: string;
    managementNumber: string;
  };

  @ApiProperty({ description: '사용자 ID' })
  userId: string;

  @ApiProperty({ description: '사용자 정보', required: false })
  user?: {
    id: string;
    name: string;
    email: string;
  };

  @ApiProperty({ description: '반납 예정일' })
  expectedReturnDate: string;

  @ApiProperty({ description: '지연 일수' })
  daysOverdue: number;

  @ApiProperty({ description: '반출 시작일' })
  startDate: string;

  @ApiProperty({ description: '상태' })
  status: string;

  @ApiProperty({ description: '소속 팀명', required: false })
  teamName?: string;
}

/**
 * @deprecated Use OverdueCheckoutDto instead
 */
export const OverdueRentalDto = OverdueCheckoutDto;

/**
 * 반납 예정 반출 DTO (달력용)
 *
 * checkout-checkoutItem 1:N 관계에서 각 행은 checkoutItem 단위.
 * id = checkout ID (상세 링크용), checkoutItemId = 고유 행 식별자 (React key용).
 */
export class UpcomingCheckoutReturnDto {
  @ApiProperty({ description: '반출 ID (checkout)' })
  id: string;

  @ApiProperty({ description: '반출 항목 ID (checkout_item, 고유 행 식별자)' })
  checkoutItemId: string;

  @ApiProperty({ description: '장비명' })
  equipmentName: string;

  @ApiProperty({ description: '관리번호' })
  managementNumber: string;

  @ApiProperty({ description: '반납 예정일' })
  expectedReturnDate: string;

  @ApiProperty({ description: '남은 일수' })
  daysUntilReturn: number;

  @ApiProperty({ description: '반출 목적' })
  purpose: string;
}

/**
 * 최근 활동 내역 DTO
 */
export class RecentActivityDto {
  @ApiProperty({ description: '활동 ID' })
  id: string;

  @ApiProperty({ description: '활동 유형' })
  type: string;

  @ApiProperty({ description: '장비 ID' })
  equipmentId: string;

  @ApiProperty({ description: '장비명' })
  equipmentName: string;

  @ApiProperty({ description: '사용자 ID' })
  userId: string;

  @ApiProperty({ description: '사용자명' })
  userName: string;

  @ApiProperty({ description: '타임스탬프' })
  timestamp: string;

  @ApiProperty({ description: '상세 내용' })
  details: string;

  @ApiProperty({ description: '엔티티 ID', required: false })
  entityId?: string;

  @ApiProperty({ description: '엔티티 이름', required: false })
  entityName?: string;
}

/**
 * 승인 대기 카운트 DTO
 */
export class PendingApprovalCountsDto {
  @ApiProperty({ description: '장비 승인 대기 수' })
  equipment: number;

  @ApiProperty({ description: '교정 승인 대기 수' })
  calibration: number;

  @ApiProperty({ description: '반출 승인 대기 수 (대여 포함)' })
  checkout: number;

  @ApiProperty({ description: '소프트웨어 승인 대기 수' })
  software: number;

  @ApiProperty({ description: '전체 승인 대기 수' })
  total: number;
}

/**
 * 장비 상태별 통계 DTO
 */
export type EquipmentStatusStatsDto = Record<string, number>;

// ============================================================================
// 대시보드 개선안 v1 — 신규 응답 DTO
// ============================================================================

/** §A.7 — 반출 현황 카드 항목 */
export class CheckoutScopeItemDto {
  @ApiProperty({ description: 'checkout ID (상세 링크)' }) id: string;
  @ApiProperty({ description: 'checkout_item ID (행 식별)' }) checkoutItemId: string;
  @ApiProperty({ description: '장비명' }) equipmentName: string;
  @ApiProperty({ description: '관리번호', nullable: true }) managementNumber?: string;
  @ApiProperty({ description: '반납 예정일 ISO' }) expectedReturnDate: string;
  @ApiProperty({ description: '반납까지 남은 일수 (음수 허용 — 초과)' })
  daysUntilDue: number;
}

/**
 * §A.7 — 반출 현황 응답 (scope 통합).
 * scope = 'me' | 'team' | 'lab' | 'all' — 권한 가드는 컨트롤러에서.
 */
export class DashboardCheckoutsScopeDto {
  @ApiProperty({ description: '반납 예정 (오늘~30일)', type: () => [CheckoutScopeItemDto] })
  pendingReturns: CheckoutScopeItemDto[];

  @ApiProperty({ description: '기한 초과 건수' })
  overdueCount: number;

  @ApiProperty({
    description: '대기 중인 반출 신청 건수 (scope=me 한정)',
    required: false,
    nullable: true,
  })
  pendingRequests?: number;
}

/**
 * §3.9 — 시스템관리자 시스템 상태 응답.
 */
export class SystemHealthMetricsDto {
  @ApiProperty({ enum: ['healthy', 'degraded', 'down'] as const })
  overallStatus: 'healthy' | 'degraded' | 'down';

  @ApiProperty() activeUsers: number;
  @ApiProperty() maxUsers: number;
  @ApiProperty({ description: 'DB 응답시간 (ms)' }) dbResponseMs: number;
  @ApiProperty({ description: '스토리지 사용률 (%)' }) storagePct: number;
  @ApiProperty({ description: '대기 큐 길이' }) queueSize: number;
  @ApiProperty({ description: '최근 24시간 오류 수' }) errorCount24h: number;
  @ApiProperty({ description: '측정 시각 ISO' }) measuredAt: string;
}

/**
 * §4.3 — 품질책임자 검토 대기 hero 응답.
 */
export class QualityReviewPendingDto {
  @ApiProperty() pendingCount: number;
  @ApiProperty({ description: '평균 대기 일수' }) avgWaitDays: number;
  @ApiProperty({ description: '최장 대기 일수' }) maxWaitDays: number;
  @ApiProperty({ description: '이번 주 처리 완료' }) thisWeekProcessed: number;
  @ApiProperty({ description: '이번 주 처리 대상 (carryover 포함)' }) thisWeekTotal: number;
  @ApiProperty({ description: '처리율 % (소수점 반올림). 0건 분모일 때 100.' })
  processingRate: number;
}

/**
 * §A.4 — 시험실무자 빠른 요약 응답.
 */
export class MyQuickSummaryDto {
  @ApiProperty({ description: '내가 신청한 반출 중 대기 상태 수' })
  pendingCheckoutRequests: number;

  @ApiProperty({
    description: '교정 등록 임박 (없으면 undefined)',
    required: false,
    nullable: true,
  })
  upcomingCalibrations?: { count: number; nearestDays: number };

  @ApiProperty({ description: '내가 다뤄야 할 부적합 항목 수' })
  nonconformanceItems: number;
}

/**
 * 대시보드 집계 DTO (SSR 단일 요청용)
 *
 * 7개 서브 요청을 하나의 응답으로 묶습니다.
 * null 필드 = 해당 데이터 조회 실패 (부분 실패 허용).
 */
export class DashboardAggregateDto {
  @ApiProperty({
    description: '요약 정보 (null = 조회 실패)',
    nullable: true,
    type: () => DashboardSummaryDto,
  })
  summary: DashboardSummaryDto | null;

  @ApiProperty({
    description: '팀별 장비 현황 (null = 조회 실패)',
    nullable: true,
    type: () => [EquipmentByTeamDto],
  })
  equipmentByTeam: EquipmentByTeamDto[] | null;

  @ApiProperty({
    description: '교정 지연 장비 (null = 조회 실패)',
    nullable: true,
  })
  overdueCalibrations: { items: OverdueCalibrationDto[]; hasMore: boolean } | null;

  @ApiProperty({
    description: '교정 예정 장비 (null = 조회 실패)',
    nullable: true,
  })
  upcomingCalibrations: { items: UpcomingCalibrationDto[]; hasMore: boolean } | null;

  @ApiProperty({
    description: '반출 지연 목록 (null = 조회 실패)',
    nullable: true,
  })
  overdueCheckouts: { items: OverdueCheckoutDto[]; hasMore: boolean } | null;

  @ApiProperty({ description: '장비 상태별 통계 (null = 조회 실패)', nullable: true })
  equipmentStatusStats: EquipmentStatusStatsDto | null;

  @ApiProperty({
    description: '최근 활동 내역 (null = 조회 실패)',
    nullable: true,
    type: () => [RecentActivityDto],
  })
  recentActivities: RecentActivityDto[] | null;

  @ApiProperty({
    description: '반납 예정 반출 목록 (null = 조회 실패)',
    nullable: true,
  })
  upcomingCheckoutReturns: { items: UpcomingCheckoutReturnDto[]; hasMore: boolean } | null;
}
