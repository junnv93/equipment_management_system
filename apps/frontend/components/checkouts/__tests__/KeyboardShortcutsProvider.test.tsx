/**
 * @jest-environment jsdom
 *
 * KeyboardShortcutsProvider — multi-tab storage sync (G-16) 회귀
 *
 * 검증:
 * - 다른 탭에서 SSOT storage key 변경 시 Context 의 overrides 즉시 갱신
 * - 다른 storage key 이벤트는 무시 (same-origin noise filtering)
 * - localStorage.clear() 시뮬레이션 (event.key === null) 도 reload
 * - cleanup 후 listener 미동작
 */

/// <reference types="@testing-library/jest-dom" />

import { act, render, screen } from '@testing-library/react';
import { useContext } from 'react';
import { KeyboardShortcutsProvider } from '../KeyboardShortcutsProvider';
import { KeyboardShortcutsContext } from '@/contexts/KeyboardShortcutsContext';
import { SHORTCUT_OVERRIDES_STORAGE_KEY } from '@/lib/shortcuts/overrides';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// useKeyboardShortcuts 는 keydown listener — 본 spec 스코프 외이므로 mock
jest.mock('@/hooks/use-keyboard-shortcuts', () => ({
  useKeyboardShortcuts: () => undefined,
}));

// Cheatsheet 는 Radix Dialog — 본 spec 스코프 외이므로 mock
jest.mock('@/components/checkouts/KeyboardShortcutsCheatsheet', () => ({
  KeyboardShortcutsCheatsheet: () => null,
}));

function Inspector() {
  const ctx = useContext(KeyboardShortcutsContext);
  return <div data-testid="overrides">{JSON.stringify(ctx.overrides)}</div>;
}

function dispatchStorageEvent(init: {
  key: string | null;
  newValue: string | null;
  storageArea?: Storage | null;
}) {
  const event = new StorageEvent('storage', {
    key: init.key,
    newValue: init.newValue,
    oldValue: null,
    storageArea: init.storageArea === undefined ? window.localStorage : init.storageArea,
  });
  window.dispatchEvent(event);
}

describe('KeyboardShortcutsProvider — multi-tab storage sync (G-16)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('Mount 시 빈 storage → 빈 overrides', () => {
    render(
      <KeyboardShortcutsProvider>
        <Inspector />
      </KeyboardShortcutsProvider>
    );
    expect(screen.getByTestId('overrides').textContent).toBe('{}');
  });

  it('다른 탭이 SSOT storage key 변경 → overrides 즉시 갱신', () => {
    render(
      <KeyboardShortcutsProvider>
        <Inspector />
      </KeyboardShortcutsProvider>
    );

    // 다른 탭에서 localStorage 수정 후 storage event 발화 시뮬레이션
    const payload = JSON.stringify({ APPROVE: 'p', REJECT: 'x' });
    window.localStorage.setItem(SHORTCUT_OVERRIDES_STORAGE_KEY, payload);

    act(() => {
      dispatchStorageEvent({ key: SHORTCUT_OVERRIDES_STORAGE_KEY, newValue: payload });
    });

    expect(JSON.parse(screen.getByTestId('overrides').textContent ?? '{}')).toEqual({
      APPROVE: 'p',
      REJECT: 'x',
    });
  });

  it('다른 storage key 이벤트는 무시', () => {
    render(
      <KeyboardShortcutsProvider>
        <Inspector />
      </KeyboardShortcutsProvider>
    );

    // 무관한 key 만 변경
    const payload = JSON.stringify({ INJECTED: 'z' });
    window.localStorage.setItem(SHORTCUT_OVERRIDES_STORAGE_KEY, payload); // 실제로는 안 깔리지만 가드 검증

    act(() => {
      dispatchStorageEvent({ key: 'other_unrelated_key', newValue: 'value' });
    });

    // event.key 가 매치 안 했으므로 reload 안 됨 — 빈 객체 유지
    expect(screen.getByTestId('overrides').textContent).toBe('{}');
  });

  it('localStorage.clear() (event.key === null) → overrides reload', () => {
    // pre-populate
    window.localStorage.setItem(SHORTCUT_OVERRIDES_STORAGE_KEY, JSON.stringify({ APPROVE: 'p' }));

    render(
      <KeyboardShortcutsProvider>
        <Inspector />
      </KeyboardShortcutsProvider>
    );

    // Mount 후 1회 read 가 sync 로 적용되도록 다음 tick 대기
    // (useEffect 는 render 후 동기 flush in jsdom + testing-library 환경)
    expect(JSON.parse(screen.getByTestId('overrides').textContent ?? '{}')).toEqual({
      APPROVE: 'p',
    });

    // 다른 탭에서 clear()
    window.localStorage.clear();
    act(() => {
      dispatchStorageEvent({ key: null, newValue: null });
    });

    expect(screen.getByTestId('overrides').textContent).toBe('{}');
  });

  it('sessionStorage 영역 이벤트는 무시 (storageArea guard)', () => {
    render(
      <KeyboardShortcutsProvider>
        <Inspector />
      </KeyboardShortcutsProvider>
    );

    const payload = JSON.stringify({ APPROVE: 'p' });
    window.localStorage.setItem(SHORTCUT_OVERRIDES_STORAGE_KEY, payload);

    act(() => {
      dispatchStorageEvent({
        key: SHORTCUT_OVERRIDES_STORAGE_KEY,
        newValue: payload,
        storageArea: window.sessionStorage,
      });
    });

    // sessionStorage 이벤트는 무시되므로 빈 객체 유지
    expect(screen.getByTestId('overrides').textContent).toBe('{}');
  });

  it('Unmount 후 storage event listener 미동작', () => {
    const { unmount } = render(
      <KeyboardShortcutsProvider>
        <Inspector />
      </KeyboardShortcutsProvider>
    );

    unmount();

    // unmount 후 이벤트 발화 — 더 이상 잡힐 곳 없음 (consoleError 없으면 OK)
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const payload = JSON.stringify({ APPROVE: 'p' });
    window.localStorage.setItem(SHORTCUT_OVERRIDES_STORAGE_KEY, payload);

    expect(() => {
      dispatchStorageEvent({ key: SHORTCUT_OVERRIDES_STORAGE_KEY, newValue: payload });
    }).not.toThrow();

    consoleErrorSpy.mockRestore();
  });
});
