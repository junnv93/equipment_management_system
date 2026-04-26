/**
 * 대시보드 역할별 Config (SSOT)
 *
 * Config-Driven Architecture:
 * - 역할별 탭, StatsCards, 주의 항목을 단일 파일에 정의
 * - DashboardClient는 순수 렌더러 — 역할 분기 로직 없음
 * - 새 역할 추가 시 이 파일만 수정
 */

import type { LucideIcon } from 'lucide-react';
import {
  Package,
  AlertCircle,
  AlertTriangle,
  Clock,
  Truck,
  Ban,
  CheckCircle2,
  Plus,
  ClipboardList,
  FileText,
  Users,
  Settings,
  ShieldCheck,
  List,
  ArrowLeftRight,
} from 'lucide-react';
import type { StatsVariant } from '@/lib/design-tokens';
import type { DashboardSummary } from '@/lib/api/dashboard-api';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { UserRoleValues as URVal } from '@equipment-management/schemas';
import type { ApprovalCategory } from '@equipment-management/shared-constants';

// ─── 임계값 SSOT ────────────────────────────────────────────────

/** 가동률 상태 임계값 (UL-QP-18 기준) + Hysteresis */
export const UTILIZATION_THRESHOLDS = {
  HIGH: 70,
  MEDIUM: 40,
  HYSTERESIS: 2,
} as const;

/** AlertBanner stacked 모드 전환 임계값 */
export const ALERT_BANNER_STACKED_THRESHOLD = 10;

// ─── 승인 카드 레이아웃 타입 ────────────────────────────────────

/** 승인 카테고리 시각적 우선순위 */
export type ApprovalCategoryPriority = 'hero' | 'default' | 'compact';

/**
 * 사이드바 위젯 식별자
 *
 * DashboardClient의 SIDEBAR_WIDGET_RENDERERS와 1:1 매핑됨
 */
export type SidebarWidget = 'teamDistribution' | 'miniCalendar' | 'systemHealth';

/**
 * 승인 대기 카드 레이아웃 힌트
 *
 * - 'single-focus': 1개 카테고리 — 풀폭 히어로 카드
 * - 'prioritized-grid': priority 계층화 그리드 (hero/default/compact)
 * - 'grid': 균등 그리드 (기존 동작)
 */
export type PendingApprovalLayoutHint = 'single-focus' | 'prioritized-grid' | 'grid';

/**
 * Row 3 레이아웃 변형
 *
 * - 'two-col-left-dominant': [교정현황 2fr | 승인대기+반출현황 서브그리드 1.5fr]
 *   → 기본값. loading.tsx 스켈레톤과 동기화.
 * - 'three-col-action-first': [승인대기 1.5fr | 교정현황 1.5fr | 반출현황 1fr]
 *   → 액션 카드 좌측 우선. 기술책임자에서 사용.
 */
export type Row3Layout =
  | 'two-col-left-dominant'
  | 'three-col-action-first'
  | 'single-col-stretch'
  | 'two-col-balanced';

// ─── Stats Card 설정 ───────────────────────────────────────────
export interface StatsCardConfig {
  key: string;
  label: string;
  getValue: (
    summary: DashboardSummary | undefined,
    statusStats: Record<string, number> | undefined
  ) => number;
  /** 비율/부연 설명 텍스트 (예: "총 142대 중 84%") */
  getDescription?: (
    summary: DashboardSummary | undefined,
    statusStats: Record<string, number> | undefined
  ) => string | undefined;
  icon: LucideIcon;
  variant: StatsVariant;
}

// ─── 빠른 실행 액션 정의 ────────────────────────────────────────
export interface QuickActionItem {
  /** i18n key under 'dashboard.quickActions' */
  labelKey: string;
  href: string;
  icon: LucideIcon;
  /** Tailwind class for icon color */
  iconColorClass: string;
  /** 시각적 우선순위 — primary: 채운 배경, secondary: 아웃라인 (기본값) */
  priority?: 'primary' | 'secondary';
}

// ─── 공유 그리드 템플릿 상수 (CLS 근본 해결) ──────────────────
/**
 * 대시보드 그리드 클래스 SSOT
 *
 * loading.tsx와 DashboardClient.tsx가 동일한 상수를 참조하여
 * 스켈레톤↔실제 레이아웃 그리드 불일치(CLS 원인)를 원천 봉쇄
 */
export const DASHBOARD_GRID = {
  /** KPI 카드 행 — 비대칭: Hero(2fr) + Compact 3 + StatusMini */
  kpi: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-4',
  /**
   * Row 3 기본 그리드: [교정현황 2fr | 승인대기+반출현황 서브그리드 1.5fr]
   *
   * lg: → xl: (P0 — 1280px 이하 sub-grid 압축 해결)
   * two-col-left-dominant 레이아웃 및 loading.tsx 스켈레톤 공용 상수.
   */
  row3: 'grid grid-cols-1 xl:grid-cols-[2fr_1.5fr] gap-4 items-start',
  /**
   * Row 3 three-col-action-first 그리드
   *
   * [승인대기 1.4fr | 교정현황 1.4fr | 반출현황 1.2fr]
   * lg: 2-col 중간 단계 → xl: 3-col 전체 펼침
   * quality_manager / technical_manager 전용.
   */
  row3ThreeCol:
    'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[1.4fr_1.4fr_1.2fr] gap-4 items-start',
  /**
   * 하단 행: 최근활동(2fr) | 사이드바(1fr)
   *
   * lg: → xl: (P0 — 브레이크포인트 통일)
   * items-stretch: 사이드바가 최근활동 높이에 맞게 늘어남
   */
  bottomRow: 'grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4 items-stretch',
  /** Row 3 서브그리드: 승인대기 + 반출현황 2단 배치 */
  row3SubGrid: 'grid gap-4 grid-cols-1 md:grid-cols-2',
  /** Row 3 서브그리드 단일 카드 (반출현황 없는 역할) */
  row3SubGridSingle: 'grid gap-4 grid-cols-1',
  /** test_engineer 1-col 풀폭 레이아웃 */
  row3SingleCol: 'grid grid-cols-1 gap-4 items-stretch',
  /** two-col-balanced 레이아웃 */
  row3TwoColBalanced: 'grid grid-cols-1 xl:grid-cols-[2fr_1.5fr] gap-4 items-start',
  /** Row 3 severity row (stacked variant 내부) */
  row3SeverityRow: 'flex items-center gap-3 px-3 py-2',
  /** system_admin bottomRow — [1.5fr_1fr] (§04 Warning Gap-02) */
  bottomRowAdmin: 'grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4 items-stretch',
} as const;

// ─── Control Center 설정 ────────────────────────────────────────
export interface ControlCenterConfig {
  /** 긴급 조치 요약 배너 표시 여부 */
  showAlertBanner: boolean;
  /** 승인 대기 카드 표시 여부 */
  showPendingApprovals: boolean;
  /** 반출 기한 초과 카드 표시 여부 */
  showCheckoutOverdue: boolean;
  /** 교정 D-day 컴팩트 리스트 표시 여부 */
  showCalibrationDday: boolean;
  /**
   * 사이드바 위젯 목록 (순서 = 렌더 순서)
   *
   * 'teamDistribution' | 'miniCalendar' | 'systemHealth'
   * 빈 배열이면 사이드바 섹션 전체 숨김
   */
  sidebarWidgets: readonly SidebarWidget[];
  /** 빠른 실행 버튼 바 표시 여부 */
  showQuickActionBar: boolean;
  /** 역할별 빠른 실행 액션 목록 */
  quickActions: QuickActionItem[];
  /** KPI 총계 레이블 ('my' | 'team' | 'all') */
  kpiDisplay: 'my' | 'team' | 'all';
  /**
   * KPI API 호출과 장비 목록 링크에 팀 필터(teamId)를 적용할지 여부.
   *
   * true  → session.user.teamId를 API와 링크에 자동 포함 (시험실무자, 기술책임자)
   * false → 팀 필터 없음, 사이트 전체 조회 (품질책임자, 시험소장, 시스템관리자)
   *
   * 이 플래그가 결정 주체 — resolveDashboardScope()는 이것을 그대로 따름.
   */
  requiresTeamScope: boolean;
  /**
   * 승인 대기 카드 레이아웃 힌트
   *
   * 역할별 카테고리 수와 중요도에 맞는 레이아웃을 선택적으로 적용
   */
  pendingApprovalLayoutHint: PendingApprovalLayoutHint;
  /**
   * 카테고리별 시각적 우선순위
   *
   * 지정되지 않은 카테고리는 'default'로 처리됨
   */
  approvalCategoryPriorities: Partial<Record<ApprovalCategory, ApprovalCategoryPriority>>;
  /**
   * Row 3 레이아웃 변형
   *
   * - 'two-col-left-dominant': [교정현황 2fr | 서브그리드(승인+반출) 1.5fr] (기본값)
   * - 'three-col-action-first': [승인대기 1.5fr | 교정현황 1.5fr | 반출현황 1fr]
   *
   * 미지정 시 'two-col-left-dominant'로 동작 — 하위 호환.
   */
  row3Layout?: Row3Layout;
  /**
   * 승인 대기 카드 시각적 부상 (raised elevation)
   *
   * true → ring-1 ring-primary/15 shadow-sm 적용 — 액션 카드를 주변 감시 카드와 구별.
   * 미지정/false → 기본 elevation.
   */
  pendingApprovalElevated?: boolean;
  /** 내 활동 카드 표시 여부 (test_engineer Row3) */
  showMyActivity?: boolean;
  /** AlertBanner trailing action 슬롯 타입 */
  alertBannerTrailingAction?: 'approval' | 'createCheckout' | null;
}

// ─── 역할별 대시보드 설정 ───────────────────────────────────────
export interface DashboardRoleConfig {
  tabs: Array<{ value: string; label: string }>;
  statsCards: StatsCardConfig[];
  /** AlertPanel에서 표시할 항목 */
  alertSections: Array<'overdueCalibrations' | 'overdueCheckouts'>;
  /** Control Center 3-Tier 레이아웃 설정 */
  controlCenter: ControlCenterConfig;
  /** 하단 행 그리드 템플릿 변형 (미지정 시 'default') */
  bottomRowTemplate?: 'default' | 'admin';
}

// ─── 재사용 가능한 Stats Card 팩토리 ────────────────────────────
const STATS = {
  totalEquipment: (labelKey: string): StatsCardConfig => ({
    key: 'total',
    label: labelKey, // i18n key under 'dashboard.stats'
    getValue: (s) => s?.totalEquipment || 0,
    icon: Package,
    variant: 'default',
  }),
  available: (): StatsCardConfig => ({
    key: 'available',
    label: 'available', // i18n key
    getValue: (s) => s?.availableEquipment || 0,
    getDescription: (s) => {
      const total = s?.totalEquipment || 0;
      const available = s?.availableEquipment || 0;
      if (total === 0) return undefined;
      return `percentOfTotal:${Math.round((available / total) * 100)}:${total}`;
    },
    icon: CheckCircle2,
    variant: 'success',
  }),
  calibrationOverdue: (): StatsCardConfig => ({
    key: 'calibrationOverdue',
    label: 'calibrationOverdue', // i18n key
    getValue: (_, stats) => stats?.calibration_overdue || 0,
    getDescription: (s) => {
      const total = s?.totalEquipment || 0;
      if (total === 0) return undefined;
      return 'immediateAction';
    },
    icon: AlertTriangle,
    variant: 'danger',
  }),
  nonConforming: (): StatsCardConfig => ({
    key: 'nonConforming',
    label: 'nonConforming', // i18n key
    getValue: (_, stats) => stats?.non_conforming || 0,
    getDescription: (s) => {
      const total = s?.totalEquipment || 0;
      if (total === 0) return undefined;
      return 'unusable';
    },
    icon: AlertCircle,
    variant: 'danger',
  }),
  upcomingCalibrations: (): StatsCardConfig => ({
    key: 'upcomingCalibrations',
    label: 'calibrationScheduled', // i18n key
    getValue: (s) => s?.upcomingCalibrations || 0,
    getDescription: () => 'within30Days',
    icon: Clock,
    variant: 'warning',
  }),
  activeCheckouts: (): StatsCardConfig => ({
    key: 'activeCheckouts',
    label: 'activeCheckouts', // i18n key
    getValue: (s) => s?.activeCheckouts || 0,
    getDescription: (s) => {
      const total = s?.totalEquipment || 0;
      const active = s?.activeCheckouts || 0;
      if (total === 0) return undefined;
      return `percentOfTotal:${Math.round((active / total) * 100)}:${total}`;
    },
    icon: Truck,
    variant: 'primary',
  }),
  pendingDisposal: (): StatsCardConfig => ({
    key: 'pendingDisposal',
    label: 'pendingDisposal', // i18n key
    getValue: (_, stats) => stats?.pending_disposal || 0,
    getDescription: () => 'awaitingApproval',
    icon: Ban,
    variant: 'warning',
  }),
} as const;

// ─── 역할별 빠른 실행 액션 사전 정의 ──────────────────────────
const QUICK_ACTIONS = {
  registerEquipment: {
    labelKey: 'registerEquipment',
    href: FRONTEND_ROUTES.EQUIPMENT.CREATE,
    icon: Plus,
    iconColorClass: 'text-ul-blue dark:text-ul-info',
  },
  registerCalibration: {
    labelKey: 'registerCalibration',
    href: FRONTEND_ROUTES.CALIBRATION.REGISTER,
    icon: ClipboardList,
    iconColorClass: 'text-ul-green',
  },
  createCheckout: {
    labelKey: 'createCheckout',
    href: FRONTEND_ROUTES.CHECKOUTS.CREATE,
    icon: Truck,
    iconColorClass: 'text-ul-orange',
  },
  equipmentList: {
    labelKey: 'equipmentList',
    href: FRONTEND_ROUTES.EQUIPMENT.LIST,
    icon: List,
    iconColorClass: 'text-muted-foreground',
  },
  approvalManagement: {
    labelKey: 'approvalManagement',
    href: FRONTEND_ROUTES.ADMIN.APPROVALS,
    icon: ShieldCheck,
    iconColorClass: 'text-ul-midnight dark:text-ul-info',
  },
  calibrationPlans: {
    labelKey: 'calibrationPlans',
    href: FRONTEND_ROUTES.CALIBRATION_PLANS.LIST,
    icon: FileText,
    iconColorClass: 'text-ul-blue dark:text-ul-info',
  },
  checkoutStatus: {
    labelKey: 'checkoutStatus',
    href: FRONTEND_ROUTES.CHECKOUTS.LIST,
    icon: ArrowLeftRight,
    iconColorClass: 'text-ul-orange',
  },
  userManagement: {
    labelKey: 'userManagement',
    href: FRONTEND_ROUTES.ADMIN.USERS,
    icon: Users,
    iconColorClass: 'text-ul-fog dark:text-muted-foreground',
  },
  systemSettings: {
    labelKey: 'systemSettings',
    href: FRONTEND_ROUTES.ADMIN.SETTINGS,
    icon: Settings,
    iconColorClass: 'text-muted-foreground',
  },
} as const satisfies Record<string, QuickActionItem>;

// ─── 역할별 설정 (SSOT) ────────────────────────────────────────
export const DASHBOARD_ROLE_CONFIG: Record<string, DashboardRoleConfig> = {
  [URVal.TEST_ENGINEER]: {
    tabs: [
      { value: 'calibration', label: 'calibration' },
      { value: 'equipment', label: 'equipment' },
      { value: 'activity', label: 'activity' },
    ],
    statsCards: [
      STATS.totalEquipment('myEquipment'),
      STATS.available(),
      STATS.upcomingCalibrations(),
      STATS.activeCheckouts(),
    ],
    alertSections: ['overdueCalibrations', 'overdueCheckouts'],
    controlCenter: {
      showAlertBanner: true,
      showPendingApprovals: false,
      showCheckoutOverdue: true,
      showCalibrationDday: true,
      sidebarWidgets: ['miniCalendar'],
      showQuickActionBar: true,
      quickActions: [
        { ...QUICK_ACTIONS.registerEquipment, priority: 'primary' as const },
        { ...QUICK_ACTIONS.createCheckout, priority: 'primary' as const },
        QUICK_ACTIONS.registerCalibration,
        QUICK_ACTIONS.equipmentList,
      ],
      kpiDisplay: 'my',
      requiresTeamScope: true,
      pendingApprovalLayoutHint: 'grid',
      approvalCategoryPriorities: {},
      row3Layout: 'single-col-stretch',
      showMyActivity: true,
    },
  },

  [URVal.TECHNICAL_MANAGER]: {
    tabs: [
      { value: 'calibration', label: 'calibration' },
      { value: 'equipment', label: 'equipment' },
      { value: 'activity', label: 'activity' },
    ],
    statsCards: [
      STATS.totalEquipment('teamEquipment'),
      STATS.calibrationOverdue(),
      STATS.nonConforming(),
      STATS.activeCheckouts(),
    ],
    alertSections: ['overdueCalibrations', 'overdueCheckouts'],
    controlCenter: {
      showAlertBanner: true,
      showPendingApprovals: true,
      showCheckoutOverdue: true,
      showCalibrationDday: true,
      sidebarWidgets: ['teamDistribution', 'miniCalendar'],
      showQuickActionBar: true,
      quickActions: [
        { ...QUICK_ACTIONS.approvalManagement, priority: 'primary' as const },
        { ...QUICK_ACTIONS.equipmentList, priority: 'primary' as const },
        QUICK_ACTIONS.checkoutStatus,
        QUICK_ACTIONS.registerCalibration,
      ],
      kpiDisplay: 'team',
      requiresTeamScope: true,
      pendingApprovalLayoutHint: 'grid',
      approvalCategoryPriorities: {},
      row3Layout: 'three-col-action-first',
      pendingApprovalElevated: true,
      alertBannerTrailingAction: 'approval',
    },
  },

  [URVal.QUALITY_MANAGER]: {
    tabs: [
      { value: 'calibration', label: 'calibration' },
      { value: 'equipment', label: 'equipment' },
      { value: 'activity', label: 'activity' },
    ],
    statsCards: [
      STATS.totalEquipment('allEquipment'),
      STATS.nonConforming(),
      STATS.upcomingCalibrations(),
      STATS.calibrationOverdue(),
    ],
    alertSections: ['overdueCalibrations'],
    controlCenter: {
      showAlertBanner: true,
      showPendingApprovals: true,
      showCheckoutOverdue: false,
      showCalibrationDday: true,
      sidebarWidgets: ['miniCalendar'],
      showQuickActionBar: true,
      quickActions: [
        { ...QUICK_ACTIONS.calibrationPlans, priority: 'primary' as const },
        { ...QUICK_ACTIONS.approvalManagement, priority: 'primary' as const },
        QUICK_ACTIONS.equipmentList,
        QUICK_ACTIONS.checkoutStatus,
      ],
      kpiDisplay: 'all',
      requiresTeamScope: false,
      pendingApprovalLayoutHint: 'single-focus',
      approvalCategoryPriorities: {
        plan_review: 'hero',
      },
      row3Layout: 'three-col-action-first',
    },
  },

  [URVal.LAB_MANAGER]: {
    tabs: [
      { value: 'calibration', label: 'calibration' },
      { value: 'equipment', label: 'equipment' },
      { value: 'checkout', label: 'checkout' },
      { value: 'activity', label: 'activity' },
    ],
    statsCards: [
      STATS.totalEquipment('allEquipment'),
      STATS.calibrationOverdue(),
      STATS.nonConforming(),
      STATS.pendingDisposal(),
    ],
    alertSections: ['overdueCalibrations', 'overdueCheckouts'],
    controlCenter: {
      showAlertBanner: true,
      showPendingApprovals: true,
      showCheckoutOverdue: true,
      showCalibrationDday: true,
      sidebarWidgets: ['teamDistribution', 'miniCalendar'],
      showQuickActionBar: true,
      quickActions: [
        { ...QUICK_ACTIONS.calibrationPlans, priority: 'primary' as const },
        { ...QUICK_ACTIONS.approvalManagement, priority: 'primary' as const },
        QUICK_ACTIONS.userManagement,
        QUICK_ACTIONS.equipmentList,
      ],
      kpiDisplay: 'all',
      requiresTeamScope: false,
      pendingApprovalLayoutHint: 'prioritized-grid',
      approvalCategoryPriorities: {
        plan_final: 'hero',
        disposal_final: 'default',
        incoming: 'default',
      },
      alertBannerTrailingAction: 'approval',
    },
  },

  [URVal.SYSTEM_ADMIN]: {
    tabs: [
      { value: 'calibration', label: 'calibration' },
      { value: 'equipment', label: 'equipment' },
      { value: 'checkout', label: 'checkout' },
      { value: 'activity', label: 'activity' },
    ],
    statsCards: [
      STATS.totalEquipment('allEquipment'),
      STATS.nonConforming(),
      STATS.calibrationOverdue(),
      STATS.activeCheckouts(),
    ],
    alertSections: ['overdueCalibrations', 'overdueCheckouts'],
    controlCenter: {
      showAlertBanner: true,
      showPendingApprovals: false,
      showCheckoutOverdue: true,
      showCalibrationDday: true,
      sidebarWidgets: ['systemHealth', 'teamDistribution', 'miniCalendar'],
      showQuickActionBar: true,
      quickActions: [
        { ...QUICK_ACTIONS.userManagement, priority: 'primary' as const },
        { ...QUICK_ACTIONS.systemSettings, priority: 'primary' as const },
        QUICK_ACTIONS.calibrationPlans,
        QUICK_ACTIONS.equipmentList,
      ],
      kpiDisplay: 'all',
      requiresTeamScope: false,
      pendingApprovalLayoutHint: 'grid',
      approvalCategoryPriorities: {},
    },
    bottomRowTemplate: 'admin',
  },
};

// ─── 기본값 + Fallback ─────────────────────────────────────────
export const DEFAULT_ROLE = URVal.TEST_ENGINEER;
export const DEFAULT_TAB = 'calibration';

/** 레거시 URL 호환 매핑 — 기존 북마크/공유 링크 자동 리다이렉트 */
export const LEGACY_TAB_MAP: Record<string, string> = {
  attention: 'calibration',
  overview: 'calibration',
  rental: 'checkout',
  approvals: 'calibration',
};

/**
 * 대시보드 컴포넌트별 최대 표시 건수 (SSOT)
 *
 * 컴포넌트에서 .slice(0, N) 사용 시 이 상수를 참조
 */
export const DISPLAY_LIMITS = {
  /** OverdueCheckoutsCard 최대 표시 건수 */
  overdueCheckouts: 6,
  /** OverdueCheckoutsCard 반납 예정 탭 최대 표시 건수 */
  upcomingCheckoutReturns: 6,
  /** CalibrationDdayList 최대 표시 건수 */
  calibrationDday: 8,
  /** MiniCalendar 팝업 최대 이벤트 수 */
  calendarEvents: 5,
} as const;
