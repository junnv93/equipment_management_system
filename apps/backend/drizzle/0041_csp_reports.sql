CREATE TABLE IF NOT EXISTS "csp_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "received_at" timestamp DEFAULT now() NOT NULL,
  "report_shape" varchar(20) NOT NULL,
  "blocked_uri" varchar(2000),
  "violated_directive" varchar(200),
  "document_uri" varchar(2000),
  "source_file" varchar(2000),
  "line_number" varchar(20),
  "raw_payload" json NOT NULL,
  "user_agent" varchar(500),
  "ip_address" varchar(50)
);

CREATE INDEX IF NOT EXISTS "csp_reports_received_at_idx" ON "csp_reports" ("received_at");
CREATE INDEX IF NOT EXISTS "csp_reports_violated_directive_idx" ON "csp_reports" ("violated_directive");
CREATE INDEX IF NOT EXISTS "csp_reports_directive_received_at_idx" ON "csp_reports" ("violated_directive", "received_at");
