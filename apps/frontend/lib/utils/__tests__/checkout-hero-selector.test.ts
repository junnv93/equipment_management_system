import { selectHeroVariant } from '../checkout-hero-selector';

/**
 * Phase 4 boundary: overdue 단일 hero. pending hero 승격은 Phase 5 결정.
 *
 * negative test (case 5): Phase 5에서 pending > threshold → 'pending' 승격 시
 * 본 테스트가 fail해야 정책 변경이 검출된다 (회귀 차단 가드).
 */

describe('selectHeroVariant()', () => {
  it('overdue=0, pending=0 → null (정상 상태, hero 미승격)', () => {
    expect(selectHeroVariant({ overdue: 0, pending: 0 })).toEqual({
      heroVariantKey: null,
      reason: null,
    });
  });

  it('overdue=0, pending=15 → null (Phase 4 boundary — pending hero 미승격)', () => {
    // negative test: Phase 5에서 pending hero 승격 도입 시 본 expect가 fail해야 함
    expect(selectHeroVariant({ overdue: 0, pending: 15 })).toEqual({
      heroVariantKey: null,
      reason: null,
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

  it('overdue=1, pending=15 → overdue (overdue 우선순위)', () => {
    expect(selectHeroVariant({ overdue: 1, pending: 15 })).toEqual({
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
