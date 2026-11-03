ALTER TABLE "certificates" DROP CONSTRAINT "certificates_number_format";--> statement-breakpoint
ALTER TABLE "grading_results" DROP CONSTRAINT "grading_results_grade_rule";--> statement-breakpoint
ALTER TABLE "slabs" DROP CONSTRAINT "slabs_serial_format";--> statement-breakpoint
ALTER TABLE "grading_results" ADD COLUMN "rule" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "grading_results" ADD COLUMN "certificate_number" text;--> statement-breakpoint
ALTER TABLE "grading_results" ADD COLUMN "scan_report" jsonb;--> statement-breakpoint
CREATE UNIQUE INDEX "grading_results_certificate_number_uq" ON "grading_results" USING btree ("certificate_number") WHERE "grading_results"."status" <> 'superseded' and "grading_results"."certificate_number" is not null;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_number_format" CHECK ("certificates"."number" ~ '^[0-9]{8,9}$');--> statement-breakpoint
ALTER TABLE "grading_results" ADD CONSTRAINT "grading_results_rule_kind" CHECK ("grading_results"."rule" in ('manual', 'scanner'));--> statement-breakpoint
ALTER TABLE "grading_results" ADD CONSTRAINT "grading_results_certificate_number_format" CHECK ("grading_results"."certificate_number" is null or "grading_results"."certificate_number" ~ '^[0-9]{8,9}$');--> statement-breakpoint
ALTER TABLE "grading_results" ADD CONSTRAINT "grading_results_grade_rule" CHECK ((
        "grading_results"."final_grade" is null or "grading_results"."centering_score" is null or "grading_results"."corners_score" is null or "grading_results"."edges_score" is null or "grading_results"."surface_score" is null
        or ("grading_results"."rule" = 'scanner'
          and "grading_results"."final_grade" = floor("grading_results"."final_grade") and "grading_results"."centering_score" = floor("grading_results"."centering_score") and "grading_results"."corners_score" = floor("grading_results"."corners_score")
          and "grading_results"."edges_score" = floor("grading_results"."edges_score") and "grading_results"."surface_score" = floor("grading_results"."surface_score")
          and "grading_results"."final_grade" <= least("grading_results"."centering_score", "grading_results"."corners_score", "grading_results"."edges_score", "grading_results"."surface_score") + 2
          and "grading_results"."final_grade" <= floor(("grading_results"."centering_score" + "grading_results"."corners_score" + "grading_results"."edges_score" + "grading_results"."surface_score") / 4 + 0.5))
        or ("grading_results"."rule" = 'manual' and
          "grading_results"."final_grade" <= least("grading_results"."centering_score", "grading_results"."corners_score", "grading_results"."edges_score", "grading_results"."surface_score") + 0.5
          and "grading_results"."final_grade" <= ceil(("grading_results"."centering_score" + "grading_results"."corners_score" + "grading_results"."edges_score" + "grading_results"."surface_score" - 1) / 2) / 2
          and ("grading_results"."final_grade" < 10 or (
            least("grading_results"."centering_score", "grading_results"."corners_score", "grading_results"."edges_score", "grading_results"."surface_score") >= 9.5
            and ("grading_results"."centering_score" = 10)::int + ("grading_results"."corners_score" = 10)::int + ("grading_results"."edges_score" = 10)::int + ("grading_results"."surface_score" = 10)::int >= 3))
          and ("grading_results"."final_grade" < 9.5 or (
            ("grading_results"."centering_score" >= 9.5)::int + ("grading_results"."corners_score" >= 9.5)::int + ("grading_results"."edges_score" >= 9.5)::int + ("grading_results"."surface_score" >= 9.5)::int >= 3
            and least("grading_results"."centering_score", "grading_results"."corners_score", "grading_results"."edges_score", "grading_results"."surface_score") >= 9))
        )
      ));--> statement-breakpoint
ALTER TABLE "slabs" ADD CONSTRAINT "slabs_serial_format" CHECK ("slabs"."serial" ~ '^[0-9]{8,9}$');