CREATE TABLE "place_geocode_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"place_id" integer NOT NULL,
	"query" text NOT NULL,
	"status" text NOT NULL,
	"result_summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"place_type" text,
	"url" text,
	"latitude" real,
	"longitude" real,
	"formatted_address" text,
	"city" text,
	"state" text,
	"postal_code" text,
	"country" text,
	"country_code" text,
	"geocoded_at" timestamp,
	"metadata" text,
	"review_status" text,
	"review_reason" text,
	"review_query" text,
	"review_updated_at" timestamp,
	"review_decision_at" timestamp,
	"review_decision_source" text,
	"last_geocode_status" text,
	"last_geocode_query" text,
	"last_geocode_result_summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "place_geocode_attempts" ADD CONSTRAINT "place_geocode_attempts_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;