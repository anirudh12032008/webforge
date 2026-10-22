"use client";

import { Bar, BarChart as RBarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Datum = { label: string; value: number };

/**
 * Single-series horizontal bars (magnitude by one hue), value labels at the bar end so the chart
 * reads without hovering. Height grows with the row count so labels never collide.
 */
export function BarChart({ data, valueLabel, unit = "", color = "#1f6fb8" }: { data: Datum[]; valueLabel: string; unit?: string; color?: string }) {
  if (data.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>;
  const format = (v: unknown) => `${v}${unit}`;
  return (
    <ResponsiveContainer width="100%" height={Math.max(140, data.length * 38)}>
      <RBarChart data={data} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 0 }}>
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis type="category" dataKey="label" width={190} tickLine={false} axisLine={false} tick={{ fontSize: 13, fill: "var(--foreground)" }} />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          formatter={(v) => [format(v), valueLabel]}
          contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 13 }}
        />
        <Bar dataKey="value" name={valueLabel} fill={color} radius={[0, 4, 4, 0]} barSize={18}>
          <LabelList dataKey="value" position="right" formatter={format} style={{ fontSize: 12, fill: "var(--foreground)" }} />
        </Bar>
      </RBarChart>
    </ResponsiveContainer>
  );
}
