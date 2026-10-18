import { createFileRoute, Link } from "@tanstack/react-router";

import { StepsSection, SitePage } from "@/components/site";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works | Used Car Scout" },
      { name: "description", content: "Paste a listing or add screenshots, Scout checks official records, and you decide with confidence." },
      { property: "og:title", content: "How it works | Used Car Scout" },
      { property: "og:description", content: "Paste a listing or add screenshots, Scout checks official records, and you decide with confidence." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HowItWorksPage,
});

function HowItWorksPage() {
  return (
    <SitePage>
      {(copy) => (
        <>
          <StepsSection copy={copy} />
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
