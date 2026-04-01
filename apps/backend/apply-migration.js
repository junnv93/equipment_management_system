const { sql } = require('postgres');
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// DB_* 변수로부터 DATABASE_URL 조합 (packages/db/src/load-env.ts의 JS 버전)
function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || 'postgres';
  const dbName = process.env.DB_NAME || 'equipment_management';
  return `postgresql://${user}:${password}@${host}:${port}/${dbName}`;
}

async function runMigration() {
  try {
    const databaseUrl = resolveDatabaseUrl();
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
