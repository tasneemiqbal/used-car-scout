import { createFileRoute, Link } from "@tanstack/react-router";

import { AboutSection, SitePage } from "@/components/site";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About | Used Car Scout" },
      { name: "description", content: "Why Used Car Scout exists: a founder who bought her first car with no one to ask." },
      { property: "og:title", content: "About | Used Car Scout" },
      { property: "og:description", content: "Why Used Car Scout exists: a founder who bought her first car with no one to ask." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SitePage>
      {(copy) => (
        <>
          <AboutSection copy={copy} />
          <div className="mx-auto max-w-3xl px-6 py-12 text-center">
            <Link
              to="/check"
              className="inline-flex rounded-none bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              {copy.nav.check}
            </Link>
          </div>
        </>
      )}
    </SitePage>
  );
}
