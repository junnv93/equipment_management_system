jest.mock('@/lib/utils/approval-count-utils', () => ({
  computeApprovalTotal: jest.fn(() => 0),
}));

import { NAV_SECTIONS } from '../nav-config';

describe('NAV_SECTIONS secondary action i18n keys', () => {
  it('uses registered literal navigation keys for checkout secondary action labels', () => {
    const actions = NAV_SECTIONS.flatMap((section) =>
      section.items.flatMap((item) =>
        item.badge?.kind === 'count-with-action' ? [item.badge.action] : []
      )
    );

    expect(actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          ariaKey: 'layout.checkoutYourTurnAria',
          primaryAriaKey: 'layout.checkoutOpenList',
        }),
      ])
    );
  });
});
