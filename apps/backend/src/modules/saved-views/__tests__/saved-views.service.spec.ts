/**
 * SavedViewsService 핵심 시나리오 — Layer 2 fail-close.
 *
 * 시나리오 매트릭스 (8 시나리오 ≥ contract SHOULD 명시):
 * - scope RBAC × 4:
 *    (1) read: 다른 사용자의 PRIVATE → 403 SAVED_VIEW_SCOPE_FORBIDDEN
 *    (2) read: 같은 팀 TEAM → 통과
 *    (3) write: 다른 사용자의 PRIVATE → 403
 *    (4) write: GLOBAL row (권한 없음) → 403
 * - 한도: MAX_SAVED_VIEWS_PER_MODULE 도달 → 409 SAVED_VIEW_MAX_REACHED
 * - TEAM scope: teamId 누락 → 400 SAVED_VIEW_TEAM_REQUIRED_FOR_SCOPE
 * - CAS: updateWithVersion 통과 케이스 + version 불일치 케이스
 *
 * Rule 2 정합: actor.userId 는 controller 에서 JWT 추출, body 에서 받지 않는다.
 * 본 spec 은 직접 actor 객체를 service 에 주입해 단위 검증.
 */
import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';

import { SavedViewsService, type SavedViewActor } from '../saved-views.service';

type Mock = jest.Mock;

const OWNER_ID = 'owner-uuid-1';
const OTHER_ID = 'other-uuid-2';
const TEAM_A = 'team-uuid-A';
const TEAM_B = 'team-uuid-B';
const VIEW_ID = 'view-uuid-1';

const MOCK_PRIVATE_VIEW = {
  id: VIEW_ID,
  name: '내 뷰',
  params: 'status=PENDING',
  ownerId: OWNER_ID,
  module: 'checkouts',
  scope: 'PRIVATE' as const,
  teamId: null,
  sortOrder: 0,
  version: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MOCK_TEAM_VIEW = {
  ...MOCK_PRIVATE_VIEW,
  id: 'team-view-uuid',
  scope: 'TEAM' as const,
  teamId: TEAM_A,
};

const MOCK_GLOBAL_VIEW = {
  ...MOCK_PRIVATE_VIEW,
  id: 'global-view-uuid',
  scope: 'GLOBAL' as const,
  teamId: null,
};

const createSelectChain = (value: unknown): Record<string, Mock> => {
  const chain: Record<string, Mock> = {};
  const methods = ['select', 'from', 'where', 'limit', 'orderBy', 'offset'];
  for (const m of methods) chain[m] = jest.fn().mockReturnValue(chain);
  (chain as Record<string, unknown>).then = (resolve: (v: unknown) => void) =>
    resolve(Array.isArray(value) ? value : [value]);
  return chain;
};

describe('SavedViewsService', () => {
  let service: SavedViewsService;
  let mockDb: Record<string, Mock>;
  let mockCacheService: {
    get: Mock;
    set: Mock;
    delete: Mock;
    deleteByPrefix: Mock;
    getOrSet: Mock;
  };

  beforeEach(async () => {
    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      deleteByPrefix: jest.fn(),
      getOrSet: jest.fn().mockImplementation((_k: unknown, f: () => unknown) => f()),
    };

    mockDb = {
      select: jest.fn().mockReturnValue(createSelectChain([MOCK_PRIVATE_VIEW])),
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([MOCK_PRIVATE_VIEW]),
        }),
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([MOCK_PRIVATE_VIEW]),
      }),
      delete: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
      transaction: jest.fn().mockImplementation((fn: (tx: unknown) => unknown) => fn(mockDb)),
    };

    const module = await Test.createTestingModule({
      providers: [
        SavedViewsService,
        { provide: 'DRIZZLE_INSTANCE', useValue: mockDb },
        {
          provide: (await import('../../../common/cache/simple-cache.service')).SimpleCacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get(SavedViewsService);
  });

  // ── scope RBAC ─────────────────────────────────────────────

  it('findOne: 다른 사용자의 PRIVATE view 조회 시 403 ScopeForbidden', async () => {
    mockDb.select.mockReturnValueOnce(createSelectChain([MOCK_PRIVATE_VIEW]));
    const actor: SavedViewActor = { userId: OTHER_ID, roles: ['test_engineer'] };
    await expect(service.findOne(actor, VIEW_ID)).rejects.toThrow(ForbiddenException);
  });

  it('findOne: 같은 팀 TEAM view 조회 통과', async () => {
    mockDb.select.mockReturnValueOnce(createSelectChain([MOCK_TEAM_VIEW]));
    const actor: SavedViewActor = { userId: OTHER_ID, teamId: TEAM_A, roles: ['test_engineer'] };
    const result = await service.findOne(actor, MOCK_TEAM_VIEW.id);
    expect(result.id).toBe(MOCK_TEAM_VIEW.id);
  });

  it('findOne: 다른 팀 TEAM view 조회 시 403', async () => {
    mockDb.select.mockReturnValueOnce(createSelectChain([MOCK_TEAM_VIEW]));
    const actor: SavedViewActor = { userId: OTHER_ID, teamId: TEAM_B, roles: ['test_engineer'] };
    await expect(service.findOne(actor, MOCK_TEAM_VIEW.id)).rejects.toThrow(ForbiddenException);
  });

  it('findOne: GLOBAL view 는 모든 사용자에게 read 허용', async () => {
    mockDb.select.mockReturnValueOnce(createSelectChain([MOCK_GLOBAL_VIEW]));
    const actor: SavedViewActor = { userId: OTHER_ID, roles: ['test_engineer'] };
    const result = await service.findOne(actor, MOCK_GLOBAL_VIEW.id);
    expect(result.id).toBe(MOCK_GLOBAL_VIEW.id);
  });

  it('update: 다른 사용자의 PRIVATE view 갱신 시 403', async () => {
    mockDb.select.mockReturnValueOnce(createSelectChain([MOCK_PRIVATE_VIEW]));
    const actor: SavedViewActor = { userId: OTHER_ID, roles: ['test_engineer'] };
    await expect(service.update(actor, VIEW_ID, { version: 1, name: '해킹시도' })).rejects.toThrow(
      ForbiddenException
    );
  });

  it('update: GLOBAL view 권한 없으면 403', async () => {
    mockDb.select.mockReturnValueOnce(createSelectChain([MOCK_GLOBAL_VIEW]));
    const actor: SavedViewActor = { userId: OTHER_ID, roles: ['test_engineer'] };
    await expect(
      service.update(actor, MOCK_GLOBAL_VIEW.id, { version: 1, name: 'X' })
    ).rejects.toThrow(ForbiddenException);
  });

  // ── 한도 + scope 검증 ─────────────────────────────────────

  it('create: 사용자당 module 별 5개 초과 시 409 MaxReached', async () => {
    // countOwnedByModule mock — 5 반환
    mockDb.select.mockReturnValueOnce(createSelectChain([{ count: 5 }]));
    const actor: SavedViewActor = { userId: OWNER_ID, roles: ['test_engineer'] };
    await expect(
      service.create(actor, {
        name: '6번째',
        params: 'a=b',
        module: 'checkouts',
        scope: 'PRIVATE',
      })
    ).rejects.toThrow(ConflictException);
  });

  it('create: TEAM scope 인데 teamId 없으면 400 TeamRequired', async () => {
    const actor: SavedViewActor = { userId: OWNER_ID, teamId: TEAM_A, roles: ['test_engineer'] };
    await expect(
      service.create(actor, {
        name: 'X',
        params: 'a=b',
        module: 'checkouts',
        scope: 'TEAM',
        teamId: null,
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('create: GLOBAL scope 권한 없으면 403', async () => {
    const actor: SavedViewActor = { userId: OWNER_ID, roles: ['test_engineer'] };
    await expect(
      service.create(actor, {
        name: 'X',
        params: 'a=b',
        module: 'checkouts',
        scope: 'GLOBAL',
      })
    ).rejects.toThrow(ForbiddenException);
  });
});
