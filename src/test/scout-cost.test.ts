import { describe, expect, it } from "vitest";

import { estimateOwnershipCost } from "../lib/scout.cost";

const BASE = {
  annualMiles: 12_000,
  combinedMpg: null,
  dollarsPerGallon: null,
  annualMaintenance: 1_000,
  repairAllowance: 1_500,
};

describe("three-year ownership estimate", () => {
  it("excludes fuel from the total when no official figure exists", () => {
    const cost = estimateOwnershipCost(6_900, BASE);
    expect(cost.fuel).toBeNull();
    expect(cost.fuelIncluded).toBe(false);
    expect(cost.total).toBe(6_900 + 3_000 + 1_500);
    expect(cost.excluded[0]).toBe("fuel");
    expect(cost.estimate).toBe(true);
  });

  it("prices fuel when an official figure and pump price are both supplied", () => {
    const cost = estimateOwnershipCost(6_900, {
      ...BASE,
      combinedMpg: 31,
      dollarsPerGallon: 3.5,
    });
    // 3 years x 12,000 miles / 31 mpg x $3.50 = 4,064.5 -> 4,065
    expect(cost.fuel).toBe(4_065);
    expect(cost.fuelIncluded).toBe(true);
    expect(cost.total).toBe(6_900 + 4_065 + 3_000 + 1_500);
    expect(cost.excluded).not.toContain("fuel");
  });

  it("keeps taxes, insurance and resale value out of every total", () => {
    const cost = estimateOwnershipCost(6_900, { ...BASE, combinedMpg: 31, dollarsPerGallon: 3.5 });
    for (const item of ["taxes", "insurance", "registration and fees", "financing", "resale value"]) {
      expect(cost.excluded).toContain(item);
    }
  });

  it("refuses a price that is not a positive number", () => {
    expect(() => estimateOwnershipCost(0, BASE)).toThrow();
    expect(() => estimateOwnershipCost(Number.NaN, BASE)).toThrow();
  });

  it("leaves fuel unpriced when a fuel figure arrives without a pump price", () => {
    const cost = estimateOwnershipCost(6_900, { ...BASE, combinedMpg: 31 });
    expect(cost.fuel).toBeNull();
    expect(cost.fuelIncluded).toBe(false);
    expect(cost.total).toBe(6_900 + 3_000 + 1_500);
    expect(cost.excluded).toContain("fuel");
  });
});
