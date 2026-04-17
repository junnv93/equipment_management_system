import { LABEL_CONFIG } from '@equipment-management/shared-constants';

/**
 * 라벨 PDF 일괄 생성 요청이 `LABEL_CONFIG.maxBatch`를 초과했을 때 throw.
 *
 * 호출 측(`BulkLabelPrintButton`)은 이 예외를 catch하여 사용자 확인 다이얼로그를 띄우거나
 * 배치 분할을 안내할 수 있다.
 *
 * 메시지 문자열은 i18n (`qr.labelPrint.exceedMaxBatchBody`)로 대체되므로 영어로 고정.
 */
export class LabelBatchExceededError extends Error {
  constructor(
    public readonly requested: number,
    public readonly max: number = LABEL_CONFIG.maxBatch
  ) {
    super(`Label batch size ${requested} exceeds maximum ${max}.`);
    this.name = 'LabelBatchExceededError';
  }
}

export function isLabelBatchExceededError(error: unknown): error is LabelBatchExceededError {
  return error instanceof LabelBatchExceededError;
}
