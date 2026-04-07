CREATE TYPE "public"."attachment_type" AS ENUM('inspection_report', 'history_card', 'other');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('pending_approval', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."request_type" AS ENUM('create', 'update', 'delete');--> statement-breakpoint
CREATE TYPE "public"."equipment_status" AS ENUM('available', 'in_use', 'checked_out', 'calibration_scheduled', 'calibration_overdue', 'non_conforming', 'spare', 'retired', 'pending_disposal', 'disposed', 'temporary', 'inactive');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	"user_name" varchar(100) NOT NULL,
	"user_role" varchar(50) NOT NULL,
	"action" varchar(50) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"entity_name" varchar(200),
	"details" json,
	"ip_address" varchar(50),
	"user_site" varchar(10),
	"user_team_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cable_loss_data_points" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"measurement_id" uuid NOT NULL,
	"frequency_mhz" integer NOT NULL,
	"loss_db" varchar(20) NOT NULL,
	CONSTRAINT "cable_loss_data_points_measurement_freq_unique" UNIQUE("measurement_id","frequency_mhz")
);
--> statement-breakpoint
CREATE TABLE "cable_loss_measurements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cable_id" uuid NOT NULL,
	"measurement_date" timestamp NOT NULL,
	"measured_by" uuid,
	"measurement_equipment_id" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"management_number" varchar(20) NOT NULL,
	"length" varchar(20),
	"connector_type" varchar(20),
	"frequency_range_min" integer,
	"frequency_range_max" integer,
	"serial_number" varchar(100),
	"location" varchar(50),
	"site" varchar(10),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"last_measurement_date" timestamp,
	"measured_by" uuid,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calibration_factors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipment_id" uuid NOT NULL,
	"calibration_id" uuid,
	"factor_type" varchar(50) NOT NULL,
	"factor_name" varchar(200) NOT NULL,
	"factor_value" numeric(15, 6) NOT NULL,
	"unit" varchar(20) NOT NULL,
	"parameters" jsonb,
	"effective_date" date NOT NULL,
	"expiry_date" date,
	"approval_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"requested_by" uuid NOT NULL,
	"approved_by" uuid,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	"approver_comment" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "calibration_plan_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"equipment_id" uuid NOT NULL,
	"sequence_number" integer NOT NULL,
	"snapshot_validity_date" timestamp,
	"snapshot_calibration_cycle" integer,
	"snapshot_calibration_agency" varchar(100),
	"planned_calibration_date" timestamp,
	"planned_calibration_agency" varchar(100),
	"confirmed_by" uuid,
	"confirmed_at" timestamp,
	"actual_calibration_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calibration_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL,
	"site_id" varchar(20) NOT NULL,
	"team_id" uuid,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"created_by" uuid NOT NULL,
	"submitted_at" timestamp,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"review_comment" text,
	"approved_by" uuid,
	"approved_at" timestamp,
	"rejected_by" uuid,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"rejection_stage" varchar(20),
	"version" integer DEFAULT 1 NOT NULL,
	"cas_version" integer DEFAULT 1 NOT NULL,
	"parent_plan_id" uuid,
	"is_latest_version" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calibrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipment_id" uuid NOT NULL,
	"technician_id" uuid,
	"status" varchar(50) DEFAULT 'scheduled' NOT NULL,
	"calibration_date" timestamp NOT NULL,
	"completion_date" timestamp,
	"next_calibration_date" timestamp,
	"agency_name" varchar(100),
	"certificate_number" varchar(100),
	"certificate_path" varchar(500),
	"result" varchar(100),
	"cost" numeric(10, 2),
	"notes" text,
	"intermediate_check_date" date,
	"approval_status" varchar(50) DEFAULT 'pending_approval' NOT NULL,
	"registered_by" uuid,
	"approved_by" uuid,
	"registered_by_role" varchar(50),
	"registrar_comment" text,
	"approver_comment" text,
	"rejection_reason" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkout_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"checkout_id" uuid NOT NULL,
	"equipment_id" uuid NOT NULL,
	"condition_before" text,
	"condition_after" text,
	"inspection_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" uuid NOT NULL,
	"approver_id" uuid,
	"returner_id" uuid,
	"purpose" varchar(50) NOT NULL,
	"checkout_type" varchar(50) DEFAULT 'calibration' NOT NULL,
	"destination" varchar(255) NOT NULL,
	"lender_team_id" uuid,
	"lender_site_id" varchar(50),
	"phone_number" varchar(50),
	"address" text,
	"reason" text NOT NULL,
	"checkout_date" timestamp,
	"expected_return_date" timestamp NOT NULL,
	"actual_return_date" timestamp,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"approved_at" timestamp,
	"rejection_reason" text,
	"calibration_checked" boolean DEFAULT false,
	"repair_checked" boolean DEFAULT false,
	"working_status_checked" boolean DEFAULT false,
	"inspection_notes" text,
	"return_approved_by" uuid,
	"return_approved_at" timestamp,
	"lender_confirmed_by" uuid,
	"lender_confirmed_at" timestamp,
	"lender_confirm_notes" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "condition_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"checkout_id" uuid NOT NULL,
	"step" varchar(50) NOT NULL,
	"checked_by" uuid NOT NULL,
	"checked_at" timestamp DEFAULT now() NOT NULL,
	"appearance_status" varchar(20) NOT NULL,
	"operation_status" varchar(20) NOT NULL,
	"accessories_status" varchar(20),
	"abnormal_details" text,
	"comparison_with_previous" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disposal_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipment_id" uuid NOT NULL,
	"reason" varchar(50) NOT NULL,
	"reason_detail" text NOT NULL,
	"requested_by" uuid NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"review_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"review_opinion" text,
	"approved_by" uuid,
	"approved_at" timestamp,
	"approval_comment" text,
	"rejected_by" uuid,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"rejection_step" varchar(20),
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipment_id" uuid,
	"calibration_id" uuid,
	"request_id" uuid,
	"software_validation_id" uuid,
	"document_type" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"original_file_name" varchar(255) NOT NULL,
	"file_path" text NOT NULL,
	"file_size" bigint NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_hash" varchar(64),
	"revision_number" integer DEFAULT 1 NOT NULL,
	"parent_document_id" uuid,
	"is_latest" boolean DEFAULT true NOT NULL,
	"description" text,
	"uploaded_by" uuid,
	"retention_period" varchar(20),
	"retention_expires_at" timestamp,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipment_id" uuid,
	"request_id" uuid,
	"attachment_type" "attachment_type" NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"original_file_name" varchar(255) NOT NULL,
	"file_path" text NOT NULL,
	"file_size" bigint NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"description" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "equipment_imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_type" varchar(30) DEFAULT 'rental' NOT NULL,
	"requester_id" uuid NOT NULL,
	"site" varchar(20) NOT NULL,
	"team_id" uuid NOT NULL,
	"equipment_name" varchar(100) NOT NULL,
	"model_name" varchar(100),
	"manufacturer" varchar(100),
	"serial_number" varchar(100),
	"description" text,
	"classification" varchar(50) NOT NULL,
	"vendor_name" varchar(100),
	"vendor_contact" varchar(100),
	"external_identifier" varchar(100),
	"owner_department" varchar(100),
	"internal_contact" varchar(100),
	"borrowing_justification" text,
	"usage_period_start" timestamp NOT NULL,
	"usage_period_end" timestamp NOT NULL,
	"reason" text NOT NULL,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"approver_id" uuid,
	"approved_at" timestamp,
	"rejection_reason" text,
	"received_by" uuid,
	"received_at" timestamp,
	"receiving_condition" jsonb,
	"equipment_id" uuid,
	"return_checkout_id" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_incident_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipment_id" uuid NOT NULL,
	"occurred_at" timestamp NOT NULL,
	"incident_type" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"reported_by" uuid,
	"non_conformance_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_location_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipment_id" uuid NOT NULL,
	"changed_at" timestamp NOT NULL,
	"previous_location" varchar(100),
	"new_location" varchar(100) NOT NULL,
	"notes" text,
	"changed_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_maintenance_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipment_id" uuid NOT NULL,
	"performed_at" timestamp NOT NULL,
	"content" text NOT NULL,
	"performed_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_type" "request_type" NOT NULL,
	"equipment_id" uuid,
	"requested_by" uuid NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"approval_status" "approval_status" DEFAULT 'pending_approval' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"rejection_reason" text,
	"request_data" jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "equipment_self_inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipment_id" uuid NOT NULL,
	"inspection_date" timestamp NOT NULL,
	"inspector_id" uuid NOT NULL,
	"appearance" varchar(10) NOT NULL,
	"functionality" varchar(10) NOT NULL,
	"safety" varchar(10) NOT NULL,
	"calibration_status" varchar(10) NOT NULL,
	"overall_result" varchar(10) NOT NULL,
	"remarks" text,
	"inspection_cycle" integer DEFAULT 6 NOT NULL,
	"next_inspection_date" date,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"confirmed_by" uuid,
	"confirmed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_test_software" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipment_id" uuid NOT NULL,
	"test_software_id" uuid NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"management_number" varchar(50) NOT NULL,
	"site_code" varchar(3),
	"classification_code" varchar(1),
	"management_serial_number" integer,
	"asset_number" varchar(50),
	"model_name" varchar(100),
	"manufacturer" varchar(100),
	"manufacturer_contact" varchar(100),
	"serial_number" varchar(100),
	"description" text,
	"location" varchar(100),
	"spec_match" varchar(20),
	"calibration_required" varchar(20),
	"initial_location" varchar(100),
	"installation_date" timestamp,
	"calibration_cycle" integer,
	"last_calibration_date" timestamp,
	"next_calibration_date" timestamp,
	"calibration_agency" varchar(100),
	"needs_intermediate_check" boolean DEFAULT false,
	"calibration_method" varchar(50),
	"last_intermediate_check_date" timestamp,
	"intermediate_check_cycle" integer,
	"next_intermediate_check_date" timestamp,
	"team_id" uuid,
	"manager_id" uuid,
	"site" varchar(20) NOT NULL,
	"purchase_year" integer,
	"price" integer,
	"supplier" varchar(100),
	"contact_info" varchar(100),
	"firmware_version" varchar(50),
	"manual_location" text,
	"accessories" text,
	"technical_manager" varchar(100),
	"status" varchar(50) DEFAULT 'available' NOT NULL,
	"is_active" boolean DEFAULT true,
	"approval_status" varchar(50) DEFAULT 'approved',
	"requested_by" varchar(36),
	"approved_by" varchar(36),
	"equipment_type" varchar(50),
	"calibration_result" text,
	"correction_factor" varchar(50),
	"intermediate_check_schedule" timestamp,
	"repair_history" text,
	"is_shared" boolean DEFAULT false NOT NULL,
	"shared_source" varchar(50),
	"owner" varchar(100),
	"external_identifier" varchar(100),
	"usage_period_start" timestamp,
	"usage_period_end" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "equipment_management_number_unique" UNIQUE("management_number")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"classification" varchar(50) NOT NULL,
	"site" varchar(20) NOT NULL,
	"classification_code" varchar(1),
	"description" varchar(255),
	"leader_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"role" varchar(50) DEFAULT 'test_engineer' NOT NULL,
	"team_id" uuid,
	"azure_ad_id" varchar(255),
	"site" varchar(20),
	"location" varchar(50),
	"position" varchar(100),
	"department" varchar(100),
	"phone_number" varchar(20),
	"employee_id" varchar(50),
	"manager_name" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "non_conformances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipment_id" uuid NOT NULL,
	"discovery_date" date NOT NULL,
	"discovered_by" uuid,
	"cause" text NOT NULL,
	"nc_type" varchar(50) NOT NULL,
	"resolution_type" varchar(50),
	"repair_history_id" uuid,
	"calibration_id" uuid,
	"action_plan" text,
	"correction_content" text,
	"correction_date" date,
	"corrected_by" uuid,
	"status" varchar(20) DEFAULT 'open' NOT NULL,
	"closed_by" uuid,
	"closed_at" timestamp,
	"closure_notes" text,
	"rejected_by" uuid,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "test_software" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"management_number" varchar(20) NOT NULL,
	"name" varchar(200) NOT NULL,
	"software_version" varchar(100),
	"test_field" varchar(10) NOT NULL,
	"manufacturer" varchar(200),
	"location" varchar(50),
	"primary_manager_id" uuid,
	"secondary_manager_id" uuid,
	"installed_at" timestamp,
	"availability" varchar(20) DEFAULT 'available' NOT NULL,
	"requires_validation" boolean DEFAULT true NOT NULL,
	"site" varchar(10),
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "software_validations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_software_id" uuid NOT NULL,
	"validation_type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"software_version" varchar(100),
	"test_date" timestamp,
	"info_date" timestamp,
	"software_author" varchar(200),
	"vendor_name" varchar(200),
	"vendor_summary" text,
	"received_by" uuid,
	"received_date" timestamp,
	"attachment_note" text,
	"reference_documents" text,
	"operating_unit_description" text,
	"software_components" text,
	"hardware_components" text,
	"acquisition_functions" jsonb,
	"processing_functions" jsonb,
	"control_functions" jsonb,
	"performed_by" uuid,
	"submitted_at" timestamp,
	"submitted_by" uuid,
	"technical_approver_id" uuid,
	"technical_approved_at" timestamp,
	"quality_approver_id" uuid,
	"quality_approved_at" timestamp,
	"rejected_by" uuid,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repair_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipment_id" uuid NOT NULL,
	"repair_date" timestamp NOT NULL,
	"repair_description" text NOT NULL,
	"repair_result" varchar(50),
	"notes" text,
	"attachment_path" varchar(500),
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"deleted_by" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"in_app_enabled" boolean DEFAULT true NOT NULL,
	"email_enabled" boolean DEFAULT false NOT NULL,
	"checkout_enabled" boolean DEFAULT true NOT NULL,
	"calibration_enabled" boolean DEFAULT true NOT NULL,
	"non_conformance_enabled" boolean DEFAULT true NOT NULL,
	"disposal_enabled" boolean DEFAULT true NOT NULL,
	"equipment_import_enabled" boolean DEFAULT true NOT NULL,
	"equipment_enabled" boolean DEFAULT true NOT NULL,
	"system_enabled" boolean DEFAULT true NOT NULL,
	"calibration_plan_enabled" boolean DEFAULT true NOT NULL,
	"frequency" varchar(20) DEFAULT 'immediate' NOT NULL,
	"digest_time" varchar(5) DEFAULT '09:00' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"category" varchar(50) NOT NULL,
	"priority" varchar(10) DEFAULT 'medium' NOT NULL,
	"recipient_id" uuid,
	"team_id" uuid,
	"is_system_wide" boolean DEFAULT false NOT NULL,
	"equipment_id" uuid,
	"entity_type" varchar(50),
	"entity_id" uuid,
	"link_url" varchar(300),
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"actor_id" uuid,
	"actor_name" varchar(100),
	"recipient_site" varchar(20),
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" varchar(50) NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" jsonb NOT NULL,
	"site" varchar(20),
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "intermediate_inspection_equipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inspection_id" uuid NOT NULL,
	"equipment_id" uuid NOT NULL,
	"calibration_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "intermediate_inspection_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inspection_id" uuid NOT NULL,
	"item_number" integer NOT NULL,
	"check_item" varchar(300) NOT NULL,
	"check_criteria" varchar(300),
	"check_result" varchar(300),
	"judgment" varchar(10)
);
--> statement-breakpoint
CREATE TABLE "intermediate_inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"calibration_id" uuid NOT NULL,
	"equipment_id" uuid NOT NULL,
	"inspection_date" timestamp NOT NULL,
	"inspector_id" uuid NOT NULL,
	"classification" varchar(20),
	"inspection_cycle" varchar(20),
	"calibration_validity_period" varchar(50),
	"overall_result" varchar(20),
	"remarks" text,
	"approval_status" varchar(20) DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp,
	"submitted_by" uuid,
	"reviewed_at" timestamp,
	"reviewed_by" uuid,
	"approved_at" timestamp,
	"approved_by" uuid,
	"rejected_at" timestamp,
	"rejected_by" uuid,
	"rejection_reason" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cable_loss_data_points" ADD CONSTRAINT "cable_loss_data_points_measurement_id_cable_loss_measurements_id_fk" FOREIGN KEY ("measurement_id") REFERENCES "public"."cable_loss_measurements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cable_loss_measurements" ADD CONSTRAINT "cable_loss_measurements_cable_id_cables_id_fk" FOREIGN KEY ("cable_id") REFERENCES "public"."cables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cable_loss_measurements" ADD CONSTRAINT "cable_loss_measurements_measured_by_users_id_fk" FOREIGN KEY ("measured_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cable_loss_measurements" ADD CONSTRAINT "cable_loss_measurements_measurement_equipment_id_equipment_id_fk" FOREIGN KEY ("measurement_equipment_id") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cables" ADD CONSTRAINT "cables_measured_by_users_id_fk" FOREIGN KEY ("measured_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cables" ADD CONSTRAINT "cables_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calibration_factors" ADD CONSTRAINT "calibration_factors_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calibration_factors" ADD CONSTRAINT "calibration_factors_calibration_id_calibrations_id_fk" FOREIGN KEY ("calibration_id") REFERENCES "public"."calibrations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calibration_plan_items" ADD CONSTRAINT "calibration_plan_items_plan_id_calibration_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."calibration_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calibration_plan_items" ADD CONSTRAINT "calibration_plan_items_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calibration_plan_items" ADD CONSTRAINT "calibration_plan_items_confirmed_by_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calibration_plans" ADD CONSTRAINT "calibration_plans_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calibration_plans" ADD CONSTRAINT "calibration_plans_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calibration_plans" ADD CONSTRAINT "calibration_plans_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calibration_plans" ADD CONSTRAINT "calibration_plans_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calibrations" ADD CONSTRAINT "calibrations_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calibrations" ADD CONSTRAINT "calibrations_technician_id_users_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_items" ADD CONSTRAINT "checkout_items_checkout_id_checkouts_id_fk" FOREIGN KEY ("checkout_id") REFERENCES "public"."checkouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout_items" ADD CONSTRAINT "checkout_items_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkouts" ADD CONSTRAINT "checkouts_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkouts" ADD CONSTRAINT "checkouts_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkouts" ADD CONSTRAINT "checkouts_returner_id_users_id_fk" FOREIGN KEY ("returner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkouts" ADD CONSTRAINT "checkouts_return_approved_by_users_id_fk" FOREIGN KEY ("return_approved_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkouts" ADD CONSTRAINT "checkouts_lender_confirmed_by_users_id_fk" FOREIGN KEY ("lender_confirmed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "condition_checks" ADD CONSTRAINT "condition_checks_checkout_id_checkouts_id_fk" FOREIGN KEY ("checkout_id") REFERENCES "public"."checkouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "condition_checks" ADD CONSTRAINT "condition_checks_checked_by_users_id_fk" FOREIGN KEY ("checked_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disposal_requests" ADD CONSTRAINT "disposal_requests_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disposal_requests" ADD CONSTRAINT "disposal_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disposal_requests" ADD CONSTRAINT "disposal_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disposal_requests" ADD CONSTRAINT "disposal_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disposal_requests" ADD CONSTRAINT "disposal_requests_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_calibration_id_calibrations_id_fk" FOREIGN KEY ("calibration_id") REFERENCES "public"."calibrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_request_id_equipment_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."equipment_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_software_validation_id_software_validations_id_fk" FOREIGN KEY ("software_validation_id") REFERENCES "public"."software_validations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_parent_document_id_documents_id_fk" FOREIGN KEY ("parent_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_attachments" ADD CONSTRAINT "equipment_attachments_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_attachments" ADD CONSTRAINT "equipment_attachments_request_id_equipment_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."equipment_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_imports" ADD CONSTRAINT "equipment_imports_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_imports" ADD CONSTRAINT "equipment_imports_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_imports" ADD CONSTRAINT "equipment_imports_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_imports" ADD CONSTRAINT "equipment_imports_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_imports" ADD CONSTRAINT "equipment_imports_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_imports" ADD CONSTRAINT "equipment_imports_return_checkout_id_checkouts_id_fk" FOREIGN KEY ("return_checkout_id") REFERENCES "public"."checkouts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_incident_history" ADD CONSTRAINT "equipment_incident_history_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_incident_history" ADD CONSTRAINT "equipment_incident_history_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_incident_history" ADD CONSTRAINT "equipment_incident_history_non_conformance_id_non_conformances_id_fk" FOREIGN KEY ("non_conformance_id") REFERENCES "public"."non_conformances"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_location_history" ADD CONSTRAINT "equipment_location_history_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_location_history" ADD CONSTRAINT "equipment_location_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_maintenance_history" ADD CONSTRAINT "equipment_maintenance_history_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_maintenance_history" ADD CONSTRAINT "equipment_maintenance_history_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_requests" ADD CONSTRAINT "equipment_requests_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_requests" ADD CONSTRAINT "equipment_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_requests" ADD CONSTRAINT "equipment_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_self_inspections" ADD CONSTRAINT "equipment_self_inspections_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_self_inspections" ADD CONSTRAINT "equipment_self_inspections_inspector_id_users_id_fk" FOREIGN KEY ("inspector_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_self_inspections" ADD CONSTRAINT "equipment_self_inspections_confirmed_by_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_test_software" ADD CONSTRAINT "equipment_test_software_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_test_software" ADD CONSTRAINT "equipment_test_software_test_software_id_test_software_id_fk" FOREIGN KEY ("test_software_id") REFERENCES "public"."test_software"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_manager_id_users_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_leader_id_users_id_fk" FOREIGN KEY ("leader_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "non_conformances" ADD CONSTRAINT "non_conformances_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_software" ADD CONSTRAINT "test_software_primary_manager_id_users_id_fk" FOREIGN KEY ("primary_manager_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_software" ADD CONSTRAINT "test_software_secondary_manager_id_users_id_fk" FOREIGN KEY ("secondary_manager_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "test_software" ADD CONSTRAINT "test_software_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "software_validations" ADD CONSTRAINT "software_validations_test_software_id_test_software_id_fk" FOREIGN KEY ("test_software_id") REFERENCES "public"."test_software"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "software_validations" ADD CONSTRAINT "software_validations_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "software_validations" ADD CONSTRAINT "software_validations_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "software_validations" ADD CONSTRAINT "software_validations_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "software_validations" ADD CONSTRAINT "software_validations_technical_approver_id_users_id_fk" FOREIGN KEY ("technical_approver_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "software_validations" ADD CONSTRAINT "software_validations_quality_approver_id_users_id_fk" FOREIGN KEY ("quality_approver_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "software_validations" ADD CONSTRAINT "software_validations_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "software_validations" ADD CONSTRAINT "software_validations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_history" ADD CONSTRAINT "repair_history_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intermediate_inspection_equipment" ADD CONSTRAINT "intermediate_inspection_equipment_inspection_id_intermediate_inspections_id_fk" FOREIGN KEY ("inspection_id") REFERENCES "public"."intermediate_inspections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intermediate_inspection_equipment" ADD CONSTRAINT "intermediate_inspection_equipment_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intermediate_inspection_items" ADD CONSTRAINT "intermediate_inspection_items_inspection_id_intermediate_inspections_id_fk" FOREIGN KEY ("inspection_id") REFERENCES "public"."intermediate_inspections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intermediate_inspections" ADD CONSTRAINT "intermediate_inspections_calibration_id_calibrations_id_fk" FOREIGN KEY ("calibration_id") REFERENCES "public"."calibrations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intermediate_inspections" ADD CONSTRAINT "intermediate_inspections_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intermediate_inspections" ADD CONSTRAINT "intermediate_inspections_inspector_id_users_id_fk" FOREIGN KEY ("inspector_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intermediate_inspections" ADD CONSTRAINT "intermediate_inspections_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intermediate_inspections" ADD CONSTRAINT "intermediate_inspections_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intermediate_inspections" ADD CONSTRAINT "intermediate_inspections_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intermediate_inspections" ADD CONSTRAINT "intermediate_inspections_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intermediate_inspections" ADD CONSTRAINT "intermediate_inspections_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_entity_type_timestamp_idx" ON "audit_logs" USING btree ("entity_type","timestamp");--> statement-breakpoint
CREATE INDEX "audit_logs_action_timestamp_idx" ON "audit_logs" USING btree ("action","timestamp");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_id_idx" ON "audit_logs" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_timestamp_idx" ON "audit_logs" USING btree ("user_id","timestamp");--> statement-breakpoint
CREATE INDEX "audit_logs_user_site_timestamp_idx" ON "audit_logs" USING btree ("user_site","timestamp");--> statement-breakpoint
CREATE INDEX "audit_logs_user_team_id_timestamp_idx" ON "audit_logs" USING btree ("user_team_id","timestamp");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "cable_loss_data_points_measurement_id_idx" ON "cable_loss_data_points" USING btree ("measurement_id");--> statement-breakpoint
CREATE INDEX "cable_loss_measurements_cable_id_idx" ON "cable_loss_measurements" USING btree ("cable_id");--> statement-breakpoint
CREATE INDEX "cable_loss_measurements_measurement_date_idx" ON "cable_loss_measurements" USING btree ("measurement_date");--> statement-breakpoint
CREATE INDEX "cables_management_number_idx" ON "cables" USING btree ("management_number");--> statement-breakpoint
CREATE INDEX "cables_status_idx" ON "cables" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cables_site_idx" ON "cables" USING btree ("site");--> statement-breakpoint
CREATE INDEX "cables_measured_by_idx" ON "cables" USING btree ("measured_by");--> statement-breakpoint
CREATE INDEX "cables_created_by_idx" ON "cables" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "calibration_factors_equipment_id_idx" ON "calibration_factors" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "calibration_factors_approval_status_idx" ON "calibration_factors" USING btree ("approval_status");--> statement-breakpoint
CREATE INDEX "calibration_factors_calibration_id_idx" ON "calibration_factors" USING btree ("calibration_id");--> statement-breakpoint
CREATE INDEX "calibration_factors_equipment_approved_idx" ON "calibration_factors" USING btree ("equipment_id","approval_status","effective_date");--> statement-breakpoint
CREATE INDEX "calibration_factors_effective_date_idx" ON "calibration_factors" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX "calibration_factors_deleted_at_idx" ON "calibration_factors" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "calibration_plan_items_plan_id_idx" ON "calibration_plan_items" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "calibration_plan_items_equipment_id_idx" ON "calibration_plan_items" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "calibration_plan_items_sequence_number_idx" ON "calibration_plan_items" USING btree ("sequence_number");--> statement-breakpoint
CREATE INDEX "calibration_plan_items_plan_equipment_idx" ON "calibration_plan_items" USING btree ("plan_id","equipment_id");--> statement-breakpoint
CREATE INDEX "calibration_plans_year_site_version_idx" ON "calibration_plans" USING btree ("year","site_id","is_latest_version");--> statement-breakpoint
CREATE INDEX "calibration_plans_year_idx" ON "calibration_plans" USING btree ("year");--> statement-breakpoint
CREATE INDEX "calibration_plans_site_id_idx" ON "calibration_plans" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "calibration_plans_status_idx" ON "calibration_plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "calibration_plans_created_by_idx" ON "calibration_plans" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "calibration_plans_parent_plan_id_idx" ON "calibration_plans" USING btree ("parent_plan_id");--> statement-breakpoint
CREATE INDEX "calibration_plans_is_latest_version_idx" ON "calibration_plans" USING btree ("is_latest_version");--> statement-breakpoint
CREATE INDEX "calibrations_status_idx" ON "calibrations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "calibrations_approval_status_idx" ON "calibrations" USING btree ("approval_status");--> statement-breakpoint
CREATE INDEX "calibrations_next_calibration_date_idx" ON "calibrations" USING btree ("next_calibration_date");--> statement-breakpoint
CREATE INDEX "calibrations_calibration_date_idx" ON "calibrations" USING btree ("calibration_date");--> statement-breakpoint
CREATE INDEX "calibrations_registered_by_idx" ON "calibrations" USING btree ("registered_by");--> statement-breakpoint
CREATE INDEX "calibrations_equipment_approval_idx" ON "calibrations" USING btree ("equipment_id","approval_status");--> statement-breakpoint
CREATE INDEX "checkout_items_checkout_id_idx" ON "checkout_items" USING btree ("checkout_id");--> statement-breakpoint
CREATE INDEX "checkout_items_equipment_id_idx" ON "checkout_items" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "checkouts_id_version_idx" ON "checkouts" USING btree ("id","version");--> statement-breakpoint
CREATE INDEX "checkouts_requester_id_idx" ON "checkouts" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "checkouts_status_idx" ON "checkouts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "checkouts_status_created_at_idx" ON "checkouts" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "checkouts_status_expected_return_idx" ON "checkouts" USING btree ("status","expected_return_date");--> statement-breakpoint
CREATE INDEX "checkouts_lender_team_id_idx" ON "checkouts" USING btree ("lender_team_id");--> statement-breakpoint
CREATE INDEX "condition_checks_checkout_id_idx" ON "condition_checks" USING btree ("checkout_id");--> statement-breakpoint
CREATE INDEX "condition_checks_checked_by_idx" ON "condition_checks" USING btree ("checked_by");--> statement-breakpoint
CREATE INDEX "disposal_requests_equipment_id_idx" ON "disposal_requests" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "disposal_requests_review_status_idx" ON "disposal_requests" USING btree ("review_status");--> statement-breakpoint
CREATE INDEX "disposal_requests_requested_by_idx" ON "disposal_requests" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "disposal_requests_reviewed_by_idx" ON "disposal_requests" USING btree ("reviewed_by");--> statement-breakpoint
CREATE INDEX "disposal_requests_approved_by_idx" ON "disposal_requests" USING btree ("approved_by");--> statement-breakpoint
CREATE INDEX "disposal_requests_requested_at_idx" ON "disposal_requests" USING btree ("requested_at");--> statement-breakpoint
CREATE INDEX "disposal_requests_id_version_idx" ON "disposal_requests" USING btree ("id","version");--> statement-breakpoint
CREATE INDEX "documents_equipment_id_idx" ON "documents" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "documents_calibration_id_idx" ON "documents" USING btree ("calibration_id");--> statement-breakpoint
CREATE INDEX "documents_request_id_idx" ON "documents" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "documents_document_type_idx" ON "documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "documents_parent_document_id_idx" ON "documents" USING btree ("parent_document_id");--> statement-breakpoint
CREATE INDEX "documents_calibration_type_idx" ON "documents" USING btree ("calibration_id","document_type");--> statement-breakpoint
CREATE INDEX "documents_equipment_type_idx" ON "documents" USING btree ("equipment_id","document_type");--> statement-breakpoint
CREATE INDEX "documents_software_validation_id_idx" ON "documents" USING btree ("software_validation_id");--> statement-breakpoint
CREATE INDEX "documents_software_validation_type_idx" ON "documents" USING btree ("software_validation_id","document_type");--> statement-breakpoint
CREATE INDEX "documents_status_idx" ON "documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "documents_status_updated_at_idx" ON "documents" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "documents_retention_expires_at_idx" ON "documents" USING btree ("retention_expires_at");--> statement-breakpoint
CREATE INDEX "equipment_attachments_equipment_id_idx" ON "equipment_attachments" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "equipment_attachments_request_id_idx" ON "equipment_attachments" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "equipment_attachments_attachment_type_idx" ON "equipment_attachments" USING btree ("attachment_type");--> statement-breakpoint
CREATE INDEX "equipment_attachments_equipment_type_idx" ON "equipment_attachments" USING btree ("equipment_id","attachment_type");--> statement-breakpoint
CREATE INDEX "equipment_imports_status_idx" ON "equipment_imports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "equipment_imports_requester_id_idx" ON "equipment_imports" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "equipment_imports_team_id_idx" ON "equipment_imports" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "equipment_imports_site_idx" ON "equipment_imports" USING btree ("site");--> statement-breakpoint
CREATE INDEX "equipment_imports_created_at_idx" ON "equipment_imports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "equipment_imports_source_type_idx" ON "equipment_imports" USING btree ("source_type");--> statement-breakpoint
CREATE INDEX "equipment_imports_status_source_type_idx" ON "equipment_imports" USING btree ("status","source_type");--> statement-breakpoint
CREATE INDEX "incident_history_equipment_id_idx" ON "equipment_incident_history" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "incident_history_nc_id_idx" ON "equipment_incident_history" USING btree ("non_conformance_id");--> statement-breakpoint
CREATE INDEX "equipment_location_history_equipment_id_idx" ON "equipment_location_history" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "equipment_location_history_changed_at_idx" ON "equipment_location_history" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX "equipment_location_history_equipment_changed_at_idx" ON "equipment_location_history" USING btree ("equipment_id","changed_at");--> statement-breakpoint
CREATE INDEX "maintenance_history_equipment_performed_at_idx" ON "equipment_maintenance_history" USING btree ("equipment_id","performed_at");--> statement-breakpoint
CREATE INDEX "maintenance_history_performed_at_idx" ON "equipment_maintenance_history" USING btree ("performed_at");--> statement-breakpoint
CREATE INDEX "equipment_requests_request_type_idx" ON "equipment_requests" USING btree ("request_type");--> statement-breakpoint
CREATE INDEX "equipment_requests_approval_status_idx" ON "equipment_requests" USING btree ("approval_status");--> statement-breakpoint
CREATE INDEX "equipment_requests_requested_by_idx" ON "equipment_requests" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "equipment_requests_approved_by_idx" ON "equipment_requests" USING btree ("approved_by");--> statement-breakpoint
CREATE INDEX "equipment_requests_equipment_id_idx" ON "equipment_requests" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "equipment_requests_status_type_idx" ON "equipment_requests" USING btree ("approval_status","request_type");--> statement-breakpoint
CREATE INDEX "equipment_requests_id_version_idx" ON "equipment_requests" USING btree ("id","version");--> statement-breakpoint
CREATE INDEX "self_inspections_equipment_id_idx" ON "equipment_self_inspections" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "self_inspections_inspection_date_idx" ON "equipment_self_inspections" USING btree ("inspection_date");--> statement-breakpoint
CREATE INDEX "self_inspections_next_inspection_date_idx" ON "equipment_self_inspections" USING btree ("next_inspection_date");--> statement-breakpoint
CREATE INDEX "self_inspections_status_idx" ON "equipment_self_inspections" USING btree ("status");--> statement-breakpoint
CREATE INDEX "self_inspections_inspector_id_idx" ON "equipment_self_inspections" USING btree ("inspector_id");--> statement-breakpoint
CREATE UNIQUE INDEX "equipment_test_software_unique_idx" ON "equipment_test_software" USING btree ("equipment_id","test_software_id");--> statement-breakpoint
CREATE INDEX "equipment_status_idx" ON "equipment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "equipment_location_idx" ON "equipment" USING btree ("location");--> statement-breakpoint
CREATE INDEX "equipment_manufacturer_idx" ON "equipment" USING btree ("manufacturer");--> statement-breakpoint
CREATE INDEX "equipment_team_id_idx" ON "equipment" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "equipment_manager_id_idx" ON "equipment" USING btree ("manager_id");--> statement-breakpoint
CREATE INDEX "equipment_site_idx" ON "equipment" USING btree ("site");--> statement-breakpoint
CREATE INDEX "equipment_next_calibration_date_idx" ON "equipment" USING btree ("next_calibration_date");--> statement-breakpoint
CREATE INDEX "equipment_model_name_idx" ON "equipment" USING btree ("model_name");--> statement-breakpoint
CREATE INDEX "equipment_is_active_idx" ON "equipment" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "equipment_name_search_idx" ON "equipment" USING btree ("name");--> statement-breakpoint
CREATE INDEX "equipment_team_status_idx" ON "equipment" USING btree ("team_id","status");--> statement-breakpoint
CREATE INDEX "equipment_calibration_due_idx" ON "equipment" USING btree ("is_active","next_calibration_date");--> statement-breakpoint
CREATE INDEX "equipment_is_shared_idx" ON "equipment" USING btree ("is_shared");--> statement-breakpoint
CREATE INDEX "equipment_site_code_idx" ON "equipment" USING btree ("site_code");--> statement-breakpoint
CREATE INDEX "equipment_classification_code_idx" ON "equipment" USING btree ("classification_code");--> statement-breakpoint
CREATE INDEX "equipment_approval_status_idx" ON "equipment" USING btree ("approval_status");--> statement-breakpoint
CREATE INDEX "teams_site_idx" ON "teams" USING btree ("site");--> statement-breakpoint
CREATE INDEX "teams_classification_idx" ON "teams" USING btree ("classification");--> statement-breakpoint
CREATE INDEX "users_site_idx" ON "users" USING btree ("site");--> statement-breakpoint
CREATE INDEX "users_team_id_idx" ON "users" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "users_is_active_idx" ON "users" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "users_role_site_idx" ON "users" USING btree ("role","site");--> statement-breakpoint
CREATE INDEX "users_azure_ad_id_idx" ON "users" USING btree ("azure_ad_id");--> statement-breakpoint
CREATE INDEX "non_conformances_equipment_id_idx" ON "non_conformances" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "non_conformances_status_idx" ON "non_conformances" USING btree ("status");--> statement-breakpoint
CREATE INDEX "non_conformances_discovery_date_idx" ON "non_conformances" USING btree ("discovery_date");--> statement-breakpoint
CREATE INDEX "non_conformances_equipment_status_idx" ON "non_conformances" USING btree ("equipment_id","status");--> statement-breakpoint
CREATE INDEX "non_conformances_nc_type_idx" ON "non_conformances" USING btree ("nc_type");--> statement-breakpoint
CREATE INDEX "non_conformances_resolution_type_idx" ON "non_conformances" USING btree ("resolution_type");--> statement-breakpoint
CREATE INDEX "non_conformances_repair_history_id_idx" ON "non_conformances" USING btree ("repair_history_id");--> statement-breakpoint
CREATE INDEX "non_conformances_deleted_at_idx" ON "non_conformances" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "non_conformances_created_at_idx" ON "non_conformances" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "non_conformances_equipment_nc_type_open_unique" ON "non_conformances" USING btree ("equipment_id","nc_type") WHERE status = 'open' AND deleted_at IS NULL;--> statement-breakpoint
CREATE INDEX "test_software_management_number_idx" ON "test_software" USING btree ("management_number");--> statement-breakpoint
CREATE INDEX "test_software_test_field_idx" ON "test_software" USING btree ("test_field");--> statement-breakpoint
CREATE INDEX "test_software_availability_idx" ON "test_software" USING btree ("availability");--> statement-breakpoint
CREATE INDEX "test_software_site_idx" ON "test_software" USING btree ("site");--> statement-breakpoint
CREATE INDEX "software_validations_test_software_id_idx" ON "software_validations" USING btree ("test_software_id");--> statement-breakpoint
CREATE INDEX "software_validations_status_idx" ON "software_validations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "software_validations_validation_type_idx" ON "software_validations" USING btree ("validation_type");--> statement-breakpoint
CREATE INDEX "repair_history_equipment_id_idx" ON "repair_history" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "repair_history_repair_date_idx" ON "repair_history" USING btree ("repair_date");--> statement-breakpoint
CREATE INDEX "repair_history_is_deleted_idx" ON "repair_history" USING btree ("is_deleted");--> statement-breakpoint
CREATE INDEX "repair_history_equipment_date_idx" ON "repair_history" USING btree ("equipment_id","repair_date");--> statement-breakpoint
CREATE INDEX "idx_notification_prefs_user" ON "notification_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_recipient_read_created" ON "notifications" USING btree ("recipient_id","is_read","created_at");--> statement-breakpoint
CREATE INDEX "idx_notifications_team_created" ON "notifications" USING btree ("team_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_notifications_system_created" ON "notifications" USING btree ("is_system_wide","created_at");--> statement-breakpoint
CREATE INDEX "idx_notifications_entity" ON "notifications" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_expires" ON "notifications" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_notifications_site_created" ON "notifications" USING btree ("recipient_site","created_at");--> statement-breakpoint
CREATE INDEX "idx_system_settings_lookup" ON "system_settings" USING btree ("category","site");--> statement-breakpoint
CREATE INDEX "intermediate_inspection_equipment_inspection_id_idx" ON "intermediate_inspection_equipment" USING btree ("inspection_id");--> statement-breakpoint
CREATE INDEX "intermediate_inspection_equipment_equipment_id_idx" ON "intermediate_inspection_equipment" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "intermediate_inspection_items_inspection_id_idx" ON "intermediate_inspection_items" USING btree ("inspection_id");--> statement-breakpoint
CREATE INDEX "intermediate_inspections_calibration_id_idx" ON "intermediate_inspections" USING btree ("calibration_id");--> statement-breakpoint
CREATE INDEX "intermediate_inspections_equipment_id_idx" ON "intermediate_inspections" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "intermediate_inspections_approval_status_idx" ON "intermediate_inspections" USING btree ("approval_status");--> statement-breakpoint
CREATE INDEX "intermediate_inspections_inspection_date_idx" ON "intermediate_inspections" USING btree ("inspection_date");--> statement-breakpoint
CREATE INDEX "intermediate_inspections_inspector_id_idx" ON "intermediate_inspections" USING btree ("inspector_id");--> statement-breakpoint
CREATE INDEX "intermediate_inspections_created_by_idx" ON "intermediate_inspections" USING btree ("created_by");