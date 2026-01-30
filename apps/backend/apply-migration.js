const { sql } = require('postgres');
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    const conn = postgres({
      host: 'localhost',
      port: 5432,
      database: 'postgres_equipment',
      username: 'postgres',
      password: 'postgres',
    });

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
