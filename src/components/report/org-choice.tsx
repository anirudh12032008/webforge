"use client";

import type { Org } from "@/types";

type Props = {
  orgs: Org[] | null;
  value: string;
  onChange: (slug: string) => void;
  t: { whoFixes: string; campusHandled: string; cityHandled: string; goesTo: (org: string) => string; notCovered: string };
};

/** Campus-or-city choice for the pinned spot; only shown as a choice when more than one org covers it. */
export function OrgChoice({ orgs, value, onChange, t }: Props) {
  if (!orgs) return null;
  if (orgs.length === 0) return <p className="text-sm text-destructive">{t.notCovered}</p>;
  if (orgs.length === 1) return <p className="text-sm">{t.goesTo(orgs[0].name)}</p>;
  return (
    <div className="space-y-2 pt-2">
      <p className="font-medium">{t.whoFixes}</p>
      {orgs.map((org) => (
        <label key={org.slug} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 has-checked:border-primary has-checked:bg-accent">
          <input type="radio" name="org" value={org.slug} checked={value === org.slug} onChange={() => onChange(org.slug)} className="accent-primary" />
          <span>
            {org.name}
            <span className="block text-sm text-muted-foreground">{org.kind === "campus" ? t.campusHandled : t.cityHandled}</span>
          </span>
        </label>
      ))}
    </div>
  );
}
