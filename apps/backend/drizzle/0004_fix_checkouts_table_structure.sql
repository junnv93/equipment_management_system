-- Fix checkouts table structure to match the schema
-- Drop and recreate the table with correct column names

-- First, drop the existing table (CASCADE to handle any foreign keys and related tables)
DROP TABLE IF EXISTS "checkout_items" CASCADE;
DROP TABLE IF EXISTS "checkouts" CASCADE;

-- Recreate the checkouts table with the correct structure matching packages/db/src/schema/checkouts.ts
CREATE TABLE IF NOT EXISTS "checkouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" uuid NOT NULL,
	"first_approver_id" uuid,
	"final_approver_id" uuid,
	"returner_id" uuid,
	"purpose" varchar(50) NOT NULL,
	"destination" varchar(255) NOT NULL,
	"phone_number" varchar(50),
	"address" text,
	"reason" text NOT NULL,
	"checkout_date" timestamp,
	"expected_return_date" timestamp NOT NULL,
	"actual_return_date" timestamp,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"calibration_checked" boolean DEFAULT false,
	"repair_checked" boolean DEFAULT false,
	"working_status_checked" boolean DEFAULT false,
	"inspection_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Recreate the checkout_items table
-- ✅ 주의: equipment 테이블의 id는 serial(integer)이고 uuid는 varchar이므로,
-- checkout_items의 equipment_id는 equipment.uuid를 참조해야 하지만,
-- 외래키는 일반적으로 PK를 참조하므로, 여기서는 외래키 제약조건 없이 생성
-- (애플리케이션 레벨에서 검증)
CREATE TABLE IF NOT EXISTS "checkout_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"checkout_id" uuid NOT NULL,
	"equipment_id" uuid NOT NULL,
	"condition_before" text,
	"condition_after" text,
	"inspection_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "checkout_items_checkout_id_fkey" FOREIGN KEY ("checkout_id") REFERENCES "checkouts"("id") ON DELETE CASCADE
	-- equipment_id는 equipment.uuid를 참조하지만, equipment.uuid는 PK가 아니므로 외래키 제약조건 없음
	-- 애플리케이션 레벨에서 equipment 존재 여부 검증 필요
);
