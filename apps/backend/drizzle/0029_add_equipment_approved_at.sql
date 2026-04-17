-- Migration: Add equipment.approved_at for UL-QP-18-02 history card signature panel SSOT.
-- Context: equipment.approvedBy exists (who approved) but the approval moment was missing.
-- history-card.service previously rendered equipment.updatedAt as the approval date, which
-- changes on every edit and is semantically wrong per UL-QP-18 §7.7 / §9.9.
-- Nullable: legacy rows remain NULL; service layer falls back to updatedAt.

ALTER TABLE "equipment" ADD COLUMN IF NOT EXISTS "approved_at" timestamp;
