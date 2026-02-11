-- Migration: Create software_history table
-- Date: 2026-02-12
-- Purpose: Create table for tracking software changes with optimistic locking

-- Create software_history table
CREATE TABLE IF NOT EXISTS software_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL,
    software_name VARCHAR(200) NOT NULL,
    previous_version VARCHAR(50),
    new_version VARCHAR(50) NOT NULL,
    changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    changed_by UUID NOT NULL,
    verification_record TEXT NOT NULL,
    approval_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    approved_by UUID,
    approved_at TIMESTAMP,
    approver_comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1
);

-- Create indexes for query performance
CREATE INDEX IF NOT EXISTS software_history_equipment_id_idx ON software_history(equipment_id);
CREATE INDEX IF NOT EXISTS software_history_software_name_idx ON software_history(software_name);
CREATE INDEX IF NOT EXISTS software_history_approval_status_idx ON software_history(approval_status);
CREATE INDEX IF NOT EXISTS software_history_changed_at_idx ON software_history(changed_at);
CREATE INDEX IF NOT EXISTS software_history_equipment_software_idx ON software_history(equipment_id, software_name, changed_at);
CREATE INDEX IF NOT EXISTS software_history_version_idx ON software_history(version);

-- Insert seed data (from in-memory arrays in software.service.ts lines 39-72)
INSERT INTO software_history (
    id,
    equipment_id,
    software_name,
    previous_version,
    new_version,
    changed_at,
    changed_by,
    verification_record,
    approval_status,
    approved_by,
    approved_at,
    approver_comment,
    created_at,
    updated_at,
    version
) VALUES
    -- Record 1: EMC32 (Approved)
    (
        'sw-001-uuid',
        '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
        'EMC32',
        '10.2.0',
        '10.3.0',
        '2024-01-15 00:00:00',
        '550e8400-e29b-41d4-a716-446655440001',
        '변경 후 테스트 완료. 기존 측정 결과와 비교하여 0.1dB 이내 차이 확인.',
        'approved',
        '550e8400-e29b-41d4-a716-446655440001',
        '2024-01-16 00:00:00',
        '검증 기록 확인 완료',
        '2024-01-15 00:00:00',
        '2024-01-16 00:00:00',
        1
    ),
    -- Record 2: DASY6 SAR (Pending)
    (
        'sw-002-uuid',
        '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
        'DASY6 SAR',
        '6.0.1',
        '6.1.0',
        '2024-02-01 00:00:00',
        '770a0600-a40c-63f6-c938-668877660222',
        'SAR 측정 검증 완료. 기준 팬텀으로 측정하여 기존 결과와 비교 확인.',
        'pending',
        NULL,
        NULL,
        NULL,
        '2024-02-01 00:00:00',
        '2024-02-01 00:00:00',
        1
    )
ON CONFLICT (id) DO NOTHING;

-- Verify migration
DO $$
DECLARE
    record_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO record_count FROM software_history;
    RAISE NOTICE 'Total software_history records: %', record_count;

    IF record_count < 2 THEN
        RAISE WARNING 'Expected at least 2 records, found %', record_count;
    END IF;
END $$;
