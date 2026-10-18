// Site-wide footer: the brand promise on the left, three link columns on the
// right, and the data-source line at the bottom. Kept in one place so every
// page carries the same routes.
import { Link } from "@tanstack/react-router";

import { SCOUT_LOGO_URL } from "@/lib/brand";
import { homeCopy } from "@/lib/home.copy";
import { useLanguage } from "@/components/site";

const columnsFor = (site: typeof homeCopy.en.site) => [
  {
    heading: site.product,
    links: [
      { label: site.how, to: "/how-it-works" as const },
      { label: site.meetScout, to: "/meet-scout" as const },
      { label: site.sampleReport, to: "/sample-report" as const },
    ],
  },
  {
    heading: site.company,
    links: [
      { label: site.about, to: "/about" as const },
    ],
  },
  {
    heading: site.legal,
    links: [
      { label: site.privacy, to: "/privacy" as const },
      { label: site.terms, to: "/terms" as const },
      { label: site.disclaimer, to: "/disclaimer" as const },
    ],
  },
];

export function SiteFooter() {
  const { language } = useLanguage();
  const site = homeCopy[language].site;
  const COLUMNS = columnsFor(site);
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.2fr_2fr]">
          <div className="flex items-start gap-3">
            <img src={SCOUT_LOGO_URL} alt="" className="h-9 w-9 shrink-0" />
            <div>
              <p className="font-serif text-lg leading-tight tracking-tight">Used Car Scout</p>
              <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {site.tagline}
              </p>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {COLUMNS.map((column) => (
              <nav key={column.heading} aria-label={column.heading}>
                <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
                  {column.heading}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                                              <Link
                          to={link.to}
                          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {link.label}
                        </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-t border-border pt-6">
          <p className="font-mono text-xs tracking-[0.12em] text-muted-foreground">
            {site.rights}
          </p>
          <p className="font-mono text-xs leading-relaxed text-muted-foreground">
            {site.dataLine}
          </p>
        </div>
      </div>
    </footer>
  );
}
