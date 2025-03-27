-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  role TEXT CHECK (role IN ('admin', 'user', 'manager')),
  team TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 장비 상태 정의
-- available: 사용 가능
-- in_use: 사용 중
-- maintenance: 유지보수 중
-- calibration: 교정 중
-- retired: 폐기됨

-- 장비 테이블
CREATE TABLE IF NOT EXISTS equipment (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  management_number TEXT UNIQUE NOT NULL,
  asset_number TEXT,
  model_name TEXT,
  manufacturer TEXT,
  serial_number TEXT,
  location TEXT,
  
  -- 교정 정보
  calibration_cycle INTEGER, -- 개월 단위
  last_calibration_date TIMESTAMP,
  next_calibration_date TIMESTAMP,
  calibration_agency TEXT,
  needs_intermediate_check BOOLEAN DEFAULT 0,
  calibration_method TEXT CHECK (calibration_method IN ('external_calibration', 'self_inspection', 'not_applicable')),
  
  -- 관리 정보
  purchase_year INTEGER,
  team_id TEXT,
  manager_id TEXT,
  
  -- 추가 정보
  supplier TEXT,
  contact_info TEXT,
  software_version TEXT,
  firmware_version TEXT,
  manual_location TEXT,
  accessories TEXT,
  main_features TEXT,
  technical_manager TEXT,
  
  -- 상태 정보
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'calibration', 'retired')),
  
  -- 시스템 필드
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (team_id) REFERENCES teams(id),
  FOREIGN KEY (manager_id) REFERENCES users(id)
);

-- 팀 테이블
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 장비 대여 테이블
CREATE TABLE IF NOT EXISTS equipment_loans (
  id TEXT PRIMARY KEY,
  equipment_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  loan_date TIMESTAMP NOT NULL,
  expected_return_date TIMESTAMP NOT NULL,
  actual_return_date TIMESTAMP,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue')),
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (equipment_id) REFERENCES equipment(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 장비 반출 테이블
CREATE TABLE IF NOT EXISTS equipment_checkouts (
  id TEXT PRIMARY KEY,
  location TEXT NOT NULL,
  phone_number TEXT,
  address TEXT,
  reason TEXT NOT NULL,
  checkout_date TIMESTAMP NOT NULL,
  expected_return_date TIMESTAMP NOT NULL,
  actual_return_date TIMESTAMP,
  
  manager_id TEXT NOT NULL,
  return_manager_id TEXT,
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'returned', 'overdue')),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (manager_id) REFERENCES users(id),
  FOREIGN KEY (return_manager_id) REFERENCES users(id)
);

-- 반출된 장비 목록 테이블
CREATE TABLE IF NOT EXISTS checkout_equipment (
  checkout_id TEXT NOT NULL,
  equipment_id TEXT NOT NULL,
  
  PRIMARY KEY (checkout_id, equipment_id),
  FOREIGN KEY (checkout_id) REFERENCES equipment_checkouts(id),
  FOREIGN KEY (equipment_id) REFERENCES equipment(id)
);

-- 교정 이력 테이블
CREATE TABLE IF NOT EXISTS calibration_history (
  id TEXT PRIMARY KEY,
  equipment_id TEXT NOT NULL,
  calibration_date TIMESTAMP NOT NULL,
  next_calibration_date TIMESTAMP,
  result TEXT,
  performed_by TEXT,
  agency TEXT,
  certificate_number TEXT,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (equipment_id) REFERENCES equipment(id)
);

-- 예약 테이블
CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  equipment_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  purpose TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (equipment_id) REFERENCES equipment(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 위치 변경 이력
CREATE TABLE IF NOT EXISTS location_history (
  id TEXT PRIMARY KEY,
  equipment_id TEXT NOT NULL,
  previous_location TEXT,
  new_location TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  change_date TIMESTAMP NOT NULL,
  reason TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (equipment_id) REFERENCES equipment(id),
  FOREIGN KEY (changed_by) REFERENCES users(id)
);

-- 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('calibration', 'return', 'maintenance', 'system')),
  related_id TEXT,
  is_read BOOLEAN DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 초기 관리자 계정 생성
INSERT OR IGNORE INTO users (id, email, password, name, role) 
VALUES (
  'admin-1', 
  'admin@example.com', 
  '$2b$10$ZNyXIxGpHavq5bLh9hGZP.zVJwvbSrSM5v5qnlrbNMdSKFGZ5QU96', -- password: admin123
  '관리자', 
  'admin'
);

-- 기본 팀 생성
INSERT OR IGNORE INTO teams (id, name, description)
VALUES
  ('team-rf', 'RF팀', 'RF 장비 관리팀'),
  ('team-sar', 'SAR팀', 'SAR 장비 관리팀'),
  ('team-emc', 'EMC팀', 'EMC 장비 관리팀'),
  ('team-auto', 'Automotive팀', '자동차 관련 장비 관리팀');

-- 샘플 장비 데이터
INSERT OR IGNORE INTO equipment (
  id, name, management_number, model_name, manufacturer, serial_number, 
  location, status, calibration_cycle, team_id
)
VALUES
  ('equip-001', 'Spectrum Analyzer', 'RF-SA-001', 'N9020B', 'Keysight', 'SN12345',
   '본사 3층 RF Lab', 'available', 12, 'team-rf'),
  ('equip-002', 'Vector Network Analyzer', 'RF-VNA-001', 'E5080B', 'Keysight', 'SN23456',
   '본사 3층 RF Lab', 'available', 12, 'team-rf'),
  ('equip-003', 'Signal Generator', 'RF-SG-001', 'N5182B', 'Keysight', 'SN34567',
   '본사 3층 RF Lab', 'in_use', 12, 'team-rf'),
  ('equip-004', 'EMC Test Receiver', 'EMC-TR-001', 'ESR', 'Rohde & Schwarz', 'SN45678',
   '본사 2층 EMC Lab', 'available', 12, 'team-emc'); 