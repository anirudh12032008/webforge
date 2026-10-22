CREATE TYPE "public"."category" AS ENUM('pothole', 'garbage', 'water_leak', 'streetlight', 'electrical', 'sanitation', 'other');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('new', 'triaged', 'assigned', 'in_progress', 'resolved', 'rejected');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"complaint_id" uuid NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "complaints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"photo_url" text,
	"location" geography(Point, 4326) NOT NULL,
	"location_label" text,
	"category" "category" DEFAULT 'other' NOT NULL,
	"category_confidence" real,
	"severity" smallint,
	"safety_risk" smallint,
	"community_impact" smallint,
	"ai_reasoning" text,
	"priority_score" real DEFAULT 0 NOT NULL,
	"priority_breakdown" jsonb,
	"status" "status" DEFAULT 'new' NOT NULL,
	"department_id" integer,
	"cluster_id" integer,
	"duplicate_of" uuid,
	"related_count" integer DEFAULT 0 NOT NULL,
	"embedding" vector(512),
	"reporter_name" text,
	"reporter_contact" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	CONSTRAINT "complaints_severity_range" CHECK ("complaints"."severity" BETWEEN 1 AND 5),
	CONSTRAINT "complaints_safety_risk_range" CHECK ("complaints"."safety_risk" BETWEEN 1 AND 5),
	CONSTRAINT "complaints_community_impact_range" CHECK ("complaints"."community_impact" BETWEEN 1 AND 5),
	CONSTRAINT "complaints_confidence_range" CHECK ("complaints"."category_confidence" BETWEEN 0 AND 1),
	CONSTRAINT "complaints_priority_range" CHECK ("complaints"."priority_score" BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"categories" "category"[] DEFAULT '{}' NOT NULL,
	"capacity" integer DEFAULT 10 NOT NULL,
	CONSTRAINT "departments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_complaint_id_complaints_id_fk" FOREIGN KEY ("complaint_id") REFERENCES "public"."complaints"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_duplicate_of_complaints_id_fk" FOREIGN KEY ("duplicate_of") REFERENCES "public"."complaints"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_complaint_created_idx" ON "audit_log" USING btree ("complaint_id","created_at");--> statement-breakpoint
CREATE INDEX "complaints_location_gist" ON "complaints" USING gist ("location");--> statement-breakpoint
CREATE INDEX "complaints_embedding_hnsw" ON "complaints" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "complaints_status_created_idx" ON "complaints" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "complaints_reporter_contact_idx" ON "complaints" USING btree ("reporter_contact");