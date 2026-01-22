-- 누락된 테이블 추가

-- 승인 상태 enum 타입 생성 (존재하지 않으면)
DO $$ BEGIN
    CREATE TYPE approval_status AS ENUM ('pending_approval', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 요청 타입 enum 생성 (존재하지 않으면)
DO $$ BEGIN
    CREATE TYPE request_type AS ENUM ('create', 'update', 'delete');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- equipment_requests 테이블 생성
CREATE TABLE IF NOT EXISTS equipment_requests (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    request_type VARCHAR(50) NOT NULL,
    equipment_id INTEGER,
    requested_by VARCHAR(36) NOT NULL,
    requested_at TIMESTAMP DEFAULT NOW() NOT NULL,
    approval_status VARCHAR(50) NOT NULL DEFAULT 'pending_approval',
    approved_by VARCHAR(36),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    request_data TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS equipment_requests_uuid_idx ON equipment_requests(uuid);
CREATE INDEX IF NOT EXISTS equipment_requests_request_type_idx ON equipment_requests(request_type);
CREATE INDEX IF NOT EXISTS equipment_requests_approval_status_idx ON equipment_requests(approval_status);
CREATE INDEX IF NOT EXISTS equipment_requests_requested_by_idx ON equipment_requests(requested_by);

SELECT '✅ equipment_requests 테이블 생성 완료' AS result;
