CREATE TYPE "public"."card_side" AS ENUM('front', 'back');--> statement-breakpoint
CREATE TYPE "public"."certificate_status" AS ENUM('active', 'revoked', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."check_channel" AS ENUM('web', 'qr', 'nfc', 'api');--> statement-breakpoint
CREATE TYPE "public"."consent_kind" AS ENUM('terms', 'privacy', 'cookies', 'marketing');--> statement-breakpoint
CREATE TYPE "public"."contact_status" AS ENUM('open', 'answered', 'closed');--> statement-breakpoint
CREATE TYPE "public"."defect_category" AS ENUM('centering', 'corners', 'edges', 'surface');--> statement-breakpoint
CREATE TYPE "public"."defect_severity" AS ENUM('flawless', 'minor', 'moderate', 'critical');--> statement-breakpoint
CREATE TYPE "public"."event_kind" AS ENUM('fair', 'hub');--> statement-breakpoint
CREATE TYPE "public"."grading_result_status" AS ENUM('draft', 'pending_qa', 'approved', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."image_kind" AS ENUM('front', 'back', 'extra');--> statement-breakpoint
CREATE TYPE "public"."newsletter_status" AS ENUM('pending', 'confirmed', 'unsubscribed');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('DRAFT', 'SUBMITTED', 'PAYMENT_PENDING', 'PACKAGE_RECEIVED', 'PRE_INSPECTION', 'OPTICAL_GRADING', 'ENCAPSULATION', 'QUALITY_ASSURANCE', 'SHIPPED', 'DELIVERED', 'ON_HOLD', 'CANCELLED', 'RETURNED');--> statement-breakpoint
CREATE TYPE "public"."outbox_status" AS ENUM('pending', 'sending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('unpaid', 'pending', 'paid', 'failed', 'refunded', 'partially_refunded');--> statement-breakpoint
CREATE TYPE "public"."shipment_direction" AS ENUM('inbound', 'outbound');--> statement-breakpoint
CREATE TYPE "public"."shipping_method" AS ENUM('COURIER_INSURED', 'CARD_SHOW_DROPOFF', 'VAULT_STORE');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('customer', 'staff', 'grader', 'qa', 'admin');--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"line1" text NOT NULL,
	"line2" text,
	"city" text NOT NULL,
	"postal_code" text NOT NULL,
	"region" text,
	"country_code" text NOT NULL,
	"phone" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "addresses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "card_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game" text NOT NULL,
	"set_name" text NOT NULL,
	"card_number" text NOT NULL,
	"name" text NOT NULL,
	"language" text NOT NULL,
	"year" smallint,
	"rarity" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "card_identities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "certificate_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"certificate_number" text NOT NULL,
	"certificate_id" uuid,
	"channel" "check_channel" NOT NULL,
	"ip_hash" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "certificate_checks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" text NOT NULL,
	"slab_id" uuid NOT NULL,
	"grading_result_id" uuid NOT NULL,
	"card_identity_id" uuid NOT NULL,
	"status" "certificate_status" DEFAULT 'active' NOT NULL,
	"payload" jsonb NOT NULL,
	"signature" text,
	"key_id" text,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"issued_by" uuid,
	"revoked_at" timestamp with time zone,
	"revoked_reason" text,
	"superseded_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "certificates_number_unique" UNIQUE("number"),
	CONSTRAINT "certificates_revoked_has_reason" CHECK ("certificates"."status" <> 'revoked' or ("certificates"."revoked_at" is not null and "certificates"."revoked_reason" is not null))
);
--> statement-breakpoint
ALTER TABLE "certificates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"email" text,
	"kind" "consent_kind" NOT NULL,
	"version" text NOT NULL,
	"granted" boolean NOT NULL,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "consents_subject" CHECK ("consents"."user_id" is not null or "consents"."email" is not null)
);
--> statement-breakpoint
ALTER TABLE "consents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket" text NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"order_code" text,
	"status" "contact_status" DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contact_messages_ticket_unique" UNIQUE("ticket")
);
--> statement-breakpoint
ALTER TABLE "contact_messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "custody_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"from_status" "order_status",
	"to_status" "order_status" NOT NULL,
	"public_label" text NOT NULL,
	"public_description" text,
	"internal_note" text,
	"location" text,
	"actor_id" uuid,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "custody_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "email_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dedupe_key" text,
	"to_email" text NOT NULL,
	"template" text NOT NULL,
	"locale" text DEFAULT 'es' NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "outbox_status" DEFAULT 'pending' NOT NULL,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"provider_message_id" text,
	"last_error" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_outbox_dedupe_key_unique" UNIQUE("dedupe_key")
);
--> statement-breakpoint
ALTER TABLE "email_outbox" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "event_kind" NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"country_code" text NOT NULL,
	"venue" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"accepts_submissions" boolean DEFAULT true NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "grading_defects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grading_result_id" uuid NOT NULL,
	"side" "card_side" NOT NULL,
	"category" "defect_category" NOT NULL,
	"severity" "defect_severity" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"x" numeric(5, 2) NOT NULL,
	"y" numeric(5, 2) NOT NULL,
	"deduction" numeric(3, 2) DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grading_defects_coords" CHECK ("grading_defects"."x" between 0 and 100 and "grading_defects"."y" between 0 and 100)
);
--> statement-breakpoint
ALTER TABLE "grading_defects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "grading_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_item_id" uuid NOT NULL,
	"version" smallint DEFAULT 1 NOT NULL,
	"status" "grading_result_status" DEFAULT 'draft' NOT NULL,
	"is_authentic" boolean NOT NULL,
	"final_grade" numeric(3, 1),
	"grade_label" text,
	"centering_score" numeric(3, 1),
	"centering_front_ratio" text,
	"centering_back_ratio" text,
	"centering_notes" text,
	"corners_score" numeric(3, 1),
	"corners_front_score" numeric(3, 1),
	"corners_back_score" numeric(3, 1),
	"corners_notes" text,
	"edges_score" numeric(3, 1),
	"edges_front_score" numeric(3, 1),
	"edges_back_score" numeric(3, 1),
	"edges_notes" text,
	"surface_score" numeric(3, 1),
	"surface_front_score" numeric(3, 1),
	"surface_back_score" numeric(3, 1),
	"surface_notes" text,
	"station" text,
	"graded_by" uuid NOT NULL,
	"graded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"qa_approved_by" uuid,
	"qa_approved_at" timestamp with time zone,
	"superseded_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grading_results_double_signature" CHECK ("grading_results"."qa_approved_by" is null or "grading_results"."qa_approved_by" <> "grading_results"."graded_by"),
	CONSTRAINT "grading_results_approved_has_qa" CHECK ("grading_results"."status" <> 'approved' or ("grading_results"."qa_approved_by" is not null and "grading_results"."final_grade" is not null))
);
--> statement-breakpoint
ALTER TABLE "grading_results" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "item_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_item_id" uuid NOT NULL,
	"kind" "image_kind" NOT NULL,
	"storage_key" text NOT NULL,
	"content_type" text NOT NULL,
	"byte_size" integer,
	"sha256" text,
	"uploaded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "item_images_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
ALTER TABLE "item_images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "newsletter_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"locale" text DEFAULT 'es' NOT NULL,
	"status" "newsletter_status" DEFAULT 'pending' NOT NULL,
	"confirm_token_hash" text,
	"consent_version" text NOT NULL,
	"consented_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "newsletter_subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"card_identity_id" uuid,
	"card_name" text NOT NULL,
	"game" text NOT NULL,
	"set_name" text,
	"card_number" text,
	"year" smallint,
	"language" text,
	"declared_value_cents" integer NOT NULL,
	"service_tier_id" uuid NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"max_declared_value_cents" integer NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_items_declared_value_positive" CHECK ("order_items"."declared_value_cents" >= 0)
);
--> statement-breakpoint
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "order_status" DEFAULT 'DRAFT' NOT NULL,
	"status_before_hold" "order_status",
	"shipping_method" "shipping_method",
	"event_id" uuid,
	"shipping_address" jsonb,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"subtotal_cents" integer,
	"insurance_cents" integer,
	"shipping_cents" integer,
	"tax_cents" integer,
	"total_cents" integer,
	"payment_status" "payment_status" DEFAULT 'unpaid' NOT NULL,
	"submitted_at" timestamp with time zone,
	"estimated_completion_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "otp_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"code_hash" text NOT NULL,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"max_attempts" smallint DEFAULT 5 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "otp_challenges" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"provider" text DEFAULT 'stripe' NOT NULL,
	"checkout_session_id" text,
	"payment_intent_id" text,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_checkout_session_id_unique" UNIQUE("checkout_session_id"),
	CONSTRAINT "payments_payment_intent_id_unique" UNIQUE("payment_intent_id")
);
--> statement-breakpoint
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "service_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"name" text NOT NULL,
	"tagline" text,
	"price_cents" integer NOT NULL,
	"turnaround_business_days" smallint NOT NULL,
	"max_declared_value_cents" integer NOT NULL,
	"subgrades_included" boolean NOT NULL,
	"high_res_scans" boolean NOT NULL,
	"priority_queue" boolean NOT NULL,
	"event_only" boolean DEFAULT false NOT NULL,
	"badge" text,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"valid_from" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_to" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_tiers_price_positive" CHECK ("service_tiers"."price_cents" >= 0)
);
--> statement-breakpoint
ALTER TABLE "service_tiers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"user_agent" text,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"direction" "shipment_direction" NOT NULL,
	"carrier" text NOT NULL,
	"tracking_number" text,
	"label_storage_key" text,
	"insured_value_cents" integer,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shipments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "slabs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_item_id" uuid NOT NULL,
	"grading_result_id" uuid NOT NULL,
	"serial" text NOT NULL,
	"nfc_uid" text,
	"qr_payload" text,
	"encapsulated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"encapsulated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "slabs_order_item_id_unique" UNIQUE("order_item_id"),
	CONSTRAINT "slabs_serial_unique" UNIQUE("serial"),
	CONSTRAINT "slabs_nfc_uid_unique" UNIQUE("nfc_uid")
);
--> statement-breakpoint
ALTER TABLE "slabs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"locale" text DEFAULT 'es' NOT NULL,
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"email_verified_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text DEFAULT 'stripe' NOT NULL,
	"event_id" text NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"error" text,
	CONSTRAINT "webhook_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
ALTER TABLE "webhook_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_checks" ADD CONSTRAINT "certificate_checks_certificate_id_certificates_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_slab_id_slabs_id_fk" FOREIGN KEY ("slab_id") REFERENCES "public"."slabs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_grading_result_id_grading_results_id_fk" FOREIGN KEY ("grading_result_id") REFERENCES "public"."grading_results"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_card_identity_id_card_identities_id_fk" FOREIGN KEY ("card_identity_id") REFERENCES "public"."card_identities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_superseded_by_id_certificates_id_fk" FOREIGN KEY ("superseded_by_id") REFERENCES "public"."certificates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custody_events" ADD CONSTRAINT "custody_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custody_events" ADD CONSTRAINT "custody_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grading_defects" ADD CONSTRAINT "grading_defects_grading_result_id_grading_results_id_fk" FOREIGN KEY ("grading_result_id") REFERENCES "public"."grading_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grading_results" ADD CONSTRAINT "grading_results_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grading_results" ADD CONSTRAINT "grading_results_graded_by_users_id_fk" FOREIGN KEY ("graded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grading_results" ADD CONSTRAINT "grading_results_qa_approved_by_users_id_fk" FOREIGN KEY ("qa_approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grading_results" ADD CONSTRAINT "grading_results_superseded_by_id_grading_results_id_fk" FOREIGN KEY ("superseded_by_id") REFERENCES "public"."grading_results"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_images" ADD CONSTRAINT "item_images_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_card_identity_id_card_identities_id_fk" FOREIGN KEY ("card_identity_id") REFERENCES "public"."card_identities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_service_tier_id_service_tiers_id_fk" FOREIGN KEY ("service_tier_id") REFERENCES "public"."service_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slabs" ADD CONSTRAINT "slabs_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slabs" ADD CONSTRAINT "slabs_grading_result_id_grading_results_id_fk" FOREIGN KEY ("grading_result_id") REFERENCES "public"."grading_results"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slabs" ADD CONSTRAINT "slabs_encapsulated_by_users_id_fk" FOREIGN KEY ("encapsulated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "addresses_user_idx" ON "addresses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "card_identities_natural_uq" ON "card_identities" USING btree ("game","set_name","card_number","language","name");--> statement-breakpoint
CREATE INDEX "certificate_checks_number_idx" ON "certificate_checks" USING btree ("certificate_number","created_at");--> statement-breakpoint
CREATE INDEX "certificate_checks_ip_idx" ON "certificate_checks" USING btree ("ip_hash","created_at");--> statement-breakpoint
CREATE INDEX "certificates_card_identity_idx" ON "certificates" USING btree ("card_identity_id");--> statement-breakpoint
CREATE INDEX "consents_user_idx" ON "consents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "custody_events_order_idx" ON "custody_events" USING btree ("order_id","occurred_at");--> statement-breakpoint
CREATE INDEX "email_outbox_pending_idx" ON "email_outbox" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "events_starts_idx" ON "events" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "grading_defects_result_idx" ON "grading_defects" USING btree ("grading_result_id");--> statement-breakpoint
CREATE UNIQUE INDEX "grading_results_item_version_uq" ON "grading_results" USING btree ("order_item_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "grading_results_item_current_uq" ON "grading_results" USING btree ("order_item_id") WHERE "grading_results"."status" <> 'superseded';--> statement-breakpoint
CREATE INDEX "item_images_item_idx" ON "item_images" USING btree ("order_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_email_lower_uq" ON "newsletter_subscriptions" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "order_items_order_position_uq" ON "order_items" USING btree ("order_id","position");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "otp_challenges_email_created_idx" ON "otp_challenges" USING btree (lower("email"),"created_at");--> statement-breakpoint
CREATE INDEX "payments_order_idx" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "service_tiers_code_version_uq" ON "service_tiers" USING btree ("code","version");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "shipments_order_idx" ON "shipments" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_uq" ON "users" USING btree (lower("email"));