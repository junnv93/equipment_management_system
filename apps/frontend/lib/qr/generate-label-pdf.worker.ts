/// <reference lib="webworker" />

/**
 * QR 라벨 PDF 생성 Web Worker.
 *
 * 메인 스레드에서 `new Worker(new URL('./generate-label-pdf.worker.ts', import.meta.url), { type: 'module' })`로
 * 로드한다. 500건(기본 `LABEL_CONFIG.maxBatch`) 생성 시에도 메인 스레드 Long Task 없이 진행률 리포트.
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

async function buildPdf(items: LabelItem[], appUrl: string): Promise<ArrayBuffer> {
  const { pdf, cell } = LABEL_CONFIG;
  const { widthMm, heightMm, perPage } = getLabelCellDimensions();

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: pdf.pageSize,
  });

  doc.setFont(cell.fontFamily);

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

    // QR dataURL
    const qrDataUrl = await QRCode.toDataURL(buildEquipmentQRUrl(item.managementNumber, appUrl), {
      errorCorrectionLevel: QR_CONFIG.errorCorrectionLevel,
      margin: QR_CONFIG.margin,
      scale: QR_CONFIG.scale,
    });

    // QR 왼쪽 정렬
    doc.addImage(qrDataUrl, 'PNG', cellX, cellY, cell.qrSizeMm, cell.qrSizeMm);

    // 텍스트 우측 정렬
    const textX = cellX + cell.qrSizeMm + cell.textPaddingLeftMm;
    const textMaxWidth = widthMm - cell.qrSizeMm - cell.textPaddingLeftMm;

    doc.setFontSize(cell.nameFontPt);
    const nameLines = doc.splitTextToSize(item.equipmentName, textMaxWidth).slice(0, 2);
    doc.text(nameLines, textX, cellY + 4);

    doc.setFontSize(cell.mgmtFontPt);
    doc.setFont(cell.fontFamily, 'bold');
    doc.text(item.managementNumber, textX, cellY + cell.qrSizeMm / 2 + 2);
    doc.setFont(cell.fontFamily, 'normal');

    if (item.subLabel) {
      doc.setFontSize(cell.siteFontPt);
      doc.text(item.subLabel, textX, cellY + cell.qrSizeMm - 2);
    }

    if ((index + 1) % 10 === 0 || index === items.length - 1) {
      post({ type: 'progress', done: index + 1, total: items.length });
    }
  }

  const blob = doc.output('arraybuffer');
  return blob;
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
