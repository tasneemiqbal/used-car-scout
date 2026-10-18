import { createFileRoute, Link } from "@tanstack/react-router";

import { FaqSection, SitePage } from "@/components/site";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ | Used Car Scout" },
      { name: "description", content: "Answers about where Scout's data comes from, what it costs, and what it can and cannot tell you." },
      { property: "og:title", content: "FAQ | Used Car Scout" },
      { property: "og:description", content: "Answers about where Scout's data comes from, what it costs, and what it can and cannot tell you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <SitePage>
      {(copy) => (
        <>
          <FaqSection copy={copy} />
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
