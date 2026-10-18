import { describe, expect, it } from "vitest";

import { modelCandidates } from "../lib/scout.evidence.server";

describe("matching the records to the car", () => {
  it("tries the buyer's own wording before shortening it", () => {
    expect(modelCandidates("Altima 2.5 SV")).toEqual(["Altima 2.5 SV", "Altima 2.5", "Altima"]);
  });

  it("never invents a model name that was not in the listing", () => {
    for (const candidate of modelCandidates("Corolla LE")) {
      expect("Corolla LE".startsWith(candidate)).toBe(true);
    }
  });

  it("leaves a single-word model alone", () => {
    expect(modelCandidates("Civic")).toEqual(["Civic"]);
  });

  it("keeps multi-word models intact and only trims from the right", () => {
    expect(modelCandidates("Ram 1500 Tradesman")).toEqual([
      "Ram 1500 Tradesman",
      "Ram 1500",
      "Ram",
    ]);
  });

  it("caps how many wordings it will try", () => {
    expect(modelCandidates("a b c d e f").length).toBe(4);
  });

  it("ignores stray whitespace", () => {
    expect(modelCandidates("  Altima   2.5  ")).toEqual(["Altima 2.5", "Altima"]);
  });
});
