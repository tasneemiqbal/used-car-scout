import { describe, expect, it } from "vitest";
import { DEMO_LISTINGS, demoListingText } from "@/lib/scout.demo";
import { listingSignals } from "@/lib/scout.listing-evidence";

describe("fictional judge scenarios", () => {
  it("does not substitute an unknown scenario with another listing", () => {
    expect(demoListingText("not-a-demo", "en")).toBeUndefined();
  });
  it.each(["en", "es"] as const)("keeps the everyday scenario free of admitted mechanical faults in %s", (language) => {
    const condition = demoListingText("ordinary", language) ?? "";
    expect(condition.length).toBeGreaterThan(100);
    expect(listingSignals({ condition, titleStatus: "clean", redFlags: [], questions: [] }).mechanical).toBe(false);
  });
  it.each(["en", "es"] as const)("retains admitted transmission problems in %s", (language) => {
    expect(listingSignals({ condition: demoListingText("risky", language) ?? "", titleStatus: "clean", redFlags: [], questions: [] }).mechanical).toBe(true);
  });
  it.each(["en", "es"] as const)("retains payment scam signals in %s", (language) => {
    expect(listingSignals({ condition: demoListingText("scam", language) ?? "", titleStatus: "clean", redFlags: [], questions: [] }).scam).toBe(true);
  });
  it("provides three distinct scenarios without seller contact information", () => {
    expect(DEMO_LISTINGS.map((listing) => listing.id)).toEqual(["ordinary", "risky", "scam"]);
    for (const listing of DEMO_LISTINGS) {
      expect(listing.text.en).not.toMatch(/https?:\/\/|@|\b\d{3}[-.]\d{3}[-.]\d{4}\b/);
    }
  });
});