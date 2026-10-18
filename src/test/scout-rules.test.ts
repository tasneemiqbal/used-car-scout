import { describe, expect, it, vi } from "vitest";
import { listingInputSchema as listingSchema } from "@/lib/scout.extract";
import { calculateThreeYearCost, evidenceSchema, IMAGE_BYTE_LIMIT, reportLookupSchema, validateImage, vehicleSchema } from "@/lib/scout.schemas";

describe("Scout input and evidence rules", () => {
  it("validates model years at request time even when the module starts with an epoch clock", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("1970-01-01T00:00:00Z"));
      vi.resetModules();
      const { vehicleSchema: requestSchema } = await import("@/lib/scout.schemas");
      vi.setSystemTime(new Date("2026-10-18T01:25:00Z"));
      expect(requestSchema.shape.year.safeParse(2014).success).toBe(true);
      expect(requestSchema.shape.year.safeParse(2027).success).toBe(true);
      expect(requestSchema.shape.year.safeParse(2028).success).toBe(false);
      expect(requestSchema.shape.year.safeParse(1979).success).toBe(false);
    } finally {
      vi.useRealTimers();
      vi.resetModules();
    }
  });
  it("accepts 10,000 listing characters and rejects 10,001", () => {
    expect(listingSchema.safeParse({ text: "a".repeat(10_000) }).success).toBe(true);
    expect(listingSchema.safeParse({ text: "a".repeat(10_001) }).success).toBe(false);
  });
  it("caps images at 5 MB", () => {
    expect(IMAGE_BYTE_LIMIT).toBe(5 * 1024 * 1024);
    expect(() => validateImage(new Uint8Array(5 * 1024 * 1024 + 1), "image/png")).toThrow();
  });
  it("rejects a forged image MIME type", () => {
    expect(() => validateImage(new TextEncoder().encode("not a picture"), "image/png")).toThrow();
  });
  it("accepts random UUID report links but rejects sequential identifiers and arbitrary filters", () => {
    expect(reportLookupSchema.safeParse({ id: "33b94d88-f716-4c2c-a686-85287436e759" }).success).toBe(true);
    expect(reportLookupSchema.safeParse({ id: "1" }).success).toBe(false);
    expect(reportLookupSchema.safeParse({ id: "33b94d88-f716-4c2c-a686-85287436e759", all: true }).success).toBe(false);
  });
  it("excludes seller details from vehicle storage contract", () => {
    expect(vehicleSchema.safeParse({ year: 2013, make: "Nissan", model: "Altima", mileage: 120000, askingPrice: 7500, sellerEmail: "seller@example.com" }).success).toBe(false);
  });
  it("does not convert unavailable source evidence into zero complaints", () => {
    const base = { source: "nhtsa", url: "https://api.nhtsa.gov/complaints/complaintsByVehicle", fetchedAt: "2026-10-15T18:00:00Z", status: "unavailable" };
    expect(evidenceSchema.safeParse({ ...base, count: 0 }).success).toBe(false);
    expect(evidenceSchema.safeParse({ ...base, count: null }).success).toBe(true);
  });
  it("calculates a three-year estimate from explicit assumptions and lists exclusions", () => {
    const result = calculateThreeYearCost(7500, { annualMiles: 10000, combinedMpg: 25, dollarsPerGallon: 3.5, annualMaintenance: 600, repairAllowance: 2000 });
    expect(result.fuel).toBe(4200);
    expect(result.maintenance).toBe(1800);
    expect(result.total).toBe(15500);
    expect(result.excluded).toContain("insurance");
    expect(result.estimate).toBe(true);
  });
});