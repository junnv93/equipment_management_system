import { recordFsmMetaDrift } from '../fsm-meta-drift';
import { reportError } from '@/lib/error-reporter';

jest.mock('@/lib/error-reporter', () => ({
  reportError: jest.fn(),
}));

const mockedReportError = jest.mocked(reportError);

function setNodeEnv(value: string): void {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value,
    configurable: true,
  });
}

describe('recordFsmMetaDrift', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    mockedReportError.mockClear();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    delete (globalThis as { Sentry?: unknown }).Sentry;
  });

  afterEach(() => {
    warnSpy.mockRestore();
    setNodeEnv(originalNodeEnv);
    delete (globalThis as { Sentry?: unknown }).Sentry;
  });

  it('keeps the development signal local to console.warn', () => {
    setNodeEnv('development');

    recordFsmMetaDrift({ checkoutId: 'checkout-1', endpoint: 'list', reason: 'meta_missing' });

    expect(warnSpy).toHaveBeenCalledWith('[FSM drift] meta missing', 'checkout-1');
    expect(mockedReportError).not.toHaveBeenCalled();
  });

  it('reports production drift to client monitoring', () => {
    setNodeEnv('production');

    recordFsmMetaDrift({ checkoutId: 'checkout-2', endpoint: 'detail', reason: 'meta_missing' });

    expect(warnSpy).not.toHaveBeenCalled();
    expect(mockedReportError).toHaveBeenCalledWith(expect.any(Error), {
      page: 'checkouts',
      action: 'fsm_meta_drift',
      severity: 'warning',
      extra: { checkoutId: 'checkout-2', endpoint: 'detail', reason: 'meta_missing' },
    });
  });

  it('adds a Sentry breadcrumb when the runtime exposes Sentry', () => {
    const addBreadcrumb = jest.fn();
    (globalThis as { Sentry?: unknown }).Sentry = { addBreadcrumb };
    setNodeEnv('production');

    recordFsmMetaDrift({ checkoutId: 'checkout-3', endpoint: 'list', reason: 'meta_missing' });

    expect(addBreadcrumb).toHaveBeenCalledWith({
      category: 'fsm',
      message: 'meta missing',
      level: 'warning',
      data: { checkoutId: 'checkout-3', endpoint: 'list', reason: 'meta_missing' },
    });
  });
});
