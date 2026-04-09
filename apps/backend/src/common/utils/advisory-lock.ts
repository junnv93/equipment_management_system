/**
 * PostgreSQL Advisory Lock 헬퍼 — 트랜잭션 스코프 직렬화 primitive
 *
 * 문제:
 * 동일 리소스에 대해 "조회 → 계산 → 삽입" 시퀀스를 실행하는 동시 요청에서
 * TOCTOU(time-of-check to time-of-use) race condition 이 발생한다.
 * 대표 예: 순차 관리번호 생성(PNNNN, TEMP-XXX-YZZZZ).
 *
 * 기존 접근의 한계:
 * 1. `SELECT ... FOR UPDATE` — 집계 함수(MAX, COUNT)와 호환되지 않는다
 *    (`ERROR: FOR UPDATE is not allowed with aggregate functions`).
 * 2. `LOCK TABLE` — 테이블 전체 읽기/쓰기 차단, 성능 저하 + 데드락 위험.
 * 3. Application-level retry loop — TOCTOU window 여전히 존재 + 성능 저하.
 *
 * 본 헬퍼:
 * `pg_advisory_xact_lock(hashtext(key))` 를 사용하여 논리적 key 기반 직렬화.
 * - 트랜잭션 COMMIT/ROLLBACK 시 자동 해제 → 누수 불가능
 * - 집계 함수와 호환
 * - 동일 key 를 쓰는 다른 트랜잭션만 대기 (다른 리소스는 영향 없음)
 * - 읽기 쿼리는 차단하지 않음
 *
 * SSOT: 순차 번호 생성, 리소스 단위 직렬화가 필요한 모든 곳은 본 헬퍼를 경유한다.
 *
 * @example
 * await this.db.transaction(async (tx) => {
 *   await acquireAdvisoryXactLock(tx, 'test_software:management_number');
 *   const result = await tx.execute(sql`SELECT MAX(...) FROM test_software`);
 *   // ... insert new row with computed number
 * });
 */

import { sql } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';

/**
 * 트랜잭션 스코프 advisory lock 획득.
 *
 * **반드시 transaction 내부(`db.transaction(async (tx) => {...})`)에서 호출해야 한다.**
 * Bare connection 에서 호출 시 `pg_advisory_xact_lock` 은 즉시 해제되어 직렬화 효과가 없다.
 *
 * @param tx - Drizzle 트랜잭션 컨텍스트
 * @param lockKey - 리소스 식별 문자열. 동일 key 를 쓰는 트랜잭션끼리만 직렬화됨.
 *                  컨벤션: `'{table}:{purpose}'` 또는 `'{table}:{purpose}:{scope}'`
 *                  예) `'test_software:management_number'`,
 *                      `'equipment_imports:temp_number:suwon:general_emc'`
 */
export async function acquireAdvisoryXactLock(tx: AppDatabase, lockKey: string): Promise<void> {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`);
}
