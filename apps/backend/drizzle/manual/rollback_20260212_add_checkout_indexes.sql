-- rollback_20260212_add_checkout_indexes.sql
DROP INDEX IF EXISTS checkouts_requester_id_idx;
DROP INDEX IF EXISTS checkouts_status_idx;
DROP INDEX IF EXISTS checkouts_status_created_at_idx;
