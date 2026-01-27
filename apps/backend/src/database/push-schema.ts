import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function pushSchema() {
  console.log('🔄 스키마를 데이터베이스에 적용 중...');

  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5433/equipment_management';

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ 데이터베이스에 연결되었습니다.');

    // ENUMs 생성
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE attachment_type AS ENUM('inspection_report', 'history_card', 'other');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE approval_status AS ENUM('pending_approval', 'approved', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE request_type AS ENUM('create', 'update', 'delete');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE equipment_status AS ENUM('available', 'in_use', 'checked_out', 'calibration_scheduled', 'calibration_overdue', 'non_conforming', 'spare', 'retired');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log('✅ ENUMs 생성 완료');

    // teams 테이블
    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(100) NOT NULL,
        type varchar(50),
        description varchar(255),
        site varchar(20),
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);

    // users 테이블
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar(255) NOT NULL UNIQUE,
        name varchar(100) NOT NULL,
        role varchar(50) DEFAULT 'test_engineer' NOT NULL,
        team_id uuid,
        azure_ad_id varchar(255),
        site varchar(20),
        location varchar(50),
        position varchar(100),
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);

    // equipment 테이블 (핵심)
    await client.query(`
      CREATE TABLE IF NOT EXISTS equipment (
        id serial PRIMARY KEY,
        uuid varchar(36) NOT NULL UNIQUE,
        name varchar(100) NOT NULL,
        management_number varchar(50) NOT NULL UNIQUE,
        asset_number varchar(50),
        model_name varchar(100),
        manufacturer varchar(100),
        manufacturer_contact varchar(100),
        serial_number varchar(100),
        description text,
        location varchar(100),
        spec_match varchar(20),
        calibration_required varchar(20),
        initial_location varchar(100),
        installation_date timestamp,
        calibration_cycle integer,
        last_calibration_date timestamp,
        next_calibration_date timestamp,
        calibration_agency varchar(100),
        needs_intermediate_check boolean DEFAULT false,
        calibration_method varchar(50),
        last_intermediate_check_date timestamp,
        intermediate_check_cycle integer,
        next_intermediate_check_date timestamp,
        team_id uuid,
        manager_id varchar(36),
        site varchar(20) NOT NULL,
        purchase_date timestamp,
        price integer,
        supplier varchar(100),
        contact_info varchar(100),
        software_version varchar(50),
        firmware_version varchar(50),
        software_name varchar(200),
        software_type varchar(50),
        manual_location text,
        accessories text,
        main_features text,
        technical_manager varchar(100),
        status varchar(50) DEFAULT 'available' NOT NULL,
        is_active boolean DEFAULT true,
        approval_status varchar(50) DEFAULT 'approved',
        requested_by varchar(36),
        approved_by varchar(36),
        equipment_type varchar(50),
        calibration_result text,
        correction_factor varchar(50),
        intermediate_check_schedule timestamp,
        repair_history text,
        is_shared boolean DEFAULT false NOT NULL,
        shared_source varchar(50),
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now(),
        CONSTRAINT equipment_team_id_teams_id_fk FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
      );
    `);

    console.log('✅ 핵심 테이블 (teams, users, equipment) 생성 완료');

    // 인덱스 생성 (equipment 테이블 주요 인덱스)
    await client.query(`
      CREATE INDEX IF NOT EXISTS equipment_status_idx ON equipment (status);
      CREATE INDEX IF NOT EXISTS equipment_location_idx ON equipment (location);
      CREATE INDEX IF NOT EXISTS equipment_team_id_idx ON equipment (team_id);
      CREATE INDEX IF NOT EXISTS equipment_site_idx ON equipment (site);
      CREATE INDEX IF NOT EXISTS equipment_is_active_idx ON equipment (is_active);
    `);

    console.log('✅ 인덱스 생성 완료');
    console.log('✅ 스키마 적용이 완료되었습니다.');
  } catch (error) {
    console.error('🚨 스키마 적용 중 오류 발생:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 데이터베이스 연결을 종료했습니다.');
  }
}

pushSchema();
