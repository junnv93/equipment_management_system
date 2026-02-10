-- 외부 렌탈 장비 반입 요청 테이블
-- @see packages/db/src/schema/rental-imports.ts

CREATE TABLE IF NOT EXISTS rental_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,

    -- 신청자 정보
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    site VARCHAR(20) NOT NULL,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,

    -- 장비 정보
    equipment_name VARCHAR(100) NOT NULL,
    model_name VARCHAR(100),
    manufacturer VARCHAR(100),
    serial_number VARCHAR(100),
    description TEXT,
    classification VARCHAR(50) NOT NULL,

    -- 렌탈 업체 정보
    vendor_name VARCHAR(100) NOT NULL,
    vendor_contact VARCHAR(100),
    external_identifier VARCHAR(100),

    -- 사용 기간
    usage_period_start TIMESTAMP NOT NULL,
    usage_period_end TIMESTAMP NOT NULL,

    -- 반입 사유
    reason TEXT NOT NULL,

    -- 상태
    status VARCHAR(30) NOT NULL DEFAULT 'pending',

    -- 승인 정보
    approver_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    approved_at TIMESTAMP,
    rejection_reason TEXT,

    -- 수령 정보
    received_by UUID REFERENCES users(id) ON DELETE RESTRICT,
    received_at TIMESTAMP,
    receiving_condition JSONB,

    -- 연결된 장비 (수령 시 자동 생성)
    equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL,

    -- 연결된 반납 checkout
    return_checkout_id UUID REFERENCES checkouts(id) ON DELETE SET NULL,

    -- 시스템 필드
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS rental_imports_status_idx ON rental_imports(status);
CREATE INDEX IF NOT EXISTS rental_imports_requester_id_idx ON rental_imports(requester_id);
CREATE INDEX IF NOT EXISTS rental_imports_team_id_idx ON rental_imports(team_id);
CREATE INDEX IF NOT EXISTS rental_imports_site_idx ON rental_imports(site);
CREATE INDEX IF NOT EXISTS rental_imports_created_at_idx ON rental_imports(created_at);
