-- Cable domain tables creation (UL-QP-18-08)
-- Creates: cables, cable_loss_measurements, cable_loss_data_points
-- Reason: Drizzle schema defines these tables but they were never migrated to DB

BEGIN;

-- ============================================================================
-- 1. cables — 케이블 레지스트리 (UL-QP-18-08)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cables (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  management_number   VARCHAR(20) NOT NULL,
  length              VARCHAR(20),
  connector_type      VARCHAR(20),
  frequency_range_min INTEGER,
  frequency_range_max INTEGER,
  serial_number       VARCHAR(100),
  location            VARCHAR(50),
  site                VARCHAR(10),
  status              VARCHAR(20) NOT NULL DEFAULT 'active',
  last_measurement_date TIMESTAMP,
  measured_by         UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_by          UUID REFERENCES users(id) ON DELETE RESTRICT,
  created_at          TIMESTAMP NOT NULL DEFAULT now(),
  updated_at          TIMESTAMP NOT NULL DEFAULT now(),
  version             INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS cables_management_number_idx ON cables (management_number);
CREATE INDEX IF NOT EXISTS cables_status_idx ON cables (status);
CREATE INDEX IF NOT EXISTS cables_site_idx ON cables (site);
CREATE INDEX IF NOT EXISTS cables_measured_by_idx ON cables (measured_by);
CREATE INDEX IF NOT EXISTS cables_created_by_idx ON cables (created_by);

-- ============================================================================
-- 2. cable_loss_measurements — 케이블 손실 측정 세션
-- ============================================================================
CREATE TABLE IF NOT EXISTS cable_loss_measurements (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  cable_id                UUID NOT NULL REFERENCES cables(id) ON DELETE CASCADE,
  measurement_date        TIMESTAMP NOT NULL,
  measured_by             UUID REFERENCES users(id) ON DELETE RESTRICT,
  measurement_equipment_id UUID REFERENCES equipment(id) ON DELETE RESTRICT,
  notes                   TEXT,
  created_at              TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cable_loss_measurements_cable_id_idx ON cable_loss_measurements (cable_id);
CREATE INDEX IF NOT EXISTS cable_loss_measurements_measurement_date_idx ON cable_loss_measurements (measurement_date);

-- ============================================================================
-- 3. cable_loss_data_points — 주파수별 손실값
-- ============================================================================
CREATE TABLE IF NOT EXISTS cable_loss_data_points (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  measurement_id  UUID NOT NULL REFERENCES cable_loss_measurements(id) ON DELETE CASCADE,
  frequency_mhz   INTEGER NOT NULL,
  loss_db         VARCHAR(20) NOT NULL
);

CREATE INDEX IF NOT EXISTS cable_loss_data_points_measurement_id_idx ON cable_loss_data_points (measurement_id);

-- 하나의 측정 세션에서 동일 주파수 중복 방지
ALTER TABLE cable_loss_data_points
  ADD CONSTRAINT cable_loss_data_points_measurement_freq_unique
  UNIQUE (measurement_id, frequency_mhz);

COMMIT;
