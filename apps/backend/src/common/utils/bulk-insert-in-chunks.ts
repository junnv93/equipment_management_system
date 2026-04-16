import { chunkArray } from './chunk-array';
import { BATCH_QUERY_LIMITS } from '@equipment-management/shared-constants';

/**
 * 대량 INSERT를 청크 단위로 실행하는 공용 헬퍼
 *
 * Drizzle의 table union 타입 문제를 피하기 위해 pre-bound insertFn을 받아
 * `unknown as` 캐스팅 없이 타입 안전하게 batch INSERT 실행.
 *
 * @param insertFn - 호출자가 제공하는 타입 안전한 insert 함수 (chunk를 인자로 받음)
 * @param rows - 삽입할 전체 row 배열
 * @param chunkSize - 청크 크기 (기본값: BATCH_QUERY_LIMITS.MIGRATION_CHUNK_SIZE)
 *
 * @example
 * await bulkInsertInChunks(
 *   (chunk) => tx.insert(calibrations).values(chunk as NewCalibration[]),
 *   calibrationValues
 * );
 */
export async function bulkInsertInChunks<T>(
  insertFn: (chunk: T[]) => Promise<unknown>,
  rows: T[],
  chunkSize = BATCH_QUERY_LIMITS.MIGRATION_CHUNK_SIZE
): Promise<void> {
  if (rows.length === 0) return;
  for (const chunk of chunkArray(rows, chunkSize)) {
    await insertFn(chunk);
  }
}
