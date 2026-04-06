-- 운영 책임자 (부) 필드 추가 — QP-18-02 시험설비 이력카드 대응
ALTER TABLE "equipment"
  ADD COLUMN "deputy_manager_id" uuid REFERENCES "users"("id") ON DELETE SET NULL;

CREATE INDEX "equipment_deputy_manager_id_idx" ON "equipment" ("deputy_manager_id");
