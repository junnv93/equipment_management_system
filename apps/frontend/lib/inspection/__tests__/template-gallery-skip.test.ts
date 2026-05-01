/**
 * template-gallery-skip — Phase 1B-F
 *
 * 시나리오:
 * 1. equipmentTypeId 부재 시 skip false (key 생성 안 됨)
 * 2. mark → isSkipped true
 * 3. clear → isSkipped false
 * 4. inspectionType 별 분리 (intermediate vs self)
 * 5. equipmentTypeId 별 분리 (다른 type은 영향 없음)
 * 6. SSR 환경 (window 부재) — throw 없이 false 반환
 */

import {
  isGallerySkipped,
  markGallerySkipped,
  clearGallerySkipped,
} from '../template-gallery-skip';

beforeEach(() => {
  // 각 테스트 별 localStorage 초기화 (jsdom)
  if (typeof window !== 'undefined') {
    window.localStorage.clear();
  }
});

describe('template-gallery-skip', () => {
  it('returns false when equipmentTypeId is null/undefined', () => {
    expect(isGallerySkipped(null, 'intermediate')).toBe(false);
    expect(isGallerySkipped(undefined, 'intermediate')).toBe(false);
  });

  it('returns true after markGallerySkipped', () => {
    markGallerySkipped('type-1', 'intermediate');
    expect(isGallerySkipped('type-1', 'intermediate')).toBe(true);
  });

  it('returns false after clearGallerySkipped', () => {
    markGallerySkipped('type-1', 'intermediate');
    clearGallerySkipped('type-1', 'intermediate');
    expect(isGallerySkipped('type-1', 'intermediate')).toBe(false);
  });

  it('separates intermediate vs self inspection type', () => {
    markGallerySkipped('type-1', 'intermediate');
    expect(isGallerySkipped('type-1', 'intermediate')).toBe(true);
    expect(isGallerySkipped('type-1', 'self')).toBe(false);
  });

  it('separates different equipmentTypeIds', () => {
    markGallerySkipped('type-1', 'intermediate');
    expect(isGallerySkipped('type-2', 'intermediate')).toBe(false);
  });

  it('handles localStorage throw silently (private browsing)', () => {
    const originalSetItem = window.localStorage.setItem;
    window.localStorage.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    // throw 없이 진행
    expect(() => markGallerySkipped('type-1', 'intermediate')).not.toThrow();
    window.localStorage.setItem = originalSetItem;
  });
});
