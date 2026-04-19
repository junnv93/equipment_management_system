import {
  LABEL_CONFIG,
  type LabelItem,
  type LabelLayoutMode,
  type LabelSizePreset,
} from '@equipment-management/shared-constants';
import { LabelBatchExceededError } from './label-batch-error';

export type {
  LabelItem,
  LabelLayoutMode,
  LabelSizePreset,
} from '@equipment-management/shared-constants';

export interface GenerateLabelPdfOptions {
  items: LabelItem[];
  appUrl: string;
  onProgress?: (done: number, total: number) => void;
  /**
   * 'single': 개별 라벨 1장 (sizePreset + layoutMode 적용).
   * 'batch': A4 시트 2×6 그리드 일괄 (기본값, BulkLabelPrintButton 경로).
   * 'sampler': A4 1페이지에 모든 크기 변형 배치 (items[0]만 사용, samplerHeaders 필수).
   */
  mode?: 'single' | 'batch' | 'sampler';
  /** single 모드에서 사용할 크기 프리셋 */
  sizePreset?: LabelSizePreset;
  /** single 모드에서 사용할 레이아웃 모드 */
  layoutMode?: LabelLayoutMode;
  /**
   * sampler 모드 전용 — preset별 헤더 문자열.
   * 메인 스레드에서 useTranslations()로 빌드 후 Worker에 주입한다.
   * Worker는 next-intl 의존 불가이므로 i18n 책임을 메인 스레드가 담당.
   */
  samplerHeaders?: Record<LabelSizePreset, string>;
}

/**
 * QR 라벨 PDF 생성 — Web Worker 래퍼 Promise API.
 *
 * - 배치 상한 `LABEL_CONFIG.maxBatch` 초과 시 `LabelBatchExceededError` 즉시 throw.
 * - Worker 인스턴스는 Promise 해제 시(성공/실패) 반드시 `terminate()` 호출.
 * - PDF 바이트는 `Transferable ArrayBuffer`로 수신하여 Blob 복사본 없이 즉시 래핑.
 *
 * @throws {LabelBatchExceededError} items 개수가 maxBatch 초과
 * @throws {Error} Worker 로딩/실행 실패, QR/PDF 생성 실패, sampler 모드 samplerHeaders 누락
 */
export async function generateLabelPdf(options: GenerateLabelPdfOptions): Promise<Blob> {
  const {
    items,
    appUrl,
    onProgress,
    mode = 'batch',
    sizePreset,
    layoutMode,
    samplerHeaders,
  } = options;

  if (mode === 'sampler') {
    if (!samplerHeaders) {
      throw new Error('samplerHeaders is required for sampler mode');
    }
  }

  if (items.length > LABEL_CONFIG.maxBatch) {
    throw new LabelBatchExceededError(items.length);
  }

  const worker = new Worker(new URL('./generate-label-pdf.worker.ts', import.meta.url), {
    type: 'module',
  });

  return new Promise<Blob>((resolve, reject) => {
    const cleanup = (): void => {
      worker.terminate();
    };

    worker.onmessage = (event: MessageEvent) => {
      const data = event.data as
        | { type: 'progress'; done: number; total: number }
        | { type: 'done'; pdfBytes: ArrayBuffer }
        | { type: 'error'; message: string };

      if (data.type === 'progress') {
        onProgress?.(data.done, data.total);
        return;
      }
      if (data.type === 'done') {
        const blob = new Blob([data.pdfBytes], { type: 'application/pdf' });
        cleanup();
        resolve(blob);
        return;
      }
      if (data.type === 'error') {
        cleanup();
        reject(new Error(data.message));
      }
    };

    worker.onerror = (event: ErrorEvent) => {
      cleanup();
      reject(new Error(event.message || 'Worker execution failed'));
    };

    worker.postMessage({
      type: 'generate',
      items,
      appUrl,
      mode,
      sizePreset,
      layoutMode,
      samplerHeaders,
    });
  });
}
