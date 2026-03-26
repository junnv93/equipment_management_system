/**
 * Document Management Design Tokens
 *
 * AttachmentsTab, DocumentRevisionDialog 등 문서 관련 UI에서 사용.
 * CALIBRATION_TABLE 구조를 기반으로 문서 도메인에 특화된 토큰 제공.
 *
 * AP-04: 깊이 차등 (superseded 행)
 * AP-05: 상태 표시 혼용 (badge + border + tint)
 * AP-06: 모션 (테이블 행 hover transition)
 * AP-07: 테이블 프리미엄 (stripe + hover + stickyHeader)
 */

import { TRANSITION_PRESETS } from '../motion';

// ============================================================================
// 1. DOCUMENT_MOTION — 전환 애니메이션
// ============================================================================

export const DOCUMENT_MOTION = {
  /** 테이블 행 hover */
  tableRow: TRANSITION_PRESETS.instantBg,
  /** 다운로드 버튼 hover */
  actionButton: TRANSITION_PRESETS.fastBgColor,
  /** 링크 hover */
  link: TRANSITION_PRESETS.fastColor,
} as const;

// ============================================================================
// 2. DOCUMENT_TABLE — 테이블 스타일 (AP-07)
// ============================================================================

export const DOCUMENT_TABLE = {
  /** 테이블 외부 컨테이너: raised elevation */
  wrapper: 'border rounded-lg shadow-sm overflow-hidden',

  /** Sticky header */
  stickyHeader: 'sticky top-0 z-10 bg-background',

  /** Alternate row stripe */
  stripe: 'even:bg-muted/30 dark:even:bg-muted/20',

  /** Row hover: accent bar + background + motion */
  rowHover: [
    'hover:bg-brand-info/[0.04] dark:hover:bg-brand-info/[0.06]',
    'hover:shadow-[inset_3px_0_0_hsl(var(--brand-color-info))]',
    DOCUMENT_MOTION.tableRow,
  ].join(' '),

  /** 파일명 컬럼: 시각적 주목점 (AP-03 타이포 드라마) */
  fileNameCell: 'font-medium',

  /** 숫자 컬럼 */
  numericCell: 'text-sm text-muted-foreground tabular-nums',

  /** 액션 버튼 컨테이너 */
  actionsCell: 'flex items-center gap-1',
} as const;

// ============================================================================
// 3. DOCUMENT_STATUS — 상태별 행 스타일 (AP-04 깊이, AP-05 상태)
// ============================================================================

/**
 * 문서 상태별 행 클래스
 *
 * active: 기본 (강조 없음)
 * superseded: 틴트 배경 + 좌측 보더 (opacity 대신 깊이 차등)
 * deleted: 취소선 + 흐림
 */
export function getDocumentRowClasses(status: string): string {
  switch (status) {
    case 'superseded':
      return 'bg-muted/20 dark:bg-muted/10 border-l-2 border-muted-foreground/30';
    case 'deleted':
      return 'opacity-40 line-through';
    default:
      return '';
  }
}

// ============================================================================
// 4. DOCUMENT_EMPTY_STATE — 빈 상태
// ============================================================================

export const DOCUMENT_EMPTY_STATE = {
  /** 아이콘 */
  icon: 'h-12 w-12 text-muted-foreground',
  /** 텍스트 */
  text: 'text-sm text-muted-foreground',
  /** 컨테이너 */
  container: 'flex flex-col items-center justify-center py-12 gap-3',
} as const;
