/**
 * Drizzle Mock 공용 인프라 — SQL-shape 회귀 가드용
 *
 * 기존 서비스 spec들은 `select/from/where/innerJoin` 체인 호출 여부만 식별자 레벨로
 * 추적했다 (CheckoutsService spec 주석 "mock 인프라가 ... 식별자만 추적" 참조).
 * 본 모듈은 그 갭을 메꾼다:
 *
 *   1. 모든 체이너블 메서드의 호출 **인자**를 capture (특히 `where(...)`의 SQL 조건)
 *   2. capture 된 SQL 을 실제 `PgDialect.sqlToQuery()` 로 렌더링해 SQL 문자열 + params 로 검증
 *
 * Drizzle 내부 API(SQL, PgDialect) 를 그대로 사용하므로 Drizzle 업그레이드 시에도
 * 테스트가 자동으로 실제 렌더 로직을 따라간다 — 하드코딩 zero, drift-proof.
 *
 * 사용 예:
 * ```ts
 *   const { drizzle, whereCalls } = createMockDrizzle();
 *   // ... service 생성 및 호출 ...
 *   const rendered = renderSQL(whereCalls[0][0]);
 *   expect(rendered.sql).toContain('"requester_id" =');
 * ```
 */
import { SQL } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';

const dialect = new PgDialect();

export interface MockDrizzleHandle {
  /** NestJS DI 에 주입할 mock drizzle 인스턴스 */
  drizzle: Record<string, jest.Mock> & { query: Record<string, unknown> };
  /** 체인 객체 (mockResolvedValueOnce 등으로 terminal 값 제어 시 사용) */
  chain: Record<string, jest.Mock>;
  /** `.where(...)` 호출 인자 순서대로 기록 — 각 entry 는 `[arg0, arg1, ...]` 배열 */
  whereCalls: unknown[][];
  /** 모든 capture 기록 초기화 */
  reset: () => void;
}

const CHAIN_METHODS = [
  'select',
  'selectDistinct',
  'from',
  'where',
  'limit',
  'offset',
  'orderBy',
  'insert',
  'values',
  'returning',
  'update',
  'set',
  'delete',
  'execute',
  'leftJoin',
  'innerJoin',
  'groupBy',
  'having',
] as const;

/**
 * 체이너블 mock drizzle 인스턴스 생성.
 *
 * - 기본 thenable 은 `[]` resolve (where/orderBy/limit 등 terminal 포인트).
 * - `chain.where` 는 호출 인자를 `whereCalls` 에 append 후 체인 유지.
 * - `transaction(cb)` 는 동일 drizzle 을 tx 로 전달.
 */
export function createMockDrizzle(): MockDrizzleHandle {
  const chain: Record<string, jest.Mock> = {};
  const whereCalls: unknown[][] = [];

  for (const m of CHAIN_METHODS) {
    chain[m] = jest.fn().mockReturnValue(chain);
  }
  // where 는 인자 capture 후 체인 반환
  chain.where = jest.fn((...args: unknown[]) => {
    whereCalls.push(args);
    return chain;
  });
  // thenable: await 시 빈 배열 반환
  (chain as unknown as { then: jest.Mock }).then = jest.fn((resolve: (value: unknown[]) => void) =>
    resolve([])
  );

  const drizzle = {
    select: jest.fn().mockReturnValue(chain),
    selectDistinct: jest.fn().mockReturnValue(chain),
    insert: jest.fn().mockReturnValue(chain),
    update: jest.fn().mockReturnValue(chain),
    delete: jest.fn().mockReturnValue(chain),
    transaction: jest.fn().mockImplementation(async (cb: (tx: unknown) => unknown) => cb(drizzle)),
    // terminal 메서드 passthrough (기존 spec 호환성)
    from: chain.from,
    where: chain.where,
    limit: chain.limit,
    offset: chain.offset,
    orderBy: chain.orderBy,
    values: chain.values,
    returning: chain.returning,
    set: chain.set,
    execute: chain.execute,
    leftJoin: chain.leftJoin,
    innerJoin: chain.innerJoin,
    // Drizzle relational API placeholder — 서비스가 `db.query.checkouts.findMany` 등을
    // 호출할 경우 개별 spec 에서 override
    query: {} as Record<string, unknown>,
  } as unknown as Record<string, jest.Mock> & { query: Record<string, unknown> };

  return {
    drizzle,
    chain,
    whereCalls,
    reset: () => {
      whereCalls.length = 0;
      for (const m of CHAIN_METHODS) {
        chain[m].mockClear();
      }
    },
  };
}

/**
 * Drizzle SQL 객체를 실제 Postgres dialect 로 렌더링.
 *
 * `undefined` 는 필터 부재를 의미 — 호출자가 토론 없이 assert 가능.
 *
 * @throws SQL 인스턴스가 아닌 경우 (테스트 버그 즉시 노출)
 */
export function renderSQL(
  arg: unknown
): { sql: string; params: readonly unknown[] } | { sql: null; params: [] } {
  if (arg === undefined) {
    return { sql: null, params: [] };
  }
  if (!(arg instanceof SQL)) {
    throw new Error(`renderSQL: expected drizzle-orm SQL instance or undefined, got ${typeof arg}`);
  }
  const { sql, params } = dialect.sqlToQuery(arg);
  return { sql, params };
}
