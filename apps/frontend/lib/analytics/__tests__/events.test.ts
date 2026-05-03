import { ANALYTICS_EVENTS } from '../events';

describe('ANALYTICS_EVENTS', () => {
  it('registers sidebar events used by production callers', () => {
    expect(ANALYTICS_EVENTS.SIDEBAR_TOGGLE).toBe('sidebar.toggle');
    expect(ANALYTICS_EVENTS.SIDEBAR_CHECKOUTS_CLICK).toBe('sidebar.checkouts.click');
  });

  it('registers inspection-template workflow events from the tech-debt tracker', () => {
    expect(ANALYTICS_EVENTS.INSPECTION_TEMPLATE_CREATED).toBe('inspection_template_created');
    expect(ANALYTICS_EVENTS.INSPECTION_TEMPLATE_VERSIONED).toBe('inspection_template_versioned');
    expect(ANALYTICS_EVENTS.SOFT_FORK_DECIDED).toBe('soft_fork_decided');
    expect(ANALYTICS_EVENTS.GALLERY_USED).toBe('gallery_used');
  });
});
