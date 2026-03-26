const { sql } = require('postgres');
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL 환경변수가 설정되지 않았습니다.');
    }
    const conn = postgres(databaseUrl);

    const migrationSql = fs.readFileSync(
      path.join(__dirname, 'drizzle/manual/20260130_seed_test_users.sql'),
      'utf-8'
    );

    // Split SQL statements and execute them
    const statements = migrationSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith('--'));

    for (const statement of statements) {
      await conn`${sql.raw(statement)}`;
      console.log('✓ Executed:', statement.substring(0, 60));
    }

    console.log('\n✓ Migration applied successfully');
    await conn.end();
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
