import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TeamsService } from '../teams.service';

/** Drizzle ORM 체인 메서드를 흉내내는 mock 빌더 */
const createDrizzleChain = (finalValue: unknown): Record<string, jest.Mock> => {
  const chain: Record<string, jest.Mock> = {};
  const methods = [
    'select',
    'from',
    'where',
    'groupBy',
    'orderBy',
    'leftJoin',
    'insert',
    'values',
    'returning',
    'update',
    'set',
    'delete',
  ];
  for (const m of methods) {
    chain[m] = jest.fn().mockReturnValue(chain);
  }
  // 마지막 체인 메서드(orderBy, returning 등)에서 실제 값 반환
  chain.orderBy.mockResolvedValue(finalValue);
  chain.returning.mockResolvedValue(finalValue);
  // chain 자체를 thenable로 만들어 groupBy()가 마지막 호출인 findOne을 지원
  // await chain.groupBy() → chain 반환 → await chain → chain.then(resolve) → finalValue
  (chain as Record<string, unknown>).then = (resolve: (v: unknown) => void) => resolve(finalValue);
  return chain;
};

describe('TeamsService', () => {
  let service: TeamsService;

  const MOCK_TEAM_ROW = {
    id: 'team-uuid-1',
    name: 'FCC EMC/RF',
    classification: 'fcc_emc_rf',
    site: 'suwon',
    classificationCode: 'FCC',
    description: null,
    leaderId: 'user-uuid-1',
    memberCount: 5,
    equipmentCount: 29,
    leaderName: '김팀장',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  let mockDb: {
    select: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    query: {
      teams: { findFirst: jest.Mock };
    };
  };
  let chain: ReturnType<typeof createDrizzleChain>;

  beforeEach(async () => {
    chain = createDrizzleChain([MOCK_TEAM_ROW]);

    mockDb = {
      select: jest.fn().mockReturnValue(chain),
      insert: jest.fn().mockReturnValue(chain),
      update: jest.fn().mockReturnValue(chain),
      delete: jest.fn().mockReturnValue(chain),
      query: {
        teams: { findFirst: jest.fn().mockResolvedValue(null) },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TeamsService, { provide: 'DRIZZLE_INSTANCE', useValue: mockDb }],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
  });

  describe('findAll()', () => {
    it('기본 쿼리로 팀 목록과 페이지네이션 정보를 반환한다', async () => {
      const result = await service.findAll({ page: 1, pageSize: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('팀 항목에 memberCount와 equipmentCount가 포함된다 (JOIN 패턴 검증)', async () => {
      const result = await service.findAll({});

      const team = result.items[0];
      expect(team.memberCount).toBe(5);
      expect(team.equipmentCount).toBe(29);
    });

    it('빈 결과에서 total이 0이어야 한다', async () => {
      chain.orderBy.mockResolvedValue([]);

      const result = await service.findAll({});

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('페이지네이션이 올바르게 적용된다', async () => {
      const rows = Array.from({ length: 25 }, (_, i) => ({ ...MOCK_TEAM_ROW, id: `team-${i}` }));
      chain.orderBy.mockResolvedValue(rows);

      const result = await service.findAll({ page: 2, pageSize: 10 });

      expect(result.items).toHaveLength(10);
      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(3);
      expect(result.page).toBe(2);
    });

    it('팀 leaderName이 리더가 없으면 undefined이어야 한다', async () => {
      chain.orderBy.mockResolvedValue([{ ...MOCK_TEAM_ROW, leaderId: null, leaderName: null }]);

      const result = await service.findAll({});

      expect(result.items[0].leaderId).toBeUndefined();
      // leaderName은 toTeam()이 as Team 캐스트로 추가하는 런타임 필드
      expect((result.items[0] as unknown as { leaderName?: string }).leaderName).toBeUndefined();
    });
  });

  describe('findOne()', () => {
    it('존재하는 팀 ID로 팀 정보를 반환한다', async () => {
      const result = await service.findOne('team-uuid-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('team-uuid-1');
      expect(result?.memberCount).toBe(5);
    });

    it('존재하지 않는 팀 ID에 대해 null을 반환한다', async () => {
      chain.orderBy.mockResolvedValue([]);
      // findOne은 select().from()...orderBy()를 사용하므로 체인 마지막이 groupBy → 재설정
      chain.groupBy.mockResolvedValue([]);

      const result = await service.findOne('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('create()', () => {
    it('같은 사이트 내 중복 이름 팀을 생성하면 BadRequestException을 던진다', async () => {
      mockDb.query.teams.findFirst.mockResolvedValue({ id: 'existing-team' });

      await expect(
        service.create({
          name: 'FCC EMC/RF',
          classification: 'fcc_emc_rf',
          site: 'suwon',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('중복이 없으면 팀을 생성하고 반환한다', async () => {
      mockDb.query.teams.findFirst.mockResolvedValue(null);
      chain.returning.mockResolvedValue([{ ...MOCK_TEAM_ROW, id: 'new-team-id' }]);
      // findOne 내부 select 체인도 작동하도록
      chain.groupBy.mockResolvedValue([{ ...MOCK_TEAM_ROW, id: 'new-team-id' }]);

      const result = await service.create({
        name: 'New Team',
        classification: 'general_emc',
        site: 'suwon',
      });

      expect(result.memberCount).toBe(5);
    });
  });

  describe('remove()', () => {
    it('존재하는 팀을 삭제하면 true를 반환한다', async () => {
      // delete().where().returning()이 결과 배열 반환
      const deleteChain = { where: jest.fn(), returning: jest.fn() };
      mockDb.delete.mockReturnValue(deleteChain);
      deleteChain.where.mockReturnValue(deleteChain);
      deleteChain.returning.mockResolvedValue([{ id: 'team-uuid-1' }]);

      const result = await service.remove('team-uuid-1');

      expect(result).toBe(true);
    });

    it('존재하지 않는 팀 삭제 시 false를 반환한다', async () => {
      const deleteChain = { where: jest.fn(), returning: jest.fn() };
      mockDb.delete.mockReturnValue(deleteChain);
      deleteChain.where.mockReturnValue(deleteChain);
      deleteChain.returning.mockResolvedValue([]);

      const result = await service.remove('non-existent');

      expect(result).toBe(false);
    });
  });
});
