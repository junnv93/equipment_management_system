-- 0051_add_self_inspection_items_measurement_criteria
-- UL-QP-18-05 §6 자체점검 — 항목별 측정값(measurement) + 판정 기준(criteria) 추가
-- Mission PR-3: 시험원이 row 1줄에서 항목/측정값/기준/판정을 동시에 기록 (4-grid)
-- 기존 row 호환: 둘 다 nullable. backfill 불필요.
-- Drizzle interactive prompt 회피 — 수동 SQL + journal append + DB direct apply
ALTER TABLE "self_inspection_items" ADD COLUMN "measurement" varchar(100);--> statement-breakpoint
ALTER TABLE "self_inspection_items" ADD COLUMN "criteria" varchar(200);
