import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import type { Category, LngLat } from "@/types";

/** Reports closer than this (metres) belong to the same hotspot. */
export const CLUSTER_EPS_M = 60;
export const CLUSTER_MIN_POINTS = 2;
/** A hotspot is "recurring" when it gets this many reports inside the recent window. */
export const RECURRING_MIN_REPORTS = 3;
export const RECURRING_WINDOW_DAYS = 30;
const LOOKBACK_DAYS = 90;

export type Hotspot = {
  clusterId: number;
  center: LngLat;
  label: string | null;
  reports: number;
  recentReports: number;
  categories: Category[];
  lastReportedAt: string;
  recurring: boolean;
};

/** Recurring = enough reports in the recent window that a one-off fix clearly isn't working. */
export function isRecurring(recentReports: number): boolean {
  return recentReports >= RECURRING_MIN_REPORTS;
}

type ClusterRow = {
  cluster_id: number;
  lat: number;
  lng: number;
  label: string | null;
  reports: number;
  recent_reports: number;
  categories: Category[];
  last_at: string | Date;
};

/**
 * Hotspots via PostGIS ST_ClusterDBSCAN over the last 90 days (duplicates included, since repeat
 * reports are exactly the signal). Points are projected to Web Mercator so eps is in metres;
 * ponytail: Mercator stretches ~9% at Bhopal's latitude — fine for a 60 m radius, use a local UTM
 * zone if clusters ever need survey-grade edges.
 */
export async function getHotspots(org?: string, limit = 10): Promise<Hotspot[]> {
  const orgFilter = org ? sql`and o.slug = ${org}` : sql``;
  const result = await db.execute<ClusterRow>(sql`
    with clustered as (
      select c.location, c.created_at, c.category, c.location_label,
        ST_ClusterDBSCAN(ST_Transform(c.location::geometry, 3857), eps := ${CLUSTER_EPS_M}, minpoints := ${CLUSTER_MIN_POINTS}) over () as cluster_id
      from complaints c join orgs o on o.id = c.org_id
      where c.created_at > now() - make_interval(days => ${LOOKBACK_DAYS}) ${orgFilter}
    )
    select cluster_id,
      ST_Y(ST_Centroid(ST_Collect(location::geometry))) as lat,
      ST_X(ST_Centroid(ST_Collect(location::geometry))) as lng,
      (array_agg(location_label order by created_at desc) filter (where location_label is not null))[1] as label,
      count(*)::int as reports,
      (count(*) filter (where created_at > now() - make_interval(days => ${RECURRING_WINDOW_DAYS})))::int as recent_reports,
      array_agg(distinct category::text) as categories,
      max(created_at) as last_at
    from clustered where cluster_id is not null
    group by cluster_id
    order by recent_reports desc, reports desc
    limit ${limit}`);

  return result.rows.map((r) => ({
    clusterId: r.cluster_id,
    center: { lat: Number(r.lat), lng: Number(r.lng) },
    label: r.label,
    reports: r.reports,
    recentReports: r.recent_reports,
    categories: r.categories,
    lastReportedAt: new Date(r.last_at).toISOString(),
    recurring: isRecurring(r.recent_reports),
  }));
}
