import { Test, TestingModule } from '@nestjs/testing';
import { MigrationValidatorService } from '../services/migration-validator.service';
import type { MappedRow } from '../types/data-migration.types';

/** Drizzle select 체인 mock 빌더 */
const createSelectChain = (finalValue: unknown): Record<string, jest.Mock> => {
  const chain: Record<string, jest.Mock> = {};
  const methods = [
    'select',
    'from',
    'where',
    'leftJoin',
    'innerJoin',
    'orderBy',
    'limit',
    'offset',
    'insert',
    'values',
    'returning',
    'update',
    'set',
  ];
  for (const m of methods) {
    chain[m] = jest.fn().mockReturnValue(chain);
  }
  chain.limit.mockResolvedValue(finalValue);
  chain.returning.mockResolvedValue(finalValue);
  chain.orderBy.mockResolvedValue(finalValue);
  (chain as Record<string, unknown>).then = (resolve: (v: unknown) => void) => resolve(finalValue);
  return chain;
};

function makeMappedRow(rowNumber: number, data: Record<string, unknown>): MappedRow {
  return { rowNumber, mappedData: data, unmappedColumns: [] };
}

const VALID_ROW_DATA = {
  managementNumber: 'SUW-E0001',
  name: '오실로스코프',
  site: 'suwon',
  initialLocation: '시험실 A동',
};

describe('MigrationValidatorService', () => {
  let service: MigrationValidatorService;
  let mockDb: { select: jest.Mock; insert: jest.Mock; update: jest.Mock };
  let chain: ReturnType<typeof createSelectChain>;

  beforeEach(async () => {
    // 기본: 빈 배열 반환 (중복 없음)
    chain = createSelectChain([]);

    mockDb = {
      select: jest.fn().mockReturnValue(chain),
      insert: jest.fn().mockReturnValue(chain),
      update: jest.fn().mockReturnValue(chain),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [MigrationValidatorService, { provide: 'DRIZZLE_INSTANCE', useValue: mockDb }],
    }).compile();

    service = module.get<MigrationValidatorService>(MigrationValidatorService);
  });

  // ─── validateBatch ────────────────────────────────────────────────────────

  describe('validateBatch()', () => {
    it('유효한 행은 valid 상태를 반환한다', async () => {
      const rows = [makeMappedRow(2, VALID_ROW_DATA)];

      const result = await service.validateBatch(rows, {
        autoGenerateManagementNumber: false,
        skipDuplicates: true,
      });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('valid');
      expect(result[0].managementNumber).toBe('SUW-E0001');
    });

    it('DB에 이미 존재하는 관리번호는 duplicate 상태를 반환한다', async () => {
      chain.where.mockResolvedValueOnce([
        { managementNumber: 'SUW-E0001', id: 'eq-existing-uuid' },
      ]);

      const rows = [makeMappedRow(2, VALID_ROW_DATA)];

      const result = await service.validateBatch(rows, {
        autoGenerateManagementNumber: false,
        skipDuplicates: true,
      });

      expect(result[0].status).toBe('duplicate');
      expect(result[0].errors[0].code).toBe('DB_DUPLICATE');
    });

    it('파일 내 중복 관리번호는 두 번째 행이 duplicate가 된다', async () => {
      const rows = [
        makeMappedRow(2, VALID_ROW_DATA),
        makeMappedRow(3, VALID_ROW_DATA), // 동일 관리번호
      ];

      const result = await service.validateBatch(rows, {
        autoGenerateManagementNumber: false,
        skipDuplicates: true,
      });

      expect(result[0].status).toBe('valid');
      expect(result[1].status).toBe('duplicate');
      expect(result[1].errors[0].code).toBe('IN_FILE_DUPLICATE');
    });

    it('defaultSite 옵션을 사용해 site가 없는 행에 사이트를 주입한다', async () => {
      const rowWithoutSite = makeMappedRow(2, { ...VALID_ROW_DATA, site: undefined });

      const result = await service.validateBatch([rowWithoutSite], {
        autoGenerateManagementNumber: false,
        defaultSite: 'UIW',
        skipDuplicates: true,
      });

      expect(result[0].data.site).toBe('UIW');
    });

    it('필수 필드가 없으면 error 상태를 반환한다', async () => {
      const invalidRow = makeMappedRow(2, {
        managementNumber: 'SUW-E0001',
        // name 필수 필드 누락
      });

      const result = await service.validateBatch([invalidRow], {
        autoGenerateManagementNumber: false,
        skipDuplicates: true,
      });

      expect(result[0].status).toBe('error');
      expect(result[0].errors.length).toBeGreaterThan(0);
    });

    it('unmappedColumns가 있는 행은 warning을 포함한다', async () => {
      const rowWithUnmapped: MappedRow = {
        rowNumber: 2,
        mappedData: VALID_ROW_DATA,
        unmappedColumns: ['알수없는컬럼'],
      };

      const result = await service.validateBatch([rowWithUnmapped], {
        autoGenerateManagementNumber: false,
        skipDuplicates: true,
      });

      expect(result[0].status).toBe('warning');
      expect(result[0].warnings.length).toBeGreaterThan(0);
    });

    it('빈 배열 입력 시 빈 배열을 반환한다', async () => {
      const result = await service.validateBatch([], {
        autoGenerateManagementNumber: false,
        skipDuplicates: true,
      });

      expect(result).toHaveLength(0);
    });
  });

  // ─── filterValidRows ──────────────────────────────────────────────────────

  describe('filterValidRows()', () => {
    const PREVIEWS = [
      {
        rowNumber: 2,
        status: 'valid' as const,
        data: {},
        errors: [],
        warnings: [],
        managementNumber: 'A',
      },
      {
        rowNumber: 3,
        status: 'error' as const,
        data: {},
        errors: [],
        warnings: [],
        managementNumber: 'B',
      },
      {
        rowNumber: 4,
        status: 'warning' as const,
        data: {},
        errors: [],
        warnings: [],
        managementNumber: 'C',
      },
      {
        rowNumber: 5,
        status: 'duplicate' as const,
        data: {},
        errors: [],
        warnings: [],
        managementNumber: 'D',
      },
    ];

    it('selectedRowNumbers 미지정 시 valid + warning만 반환한다', () => {
      const result = service.filterValidRows(PREVIEWS);

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.rowNumber)).toEqual([2, 4]);
    });

    it('selectedRowNumbers 지정 시 해당 행 중 valid/warning만 반환한다', () => {
      const result = service.filterValidRows(PREVIEWS, [2, 3, 4]);

      expect(result).toHaveLength(2);
      expect(result.map((r) => r.rowNumber)).toEqual([2, 4]);
    });

    it('selectedRowNumbers에 해당 행이 없으면 빈 배열을 반환한다', () => {
      const result = service.filterValidRows(PREVIEWS, [99]);
      expect(result).toHaveLength(0);
    });
  });
});
