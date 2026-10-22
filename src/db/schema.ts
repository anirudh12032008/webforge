import { sql, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import {
  type AnyPgColumn,
  bigserial,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  serial,
  smallint,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";
import { CATEGORIES, STATUSES, type PriorityFactor } from "@/types";
import { geographyPoint } from "./geography";

export const categoryEnum = pgEnum("category", CATEGORIES);
export const statusEnum = pgEnum("status", STATUSES);

const timestamptz = (name: string) => timestamp(name, { withTimezone: true });

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  categories: categoryEnum("categories").array().notNull().default(sql`'{}'`),
  capacity: integer("capacity").notNull().default(10),
});

export const complaints = pgTable(
  "complaints",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    photoUrl: text("photo_url"),
    location: geographyPoint("location").notNull(),
    locationLabel: text("location_label"),
    category: categoryEnum("category").notNull().default("other"),
    categoryConfidence: real("category_confidence"),
    severity: smallint("severity"),
    safetyRisk: smallint("safety_risk"),
    communityImpact: smallint("community_impact"),
    aiReasoning: text("ai_reasoning"),
    priorityScore: real("priority_score").notNull().default(0),
    priorityBreakdown: jsonb("priority_breakdown").$type<PriorityFactor[]>(),
    status: statusEnum("status").notNull().default("new"),
    departmentId: integer("department_id").references(() => departments.id, { onDelete: "set null" }),
    clusterId: integer("cluster_id"),
    duplicateOf: uuid("duplicate_of").references((): AnyPgColumn => complaints.id, { onDelete: "set null" }),
    relatedCount: integer("related_count").notNull().default(0),
    embedding: vector("embedding", { dimensions: 512 }),
    reporterName: text("reporter_name"),
    reporterContact: text("reporter_contact"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
    resolvedAt: timestamptz("resolved_at"),
  },
  (t) => [
    index("complaints_location_gist").using("gist", t.location),
    index("complaints_embedding_hnsw").using("hnsw", t.embedding.op("vector_cosine_ops")),
    index("complaints_status_created_idx").on(t.status, t.createdAt),
    index("complaints_reporter_contact_idx").on(t.reporterContact),
    check("complaints_severity_range", sql`${t.severity} BETWEEN 1 AND 5`),
    check("complaints_safety_risk_range", sql`${t.safetyRisk} BETWEEN 1 AND 5`),
    check("complaints_community_impact_range", sql`${t.communityImpact} BETWEEN 1 AND 5`),
    check("complaints_confidence_range", sql`${t.categoryConfidence} BETWEEN 0 AND 1`),
    check("complaints_priority_range", sql`${t.priorityScore} BETWEEN 0 AND 100`),
  ],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    complaintId: uuid("complaint_id")
      .notNull()
      .references(() => complaints.id, { onDelete: "cascade" }),
    actor: text("actor").notNull(),
    action: text("action").notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [index("audit_log_complaint_created_idx").on(t.complaintId, t.createdAt)],
);

export type DepartmentRow = InferSelectModel<typeof departments>;
export type ComplaintRow = InferSelectModel<typeof complaints>;
export type NewComplaintRow = InferInsertModel<typeof complaints>;
export type AuditLogRow = InferSelectModel<typeof auditLog>;
