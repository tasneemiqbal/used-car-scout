import { createFileRoute } from "@tanstack/react-router";

import { HomeSections, SitePage } from "@/components/site";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Used Car Scout | A car-savvy friend before you offer" },
      {
        name: "description",
        content:
          "Buying your first car alone? See what a used car will really cost, what to check, and what to say. Free, no sign up, built on official records.",
      },
      { property: "og:title", content: "Used Car Scout | A car-savvy friend before you offer" },
      {
        property: "og:description",
        content:
          "Paste a listing and get the real cost, the recalls, the complaints, and what to offer. Free, even if you can't afford a mechanic.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return <SitePage>{(copy) => <HomeSections copy={copy} />}</SitePage>;
}
