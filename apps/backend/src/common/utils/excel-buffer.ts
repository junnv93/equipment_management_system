import type ExcelJS from 'exceljs';

/**
 * ExcelJS `Workbook.xlsx.load()` 호환 Buffer 변환 헬퍼 (SSOT).
 *
 * 배경 — `@types/node` 20.19+ vs ExcelJS 4.x 타입 정의 호환성 이슈:
 * - `@types/node` 20.19+ 부터 `Buffer`가 제네릭 `Buffer<TArrayBuffer extends
 *   ArrayBufferLike = ArrayBufferLike>`로 광역화되었다 (DefinitelyTyped #71570).
 * - ExcelJS 4.x의 d.ts (`load(buffer: Buffer, ...)`)가 그 변경 이전에 컴파일된
 *   탓에, `slice(...)[Symbol.toStringTag]` 비교에서 TS2345가 발생한다.
 * - 런타임상 Node.js의 `Buffer`는 항상 `ArrayBuffer`를 백킹으로 사용하므로
 *   변환은 안전하며 복사를 발생시키지 않는다.
 *
 * 본 헬퍼는 호환성 격차를 단일 지점에서 흡수한다 — 모든 ExcelJS 로드 호출은
 * 이 함수를 통과해야 하며, 이로써 변환 규칙·문서화를 SSOT로 강제한다.
 * exceljs 또는 @types/node 가 정렬되면 이 파일만 제거하면 된다.
 *
 * @see https://github.com/DefinitelyTyped/DefinitelyTyped/pull/71570
 */
type ExcelLoadBuffer = Parameters<ExcelJS.Xlsx['load']>[0];

export function toExcelLoadableBuffer(buffer: Buffer): ExcelLoadBuffer {
  // 런타임 Node Buffer는 exceljs가 기대하는 형태와 동일하다.
  // unknown 캐스트로 타입 광역화 격차만 해소한다 (no-op at runtime).
  return buffer as unknown as ExcelLoadBuffer;
}
