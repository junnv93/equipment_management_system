import { retryTransient, isTransientError } from './retry-transient';

describe('isTransientError', () => {
  it.each([
    'Connection terminated unexpectedly',
    'Connection is closed.',
    'ECONNRESET',
    'ETIMEDOUT',
    'Client has encountered a connection error and this instance cannot be reused',
  ])('returns true for transient message: %s', (msg) => {
    expect(isTransientError(new Error(msg))).toBe(true);
  });

  it('returns false for non-error value', () => {
    expect(isTransientError('string')).toBe(false);
    expect(isTransientError(null)).toBe(false);
  });

  it('returns false for non-transient error', () => {
    expect(isTransientError(new Error('Not found'))).toBe(false);
    expect(isTransientError(new Error('Unauthorized'))).toBe(false);
  });
});

describe('retryTransient', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('returns result on first success', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const result = await retryTransient(fn);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on transient error and succeeds on second attempt', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Connection is closed.'))
      .mockResolvedValueOnce('recovered');

    const promise = retryTransient(fn, { delayMs: 50 });
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws immediately on non-transient error without retry', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Validation failed'));

    await expect(retryTransient(fn)).rejects.toThrow('Validation failed');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('throws after all attempts exhausted on persistent transient error', async () => {
    jest.useRealTimers();
    const transientErr = new Error('ECONNRESET');
    const fn = jest.fn().mockRejectedValue(transientErr);

    await expect(retryTransient(fn, { attempts: 3, delayMs: 1 })).rejects.toThrow('ECONNRESET');
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
