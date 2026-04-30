/**
 * track — analytics SSOT 시맨틱 회귀 테스트
 *
 * 핵심 검증:
 * 1. SSR 환경(window undefined)에서 silent no-op
 * 2. CustomEvent('app:analytics') 발행
 * 3. PII 키 거부 (userId/email/role 등)
 */
import { track, type AnalyticsEventDetail } from '../track';

describe('track', () => {
  let dispatched: CustomEvent<AnalyticsEventDetail>[] = [];
  let listener: ((e: Event) => void) | null = null;

  beforeEach(() => {
    dispatched = [];
    listener = (e: Event) => {
      dispatched.push(e as CustomEvent<AnalyticsEventDetail>);
    };
    window.addEventListener('app:analytics', listener);
  });

  afterEach(() => {
    if (listener) window.removeEventListener('app:analytics', listener);
    listener = null;
  });

  it('이벤트 이름과 props를 CustomEvent.detail로 발행한다', () => {
    track('sidebar.toggle', { state: 'collapsed' });

    expect(dispatched).toHaveLength(1);
    expect(dispatched[0].detail.event).toBe('sidebar.toggle');
    expect(dispatched[0].detail.props).toEqual({ state: 'collapsed' });
    expect(typeof dispatched[0].detail.ts).toBe('number');
  });

  it('props 없이도 이벤트를 발행한다', () => {
    track('app.boot');

    expect(dispatched).toHaveLength(1);
    expect(dispatched[0].detail.event).toBe('app.boot');
    expect(dispatched[0].detail.props).toBeUndefined();
  });

  it('PII 키가 포함되면 이벤트를 발행하지 않는다 (userId)', () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    track('checkout.approve', { userId: 'u-123', count: 1 });

    expect(dispatched).toHaveLength(0);
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('PII key "userId"'));
    errSpy.mockRestore();
  });

  it('PII 키가 포함되면 이벤트를 발행하지 않는다 (email)', () => {
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    track('user.signin', { email: 'x@example.com' });

    expect(dispatched).toHaveLength(0);
    errSpy.mockRestore();
  });
});
