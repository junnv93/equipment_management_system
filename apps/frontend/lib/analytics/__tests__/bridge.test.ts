import { installAnalyticsBridge } from '../bridge';
import { track } from '../track';

describe('analytics bridge', () => {
  afterEach(() => {
    delete (window as typeof window & { gtag?: unknown }).gtag;
    delete (window as typeof window & { dataLayer?: unknown }).dataLayer;
  });

  it('forwards app analytics events to gtag when available', () => {
    const gtag = jest.fn();
    (window as typeof window & { gtag: typeof gtag }).gtag = gtag;

    const cleanup = installAnalyticsBridge(window);
    track('sidebar.toggle', { state: 'collapsed' });
    cleanup();

    expect(gtag).toHaveBeenCalledWith(
      'event',
      'sidebar.toggle',
      expect.objectContaining({ state: 'collapsed', app_event_ts: expect.any(Number) })
    );
  });

  it('pushes app analytics events to dataLayer when available', () => {
    const dataLayer: Record<string, unknown>[] = [];
    (window as typeof window & { dataLayer: typeof dataLayer }).dataLayer = dataLayer;

    const cleanup = installAnalyticsBridge(window);
    track('sidebar.checkouts.click', { pendingCount: 3 });
    cleanup();

    expect(dataLayer).toEqual([
      expect.objectContaining({
        event: 'app.analytics',
        appEvent: 'sidebar.checkouts.click',
        appEventTs: expect.any(Number),
        appEventProps: { pendingCount: 3 },
      }),
    ]);
  });

  it('is a no-op when no analytics sink exists', () => {
    const cleanup = installAnalyticsBridge(window);

    expect(() => track('app.boot')).not.toThrow();
    cleanup();
  });

  it('removes the listener on cleanup', () => {
    const gtag = jest.fn();
    (window as typeof window & { gtag: typeof gtag }).gtag = gtag;

    const cleanup = installAnalyticsBridge(window);
    cleanup();
    track('sidebar.toggle');

    expect(gtag).not.toHaveBeenCalled();
  });
});
