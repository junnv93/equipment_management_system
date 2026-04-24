/// <reference types="jest" />

/**
 * Sprint 1.1 — getNextStep exhaustive table test
 *
 * 목적:
 * 1. 모든 (status × purpose × role) 조합에서 getNextStep()이 crash 없이 동작함을 보증
 * 2. 각 결과가 NextStepDescriptorSchema Zod 검증을 통과함을 보증
 * 3. DESCRIPTOR_TABLE이 모든 조합을 커버함을 compile-time(satisfies) + runtime 양쪽에서 검증
 * 4. 의도치 않은 FSM 동작 변경을 toMatchSnapshot()으로 포착
 */

import { getNextStep, NextStepDescriptorSchema, CHECKOUT_TRANSITIONS } from '../checkout-fsm';
import { CHECKOUT_STATUS_VALUES, CHECKOUT_PURPOSE_VALUES } from '../../enums/checkout';
import type { CheckoutStatus, CheckoutPurpose } from '../../enums/checkout';
import {
  DESCRIPTOR_TABLE,
  FIXTURE_ROLE_VALUES,
  ROLE_FSM_PERMISSIONS,
  type FixtureUserRole,
} from './fixtures/descriptor-table';

const TOTAL_STATUSES = CHECKOUT_STATUS_VALUES.length;
const TOTAL_PURPOSES = CHECKOUT_PURPOSE_VALUES.length;
const TOTAL_ROLES = FIXTURE_ROLE_VALUES.length;
const EXPECTED_ENTRY_COUNT = TOTAL_STATUSES * TOTAL_PURPOSES * TOTAL_ROLES;

// ============================================================================
// 1. DESCRIPTOR_TABLE 커버리지 검증
// ============================================================================

describe('DESCRIPTOR_TABLE coverage', () => {
  it(`covers all ${EXPECTED_ENTRY_COUNT} (status × purpose × role) combinations`, () => {
    expect(
      CHECKOUT_STATUS_VALUES.length * CHECKOUT_PURPOSE_VALUES.length * FIXTURE_ROLE_VALUES.length
    ).toBe(EXPECTED_ENTRY_COUNT);
    expect(Object.keys(DESCRIPTOR_TABLE).length).toBe(EXPECTED_ENTRY_COUNT);
  });

  it('contains no duplicate keys', () => {
    const keys = Object.keys(DESCRIPTOR_TABLE);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  it('all keys follow `status:purpose:role` format', () => {
    const validStatuses = new Set<string>(CHECKOUT_STATUS_VALUES);
    const validPurposes = new Set<string>(CHECKOUT_PURPOSE_VALUES);
    const validRoles = new Set<string>(FIXTURE_ROLE_VALUES);

    for (const key of Object.keys(DESCRIPTOR_TABLE)) {
      const parts = key.split(':');
      // TableKey = `${status}:${purpose}:${role}` — purpose/role 값 자체에 ':'가 없으므로 3파트
      expect(parts.length).toBe(3);
      const [status, purpose, role] = parts;
      expect(validStatuses.has(status)).toBe(true);
      expect(validPurposes.has(purpose)).toBe(true);
      expect(validRoles.has(role)).toBe(true);
    }
  });
});

// ============================================================================
// 2. Zod schema validation — 모든 조합이 NextStepDescriptorSchema를 통과
// ============================================================================

describe('NextStepDescriptorSchema — all combinations pass', () => {
  for (const status of CHECKOUT_STATUS_VALUES) {
    for (const purpose of CHECKOUT_PURPOSE_VALUES) {
      for (const role of FIXTURE_ROLE_VALUES) {
        it(`${status}:${purpose}:${role}`, () => {
          const result = getNextStep({ status, purpose }, ROLE_FSM_PERMISSIONS[role]);
          const parsed = NextStepDescriptorSchema.safeParse(result);
          expect(parsed.success).toBe(true);
        });
      }
    }
  }
});

// ============================================================================
// 3. Behavioral regression — toMatchSnapshot()으로 FSM 동작 변경 감지
// ============================================================================

describe('getNextStep behavioral regression', () => {
  it('all 280 combinations match snapshot', () => {
    const snapshot: Record<
      string,
      { nextAction: string | null; nextActor: string; availableToCurrentUser: boolean }
    > = {};
    for (const status of CHECKOUT_STATUS_VALUES) {
      for (const purpose of CHECKOUT_PURPOSE_VALUES) {
        for (const role of FIXTURE_ROLE_VALUES) {
          const key = `${status}:${purpose}:${role}`;
          const { nextAction, nextActor, availableToCurrentUser } = getNextStep(
            { status, purpose },
            ROLE_FSM_PERMISSIONS[role]
          );
          snapshot[key] = { nextAction, nextActor, availableToCurrentUser };
        }
      }
    }
    expect(snapshot).toMatchSnapshot();
  });
});

// ============================================================================
// 4. Terminal state invariant — terminal 상태는 모든 purpose·role에서 nextAction=null
// ============================================================================

describe('terminal state invariant', () => {
  const TERMINAL_STATUSES: CheckoutStatus[] = ['rejected', 'canceled', 'return_approved'];
  const TERMINAL_COUNT = TERMINAL_STATUSES.length * TOTAL_PURPOSES * TOTAL_ROLES;

  it(`terminal states produce ${TERMINAL_COUNT} null-action entries`, () => {
    let nullCount = 0;
    for (const status of TERMINAL_STATUSES) {
      for (const purpose of CHECKOUT_PURPOSE_VALUES) {
        for (const role of FIXTURE_ROLE_VALUES) {
          const { nextAction, availableToCurrentUser } = getNextStep(
            { status, purpose },
            ROLE_FSM_PERMISSIONS[role]
          );
          expect(nextAction).toBeNull();
          expect(availableToCurrentUser).toBe(false);
          nullCount++;
        }
      }
    }
    expect(nullCount).toBe(TERMINAL_COUNT);
  });
});

// ============================================================================
// 5. DESCRIPTOR_TABLE 필드 일관성 — fixture와 실행 결과 일치
// ============================================================================

describe('DESCRIPTOR_TABLE matches getNextStep() output', () => {
  for (const [key, expected] of Object.entries(DESCRIPTOR_TABLE)) {
    it(key, () => {
      const parts = key.split(':');
      const status = parts[0] as CheckoutStatus;
      const purpose = parts[1] as CheckoutPurpose;
      const role = parts[2] as FixtureUserRole;

      const actual = getNextStep({ status, purpose }, ROLE_FSM_PERMISSIONS[role]);
      expect(actual.nextAction).toBe(expected.nextAction);
      expect(actual.nextActor).toBe(expected.nextActor);
      expect(actual.availableToCurrentUser).toBe(expected.availableToCurrentUser);
      expect(actual.nextStepIndex).toBe(expected.nextStepIndex);
      expect(actual.phase).toBe(expected.phase);
      expect(actual.phaseIndex).toBe(expected.phaseIndex);
      expect(actual.totalPhases).toBe(expected.totalPhases);
    });
  }
});

// ============================================================================
// 6. Phase field invariants — Sprint 1.2 신규 필드 불변식
// ============================================================================

describe('phase field invariants', () => {
  it('non-rental purpose always has null phase/phaseIndex/totalPhases', () => {
    const nonRentalPurposes: CheckoutPurpose[] = ['calibration', 'repair', 'return_to_vendor'];
    for (const status of CHECKOUT_STATUS_VALUES) {
      for (const purpose of nonRentalPurposes) {
        const result = getNextStep({ status, purpose }, ROLE_FSM_PERMISSIONS.test_engineer);
        expect(result.phase).toBeNull();
        expect(result.phaseIndex).toBeNull();
        expect(result.totalPhases).toBeNull();
      }
    }
  });

  it('rental non-terminal statuses have non-null phase and phaseIndex', () => {
    const TERMINAL_STATUSES: CheckoutStatus[] = ['rejected', 'canceled'];
    const rentalNonTerminal = CHECKOUT_STATUS_VALUES.filter(
      (s) => !TERMINAL_STATUSES.includes(s) && s !== 'checked_out'
    );
    for (const status of rentalNonTerminal) {
      const result = getNextStep({ status, purpose: 'rental' }, ROLE_FSM_PERMISSIONS.test_engineer);
      // return_approved는 terminal이지만 phase='return'을 유지
      if (status === 'return_approved') {
        expect(result.phase).toBe('return');
        expect(result.phaseIndex).toBe(2);
      } else {
        expect(result.phase).not.toBeNull();
        expect(result.phaseIndex).not.toBeNull();
      }
      expect(result.totalPhases).toBe(3);
    }
  });

  it('terminal states have null nextStepIndex', () => {
    const TERMINAL_STATUSES: CheckoutStatus[] = ['rejected', 'canceled', 'return_approved'];
    for (const status of TERMINAL_STATUSES) {
      for (const purpose of CHECKOUT_PURPOSE_VALUES) {
        for (const role of FIXTURE_ROLE_VALUES) {
          const result = getNextStep({ status, purpose }, ROLE_FSM_PERMISSIONS[role]);
          expect(result.nextStepIndex).toBeNull();
        }
      }
    }
  });

  it('non-terminal states have positive nextStepIndex <= totalSteps', () => {
    const TERMINAL_STATUSES = new Set<CheckoutStatus>(['rejected', 'canceled', 'return_approved']);
    for (const status of CHECKOUT_STATUS_VALUES) {
      if (TERMINAL_STATUSES.has(status)) continue;
      for (const purpose of CHECKOUT_PURPOSE_VALUES) {
        const result = getNextStep({ status, purpose }, ROLE_FSM_PERMISSIONS.test_engineer);
        if (result.nextAction !== null) {
          expect(result.nextStepIndex).not.toBeNull();
          expect(result.nextStepIndex!).toBeGreaterThan(0);
          expect(result.nextStepIndex!).toBeLessThanOrEqual(result.totalSteps);
        }
      }
    }
  });

  it('phaseIndex matches phase: approve=0, handover=1, return=2', () => {
    const expected: Record<string, number> = { approve: 0, handover: 1, return: 2 };
    for (const status of CHECKOUT_STATUS_VALUES) {
      const result = getNextStep(
        { status, purpose: 'rental' },
        ROLE_FSM_PERMISSIONS.technical_manager
      );
      if (result.phase !== null) {
        expect(result.phaseIndex).toBe(expected[result.phase]);
      }
    }
  });
});

// ============================================================================
// 7. CHECKOUT_TRANSITIONS module-load 검증 (커버리지 보완)
// ============================================================================

describe('CHECKOUT_TRANSITIONS sanity', () => {
  it('has transitions defined', () => {
    expect(CHECKOUT_TRANSITIONS.length).toBeGreaterThan(0);
  });
});
