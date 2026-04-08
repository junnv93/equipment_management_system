/**
 * Sticky header click helper.
 *
 * 장비 상세 페이지(EquipmentStickyHeader.tsx)는 `position: sticky` 헤더 + 통계 카드를
 * viewport 상단에 고정한다. 이 영역 아래로 스크롤된 요소는 viewport 좌표상 sticky 영역과
 * 겹쳐 Playwright 의 actionability 검사가 "intercepted by another element" 로 실패한다.
 *
 * Frontend 가 이미 `--sticky-header-height` CSS 변수를 ResizeObserver 로 동적 갱신하므로
 * (apps/frontend/components/equipment/EquipmentStickyHeader.tsx 참조), e2e 도 동일 SSOT 를
 * 읽어 sticky 영역 높이만큼 보정 스크롤을 수행한다.
 *
 * - 매직 넘버(예: -80) 사용 금지: 헤더 디자인이 바뀌면 침묵하며 깨진다.
 * - `force: true` 사용 금지: pointer-events 차단을 우회만 하고 a11y/실사용자 결함은 그대로 남는다.
 *
 * @example
 * await clickBelowStickyHeader(page, card.getByRole('button', { name: '수정' }));
 */
import type { Locator, Page } from '@playwright/test';

/** Sticky 영역 아래 추가 여백 (가독성용, 디자인 토큰 의존도 없음) */
const STICKY_CLEARANCE_PX = 12;

/**
 * Sticky header 가 가리지 않도록 element 를 viewport 안으로 정렬한 뒤 일반 click 한다.
 *
 * 1) `scrollIntoViewIfNeeded` 로 일단 viewport 에 진입
 * 2) `--sticky-header-height` CSS 변수를 읽어 element top 이 sticky 아래로 가도록 미세 보정
 * 3) `force` 없이 click — actionability 검사를 정상 통과해야 함
 */
export async function clickBelowStickyHeader(page: Page, locator: Locator): Promise<void> {
  await locator.scrollIntoViewIfNeeded();

  const stickyHeight = await page.evaluate(() => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(
      '--sticky-header-height'
    );
    const parsed = parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  });

  await locator.evaluate(
    (el, { offset, clearance }) => {
      const rect = el.getBoundingClientRect();
      const targetTop = offset + clearance;
      if (rect.top < targetTop) {
        window.scrollBy(0, rect.top - targetTop);
      }
    },
    { offset: stickyHeight, clearance: STICKY_CLEARANCE_PX }
  );

  await locator.click();
}
