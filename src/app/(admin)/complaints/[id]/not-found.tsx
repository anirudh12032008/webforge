import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { pick } from "@/lib/i18n";
import { ADMIN } from "@/lib/i18n/messages/admin";
import { getLocale } from "@/lib/i18n/server";

export default async function ComplaintNotFound() {
  const t = pick(ADMIN, await getLocale());
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="space-y-3 rounded-xl border bg-card p-6 shadow-xs">
        <p className="flex items-center gap-2 font-heading text-xl font-semibold">
          <SearchX className="size-5 text-muted-foreground" aria-hidden /> {t.notFoundTitle}
        </p>
        <p className="text-muted-foreground">{t.notFoundBody}</p>
        <Link href="/dashboard" className={buttonVariants({ size: "lg", variant: "outline" })}>
          <ArrowLeft aria-hidden /> {t.backToTriage}
        </Link>
      </div>
    </div>
  );
}
