-- PostgreSQL 초기화 스크립트

-- 필요한 확장 프로그램 설치
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- 텍스트 검색 성능 향상

-- 팀 테이블 생성
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'USER', 'APPROVER')),
  team_id UUID,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  password VARCHAR(255) NOT NULL,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
);

-- 장비 테이블 생성
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  management_number VARCHAR(50) NOT NULL UNIQUE,
  asset_number VARCHAR(50),
  model_name VARCHAR(100),
  manufacturer VARCHAR(100),
  serial_number VARCHAR(100),
  location VARCHAR(100),
  calibration_cycle INTEGER,
  last_calibration_date TIMESTAMP WITH TIME ZONE,
  next_calibration_date TIMESTAMP WITH TIME ZONE,
  calibration_agency VARCHAR(100),
  needs_intermediate_check BOOLEAN DEFAULT FALSE,
  calibration_method VARCHAR(50) CHECK (calibration_method IN ('external_calibration', 'self_inspection', 'not_applicable')),
  purchase_year INTEGER,
  team_id UUID REFERENCES teams(id),
  manager_id UUID REFERENCES users(id),
  supplier VARCHAR(100),
  contact_info VARCHAR(100),
  software_version VARCHAR(50),
  firmware_version VARCHAR(50),
  manual_location TEXT,
  accessories TEXT,
  main_features TEXT,
  technical_manager VARCHAR(100),
  status VARCHAR(50) NOT NULL CHECK (status IN ('available', 'loaned', 'checked_out', 'calibration_scheduled', 'calibration_overdue', 'maintenance', 'retired')) DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 대여 테이블 생성
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  loan_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expected_return_date TIMESTAMP WITH TIME ZONE NOT NULL,
  return_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'returned', 'overdue')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 체크아웃(반출) 테이블 생성
CREATE TABLE IF NOT EXISTS checkouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  location VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50),
  address TEXT,
  reason TEXT NOT NULL,
  checkout_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expected_return_date TIMESTAMP WITH TIME ZONE NOT NULL,
  return_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'returned', 'overdue')) DEFAULT 'pending',
  approved_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 교정 테이블 생성
CREATE TABLE IF NOT EXISTS calibrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID NOT NULL,
  calibration_date TIMESTAMP WITH TIME ZONE NOT NULL,
  next_calibration_date TIMESTAMP WITH TIME ZONE NOT NULL,
  agency VARCHAR(100) NOT NULL,
  result VARCHAR(50) NOT NULL CHECK (result IN ('pass', 'fail', 'pending')),
  certificate_number VARCHAR(100),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
);

-- 예약 테이블 생성
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')) DEFAULT 'pending',
  purpose TEXT NOT NULL,
  approved_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 알림 테이블 생성
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 이력 테이블 생성
CREATE TABLE IF NOT EXISTS history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  equipment_id UUID REFERENCES equipment(id),
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('create', 'update', 'delete', 'loan', 'return', 'checkout', 'checkin', 'calibration', 'maintenance', 'location_change')),
  description TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  action_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_equipment_team ON equipment(team_id);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_next_calibration ON equipment(next_calibration_date);
CREATE INDEX IF NOT EXISTS idx_loans_user ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_equipment ON loans(equipment_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_checkouts_user ON checkouts(user_id);
CREATE INDEX IF NOT EXISTS idx_checkouts_equipment ON checkouts(equipment_id);
CREATE INDEX IF NOT EXISTS idx_calibrations_equipment ON calibrations(equipment_id);
CREATE INDEX IF NOT EXISTS idx_reservations_equipment ON reservations(equipment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_history_equipment ON history(equipment_id);
CREATE INDEX IF NOT EXISTS idx_history_user ON history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_action_time ON history(action_time);

-- 기본 데이터 삽입
INSERT INTO teams (id, name, description) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'RF팀', 'RF 장비 관리 팀'),
  ('22222222-2222-2222-2222-222222222222', 'SAR팀', 'SAR 장비 관리 팀'),
  ('33333333-3333-3333-3333-333333333333', 'EMC팀', 'EMC 장비 관리 팀'),
  ('44444444-4444-4444-4444-444444444444', 'Automotive팀', '자동차 관련 장비 관리 팀')
ON CONFLICT DO NOTHING;

-- 기본 관리자 계정 (비밀번호: admin123, 실제 사용 시 변경 필요)
INSERT INTO users (id, email, password, name, role, team_id) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'admin@example.com', '$2b$10$3euPg3VqSYmX4.eA3d4f4uoaYJzgQSoVCB3NjLCRMq7eBz8dxKqai', '관리자', 'ADMIN', NULL)
ON CONFLICT DO NOTHING;

-- 일반 사용자 계정 (비밀번호: user123)
INSERT INTO users (id, email, password, name, role, team_id) VALUES 
  ('22222222-2222-2222-2222-222222222222', 'user@example.com', '$2b$10$qgZR8DqpCOcxm9YR5PRMPeCUPT.nwK5MKR8c1q8nKbCPt44hy2lmO', '일반 사용자', 'USER', '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

-- 트리거 함수: 장비 상태 자동 업데이트
CREATE OR REPLACE FUNCTION update_equipment_status() RETURNS TRIGGER AS $$
BEGIN
  -- 장비가 대여되면 상태 업데이트
  IF TG_TABLE_NAME = 'loans' AND NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE equipment SET status = 'loaned', updated_at = CURRENT_TIMESTAMP WHERE id = NEW.equipment_id;
  
  -- 장비가 반납되면 상태 업데이트
  ELSIF TG_TABLE_NAME = 'loans' AND NEW.status = 'returned' AND OLD.status != 'returned' THEN
    UPDATE equipment SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = NEW.equipment_id;
  
  -- 장비가 반출되면 상태 업데이트
  ELSIF TG_TABLE_NAME = 'checkouts' AND NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE equipment SET status = 'checked_out', updated_at = CURRENT_TIMESTAMP WHERE id = NEW.equipment_id;
  
  -- 장비가 반입되면 상태 업데이트
  ELSIF TG_TABLE_NAME = 'checkouts' AND NEW.status = 'returned' AND OLD.status != 'returned' THEN
    UPDATE equipment SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = NEW.equipment_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS update_equipment_status_on_loan ON loans;
CREATE TRIGGER update_equipment_status_on_loan
AFTER UPDATE ON loans
FOR EACH ROW
EXECUTE FUNCTION update_equipment_status();

DROP TRIGGER IF EXISTS update_equipment_status_on_checkout ON checkouts;
CREATE TRIGGER update_equipment_status_on_checkout
AFTER UPDATE ON checkouts
FOR EACH ROW
EXECUTE FUNCTION update_equipment_status();

-- 이력 자동 기록 트리거
CREATE OR REPLACE FUNCTION log_equipment_history() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO history (equipment_id, action_type, description, user_id, metadata)
    VALUES (NEW.id, 'create', '장비 생성됨: ' || NEW.name, NULL, row_to_json(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO history (equipment_id, action_type, description, user_id, metadata)
    VALUES (NEW.id, 'update', '장비 정보 수정됨: ' || NEW.name, NULL, json_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW)));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO history (equipment_id, action_type, description, user_id, metadata)
    VALUES (OLD.id, 'delete', '장비 삭제됨: ' || OLD.name, NULL, row_to_json(OLD));
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 이력 트리거 생성
DROP TRIGGER IF EXISTS log_equipment_history_trigger ON equipment;
CREATE TRIGGER log_equipment_history_trigger
AFTER INSERT OR UPDATE OR DELETE ON equipment
FOR EACH ROW
EXECUTE FUNCTION log_equipment_history();

-- 교정 일정 알림 함수
CREATE OR REPLACE FUNCTION create_calibration_notifications() RETURNS VOID AS $$
DECLARE
  equipment_rec RECORD;
  admin_users RECORD;
BEGIN
  -- 30일 이내에 교정 예정인 장비 찾기
  FOR equipment_rec IN 
    SELECT e.id, e.name, e.next_calibration_date, e.team_id, u.id AS manager_id
    FROM equipment e
    LEFT JOIN users u ON e.manager_id = u.id
    WHERE e.next_calibration_date IS NOT NULL 
    AND e.next_calibration_date BETWEEN NOW() AND NOW() + INTERVAL '30 day'
    AND e.status NOT IN ('calibration_scheduled', 'calibration_overdue')
  LOOP
    -- 장비 관리자에게 알림 생성
    IF equipment_rec.manager_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
      VALUES (
        equipment_rec.manager_id,
        '교정 일정 알림',
        '장비 "' || equipment_rec.name || '"의 교정이 ' || 
        to_char(equipment_rec.next_calibration_date, 'YYYY-MM-DD') || '에 예정되어 있습니다.',
        'warning',
        'equipment',
        equipment_rec.id
      );
    END IF;
    
    -- 관리자들에게 알림 생성
    FOR admin_users IN SELECT id FROM users WHERE role = 'ADMIN' LOOP
      INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
      VALUES (
        admin_users.id,
        '교정 일정 알림',
        '장비 "' || equipment_rec.name || '"의 교정이 ' || 
        to_char(equipment_rec.next_calibration_date, 'YYYY-MM-DD') || '에 예정되어 있습니다.',
        'warning',
        'equipment',
        equipment_rec.id
      );
    END LOOP;
    
    -- 팀 멤버들에게 알림
    IF equipment_rec.team_id IS NOT NULL THEN
      FOR admin_users IN SELECT id FROM users WHERE team_id = equipment_rec.team_id LOOP
        INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id)
        VALUES (
          admin_users.id,
          '팀 장비 교정 알림',
          '팀 장비 "' || equipment_rec.name || '"의 교정이 ' || 
          to_char(equipment_rec.next_calibration_date, 'YYYY-MM-DD') || '에 예정되어 있습니다.',
          'info',
          'equipment',
          equipment_rec.id
        );
      END LOOP;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql; 