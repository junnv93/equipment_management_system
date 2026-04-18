/// <reference lib="webworker" />

/**
 * QR 라벨 PDF 생성 Web Worker.
 *
 * 렌더링 전략:
 *   각 라벨 셀을 OffscreenCanvas로 완전 렌더링(QR + 테이블)한 뒤 PNG로 변환하여 jsPDF에 삽입.
 *   jsPDF는 페이지 레이아웃(여백·페이지 추가·이미지 배치)만 담당.
 *   텍스트 렌더링은 브라우저 CJK 폰트 스택에 위임 → 한국어 깨짐 없음.
 *
 * 셀 레이아웃:
 *   ┌─────────────────────────────────────────┐
 *   │         │ 관리번호 │ SUW-E0001          │
 *   │  [QR]   │─────────┼────────────────────│
 *   │  25×25mm│ 장비명   │ 오실로스코프       │
 *   │         │─────────┼────────────────────│
 *   │         │ 일련번호 │ SN-12345           │
 *   └─────────────────────────────────────────┘
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
  getLabelCellDimensions,
  buildEquipmentQRUrl,
  type LabelItem,
} from '@equipment-management/shared-constants';

type InboundMessage = {
  type: 'generate';
  items: LabelItem[];
  appUrl: string;
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
 * QR 모듈 매트릭스를 OffscreenCanvas 2D context에 직접 렌더링.
 *
 * `qrcode` 라이브러리의 `toCanvas`/`toDataURL`은 내부적으로
 * `document.createElement('canvas')` fallback에 도달해 Web Worker에서
 * "You need to specify a canvas element" 에러를 유발한다.
 * 유일한 DOM-free 공개 API인 `QRCode.create()`가 반환한 BitMatrix를
 * 직접 렌더링하여 이 의존성을 제거한다.
 * (업계 표준: Zebra ZPL·Brother raster SDK·Seagull BarTender 모두
 *  QR 계산과 픽셀 렌더링을 분리하여 실행 환경 독립성을 확보)
 */
function renderQrToCanvas(
  ctx: OffscreenCanvasRenderingContext2D,
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

  ctx.fillStyle = cell.qrBackgroundColor;
  ctx.fillRect(x, y, sizePx, sizePx);

  ctx.fillStyle = cell.qrForegroundColor;
  for (let r = 0; r < size; r += 1) {
    for (let col = 0; col < size; col += 1) {
      if (data[r * size + col] !== 0) {
        const mx = x + (col + quietZone) * modulePx;
        const my = y + (r + quietZone) * modulePx;
        ctx.fillRect(mx, my, modulePx + overlap, modulePx + overlap);
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
  // 문자 단위 이진 탐색보다 선형이 단순하고 라벨 텍스트는 짧으므로 충분
  let truncated = text;
  while (truncated.length > 0 && c.measureText(truncated + '…').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  c.fillText(truncated + '…', x, y);
}

/**
 * 업계 표준 3단계 auto-fit 파이프라인으로 값 텍스트를 렌더링.
 *
 * Brother P-touch / Avery DesignPro / Seagull BarTender / Zebra 공통 방식:
 *   Step 1. preferredFontPx로 측정 → 맞으면 그대로 그림
 *   Step 2. 1px씩 줄여 minFontPx까지 시도 → shrink-to-fit
 *   Step 3. maxLines > 1이면 줄바꿈 시도
 *            - 한국어(CJK): 문자 단위 wrap (어절 경계 없음)
 *            - 영숫자: 공백 단위 word-wrap → 줄 내 char-wrap fallback
 *   Step 4. 최종적으로도 초과 → drawTruncated("…")
 *
 * @returns 실제로 사용된 { linesUsed, fontPxUsed } — 수직 센터링 재계산에 사용
 */
function renderValueWithAutoFit(
  c: OffscreenCanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  opts: {
    preferredFontPx: number;
    minFontPx: number;
    maxLines: number;
    lineHeightRatio: number;
    bold: boolean;
    fontStack: string;
    color: string;
  }
): { linesUsed: number; fontPxUsed: number } {
  const { preferredFontPx, minFontPx, bold, fontStack, color, lineHeightRatio, maxLines } = opts;
  const prefix = bold ? 'bold ' : '';

  const setFont = (px: number): void => {
    c.font = `${prefix}${px}px ${fontStack}`;
  };

  // ── Step 1 & 2: 폰트 축소 시도 ─────────────────────────────
  let fontPx = preferredFontPx;
  setFont(fontPx);

  while (fontPx > minFontPx && c.measureText(text).width > maxWidth) {
    fontPx -= 1;
    setFont(fontPx);
  }

  // 단일 줄로 맞으면 바로 그림
  if (c.measureText(text).width <= maxWidth) {
    c.fillStyle = color;
    c.fillText(text, x, startY);
    return { linesUsed: 1, fontPxUsed: fontPx };
  }

  // ── Step 3: 줄바꿈 (maxLines > 1인 경우) ──────────────────
  if (maxLines > 1) {
    const lines = splitIntoLines(c, text, maxWidth, maxLines);
    const lineH = Math.round(fontPx * lineHeightRatio);
    c.fillStyle = color;
    lines.forEach((line, i) => {
      drawTruncated(c, line, x, startY + i * lineH, maxWidth);
    });
    return { linesUsed: lines.length, fontPxUsed: fontPx };
  }

  // ── Step 4: 말줄임 fallback ────────────────────────────────
  c.fillStyle = color;
  drawTruncated(c, text, x, startY, maxWidth);
  return { linesUsed: 1, fontPxUsed: fontPx };
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
      (cp >= 0x1100 && cp <= 0x11ff) || // 한글 자모
      (cp >= 0x3130 && cp <= 0x318f) || // 호환 자모
      (cp >= 0xac00 && cp <= 0xd7af) || // 한글 완성형
      (cp >= 0x4e00 && cp <= 0x9fff) || // CJK 통합 한자
      (cp >= 0x3000 && cp <= 0x303f) // CJK 기호·구두점
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
      // Word-wrap: 공백 단위로 역방향 탐색
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

    // CJK 또는 word-wrap이 실패한 경우: char-wrap
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

/**
 * 라벨 셀 1개를 OffscreenCanvas로 렌더링하여 PNG data URL 반환.
 *
 * 구조:
 *   - 좌측: QR 코드 (셀 높이 방향 수직 정렬)
 *   - 우측: 관리번호·장비명·일련번호 3행 테이블 (행 높이 균등 분할, 텍스트 수직 센터링)
 *   - 셀·행 사이 구분선 (LABEL_CONFIG.cell.borderColor)
 *   - 텍스트는 maxWidth 초과 시 "…"로 잘림 → 겹침 없음
 */
async function renderCellToDataUrl(item: LabelItem, appUrl: string): Promise<string> {
  const { cell } = LABEL_CONFIG;
  const { widthMm, heightMm } = getLabelCellDimensions();

  const cellW = mmToPx(widthMm);
  const cellH = mmToPx(heightMm);
  const qrPx = mmToPx(cell.qrSizeMm);
  const padPx = mmToPx(cell.textPaddingLeftMm);

  // 텍스트 영역 시작 X 및 내부 여백
  const textX = qrPx + padPx;
  const innerPad = mmToPx(cell.tableCellPaddingMm);
  const textMaxW = cellW - textX - innerPad;

  const canvas = new OffscreenCanvas(cellW, cellH);
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

  // ─── QR 코드 (수직 중앙 정렬) ────────────────────────────────
  const qrData = QRCode.create(buildEquipmentQRUrl(item.managementNumber, appUrl), {
    errorCorrectionLevel: QR_CONFIG.errorCorrectionLevel,
  });
  const qrY = Math.round((cellH - qrPx) / 2);
  c.imageSmoothingEnabled = false; // QR은 이진 이미지 — 스무딩 비활성화로 선명도 유지
  renderQrToCanvas(c, qrData, 0, qrY, qrPx);
  c.imageSmoothingEnabled = true;

  // ─── QR↔텍스트 세로 구분선 ──────────────────────────────────
  const dividerX = qrPx + Math.round(padPx / 2);
  c.strokeStyle = cell.borderColor;
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(dividerX, 0);
  c.lineTo(dividerX, cellH);
  c.stroke();

  // ─── 테이블 행 렌더링 ────────────────────────────────────────
  const fieldLabelPx = ptToPx(cell.fieldLabelFontPt);
  const rowGap = mmToPx(cell.rowGapMm);

  // minFontPx·maxLines는 SSOT(LABEL_CONFIG.cell)에서 직접 참조 — 하드코딩 금지
  const rows = [
    {
      label: cell.tableFieldLabels.mgmtNo,
      value: item.managementNumber,
      valueFontPx: ptToPx(cell.mgmtFontPt),
      minFontPx: ptToPx(cell.mgmtMinFontPt),
      maxLines: 1,
      bold: true,
    },
    {
      label: cell.tableFieldLabels.name,
      value: item.equipmentName,
      valueFontPx: ptToPx(cell.nameFontPt),
      minFontPx: ptToPx(cell.nameMinFontPt),
      maxLines: cell.nameMaxLines,
      bold: false,
    },
    {
      label: cell.tableFieldLabels.serialNo,
      value: item.serialNumber ?? '—',
      valueFontPx: ptToPx(cell.serialFontPt),
      minFontPx: ptToPx(cell.serialMinFontPt),
      maxLines: 1,
      bold: false,
    },
  ];

  const rowH = Math.floor(cellH / rows.length);

  rows.forEach((row, i) => {
    const rowY = i * rowH;
    // 마지막 행은 floor() 나머지 픽셀을 흡수
    const actualRowH = i === rows.length - 1 ? cellH - rowY : rowH;

    // 행 구분선 (첫 행 제외)
    if (i > 0) {
      c.strokeStyle = cell.borderColor;
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(dividerX, rowY);
      c.lineTo(cellW, rowY);
      c.stroke();
    }

    // 행 내 텍스트 수직 센터링 — preferred 폰트 크기 기준 (물리 라벨은 px-perfect 불필요)
    const contentH = fieldLabelPx + rowGap + row.valueFontPx;
    const topOffset = Math.round((actualRowH - contentH) / 2);

    const labelY = rowY + topOffset;
    const valueY = labelY + fieldLabelPx + rowGap;

    // 필드명 (소문자 회색) — 필드명은 짧아 shrink 불필요, truncate만 적용
    c.font = `${fieldLabelPx}px ${cell.fontStack}`;
    c.fillStyle = cell.fieldLabelColor;
    drawTruncated(c, row.label, textX + innerPad, labelY, textMaxW);

    // 값 — 업계 표준 3단계 auto-fit: shrink-to-fit → wrap → truncate
    renderValueWithAutoFit(c, row.value, textX + innerPad, valueY, textMaxW, {
      preferredFontPx: row.valueFontPx,
      minFontPx: row.minFontPx,
      maxLines: row.maxLines,
      lineHeightRatio: cell.lineHeightRatio,
      bold: row.bold,
      fontStack: cell.fontStack,
      color: cell.fieldValueColor,
    });
  });

  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return blobToDataUrl(blob);
}

async function buildPdf(items: LabelItem[], appUrl: string): Promise<ArrayBuffer> {
  const { pdf } = LABEL_CONFIG;
  const { widthMm, heightMm, perPage } = getLabelCellDimensions();

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: pdf.pageSize,
  });

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const onPage = index % perPage;
    const row = Math.floor(onPage / pdf.cols);
    const col = onPage % pdf.cols;

    if (index > 0 && onPage === 0) {
      doc.addPage();
    }

    const cellX = pdf.marginMm + col * (widthMm + pdf.gutterMm);
    const cellY = pdf.marginMm + row * (heightMm + pdf.gutterMm);

    const cellDataUrl = await renderCellToDataUrl(item, appUrl);
    doc.addImage(cellDataUrl, 'PNG', cellX, cellY, widthMm, heightMm);

    if ((index + 1) % 10 === 0 || index === items.length - 1) {
      post({ type: 'progress', done: index + 1, total: items.length });
    }
  }

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
    if (data.items.length > LABEL_CONFIG.maxBatch) {
      throw new Error(
        `items length ${data.items.length} exceeds LABEL_CONFIG.maxBatch ${LABEL_CONFIG.maxBatch}`
      );
    }

    const pdfBytes = await buildPdf(data.items, data.appUrl);
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
