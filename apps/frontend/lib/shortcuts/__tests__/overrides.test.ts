/**
 * @jest-environment jsdom
 */

import {
  SHORTCUT_OVERRIDES_STORAGE_KEY,
  MAX_OVERRIDE_KEYS,
  loadShortcutOverrides,
  saveShortcutOverrides,
  resetShortcutOverrides,
  isValidOverrideKey,
} from '../overrides';

describe('shortcut overrides — localStorage SSOT', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('loadShortcutOverrides — 빈 storage에서 빈 객체 반환', () => {
    expect(loadShortcutOverrides()).toEqual({});
  });

  it('saveShortcutOverrides → loadShortcutOverrides round-trip', () => {
    saveShortcutOverrides({ APPROVE: 'p', REJECT: 'x' });
    expect(loadShortcutOverrides()).toEqual({ APPROVE: 'p', REJECT: 'x' });
  });

  it('손상된 JSON은 빈 객체로 fail-close', () => {
    window.localStorage.setItem(SHORTCUT_OVERRIDES_STORAGE_KEY, '{"this is not valid');
    expect(loadShortcutOverrides()).toEqual({});
  });

  it('잘못된 타입(배열/non-object) 무시', () => {
    window.localStorage.setItem(SHORTCUT_OVERRIDES_STORAGE_KEY, '[1,2,3]');
    expect(loadShortcutOverrides()).toEqual({});
    window.localStorage.setItem(SHORTCUT_OVERRIDES_STORAGE_KEY, '"string"');
    expect(loadShortcutOverrides()).toEqual({});
  });

  it('비-string value는 sanitize에서 제거', () => {
    window.localStorage.setItem(
      SHORTCUT_OVERRIDES_STORAGE_KEY,
      JSON.stringify({ APPROVE: 123, REJECT: 'x' })
    );
    expect(loadShortcutOverrides()).toEqual({ REJECT: 'x' });
  });

  it('isValidOverrideKey — 1글자 또는 명명 키 허용', () => {
    expect(isValidOverrideKey('a')).toBe(true);
    expect(isValidOverrideKey('Z')).toBe(true);
    expect(isValidOverrideKey('?')).toBe(true);
    expect(isValidOverrideKey('Enter')).toBe(true);
    expect(isValidOverrideKey('Escape')).toBe(true);
    expect(isValidOverrideKey('')).toBe(false);
    expect(isValidOverrideKey('ab')).toBe(false);
    expect(isValidOverrideKey('F1')).toBe(false);
  });

  it('MAX_OVERRIDE_KEYS 초과 시 앞쪽 N개만 유지', () => {
    const huge: Record<string, string> = {};
    for (let i = 0; i < MAX_OVERRIDE_KEYS + 5; i++) {
      huge[`KEY_${i}`] = String.fromCharCode(97 + (i % 26));
    }
    saveShortcutOverrides(huge as Parameters<typeof saveShortcutOverrides>[0]);
    expect(Object.keys(loadShortcutOverrides()).length).toBe(MAX_OVERRIDE_KEYS);
  });

  it('resetShortcutOverrides — storage 항목 제거', () => {
    saveShortcutOverrides({ APPROVE: 'p' });
    resetShortcutOverrides();
    expect(window.localStorage.getItem(SHORTCUT_OVERRIDES_STORAGE_KEY)).toBeNull();
    expect(loadShortcutOverrides()).toEqual({});
  });
});
