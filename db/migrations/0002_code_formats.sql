ALTER TABLE "certificates" ADD CONSTRAINT "certificates_number_format" CHECK ("certificates"."number" ~ '^GGI-[0-9]{6}$');--> statement-breakpoint
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_ticket_format" CHECK ("contact_messages"."ticket" ~ '^GGI-TKT-[A-Z0-9]{6}$');--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_code_format" CHECK ("orders"."code" ~ '^GGI-ORD-[A-Z0-9]{6}$');--> statement-breakpoint
ALTER TABLE "slabs" ADD CONSTRAINT "slabs_serial_format" CHECK ("slabs"."serial" ~ '^GGI-SLB-[0-9]{6}$');