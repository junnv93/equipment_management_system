/**
 * Drizzle Query Builder Stub — Unit Test SSOT
 *
 * 백엔드 unit spec 에서 in-memory `select/insert/update` chain 을 mock 하기 위한 단일 헬퍼.
 * (qr-visual-redesign-followups-g4-g12 G-10).
 *
 * **사용 패턴 1 — audit-style (매번 별도 chain, mockReturnValueOnce)**
 * ```ts
 * import { createDrizzleSelectChain, createDrizzleInsertChain } from '../../../common/__tests__/drizzle-stub';
 *
 * const mockDb = {
 *   select: jest.fn(),
 *   insert: jest.fn().mockReturnValue(createDrizzleInsertChain()),
 * };
 *
 * mockDb.select.mockReturnValueOnce(createDrizzleSelectChain(rows1));
 * mockDb.select.mockReturnValueOnce(createDrizzleSelectChain(rows2));
 * ```
 *
 * **사용 패턴 2 — sequential-style (qr-access — db.select() 매번 호출, sequential rows)**
 * ```ts
 * import { createSequentialDrizzleStub } from '../../../common/__tests__/drizzle-stub';
 *
 * const db = createSequentialDrizzleStub([
 *   rowsForFirstSelect,
 *   rowsForSecondSelect,
 *   rowsForThirdSelect,
 * ]);
 * ```
 *
 * 지원되는 fluent chain 메서드 — from / innerJoin / leftJoin / orderBy / groupBy / limit / offset / where.
 * 모든 메서드는 chain 자신을 반환하며, await/`.then` 으로 미리 주입된 rows 를 resolve.
 */

type Resolver<T> = (value: T) => unknown;

/** Drizzle select-style fluent chain (thenable). */
export interface DrizzleSelectChain {
  from: jest.Mock;
  innerJoin: jest.Mock;
  leftJoin: jest.Mock;
  orderBy: jest.Mock;
  groupBy: jest.Mock;
  limit: jest.Mock;
  offset: jest.Mock;
  where: jest.Mock;
  then: jest.Mock;
}

/** Drizzle insert chain (`.values()` 종단). */
export interface DrizzleInsertChain {
  values: jest.Mock;
}

/** Drizzle update chain (`.set().where()` 종단). */
export interface DrizzleUpdateChain {
  set: jest.Mock;
  where: jest.Mock;
}

/**
 * 단일 select chain — thenable + 모든 fluent 메서드가 chain 자신 반환.
 * await/`.then(resolve)` 호출 시 `rows` 가 resolve.
 */
export function createDrizzleSelectChain(rows: unknown[]): DrizzleSelectChain {
  const chain = {} as DrizzleSelectChain;
  const self = (): DrizzleSelectChain => chain;
  chain.from = jest.fn().mockImplementation(self);
  chain.innerJoin = jest.fn().mockImplementation(self);
  chain.leftJoin = jest.fn().mockImplementation(self);
  chain.orderBy = jest.fn().mockImplementation(self);
  chain.groupBy = jest.fn().mockImplementation(self);
  chain.limit = jest.fn().mockImplementation(self);
  chain.offset = jest.fn().mockImplementation(self);
  chain.where = jest.fn().mockImplementation(self);
  chain.then = jest.fn().mockImplementation((resolve: Resolver<unknown[]>) => resolve(rows));
  return chain;
}

/** Insert chain — `.values()` 가 `Promise<undefined>` resolve. */
export function createDrizzleInsertChain(): DrizzleInsertChain {
  return {
    values: jest.fn().mockResolvedValue(undefined),
  };
}

/** Update chain — `.set()` 가 self 반환, `.where()` 가 `Promise<undefined>` resolve. */
export function createDrizzleUpdateChain(): DrizzleUpdateChain {
  return {
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue(undefined),
  };
}

/**
 * Sequential-style stub — `db.select()` 가 매번 새 chain 을 반환하며,
 * 호출 횟수 별로 `steps[i]` 를 순서대로 resolve 하는 select-only mock.
 *
 * qr-access spec 의 multi-step query 패턴(`hasActiveCheckout` → `resolveHandoverActions`
 * → `fetchLastConditionCheck × N`)에 적합.
 */
export function createSequentialDrizzleStub(steps: Array<unknown[]>): {
  select: () => DrizzleSelectChain;
} {
  let callIndex = 0;
  return {
    select: () => {
      const rows = steps[callIndex] ?? [];
      callIndex += 1;
      return createDrizzleSelectChain(rows);
    },
  };
}
