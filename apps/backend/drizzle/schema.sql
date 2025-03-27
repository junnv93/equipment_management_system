-- PostgreSQL 스키마 정의

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
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
);

-- 장비 테이블 생성
CREATE TABLE IF NOT EXISTS equipment (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'available',
  serial_number VARCHAR(100),
  purchase_date DATE,
  warranty_expiry_date DATE,
  location VARCHAR(100),
  notes TEXT,
  calibration_required BOOLEAN DEFAULT FALSE,
  next_calibration_date DATE,
  team_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
);

-- 대여 테이블 생성
CREATE TABLE IF NOT EXISTS loans (
  id VARCHAR(36) PRIMARY KEY,
  equipment_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
  status VARCHAR(20) DEFAULT 'checked_out',
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
); 