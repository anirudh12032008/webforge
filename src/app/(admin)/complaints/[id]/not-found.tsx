import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function ComplaintNotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="space-y-3 rounded-xl border bg-card p-6 shadow-xs">
        <p className="flex items-center gap-2 font-heading text-xl font-semibold">
          <SearchX className="size-5 text-muted-foreground" aria-hidden /> Complaint not found
        </p>
        <p className="text-muted-foreground">This link doesn&apos;t match any complaint. It may have been mistyped.</p>
        <Link href="/dashboard" className={buttonVariants({ size: "lg", variant: "outline" })}>
          <ArrowLeft aria-hidden /> Back to triage
        </Link>
      </div>
    </div>
  );
}
