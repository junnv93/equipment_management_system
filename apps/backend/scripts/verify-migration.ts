#!/usr/bin/env ts-node

/**
 * 마이그레이션 검증 스크립트
 * 
 * 사용법:
 *   pnpm ts-node apps/backend/scripts/verify-migration.ts
 * 
 * 이 스크립트는 마이그레이션 후 다음을 검증합니다:
 * 1. equipment 테이블에 site 컬럼이 추가되었는지
 * 2. teams 테이블에 site 컬럼이 추가되었는지
 * 3. 인덱스가 생성되었는지
 * 4. 기존 데이터에 기본값이 설정되었는지
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 환경 변수 로드
dotenv.config({ path: path.join(__dirname, '../../.env') });

const DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/equipment_management';

async function verifyMigration() {
  console.log('🔍 마이그레이션 검증 시작...\n');

  const client = postgres(DATABASE_URL);
  const db = drizzle(client);

  try {
    // 1. equipment 테이블에 site 컬럼 확인
    console.log('1. equipment 테이블 site 컬럼 확인...');
    const equipmentColumns = await client`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'equipment' AND column_name = 'site'
    `;

    if (equipmentColumns.length === 0) {
      console.error('❌ equipment 테이블에 site 컬럼이 없습니다.');
      process.exit(1);
    }

    console.log('✅ equipment 테이블에 site 컬럼이 존재합니다.');
    console.log(`   타입: ${equipmentColumns[0].data_type}, NULL 허용: ${equipmentColumns[0].is_nullable}\n`);

    // 2. teams 테이블에 site 컬럼 확인
    console.log('2. teams 테이블 site 컬럼 확인...');
    const teamsColumns = await client`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'teams' AND column_name = 'site'
    `;

    if (teamsColumns.length === 0) {
      console.error('❌ teams 테이블에 site 컬럼이 없습니다.');
      process.exit(1);
    }

    console.log('✅ teams 테이블에 site 컬럼이 존재합니다.');
    console.log(`   타입: ${teamsColumns[0].data_type}, NULL 허용: ${teamsColumns[0].is_nullable}\n`);

    // 3. 인덱스 확인
    console.log('3. equipment_site_idx 인덱스 확인...');
    const indexes = await client`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'equipment' AND indexname = 'equipment_site_idx'
    `;

    if (indexes.length === 0) {
      console.error('❌ equipment_site_idx 인덱스가 없습니다.');
      process.exit(1);
    }

    console.log('✅ equipment_site_idx 인덱스가 존재합니다.\n');

    // 4. 기존 데이터에 기본값 설정 확인
    console.log('4. 기존 데이터 기본값 확인...');
    const equipmentNullSites = await client`
      SELECT COUNT(*) as count
      FROM equipment
      WHERE site IS NULL
    `;

    const teamsNullSites = await client`
      SELECT COUNT(*) as count
      FROM teams
      WHERE site IS NULL
    `;

    if (equipmentNullSites[0].count > 0) {
      console.warn(`⚠️  equipment 테이블에 site가 NULL인 레코드가 ${equipmentNullSites[0].count}개 있습니다.`);
    } else {
      console.log('✅ equipment 테이블의 모든 레코드에 site 값이 설정되어 있습니다.');
    }

    if (teamsNullSites[0].count > 0) {
      console.warn(`⚠️  teams 테이블에 site가 NULL인 레코드가 ${teamsNullSites[0].count}개 있습니다.`);
    } else {
      console.log('✅ teams 테이블의 모든 레코드에 site 값이 설정되어 있습니다.');
    }

    // 5. site 값 분포 확인
    console.log('\n5. site 값 분포 확인...');
    const equipmentSiteDistribution = await client`
      SELECT site, COUNT(*) as count
      FROM equipment
      GROUP BY site
      ORDER BY count DESC
    `;

    console.log('   equipment 테이블:');
    equipmentSiteDistribution.forEach((row: any) => {
      console.log(`     ${row.site || 'NULL'}: ${row.count}개`);
    });

    const teamsSiteDistribution = await client`
      SELECT site, COUNT(*) as count
      FROM teams
      GROUP BY site
      ORDER BY count DESC
    `;

    console.log('   teams 테이블:');
    teamsSiteDistribution.forEach((row: any) => {
      console.log(`     ${row.site || 'NULL'}: ${row.count}개`);
    });

    console.log('\n✅ 마이그레이션 검증 완료!');
  } catch (error) {
    console.error('❌ 마이그레이션 검증 중 오류 발생:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// 스크립트 실행
if (require.main === module) {
  verifyMigration()
    .then(() => {
      console.log('\n✨ 모든 검증이 완료되었습니다.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 검증 실패:', error);
      process.exit(1);
    });
}

export { verifyMigration };
