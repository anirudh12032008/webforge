import Link from "next/link";
import { pick } from "@/lib/i18n";
import { ADMIN } from "@/lib/i18n/messages/admin";
import { getLocale } from "@/lib/i18n/server";

/** All / campus / city switch shared by admin pages; the selection lives in ?org= so it's linkable. */
export async function OrgTabs({ basePath, current }: { basePath: string; current?: string }) {
  const t = pick(ADMIN, await getLocale());
  const ORG_TABS = [
    { slug: undefined, label: t.orgAll },
    { slug: "manit", label: t.orgManit },
    { slug: "bmc", label: t.orgBmc },
  ];
  return (
    <nav className="flex max-w-full gap-1 overflow-x-auto rounded-lg border bg-card p-1 text-sm shadow-xs" aria-label={t.orgNav}>
      {ORG_TABS.map((tab) => (
        <Link
          key={tab.label}
          href={tab.slug ? `${basePath}?org=${tab.slug}` : basePath}
          aria-current={current === tab.slug ? "page" : undefined}
          className="rounded-md px-3 py-1.5 font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground aria-[current=page]:bg-foreground aria-[current=page]:text-background"
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
