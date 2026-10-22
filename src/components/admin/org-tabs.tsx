import Link from "next/link";

const ORG_TABS = [
  { slug: undefined, label: "All" },
  { slug: "manit", label: "MANIT campus" },
  { slug: "bmc", label: "Bhopal city" },
];

/** All / campus / city switch shared by admin pages; the selection lives in ?org= so it's linkable. */
export function OrgTabs({ basePath, current }: { basePath: string; current?: string }) {
  return (
    <nav className="flex gap-1 rounded-lg bg-muted p-1 text-sm" aria-label="Organisation">
      {ORG_TABS.map((tab) => (
        <Link
          key={tab.label}
          href={tab.slug ? `${basePath}?org=${tab.slug}` : basePath}
          aria-current={current === tab.slug ? "page" : undefined}
          className="rounded-md px-3 py-1.5 text-muted-foreground aria-[current=page]:bg-background aria-[current=page]:font-medium aria-[current=page]:text-foreground aria-[current=page]:shadow-sm"
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
