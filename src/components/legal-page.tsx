// Shared shell for the short informational pages so they carry the same header,
// footer and spacing as the rest of the site.
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { ReportHeader } from "@/components/report-header";
import { SCOUT_LOGO_URL } from "@/lib/brand";

export function LegalPage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ReportHeader wide />

      <main className="mx-auto max-w-3xl px-6 pb-20">
        <p className="font-mono text-xs tracking-[0.22em] text-accent-warm uppercase">{eyebrow}</p>
        <h1 className="mt-4 font-serif text-4xl leading-tight tracking-tight">{title}</h1>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          {children}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
