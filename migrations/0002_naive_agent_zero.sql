CREATE TABLE "tfl_stations" (
	"id" serial PRIMARY KEY NOT NULL,
	"tfl_id" text NOT NULL,
	"common_name" text NOT NULL,
	"lat" real NOT NULL,
	"lng" real NOT NULL,
	"modes" text DEFAULT '' NOT NULL,
	"lines" text DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tfl_stations_tfl_id_unique" UNIQUE("tfl_id")
);
