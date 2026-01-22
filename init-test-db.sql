-- E2E 테스트용 데이터베이스 초기화 스크립트
-- 사용법: psql -h localhost -p 5434 -U postgres -d equipment_management_test -f init-test-db.sql

-- 기존 테이블 삭제 (순서 중요: 외래키 의존성)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS software_history CASCADE;
DROP TABLE IF EXISTS repair_history CASCADE;
DROP TABLE IF EXISTS non_conformances CASCADE;
DROP TABLE IF EXISTS equipment_attachments CASCADE;
DROP TABLE IF EXISTS calibration_factors CASCADE;
DROP TABLE IF EXISTS calibration_plans CASCADE;
DROP TABLE IF EXISTS calibrations CASCADE;
DROP TABLE IF EXISTS checkouts CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS equipment_requests CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 팀 테이블
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    description VARCHAR(255),
    site VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 사용자 테이블
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'test_operator',
    team_id UUID REFERENCES teams(id),
    azure_ad_id VARCHAR(255),
    site VARCHAR(20),
    location VARCHAR(50),
    position VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 장비 테이블
CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    management_number VARCHAR(100) UNIQUE NOT NULL,
    serial_number VARCHAR(100),
    manufacturer VARCHAR(100),
    model_name VARCHAR(100),
    category VARCHAR(50),
    specification TEXT,
    status VARCHAR(50) DEFAULT 'available',
    approval_status VARCHAR(50) DEFAULT 'approved',
    team_id UUID REFERENCES teams(id),
    site VARCHAR(20),
    location VARCHAR(100),
    calibration_method VARCHAR(50),
    calibration_cycle INTEGER,
    last_calibration_date DATE,
    next_calibration_date DATE,
    intermediate_check_date DATE,
    is_shared BOOLEAN DEFAULT FALSE,
    shared_source VARCHAR(50),
    acquisition_date DATE,
    disposal_date DATE,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 테스트 팀 데이터
INSERT INTO teams (id, name, type, description, site) VALUES
    ('11111111-1111-1111-1111-111111111111', 'RF팀', 'RF', 'RF 시험 팀', 'suwon'),
    ('22222222-2222-2222-2222-222222222222', 'EMC팀', 'EMC', 'EMC 시험 팀', 'suwon'),
    ('33333333-3333-3333-3333-333333333333', 'SAR팀', 'SAR', 'SAR 시험 팀', 'uiwang');

-- 테스트 사용자 데이터
-- 비밀번호는 백엔드 AuthService에서 하드코딩됨: admin123, manager123, user123
INSERT INTO users (id, email, name, role, team_id, site, location, position) VALUES
    ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'admin@example.com', '관리자', 'site_admin', '11111111-1111-1111-1111-111111111111', 'suwon', '수원랩', '시험소장'),
    ('a1b2c3d4-e5f6-4789-abcd-ef0123456789', 'manager@example.com', '기술책임자', 'technical_manager', '11111111-1111-1111-1111-111111111111', 'suwon', '수원랩', '기술책임자'),
    ('12345678-1234-4567-8901-234567890abc', 'user@example.com', '시험실무자', 'test_operator', '22222222-2222-2222-2222-222222222222', 'suwon', '수원랩', '시험원'),
    ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'user1@example.com', '시험실무자2', 'test_operator', '33333333-3333-3333-3333-333333333333', 'uiwang', '의왕랩', '시험원');

-- 테스트 장비 데이터
INSERT INTO equipment (id, name, management_number, serial_number, manufacturer, model_name, category, status, approval_status, team_id, site, location) VALUES
    ('eeee1111-1111-1111-1111-111111111111', '스펙트럼 분석기', 'RF-001', 'SN-12345', 'Keysight', 'N9030B', 'measuring', 'available', 'approved', '11111111-1111-1111-1111-111111111111', 'suwon', '수원랩'),
    ('eeee2222-2222-2222-2222-222222222222', '신호 발생기', 'RF-002', 'SN-12346', 'Keysight', 'N5182B', 'measuring', 'available', 'approved', '11111111-1111-1111-1111-111111111111', 'suwon', '수원랩'),
    ('eeee3333-3333-3333-3333-333333333333', 'EMC 수신기', 'EMC-001', 'SN-12347', 'R&S', 'ESR26', 'measuring', 'in_use', 'approved', '22222222-2222-2222-2222-222222222222', 'suwon', '수원랩');

SELECT '✅ 테스트 데이터베이스 초기화 완료!' AS result;
SELECT '📋 팀: ' || COUNT(*) || '개' AS teams FROM teams;
SELECT '👤 사용자: ' || COUNT(*) || '명' AS users FROM users;
SELECT '🔧 장비: ' || COUNT(*) || '개' AS equipment FROM equipment;
