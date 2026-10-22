import Link from "next/link";
import { MapPin } from "lucide-react";
import { LanguageSwitch } from "@/components/shared/language-switch";
import { pick } from "@/lib/i18n";
import { NAV } from "@/lib/i18n/messages/nav";
import { getLocale } from "@/lib/i18n/server";

/** min-h-10: 40px tap target without adding any visible chrome. */
const linkClass = "inline-flex min-h-10 items-center whitespace-nowrap text-muted-foreground hover:text-foreground";

export async function TopNav() {
  const t = pick(NAV, await getLocale());
  return (
    <header className="border-b bg-background">
      <nav className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center gap-x-4 gap-y-0 px-4 py-2 text-sm">
        <Link href="/" className="flex min-h-10 items-center gap-1.5 font-semibold">
          <MapPin className="size-4" aria-hidden />
          CivicLens
        </Link>
        <div className="order-last flex w-full flex-wrap items-center gap-x-4 gap-y-0 sm:order-none sm:ml-auto sm:w-auto">
          <Link href="/report" className={linkClass}>{t.report}</Link>
          <Link href="/my-reports" className={linkClass}>{t.myReports}</Link>
          <span className="text-muted-foreground/50" aria-hidden>|</span>
          <span className="hidden text-xs text-muted-foreground sm:inline">{t.admin}</span>
          <Link href="/dashboard" className={linkClass}>{t.dashboard}</Link>
          <Link href="/analytics" className={linkClass}>{t.analytics}</Link>
        </div>
        <div className="ml-auto sm:ml-0">
          <LanguageSwitch label={t.language} />
        </div>
      </nav>
    </header>
  );
}
