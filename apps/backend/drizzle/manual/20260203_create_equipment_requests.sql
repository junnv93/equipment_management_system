-- 20260203_create_equipment_requests.sql
-- Create equipment_requests table and related enums for approval workflow

-- Step 1: Create enums (if they don't exist)
DO $$ BEGIN
  CREATE TYPE approval_status AS ENUM ('pending_approval', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE request_type AS ENUM ('create', 'update', 'delete');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create equipment_requests table
CREATE TABLE IF NOT EXISTS equipment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Request information
  request_type request_type NOT NULL,
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  requested_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Approval information
  approval_status approval_status NOT NULL DEFAULT 'pending_approval',
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  rejection_reason TEXT,

  -- Request data (JSON stringified)
  request_data TEXT,

  -- System fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 3: Create indexes for query optimization
CREATE INDEX IF NOT EXISTS equipment_requests_request_type_idx ON equipment_requests(request_type);
CREATE INDEX IF NOT EXISTS equipment_requests_approval_status_idx ON equipment_requests(approval_status);
CREATE INDEX IF NOT EXISTS equipment_requests_requested_by_idx ON equipment_requests(requested_by);
CREATE INDEX IF NOT EXISTS equipment_requests_approved_by_idx ON equipment_requests(approved_by);
CREATE INDEX IF NOT EXISTS equipment_requests_equipment_id_idx ON equipment_requests(equipment_id);

-- Composite index for optimizing pending approval queries
CREATE INDEX IF NOT EXISTS equipment_requests_status_type_idx ON equipment_requests(approval_status, request_type);

-- Step 4: Verification
SELECT 'equipment_requests table created successfully' AS status;
