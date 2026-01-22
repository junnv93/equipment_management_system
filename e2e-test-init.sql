-- E2E 테스트용 데이터베이스 완전 초기화 스크립트
-- 사용법: psql -h localhost -p 5434 -U postgres -d equipment_management_test -f e2e-test-init.sql

-- 기존 테이블 삭제 (순서 중요: 외래키 의존성)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS software_history CASCADE;
DROP TABLE IF EXISTS repair_history CASCADE;
DROP TABLE IF EXISTS non_conformances CASCADE;
DROP TABLE IF EXISTS equipment_attachments CASCADE;
DROP TABLE IF EXISTS calibration_factors CASCADE;
DROP TABLE IF EXISTS calibration_plan_items CASCADE;
DROP TABLE IF EXISTS calibration_plans CASCADE;
DROP TABLE IF EXISTS calibrations CASCADE;
DROP TABLE IF EXISTS checkouts CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS equipment_requests CASCADE;
DROP TABLE IF EXISTS equipment_location_history CASCADE;
DROP TABLE IF EXISTS equipment_maintenance_history CASCADE;
DROP TABLE IF EXISTS equipment_incident_history CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- 1. 팀 테이블
-- ==============================================
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT uuid_generate_v4()::text,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    description VARCHAR(255),
    site VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ==============================================
-- 2. 사용자 테이블
-- ==============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT uuid_generate_v4()::text,
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

-- ==============================================
-- 3. 장비 테이블 (새 필드 포함)
-- ==============================================
CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT uuid_generate_v4()::text,
    name VARCHAR(255) NOT NULL,
    management_number VARCHAR(100) UNIQUE NOT NULL,
    serial_number VARCHAR(100),
    manufacturer VARCHAR(100),
    manufacturer_contact VARCHAR(100),
    model_name VARCHAR(100),
    category VARCHAR(50),
    specification TEXT,
    status VARCHAR(50) DEFAULT 'available',
    approval_status VARCHAR(50) DEFAULT 'approved',
    team_id UUID REFERENCES teams(id),
    technical_manager_id UUID REFERENCES users(id),
    site VARCHAR(20) NOT NULL,
    location VARCHAR(100),
    initial_location VARCHAR(100),
    installation_date TIMESTAMP,
    calibration_method VARCHAR(50),
    calibration_cycle INTEGER,
    calibration_agency VARCHAR(100),
    last_calibration_date DATE,
    next_calibration_date DATE,
    needs_intermediate_check BOOLEAN DEFAULT FALSE,
    last_intermediate_check_date TIMESTAMP,
    intermediate_check_cycle INTEGER,
    next_intermediate_check_date TIMESTAMP,
    spec_match VARCHAR(20),
    calibration_required VARCHAR(20),
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

-- ==============================================
-- 4. 장비 위치 변동 이력 테이블
-- ==============================================
CREATE TABLE equipment_location_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id VARCHAR(36) NOT NULL,
    changed_at TIMESTAMP NOT NULL,
    new_location VARCHAR(100) NOT NULL,
    notes TEXT,
    changed_by VARCHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_location_history_equipment
        FOREIGN KEY (equipment_id)
        REFERENCES equipment(uuid)
        ON DELETE CASCADE
);
CREATE INDEX idx_location_history_equipment_id ON equipment_location_history(equipment_id);
CREATE INDEX idx_location_history_changed_at ON equipment_location_history(changed_at DESC);

-- ==============================================
-- 5. 장비 유지보수 내역 테이블
-- ==============================================
CREATE TABLE equipment_maintenance_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id VARCHAR(36) NOT NULL,
    performed_at TIMESTAMP NOT NULL,
    content TEXT NOT NULL,
    performed_by VARCHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_maintenance_history_equipment
        FOREIGN KEY (equipment_id)
        REFERENCES equipment(uuid)
        ON DELETE CASCADE
);
CREATE INDEX idx_maintenance_history_equipment_id ON equipment_maintenance_history(equipment_id);
CREATE INDEX idx_maintenance_history_performed_at ON equipment_maintenance_history(performed_at DESC);

-- ==============================================
-- 6. 장비 손상/오작동/변경/수리 내역 테이블
-- ==============================================
CREATE TABLE equipment_incident_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id VARCHAR(36) NOT NULL,
    occurred_at TIMESTAMP NOT NULL,
    incident_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    reported_by VARCHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_incident_history_equipment
        FOREIGN KEY (equipment_id)
        REFERENCES equipment(uuid)
        ON DELETE CASCADE
);
CREATE INDEX idx_incident_history_equipment_id ON equipment_incident_history(equipment_id);
CREATE INDEX idx_incident_history_occurred_at ON equipment_incident_history(occurred_at DESC);
CREATE INDEX idx_incident_history_type ON equipment_incident_history(incident_type);

-- ==============================================
-- 7. 교정 기록 테이블
-- ==============================================
CREATE TABLE calibrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT uuid_generate_v4()::text,
    equipment_id UUID REFERENCES equipment(id),
    calibration_date DATE NOT NULL,
    calibration_agency VARCHAR(100),
    certificate_number VARCHAR(100),
    result VARCHAR(50),
    approval_status VARCHAR(50) DEFAULT 'pending_approval',
    registered_by UUID REFERENCES users(id),
    registered_by_role VARCHAR(50),
    registrar_comment TEXT,
    approved_by UUID REFERENCES users(id),
    approver_comment TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ==============================================
-- 8. 대여 테이블
-- ==============================================
CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT uuid_generate_v4()::text,
    equipment_id UUID REFERENCES equipment(id),
    borrower_id UUID REFERENCES users(id),
    borrower_team_id UUID REFERENCES teams(id),
    owner_team_id UUID REFERENCES teams(id),
    status VARCHAR(50) DEFAULT 'pending',
    loan_date DATE,
    expected_return_date DATE,
    actual_return_date DATE,
    auto_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES users(id),
    rejected_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ==============================================
-- 9. 반출 테이블
-- ==============================================
CREATE TABLE checkouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT uuid_generate_v4()::text,
    equipment_id UUID REFERENCES equipment(id),
    checkout_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    requester_id UUID REFERENCES users(id),
    requester_team_id UUID REFERENCES teams(id),
    checkout_date DATE,
    expected_return_date DATE,
    actual_return_date DATE,
    first_approved_by UUID REFERENCES users(id),
    first_approved_at TIMESTAMP,
    final_approved_by UUID REFERENCES users(id),
    final_approved_at TIMESTAMP,
    lender_team_id UUID REFERENCES teams(id),
    lender_site_id VARCHAR(20),
    lender_confirmed_by UUID REFERENCES users(id),
    lender_confirmed_at TIMESTAMP,
    calibration_checked BOOLEAN DEFAULT FALSE,
    repair_checked BOOLEAN DEFAULT FALSE,
    working_status_checked BOOLEAN DEFAULT FALSE,
    inspection_notes TEXT,
    rejected_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ==============================================
-- 10. 장비 첨부파일 테이블
-- ==============================================
CREATE TABLE equipment_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid VARCHAR(36) UNIQUE NOT NULL DEFAULT uuid_generate_v4()::text,
    equipment_id UUID REFERENCES equipment(id),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ==============================================
-- 테스트 시드 데이터
-- ==============================================

-- 테스트 팀 데이터
INSERT INTO teams (id, uuid, name, type, description, site) VALUES
    ('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'RF팀', 'RF', 'RF 시험 팀', 'suwon'),
    ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'EMC팀', 'EMC', 'EMC 시험 팀', 'suwon'),
    ('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'SAR팀', 'SAR', 'SAR 시험 팀', 'uiwang'),
    ('44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', '환경시험팀', 'ENV', '환경 시험 팀', 'uiwang');

-- 테스트 사용자 데이터
INSERT INTO users (id, uuid, email, name, role, team_id, site, location, position) VALUES
    ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'admin@example.com', '김관리자', 'site_admin', '11111111-1111-1111-1111-111111111111', 'suwon', '수원랩 1층', '시험소장'),
    ('a1b2c3d4-e5f6-4789-abcd-ef0123456789', 'a1b2c3d4-e5f6-4789-abcd-ef0123456789', 'manager@example.com', '이기술', 'technical_manager', '11111111-1111-1111-1111-111111111111', 'suwon', '수원랩 1층', '기술책임자'),
    ('12345678-1234-4567-8901-234567890abc', '12345678-1234-4567-8901-234567890abc', 'user@example.com', '박시험', 'test_operator', '22222222-2222-2222-2222-222222222222', 'suwon', '수원랩 2층', '시험원'),
    ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'user1@example.com', '최의왕', 'test_operator', '33333333-3333-3333-3333-333333333333', 'uiwang', '의왕랩 1층', '시험원'),
    ('bbbbbbbb-cccc-dddd-eeee-ffffffffffff', 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff', 'manager2@example.com', '정의왕', 'technical_manager', '33333333-3333-3333-3333-333333333333', 'uiwang', '의왕랩 1층', '기술책임자');

-- 테스트 장비 데이터 (새 필드 포함)
INSERT INTO equipment (
    id, uuid, name, management_number, serial_number, manufacturer, manufacturer_contact,
    model_name, category, specification, status, approval_status, team_id, technical_manager_id,
    site, location, initial_location, installation_date,
    calibration_method, calibration_cycle, calibration_agency, last_calibration_date, next_calibration_date,
    needs_intermediate_check, last_intermediate_check_date, intermediate_check_cycle, next_intermediate_check_date,
    spec_match, calibration_required, created_by
) VALUES
    -- RF팀 장비 1: 외부 교정 대상, 중간점검 필요
    (
        'eeee1111-1111-1111-1111-111111111111', 'eeee1111-1111-1111-1111-111111111111',
        '스펙트럼 분석기', 'RF-001', 'SN-12345', 'Keysight', '02-1234-5678',
        'N9030B', 'measuring', '주파수 범위: 3Hz ~ 50GHz\n측정 레벨: -171dBm ~ +30dBm',
        'available', 'approved', '11111111-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
        'suwon', '수원랩 RF실', '수원랩 RF실', '2024-01-15 09:00:00',
        'external_calibration', 12, 'HCT', '2025-06-01', '2026-06-01',
        TRUE, '2025-12-01 10:00:00', 6, '2026-06-01 10:00:00',
        'match', 'required', 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
    ),
    -- RF팀 장비 2: 외부 교정 대상, 중간점검 불필요
    (
        'eeee2222-2222-2222-2222-222222222222', 'eeee2222-2222-2222-2222-222222222222',
        '신호 발생기', 'RF-002', 'SN-12346', 'Keysight', '02-1234-5678',
        'N5182B', 'measuring', '주파수 범위: 9kHz ~ 6GHz\n출력: -130dBm ~ +19dBm',
        'available', 'approved', '11111111-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
        'suwon', '수원랩 RF실', '수원랩 RF실', '2024-02-20 14:00:00',
        'external_calibration', 12, 'HCT', '2025-07-15', '2026-07-15',
        FALSE, NULL, NULL, NULL,
        'match', 'required', 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
    ),
    -- EMC팀 장비: 자체 점검 대상
    (
        'eeee3333-3333-3333-3333-333333333333', 'eeee3333-3333-3333-3333-333333333333',
        'EMC 수신기', 'EMC-001', 'SN-12347', 'R&S', '02-9876-5432',
        'ESR26', 'measuring', 'CISPR 16-1-1 규격 준수\n주파수 범위: 10Hz ~ 26.5GHz',
        'in_use', 'approved', '22222222-2222-2222-2222-222222222222', 'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
        'suwon', '수원랩 EMC실', '수원랩 EMC실', '2023-11-10 10:30:00',
        'calibration', 6, NULL, '2025-10-01', '2026-04-01',
        TRUE, '2026-01-15 09:00:00', 3, '2026-04-15 09:00:00',
        'match', 'required', 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
    ),
    -- SAR팀 장비 (의왕): 비대상 장비
    (
        'eeee4444-4444-4444-4444-444444444444', 'eeee4444-4444-4444-4444-444444444444',
        'SAR 측정 시스템', 'SAR-001', 'SN-12348', 'Speag', '031-456-7890',
        'DASY8', 'measuring', 'SAR 측정용\n주파수 범위: 4MHz ~ 10GHz',
        'available', 'approved', '33333333-3333-3333-3333-333333333333', 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
        'uiwang', '의왕랩 SAR실', '의왕랩 SAR실', '2024-05-01 11:00:00',
        'not_applicable', NULL, NULL, NULL, NULL,
        FALSE, NULL, NULL, NULL,
        'mismatch', 'not_required', 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff'
    ),
    -- 유지보수중 장비
    (
        'eeee5555-5555-5555-5555-555555555555', 'eeee5555-5555-5555-5555-555555555555',
        '오실로스코프', 'RF-003', 'SN-12349', 'Tektronix', '02-1111-2222',
        'DPO7354C', 'measuring', '대역폭: 3.5GHz\n샘플링 레이트: 40GS/s',
        'checked_out', 'approved', '11111111-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
        'suwon', '수리업체 보관중', '수원랩 RF실', '2023-08-15 15:00:00',
        'external_calibration', 24, '한국교정시험원', '2024-08-01', '2026-08-01',
        FALSE, NULL, NULL, NULL,
        'match', 'required', 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
    ),
    -- 승인 대기중 장비
    (
        'eeee6666-6666-6666-6666-666666666666', 'eeee6666-6666-6666-6666-666666666666',
        '파워미터 (신규)', 'RF-004', 'SN-NEW001', 'Keysight', '02-1234-5678',
        'N1914A', 'measuring', '주파수 범위: 9kHz ~ 110GHz\n파워 범위: -70dBm ~ +44dBm',
        'available', 'pending_approval', '11111111-1111-1111-1111-111111111111', NULL,
        'suwon', '수원랩 RF실', '수원랩 RF실', NULL,
        'external_calibration', 12, 'HCT', '2026-01-10', '2027-01-10',
        FALSE, NULL, NULL, NULL,
        'match', 'required', '12345678-1234-4567-8901-234567890abc'
    );

-- 장비 위치 변동 이력 데이터
INSERT INTO equipment_location_history (equipment_id, changed_at, new_location, notes, changed_by) VALUES
    ('eeee1111-1111-1111-1111-111111111111', '2024-01-15 09:00:00', '수원랩 RF실', '최초 설치', 'f47ac10b-58cc-4372-a567-0e02b2c3d479'),
    ('eeee1111-1111-1111-1111-111111111111', '2025-03-20 14:30:00', '수원랩 창고', '정기 교정을 위한 임시 이동', 'a1b2c3d4-e5f6-4789-abcd-ef0123456789'),
    ('eeee1111-1111-1111-1111-111111111111', '2025-04-01 09:00:00', '수원랩 RF실', '교정 완료 후 원위치', 'a1b2c3d4-e5f6-4789-abcd-ef0123456789'),
    ('eeee5555-5555-5555-5555-555555555555', '2023-08-15 15:00:00', '수원랩 RF실', '최초 설치', 'f47ac10b-58cc-4372-a567-0e02b2c3d479'),
    ('eeee5555-5555-5555-5555-555555555555', '2025-12-01 10:00:00', '수리업체 보관중', '화면 결함으로 수리 의뢰', 'a1b2c3d4-e5f6-4789-abcd-ef0123456789');

-- 장비 유지보수 내역 데이터
INSERT INTO equipment_maintenance_history (equipment_id, performed_at, content, performed_by) VALUES
    ('eeee1111-1111-1111-1111-111111111111', '2025-01-15 10:00:00', '정기 점검: 외관 상태 양호, 케이블 연결 확인', 'a1b2c3d4-e5f6-4789-abcd-ef0123456789'),
    ('eeee1111-1111-1111-1111-111111111111', '2025-06-20 14:00:00', '펌웨어 업데이트 (v3.2.1 -> v3.3.0)', 'a1b2c3d4-e5f6-4789-abcd-ef0123456789'),
    ('eeee2222-2222-2222-2222-222222222222', '2025-08-10 11:30:00', '정기 점검: 출력 레벨 확인, 케이블 교체', '12345678-1234-4567-8901-234567890abc'),
    ('eeee3333-3333-3333-3333-333333333333', '2025-11-05 09:00:00', '팬 소음 발생하여 청소 및 윤활 처리', '12345678-1234-4567-8901-234567890abc');

-- 장비 손상/오작동/변경/수리 내역 데이터
INSERT INTO equipment_incident_history (equipment_id, occurred_at, incident_type, content, reported_by) VALUES
    ('eeee5555-5555-5555-5555-555555555555', '2025-11-15 16:30:00', 'malfunction', '화면에 세로 줄 발생, 측정값 확인 불가', '12345678-1234-4567-8901-234567890abc'),
    ('eeee5555-5555-5555-5555-555555555555', '2025-12-01 10:00:00', 'repair', '제조사에 수리 의뢰, 예상 수리 기간 2주', 'a1b2c3d4-e5f6-4789-abcd-ef0123456789'),
    ('eeee1111-1111-1111-1111-111111111111', '2024-08-20 11:00:00', 'change', '측정 케이블 교체 (N-Type -> SMA)', 'a1b2c3d4-e5f6-4789-abcd-ef0123456789'),
    ('eeee3333-3333-3333-3333-333333333333', '2025-05-10 14:00:00', 'damage', '운송 중 외관 스크래치 발생, 기능상 이상 없음', '12345678-1234-4567-8901-234567890abc');

-- 교정 기록 데이터
INSERT INTO calibrations (
    uuid, equipment_id, calibration_date, calibration_agency, certificate_number,
    result, approval_status, registered_by, registered_by_role, registrar_comment,
    approved_by, approver_comment
) VALUES
    (
        'calib001-0001-0001-0001-000000000001',
        'eeee1111-1111-1111-1111-111111111111',
        '2025-06-01', 'HCT', 'HCT-2025-12345',
        'pass', 'approved',
        'a1b2c3d4-e5f6-4789-abcd-ef0123456789', 'technical_manager',
        '정기 교정 완료, 모든 항목 합격',
        NULL, NULL
    ),
    (
        'calib002-0002-0002-0002-000000000002',
        'eeee2222-2222-2222-2222-222222222222',
        '2025-07-15', 'HCT', 'HCT-2025-12346',
        'pass', 'approved',
        '12345678-1234-4567-8901-234567890abc', 'test_operator',
        '정기 교정 완료',
        'a1b2c3d4-e5f6-4789-abcd-ef0123456789', '교정 결과 확인 완료'
    ),
    (
        'calib003-0003-0003-0003-000000000003',
        'eeee3333-3333-3333-3333-333333333333',
        '2025-10-01', NULL, 'INT-2025-001',
        'pass', 'approved',
        'a1b2c3d4-e5f6-4789-abcd-ef0123456789', 'technical_manager',
        '자체 교정 실시, 표준기 SN-STD001 사용',
        NULL, NULL
    );

-- 대여 기록 데이터
INSERT INTO loans (
    uuid, equipment_id, borrower_id, borrower_team_id, owner_team_id,
    status, loan_date, expected_return_date, actual_return_date,
    auto_approved, approved_by, notes
) VALUES
    (
        'loan0001-0001-0001-0001-000000000001',
        'eeee2222-2222-2222-2222-222222222222',
        '12345678-1234-4567-8901-234567890abc',
        '22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111',
        'approved', '2026-01-15', '2026-01-20', NULL,
        FALSE, 'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
        'EMC 시험을 위한 신호 발생기 대여'
    ),
    (
        'loan0002-0002-0002-0002-000000000002',
        'eeee1111-1111-1111-1111-111111111111',
        '12345678-1234-4567-8901-234567890abc',
        '22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111',
        'returned', '2025-11-01', '2025-11-05', '2025-11-04',
        FALSE, 'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
        '임시 측정용'
    );

-- 반출 기록 데이터
INSERT INTO checkouts (
    uuid, equipment_id, checkout_type, status, requester_id, requester_team_id,
    checkout_date, expected_return_date, actual_return_date,
    first_approved_by, first_approved_at, final_approved_by, final_approved_at,
    calibration_checked, repair_checked, working_status_checked, inspection_notes, notes
) VALUES
    (
        'chkout01-0001-0001-0001-000000000001',
        'eeee5555-5555-5555-5555-555555555555',
        'repair', 'checked_out',
        'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
        '11111111-1111-1111-1111-111111111111',
        '2025-12-01', '2025-12-15', NULL,
        'f47ac10b-58cc-4372-a567-0e02b2c3d479', '2025-12-01 11:00:00',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479', '2025-12-01 11:00:00',
        FALSE, TRUE, FALSE, NULL, '화면 수리를 위한 반출'
    ),
    (
        'chkout02-0002-0002-0002-000000000002',
        'eeee1111-1111-1111-1111-111111111111',
        'calibration', 'return_approved',
        'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
        '11111111-1111-1111-1111-111111111111',
        '2025-05-25', '2025-06-05', '2025-06-01',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479', '2025-05-25 09:00:00',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479', '2025-05-25 09:30:00',
        TRUE, FALSE, TRUE, '교정 완료 후 정상 작동 확인', '정기 교정을 위한 반출'
    );

-- 결과 확인
SELECT '===== E2E 테스트 데이터베이스 초기화 완료 =====' AS result;
SELECT '팀: ' || COUNT(*) || '개' AS teams_count FROM teams;
SELECT '사용자: ' || COUNT(*) || '명' AS users_count FROM users;
SELECT '장비: ' || COUNT(*) || '개' AS equipment_count FROM equipment;
SELECT '위치 이력: ' || COUNT(*) || '건' AS location_history_count FROM equipment_location_history;
SELECT '유지보수 이력: ' || COUNT(*) || '건' AS maintenance_history_count FROM equipment_maintenance_history;
SELECT '사고 이력: ' || COUNT(*) || '건' AS incident_history_count FROM equipment_incident_history;
SELECT '교정 기록: ' || COUNT(*) || '건' AS calibrations_count FROM calibrations;
SELECT '대여 기록: ' || COUNT(*) || '건' AS loans_count FROM loans;
SELECT '반출 기록: ' || COUNT(*) || '건' AS checkouts_count FROM checkouts;
