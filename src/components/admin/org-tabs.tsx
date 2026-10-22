import Link from "next/link";

const ORG_TABS = [
  { slug: undefined, label: "All" },
  { slug: "manit", label: "MANIT campus" },
  { slug: "bmc", label: "Bhopal city" },
];

/** All / campus / city switch shared by admin pages; the selection lives in ?org= so it's linkable. */
export function OrgTabs({ basePath, current }: { basePath: string; current?: string }) {
  return (
    <nav className="flex max-w-full gap-1 overflow-x-auto rounded-lg border bg-card p-1 text-sm shadow-xs" aria-label="Organisation">
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
