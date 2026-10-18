import { describe, expect, it } from "vitest";

import { isEnoughToCheck, listingInputSchema, parseExtractedListing } from "../lib/scout.extract";
import { parseVpic, vinCheckDigitOk, vinMismatches } from "../lib/scout.vin";

const FULL = JSON.stringify({
  year: 2013, make: "Nissan", model: "Altima", trim: "2.5 SV", mileage: 148000, askingPrice: 6900,
  location: "Fresno, CA", vin: "1n4al3ap9dc456789", titleStatus: "Clean", condition: "Runs well, cold A/C.",
  uncertain: [], confidence: "high", summary: "A 2013 Altima with high miles.",
  redFlags: ["Price is well below normal."], questions: ["Can I see the title?"],
});

describe("reading a listing", () => {
  it("keeps every detail the listing stated", () => {
    const listing = parseExtractedListing(`Here you go: ${FULL} done`);
    expect(listing).toMatchObject({
      year: 2013, make: "Nissan", model: "Altima", trim: "2.5 SV", mileage: 148000, askingPrice: 6900,
      location: "Fresno, CA", vin: "1N4AL3AP9DC456789", titleStatus: "clean", condition: "Runs well, cold A/C.",
    });
    expect(listing.redFlags).toEqual(["Price is well below normal."]);
    expect(listing.questions).toEqual(["Can I see the title?"]);
    expect(isEnoughToCheck(listing)).toBe(true);
  });

  it("leaves unstated details empty instead of guessing", () => {
    const listing = parseExtractedListing('{"year":2013,"make":"Nissan","confidence":"low"}');
    expect(listing.model).toBeNull();
    expect(listing.vin).toBeNull();
    expect(listing.titleStatus).toBeNull();
    expect(isEnoughToCheck(listing)).toBe(false);
  });

  it("drops seller contact details smuggled into a field", () => {
    const listing = parseExtractedListing(
      '{"model":"Altima call jane@seller.com","location":"123 Main St, Fresno","redFlags":["text 555-123-4567"],"confidence":"medium"}',
    );
    expect(listing.model).toBeNull();
    expect(listing.location).toBeNull();
    expect(listing.redFlags).toEqual([]);
  });

  it("empties an impossible year and marks nothing invented", () => {
    const listing = parseExtractedListing('{"year":1899,"make":"Nissan","confidence":"high"}');
    expect(listing.year).toBeNull();
    expect(listing.make).toBe("Nissan");
  });

  it("marks a VIN with a bad check digit as uncertain", () => {
    const listing = parseExtractedListing('{"vin":"1N4AL3AP0DC456789","confidence":"high"}');
    expect(listing.vin).toBe("1N4AL3AP0DC456789");
    expect(listing.uncertain).toContain("vin");
  });

  it("refuses a reply that is not readable", () => {
    expect(() => parseExtractedListing("I could not find a car in that.")).toThrow();
    expect(() => parseExtractedListing("{not json}")).toThrow();
  });

  it("drops invented fields from untrusted text", () => {
    const listing = parseExtractedListing(FULL.replace("{", '{"sellerEmail":"x","ignore":"me",'));
    expect(Object.keys(listing)).not.toContain("sellerEmail");
  });

  it("accepts words, up to four screenshots, or both, and never a bare request", () => {
    const shot = "data:image/png;base64,AAAA";
    expect(listingInputSchema.safeParse({ text: "2013 Altima" }).success).toBe(true);
    expect(listingInputSchema.safeParse({ images: [shot, shot, shot, shot] }).success).toBe(true);
    expect(listingInputSchema.safeParse({ images: [shot, shot, shot, shot, shot] }).success).toBe(false);
    expect(listingInputSchema.safeParse({ text: "" }).success).toBe(false);
  });
});

describe("VIN decoding", () => {
  it("checks the North American check digit", () => {
    expect(vinCheckDigitOk("1HGCM82633A004352")).toBe(true);
    expect(vinCheckDigitOk("11111111111111111")).toBe(true);
    expect(vinCheckDigitOk("1111111I111111111")).toBe(false);
  });

  it("reads specs from a vPIC reply and flags a mismatch with the listing", () => {
    const specs = parseVpic("1N4AL3AP9DC456789", {
      Results: [{ Make: "NISSAN", Model: "Altima", ModelYear: "2013", DisplacementL: "2.5", EngineCylinders: "4", ErrorCode: "0" }],
    }, "2026-10-15T00:00:00.000Z");
    expect(specs?.engine).toBe("2.5L, 4 cylinder");
    expect(specs?.note).toBeNull();
    expect(vinMismatches(specs!, { year: "2013", make: "Nissan", model: "Altima" })).toEqual([]);
    expect(vinMismatches(specs!, { year: "2015", make: "Toyota", model: "Altima" })).toHaveLength(2);
  });
});
