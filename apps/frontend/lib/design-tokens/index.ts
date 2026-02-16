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
