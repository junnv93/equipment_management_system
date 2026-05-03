import { PENDING_HERO_THRESHOLD, selectHeroVariant } from '../checkout-hero-selector';

/**
 * Priority: overdue > pending threshold > no hero.
 */

describe('selectHeroVariant()', () => {
  it('overdue=0, pending=0 → null (정상 상태, hero 미승격)', () => {
    expect(selectHeroVariant({ overdue: 0, pending: 0 })).toEqual({
      heroVariantKey: null,
      reason: null,
    });
  });

  it('overdue=0, pending=10 → null (pending threshold boundary)', () => {
    expect(selectHeroVariant({ overdue: 0, pending: PENDING_HERO_THRESHOLD })).toEqual({
      heroVariantKey: null,
      reason: null,
    });
  });

  it('overdue=0, pending=11 → pending (Phase 5 pending hero 승격)', () => {
    expect(selectHeroVariant({ overdue: 0, pending: PENDING_HERO_THRESHOLD + 1 })).toEqual({
      heroVariantKey: 'pending',
      reason: 'pending',
    });
  });

  it('overdue=1, pending=0 → overdue (단일 임계값 진입)', () => {
    expect(selectHeroVariant({ overdue: 1, pending: 0 })).toEqual({
      heroVariantKey: 'overdue',
      reason: 'overdue',
    });
  });

  it('overdue=10, pending=0 → overdue (다수 케이스)', () => {
    expect(selectHeroVariant({ overdue: 10, pending: 0 })).toEqual({
      heroVariantKey: 'overdue',
      reason: 'overdue',
    });
  });

  it('overdue=1, pending=11 → overdue (overdue 우선순위)', () => {
    expect(selectHeroVariant({ overdue: 1, pending: PENDING_HERO_THRESHOLD + 1 })).toEqual({
      heroVariantKey: 'overdue',
      reason: 'overdue',
    });
  });

  it('순수 함수 — 동일 입력은 동일 출력 + 입력 mutation 없음', () => {
    const summary = { overdue: 3, pending: 7 };
    const snapshot = { ...summary };
    const a = selectHeroVariant(summary);
    const b = selectHeroVariant(summary);
    expect(a).toEqual(b);
    expect(summary).toEqual(snapshot);
  });
});
