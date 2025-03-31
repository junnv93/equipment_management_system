CREATE TABLE IF NOT EXISTS "equipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"management_number" varchar(50) NOT NULL,
	"asset_number" varchar(50),
	"model_name" varchar(100),
	"manufacturer" varchar(100),
	"serial_number" varchar(100),
	"location" varchar(100),
	"calibration_cycle" integer,
	"last_calibration_date" timestamp,
	"next_calibration_date" timestamp,
	"calibration_agency" varchar(100),
	"needs_intermediate_check" boolean DEFAULT false,
	"calibration_method" varchar(50),
	"purchase_year" integer,
	"team_id" uuid,
	"manager_id" uuid,
	"supplier" varchar(100),
	"contact_info" varchar(100),
	"software_version" varchar(50),
	"firmware_version" varchar(50),
	"manual_location" text,
	"accessories" text,
	"main_features" text,
	"technical_manager" varchar(100),
	"status" varchar(50) DEFAULT 'available' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "equipment_management_number_unique" UNIQUE("management_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(50) NOT NULL,
	"description" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"team_id" uuid,
	"azure_ad_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipment_id" uuid NOT NULL,
	"borrower_id" uuid NOT NULL,
	"approver_id" uuid,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"loan_date" timestamp,
	"expected_return_date" timestamp NOT NULL,
	"actual_return_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
