-- 0053_add_approval_delegations
-- 장기 부재자 승인 위임을 감사 가능하게 저장합니다.
CREATE TABLE "approval_delegations" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "delegator_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE restrict,
    "delegatee_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE restrict,
    "category" varchar(50) NOT NULL,
    "reason" varchar(500),
    "starts_at" timestamp NOT NULL,
    "ends_at" timestamp NOT NULL,
    "revoked_at" timestamp,
    "revoked_by" uuid REFERENCES "users"("id") ON DELETE restrict,
    "created_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE restrict,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "approval_delegations_delegatee_active_idx"
    ON "approval_delegations" ("delegatee_id", "category", "starts_at", "ends_at", "revoked_at");
CREATE INDEX "approval_delegations_delegator_idx"
    ON "approval_delegations" ("delegator_id", "starts_at");
CREATE UNIQUE INDEX "approval_delegations_no_duplicate_active_idx"
    ON "approval_delegations" ("delegator_id", "delegatee_id", "category", "starts_at", "ends_at");
