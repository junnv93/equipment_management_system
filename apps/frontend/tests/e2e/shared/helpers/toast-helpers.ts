/**
 * Toast assertion helper for shadcn/Radix Toast.
 *
 * Radix `<Toast.Root>` 의 실제 DOM 구조:
 *  1) 시각 토스트 — `<ol data-radix-toast-viewport>` 안에 포털된 `<li data-state="open">`
 *     (사용자가 보는 카드, `role` attribute 없음)
 *  2) Visually-hidden status mirror — `<span role="status" aria-live="assertive">` 로
 *     스크린리더에게 즉시 announce (시각 카드의 형제 노드, li 外부)
 *
 * `[data-radix-toast-viewport] li` 셀렉터로 시각 토스트만 매칭.
 * `toBeVisible()` 이 `data-state` 에 따른 CSS visibility 를 검증하므로
 * 셀렉터에 `[data-state="open"]` 추가 불필요.
 *
 * @example
 * await expectToastVisible(page, '자체점검 기록이 생성되었습니다.');
 */
import { expect, type Page } from '@playwright/test';

const DEFAULT_TIMEOUT_MS = 10_000;

interface ExpectToastOptions {
  timeout?: number;
}

/**
 * 시각 토스트 컨테이너(`li[role="status"]`) 안에서 주어진 텍스트가 보이는지 검증.
 *
 * Radix Toast viewport 는 `<ol>` 컨테이너 안에 각 토스트를 `<li role="status">` 로 렌더
 * 한다. 시각 토스트만 매칭하므로 visually-hidden mirror span 의 strict-mode 충돌을 피한다.
 */
export async function expectToastVisible(
  page: Page,
  text: string | RegExp,
  options: ExpectToastOptions = {}
): Promise<void> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
  const visualToast = toastLocator(page, text).first();
  await expect(visualToast).toBeVisible({ timeout });
}

/**
 * 시각 토스트 컨테이너만을 좁힌 Locator 를 반환한다.
 *
 * `expectToastVisible` 로 충분한 경우엔 그것을 쓰고, 두 후보 토스트를 `.or()` 로 묶어
 * 어느 쪽이든 떠야 한다고 검증할 때만 이 함수를 직접 사용한다 (예: 성공/에러 양분기).
 *
 * @example
 * const success = toastLocator(page, /승인되었습니다/);
 * const error = toastLocator(page, /오류|충돌/);
 * await expect(success.or(error)).toBeVisible({ timeout: 10_000 });
 */
export function toastLocator(page: Page, text: string | RegExp) {
  return page.locator('[data-radix-toast-viewport] li').filter({ hasText: text });
}
