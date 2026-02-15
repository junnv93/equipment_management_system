-- Add leader_id column to teams table
-- Enables team leader assignment via combobox in the team form
ALTER TABLE teams ADD COLUMN IF NOT EXISTS leader_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Index for leader lookups
CREATE INDEX IF NOT EXISTS teams_leader_id_idx ON teams(leader_id);
