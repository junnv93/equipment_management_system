/**
 * QR 코드 및 라벨 인쇄 설정 상수 — SSOT
 *
 * ⚠️ 이 파일이 QR 생성/라벨 레이아웃의 단일 소스입니다.
 * - 프론트엔드 EquipmentQRCode 컴포넌트는 QR_CONFIG 사용
 * - 라벨 PDF 생성 (Web Worker, Phase 2)은 LABEL_CONFIG 사용
 * - 셀 치수 하드코딩 금지 — 모두 여기서 참조
 */

/**
 * QR 코드 생성 옵션 (qrcode 라이브러리 전달)
 *
 * errorCorrectionLevel 'H':
 *   - 최대 30% 훼손 복구
 *   - 물리 라벨(먼지, 스크래치, 접힘)을 고려한 선택
 *   - 낮은 레벨('L' 7%, 'M' 15%, 'Q' 25%, 'H' 30%) 중 최상
 *
 * margin 1:
 *   - 최소 quiet zone (standard는 4 모듈이지만 라벨 공간 절약)
 *   - H-level 에러 정정과 조합 시 스캔 신뢰도 유지
 */
export const QR_CONFIG = {
  errorCorrectionLevel: 'H' as const,
  margin: 1,
  scale: 4,
} as const;

/**
 * A4 라벨 시트 PDF 레이아웃 (SSOT)
 *
 * 기준:
 *   - A4: 210 × 297mm
 *   - 페이지 여백: 10mm (상하좌우)
 *   - 유효 영역: 190 × 277mm
 *   - 그리드: 4 columns × 7 rows = 28 labels/page
 *   - 셀 간 gutter: 3mm
 *   - 셀 크기: (190 - 3*3)/4 ≈ 45.25mm × (277 - 3*6)/7 ≈ 37mm
 *
 * 각 셀 내부 레이아웃 (EquipmentQRCode 인쇄와 동일):
 *   - QR: 25 × 25mm (좌측)
 *   - 텍스트 영역 (우측, ~18mm):
 *       - 장비명 (9pt, 2줄 truncate)
 *       - 관리번호 (11pt, bold, monospace)
 *       - 사이트·팀 (7pt)
 */
export const LABEL_CONFIG = {
  pdf: {
    pageSize: 'a4' as const,
    pageWidthMm: 210,
    pageHeightMm: 297,
    marginMm: 10,
    cols: 4,
    rows: 7,
    gutterMm: 3,
  },
  cell: {
    qrSizeMm: 25,
    textPaddingLeftMm: 2,
    fontFamily: 'helvetica' as const,
    nameFontPt: 9,
    mgmtFontPt: 11,
    siteFontPt: 7,
  },
  /**
   * 한 번의 PDF 생성 작업에서 허용되는 최대 장비 수.
   * 초과 시 사용자에게 배치 분할 확인을 요구 (Phase 2 generate-label-pdf.ts).
   * 메모리 + Web Worker 진행률 UX를 고려한 보수적 상한.
   */
  maxBatch: 500,
} as const;

/**
 * LABEL_CONFIG에서 파생되는 셀 치수 (하드코딩 금지 — 이 getter 사용)
 */
export function getLabelCellDimensions(): {
  widthMm: number;
  heightMm: number;
  perPage: number;
} {
  const { pdf } = LABEL_CONFIG;
  const usableWidthMm = pdf.pageWidthMm - pdf.marginMm * 2;
  const usableHeightMm = pdf.pageHeightMm - pdf.marginMm * 2;
  const widthMm = (usableWidthMm - pdf.gutterMm * (pdf.cols - 1)) / pdf.cols;
  const heightMm = (usableHeightMm - pdf.gutterMm * (pdf.rows - 1)) / pdf.rows;
  return {
    widthMm,
    heightMm,
    perPage: pdf.cols * pdf.rows,
  };
}

export type QrConfig = typeof QR_CONFIG;
export type LabelConfig = typeof LABEL_CONFIG;
