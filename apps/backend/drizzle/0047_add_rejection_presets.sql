-- Migration: 0047_add_rejection_presets
-- Purpose: 반려 사유 프리셋 테이블 신설 (UL-QP-18 반출 반려 workflow)
--          반려 모달에서 1-click 선택 → 텍스트에어리어 자동 채움
-- Note: 시드 데이터는 UL-QP-18 절차서 기준으로 사용자 확인 후 삽입 (임의 생성 금지)

CREATE TABLE IF NOT EXISTS "rejection_presets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "label" varchar(200) NOT NULL,
  "template" text,
  "is_default" boolean DEFAULT false NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
