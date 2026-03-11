/**
 * Design Token System - Public API
 *
 * 3-Layer Architecture:
 * 1. Primitives - 원시값 (px, colors, ms)
 * 2. Semantic - 의미론적 토큰 (용도 기반)
 * 3. Components - 컴포넌트별 조합
 *
 * SSOT: 모든 디자인 값은 이 시스템을 통해서만 정의/사용
 *
 * @example
 * ```tsx
 * import { HEADER_SIZES, getHeaderButtonClasses } from '@/lib/design-tokens';
 *
 * <Button className={getHeaderButtonClasses()}>
 *   <Bell className={HEADER_SIZES.icon} />
 * </Button>
 * ```
 */

// ============================================================================
// Layer 1: Primitives (직접 사용 금지 - semantic/component layer에서만 참조)
// ============================================================================

export {
  SIZE_PRIMITIVES,
  SPACING_PRIMITIVES,
  MOTION_PRIMITIVES,
  ELEVATION_PRIMITIVES,
  RADIUS_PRIMITIVES,
  TYPOGRAPHY_PRIMITIVES,
  toTailwindSize,
  toTailwindGap,
  toTailwindDuration,
  type ResponsiveValue,
} from './primitives';

// ============================================================================
// Brand Tokens (글로벌 디자인 언어)
// ============================================================================

export {
  BRAND_COLORS_HEX,
  FONT,
  BRAND_LAYOUT,
  getBrandCardClasses,
  getBrandSectionHeaderClasses,
  getManagementNumberClasses,
  getTimestampClasses,
  getKpiCounterClasses,
  getSemanticBadgeClasses,
  getSemanticContainerColorClasses,
  getSemanticContainerClasses,
  getSemanticContainerTextClasses,
  getBrandElevatedClasses,
  getBrandMutedTextClasses,
  type SemanticColorKey,
} from './brand';

// ============================================================================
// Layer 2: Semantic (컴포넌트에서 사용 권장)
// ============================================================================

export {
  INTERACTIVE_TOKENS,
  CONTENT_TOKENS,
  MOTION_TOKENS,
  ELEVATION_TOKENS,
  LAYOUT_TOKENS,
  FOCUS_TOKENS,
  type InteractiveSize,
  type MotionSpeed,
  type ElevationLayer,
} from './semantic';

// ============================================================================
// Motion System
// ============================================================================

export {
  getTransitionClasses,
  getStaggerDelay,
  getAnimationDuration,
  getAnimationEasing,
  ANIMATION_PRESETS,
} from './motion';

// ============================================================================
// Visual Feedback System (Architecture v3)
// ============================================================================

export {
  URGENCY_FEEDBACK_MAP,
  VISUAL_FEEDBACK_TOKENS,
  getUrgencyFeedbackClasses,
  getCountBasedUrgency,
  getTimeBasedUrgency,
  getStatusBasedUrgency,
  getElapsedDaysUrgency,
  type UrgencyLevel,
  type FeedbackMode,
} from './visual-feedback';

// ============================================================================
// Layer 3: Components (권장 - 즉시 사용 가능한 조합)
// ============================================================================

// Header
export {
  HEADER_SIZES,
  HEADER_SPACING,
  HEADER_INTERACTIVE_STYLES,
  getHeaderButtonClasses,
  getHeaderSizeClasses,
  getHeaderSpacingClass,
  NOTIFICATION_BADGE_POSITION,
  getNotificationBadgePositionClass,
} from './components/header';

// Notification
export {
  NOTIFICATION_BADGE_VARIANTS,
  getNotificationBadgeVariant,
  getNotificationBadgeClasses,
  NOTIFICATION_DROPDOWN_ANIMATION,
  getNotificationItemAnimation,
  NOTIFICATION_DROPDOWN_ELEVATION,
  NOTIFICATION_DROPDOWN_SHADOW,
  UNREAD_NOTIFICATION_STYLES,
  READ_NOTIFICATION_STYLES,
  getNotificationItemStyles,
  NOTIFICATION_EMPTY_STATE,
  NOTIFICATION_LIST_HEADER_TOKENS,
  NOTIFICATION_LIST_FILTER_TOKENS,
  NOTIFICATION_LIST_ITEM_TOKENS,
  NOTIFICATION_LIST_SKELETON_TOKENS,
  NOTIFICATION_LIST_EMPTY_TOKENS,
  NOTIFICATION_LIST_PAGINATION_TOKENS,
} from './components/notification';

// Auth
export {
  AUTH_INPUT_TOKENS,
  AUTH_MOTION_TOKENS,
  AUTH_CONTENT,
  AUTH_BACKGROUND_TOKENS,
  AUTH_LAYOUT_TOKENS,
  AUTH_SPLIT_TOKENS,
  getAuthInputClasses,
  getAuthButtonClasses,
  getAuthErrorClasses,
  getAuthInteractiveScaleClasses,
  getAuthStaggerDelay,
  IDLE_TIMEOUT_DIALOG_TOKENS,
  getIdleTimeoutUrgencyClasses,
} from './components/auth';

// Dashboard
export {
  DASHBOARD_STATS_VARIANTS,
  getStatsCardClasses,
  getStatsIconClasses,
  DASHBOARD_ROLE_BADGES,
  getRoleBadgeClasses,
  DASHBOARD_STATUS_COLORS,
  getStatusChartColor,
  DASHBOARD_CALIBRATION_STATUS_COLORS,
  getCalibrationStatusClasses,
  DASHBOARD_MOTION,
  getDashboardStaggerDelay,
  DASHBOARD_SIZES,
  DASHBOARD_FOCUS,
  DASHBOARD_DDAY_TOKENS,
  DASHBOARD_KPI_TOKENS,
  DASHBOARD_DDAY_COMPACT_TOKENS,
  DASHBOARD_CALENDAR_TOKENS,
  DASHBOARD_OVERDUE_CHECKOUTS_TOKENS,
  DASHBOARD_TEAM_DISTRIBUTION_TOKENS,
  DASHBOARD_QUICK_ACTION_TOKENS,
  DASHBOARD_ALERT_BANNER_TOKENS,
  DASHBOARD_STATUS_MINI_TOKENS,
  DASHBOARD_KPI_TREND_TOKENS,
  DASHBOARD_WELCOME_TOKENS,
  DASHBOARD_RECENT_ACTIVITIES_TOKENS,
  DASHBOARD_EMPTY_STATE_TOKENS,
  type StatsVariant,
  type DashboardRole,
  type CalibrationStatus,
} from './components/dashboard';

// Equipment
export {
  EQUIPMENT_STATUS_TOKENS,
  DEFAULT_STATUS_CONFIG,
  EQUIPMENT_STATUS_DISPLAY_ORDER,
  EQUIPMENT_CRITICAL_STATUSES,
  EQUIPMENT_CARD_PERFORMANCE_CLASSES,
  EQUIPMENT_CARD_GRID_TOKENS,
  CALIBRATION_BADGE_TOKENS,
  EQUIPMENT_CARD_TOKENS,
  getEquipmentCardClasses,
  EQUIPMENT_HEADER_TOKENS,
  getEquipmentHeaderButtonClasses,
  EQUIPMENT_TAB_TOKENS,
  EQUIPMENT_DETAIL_HEADER_TOKENS,
  EQUIPMENT_KPI_STRIP_TOKENS,
  EQUIPMENT_TAB_UNDERLINE_TOKENS,
  EQUIPMENT_FILTER_TOKENS,
  EQUIPMENT_EMPTY_STATE_TOKENS,
  EQUIPMENT_TABLE_TOKENS,
  EQUIPMENT_LIST_HEADER_TOKENS,
  EQUIPMENT_STATS_STRIP_TOKENS,
  EQUIPMENT_TOOLBAR_TOKENS,
  getEquipmentStatusTokenStyle,
  type EquipmentStatusConfig,
  type CalibrationSeverity,
  type CalibrationBadgeStyle,
  type HeaderButtonVariant,
  type KpiColorVariant,
} from './components/equipment';

// Equipment Timeline
export {
  TIMELINE_TOKENS,
  getTimelineNodeClasses,
  getTimelineCardClasses,
  TIMELINE_SKELETON_TOKENS,
  getIncidentTypeNodeColor,
  getIncidentTypeBadgeClasses,
} from './components/equipment-timeline';

// Non-Conformance
export { ncStatusToSemantic } from './components/non-conformance';

// Calibration
export {
  CALIBRATION_STATUS_INDICATOR,
  getCalibrationStatusIndicatorClasses,
  CALIBRATION_CHECK_BADGE,
  getIntermediateCheckBadgeClasses,
  getIntermediateCheckIcon,
  CALIBRATION_STATS_MAPPING,
  getCalibrationStatsVariant,
  CALIBRATION_STATS_TEXT,
  CALIBRATION_TAB_COLORS,
  getCalibrationTabClasses,
  CALIBRATION_MOTION,
  CALIBRATION_TABLE,
  CALIBRATION_EMPTY_STATE,
  CALIBRATION_SELECTION,
  getEquipmentSelectionClasses,
  CALIBRATION_DIALOG,
  CALIBRATION_FOCUS,
  CALIBRATION_INTERMEDIATE_CHECK_ICON_COLORS,
  getIntermediateCheckIconColor,
  CALIBRATION_CARD_BORDER,
  // Section 13-16 (리디자인)
  CALIBRATION_TIMELINE,
  CALIBRATION_TIMELINE_DOT_Y_OFFSET_PX,
  getCalibrationTimelineDotClasses,
  getCalibrationTimelineTooltipTextClasses,
  CALIBRATION_DDAY_COLUMN,
  getCalibrationDdayClasses,
  getCalibrationDdayLabel,
  CALIBRATION_APPROVAL_ROW,
  getCalibrationRowClasses,
  CALIBRATION_TAB_TRANSITION,
  CALIBRATION_RESULT_BADGE,
  DEFAULT_CALIBRATION_RESULT_BADGE,
  CALIBRATION_APPROVAL_BADGE,
  DEFAULT_CALIBRATION_APPROVAL_BADGE,
  CALIBRATION_INLINE_ACTION_BUTTONS,
  getCalibrationActionButtonClasses,
  CALIBRATION_ALERT_TOKENS,
  CALIBRATION_THRESHOLDS,
  CALIBRATION_VERSION_HISTORY,
  CALIBRATION_FILTER_BAR,
  type CalibrationStatusType,
  type IntermediateCheckStatus,
  type CalibrationStatsType,
  type CalibrationTabType,
} from './components/calibration';

// Disposal
export {
  DISPOSAL_STEPPER_TOKENS,
  DISPOSAL_TIMELINE_TOKENS,
  DISPOSAL_PROGRESS_CARD_TOKENS,
  DISPOSAL_BANNER_TOKENS,
  DISPOSAL_BUTTON_TOKENS,
  DISPOSAL_INFO_CARD_TOKENS,
  REVIEW_OPINION_CARD_TOKENS,
  FORM_SECTION_TOKENS,
  DISPOSAL_FILE_LINK_TOKENS,
  getStepperNodeClasses,
  getStepperLabelClasses,
  getTimelineNodeStatusClasses,
} from './components/disposal';

// Checkout
export {
  CHECKOUT_STATUS_BADGE_TOKENS,
  RENTAL_IMPORT_STATUS_BADGE_TOKENS,
  DEFAULT_CHECKOUT_BADGE,
  CHECKOUT_PURPOSE_TOKENS,
  CHECKOUT_ROW_TOKENS,
  getCheckoutRowClasses,
  CHECKOUT_MINI_PROGRESS,
  MINI_PROGRESS_STEPS,
  MINI_PROGRESS_SPECIAL_STATUSES,
  CHECKOUT_STEPPER_TOKENS,
  CHECKOUT_STATS_VARIANTS,
  CHECKOUT_STATS_CHECKED_OUT,
  CHECKOUT_STATS_RETURNED,
  getCheckoutStatsClasses,
  CHECKOUT_MOTION,
  CHECKOUT_INTERACTION_TOKENS,
  CHECKOUT_DETAIL_TOKENS,
  CONDITION_COMPARISON_TOKENS,
  CHECKOUT_FORM_TOKENS,
  // v2 redesign tokens
  CHECKOUT_FILTER_BAR_TOKENS,
  CHECKOUT_DDAY_TOKENS,
  getDdayClasses,
  formatDday,
  CHECKOUT_ALERT_TOKENS,
  CHECKOUT_OVERDUE_GROUP_TOKENS,
  CHECKOUT_PURPOSE_LEGEND_TOKENS,
  CHECKOUT_ITEM_ROW_TOKENS,
  RENTAL_FLOW_INLINE_TOKENS,
  CHECKOUT_PAGINATION_TOKENS,
  CHECKOUT_TAB_BADGE_TOKENS,
  type CheckoutStatsVariant,
  type CheckoutPurposeKey,
  type DdayVariant,
} from './components/checkout';

// Calibration Plans
export {
  CALIBRATION_PLAN_STATUS_TOKENS,
  CALIBRATION_PLAN_TIMELINE_TOKENS,
  FILTER_TOKENS,
  TABLE_TOKENS,
  CARD_TOKENS,
  ACTION_BUTTON_TOKENS,
  DIALOG_TOKENS,
  CALIBRATION_PLAN_MOTION,
  COLLAPSIBLE_TOKENS,
  CONFIRMATION_BADGE_TOKENS,
  ALERT_TOKENS,
  SKELETON_TOKENS,
  NUMERIC_TOKENS,
  getCalibrationPlanStatusBadgeClasses,
  getCalibrationPlanTimelineNodeClasses,
  getCalibrationPlanTimelineConnectorClasses,
  getFilterSelectClasses,
  getTableRowClasses,
  getActionButtonClasses,
  getConfirmationBadgeClasses,
  getLoadingSpinnerClasses,
  getNumericClasses,
  type CalibrationPlanStatusType,
} from './components/calibration-plans';

// Approval
export {
  APPROVAL_STATUS_BADGE_TOKENS,
  APPROVAL_CARD_BORDER_TOKENS,
  APPROVAL_STEPPER_TOKENS,
  APPROVAL_TIMELINE_TOKENS,
  APPROVAL_ACTION_BUTTON_TOKENS,
  APPROVAL_TAB_TOKENS,
  APPROVAL_BULK_BAR_TOKENS,
  APPROVAL_INFO_GRID_TOKENS,
  APPROVAL_EMPTY_STATE_TOKENS,
  APPROVAL_MOTION,
  APPROVAL_FOCUS,
  APPROVAL_ELAPSED_DAYS_TOKENS,
  APPROVAL_ROW_TOKENS,
  APPROVAL_ROW_GRID_COLS,
  APPROVAL_KPI_STRIP_TOKENS,
  APPROVAL_CATEGORY_SIDEBAR_TOKENS,
  APPROVAL_MOBILE_CATEGORY_BAR_TOKENS,
  getApprovalStatusBadgeClasses,
  getApprovalCardBorderClasses,
  getApprovalStepperNodeClasses,
  getApprovalActionButtonClasses,
  getElapsedDaysClasses,
  type ApprovalKpiVariant,
} from './components/approval';

// Audit
export {
  AUDIT_ACTION_BADGE_TOKENS,
  DEFAULT_AUDIT_ACTION_BADGE,
  AUDIT_TABLE_TOKENS,
  AUDIT_TABLE_HEADER_ROW,
  AUDIT_DIFF_TOKENS,
  AUDIT_ENTITY_LINK_TOKENS,
  AUDIT_DETAIL_TOKENS,
  AUDIT_EMPTY_STATE_TOKENS,
  AUDIT_PAGINATION_TOKENS,
  AUDIT_MOTION,
  AUDIT_FILTER_TOKENS,
  AUDIT_HEADER_TOKENS,
  getAuditActionChipClasses,
  AUDIT_SUMMARY_TOKENS,
  AUDIT_SUMMARY_COLOR_MAP,
  getAuditSummaryCardClasses,
  AUDIT_TIMELINE_TOKENS,
  AUDIT_TIMELINE_DOT_COLORS,
  AUDIT_DETAIL_SHEET_TOKENS,
} from './components/audit';

// Form Wizard
export {
  FORM_WIZARD_STEPPER_TOKENS,
  FORM_WIZARD_PREVIEW_BAR_TOKENS,
  FORM_WIZARD_STEP_TRANSITION,
  FORM_WIZARD_COMPLETION_ANIMATION,
  FORM_WIZARD_NAVIGATION_TOKENS,
  getWizardStepperNodeClasses,
  getWizardStepperLabelClasses,
  getWizardConnectorClasses,
} from './components/form-wizard';

// Sidebar
export {
  SIDEBAR_LAYOUT,
  SIDEBAR_COLORS,
  SIDEBAR_ITEM_TOKENS,
  SIDEBAR_SECTION_TOKENS,
  getSidebarItemClasses,
  getSidebarWidthClasses,
  getSidebarMarginClasses,
} from './components/sidebar';

// Mobile Nav
export {
  MOBILE_NAV_TOKENS,
  MOBILE_NAV_SECTION_TOKENS,
  getMobileNavItemClasses,
} from './components/mobile-nav';

// Team
export {
  ROLE_BADGE_TOKENS,
  TEAM_CARD_TOKENS,
  TEAM_FILTER_PANEL_TOKENS,
  TEAM_SECTION_TOKENS,
  TEAM_MEMBER_GROUP_TOKENS,
  SITE_PANEL_TOKENS,
  TEAM_ROW_TOKENS,
  CLS_PILL_TOKENS,
} from './components/team';

// Settings
export {
  SETTINGS_CARD_CONTAINER_TOKENS,
  SETTINGS_CARD_HEADER_TOKENS,
  SETTINGS_CHIP_TOKENS,
  SETTINGS_FORM_ITEM_TOKENS,
  SETTINGS_SELECT_TRIGGER_TOKENS,
  SETTINGS_SUBMIT_TOKENS,
  SETTINGS_SAVE_INDICATOR_TOKENS,
  SETTINGS_INFO_BOX_TOKENS,
  SETTINGS_SPACING_TOKENS,
  SETTINGS_TEXT_TOKENS,
  SETTINGS_PAGE_HEADER_TOKENS,
  SETTINGS_PROFILE_HERO_TOKENS,
  SETTINGS_PROFILE_GRID_TOKENS,
  SETTINGS_TEXTAREA_TOKENS,
  SETTINGS_PERMISSIONS_CARD_TOKENS,
  SETTINGS_NAV_TOKENS,
  SETTINGS_PROFILE_BADGE_TOKENS,
  SETTINGS_LAYOUT_TOKENS,
  getSettingsCardClasses,
  getSettingsCardHeaderClasses,
  getSettingsChipClasses,
  getSettingsChipIconClasses,
  getSettingsFormItemClasses,
  getSettingsSelectTriggerClasses,
  getSettingsSubmitButtonClasses,
  getSettingsInfoBoxClasses,
  getSettingsPageHeaderClasses,
  getSettingsTextareaClasses,
  getSettingsNavItemClasses,
  getSettingsNavIconCircleClasses,
  getSettingsNavChevronClasses,
  type SettingsChipState,
} from './components/settings';

// Reports
export {
  REPORTS_HEADER_TOKENS,
  REPORTS_SUCCESS_BANNER_TOKENS,
  REPORTS_SUMMARY_TOKENS,
  REPORTS_CONTENT_LIST_TOKENS,
  REPORTS_EMPTY_STATE_TOKENS,
  REPORTS_LAYOUT_TOKENS,
  REPORTS_SPINNER_TOKENS,
  REPORTS_ICON_TOKENS,
} from './components/reports';

// Software
export {
  SOFTWARE_HEADER_TOKENS,
  SOFTWARE_STATS_TOKENS,
  SOFTWARE_SUMMARY_TOKENS,
  SOFTWARE_SEARCH_TOKENS,
  SOFTWARE_TABLE_TOKENS,
  SOFTWARE_EMPTY_STATE_TOKENS,
  SOFTWARE_APPROVAL_BADGE_TOKENS,
} from './components/software';

// ============================================================================
// Usage Guidelines
// ============================================================================

/**
 * 사용 가이드라인:
 *
 * 1. **컴포넌트 개발 시**: Layer 3 (Components) 사용
 *    → getHeaderButtonClasses(), NOTIFICATION_BADGE_VARIANTS 등
 *
 * 2. **새로운 컴포넌트 토큰 생성 시**: Layer 2 (Semantic) 참조
 *    → INTERACTIVE_TOKENS, MOTION_TOKENS 조합
 *
 * 3. **전역 디자인 변경 시**: Layer 1 (Primitives) 수정
 *    → SIZE_PRIMITIVES.touch.minimal 변경 → 전체 시스템 자동 업데이트
 *
 * 4. **하드코딩 금지**:
 *    ❌ className="h-11 w-11 rounded-full"
 *    ✅ className={getHeaderButtonClasses()}
 *
 * 5. **Semantic naming 우선**:
 *    ❌ "44px 버튼"
 *    ✅ "standard interactive 버튼"
 */
