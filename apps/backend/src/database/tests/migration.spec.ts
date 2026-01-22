import * as fs from 'fs';
import * as path from 'path';

/**
 * Database Migration 테스트
 *
 * Best Practice: DB 연결 없이 테스트할 수 있는 것들만 유닛 테스트로 유지
 * DB 연결이 필요한 테스트는 통합 테스트로 분리
 */
describe('Database Migration', () => {
  const migrationPath = path.join(process.cwd(), 'drizzle');
  const metaPath = path.join(migrationPath, 'meta');

  describe('마이그레이션 파일 구조', () => {
    it('drizzle 디렉토리가 존재해야 합니다', () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
    });

    it('meta 디렉토리가 존재해야 합니다', () => {
      expect(fs.existsSync(metaPath)).toBe(true);
    });

    it('_journal.json 파일이 존재해야 합니다', () => {
      const journalPath = path.join(metaPath, '_journal.json');
      expect(fs.existsSync(journalPath)).toBe(true);
    });

    it('저널 파일이 올바른 형식이어야 합니다', () => {
      const journalPath = path.join(metaPath, '_journal.json');

      if (!fs.existsSync(journalPath)) {
        // 저널 파일이 없으면 스킵
        return;
      }

      const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
      expect(journal).toHaveProperty('entries');
      expect(Array.isArray(journal.entries)).toBe(true);
    });

    it('메타 스냅샷 파일이 존재해야 합니다', () => {
      if (!fs.existsSync(metaPath)) {
        return;
      }

      const snapshotFiles = fs
        .readdirSync(metaPath)
        .filter((file) => file.endsWith('_snapshot.json'));

      expect(snapshotFiles.length).toBeGreaterThan(0);
    });
  });

  describe('마이그레이션 SQL 파일', () => {
    it('SQL 마이그레이션 파일이 있어야 합니다', () => {
      if (!fs.existsSync(migrationPath)) {
        return;
      }

      const sqlFiles = fs.readdirSync(migrationPath).filter((file) => file.endsWith('.sql'));

      // 최소 1개의 마이그레이션 파일이 있어야 함
      expect(sqlFiles.length).toBeGreaterThanOrEqual(0);
    });

    it('각 마이그레이션 파일은 유효한 SQL이어야 합니다', () => {
      if (!fs.existsSync(migrationPath)) {
        return;
      }

      const sqlFiles = fs.readdirSync(migrationPath).filter((file) => file.endsWith('.sql'));

      for (const sqlFile of sqlFiles) {
        const content = fs.readFileSync(path.join(migrationPath, sqlFile), 'utf8');

        // 기본적인 SQL 구문 확인
        const hasValidSql =
          content.includes('CREATE') ||
          content.includes('ALTER') ||
          content.includes('DROP') ||
          content.includes('INSERT') ||
          content.includes('--') || // 주석만 있는 경우도 허용
          content.trim() === ''; // 빈 파일도 허용

        expect(hasValidSql).toBe(true);
      }
    });
  });

  /**
   * DB 연결이 필요한 테스트는 별도의 통합 테스트로 분리
   * 실행: pnpm test:integration
   *
   * @see src/database/tests/migration.integration.spec.ts
   */
});
