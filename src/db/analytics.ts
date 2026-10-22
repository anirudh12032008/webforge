import { sql } from "drizzle-orm";
import type { Category } from "@/types";
import { db } from "./client";
import { SLA_HOURS } from "./dashboard";

export type Analytics = {
  summary: { open: number; resolved: number; avgResolutionHours: number | null; slaBreaches: number; duplicatesMerged: number };
  daily: { date: string; reported: number; resolved: number }[];
  byCategory: { category: Category; open: number; total: number }[];
  byDepartment: { name: string; open: number; capacity: number }[];
  resolutionByCategory: { category: Category; hours: number }[];
};

const TREND_DAYS = 30;
const IST = "Asia/Kolkata";

/**
 * All analytics aggregates for one org (or all). Each query is a single GROUP BY / FILTER pass;
 * the daily trend joins a generated IST calendar so days with no activity still show as zero.
 */
export async function getAnalytics(org?: string): Promise<Analytics> {
  const orgJoin = sql`join orgs o on o.id = c.org_id ${org ? sql`and o.slug = ${org}` : sql``}`;
  const open = sql`c.status not in ('resolved', 'rejected')`;

  const [summary, daily, byCategory, byDepartment, resolution] = await Promise.all([
    db.execute<Analytics["summary"]>(sql`
      select
        (count(*) filter (where ${open} and c.duplicate_of is null))::int as "open",
        (count(*) filter (where c.status = 'resolved'))::int as "resolved",
        (avg(extract(epoch from c.resolved_at - c.created_at) / 3600) filter (where c.resolved_at is not null))::float8 as "avgResolutionHours",
        (count(*) filter (where ${open} and c.duplicate_of is null and c.created_at < now() - make_interval(hours => ${SLA_HOURS})))::int as "slaBreaches",
        (count(*) filter (where c.duplicate_of is not null))::int as "duplicatesMerged"
      from complaints c ${orgJoin}`),
    db.execute<Analytics["daily"][number]>(sql`
      with days as (
        select generate_series(((now() at time zone ${IST})::date - ${TREND_DAYS - 1}::int)::timestamp, (now() at time zone ${IST})::date::timestamp, interval '1 day')::date as d
      )
      select to_char(d, 'YYYY-MM-DD') as "date",
        (select count(*) from complaints c ${orgJoin} where (c.created_at at time zone ${IST})::date = d)::int as "reported",
        (select count(*) from complaints c ${orgJoin} where (c.resolved_at at time zone ${IST})::date = d)::int as "resolved"
      from days order by d`),
    db.execute<Analytics["byCategory"][number]>(sql`
      select c.category::text as "category",
        (count(*) filter (where ${open}))::int as "open", count(*)::int as "total"
      from complaints c ${orgJoin} where c.duplicate_of is null
      group by c.category order by "open" desc, "total" desc`),
    db.execute<Analytics["byDepartment"][number]>(sql`
      select d.name as "name", d.capacity as "capacity",
        (count(c.id) filter (where ${open}))::int as "open"
      from departments d join orgs o on o.id = d.org_id ${org ? sql`and o.slug = ${org}` : sql``}
      left join complaints c on c.department_id = d.id
      group by d.id order by "open" desc, d.name`),
    db.execute<Analytics["resolutionByCategory"][number]>(sql`
      select c.category::text as "category",
        round((avg(extract(epoch from c.resolved_at - c.created_at)) / 3600)::numeric, 1)::float8 as "hours"
      from complaints c ${orgJoin} where c.resolved_at is not null
      group by c.category order by "hours" desc`),
  ]);

  const s = summary.rows[0];
  return {
    summary: { ...s, avgResolutionHours: s.avgResolutionHours === null ? null : Math.round(Number(s.avgResolutionHours) * 10) / 10 },
    daily: daily.rows,
    byCategory: byCategory.rows,
    byDepartment: byDepartment.rows,
    resolutionByCategory: resolution.rows.map((r) => ({ ...r, hours: Number(r.hours) })),
  };
}
