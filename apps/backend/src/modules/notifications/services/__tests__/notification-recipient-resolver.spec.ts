import { Test, TestingModule } from '@nestjs/testing';
import { NotificationRecipientResolver } from '../notification-recipient-resolver';
import { Permission } from '@equipment-management/shared-constants';

/**
 * NotificationRecipientResolver 유닛 테스트
 *
 * DB를 모킹하여 roleScopes 로직, 기본 scope 동작, composite 전략을 검증한다.
 * 핵심 검증:
 *   1. roleScopes 없을 때 기존 단일 scope 동작 유지 (하위 호환)
 *   2. roleScopes로 역할별 다른 scope 적용
 *   3. 'skip'으로 특정 역할 제외
 *   4. composite에서 중복 userId 제거
 *   5. actorId 항상 제외
 */

// ── 테스트용 사용자 데이터 ──────────────────────────────────────────────────
const USERS = {
  // 팀 A (SUW 사이트)
  techManagerA: {
    id: 'tm-a-001',
    role: 'technical_manager',
    teamId: 'team-a',
    site: 'SUW',
    isActive: true,
  },
  testEngineerA: {
    id: 'te-a-001',
    role: 'test_engineer',
    teamId: 'team-a',
    site: 'SUW',
    isActive: true,
  },
  labManagerSUW: {
    id: 'lm-suw-001',
    role: 'lab_manager',
    teamId: 'team-lm',
    site: 'SUW',
    isActive: true,
  },
  // 팀 B (SUW 사이트 — 다른 팀)
  techManagerB: {
    id: 'tm-b-001',
    role: 'technical_manager',
    teamId: 'team-b',
    site: 'SUW',
    isActive: true,
  },
  // 팀 C (UIW 사이트)
  techManagerC: {
    id: 'tm-c-001',
    role: 'technical_manager',
    teamId: 'team-c',
    site: 'UIW',
    isActive: true,
  },
  labManagerUIW: {
    id: 'lm-uiw-001',
    role: 'lab_manager',
    teamId: 'team-lm2',
    site: 'UIW',
    isActive: true,
  },
  // 전사 역할
  systemAdmin: { id: 'sa-001', role: 'system_admin', teamId: null, site: 'SUW', isActive: true },
  qualityManager: {
    id: 'qm-001',
    role: 'quality_manager',
    teamId: null,
    site: 'SUW',
    isActive: true,
  },
};

describe('NotificationRecipientResolver', () => {
  let resolver: NotificationRecipientResolver;
  let mockDb: ReturnType<typeof buildDrizzleMock>;

  // Drizzle의 체이닝 API를 흉내 낸 mock — 최종 결과를 __resolvedRows에 설정
  function buildDrizzleMock(rows: { id: string }[]): {
    __resolvedRows: { id: string }[];
    select: jest.Mock;
    from: jest.Mock;
    where: jest.Mock;
  } {
    const mock = {
      __resolvedRows: rows,
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue(rows),
    };
    return mock;
  }

  async function buildResolver(resolvedRows: { id: string }[]): Promise<void> {
    mockDb = buildDrizzleMock(resolvedRows);
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationRecipientResolver, { provide: 'DRIZZLE_INSTANCE', useValue: mockDb }],
    }).compile();
    resolver = module.get<NotificationRecipientResolver>(NotificationRecipientResolver);
  }

  // ── 1. 기본 scope 동작 (roleScopes 없음) ────────────────────────────────

  describe('기본 scope 동작 (roleScopes 없음, 하위 호환)', () => {
    it("scope='team': 같은 팀의 사용자만 반환", async () => {
      // team-a의 technical_manager와 test_engineer만 반환하도록 mock 설정
      await buildResolver([{ id: USERS.techManagerA.id }, { id: USERS.testEngineerA.id }]);

      const result = await resolver.resolve(
        { type: 'permission', permission: Permission.APPROVE_CHECKOUT, scope: 'team' },
        { teamId: 'team-a', site: 'SUW' },
        'actor-000'
      );

      expect(result).toEqual(
        expect.arrayContaining([USERS.techManagerA.id, USERS.testEngineerA.id])
      );
      expect(result).not.toContain(USERS.techManagerB.id);
    });

    it("scope='all': actorId 제외 후 모든 활성 사용자 반환", async () => {
      const allIds = Object.values(USERS).map((u) => ({ id: u.id }));
      await buildResolver(allIds);

      const actorId = USERS.systemAdmin.id;
      const result = await resolver.resolve(
        { type: 'permission', permission: Permission.VIEW_NOTIFICATIONS, scope: 'all' },
        {},
        actorId
      );

      expect(result).not.toContain(actorId);
      expect(result.length).toBe(allIds.length - 1);
    });

    it("scope='team', payload에 teamId 없으면 빈 배열 반환 (안전한 실패)", async () => {
      await buildResolver([]);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await resolver.resolve(
        { type: 'permission', permission: Permission.APPROVE_CHECKOUT, scope: 'team' },
        {}, // teamId 없음
        'actor-000'
      );

      expect(result).toEqual([]);
      consoleSpy.mockRestore();
    });
  });

  // ── 2. roleScopes 오버라이드 ─────────────────────────────────────────────

  describe('roleScopes: 역할별 다른 수신 범위 적용', () => {
    it('technical_manager는 팀 범위, lab_manager는 사이트 범위로 각각 조회', async () => {
      // 첫 번째 where 호출(team scope): techManagerA 반환
      // 두 번째 where 호출(site scope): labManagerSUW 반환
      let callCount = 0;
      const mockDbMultiCall = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) return Promise.resolve([{ id: USERS.techManagerA.id }]);
          if (callCount === 2) return Promise.resolve([{ id: USERS.labManagerSUW.id }]);
          return Promise.resolve([]);
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          NotificationRecipientResolver,
          { provide: 'DRIZZLE_INSTANCE', useValue: mockDbMultiCall },
        ],
      }).compile();
      const r = module.get<NotificationRecipientResolver>(NotificationRecipientResolver);

      // APPROVE_CALIBRATION: technical_manager·lab_manager·system_admin 3개 역할 보유
      // roleScopes 오버라이드: lab_manager→site, system_admin→all, technical_manager→team(기본)
      const result = await r.resolve(
        {
          type: 'permission',
          permission: Permission.APPROVE_CALIBRATION,
          scope: 'team',
          roleScopes: { lab_manager: 'site', system_admin: 'all' },
        },
        { teamId: 'team-a', site: 'SUW' },
        'actor-000'
      );

      // 팀 scope 조회 1회 + 사이트 scope 조회 1회 + 전사 scope 조회 1회 = 3회
      expect(mockDbMultiCall.where).toHaveBeenCalledTimes(3);
      expect(result).toContain(USERS.techManagerA.id);
      expect(result).toContain(USERS.labManagerSUW.id);
    });

    it("roleScopes='skip': 해당 역할은 결과에서 제외", async () => {
      // CALIBRATION_OVERDUE composite 내 permission 전략:
      // technical_manager는 skip (이미 team 전략에서 처리됨)
      let callCount = 0;
      const mockDbSkip = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockImplementation(() => {
          callCount++;
          // technical_manager가 skip이므로 lab_manager + system_admin 2개 scope만 호출
          if (callCount === 1) return Promise.resolve([{ id: USERS.labManagerSUW.id }]);
          if (callCount === 2) return Promise.resolve([{ id: USERS.systemAdmin.id }]);
          return Promise.resolve([]);
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          NotificationRecipientResolver,
          { provide: 'DRIZZLE_INSTANCE', useValue: mockDbSkip },
        ],
      }).compile();
      const r = module.get<NotificationRecipientResolver>(NotificationRecipientResolver);

      await r.resolve(
        {
          type: 'permission',
          permission: Permission.APPROVE_CALIBRATION,
          scope: 'team',
          roleScopes: {
            technical_manager: 'skip',
            lab_manager: 'site',
            system_admin: 'all',
          },
        },
        { teamId: 'team-a', site: 'SUW' },
        'actor-000'
      );

      // technical_manager가 skip이므로 team scope 조회가 발생하지 않아야 함
      // lab_manager(site) + system_admin(all) = 2회만 호출
      expect(mockDbSkip.where).toHaveBeenCalledTimes(2);
    });

    it('roleScopes에서 같은 scope를 가진 역할들은 단일 쿼리로 합산', async () => {
      // lab_manager와 quality_manager가 모두 'site' scope → WHERE role IN (lab_manager, quality_manager)
      await buildResolver([{ id: USERS.labManagerSUW.id }, { id: USERS.qualityManager.id }]);

      const result = await resolver.resolve(
        {
          type: 'permission',
          permission: Permission.VIEW_NOTIFICATIONS,
          scope: 'team',
          roleScopes: {
            lab_manager: 'site',
            quality_manager: 'site', // 같은 scope → 단일 쿼리
          },
        },
        { teamId: 'team-a', site: 'SUW' },
        'actor-000'
      );

      // team scope 1회 + site scope 1회 = 2회 (lab_manager+quality_manager 합쳐서 1회)
      expect(mockDb.where).toHaveBeenCalledTimes(2);
      expect(result).toContain(USERS.labManagerSUW.id);
      expect(result).toContain(USERS.qualityManager.id);
    });

    it('actorId는 항상 결과에서 제외', async () => {
      const actorId = USERS.techManagerA.id;
      await buildResolver([
        { id: actorId }, // actorId가 결과에 포함돼도
        { id: USERS.labManagerSUW.id },
      ]);

      const result = await resolver.resolve(
        {
          type: 'permission',
          permission: Permission.APPROVE_CHECKOUT,
          scope: 'team',
          roleScopes: { lab_manager: 'site' },
        },
        { teamId: 'team-a', site: 'SUW' },
        actorId
      );

      expect(result).not.toContain(actorId); // 제외 확인
      expect(result).toContain(USERS.labManagerSUW.id);
    });

    it('여러 scope에서 같은 userId가 나와도 중복 제거', async () => {
      // systemAdmin이 team scope와 all scope 양쪽에서 조회되는 극단적 케이스
      const mockDbDuplicate = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest
          .fn()
          .mockResolvedValueOnce([{ id: USERS.systemAdmin.id }]) // team scope
          .mockResolvedValueOnce([{ id: USERS.systemAdmin.id }, { id: USERS.labManagerSUW.id }]), // all scope
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          NotificationRecipientResolver,
          { provide: 'DRIZZLE_INSTANCE', useValue: mockDbDuplicate },
        ],
      }).compile();
      const r = module.get<NotificationRecipientResolver>(NotificationRecipientResolver);

      const result = await r.resolve(
        {
          type: 'permission',
          permission: Permission.APPROVE_CHECKOUT,
          scope: 'team',
          roleScopes: { system_admin: 'all' },
        },
        { teamId: 'team-a', site: 'SUW' },
        'actor-000'
      );

      const uniqueIds = new Set(result);
      expect(uniqueIds.size).toBe(result.length); // 중복 없음
      expect(result).toContain(USERS.systemAdmin.id);
      expect(result).toContain(USERS.labManagerSUW.id);
    });
  });

  // ── 3. actor / team 전략 ─────────────────────────────────────────────────

  describe('actor / team 전략', () => {
    it("type='actor': payload 필드의 userId 반환 (actorId 제외)", async () => {
      await buildResolver([]); // actor 전략은 DB 조회 없음

      const result = await resolver.resolve(
        { type: 'actor', field: 'requesterId' },
        { requesterId: 'user-requester-001' },
        'actor-000'
      );

      expect(result).toEqual(['user-requester-001']);
    });

    it("type='actor': actorId와 targetId가 같으면 빈 배열", async () => {
      await buildResolver([]);

      const result = await resolver.resolve(
        { type: 'actor', field: 'requesterId' },
        { requesterId: 'same-user' },
        'same-user'
      );

      expect(result).toEqual([]);
    });

    it("type='team': teamId로 팀원 목록 반환, actorId 제외", async () => {
      const actorId = USERS.testEngineerA.id;
      await buildResolver([{ id: actorId }, { id: USERS.techManagerA.id }]);

      const result = await resolver.resolve(
        { type: 'team', field: 'teamId' },
        { teamId: 'team-a' },
        actorId
      );

      expect(result).not.toContain(actorId);
      expect(result).toContain(USERS.techManagerA.id);
    });
  });

  // ── 4. composite 전략 ────────────────────────────────────────────────────

  describe('composite 전략', () => {
    it('여러 전략 결과를 합산하고 중복 제거', async () => {
      const actorId = 'actor-000';
      // actor 전략 → requesterId 반환, permission 전략 → team members 반환
      const mockDbComposite = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest
          .fn()
          .mockResolvedValue([{ id: USERS.techManagerA.id }, { id: USERS.labManagerSUW.id }]),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          NotificationRecipientResolver,
          { provide: 'DRIZZLE_INSTANCE', useValue: mockDbComposite },
        ],
      }).compile();
      const r = module.get<NotificationRecipientResolver>(NotificationRecipientResolver);

      const result = await r.resolve(
        {
          type: 'composite',
          strategies: [
            { type: 'actor', field: 'requesterId' },
            {
              type: 'permission',
              permission: Permission.APPROVE_CHECKOUT,
              scope: 'team',
              roleScopes: { lab_manager: 'site', system_admin: 'all' },
            },
          ],
        },
        { requesterId: USERS.techManagerA.id, teamId: 'team-a', site: 'SUW' },
        actorId
      );

      // techManagerA가 actor 전략과 permission 전략 양쪽에서 나와도 중복 없음
      const uniqueIds = new Set(result);
      expect(uniqueIds.size).toBe(result.length);
      expect(result).not.toContain(actorId);
    });
  });
});
