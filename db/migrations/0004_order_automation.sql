ALTER TABLE "orders" ADD COLUMN "auto_anchor_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "auto_turnaround_days" smallint;