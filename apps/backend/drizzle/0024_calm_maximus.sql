DROP INDEX "teams_classification_idx";--> statement-breakpoint
CREATE INDEX "teams_site_classification_idx" ON "teams" USING btree ("site","classification");