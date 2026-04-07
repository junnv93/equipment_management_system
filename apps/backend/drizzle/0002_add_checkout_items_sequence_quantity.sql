-- QP-18-06 양식 매핑: checkout_items에 sequence_number(순번), quantity(수량) 추가
-- 양식 정의: docs/procedure/양식/QP-18-06_장비반출입확인서.md
ALTER TABLE "checkout_items" ADD COLUMN "sequence_number" integer;--> statement-breakpoint
ALTER TABLE "checkout_items" ADD COLUMN "quantity" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY checkout_id ORDER BY created_at, id) AS seq
  FROM "checkout_items"
)
UPDATE "checkout_items" ci SET sequence_number = numbered.seq FROM numbered WHERE ci.id = numbered.id;--> statement-breakpoint
ALTER TABLE "checkout_items" ALTER COLUMN "sequence_number" SET NOT NULL;
