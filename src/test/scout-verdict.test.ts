import { describe, expect, it } from "vitest";

import { judgeDeal } from "../lib/scout.verdict";

const BASE = {
  askingPrice: 15_000,
  repairs: 1_500,
  annualMaintenance: 1_000,
  recallsAvailable: true,
  complaintsAvailable: true,
  complaintsSampled: 10,
  complaintsTotal: 2_313,
  parkIt: false,
  deaths: 0,
  injuries: 0,
  crashOrFire: false,
};

describe("the fair opening offer", () => {
  it("takes the named near-term work off the asking price", () => {
    const verdict = judgeDeal(BASE);
    // 15,000 - 1,500 repairs - 1,000 one year of upkeep = 12,500
    expect(verdict.fairOffer).toBe(12_500);
    expect(verdict.deduction).toBe(2_500);
    expect(verdict.offerBasis).toContain("$1,500");
    expect(verdict.offerBasis).toContain("$1,000");
  });

  it("refuses to cut a cheap car to the bone", () => {
    // $2,500 of named work against a $4,200 car would leave a $1,700 offer.
    // A quarter of the asking price is the most this reasoning will take off.
    const verdict = judgeDeal({ ...BASE, askingPrice: 4_200 });
    expect(verdict.deduction).toBe(1_050);
    expect(verdict.fairOffer).toBe(3_150);
    expect(verdict.offerBasis).toContain("quarter of the asking price");
  });

  it("still leaves a cheap car's offer above zero", () => {
    expect(judgeDeal({ ...BASE, askingPrice: 400 }).fairOffer).toBe(300);
    // $60 less the $15 cap is $45, and $45 rounds to the nearest $50.
    const tiny = judgeDeal({ ...BASE, askingPrice: 60 });
    expect(tiny.fairOffer).toBe(50);
    expect(tiny.fairOffer).toBeLessThanOrEqual(60);
  });

  it("rounds an untidy offer to the nearest $50", () => {
    expect(judgeDeal({ ...BASE, askingPrice: 15_037 }).fairOffer).toBe(12_550);
    expect(judgeDeal({ ...BASE, askingPrice: 15_020 }).fairOffer).toBe(12_500);
  });

  it("states the deduction it actually used", () => {
    // The printed basis must match the number shown, capped or not.
    const capped = judgeDeal({ ...BASE, askingPrice: 4_200 });
    expect(capped.offerBasis).toContain("$1,050");
    expect(capped.offerBasis).not.toContain("$2,500");
  });
});

describe("the risk rating", () => {
  it("says which complaints were looked at", () => {
    expect(judgeDeal(BASE).riskReason).toContain("10 complaints sampled from 2,313");
  });

  it("rates a reported death as high risk", () => {
    const verdict = judgeDeal({ ...BASE, deaths: 2 });
    expect(verdict.risk).toBe("high");
    expect(verdict.riskReason).toContain("2 deaths");
  });

  it("rates a do-not-park recall as high risk", () => {
    expect(judgeDeal({ ...BASE, parkIt: true }).risk).toBe("high");
  });

  it("rates a reported crash or fire as medium risk", () => {
    const verdict = judgeDeal({ ...BASE, crashOrFire: true });
    expect(verdict.risk).toBe("medium");
    expect(verdict.riskReason).toContain("Crash or fire");
  });

  it("says unknown when neither source answered", () => {
    const verdict = judgeDeal({
      ...BASE,
      recallsAvailable: false,
      complaintsAvailable: false,
    });
    expect(verdict.risk).toBe("unknown");
    expect(verdict.riskReason).toContain("Neither records source answered");
  });

  it("keeps the offer the same whatever the risk rating", () => {
    // The offer is arithmetic on cost only; a scary complaint must not move it.
    expect(judgeDeal({ ...BASE, deaths: 5 }).fairOffer).toBe(judgeDeal(BASE).fairOffer);
  });

  it("refuses an asking price that is not a positive number", () => {
    expect(() => judgeDeal({ ...BASE, askingPrice: 0 })).toThrow();
  });
});
