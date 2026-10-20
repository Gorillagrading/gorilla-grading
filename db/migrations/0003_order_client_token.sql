ALTER TABLE "orders" ADD COLUMN "client_token" text;--> statement-breakpoint
CREATE UNIQUE INDEX "orders_user_client_token_uq" ON "orders" USING btree ("user_id","client_token");