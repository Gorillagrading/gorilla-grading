ALTER TABLE "certificates" DROP CONSTRAINT "certificates_number_format";--> statement-breakpoint
ALTER TABLE "slabs" DROP CONSTRAINT "slabs_serial_format";--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_number_format" CHECK ("certificates"."number" ~ '^GGI-[0-9]{8}$');--> statement-breakpoint
ALTER TABLE "slabs" ADD CONSTRAINT "slabs_serial_format" CHECK ("slabs"."serial" ~ '^GGI-SLB-[0-9]{8}$');