/**
 * Toast assertion helper for shadcn/Radix Toast.
 *
 * Radix `<Toast.Root>` 는 의도적으로 메시지를 두 번 노출한다:
 *  1) 시각 토스트 — viewport 안의 `<li role="status">` (사용자가 보는 카드)
 *  2) Visually-hidden status mirror — `<span role="status" aria-live="assertive">` 로
 *     스크린리더에게 즉시 announce ("Notification {text}" 접두 포함 가능)
 *
 * 이는 Radix 의 a11y 의도된 동작이며 Toaster 컴포넌트를 건드려 SR mirror 를 제거하면
 * 스크린리더 사용자에게 회귀가 발생한다. 따라서 e2e 는 시각 토스트(`li[role="status"]`)
 * 만 매칭하도록 helper 로 일원화한다.
 *
 * `.first()` 우회를 spec 에 직접 박지 않는 이유: 매칭 대상이 늘어나면 잘못된 토스트를
 * 잡아낼 수 있고, 의도(시각 발화 검증)가 코드에 드러나지 않는다.
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
  return page.locator('li[role="status"]').filter({ hasText: text });
}
