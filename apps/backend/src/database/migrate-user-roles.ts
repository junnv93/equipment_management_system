import * as dotenv from 'dotenv';
import { Client } from 'pg';

// .env 파일 로드
dotenv.config();

/**
 * 사용자 역할 시스템 마이그레이션 스크립트
 *
 * 기존 역할을 새로운 역할 시스템으로 변환:
 * - 'admin' → 'lab_manager'
 * - 'manager' → 'technical_manager'
 * - 'user' → 'test_engineer'
 * - 'approver' → 'technical_manager' (승인 권한이 있으므로)
 */
async function migrateUserRoles() {
  console.log('🔄 사용자 역할 시스템 마이그레이션 시작...');

  const connectionString =
    process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/equipment_management';

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공');

    // 트랜잭션 시작
    await client.query('BEGIN');

    // 1. 새로운 컬럼 추가 (이미 마이그레이션에서 추가되었을 수 있음)
    console.log('📝 새로운 컬럼 추가 중...');

    // site 컬럼 추가 (없는 경우)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'site'
        ) THEN
          ALTER TABLE users ADD COLUMN site VARCHAR(20);
        END IF;
      END $$;
    `);

    // location 컬럼 추가 (없는 경우)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'location'
        ) THEN
          ALTER TABLE users ADD COLUMN location VARCHAR(50);
        END IF;
      END $$;
    `);

    // position 컬럼 추가 (없는 경우)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'position'
        ) THEN
          ALTER TABLE users ADD COLUMN position VARCHAR(100);
        END IF;
      END $$;
    `);

    console.log('✅ 컬럼 추가 완료');

    // 2. 기존 역할을 새로운 역할로 변환
    console.log('🔄 역할 변환 중...');

    const roleMapping = {
      admin: 'lab_manager',
      manager: 'technical_manager',
      user: 'test_engineer',
      approver: 'technical_manager', // 승인자는 기술책임자로 매핑
    };

    for (const [oldRole, newRole] of Object.entries(roleMapping)) {
      const result = await client.query(`UPDATE users SET role = $1 WHERE role = $2`, [
        newRole,
        oldRole,
      ]);
      console.log(`  ✓ ${oldRole} → ${newRole}: ${result.rowCount}건 변환`);
    }

    // 3. 기본값 업데이트 (기본 역할을 test_engineer로 변경)
    await client.query(`
      ALTER TABLE users 
      ALTER COLUMN role SET DEFAULT 'test_engineer';
    `);

    // 4. 역할 제약 조건 업데이트 (CHECK 제약 조건이 있다면)
    // 기존 CHECK 제약 조건 제거 후 새로운 제약 조건 추가
    await client.query(`
      DO $$ 
      BEGIN
        -- 기존 제약 조건 제거 (있다면)
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE table_name = 'users' 
          AND constraint_name LIKE '%role%check%'
        ) THEN
          ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
        END IF;
      END $$;
    `);

    // 트랜잭션 커밋
    await client.query('COMMIT');
    console.log('✅ 마이그레이션 완료');

    // 마이그레이션 결과 확인
    const stats = await client.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role 
      ORDER BY role;
    `);

    console.log('\n📊 역할별 사용자 수:');
    stats.rows.forEach((row) => {
      console.log(`  - ${row.role}: ${row.count}명`);
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 마이그레이션 실패:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// 이 파일이 직접 실행된 경우에만 마이그레이션 실행
if (require.main === module) {
  migrateUserRoles()
    .then(() => {
      console.log('\n✅ 역할 마이그레이션 프로세스 완료');
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n❌ 역할 마이그레이션 프로세스 실패:', err);
      process.exit(1);
    });
}

export { migrateUserRoles };
