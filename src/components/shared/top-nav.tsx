import Link from "next/link";
import { MapPin } from "lucide-react";

const CITIZEN_LINKS = [
  { href: "/report", label: "Report" },
  { href: "/my-reports", label: "My Reports" },
];
const ADMIN_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/analytics", label: "Analytics" },
];

export function TopNav() {
  return (
    <header className="border-b bg-background">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 text-sm">
        <Link href="/" className="flex items-center gap-1.5 font-semibold">
          <MapPin className="size-4" aria-hidden />
          CampusSense
        </Link>
        <div className="ml-auto flex items-center gap-4">
          {CITIZEN_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-muted-foreground hover:text-foreground">
              {l.label}
            </Link>
          ))}
          <span className="text-muted-foreground/50" aria-hidden>|</span>
          <span className="hidden text-xs uppercase tracking-wide text-muted-foreground sm:inline">Admin</span>
          {ADMIN_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-muted-foreground hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
