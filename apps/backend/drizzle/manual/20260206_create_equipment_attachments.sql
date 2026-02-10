-- 20260206_create_equipment_attachments.sql
-- Create equipment_attachments table for file uploads related to equipment and requests

-- Step 1: Create attachment_type enum (if it doesn't exist)
DO $$ BEGIN
  CREATE TYPE attachment_type AS ENUM ('inspection_report', 'history_card', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create equipment_attachments table
CREATE TABLE IF NOT EXISTS equipment_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Connection info
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  request_id UUID REFERENCES equipment_requests(id) ON DELETE CASCADE,

  -- File info
  attachment_type attachment_type NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  original_file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,

  -- Metadata
  description TEXT,

  -- System fields
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS equipment_attachments_equipment_id_idx ON equipment_attachments(equipment_id);
CREATE INDEX IF NOT EXISTS equipment_attachments_request_id_idx ON equipment_attachments(request_id);
CREATE INDEX IF NOT EXISTS equipment_attachments_attachment_type_idx ON equipment_attachments(attachment_type);
CREATE INDEX IF NOT EXISTS equipment_attachments_equipment_type_idx ON equipment_attachments(equipment_id, attachment_type);

-- Step 4: Verification
SELECT 'equipment_attachments table created successfully' AS status;
