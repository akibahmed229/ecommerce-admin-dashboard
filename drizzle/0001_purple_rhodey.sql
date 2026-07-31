ALTER TABLE "product_variants" ADD COLUMN "combination_key" varchar(500) NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "variant_combination_unique_idx" ON "product_variants" USING btree ("product_id","combination_key");--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "variants_price_non_negative" CHECK ("product_variants"."price" >= 0);--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "variants_sale_price_le_price" CHECK ("product_variants"."sale_price" IS NULL OR "product_variants"."sale_price" <= "product_variants"."price");--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "variants_stock_non_negative" CHECK ("product_variants"."stock_quantity" >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_price_non_negative" CHECK ("products"."price" IS NULL OR "products"."price" >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_sale_price_le_price" CHECK ("products"."sale_price" IS NULL OR "products"."price" IS NULL OR "products"."sale_price" <= "products"."price");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_stock_non_negative" CHECK ("products"."stock_quantity" IS NULL OR "products"."stock_quantity" >= 0);