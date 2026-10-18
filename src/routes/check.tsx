import { createFileRoute } from "@tanstack/react-router";

import { CheckPage } from "@/components/check-page";

export const Route = createFileRoute("/check")({
  head: () => ({
    meta: [
      { title: "Check a car | Used Car Scout" },
      {
        name: "description",
        content: "Paste a used-car listing or add screenshots. Scout reads the details, flags what to verify and decodes the VIN.",
      },
      { property: "og:title", content: "Check a car | Used Car Scout" },
      {
        property: "og:description",
        content: "Paste a listing or add screenshots. Scout fills in the car, flags red flags and suggests seller questions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CheckPage,
});
