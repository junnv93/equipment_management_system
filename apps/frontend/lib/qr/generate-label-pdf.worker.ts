/// <reference lib="webworker" />

/**
 * QR 라벨 PDF 생성 Web Worker.
 *
 * 렌더링 전략:
 *   각 라벨 셀을 OffscreenCanvas로 완전 렌더링(QR + 테이블)한 뒤 PNG로 변환하여 jsPDF에 삽입.
 *   jsPDF는 페이지 레이아웃(여백·페이지 추가·이미지 배치)과 절제선 렌더링을 담당.
 *   텍스트 렌더링은 브라우저 CJK 폰트 스택에 위임 → 한국어 깨짐 없음.
 *
 * 텍스트 렌더링 파이프라인 (Measure-Draw 두 패스 분리):
 *   Pass 1 — Spec:    RowSpec[] 구성 (행별 설정)
 *   Pass 2 — Measure: measureValue()로 실제 fontPx·줄 수·라인 배열 확정 (캔버스 side-effect 없음)
 *   Pass 3 — Layout:  측정 결과 기반으로 Y 좌표·topOffset 계산 (clamp 적용)
 *   Pass 4 — Draw:    drawValue()로 확정된 좌표에 렌더링
 *
 * 이 패턴은 Brother P-touch / Avery DesignPro / Zebra BarTender의 공통 방식으로,
 * topOffset이 음수가 되어 텍스트가 셀 경계 밖으로 나가는 오버플로우를 구조적으로 방지한다.
 *
 * 셀 레이아웃 (qrPaddingLeftMm=2 기준):
 *   ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐  ← 절제선 (jsPDF 레이어)
 *   ╎  ▪▫▪  │ 관리번호 │ SUW-E0001            ╎
 *   ╎  [QR] │──────────┼──────────────────────╎
 *   ╎  25mm │ 장비명   │ 오실로스코프         ╎
 *   ╎       │──────────┼──────────────────────╎
 *   ╎       │ 일련번호 │ SN-12345             ╎
 *   └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘
 *   ↑ qrPaddingLeftMm 여백
 *
 * 레이어 구조 (아래→위):
 *   1. 셀 PNG 이미지 (OffscreenCanvas — QR + 내부 구분선 + 텍스트)
 *   2. 절제선 점선 (jsPDF — gutter 중앙, 페이지 전체 span)
 *
 * 메시지 프로토콜:
 *   main → worker: `{ type: 'generate', items, appUrl }`
 *   worker → main: `{ type: 'progress', done, total }` | `{ type: 'done', pdfBytes }` | `{ type: 'error', message }`
 */

import jsPDF from 'jspdf';
import QRCode, { type QRCode as QRCodeData } from 'qrcode';
import {
  QR_CONFIG,
  LABEL_CONFIG,
  LABEL_SIZE_PRESETS,
  LABEL_SAMPLER_LAYOUT,
  LABEL_SAMPLER_CONFIG,
  getSamplerPresetOrder,
  getLabelCellDimensions,
  buildEquipmentQRUrl,
  type LabelItem,
  type LabelLayoutMode,
  type LabelSizePreset,
} from '@equipment-management/shared-constants';

type InboundMessage = {
  type: 'generate';
  items: LabelItem[];
  appUrl: string;
  /**
   * 'single': 개별 라벨 1장 (sizePreset + layoutMode 선택 가능).
   * 'batch': A4 시트 2×6 그리드 일괄.
   * 'sampler': A4 1페이지에 모든 크기 변형 배치 (items[0]만 사용).
   */
  mode?: 'single' | 'batch' | 'sampler';
  sizePreset?: LabelSizePreset;
  layoutMode?: LabelLayoutMode;
  /** sampler 모드 전용 — 메인 스레드에서 i18n 빌드한 preset별 헤더 문자열 */
  samplerHeaders?: Record<LabelSizePreset, string>;
};

type OutboundMessage =
  | { type: 'progress'; done: number; total: number }
  | { type: 'done'; pdfBytes: ArrayBuffer }
  | { type: 'error'; message: string };

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

function post(message: OutboundMessage, transfer?: Transferable[]): void {
  if (transfer && transfer.length > 0) {
    ctx.postMessage(message, transfer);
  } else {
    ctx.postMessage(message);
  }
}

/** Web Worker 환경에서 Blob을 data URL로 변환 (DOM 없이 FileReader 사용). */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** LABEL_CONFIG.cell.printDpi 기준 mm → px 변환 (하드코딩 금지). */
function mmToPx(mm: number): number {
  return Math.round((mm * LABEL_CONFIG.cell.printDpi) / 25.4);
}

/** LABEL_CONFIG.cell.printDpi 기준 pt → px 변환 (하드코딩 금지). */
function ptToPx(pt: number): number {
  return Math.round((pt * LABEL_CONFIG.cell.printDpi) / 72);
}

/**
 * CSS hex 색상 문자열을 jsPDF setDrawColor/setFillColor용 RGB 튜플로 변환.
 * '#rrggbb' 형식만 지원 (LABEL_CONFIG 색상값 규격).
 */
function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

/**
 * QR 모듈 매트릭스를 OffscreenCanvas 2D context에 직접 렌더링.
 *
 * `qrcode` 라이브러리의 `toCanvas`/`toDataURL`은 내부적으로
 * `document.createElement('canvas')` fallback에 도달해 Web Worker에서
 * "You need to specify a canvas element" 에러를 유발한다.
 * 유일한 DOM-free 공개 API인 `QRCode.create()`가 반환한 BitMatrix를
 * 직접 렌더링하여 이 의존성을 제거한다.
 */
function renderQrToCanvas(
  c: OffscreenCanvasRenderingContext2D,
  qrData: QRCodeData,
  x: number,
  y: number,
  sizePx: number
): void {
  const { cell } = LABEL_CONFIG;
  const { size, data } = qrData.modules;
  const quietZone = QR_CONFIG.margin;
  const totalModules = size + quietZone * 2;
  const modulePx = sizePx / totalModules;
  const overlap = cell.qrModuleOverlapPx;

  c.fillStyle = cell.qrBackgroundColor;
  c.fillRect(x, y, sizePx, sizePx);

  c.fillStyle = cell.qrForegroundColor;
  for (let r = 0; r < size; r += 1) {
    for (let col = 0; col < size; col += 1) {
      if (data[r * size + col] !== 0) {
        const mx = x + (col + quietZone) * modulePx;
        const my = y + (r + quietZone) * modulePx;
        c.fillRect(mx, my, modulePx + overlap, modulePx + overlap);
      }
    }
  }
}

/**
 * 텍스트가 maxWidth를 초과하면 "…"를 붙여 잘라낸다.
 * 한국어 포함 임의 문자열에 안전.
 */
function drawTruncated(
  c: OffscreenCanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number
): void {
  if (c.measureText(text).width <= maxWidth) {
    c.fillText(text, x, y);
    return;
  }
  let truncated = text;
  while (truncated.length > 0 && c.measureText(truncated + '…').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  c.fillText(truncated + '…', x, y);
}

/**
 * 텍스트를 maxLines 이내의 줄 배열로 분할.
 *
 * 한국어(CJK, U+1100–U+9FFF 범위): 문자 단위 wrap
 * 영숫자/혼합: 공백 기준 word-wrap → 줄 내 char-wrap fallback
 * 마지막 줄이 maxLines일 때는 drawTruncated가 ellipsis를 처리.
 */
function splitIntoLines(
  c: OffscreenCanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const isCjk = (char: string): boolean => {
    const cp = char.codePointAt(0) ?? 0;
    return (
      (cp >= 0x1100 && cp <= 0x11ff) ||
      (cp >= 0x3130 && cp <= 0x318f) ||
      (cp >= 0xac00 && cp <= 0xd7af) ||
      (cp >= 0x4e00 && cp <= 0x9fff) ||
      (cp >= 0x3000 && cp <= 0x303f)
    );
  };

  const hasAnyCjk = [...text].some(isCjk);
  const lines: string[] = [];
  let remaining = text;

  while (remaining.length > 0 && lines.length < maxLines) {
    let lineEnd = remaining.length;

    if (c.measureText(remaining).width <= maxWidth) {
      lines.push(remaining);
      break;
    }

    if (!hasAnyCjk) {
      const words = remaining.split(' ');
      let line = '';
      let wordIdx = 0;
      while (wordIdx < words.length) {
        const candidate = line.length > 0 ? `${line} ${words[wordIdx]}` : words[wordIdx];
        if (c.measureText(candidate).width > maxWidth && line.length > 0) break;
        line = candidate;
        wordIdx += 1;
      }
      lineEnd = line.length;
    }

    if (lineEnd === remaining.length || lineEnd === 0) {
      let end = 0;
      while (
        end < remaining.length &&
        c.measureText(remaining.slice(0, end + 1)).width <= maxWidth
      ) {
        end += 1;
      }
      lineEnd = Math.max(end, 1);
    }

    lines.push(remaining.slice(0, lineEnd));
    remaining = remaining.slice(lineEnd).trimStart();
  }

  return lines.length > 0 ? lines : [text];
}

// ─────────────────────────────────────────────────────────────────────────────
// Measure-Draw 분리 아키텍처 타입 정의
// ─────────────────────────────────────────────────────────────────────────────

/** measureValue()의 반환 타입 — 실제 사용된 폰트·줄 정보 (side-effect free). */
interface MeasureResult {
  fontPxUsed: number;
  linesUsed: number;
  lines: string[];
}

/** 행 렌더링 설정 (Pass 1 — Spec). */
interface RowSpec {
  label: string;
  value: string;
  valueFontPx: number;
  minFontPx: number;
  maxLinesCap: number;
  bold: boolean;
}

/** 행 측정 결과 (Pass 2 — Measure). */
interface RowMeasured extends RowSpec {
  measured: MeasureResult;
}

/** 행 레이아웃 결과 (Pass 3 — Layout). */
interface RowLaidOut extends RowMeasured {
  rowY: number;
  actualRowH: number;
  labelY: number;
  valueY: number;
  contentH: number;
  topOffset: number;
}

/**
 * rowHeight 기준 장비명 최대 줄 수를 동적으로 계산.
 *
 * 순수 함수 — OffscreenCanvas 미사용, 산술 계산만.
 * rowH가 작은 소형 라벨에서 자동으로 줄 수를 줄여 오버플로우를 방지한다.
 *
 * @returns [1, cap] 범위로 clamp된 최대 줄 수
 */
function computeMaxLines(params: {
  rowH: number;
  fieldLabelPx: number;
  rowGapPx: number;
  valueMinFontPx: number;
  lineHeightRatio: number;
  cap: number;
}): number {
  const { rowH, fieldLabelPx, rowGapPx, valueMinFontPx, lineHeightRatio, cap } = params;
  const available = rowH - fieldLabelPx - rowGapPx;
  const lineH = Math.round(valueMinFontPx * lineHeightRatio);
  if (lineH <= 0) return 1;
  const n = Math.floor(available / lineH);
  return Math.min(Math.max(n, 1), cap);
}

/**
 * 텍스트의 실제 렌더링 크기를 측정한다 (Measure pass — pure).
 *
 * 캔버스에 어떤 픽셀도 그리지 않는다. c.font 설정은 측정을 위한 것으로,
 * draw pass에서 덮어쓰므로 외부 상태 오염이 없다.
 * splitIntoLines()와 shrink-to-fit 로직을 재사용하여 실제 사용될 값을 확정한다.
 */
function measureValue(
  c: OffscreenCanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  opts: {
    preferredFontPx: number;
    minFontPx: number;
    maxLines: number;
    lineHeightRatio: number;
    bold: boolean;
    fontStack: string;
  }
): MeasureResult {
  const { preferredFontPx, minFontPx, bold, fontStack, maxLines } = opts;
  const prefix = bold ? 'bold ' : '';

  const setFont = (px: number): void => {
    c.font = `${prefix}${px}px ${fontStack}`;
  };

  // Step 1 & 2: shrink-to-fit
  let fontPx = preferredFontPx;
  setFont(fontPx);

  while (fontPx > minFontPx && c.measureText(text).width > maxWidth) {
    fontPx -= 1;
    setFont(fontPx);
  }

  // 단일 줄로 맞으면 바로 반환
  if (c.measureText(text).width <= maxWidth) {
    return { fontPxUsed: fontPx, linesUsed: 1, lines: [text] };
  }

  // Step 3: 줄바꿈 시도
  if (maxLines > 1) {
    const lines = splitIntoLines(c, text, maxWidth, maxLines);
    return { fontPxUsed: fontPx, linesUsed: lines.length, lines };
  }

  // Step 4: 단일 줄 말줄임 — 원본 텍스트 반환 (drawTruncated가 draw 패스에서 처리)
  return { fontPxUsed: fontPx, linesUsed: 1, lines: [text] };
}

/**
 * measureValue()의 측정 결과를 사용하여 텍스트를 캔버스에 렌더링한다 (Draw pass).
 *
 * 측정은 이미 완료되었으므로 폰트 재측정 없이 drawTruncated/fillText만 수행.
 * c.font와 c.fillStyle을 설정 후 복구하지 않는다 — 호출자(행 루프)가 각 행마다 재설정.
 */
function drawValue(
  c: OffscreenCanvasRenderingContext2D,
  measured: MeasureResult,
  x: number,
  startY: number,
  maxWidth: number,
  opts: {
    bold: boolean;
    fontStack: string;
    color: string;
    lineHeightRatio: number;
  }
): void {
  const { fontPxUsed, lines, linesUsed } = measured;
  const { bold, fontStack, color, lineHeightRatio } = opts;
  const prefix = bold ? 'bold ' : '';

  c.font = `${prefix}${fontPxUsed}px ${fontStack}`;
  c.fillStyle = color;

  if (linesUsed === 1) {
    drawTruncated(c, lines[0], x, startY, maxWidth);
    return;
  }

  const lineH = Math.round(fontPxUsed * lineHeightRatio);
  lines.forEach((line, i) => {
    drawTruncated(c, line, x, startY + i * lineH, maxWidth);
  });
}

/**
 * 라벨 셀 1개를 OffscreenCanvas로 렌더링하여 PNG data URL 반환.
 *
 * layoutMode에 따른 렌더링:
 *   - 'full'   : QR + 관리번호/장비명/일련번호 3행 테이블 (Measure-Draw 두 패스)
 *   - 'qrOnly' : QR 중앙 정렬만, 텍스트/구분선 없음
 *
 * qrSizeMm가 주어지면 LABEL_CONFIG.cell.qrSizeMm를 override한다 (단일 라벨 크기 프리셋).
 */
async function renderCellToDataUrl(
  item: LabelItem,
  appUrl: string,
  canvas: OffscreenCanvas,
  opts: {
    widthMm: number;
    heightMm: number;
    layoutMode: LabelLayoutMode;
    qrSizeMm: number;
  }
): Promise<string> {
  const { cell } = LABEL_CONFIG;
  const { widthMm, heightMm, layoutMode, qrSizeMm } = opts;

  const cellW = mmToPx(widthMm);
  const cellH = mmToPx(heightMm);

  const c = canvas.getContext('2d');
  if (!c) throw new Error('OffscreenCanvas 2D context unavailable');

  c.textBaseline = 'top';

  // ─── 배경 ───────────────────────────────────────────────────
  c.fillStyle = cell.cellBackgroundColor;
  c.fillRect(0, 0, cellW, cellH);

  // ─── 셀 외곽 테두리 ──────────────────────────────────────────
  c.strokeStyle = cell.borderColor;
  c.lineWidth = 1;
  c.strokeRect(0.5, 0.5, cellW - 1, cellH - 1);

  // ─── QR 코드 ─────────────────────────────────────────────────
  const qrData = QRCode.create(buildEquipmentQRUrl(item.managementNumber, appUrl), {
    errorCorrectionLevel: QR_CONFIG.errorCorrectionLevel,
  });
  const qrPx = mmToPx(qrSizeMm);
  c.imageSmoothingEnabled = false;

  if (layoutMode === 'qrOnly') {
    // QR을 셀 중앙에 배치, 텍스트/구분선 없음
    const qrX = Math.round((cellW - qrPx) / 2);
    const qrY = Math.round((cellH - qrPx) / 2);
    renderQrToCanvas(c, qrData, qrX, qrY, qrPx);
    c.imageSmoothingEnabled = true;
  } else {
    // full — QR 좌측 패딩 + 수직 중앙 정렬
    const qrLeftPx = mmToPx(cell.qrPaddingLeftMm);
    const padPx = mmToPx(cell.textPaddingLeftMm);
    const qrY = Math.round((cellH - qrPx) / 2);
    renderQrToCanvas(c, qrData, qrLeftPx, qrY, qrPx);
    c.imageSmoothingEnabled = true;

    // QR↔텍스트 세로 구분선
    const dividerX = qrLeftPx + qrPx + Math.round(padPx / 2);
    const textX = qrLeftPx + qrPx + padPx;
    const innerPad = mmToPx(cell.tableCellPaddingMm);
    const textMaxW = cellW - textX - innerPad;

    c.strokeStyle = cell.borderColor;
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(dividerX, 0);
    c.lineTo(dividerX, cellH);
    c.stroke();

    // ─── 텍스트 렌더링 파이프라인 (Measure-Draw 두 패스) ─────────────────

    const fieldLabelPx = ptToPx(cell.fieldLabelFontPt);
    const rowGap = mmToPx(cell.rowGapMm);
    const rowH = Math.floor(cellH / 3); // 3행 균등 분할

    // Pass 1 — Spec: 행별 렌더링 설정
    const specs: RowSpec[] = [
      {
        label: cell.tableFieldLabels.mgmtNo,
        value: item.managementNumber,
        valueFontPx: ptToPx(cell.mgmtFontPt),
        minFontPx: ptToPx(cell.mgmtMinFontPt),
        maxLinesCap: 1,
        bold: true,
      },
      {
        label: cell.tableFieldLabels.name,
        value: item.equipmentName,
        valueFontPx: ptToPx(cell.nameFontPt),
        minFontPx: ptToPx(cell.nameMinFontPt),
        maxLinesCap: cell.nameMaxLinesCap,
        bold: false,
      },
      {
        label: cell.tableFieldLabels.serialNo,
        value: item.serialNumber ?? '—',
        valueFontPx: ptToPx(cell.serialFontPt),
        minFontPx: ptToPx(cell.serialMinFontPt),
        maxLinesCap: 1,
        bold: false,
      },
    ];

    // Pass 2 — Measure: 실제 폰트 크기·줄 수 확정 (캔버스 side-effect 없음)
    const measuredRows: RowMeasured[] = specs.map((spec) => {
      const dynamicMaxLines = computeMaxLines({
        rowH,
        fieldLabelPx,
        rowGapPx: rowGap,
        valueMinFontPx: spec.minFontPx,
        lineHeightRatio: cell.lineHeightRatio,
        cap: spec.maxLinesCap,
      });
      const measured = measureValue(c, spec.value, textMaxW, {
        preferredFontPx: spec.valueFontPx,
        minFontPx: spec.minFontPx,
        maxLines: dynamicMaxLines,
        lineHeightRatio: cell.lineHeightRatio,
        bold: spec.bold,
        fontStack: cell.fontStack,
      });
      return { ...spec, measured };
    });

    // Pass 3 — Layout: 실제 측정값 기반 Y 좌표 계산 (topOffset clamp 적용)
    const laidOutRows: RowLaidOut[] = measuredRows.map((row, i) => {
      const rowY = i * rowH;
      const actualRowH = i === specs.length - 1 ? cellH - rowY : rowH;

      const lineH = Math.round(row.measured.fontPxUsed * cell.lineHeightRatio);
      const valueBlockH = row.measured.linesUsed * lineH;
      const contentH = fieldLabelPx + rowGap + valueBlockH;
      const topOffset = Math.max(cell.topOffsetClampMin, Math.round((actualRowH - contentH) / 2));

      const labelY = rowY + topOffset;
      const valueY = labelY + fieldLabelPx + rowGap;

      return { ...row, rowY, actualRowH, labelY, valueY, contentH, topOffset };
    });

    // Pass 4 — Draw: 확정된 좌표에 렌더링
    laidOutRows.forEach((row, i) => {
      // 행 구분선 (첫 행 제외)
      if (i > 0) {
        c.strokeStyle = cell.borderColor;
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(dividerX, row.rowY);
        c.lineTo(cellW, row.rowY);
        c.stroke();
      }

      // 필드명 (label)
      c.font = `${fieldLabelPx}px ${cell.fontStack}`;
      c.fillStyle = cell.fieldLabelColor;
      drawTruncated(c, row.label, textX + innerPad, row.labelY, textMaxW);

      // 필드값 (value) — draw pass
      drawValue(c, row.measured, textX + innerPad, row.valueY, textMaxW, {
        bold: row.bold,
        fontStack: cell.fontStack,
        color: cell.fieldValueColor,
        lineHeightRatio: cell.lineHeightRatio,
      });
    });
  }

  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return blobToDataUrl(blob);
}

/**
 * 현재 PDF 페이지에 절제선(커팅 가이드)을 렌더링.
 *
 * 업계 표준 (Avery 5160 / Brother DK / Zebra ZT):
 *   - 열 사이·행 사이 gutter 중앙에 점선 렌더링
 *   - 페이지 전체 span (0 → pageWidthMm, 0 → pageHeightMm)
 *   - 셀 PNG 이미지 상위 레이어 → 이미지 위에 렌더링되어 가시성 확보
 */
function renderCutLines(doc: jsPDF, widthMm: number, heightMm: number): void {
  const { pdf } = LABEL_CONFIG;
  const { cutLine } = pdf;

  const [r, g, b] = hexToRgb(cutLine.color);

  doc.setLineDashPattern([cutLine.dashMm, cutLine.gapMm], 0);
  doc.setDrawColor(r, g, b);
  doc.setLineWidth(cutLine.lineWidthMm);

  for (let col = 1; col < pdf.cols; col += 1) {
    const x = pdf.marginMm + col * (widthMm + pdf.gutterMm) - pdf.gutterMm / 2;
    doc.line(x, 0, x, pdf.pageHeightMm);
  }

  for (let row = 1; row < pdf.rows; row += 1) {
    const y = pdf.marginMm + row * (heightMm + pdf.gutterMm) - pdf.gutterMm / 2;
    doc.line(0, y, pdf.pageWidthMm, y);
  }

  doc.setLineDashPattern([], 0);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
}

/**
 * 단일 라벨 PDF 생성 — 상세 페이지 개별 인쇄용.
 *
 * A4 좌상단에 선택된 크기로 라벨 1장 배치.
 * 절취선 없음 (단일 라벨 → gutter 개념 없음), 단일 페이지.
 */
async function buildSinglePdf(
  item: LabelItem,
  appUrl: string,
  sizePreset: LabelSizePreset,
  layoutMode: LabelLayoutMode
): Promise<ArrayBuffer> {
  const { pdf } = LABEL_CONFIG;
  const { widthMm, heightMm, qrSizeMm } = LABEL_SIZE_PRESETS[sizePreset];

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: pdf.pageSize });

  const cellCanvas = new OffscreenCanvas(mmToPx(widthMm), mmToPx(heightMm));
  const cellDataUrl = await renderCellToDataUrl(item, appUrl, cellCanvas, {
    widthMm,
    heightMm,
    layoutMode,
    qrSizeMm,
  });
  doc.addImage(cellDataUrl, 'PNG', pdf.marginMm, pdf.marginMm, widthMm, heightMm);

  post({ type: 'progress', done: 1, total: 1 });
  return doc.output('arraybuffer');
}

/**
 * 일괄 인쇄 PDF 생성 — A4 시트 2×6 그리드.
 * 기존 동작 유지 (BulkLabelPrintButton 경로).
 */
async function buildBatchPdf(items: LabelItem[], appUrl: string): Promise<ArrayBuffer> {
  const { pdf } = LABEL_CONFIG;
  const { widthMm, heightMm, perPage } = getLabelCellDimensions();
  const totalPages = Math.ceil(items.length / perPage);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: pdf.pageSize,
  });

  const cellCanvas = new OffscreenCanvas(mmToPx(widthMm), mmToPx(heightMm));

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx += 1) {
    if (pageIdx > 0) doc.addPage();

    const pageStart = pageIdx * perPage;
    const pageEnd = Math.min(pageStart + perPage, items.length);

    for (let i = pageStart; i < pageEnd; i += 1) {
      const onPage = i - pageStart;
      const row = Math.floor(onPage / pdf.cols);
      const col = onPage % pdf.cols;

      const cellX = pdf.marginMm + col * (widthMm + pdf.gutterMm);
      const cellY = pdf.marginMm + row * (heightMm + pdf.gutterMm);

      const cellDataUrl = await renderCellToDataUrl(items[i], appUrl, cellCanvas, {
        widthMm,
        heightMm,
        layoutMode: 'full',
        qrSizeMm: LABEL_CONFIG.cell.qrSizeMm,
      });
      doc.addImage(cellDataUrl, 'PNG', cellX, cellY, widthMm, heightMm);

      if ((i + 1) % 10 === 0 || i === items.length - 1) {
        post({ type: 'progress', done: i + 1, total: items.length });
      }
    }

    renderCutLines(doc, widthMm, heightMm);
  }

  return doc.output('arraybuffer');
}

/**
 * 사이즈 샘플러 PDF 생성 — A4 1페이지에 모든 크기 변형 배치.
 *
 * getSamplerPresetOrder()를 순회하여 각 preset별로:
 *   1. 헤더 텍스트 (메인 스레드에서 주입 — Worker는 i18n-free 유지)
 *   2. rows × cols 라벨 그리드 (renderCellToDataUrl 재사용)
 *   3. 그룹 사이 구분선 + 여백
 *
 * 절취선(renderCutLines) 없음 — 크기별 배치가 다르므로 자유 커팅.
 */
async function buildSamplerPdf(
  item: LabelItem,
  appUrl: string,
  samplerHeaders: Record<LabelSizePreset, string>
): Promise<ArrayBuffer> {
  const { pdf } = LABEL_CONFIG;
  const sampler = LABEL_SAMPLER_CONFIG;
  const presets = getSamplerPresetOrder();

  // 전체 라벨 수 계산 (진행률 기준)
  const totalLabels = presets.reduce((acc, preset) => {
    const { rows, cols } = LABEL_SAMPLER_LAYOUT[preset];
    return acc + rows * cols;
  }, 0);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: pdf.pageSize });

  // jsPDF pt→mm: 1pt = 0.353mm
  const headerFontMm = sampler.headerFontPt * 0.353;

  let currentY = pdf.marginMm;
  let doneCount = 0;

  for (let gi = 0; gi < presets.length; gi += 1) {
    const preset = presets[gi];
    const { widthMm, heightMm, qrSizeMm } = LABEL_SIZE_PRESETS[preset];
    const { rows, cols } = LABEL_SAMPLER_LAYOUT[preset];

    // ─── 그룹 구분선 (첫 그룹 제외) ───────────────────────────────
    if (gi > 0) {
      const [r, g, b] = hexToRgb(sampler.dividerColor);
      doc.setDrawColor(r, g, b);
      doc.setLineWidth(sampler.dividerLineWidthMm);
      doc.setLineDashPattern([], 0);
      doc.line(pdf.marginMm, currentY, pdf.pageWidthMm - pdf.marginMm, currentY);
      currentY += sampler.groupGapMm / 2;
    }

    // ─── 헤더 텍스트 ──────────────────────────────────────────────
    doc.setFontSize(sampler.headerFontPt);
    const [hr, hg, hb] = hexToRgb(sampler.headerColor);
    doc.setTextColor(hr, hg, hb);
    doc.text(samplerHeaders[preset], pdf.marginMm, currentY + headerFontMm);
    currentY += sampler.headerHeightMm;

    // ─── 라벨 그리드 (같은 preset의 canvas 재사용) ──────────────────
    const cellCanvas = new OffscreenCanvas(mmToPx(widthMm), mmToPx(heightMm));

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const cellX = pdf.marginMm + col * (widthMm + sampler.labelGapMm);
        const cellY = currentY + row * (heightMm + sampler.labelGapMm);

        const cellDataUrl = await renderCellToDataUrl(item, appUrl, cellCanvas, {
          widthMm,
          heightMm,
          layoutMode: 'full',
          qrSizeMm,
        });
        doc.addImage(cellDataUrl, 'PNG', cellX, cellY, widthMm, heightMm);

        doneCount += 1;
        post({ type: 'progress', done: doneCount, total: totalLabels });
      }
    }

    currentY += rows * heightMm + (rows - 1) * sampler.labelGapMm;

    // 마지막 그룹이 아니면 그룹 사이 여백 절반 추가 (구분선과 합산)
    if (gi < presets.length - 1) {
      currentY += sampler.groupGapMm / 2;
    }
  }

  // 텍스트 색상 원상복구
  doc.setTextColor(0, 0, 0);

  return doc.output('arraybuffer');
}

ctx.addEventListener('message', async (event: MessageEvent<InboundMessage>) => {
  const { data } = event;
  if (data.type !== 'generate') return;

  try {
    if (!data.appUrl) {
      throw new Error('appUrl is required for QR label generation');
    }
    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new Error('items must be a non-empty array');
    }

    let pdfBytes: ArrayBuffer;

    if (data.mode === 'single') {
      if (!data.sizePreset || !data.layoutMode) {
        throw new Error('sizePreset and layoutMode are required for single mode');
      }
      pdfBytes = await buildSinglePdf(data.items[0], data.appUrl, data.sizePreset, data.layoutMode);
    } else if (data.mode === 'sampler') {
      if (!data.samplerHeaders) {
        throw new Error('samplerHeaders is required for sampler mode');
      }
      pdfBytes = await buildSamplerPdf(data.items[0], data.appUrl, data.samplerHeaders);
    } else {
      if (data.items.length > LABEL_CONFIG.maxBatch) {
        throw new Error(
          `items length ${data.items.length} exceeds LABEL_CONFIG.maxBatch ${LABEL_CONFIG.maxBatch}`
        );
      }
      pdfBytes = await buildBatchPdf(data.items, data.appUrl);
    }

    post({ type: 'done', pdfBytes }, [pdfBytes]);
  } catch (error) {
    post({
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

// TypeScript 모듈 명시를 위한 export
export {};
