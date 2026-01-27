import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function runMigration() {
  const migrationFile = process.argv[2];
  if (!migrationFile) {
    console.error('❌ Usage: ts-node run-migration.ts <migration-file.sql>');
    process.exit(1);
  }

  const migrationPath = path.join(__dirname, '../../drizzle/manual', migrationFile);
  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  console.log(`🔄 Running migration: ${migrationFile}`);

  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/equipment_management';

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const sql = fs.readFileSync(migrationPath, 'utf8');
    await client.query(sql);

    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('🚨 Migration error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

runMigration();
