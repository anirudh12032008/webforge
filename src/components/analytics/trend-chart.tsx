"use client";

import { ChartLine } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/** Validated pair (CVD ΔE ≥ 23, ≥ 3:1 on white): blue = reported, amber = resolved. */
export const TREND_SERIES = [
  { key: "reported", label: "Reported", color: "#1f6fb8" },
  { key: "resolved", label: "Resolved", color: "#c27400" },
] as const;

const day = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const axisTick = { fontSize: 12, fill: "var(--muted-foreground)" };

/** Reported vs resolved per day: two thin lines, crosshair tooltip, legend for identity. */
export function TrendChart({ data }: { data: { date: string; reported: number; resolved: number }[] }) {
  if (!data.some((d) => d.reported > 0 || d.resolved > 0)) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
        <ChartLine className="size-5" aria-hidden />
        No complaints reported or resolved in the last 30 days.
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="date" tickFormatter={day} tick={axisTick} tickLine={false} axisLine={false} minTickGap={28} />
        <YAxis
          allowDecimals={false}
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={48}
          label={{ value: "Complaints / day", angle: -90, position: "insideLeft", offset: 10, style: { ...axisTick, textAnchor: "middle" } }}
        />
        <Tooltip
          cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
          labelFormatter={(label) => day(String(label))}
          contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--popover)", color: "var(--popover-foreground)", fontSize: 13 }}
        />
        <Legend iconType="plainline" wrapperStyle={{ fontSize: 13 }} />
        {TREND_SERIES.map((s) => (
          <Line
            key={s.key}
            type="linear"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
