-- 승인 대기 목록 필터링 최적화 (admin/equipment-approvals 페이지)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "equipment_approval_status_idx"
ON "equipment" ("approval_status");
