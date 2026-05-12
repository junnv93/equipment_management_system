import {
  CACHE_EVENTS,
  CACHE_EVENT_LEGACY_NAMING_ALLOWLIST,
  CACHE_TO_NOTIFICATION_DOMAIN_SYNONYM,
} from '../cache-events';
import { NOTIFICATION_EVENTS } from '../../../modules/notifications/events/notification-events';
import {
  CACHE_INVALIDATION_REGISTRY,
  CACHE_INVALIDATION_WHOLESALE_LEGACY_ALLOWLIST,
} from '../cache-event.registry';
import { validateDualChannelExclusivity } from '../cache-event-listener';

/**
 * CACHE_EVENTS 명명 규약 강제 (ADR-0012 정합).
 *
 * 신규 entry는 반드시 `cache.<domain>.<verb...>` 형식이어야 한다.
 * historical 키는 CACHE_EVENT_LEGACY_NAMING_ALLOWLIST에 명시되어야 통과.
 *
 * 이 spec이 신규 entry 도입 시 자동 FAIL해서 회귀를 차단한다.
 */
describe('CACHE_EVENTS 명명 규약 (ADR-0012)', () => {
  const CACHE_EVENT_PATTERN = /^cache\.[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)+$/;

  it('CACHE_EVENTS의 모든 값은 `cache.<domain>.<verb>` 형식이거나 LEGACY allowlist에 등재되어 있다', () => {
    const violations: string[] = [];
    for (const [key, value] of Object.entries(CACHE_EVENTS)) {
      if (CACHE_EVENT_LEGACY_NAMING_ALLOWLIST.has(value)) continue;
      if (!CACHE_EVENT_PATTERN.test(value)) {
        violations.push(`  ${key} = '${value}'`);
      }
    }
    if (violations.length > 0) {
      throw new Error(
        `[CACHE_EVENTS naming convention] 위반 ${violations.length}건:\n${violations.join('\n')}\n\n` +
          `해결: ADR-0012 — 신규 entry는 \`cache.<domainCamel>.<verbCamel>\` 형식을 따르거나 ` +
          `LEGACY 키는 cache-events.ts CACHE_EVENT_LEGACY_NAMING_ALLOWLIST에 등재.`
      );
    }
  });

  it('LEGACY allowlist의 모든 값은 실제 CACHE_EVENTS에 등재되어 있다 (dead allowlist 방지)', () => {
    const cacheEventValues = new Set<string>(Object.values(CACHE_EVENTS));
    const orphans: string[] = [];
    for (const legacy of CACHE_EVENT_LEGACY_NAMING_ALLOWLIST) {
      if (!cacheEventValues.has(legacy)) orphans.push(legacy);
    }
    expect(orphans).toEqual([]);
  });

  it('CACHE_EVENTS와 NOTIFICATION_EVENTS는 동일 문자열 값을 공유하지 않는다 (채널 명확성)', () => {
    const notificationValues = new Set<string>(Object.values(NOTIFICATION_EVENTS));
    const collisions: string[] = [];
    for (const value of Object.values(CACHE_EVENTS)) {
      if (notificationValues.has(value)) collisions.push(value);
    }
    expect(collisions).toEqual([]);
  });

  it('synonym map의 키는 CACHE_EVENTS 어딘가에서 실제 domain segment로 사용되고 있다 (dead synonym 방지)', () => {
    const usedDomains = new Set<string>();
    for (const value of Object.values(CACHE_EVENTS)) {
      if (!value.startsWith('cache.')) continue;
      const stripped = value.slice('cache.'.length);
      const dotIdx = stripped.indexOf('.');
      if (dotIdx < 0) continue;
      usedDomains.add(stripped.slice(0, dotIdx));
    }
    const orphanSynonyms: string[] = [];
    for (const cacheDomain of Object.keys(CACHE_TO_NOTIFICATION_DOMAIN_SYNONYM)) {
      if (!usedDomains.has(cacheDomain)) orphanSynonyms.push(cacheDomain);
    }
    expect(orphanSynonyms).toEqual([]);
  });

  it('synonym map의 값은 NOTIFICATION_EVENTS에서 실제 domain segment로 사용되고 있다', () => {
    const usedDomains = new Set<string>();
    for (const value of Object.values(NOTIFICATION_EVENTS)) {
      const dotIdx = value.indexOf('.');
      if (dotIdx < 0) continue;
      usedDomains.add(value.slice(0, dotIdx));
    }
    const orphanTargets: string[] = [];
    for (const notiDomain of Object.values(CACHE_TO_NOTIFICATION_DOMAIN_SYNONYM)) {
      if (!usedDomains.has(notiDomain)) orphanTargets.push(notiDomain);
    }
    expect(orphanTargets).toEqual([]);
  });

  /**
   * 라운드 #3 갭 O: wholesale `${PREFIX}*` 패턴 차단 (ADR-0012 §Decision-2).
   *
   * 신규 entry는 specific sub-prefix로 분해. historical wholesale은
   * CACHE_INVALIDATION_WHOLESALE_LEGACY_ALLOWLIST 등재 시 통과 (점진 마이그레이션).
   */
  it('wholesale `${PREFIX}*` 패턴은 LEGACY allowlist에 등재된 경우만 허용', () => {
    const violations: Array<{ event: string; pattern: string }> = [];
    for (const [eventKey, rule] of Object.entries(CACHE_INVALIDATION_REGISTRY)) {
      for (const { pattern } of rule.patterns ?? []) {
        const segments = pattern.split(':');
        const isWholesale = segments.length === 2 && segments[1] === '*';
        if (!isWholesale) continue;
        // wholesale entry — registry entry key namespace 추론
        // CACHE_EVENTS는 'cache.' prefix, NOTIFICATION_EVENTS는 그 외
        const namespace = eventKey.startsWith('cache.') ? 'CACHE_EVENTS' : 'NOTIFICATION_EVENTS';
        // event key 이름은 인덱스로 reverse lookup
        let enumKey: string | undefined;
        const lookup: Record<string, string> =
          namespace === 'CACHE_EVENTS' ? CACHE_EVENTS : NOTIFICATION_EVENTS;
        for (const [k, v] of Object.entries(lookup)) {
          if (v === eventKey) {
            enumKey = k;
            break;
          }
        }
        if (!enumKey) continue;
        const allowlistKey = `${namespace}.${enumKey}`;
        if (!CACHE_INVALIDATION_WHOLESALE_LEGACY_ALLOWLIST.has(allowlistKey)) {
          violations.push({ event: allowlistKey, pattern });
        }
      }
    }
    if (violations.length > 0) {
      const detail = violations.map((v) => `  - ${v.event}: '${v.pattern}'`).join('\n');
      throw new Error(
        `[wholesale pattern] ADR-0012 §Decision-2 위반 ${violations.length}건 (LEGACY allowlist 미등재):\n${detail}\n\n` +
          `해결: specific sub-prefix(list:* / pending:* / detail:*)로 분해 또는 ` +
          `CACHE_INVALIDATION_WHOLESALE_LEGACY_ALLOWLIST 등재 (review 필수).`
      );
    }
  });

  /**
   * 라운드 #3 갭 C: audit script regex fragility 보강 — jest-level redundant 검증.
   * `validateDualChannelExclusivity`를 실 import로 호출. audit script가 깨져도 catch.
   */
  it('production registry는 dual-channel exclusivity invariant를 통과한다 (jest-level redundant 검증)', () => {
    expect(() => validateDualChannelExclusivity(CACHE_INVALIDATION_REGISTRY)).not.toThrow();
  });
});
