const TRANSIENT_PATTERN =
  /Connection terminated|Connection is closed|ECONNRESET|ETIMEDOUT|Client has encountered a connection error/i;

export function isTransientError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return TRANSIENT_PATTERN.test(err.message);
}

/**
 * Transient 연결 에러 발생 시 자동 재시도.
 * PG pool eviction / Redis 소켓 끊김 같은 일시적 에러에만 재시도하고,
 * 비즈니스 로직 에러(HttpException, 유효성 오류)는 즉시 re-throw.
 */
export async function retryTransient<T>(
  fn: () => Promise<T>,
  opts: { attempts?: number; delayMs?: number } = {}
): Promise<T> {
  const { attempts = 2, delayMs = 50 } = opts;
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isTransientError(err) || i === attempts - 1) throw err;
      await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastErr;
}
