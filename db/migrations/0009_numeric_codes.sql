ALTER TABLE "certificates" DROP CONSTRAINT "certificates_number_format";--> statement-breakpoint
ALTER TABLE "contact_messages" DROP CONSTRAINT "contact_messages_ticket_format";--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_code_format";--> statement-breakpoint
ALTER TABLE "slabs" DROP CONSTRAINT "slabs_serial_format";--> statement-breakpoint
-- Los códigos pasan a ser solo números. Pedidos y tickets existentes reciben un número nuevo al azar.
UPDATE "orders" SET "code" = lpad(floor(random() * 1000000000)::bigint::text, 9, '0') WHERE "code" !~ '^[0-9]{9}$';--> statement-breakpoint
UPDATE "contact_messages" SET "ticket" = lpad(floor(random() * 10000000)::bigint::text, 7, '0') WHERE "ticket" !~ '^[0-9]{7}$';--> statement-breakpoint
-- Certificados y slabs conservan sus 8 dígitos, sin el prefijo. El número forma parte del registro
-- firmado: se actualiza el registro y se quita la firma, y la tarea diaria lo vuelve a firmar.
UPDATE "certificates" SET
  "number" = substring("number" from 5),
  "payload" = jsonb_set(jsonb_set("payload", '{number}', to_jsonb(substring("number" from 5))), '{slab}', to_jsonb(substring("number" from 5))),
  "signature" = NULL,
  "key_id" = NULL
WHERE "number" ~ '^GGI-[0-9]{8}$';--> statement-breakpoint
UPDATE "slabs" SET
  "serial" = substring("serial" from 9),
  "qr_payload" = replace("qr_payload", '/certificates/GGI-', '/certificates/')
WHERE "serial" ~ '^GGI-SLB-[0-9]{8}$';--> statement-breakpoint
UPDATE "certificate_checks" SET "certificate_number" = regexp_replace("certificate_number", '^GGI-(SLB-)?', '') WHERE "certificate_number" ~ '^GGI-';--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_number_format" CHECK ("certificates"."number" ~ '^[0-9]{8}$');--> statement-breakpoint
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_ticket_format" CHECK ("contact_messages"."ticket" ~ '^[0-9]{7}$');--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_code_format" CHECK ("orders"."code" ~ '^[0-9]{9}$');--> statement-breakpoint
ALTER TABLE "slabs" ADD CONSTRAINT "slabs_serial_format" CHECK ("slabs"."serial" ~ '^[0-9]{8}$');
