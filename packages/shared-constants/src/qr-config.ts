/**
 * QR 코드 및 라벨 인쇄 설정 상수 — SSOT
 *
 * ⚠️ 이 파일이 QR 생성/라벨 레이아웃의 단일 소스입니다.
 * - 프론트엔드 EquipmentQRCode 컴포넌트는 QR_CONFIG 사용
 * - 라벨 PDF 생성 (Web Worker)은 LABEL_CONFIG 사용
 * - 셀 치수·폰트 크기·필드명 하드코딩 금지 — 모두 여기서 참조
 */

/**
 * QR 코드 생성 옵션 (qrcode 라이브러리 전달)
 *
 * errorCorrectionLevel 'H':
 *   - 최대 30% 훼손 복구
 *   - 물리 라벨(먼지, 스크래치, 접힘)을 고려한 선택
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
 * 그리드 기준 (cols × rows = 페이지 당 라벨 수):
 *   - 3 × 5 = 15 labels/page
 *   - 셀 크기: (190 - 3*2)/3 ≈ 61.3mm × (277 - 3*4)/5 = 53mm
 *
 * 각 셀 내부 레이아웃:
 *   ┌─────────────────────────────────────────┐
 *   │         │ 관리번호 │ SUW-E0001          │
 *   │  [QR]   │─────────┼────────────────────│
 *   │  25×25mm│ 장비명   │ 오실로스코프       │
 *   │         │─────────┼────────────────────│
 *   │         │ 일련번호 │ SN-12345           │
 *   └─────────────────────────────────────────┘
 *
 * 페이지 당 라벨 수 변경: cols/rows 수정 → getLabelCellDimensions()가 자동 재계산.
 */
export const LABEL_CONFIG = {
  pdf: {
    pageSize: 'a4' as const,
    pageWidthMm: 210,
    pageHeightMm: 297,
    marginMm: 10,
    /** 열 수 — 변경 시 셀 크기가 자동 재계산됨 */
    cols: 3,
    /** 행 수 — 변경 시 셀 크기가 자동 재계산됨 */
    rows: 5,
    gutterMm: 3,
  },
  cell: {
    qrSizeMm: 25,
    textPaddingLeftMm: 2,
    /**
     * CSS font-stack — OffscreenCanvas 렌더링 시 사용.
     * 한국 Windows(맑은 고딕), macOS(Apple SD Gothic Neo), Linux(Noto Sans KR) 순 fallback.
     */
    fontStack:
      '"맑은 고딕", "Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", "나눔고딕", sans-serif',
    /** 테이블 필드명(관리번호·장비명·일련번호) 폰트 크기 */
    fieldLabelFontPt: 6,
    /** 관리번호 값 폰트 크기 */
    mgmtFontPt: 11,
    /** 장비명 값 폰트 크기 */
    nameFontPt: 9,
    /** 일련번호 값 폰트 크기 */
    serialFontPt: 8,
    /** 테이블 필드명 레이블 — 하드코딩 금지 */
    tableFieldLabels: {
      mgmtNo: '관리번호' as const,
      name: '장비명' as const,
      serialNo: '일련번호' as const,
    },
    /** 라벨 셀 OffscreenCanvas 렌더링 해상도. 인쇄 품질 조정 시 여기만 수정. */
    printDpi: 150,
  },
  /**
   * 한 번의 PDF 생성 작업에서 허용되는 최대 장비 수.
   * 초과 시 사용자에게 배치 분할 확인을 요구.
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
