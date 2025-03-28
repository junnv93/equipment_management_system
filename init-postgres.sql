-- PostgreSQL 초기화 스크립트

-- 사용자 생성 (이미 있는 경우 무시)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'equipment_user') THEN
    CREATE USER equipment_user WITH PASSWORD 'equipment_password';
  END IF;
END
$$;

-- 데이터베이스 생성 (이미 있는 경우 무시)
CREATE DATABASE equipment_management
    WITH 
    OWNER = equipment_user
    ENCODING = 'UTF8'
    CONNECTION LIMIT = -1;

\connect equipment_management

-- 유형 추가
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'equipment_status') THEN
        CREATE TYPE equipment_status AS ENUM (
            'available',
            'loaned',
            'checked_out',
            'calibration_scheduled',
            'calibration_overdue',
            'maintenance',
            'retired'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'calibration_method') THEN
        CREATE TYPE calibration_method AS ENUM (
            'external_calibration',
            'self_inspection',
            'not_applicable'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'admin',
            'manager',
            'user'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loan_status') THEN
        CREATE TYPE loan_status AS ENUM (
            'pending',
            'approved',
            'rejected',
            'active',
            'returned',
            'overdue'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'calibration_status') THEN
        CREATE TYPE calibration_status AS ENUM (
            'scheduled',
            'in_progress',
            'completed',
            'failed',
            'canceled'
        );
    END IF;
END
$$;

-- 권한 부여
GRANT ALL PRIVILEGES ON DATABASE equipment_management TO equipment_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO equipment_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO equipment_user;

-- 테이블은 drizzle ORM이 생성하기 때문에 여기서는 생성하지 않습니다.
