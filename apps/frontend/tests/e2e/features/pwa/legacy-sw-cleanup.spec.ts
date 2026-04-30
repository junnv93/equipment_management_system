/**
 * LegacyServiceWorkerCleanup — PWA 서비스워커 정리 E2E 검증
 *
 * ADR-0006 same-origin 모델 정착 보조. dev 환경에서 마운트 시 1회 모든 등록된 SW를
 * unregister하고 localStorage 플래그(`__legacy_sw_cleaned_v1`)를 설정한다.
 *
 * 설계 노트 (reload 정책):
 *  cleanup 직후 강제 reload 없음 — 사용자가 다음 진입 시 자연스럽게 SW 없는 상태 확보.
 *  ADR-0006 same-origin 모델에서는 fetch 가로채기 자체가 제거 대상이므로 즉시 reload
 *  없이도 다음 네비게이션부터 정상 동작한다.
 *
 * @see apps/frontend/components/pwa/LegacyServiceWorkerCleanup.tsx
 * @see docs/operations/ADR-0006.md (nextauth-csrf-single-origin)
 */

import { test, expect } from '../../shared/fixtures/auth.fixture';

const STORAGE_KEY = '__legacy_sw_cleaned_v1';

test.describe('LegacyServiceWorkerCleanup — 서비스워커 정리', () => {
  test.describe.configure({ mode: 'serial' });

  test('TC-01: 페이지 로드 후 navigator.serviceWorker.getRegistrations() 빈 배열 확인', async ({
    testOperatorPage: page,
  }) => {
    // localStorage 플래그 제거 → 컴포넌트 강제 재실행 (세션당 1회 가드 우회)
    await page.goto('/dashboard');
    await page.evaluate((key) => window.localStorage.removeItem(key), STORAGE_KEY);

    // 리로드 → LegacyServiceWorkerCleanup useEffect 재실행 (async getRegistrations 완료 대기)
    await page.reload();

    // 컴포넌트가 localStorage 플래그를 설정할 때까지 조건 기반 대기
    // (플래그는 getRegistrations → unregister 완료 후 finally에서 설정되므로 cleanup 완료의 증거)
    await page.waitForFunction((key) => window.localStorage.getItem(key) === '1', STORAGE_KEY, {
      timeout: 5000,
    });

    const registrations = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return [];
      const regs = await navigator.serviceWorker.getRegistrations();
      return regs.map((r) => r.scope);
    });

    expect(registrations).toHaveLength(0);
  });

  test('TC-02: 컴포넌트 실행 후 localStorage 플래그(__legacy_sw_cleaned_v1) 설정 확인', async ({
    testOperatorPage: page,
  }) => {
    // TC-01 이후 serial 실행 — 플래그가 설정됐는지 확인
    const flag = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
    expect(flag).toBe('1');
  });

  test('TC-03: 플래그 존재 시 재로드 후에도 SW 없음 유지 (컴포넌트 조기 종료 확인)', async ({
    testOperatorPage: page,
  }) => {
    // TC-02에서 플래그 설정 완료. 재로드해도 컴포넌트는 localStorage 체크 후 조기 종료.
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // 플래그가 여전히 '1' (컴포넌트 재실행 안 됨 = 삭제/변경 없음)
    const flag = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
    expect(flag).toBe('1');

    // SW 없음 — cleanup 이미 완료, 재실행 없어도 유지
    const registrations = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return [];
      const regs = await navigator.serviceWorker.getRegistrations();
      return regs.map((r) => r.scope);
    });
    expect(registrations).toHaveLength(0);
  });
});
