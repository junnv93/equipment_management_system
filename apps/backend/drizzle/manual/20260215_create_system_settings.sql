-- System Settings table (category + key + site for cross-site override)
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50) NOT NULL,
  key VARCHAR(100) NOT NULL,
  value JSONB NOT NULL,
  site VARCHAR(20),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- UNIQUE constraint with COALESCE expression (requires UNIQUE INDEX, not inline constraint)
-- Ensures one global setting (site=NULL) OR one site-specific override per (category, key) pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_system_settings_unique_key
  ON system_settings(category, key, COALESCE(site, '__global__'));

-- Lookup index for category + site queries
CREATE INDEX IF NOT EXISTS idx_system_settings_lookup
  ON system_settings(category, site);

-- Seed default calibration alert days (global)
INSERT INTO system_settings (category, key, value)
VALUES ('calibration', 'alertDays', '[30, 7, 0]'::jsonb)
ON CONFLICT DO NOTHING;

-- Seed default notification retention days (global)
INSERT INTO system_settings (category, key, value)
VALUES ('system', 'notificationRetentionDays', '90'::jsonb)
ON CONFLICT DO NOTHING;
