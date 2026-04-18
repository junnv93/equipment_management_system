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
    /** 테이블 셀 내부 좌우 여백 (mm) — px 환산은 Worker의 mmToPx() 사용 */
    tableCellPaddingMm: 0.9,
    /** 필드명↔값 사이 세로 간격 (mm) */
    rowGapMm: 0.35,
    /** 라벨 셀 전체 배경 색상 (종이 기본색) */
    cellBackgroundColor: '#ffffff' as const,
    /** 셀 외곽선·구분선 색상 */
    borderColor: '#e0e0e0' as const,
    /** 필드명(label) 텍스트 색상 */
    fieldLabelColor: '#888888' as const,
    /** 필드값(value) 텍스트 색상 */
    fieldValueColor: '#111111' as const,
    /** QR 모듈 전경(dark) 색상 — contrast ratio 21:1 (AA+AAA 최대) */
    qrForegroundColor: '#000000' as const,
    /** QR 배경(light) 색상 — 인쇄 중성 흰색 */
    qrBackgroundColor: '#ffffff' as const,
    /**
     * QR 모듈당 서브픽셀 오버랩(px) — 서브픽셀 경계의 흰 선 artifact 방지.
     * 인쇄 DPI가 높을수록 0에 가까워도 되나, 150dpi 기준 1px이 안전.
     */
    qrModuleOverlapPx: 1,

    // ─── Auto-fit 텍스트 렌더링 — 업계 표준 3단계 파이프라인 (SSOT) ────────
    // Brother P-touch / Avery DesignPro / Seagull BarTender / Zebra 공통 방식:
    //   ① shrink-to-fit (폰트 축소) → ② multi-line wrap → ③ ellipsis fallback

    /** 관리번호 값 폰트 최소 크기 (pt) — shrink-to-fit 하한 */
    mgmtMinFontPt: 8,
    /** 장비명 값 폰트 최소 크기 (pt) — shrink-to-fit 하한 */
    nameMinFontPt: 6,
    /** 일련번호 값 폰트 최소 크기 (pt) — shrink-to-fit 하한 */
    serialMinFontPt: 6,
    /**
     * 장비명 최대 줄 수.
     * 관리번호·일련번호는 줄바꿈 시 오독 위험 → 1로 고정.
     * 장비명은 한국어 자연어 설명 → 2줄 허용.
     */
    nameMaxLines: 2,
    /** 다중 줄 렌더링 시 폰트 크기 대비 줄 높이 배율 (CSS line-height 동등) */
    lineHeightRatio: 1.15,
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

/** QR 라벨 PDF 생성 입력 — 메인 스레드·Worker 공유 타입 (SSOT) */
export interface LabelItem {
  managementNumber: string;
  equipmentName: string;
  serialNumber?: string;
}
