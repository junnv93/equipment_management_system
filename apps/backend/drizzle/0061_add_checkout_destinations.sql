CREATE TABLE "checkout_destinations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "checkout_destinations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE INDEX "checkout_destinations_is_active_idx" ON "checkout_destinations" ("is_active");
--> statement-breakpoint
INSERT INTO "checkout_destinations" ("name")
SELECT DISTINCT "destination"
FROM "checkouts"
WHERE "destination" IS NOT NULL AND "destination" != ''
ON CONFLICT ("name") DO NOTHING;
