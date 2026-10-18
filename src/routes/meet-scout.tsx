import { createFileRoute, Link } from "@tanstack/react-router";

import { MeetScoutSection, SitePage } from "@/components/site";

export const Route = createFileRoute("/meet-scout")({
  head: () => ({
    meta: [
      { title: "Meet Scout | Used Car Scout" },
      { name: "description", content: "Scout explains car words in plain English, writes polite seller messages, and lets you practice first." },
      { property: "og:title", content: "Meet Scout | Used Car Scout" },
      { property: "og:description", content: "Scout explains car words in plain English, writes polite seller messages, and lets you practice first." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MeetScoutPage,
});

function MeetScoutPage() {
  return (
    <SitePage>
      {(copy) => (
        <>
          <MeetScoutSection copy={copy} />
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
