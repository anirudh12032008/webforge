import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
      <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
        Report it once. The right team sees it first.
      </h1>
      <p className="mt-4 max-w-prose text-lg text-muted-foreground">
        Potholes, garbage, leaks, dead streetlights in Bhopal or on the MANIT campus. AI sorts each report, spots
        duplicates nearby and ranks it by safety risk, so the most urgent fixes happen first.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/report" className={buttonVariants({ size: "lg" })}>
          Report an issue
        </Link>
        <Link href="/dashboard" className={buttonVariants({ size: "lg", variant: "outline" })}>
          Open the admin dashboard
        </Link>
      </div>
    </section>
  );
}
