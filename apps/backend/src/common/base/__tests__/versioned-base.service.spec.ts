import { ConflictException, NotFoundException } from '@nestjs/common';
import { VersionedBaseService } from '../versioned-base.service';
import type { AppDatabase } from '@equipment-management/db';

/**
 * VersionedBaseService.updateWithVersion CAS + onVersionConflict hook 계약 검증
 *
 * 13개 서브클래스에서 공유하는 SSOT 패턴이므로 다음 invariant 를 보장:
 * 1. 영향 행 1 → 정상 반환
 * 2. 영향 행 0 + 엔티티 없음 → NotFoundException
 * 3. 영향 행 0 + 엔티티 있음 → onVersionConflict 호출 → ConflictException throw
 * 4. onVersionConflict 가 throw 해도 원본 ConflictException 은 그대로 전파 (가리지 않음)
 * 5. 캐시가 없는 도메인 (default no-op) 도 회귀 없이 동작
 */
describe('VersionedBaseService — onVersionConflict hook', () => {
  const ENTITY_ID = '11111111-1111-4111-8111-111111111111';

  // Drizzle update().set().where().returning() 체이닝 mock 빌더
  function buildDb(returnedRows: unknown[], existingRows: unknown[] = []): AppDatabase {
    const updateChain = {
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue(returnedRows),
    };
    const selectChain = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(existingRows),
    };
    return {
      update: jest.fn().mockReturnValue(updateChain),
      select: jest.fn().mockReturnValue(selectChain),
    } as unknown as AppDatabase;
  }

  // Drizzle 테이블 mock — id/version 컬럼 placeholder
  const mockTable = { id: { name: 'id' }, version: { name: 'version' } } as never;

  /** 테스트용 구체 구현 — onVersionConflict spy 주입 */
  class TestService extends VersionedBaseService {
    public hookCalls: string[] = [];
    public hookShouldThrow = false;

    constructor(public readonly db: AppDatabase) {
      super();
    }

    protected async onVersionConflict(id: string): Promise<void> {
      this.hookCalls.push(id);
      if (this.hookShouldThrow) throw new Error('cache invalidation failed');
    }

    // protected → public for testing
    public callUpdate(id: string, version: number): Promise<{ id: string; version: number }> {
      return this.updateWithVersion<{ id: string; version: number }>(
        mockTable,
        id,
        version,
        { status: 'updated' },
        'TestEntity'
      );
    }
  }

  it('성공 경로: 영향 행 1 → onVersionConflict 호출되지 않음', async () => {
    const db = buildDb([{ id: ENTITY_ID, version: 2, status: 'updated' }]);
    const service = new TestService(db);

    const result = await service.callUpdate(ENTITY_ID, 1);

    expect(result).toEqual({ id: ENTITY_ID, version: 2, status: 'updated' });
    expect(service.hookCalls).toEqual([]);
  });

  it('NotFound 경로: 영향 행 0 + 엔티티 없음 → NotFoundException, hook 호출 안 됨', async () => {
    const db = buildDb([], []);
    const service = new TestService(db);

    await expect(service.callUpdate(ENTITY_ID, 1)).rejects.toBeInstanceOf(NotFoundException);
    expect(service.hookCalls).toEqual([]);
  });

  it('409 경로: 영향 행 0 + 엔티티 있음 → onVersionConflict 호출 후 ConflictException', async () => {
    const db = buildDb([], [{ id: ENTITY_ID, version: 5 }]);
    const service = new TestService(db);

    await expect(service.callUpdate(ENTITY_ID, 1)).rejects.toBeInstanceOf(ConflictException);
    expect(service.hookCalls).toEqual([ENTITY_ID]);
  });

  it('hook 실패는 원본 409 를 가리지 않음 (외곽 보호 검증)', async () => {
    const db = buildDb([], [{ id: ENTITY_ID, version: 5 }]);
    const service = new TestService(db);
    service.hookShouldThrow = true;

    await expect(service.callUpdate(ENTITY_ID, 1)).rejects.toBeInstanceOf(ConflictException);
    expect(service.hookCalls).toEqual([ENTITY_ID]);
  });

  it('default no-op: hook override 없이도 정상 동작 (backward compat)', async () => {
    class NoOverrideService extends VersionedBaseService {
      constructor(public readonly db: AppDatabase) {
        super();
      }
      public callUpdate(id: string, version: number): Promise<{ id: string; version: number }> {
        return this.updateWithVersion<{ id: string; version: number }>(
          mockTable,
          id,
          version,
          { status: 'updated' },
          'TestEntity'
        );
      }
    }
    const db = buildDb([], [{ id: ENTITY_ID, version: 5 }]);
    const service = new NoOverrideService(db);

    await expect(service.callUpdate(ENTITY_ID, 1)).rejects.toBeInstanceOf(ConflictException);
  });
});
