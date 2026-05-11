/**
 * QRAccessService Unit Tests — multi-handover response model (qr-visual-redesign TASK 3).
 *
 * Contract M-24: 동일 borrower 가 2 개 lender_checked checkout 을 가질 때 handovers.length === 2,
 *                둘 다 type='receive'. resolveHandoverActions 가 배열로 정상 동작하는지 검증.
 *
 * DB 는 in-memory mock (drizzle chain stub) — 실제 PG 없이 비즈니스 로직만 검증.
 */
import { Test, type TestingModule } from '@nestjs/testing';
import {
  EquipmentStatusEnum,
  CheckoutStatusEnum,
  CheckoutPurposeEnum,
  ConditionStatusEnum,
} from '@equipment-management/schemas';
import { Permission } from '@equipment-management/shared-constants';
import { QRAccessService } from './qr-access.service';
import type { JwtUser } from '../../../types/auth';

/**
 * Drizzle query builder chain stub — fluent chain 종단부 `.where()` / `.limit()` 등이
 * Promise 를 반환하도록 구성. 각 query 단위 마다 `select()` 가 새 chain 인스턴스를 만들고
 * shared `nextRows()` resolver 가 미리 주입된 row 배열을 순서대로 소진.
 */
function makeDbStub(steps: Array<unknown[]>) {
  let callIndex = 0;
  function nextRows(): unknown[] {
    const rows = steps[callIndex] ?? [];
    callIndex += 1;
    return rows;
  }
  function createChain(): unknown {
    const chain: Record<string, unknown> = {};
    // 모든 메서드는 chain 반환 (Drizzle fluent API) — 종단은 .then thenable 한 곳에서 처리.
    const allMethods = ['from', 'innerJoin', 'leftJoin', 'orderBy', 'limit'];
    for (const m of allMethods) {
      chain[m] = () => chain;
    }
    // where 는 일부 query 에서 종단 (limit/orderBy 없이 await), 일부는 중간 (limit 호출).
    // → thenable + 후속 메서드 둘 다 지원: 객체 자체를 thenable 화.
    chain.where = () => chain;
    chain.then = (
      onFulfilled?: (value: unknown[]) => unknown,
      onRejected?: (reason: unknown) => unknown
    ) => Promise.resolve(nextRows()).then(onFulfilled, onRejected);
    return chain;
  }
  return {
    select: () => createChain(),
  };
}

const userId = 'u-borrower-001';
const lenderTeamId1 = 't-lender-01';
const lenderTeamId2 = 't-lender-02';
const equipmentId = 'eq-001';

const borrowerUser: JwtUser = {
  userId,
  email: 'borrower@test.com',
  roles: ['test_engineer'],
  permissions: [Permission.VIEW_EQUIPMENT],
  site: 'suwon',
};

describe('QRAccessService.resolveAllowedActions — multi-handover', () => {
  let service: QRAccessService;

  async function buildWithDb(dbSteps: Array<unknown[]>) {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QRAccessService, { provide: 'DRIZZLE_INSTANCE', useValue: makeDbStub(dbSteps) }],
    }).compile();
    service = module.get(QRAccessService);
  }

  it('returns 2 handovers when same borrower has 2 lender_checked checkouts', async () => {
    // Step 1: hasActiveCheckoutAsRequester → no active checkout
    // Step 2: resolveHandoverActions main query → 2 rows
    // Step 3: fetchLastConditionCheck (first row, step=lender_checkout) → 1 row
    // Step 4: fetchLastConditionCheck (second row, step=lender_checkout) → 1 row
    await buildWithDb([
      [], // hasActiveCheckoutAsRequester returns []
      [
        {
          checkoutId: 'co-001',
          status: CheckoutStatusEnum.enum.lender_checked,
          requesterId: userId,
          approverId: 'u-lender-mgr-01',
          lenderTeamId: lenderTeamId1,
          destination: '평택랩',
          lenderTeamName: '교정팀 A',
          lenderSite: 'suwon',
          borrowerSite: 'pyeongtaek',
        },
        {
          checkoutId: 'co-002',
          status: CheckoutStatusEnum.enum.lender_checked,
          requesterId: userId,
          approverId: 'u-lender-mgr-02',
          lenderTeamId: lenderTeamId2,
          destination: '평택랩',
          lenderTeamName: '시험팀 B',
          lenderSite: 'uiwang',
          borrowerSite: 'pyeongtaek',
        },
      ],
      // condition check for co-001
      [
        {
          checkedAt: new Date('2026-05-10T09:00:00Z'),
          appearanceStatus: 'normal',
          operationStatus: 'normal',
          accessoriesStatus: 'complete',
          inspectorName: '김검사',
        },
      ],
      // condition check for co-002
      [
        {
          checkedAt: new Date('2026-05-10T11:30:00Z'),
          appearanceStatus: 'abnormal',
          operationStatus: 'normal',
          accessoriesStatus: null,
          inspectorName: '이검사',
        },
      ],
    ]);

    const result = await service.resolveAllowedActions(
      { id: equipmentId, site: 'suwon', status: EquipmentStatusEnum.enum.available },
      borrowerUser
    );

    expect(result.handovers).toBeDefined();
    expect(result.handovers).toHaveLength(2);
    expect(result.handovers?.[0].type).toBe('receive');
    expect(result.handovers?.[1].type).toBe('receive');
    expect(result.handovers?.[0].id).toBe('co-001');
    expect(result.handovers?.[1].id).toBe('co-002');
    expect(result.handovers?.[0].lenderTeamName).toBe('교정팀 A');
    expect(result.handovers?.[1].lenderTeamName).toBe('시험팀 B');
    expect(result.handovers?.[0].lastCheck.appearance).toBe(ConditionStatusEnum.enum.normal);
    expect(result.handovers?.[1].lastCheck.appearance).toBe(ConditionStatusEnum.enum.abnormal);
    expect(result.handovers?.[0].lastCheck.accessories).toBe('complete');
    expect(result.handovers?.[1].lastCheck.accessories).toBeUndefined();
    expect(result.actions).toContain('confirm_handover_receive');
    // Backward-compat: handoverCheckoutId === handovers[0].id
    expect(result.handoverCheckoutId).toBe('co-001');
  });

  it('returns empty handovers when user is neither requester nor approver', async () => {
    await buildWithDb([
      [],
      [
        {
          checkoutId: 'co-001',
          status: CheckoutStatusEnum.enum.lender_checked,
          requesterId: 'someone-else',
          approverId: 'another-user',
          lenderTeamId: lenderTeamId1,
          destination: '평택랩',
          lenderTeamName: '교정팀 A',
          lenderSite: 'suwon',
          borrowerSite: 'pyeongtaek',
        },
      ],
    ]);

    const result = await service.resolveAllowedActions(
      { id: equipmentId, site: 'suwon', status: EquipmentStatusEnum.enum.available },
      borrowerUser
    );

    expect(result.handovers).toBeUndefined();
    expect(result.handoverCheckoutId).toBeUndefined();
    expect(result.actions).not.toContain('confirm_handover_receive');
    expect(result.actions).not.toContain('confirm_handover_return');
  });

  it('returns 1 borrower_returned handover when user is approver(lender)', async () => {
    const lenderApprover: JwtUser = {
      ...borrowerUser,
      userId: 'u-lender-mgr-01',
    };

    await buildWithDb([
      [],
      [
        {
          checkoutId: 'co-003',
          status: CheckoutStatusEnum.enum.borrower_returned,
          requesterId: 'u-borrower-x',
          approverId: 'u-lender-mgr-01',
          lenderTeamId: lenderTeamId1,
          destination: '평택랩',
          lenderTeamName: '교정팀 A',
          lenderSite: 'suwon',
          borrowerSite: 'pyeongtaek',
        },
      ],
      [
        {
          checkedAt: new Date('2026-05-10T15:00:00Z'),
          appearanceStatus: 'normal',
          operationStatus: 'normal',
          accessoriesStatus: 'complete',
          inspectorName: '박검사',
        },
      ],
    ]);

    const result = await service.resolveAllowedActions(
      {
        id: equipmentId,
        site: 'suwon',
        status: EquipmentStatusEnum.enum.checked_out,
      },
      lenderApprover
    );

    expect(result.handovers).toHaveLength(1);
    expect(result.handovers?.[0].type).toBe('return');
    expect(result.handovers?.[0].id).toBe('co-003');
    expect(result.actions).toContain('confirm_handover_return');
  });
});
