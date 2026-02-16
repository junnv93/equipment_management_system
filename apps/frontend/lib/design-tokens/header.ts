/**
 * Header Design Tokens — Re-export Wrapper
 *
 * SSOT: 모든 실제 토큰은 components/header.ts에서 정의됩니다.
 * 이 파일은 기존 import 경로(`@/lib/design-tokens/header`)를 유지하기 위한
 * 하위 호환 레이어입니다.
 *
 * 새로운 코드는 배럴 export를 사용하세요:
 * import { getHeaderButtonClasses } from '@/lib/design-tokens';
 */
export {
  HEADER_SIZES,
  HEADER_SPACING,
  HEADER_INTERACTIVE_STYLES,
  NOTIFICATION_BADGE_POSITION,
  getHeaderButtonClasses,
  getHeaderSizeClasses,
  getHeaderSizeClasses as combineHeaderClasses,
  getHeaderSpacingClass,
  getNotificationBadgePositionClass,
} from './components/header';
