CREATE TYPE "public"."org_kind" AS ENUM('city', 'campus');--> statement-breakpoint
CREATE TABLE "orgs" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"kind" "org_kind" NOT NULL,
	"boundary" geography(Polygon, 4326),
	CONSTRAINT "orgs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "complaints" ADD COLUMN "org_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "departments" ADD COLUMN "org_id" integer NOT NULL;--> statement-breakpoint
CREATE INDEX "orgs_boundary_gist" ON "orgs" USING gist ("boundary");--> statement-breakpoint
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "complaints_org_status_idx" ON "complaints" USING btree ("org_id","status");