import {
  backfillIntermediate,
  backfillSelf,
  parseBackfillOptions,
} from '../../../../scripts/backfill-inspection-templates';

jest.mock('@equipment-management/db/load-env', () => ({
  loadMonorepoEnv: jest.fn(),
  resolveDatabaseUrl: jest.fn(() => 'postgresql://test:test@localhost:5432/test'),
}));

jest.mock('pg', () => ({
  Pool: jest.fn(),
}));

jest.mock('drizzle-orm/node-postgres', () => ({
  drizzle: jest.fn(),
}));

type QueryValue = unknown[];
type MockDb = {
  select: jest.Mock;
  insert: jest.Mock;
  transaction: jest.Mock;
  insertValues: jest.Mock;
};

function createQuery(value: QueryValue): Record<string, jest.Mock> {
  const chain: Record<string, jest.Mock> = {};
  for (const method of ['from', 'where', 'orderBy', 'limit']) {
    chain[method] = jest.fn().mockReturnValue(chain);
  }
  (chain as Record<string, unknown>).then = (resolve: (value: QueryValue) => void) =>
    resolve(value);
  return chain;
}

function createMockDb(selectResults: QueryValue[], transactionImpl?: jest.Mock): MockDb {
  const insertValues = jest.fn().mockResolvedValue(undefined);
  const insert = jest.fn().mockReturnValue({ values: insertValues });
  return {
    select: jest.fn(() => createQuery(selectResults.shift() ?? [])),
    insert,
    transaction:
      transactionImpl ??
      jest.fn(async (callback: (tx: { insert: typeof insert }) => Promise<void>) =>
        callback({ insert })
      ),
    insertValues,
  };
}

const APPROVED_INTERMEDIATE = {
  id: 'insp-intermediate-1',
  equipmentId: 'equipment-1',
  approvalStatus: 'approved',
  approvedAt: new Date('2026-05-01'),
};

const APPROVED_SELF = {
  id: 'insp-self-1',
  equipmentId: 'equipment-2',
  approvalStatus: 'approved',
  approvedAt: new Date('2026-05-01'),
};

const ITEM = {
  inspectionId: 'insp-1',
  itemNumber: 1,
  checkItem: '온도 확인',
  checkCriteria: '20±2℃',
};

describe('backfill-inspection-templates script helpers', () => {
  it('parses dry-run, type, equipment, and verbose options without reading process argv', () => {
    expect(
      parseBackfillOptions([
        '--dry-run',
        '--type=intermediate',
        '--equipment-id=equipment-1',
        '--verbose',
      ])
    ).toEqual({
      dryRun: true,
      typeFilter: 'intermediate',
      equipmentIdFilter: 'equipment-1',
      verbose: true,
    });
  });

  it('dry-run reports would-create and does not open a transaction', async () => {
    const db = createMockDb([[APPROVED_INTERMEDIATE], [], [ITEM], []]);

    const result = await backfillIntermediate(db as never, {
      dryRun: true,
      typeFilter: null,
      equipmentIdFilter: null,
      verbose: false,
    });

    expect(result).toEqual([
      expect.objectContaining({
        inspectionType: 'intermediate',
        equipmentId: 'equipment-1',
        inspectionId: 'insp-intermediate-1',
        status: 'created',
        reason: '[dry-run] would create',
      }),
    ]);
    expect(db.transaction).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('skips an equipment/type pair when a current template already exists', async () => {
    const db = createMockDb([[APPROVED_INTERMEDIATE], [{ id: 'template-1' }]]);

    const result = await backfillIntermediate(db as never, {
      dryRun: false,
      typeFilter: null,
      equipmentIdFilter: null,
      verbose: false,
    });

    expect(result).toEqual([
      expect.objectContaining({
        status: 'skipped',
        reason: 'template already exists',
      }),
    ]);
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it('reports failed when template insert transaction rejects', async () => {
    const db = createMockDb(
      [[APPROVED_SELF], [], [ITEM], []],
      jest.fn(async () => {
        throw new Error('rollback sentinel');
      })
    );

    const result = await backfillSelf(db as never, {
      dryRun: false,
      typeFilter: null,
      equipmentIdFilter: null,
      verbose: false,
    });

    expect(result).toEqual([
      expect.objectContaining({
        inspectionType: 'self',
        equipmentId: 'equipment-2',
        inspectionId: 'insp-self-1',
        status: 'failed',
        reason: 'rollback sentinel',
      }),
    ]);
    expect(db.transaction).toHaveBeenCalledTimes(1);
  });
});
