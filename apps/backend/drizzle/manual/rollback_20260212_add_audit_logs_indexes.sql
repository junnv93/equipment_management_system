-- rollback_20260212_add_audit_logs_indexes.sql
DROP INDEX IF EXISTS audit_logs_entity_type_timestamp_idx;
DROP INDEX IF EXISTS audit_logs_action_timestamp_idx;
DROP INDEX IF EXISTS audit_logs_entity_id_idx;
DROP INDEX IF EXISTS audit_logs_user_id_timestamp_idx;
