-- 장비 수리 이력 테이블 생성
-- 수리 이력은 영구 보관됨 (소프트 삭제 지원)

CREATE TABLE IF NOT EXISTS repair_history (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE DEFAULT gen_random_uuid()::varchar,

    -- 장비 연결
    equipment_id INTEGER NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,

    -- 수리 정보
    repair_date TIMESTAMP NOT NULL,
    repair_description TEXT NOT NULL,
    repaired_by VARCHAR(100),
    repair_company VARCHAR(200),
    cost INTEGER,
    repair_result VARCHAR(50), -- 'completed' | 'partial' | 'failed'

    -- 추가 정보
    notes TEXT,
    attachment_path VARCHAR(500),

    -- 소프트 삭제
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMP,
    deleted_by VARCHAR(36),

    -- 시스템 필드
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS repair_history_equipment_id_idx ON repair_history(equipment_id);
CREATE INDEX IF NOT EXISTS repair_history_repair_date_idx ON repair_history(repair_date);
CREATE INDEX IF NOT EXISTS repair_history_is_deleted_idx ON repair_history(is_deleted);
CREATE INDEX IF NOT EXISTS repair_history_equipment_date_idx ON repair_history(equipment_id, repair_date);

-- 테이블 및 필드 설명
COMMENT ON TABLE repair_history IS '장비 수리 이력 테이블';
COMMENT ON COLUMN repair_history.uuid IS '외부 식별자 (UUID)';
COMMENT ON COLUMN repair_history.equipment_id IS '장비 ID (FK → equipment)';
COMMENT ON COLUMN repair_history.repair_date IS '수리 일자';
COMMENT ON COLUMN repair_history.repair_description IS '수리 내용';
COMMENT ON COLUMN repair_history.repaired_by IS '수리 담당자';
COMMENT ON COLUMN repair_history.repair_company IS '외부 수리 업체명';
COMMENT ON COLUMN repair_history.cost IS '수리 비용 (원)';
COMMENT ON COLUMN repair_history.repair_result IS '수리 결과: completed(완료), partial(부분수리), failed(실패)';
COMMENT ON COLUMN repair_history.notes IS '비고';
COMMENT ON COLUMN repair_history.attachment_path IS '첨부 파일 경로';
COMMENT ON COLUMN repair_history.is_deleted IS '소프트 삭제 여부';
COMMENT ON COLUMN repair_history.deleted_at IS '삭제 일시';
COMMENT ON COLUMN repair_history.deleted_by IS '삭제자 ID';
COMMENT ON COLUMN repair_history.created_by IS '생성자 ID';
COMMENT ON COLUMN repair_history.created_at IS '생성 일시';
COMMENT ON COLUMN repair_history.updated_at IS '수정 일시';
