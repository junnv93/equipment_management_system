import { PgDialect } from 'drizzle-orm/pg-core';
import {
  NOTIFICATION_SORT_DEFAULT,
  NOTIFICATION_SORT_COLUMN_MAP,
  resolveNotificationOrderBy,
} from '../utils/notification-sort-mapper';

/**
 * Default sort 의도 결빙 — `findAllForUser({})` (sort 미지정) → ORDER BY createdAt DESC.
 *
 * 회귀 시나리오:
 *  - 누군가 NOTIFICATION_SORT_DEFAULT 를 무심코 변경 (예: priority.asc)
 *  - 또는 resolveNotificationOrderBy 의 fallback 분기 제거
 *  → 사용자가 보는 알림 순서가 silently 뒤바뀜 (UX 회귀)
 *
 * 검증 전략: drizzle PgDialect.sqlToQuery() 로 SQL 문자열 추출 후 column + direction 키워드 검증.
 */
const dialect = new PgDialect();

describe('notification-sort-mapper — default sort 회귀 차단', () => {
  it('NOTIFICATION_SORT_DEFAULT 는 createdAt.desc 로 고정', () => {
    expect(NOTIFICATION_SORT_DEFAULT).toEqual({
      field: 'createdAt',
      direction: 'desc',
    });
  });

  it('resolveNotificationOrderBy(undefined) → ORDER BY notifications.created_at DESC', () => {
    const result = resolveNotificationOrderBy(undefined);
    const { sql } = dialect.sqlToQuery(result);
    expect(sql).toMatch(/created_at/);
    expect(sql.toLowerCase()).toContain('desc');
  });

  it('명시 sort=createdAt.asc → fallback 분기 미진입, asc 키워드 사용', () => {
    const result = resolveNotificationOrderBy('createdAt.asc');
    const { sql } = dialect.sqlToQuery(result);
    expect(sql).toMatch(/created_at/);
    expect(sql.toLowerCase()).toContain('asc');
    expect(sql.toLowerCase()).not.toMatch(/\bdesc\b/);
  });

  it('priority 컬럼도 매핑 — sort enum SSOT 정합', () => {
    const result = resolveNotificationOrderBy('priority.desc');
    const { sql } = dialect.sqlToQuery(result);
    expect(sql).toMatch(/priority/);
    expect(sql.toLowerCase()).toContain('desc');
  });

  it('NOTIFICATION_SORT_COLUMN_MAP 는 모든 NotificationSortField 를 커버', () => {
    // satisfies Record<NotificationSortField, PgColumn> 컴파일타임 보장.
    // 런타임 sanity check — 키 누락 회귀 차단.
    const keys = Object.keys(NOTIFICATION_SORT_COLUMN_MAP).sort();
    expect(keys).toEqual(['createdAt', 'priority']);
  });
});
