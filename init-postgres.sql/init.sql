-- PostgreSQL 초기화 스크립트

-- 팀 테이블 생성
CREATE TABLE IF NOT EXISTS teams (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  team_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  password VARCHAR(100) NOT NULL,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
);

-- 장비 테이블 생성
CREATE TABLE IF NOT EXISTS equipment (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'available',
  serial_number VARCHAR(100),
  asset_number VARCHAR(100),
  model_name VARCHAR(100),
  manufacturer VARCHAR(100),
  purchase_date DATE,
  warranty_expiry_date DATE,
  location VARCHAR(100),
  notes TEXT,
  calibration_required BOOLEAN DEFAULT FALSE,
  calibration_cycle INTEGER,
  last_calibration_date DATE,
  next_calibration_date DATE,
  calibration_agency VARCHAR(100),
  intermediate_check BOOLEAN DEFAULT FALSE,
  team_id VARCHAR(36),
  manager_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 대여 테이블 생성
CREATE TABLE IF NOT EXISTS loans (
  id VARCHAR(36) PRIMARY KEY,
  equipment_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  expected_end_date TIMESTAMP NOT NULL,
  actual_end_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 체크아웃(반출) 테이블 생성
CREATE TABLE IF NOT EXISTS checkouts (
  id VARCHAR(36) PRIMARY KEY,
  equipment_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  location VARCHAR(100) NOT NULL,
  checked_out_at TIMESTAMP NOT NULL,
  checked_in_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'checked_out',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 교정 테이블 생성
CREATE TABLE IF NOT EXISTS calibrations (
  id VARCHAR(36) PRIMARY KEY,
  equipment_id VARCHAR(36) NOT NULL,
  calibrated_at TIMESTAMP NOT NULL,
  next_calibration_at TIMESTAMP,
  result VARCHAR(20),
  calibrated_by VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
);

-- 예약 테이블 생성
CREATE TABLE IF NOT EXISTS reservations (
  id VARCHAR(36) PRIMARY KEY,
  equipment_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  start_datetime TIMESTAMP NOT NULL,
  end_datetime TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  purpose TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 알림 테이블 생성
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 이력 테이블 생성
CREATE TABLE IF NOT EXISTS history (
  id VARCHAR(36) PRIMARY KEY,
  equipment_id VARCHAR(36),
  action_type VARCHAR(50) NOT NULL,
  details TEXT NOT NULL,
  user_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 기본 관리자 사용자 생성 (비밀번호: admin123)
INSERT INTO teams (id, name, description) 
VALUES ('1', '관리팀', '시스템 관리 및 운영을 담당하는 팀') 
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, name, role, password, team_id)
VALUES ('1', 'admin@example.com', '시스템 관리자', 'admin', '$2b$10$iqZM1uDPUAq4ZWJz5qjBoeWvxJGBhcN5q5wKmYkBX8/N5xLl.yRKe', '1')
ON CONFLICT (id) DO NOTHING;

-- 기본 일반 사용자 생성 (비밀번호: user123)
INSERT INTO users (id, email, name, role, password, team_id)
VALUES ('2', 'user@example.com', '일반 사용자', 'user', '$2b$10$qgZR8DqpCOcxm9YR5PRMPeCUPT.nwK5MKR8c1q8nKbCPt44hy2lmO', '1')
ON CONFLICT (id) DO NOTHING; 