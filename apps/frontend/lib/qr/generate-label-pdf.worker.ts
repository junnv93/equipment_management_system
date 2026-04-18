/// <reference lib="webworker" />

/**
 * QR 라벨 PDF 생성 Web Worker.
 *
 * 메인 스레드에서 `new Worker(new URL('./generate-label-pdf.worker.ts', import.meta.url), { type: 'module' })`로
 * 로드한다. 500건(기본 `LABEL_CONFIG.maxBatch`) 생성 시에도 메인 스레드 Long Task 없이 진행률 리포트.
 *
 * 렌더링 전략:
 *   - 각 라벨 셀을 OffscreenCanvas로 완전 렌더링(QR + 텍스트)한 뒤 PNG로 변환하여 jsPDF에 삽입.
 *   - jsPDF는 페이지 레이아웃(여백·페이지 추가·이미지 배치)만 담당.
 *   - 텍스트 렌더링은 브라우저 CJK 폰트 스택에 위임 → 한국어 깨짐 없음.
 *
 * 메시지 프로토콜:
 *   main → worker: `{ type: 'generate', items, appUrl }`
 *   worker → main: `{ type: 'progress', done, total }` | `{ type: 'done', pdfBytes }` | `{ type: 'error', message }`
 */

import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import {
  QR_CONFIG,
  LABEL_CONFIG,
  getLabelCellDimensions,
  buildEquipmentQRUrl,
} from '@equipment-management/shared-constants';

export interface LabelItem {
  managementNumber: string;
  equipmentName: string;
  subLabel?: string;
}

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
 * 텍스트를 maxWidth 픽셀 이내로 줄 바꿈.
 * 한국어는 어절 단위 아닌 문자 단위로 분리해야 하므로 character-by-character 방식 사용.
 */
function wrapText(c: OffscreenCanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const char of text) {
    const candidate = current + char;
    if (c.measureText(candidate).width > maxWidth) {
      if (current) lines.push(current);
      current = char;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * 라벨 셀 1개를 OffscreenCanvas로 렌더링하여 PNG data URL 반환.
 * QR 코드 + 텍스트를 브라우저 CJK 폰트 스택으로 한 캔버스에 합성.
 */
async function renderCellToDataUrl(item: LabelItem, appUrl: string): Promise<string> {
  const { cell } = LABEL_CONFIG;
  const { widthMm, heightMm } = getLabelCellDimensions();

  const cellW = mmToPx(widthMm);
  const cellH = mmToPx(heightMm);
  const qrPx = mmToPx(cell.qrSizeMm);
  const padPx = mmToPx(cell.textPaddingLeftMm);

  const canvas = new OffscreenCanvas(cellW, cellH);
  const c = canvas.getContext('2d');
  if (!c) throw new Error('OffscreenCanvas 2D context unavailable');

  // 흰 배경
  c.fillStyle = '#ffffff';
  c.fillRect(0, 0, cellW, cellH);

  // QR 코드 — OffscreenCanvas에 직접 렌더링 후 셀 캔버스에 합성
  const qrCanvas = new OffscreenCanvas(1, 1);
  await (QRCode.toCanvas as (canvas: unknown, text: string, options: object) => Promise<void>)(
    qrCanvas,
    buildEquipmentQRUrl(item.managementNumber, appUrl),
    {
      errorCorrectionLevel: QR_CONFIG.errorCorrectionLevel,
      margin: QR_CONFIG.margin,
      scale: QR_CONFIG.scale,
    }
  );
  c.drawImage(qrCanvas, 0, 0, qrPx, qrPx);

  // 텍스트 영역 (QR 우측)
  const textX = qrPx + padPx;
  const textMaxW = cellW - textX;
  c.fillStyle = '#000000';

  // 장비명 (nameFontPt, 최대 2줄)
  const namePx = ptToPx(cell.nameFontPt);
  c.font = `${namePx}px ${cell.fontStack}`;
  const nameLines = wrapText(c, item.equipmentName, textMaxW).slice(0, 2);
  nameLines.forEach((line, i) => {
    c.fillText(line, textX, mmToPx(4) + namePx * (i + 1));
  });

  // 관리번호 (mgmtFontPt, bold)
  const mgmtPx = ptToPx(cell.mgmtFontPt);
  c.font = `bold ${mgmtPx}px ${cell.fontStack}`;
  c.fillText(item.managementNumber, textX, mmToPx(cell.qrSizeMm / 2 + 2));

  // 사이트·팀 (siteFontPt)
  if (item.subLabel) {
    const sitePx = ptToPx(cell.siteFontPt);
    c.font = `${sitePx}px ${cell.fontStack}`;
    c.fillText(item.subLabel, textX, mmToPx(cell.qrSizeMm - 2));
  }

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
