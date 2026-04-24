/// <reference types="jest" />

/**
 * Sprint 1.5 — exhaustive satisfies 컴파일 타임 가드 검증
 *
 * @ts-expect-error 디렉티브가 실제 컴파일 에러를 누를 때만 tsc --noEmit PASS.
 * 에러가 없으면 TypeScript가 "Unused '@ts-expect-error' directive"로 실패 →
 * exhaustive guard가 올바르게 동작한다는 증명.
 */

import type { CheckoutStatus, CheckoutPurpose } from '../../enums/checkout';

describe('exhaustive satisfies guards', () => {
  it('statusToStepIndex — 일부 status 누락 시 컴파일 에러 발생 (type-level)', () => {
    // @ts-expect-error — pending 하나만 있으면 Record<CheckoutStatus, number> 불만족
    const incomplete = { pending: 1 } as const satisfies Record<CheckoutStatus, number>;
    // runtime 의미 없음. 컴파일 통과 여부가 이 테스트의 본질.
    expect(incomplete).toBeDefined();
  });

  it('stepCount — 새 purpose 추가 후 매핑 누락 시 컴파일 에러 발생 (type-level)', () => {
    // @ts-expect-error — calibration만 있으면 Record<CheckoutPurpose, number> 불만족
    const incomplete = { calibration: 4 } as const satisfies Record<CheckoutPurpose, number>;
    expect(incomplete).toBeDefined();
  });
});
