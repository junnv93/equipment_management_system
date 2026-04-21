/**
 * QR 코드 및 라벨 인쇄 설정 상수 — SSOT
 *
 * ⚠️ 이 파일이 QR 생성/라벨 레이아웃의 단일 소스입니다.
 * - 프론트엔드 EquipmentQRCode 컴포넌트는 QR_CONFIG 사용
 * - 라벨 PDF 생성 (Web Worker)은 LABEL_CONFIG 사용
 * - 셀 치수·폰트 크기·필드명·절제선 하드코딩 금지 — 모두 여기서 참조
 */

/**
 * XL 라벨 높이 (mm) — 폰트 스케일 기준이자 xl preset의 heightMm SSOT.
 * LABEL_CONFIG.scaling.referenceLabelHeightMm 과 LABEL_SIZE_PRESETS.xl.heightMm
 * 양쪽이 이 값을 참조하여 drift를 방지한다.
 */
const XL_LABEL_HEIGHT_MM = 43.7;

/**
 * 포인트(pt) → 밀리미터(mm) 변환 계수 (SSOT).
 *
 * 1 pt = 1/72 inch = 25.4/72 mm ≈ 0.35278 mm.
 * jsPDF는 mm 단위로 동작하므로, pt 기반 폰트 크기를 mm 위치로 변환할 때 사용한다.
 * `ptToPx()`(DPI 기반 픽셀 변환)와는 별도의 변환 — jsPDF 레이어 전용.
 */
export const PT_TO_MM = 25.4 / 72;

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
 *   - 2 × 6 = 12 labels/page
 *   - 셀 크기: (190 - 3*1)/2 = 93.5mm × (277 - 3*5)/6 ≈ 43.7mm
 *
 * 각 셀 내부 레이아웃 (qrPaddingLeftMm=2 기준):
 *   ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐  ← 절제선 (jsPDF 레이어)
 *   ╎  ▪▫▪  │ 관리번호 │ SUW-E0001            ╎
 *   ╎  [QR] │──────────┼──────────────────────╎
 *   ╎  25mm │ 장비명   │ 오실로스코프         ╎
 *   ╎       │──────────┼──────────────────────╎
 *   ╎       │ 일련번호 │ SN-12345             ╎
 *   └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘
 *   ↑ QR 좌측 qrPaddingLeftMm 여백
 *
 * 페이지 당 라벨 수 변경: cols/rows 수정 → getLabelCellDimensions()가 자동 재계산.
 * 절제선 스타일 변경: pdf.cutLine 수정 → Worker가 자동 반영.
 */
export const LABEL_CONFIG = {
  pdf: {
    pageSize: 'a4' as const,
    pageWidthMm: 210,
    pageHeightMm: 297,
    marginMm: 10,
    /** 열 수 — 변경 시 셀 크기가 자동 재계산됨 */
    cols: 2,
    /** 행 수 — 변경 시 셀 크기가 자동 재계산됨 */
    rows: 6,
    gutterMm: 3,
    /**
     * 절제선(가위 커팅 가이드) 설정 — 업계 표준 점선 스펙 (SSOT)
     *
     * 물리 라벨 시트 업계 표준 (Avery, Brother, Zebra 공통):
     *   - 셀 사이 gutter 중앙에 점선 렌더링 (jsPDF 레이어)
     *   - 셀 OffscreenCanvas에 포함하지 않음 → gutter 영역을 셀이 알 수 없기 때문
     *   - 외곽 실선(borderColor) 제거 → 절제선이 경계 역할 대체
     *
     * ISO 11093 / ANSI MH10.8 라벨 시트 커팅 가이드 스펙 근거:
     *   - dash 2mm / gap 1mm: 물리 프린터 최소 해상도(300dpi)에서 식별 가능한 최소 dash
     *   - 색상 #aaaaaa: CMYK 0/0/0/33 — 프린터 토너 절약 + 시각적 가이드 균형
     *   - 굵기 0.2mm: 헤어라인(0.1mm) 대비 가독성 + 인쇄물 오염 시 유지
     */
    cutLine: {
      /** 점선 dash 길이 (mm) */
      dashMm: 2,
      /** 점선 gap 길이 (mm) */
      gapMm: 1,
      /** 절제선 색상 (hex) — CMYK 0/0/0/33 근사 */
      color: '#aaaaaa' as const,
      /** 절제선 굵기 (mm) */
      lineWidthMm: 0.2,
    },
  },
  cell: {
    /**
     * QR 코드 좌측 패딩 (mm) — 절제선과의 시각적 분리 확보.
     * gutterMm(3mm) 기준 약 2/3 여백 → 인쇄 후 QR이 절제선에 닿지 않음.
     */
    qrPaddingLeftMm: 2,
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
    /**
     * 라벨 셀 OffscreenCanvas 렌더링 해상도.
     * 200dpi: 물리 프린터 기본 해상도(300dpi)에서 업스케일 없이 선명한 텍스트 보장.
     * 150dpi 대비 파일 크기 1.78배 증가, 텍스트 가장자리 anti-aliasing 품질 향상.
     */
    printDpi: 200,
    /** 테이블 셀 내부 좌우 여백 (mm) — px 환산은 Worker의 mmToPx() 사용 */
    tableCellPaddingMm: 0.9,
    /** 필드명↔값 사이 세로 간격 (mm) */
    rowGapMm: 0.35,
    /** 라벨 셀 전체 배경 색상 (종이 기본색) */
    cellBackgroundColor: '#ffffff' as const,
    /**
     * 셀 내부 구분선 색상 (QR↔텍스트 세로선, 행 가로선).
     * #c0c0c0: 일반 레이저/잉크젯 프린터에서 식별 가능한 최소 명도.
     * 기존 #e0e0e0은 저품질 프린터에서 소실됨 → #c0c0c0으로 상향.
     */
    borderColor: '#c0c0c0' as const,
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
     * 200dpi 기준 1px 유지 (300dpi 이상에서는 0으로 감소 가능).
     */
    qrModuleOverlapPx: 1,

    // ─── Auto-fit 텍스트 렌더링 — 업계 표준 3단계 파이프라인 (SSOT) ────────
    // Brother P-touch / Avery DesignPro / Seagull BarTender / Zebra 공통 방식:
    //   ① shrink-to-fit (폰트 축소) → ② multi-line wrap → ③ ellipsis fallback

    /** 관리번호 값 폰트 최소 크기 (pt) — shrink-to-fit 하한 (소형 라벨 대응) */
    mgmtMinFontPt: 6,
    /** 장비명 값 폰트 최소 크기 (pt) — shrink-to-fit 하한 */
    nameMinFontPt: 6,
    /** 일련번호 값 폰트 최소 크기 (pt) — shrink-to-fit 하한 */
    serialMinFontPt: 6,
    /**
     * 장비명 최대 줄 수 상한 (cap).
     * 실제 줄 수는 computeMaxLines()가 rowH 기준으로 동적 결정하며, 이 값이 상한이 됨.
     * 관리번호·일련번호는 maxLines=1로 고정 (줄바꿈 시 오독 위험).
     */
    nameMaxLinesCap: 2,
    /**
     * @deprecated Use `nameMaxLinesCap` + `computeMaxLines()` for row-height-aware limit.
     * 하위 호환을 위해 유지 — Worker는 이 값을 직접 사용하지 않음.
     */
    nameMaxLines: 2,
    /** 다중 줄 렌더링 시 폰트 크기 대비 줄 높이 배율 (CSS line-height 동등) */
    lineHeightRatio: 1.15,
    /**
     * topOffset 하한값 — 실제 사용 폰트·줄 수 기반 contentH가 rowH를 초과해도
     * 텍스트가 셀 상단 경계 밖으로 나가지 않도록 clamp.
     * 0: 상단 정렬 (최소 클리핑). 음수 허용 시 이 값을 낮춤.
     */
    topOffsetClampMin: 0,
  },
  /**
   * 폰트 스케일 보정 기준값 — auto-fit 파이프라인 전용.
   *
   * Worker는 `heightMm / scaling.referenceLabelHeightMm` 비율로 valueFontPx를 보정하여
   * auto-fit 파이프라인의 시작점을 라벨 크기에 적합하게 조정한다.
   * 렌더링 파라미터(cell)와 분리된 독립 네임스페이스.
   */
  scaling: {
    referenceLabelHeightMm: XL_LABEL_HEIGHT_MM,
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

// ─────────────────────────────────────────────────────────────────────────────
// 단일 라벨 인쇄 — 양식/크기 선택 (SSOT)
// 일괄 인쇄(BulkLabelPrintButton)는 getLabelCellDimensions() + 'full' 고정 사용.
// 개별 장비 상세 페이지에서만 아래 preset/layoutMode를 선택할 수 있음.
// ─────────────────────────────────────────────────────────────────────────────

/** 단일 라벨 크기 프리셋 — 6단계 */
export type LabelSizePreset = 'xl' | 'large' | 'medium' | 'small' | 'xs' | 'xxs';

/** 단일 라벨 레이아웃 모드 */
export type LabelLayoutMode = 'full' | 'qrOnly';

/**
 * 단일 라벨 크기 프리셋 정의 (SSOT).
 *
 * | preset | widthMm × heightMm | qrSizeMm | 권장 용도                          |
 * |--------|--------------------|----------|------------------------------------|
 * | xl     | 93.5 × 43.7        | 25       | 일반 장비 (A4 시트 일괄 기준)      |
 * | large  | 80 × 38            | 22       | 대형 계측기기                      |
 * | medium | 60 × 28            | 18       | 중형 장비                          |
 * | small  | 50 × 20            | 14       | 소형 장비                          |
 * | xs     | 42 × 18            | 12       | 휴대용·소형 부착                   |
 * | xxs    | 36 × 15            | 10       | 케이블·부품                        |
 *
 * qrSizeMm 최솟값 근거:
 *   URL ~30자 + errorCorrectionLevel H → 33×33 모듈.
 *   300dpi 기준 스캔 신뢰 하한 ~9mm (모듈당 약 0.27mm ≥ 0.25mm 안전 마진).
 */
export const LABEL_SIZE_PRESETS: Record<
  LabelSizePreset,
  { widthMm: number; heightMm: number; qrSizeMm: number }
> = {
  xl: { widthMm: 93.5, heightMm: XL_LABEL_HEIGHT_MM, qrSizeMm: 25 },
  large: { widthMm: 80, heightMm: 38, qrSizeMm: 22 },
  medium: { widthMm: 60, heightMm: 28, qrSizeMm: 18 },
  small: { widthMm: 50, heightMm: 20, qrSizeMm: 14 },
  xs: { widthMm: 42, heightMm: 18, qrSizeMm: 12 },
  xxs: { widthMm: 36, heightMm: 15, qrSizeMm: 10 },
};

/**
 * 레이아웃 모드 최소 크기 제약 (SSOT).
 *
 * full.minHeightMm=13: xxs(15mm) 이상에서 3행 텍스트 가능.
 * auto-fit 파이프라인이 각 크기에서 폰트를 자동 축소하여 공간에 맞춤.
 */
export const LABEL_LAYOUT_CONSTRAINTS: Record<
  LabelLayoutMode,
  { minWidthMm: number; minHeightMm: number }
> = {
  full: { minWidthMm: 25, minHeightMm: 13 },
  qrOnly: { minWidthMm: 15, minHeightMm: 9 },
};

/**
 * 요청한 레이아웃 모드가 선택한 크기 프리셋에서 가능한지 확인하고
 * 불가능하면 자동으로 단계를 낮춘다 (full → qrOnly).
 *
 * @returns mode — 실제 사용할 모드, fallback — 자동 축소 여부
 */
export function resolveLayoutMode(
  requested: LabelLayoutMode,
  preset: LabelSizePreset
): { mode: LabelLayoutMode; fallback: boolean } {
  const { widthMm, heightMm } = LABEL_SIZE_PRESETS[preset];
  const order: LabelLayoutMode[] = ['full', 'qrOnly'];
  const startIdx = order.indexOf(requested);

  for (let i = startIdx; i < order.length; i += 1) {
    const c = LABEL_LAYOUT_CONSTRAINTS[order[i]];
    if (widthMm >= c.minWidthMm && heightMm >= c.minHeightMm) {
      return { mode: order[i], fallback: i !== startIdx };
    }
  }
  return { mode: 'qrOnly', fallback: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// 사이즈 샘플러 설정 — SSOT
// A4 1페이지에 모든 크기 변형을 실물 크기로 배치하여 사용자가 직접 잘라 사용.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 사이즈 샘플러 — preset별 라벨 배치 (rows × cols).
 *
 * 사용자가 사이즈를 비교·선택할 수 있도록 각 preset을 정확히 1개씩 배치.
 *
 * A4 usable: 190mm × 277mm (margin 10mm).
 * 가로: cols=1이므로 각 라벨이 단독 배치, 모두 190mm 이내 ✓
 * 세로 합계 (headerHeightMm=7, groupGapMm=6):
 *   (7+43.7)+(7+38)+(7+28)+(7+20)+(7+18)+(7+15) + 5×6 = 234.7mm
 *   marginMm=10 기준 최종 바닥 244.7mm < 297mm ✓
 */
export const LABEL_SAMPLER_LAYOUT: Record<LabelSizePreset, { rows: number; cols: number }> = {
  xl: { rows: 1, cols: 1 },
  large: { rows: 1, cols: 1 },
  medium: { rows: 1, cols: 1 },
  small: { rows: 1, cols: 1 },
  xs: { rows: 1, cols: 1 },
  xxs: { rows: 1, cols: 1 },
} as const;

/**
 * 사이즈 샘플러 스타일/여백 설정 — SSOT.
 *
 * Worker와 UI 모두 이 상수를 통해 참조하므로 하드코딩 금지.
 */
export const LABEL_SAMPLER_CONFIG = {
  /** 그룹 헤더 텍스트 폰트 크기 (pt) — 라벨 위 크기 설명 텍스트 */
  headerFontPt: 8,
  /** 헤더 텍스트 색상 — 본문 라벨과 시각적 구분 */
  headerColor: '#555555' as const,
  /** 헤더 영역 세로 높이 (mm) — 헤더 텍스트 + 하단 여백 포함 */
  headerHeightMm: 7,
  /** 크기 그룹 사이 세로 여백 (mm) — 구분선 포함 */
  groupGapMm: 6,
  /** 같은 그룹 내 라벨 간 여백 (mm) — 절제 여유 공간 */
  labelGapMm: 2,
  /** 그룹 사이 구분선 색상 */
  dividerColor: '#dddddd' as const,
  /** 구분선 굵기 (mm) — 헤어라인보다 약간 두껍게, 시각 구분 최소화 */
  dividerLineWidthMm: 0.3,
} as const;

export type LabelSamplerConfig = typeof LABEL_SAMPLER_CONFIG;
export type LabelSamplerLayout = typeof LABEL_SAMPLER_LAYOUT;

/**
 * 샘플러 렌더링 순서 — 큰 크기부터 위→아래 배치.
 *
 * `Object.keys(LABEL_SAMPLER_LAYOUT)`은 TypeScript에서 `string[]`을 반환하므로
 * `LabelSizePreset[]` 타입 보장을 위해 명시적 함수로 분리한다.
 */
export function getSamplerPresetOrder(): LabelSizePreset[] {
  return ['xl', 'large', 'medium', 'small', 'xs', 'xxs'];
}
