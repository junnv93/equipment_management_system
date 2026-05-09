import { PgDialect } from 'drizzle-orm/pg-core';
import {
  TEAM_SORT_DEFAULT,
  TEAM_SORT_COLUMN_MAP,
  resolveTeamOrderBy,
} from '../utils/team-sort-mapper';

/**
 * Default sort 의도 결빙 — `teams.findAll({})` (sort 미지정) → ORDER BY name ASC.
 *
 * 회귀 시나리오:
 *  - 누군가 TEAM_SORT_DEFAULT 를 변경 (예: createdAt.desc)
 *  - 또는 resolveTeamOrderBy 의 fallback 분기 제거
 *  → 팀 선택 드롭다운 / 목록의 알파벳 순서가 silently 뒤바뀜 (UX 회귀)
 */
const dialect = new PgDialect();

describe('team-sort-mapper — default sort 회귀 차단', () => {
  it('TEAM_SORT_DEFAULT 는 name.asc 로 고정', () => {
    expect(TEAM_SORT_DEFAULT).toEqual({
      field: 'name',
      direction: 'asc',
    });
  });

  it('resolveTeamOrderBy(undefined) → ORDER BY teams.name ASC', () => {
    const result = resolveTeamOrderBy(undefined);
    const { sql } = dialect.sqlToQuery(result);
    expect(sql).toMatch(/\bname\b/);
    expect(sql.toLowerCase()).toContain('asc');
    expect(sql.toLowerCase()).not.toMatch(/\bdesc\b/);
  });

  it('명시 sort=createdAt.desc → fallback 분기 미진입, desc 키워드 사용', () => {
    const result = resolveTeamOrderBy('createdAt.desc');
    const { sql } = dialect.sqlToQuery(result);
    expect(sql).toMatch(/created_at/);
    expect(sql.toLowerCase()).toContain('desc');
  });

  it('classification 컬럼도 매핑 — sort enum SSOT 정합', () => {
    const result = resolveTeamOrderBy('classification.asc');
    const { sql } = dialect.sqlToQuery(result);
    expect(sql).toMatch(/classification/);
    expect(sql.toLowerCase()).toContain('asc');
  });

  it('TEAM_SORT_COLUMN_MAP 는 모든 TeamSortField 를 커버', () => {
    // satisfies Record<TeamSortField, PgColumn> 컴파일타임 보장 + 런타임 sanity check
    const keys = Object.keys(TEAM_SORT_COLUMN_MAP).sort();
    expect(keys).toEqual(['classification', 'createdAt', 'name']);
  });
});
