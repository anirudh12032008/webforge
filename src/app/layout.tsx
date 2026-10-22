import type { Metadata } from "next";
import { Archivo, Public_Sans } from "next/font/google";
import { LocaleProvider } from "@/components/shared/locale-provider";
import { TopNav } from "@/components/shared/top-nav";
import { Toaster } from "@/components/ui/sonner";
import { getLocale } from "@/lib/i18n/server";
import "./globals.css";

// Public Sans (built for government sites) for reading; Archivo's wide axis gives headings a road-sign feel.
const publicSans = Public_Sans({ variable: "--font-public-sans", subsets: ["latin"] });
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });

export const metadata: Metadata = {
  title: "CivicLens — Bhopal & MANIT",
  description: "Report civic issues in Bhopal and on the MANIT campus. AI sorts, de-duplicates and ranks them for the right team.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${publicSans.variable} ${archivo.variable}`}>
      <body className="antialiased">
        <LocaleProvider locale={locale}>
          <TopNav />
          <main>{children}</main>
          <Toaster />
        </LocaleProvider>
      </body>
    </html>
  );
}
