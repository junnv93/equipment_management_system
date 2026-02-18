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
} from './components/notification';

// Auth
export {
  AUTH_INPUT_TOKENS,
  AUTH_MOTION_TOKENS,
  AUTH_CONTENT,
  AUTH_BACKGROUND_TOKENS,
  AUTH_LAYOUT_TOKENS,
  getAuthInputClasses,
  getAuthButtonClasses,
  getAuthErrorClasses,
  getAuthInteractiveScaleClasses,
  getAuthStaggerDelay,
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
  type StatsVariant,
  type DashboardRole,
  type CalibrationStatus,
} from './components/dashboard';

// Equipment
export {
  EQUIPMENT_STATUS_TOKENS,
  DEFAULT_STATUS_CONFIG,
  CALIBRATION_BADGE_TOKENS,
  EQUIPMENT_CARD_TOKENS,
  getEquipmentCardClasses,
  EQUIPMENT_HEADER_TOKENS,
  getEquipmentHeaderButtonClasses,
  EQUIPMENT_TAB_TOKENS,
  EQUIPMENT_FILTER_TOKENS,
  EQUIPMENT_EMPTY_STATE_TOKENS,
  EQUIPMENT_TABLE_TOKENS,
  type EquipmentStatusConfig,
  type CalibrationSeverity,
  type CalibrationBadgeStyle,
  type HeaderButtonVariant,
} from './components/equipment';

// Equipment Timeline
export {
  TIMELINE_TOKENS,
  getTimelineNodeClasses,
  getTimelineCardClasses,
  TIMELINE_SKELETON_TOKENS,
} from './components/equipment-timeline';

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
  CHECKOUT_STEPPER_TOKENS,
  CHECKOUT_STATS_VARIANTS,
  getCheckoutStatsClasses,
  CHECKOUT_MOTION,
  CHECKOUT_INTERACTION_TOKENS,
  CHECKOUT_DETAIL_TOKENS,
  CONDITION_COMPARISON_TOKENS,
  CHECKOUT_FORM_TOKENS,
  type CheckoutStatsVariant,
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
  getApprovalStatusBadgeClasses,
  getApprovalCardBorderClasses,
  getApprovalStepperNodeClasses,
  getApprovalActionButtonClasses,
} from './components/approval';

// Audit
export {
  AUDIT_ACTION_BADGE_TOKENS,
  DEFAULT_AUDIT_ACTION_BADGE,
  AUDIT_TABLE_TOKENS,
  AUDIT_DIFF_TOKENS,
  AUDIT_ENTITY_LINK_TOKENS,
  AUDIT_DETAIL_TOKENS,
  AUDIT_EMPTY_STATE_TOKENS,
  AUDIT_PAGINATION_TOKENS,
  AUDIT_MOTION,
} from './components/audit';

// Settings
export {
  SETTINGS_CHIP_TOKENS,
  SETTINGS_CARD_HEADER_TOKENS,
  SETTINGS_INFO_BOX_TOKENS,
  SETTINGS_SPACING_TOKENS,
  SETTINGS_TEXT_TOKENS,
  getSettingsChipClasses,
  getSettingsChipIconClasses,
  getSettingsCardHeaderClasses,
  getSettingsIconContainerClasses,
  getSettingsInfoBoxClasses,
  type SettingsChipState,
} from './components/settings';

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
