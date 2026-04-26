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
    'hover:bg-brand-info/[0.04]',
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

// ============================================================================
// 5. DOCUMENT_UPLOAD — 업로드 폼 영역 스타일 (AP-01, AP-02, AP-03)
// ============================================================================

export const DOCUMENT_UPLOAD = {
  /** 업로드 섹션 구분선 — 안내 Alert와 업로드 영역 사이 시각적 분리 */
  sectionDivider: 'border-t border-border/60 pt-6',

  /** 업로드 그룹 컨테이너 — 사진+매뉴얼은 같은 그룹 (tight spacing) */
  uploadGroup: 'space-y-5',

  /** 개별 업로드 영역 래퍼 — 좌측 보더 accent로 시각 계층 */
  uploadArea: 'pl-4 border-l-2 space-y-2',

  /** 사진 영역 보더색 (brand-info) */
  uploadAreaPhoto: 'border-brand-info',

  /** 매뉴얼 영역 보더색 (brand-purple) */
  uploadAreaManual: 'border-brand-purple',

  /** 검수보고서/이력카드 영역 보더색 (muted) */
  uploadAreaAttachment: 'border-muted-foreground/30',

  /** 업로드 영역 제목 — AP-03 타이포 차등 (text-base > text-sm) */
  uploadTitle: 'text-sm font-semibold flex items-center gap-2',

  /** 업로드 영역 설명 */
  uploadDescription: 'text-xs text-muted-foreground',
} as const;

// ============================================================================
// 6. DOCUMENT_DISPLAY — 상세 페이지 사진/매뉴얼 표시 (AP-04, AP-06, AP-09)
// ============================================================================

export const DOCUMENT_DISPLAY = {
  /** 사진 그리드 컨테이너 */
  photoGrid: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3',

  /** 사진 카드 — hover ring + 부드러운 전환 (AP-06) */
  photoCard: [
    'group relative aspect-square rounded-lg overflow-hidden border bg-muted/30',
    'hover:ring-2 hover:ring-brand-info/50 hover:shadow-sm',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    TRANSITION_PRESETS.fastBgColorShadow,
  ].join(' '),

  /** 사진 카드 내부 아이콘 */
  photoIcon: [
    'h-8 w-8 text-muted-foreground group-hover:text-brand-info',
    TRANSITION_PRESETS.fastColor,
  ].join(' '),

  /** 사진 카드 파일명 오버레이 */
  photoOverlay: 'absolute bottom-0 inset-x-0 bg-background/80 backdrop-blur-sm px-2 py-1',

  /** 매뉴얼 파일 행 — hover accent (AP-06) */
  manualRow: [
    'flex items-center justify-between p-3 rounded-lg border bg-muted/30',
    'hover:bg-brand-purple/[0.04]',
    'hover:shadow-[inset_3px_0_0_hsl(var(--brand-color-purple))]',
    TRANSITION_PRESETS.instantBg,
  ].join(' '),

  /** 매뉴얼 아이콘 */
  manualIcon: 'h-5 w-5 flex-shrink-0 text-brand-purple',

  /** 빈 상태 — 컴팩트 버전 (사진/매뉴얼 영역 내) */
  emptyCompact: 'flex flex-col items-center justify-center py-8 gap-2',

  /** 빈 상태 아이콘 */
  emptyIcon: 'h-8 w-8 text-muted-foreground/50',

  /** 빈 상태 텍스트 */
  emptyText: 'text-xs text-muted-foreground',

  /** 사진 카운트 배지 */
  countBadge: 'ml-2 text-xs',
} as const;
