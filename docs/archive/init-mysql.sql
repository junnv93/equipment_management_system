-- 팀 테이블 생성
CREATE TABLE IF NOT EXISTS teams (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 사용자 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'manager', 'user') DEFAULT 'user',
  team_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
);

-- 장비 테이블 생성
CREATE TABLE IF NOT EXISTS equipment (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  status ENUM('available', 'in_use', 'maintenance', 'retired') DEFAULT 'available',
  serial_number VARCHAR(100),
  purchase_date DATE,
  warranty_expiry_date DATE,
  location VARCHAR(100),
  notes TEXT,
  calibration_required BOOLEAN DEFAULT FALSE,
  next_calibration_date DATE,
  team_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
);

-- 대여 테이블 생성
CREATE TABLE IF NOT EXISTS loans (
  id VARCHAR(36) PRIMARY KEY,
  equipment_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  status ENUM('active', 'returned', 'overdue') DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 체크아웃 테이블 생성
CREATE TABLE IF NOT EXISTS checkouts (
  id VARCHAR(36) PRIMARY KEY,
  equipment_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  checked_out_at TIMESTAMP NOT NULL,
  checked_in_at TIMESTAMP,
  status ENUM('checked_out', 'checked_in') DEFAULT 'checked_out',
  notes TEXT,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 교정 테이블 생성
CREATE TABLE IF NOT EXISTS calibrations (
  id VARCHAR(36) PRIMARY KEY,
  equipment_id VARCHAR(36) NOT NULL,
  calibrated_at TIMESTAMP NOT NULL,
  next_calibration_at TIMESTAMP,
  calibrated_by VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
);

-- 샘플 데이터 삽입
-- 팀 데이터
INSERT INTO teams (id, name, description) VALUES
  ('team-001', '연구개발팀', '제품 연구 및 개발'),
  ('team-002', '품질관리팀', '품질 보증 및 테스트'),
  ('team-003', '생산팀', '제품 제조 및 생산');

-- 사용자 데이터
INSERT INTO users (id, email, name, role, team_id) VALUES
  ('user-001', 'admin@example.com', '관리자', 'admin', 'team-001'),
  ('user-002', 'manager@example.com', '매니저', 'manager', 'team-002'),
  ('user-003', 'user1@example.com', '사용자1', 'user', 'team-001'),
  ('user-004', 'user2@example.com', '사용자2', 'user', 'team-002'),
  ('user-005', 'user3@example.com', '사용자3', 'user', 'team-003');

-- 장비 데이터
INSERT INTO equipment (id, name, type, status, serial_number, purchase_date, warranty_expiry_date, location, calibration_required, team_id) VALUES
  ('equip-001', '오실로스코프', '테스트장비', 'available', 'SN12345', '2022-01-15', '2024-01-15', '연구실1', TRUE, 'team-001'),
  ('equip-002', '멀티미터', '테스트장비', 'available', 'SN67890', '2022-02-20', '2024-02-20', '연구실2', TRUE, 'team-001'),
  ('equip-003', '솔더링 스테이션', '조립장비', 'in_use', 'SN11223', '2022-03-10', '2024-03-10', '작업실1', FALSE, 'team-003'),
  ('equip-004', '현미경', '검사장비', 'available', 'SN44556', '2022-04-05', '2024-04-05', '검사실1', FALSE, 'team-002'),
  ('equip-005', '3D 프린터', '생산장비', 'maintenance', 'SN77889', '2022-05-12', '2024-05-12', '생산실1', FALSE, 'team-003');

-- 대여 데이터
INSERT INTO loans (id, equipment_id, user_id, start_date, end_date, status) VALUES
  ('loan-001', 'equip-003', 'user-003', '2023-01-10 09:00:00', NULL, 'active'),
  ('loan-002', 'equip-001', 'user-004', '2023-01-05 14:30:00', '2023-01-07 16:45:00', 'returned');

-- 체크아웃 데이터
INSERT INTO checkouts (id, equipment_id, user_id, checked_out_at, checked_in_at, status) VALUES
  ('checkout-001', 'equip-003', 'user-003', '2023-01-10 09:00:00', NULL, 'checked_out'),
  ('checkout-002', 'equip-001', 'user-004', '2023-01-05 14:30:00', '2023-01-07 16:45:00', 'checked_in');

-- 교정 데이터
INSERT INTO calibrations (id, equipment_id, calibrated_at, next_calibration_at, calibrated_by) VALUES
  ('calib-001', 'equip-001', '2022-07-15 10:00:00', '2023-07-15 10:00:00', '품질팀'),
  ('calib-002', 'equip-002', '2022-08-20 13:30:00', '2023-08-20 13:30:00', '품질팀'); 