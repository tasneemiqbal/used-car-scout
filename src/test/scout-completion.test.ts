import { describe, expect, it } from "vitest";
import { checkRequestSchema, listingConcerns, listingSignals } from "@/lib/scout.listing-evidence";
import { fuelMpg, menuRows, starRating } from "@/lib/scout.sources";
import { buildViewingSteps, summarizeViewing } from "@/lib/scout.viewing";
import { scoutReplySchema } from "@/lib/scout.chat";
import { judgeDeal } from "@/lib/scout.verdict";

const listing = { condition: "Transmission slips. Check engine light on.", titleStatus: "clean" as const, redFlags: ["Pay by gift card before viewing; seller deployed overseas."], questions: ["Can I see the title?"] };
const base = { askingPrice: 7500, repairs: 1500, annualMaintenance: 1000, recallsAvailable: true, complaintsAvailable: true, complaintsSampled: 10, complaintsTotal: 100, parkIt: false, deaths: 0, injuries: 0, crashOrFire: false };
describe("remaining product rules", () => {
  it.each([
    "Runs well, no warning lights.",
    "No check engine light. No leaks.",
    "Warning lights are off. Check engine light is not on.",
    "Funciona bien, sin luces de advertencia. Sin fugas.",
    "Sin luz del motor.",
  ])("does not mark a denied mechanical symptom as an admitted fault: %s", (condition) => {
    expect(listingSignals({ condition, titleStatus: "clean", redFlags: [], questions: [] }).mechanical).toBe(false);
  });
  it.each([
    "No warning lights, but transmission slips.",
    "No leaks. Check engine light is on.",
    "Sin luces de advertencia, pero la transmisión patina.",
    "Warning lights are on.",
  ])("preserves a real fault alongside a denial: %s", (condition) => {
    expect(listingSignals({ condition, titleStatus: "clean", redFlags: [], questions: [] }).mechanical).toBe(true);
  });
  it("does not treat an explicitly unnecessary deposit as a scam signal", () => {
    expect(listingSignals({ condition: "No depósito necesario. Sin envío. No tarjetas de regalo.", titleStatus: "clean", redFlags: [], questions: [] }).scam).toBe(false);
  });
  it("drops VINs and unformatted phone numbers from stored claims", () => {
    const result = checkRequestSchema.parse({ year: 2013, make: "Nissan", model: "Altima", mileage: 148000, askingPrice: 7500, listing: { ...listing, condition: "VIN 1N4AL3AP4DN123456", redFlags: ["Call 2125551234"] } });
    expect(result.listing?.condition).toBe(""); expect(result.listing?.redFlags).toEqual([""]);
  });
  it("retains sanitized listing warnings with Spanish report requests", () => {
    const result = checkRequestSchema.parse({ year: 2013, make: "Nissan", model: "Altima", mileage: 148000, askingPrice: 7500, listing, language: "es" });
    expect(result.listing?.condition).toBe("Transmission slips. Check engine light on.");
    expect(result.language).toBe("es");
  });
  it("scam signs are first and force high risk even without official sources", () => {
    const signals = listingSignals(listing);
    expect(listingConcerns(listing, "en")[0]?.point).toBe("Possible scam signs in this listing");
    expect(judgeDeal({ ...base, scam: signals.scam, recallsAvailable: false, complaintsAvailable: false }).risk).toBe("high");
  });
  it("seller-admitted transmission and engine issues prevent low risk", () => {
    expect(judgeDeal({ ...base, sellerProblem: listingSignals({ ...listing, redFlags: [] }).mechanical }).risk).toBe("medium");
  });
  it("a missing source cannot produce low risk", () => { expect(judgeDeal({ ...base, recallsAvailable: false }).risk).toBe("unknown"); });
  it("Spanish wording keeps the same concrete risk and offer arithmetic", () => {
    const en = judgeDeal({ ...base, scam: true });
    const es = judgeDeal({ ...base, scam: true, language: "es" });
    expect(es.risk).toBe("high"); expect(es.fairOffer).toBe(en.fairOffer); expect(es.deduction).toBe(en.deduction);
  });
  it("does not store contact details inside seller notes", () => {
    const result = checkRequestSchema.parse({ year: 2013, make: "Nissan", model: "Altima", mileage: 148000, askingPrice: 7500, listing: { ...listing, condition: "Call 212-555-1234", redFlags: ["email seller@example.com"] } });
    expect(result.listing?.condition).toBe(""); expect(result.listing?.redFlags).toEqual([""]);
  });
  it("reads single fuel options and numeric-string MPG only for the same car", () => {
    expect(menuRows({ menuItem: { text: "2.5 L", value: "32611" } })).toEqual([{ text: "2.5 L", value: "32611" }]);
    expect(fuelMpg({ year: "2013", make: "Nissan", model: "Altima", comb08: "31", fuelType: "Regular" }, { year: 2013, make: "Nissan", model: "Altima" })).toBe(31);
    expect(fuelMpg({ year: "2012", make: "Nissan", model: "Altima", comb08: "31" }, { year: 2013, make: "Nissan", model: "Altima" })).toBeNull();
  });
  it("does not call Not Rated zero stars", () => { expect(starRating("Not Rated")).toBeNull(); expect(starRating("5")).toBe(5); });
  it("a skipped viewing check cannot imply a fully checked car", () => {
    const steps = buildViewingSteps({ concerns: [], recallCount: 0 });
    const choices = Object.fromEntries(steps.map((step) => [step.id, "fine" as const]));
    const result = summarizeViewing(steps, { ...choices, papers: "skip" });
    expect(result.verdict).toBe("slow-down"); expect(result.skipped[0]?.id).toBe("papers"); expect(result.questions).toEqual([steps[0]?.ask]);
  });
  it("validates contextual followups and all three practice feedback fields", () => {
    const answer = { answer: "Ask to see the title.", followUps: ["How do I check the title?", "What if the name differs?"], sellerMessage: null, feedback: { didWell: "You asked for records.", tryNext: "Pause before agreeing.", strongerPhrase: "I need time to review the title." } };
    expect(scoutReplySchema.parse(answer).followUps).toHaveLength(2);
    expect(scoutReplySchema.safeParse({ ...answer, feedback: { didWell: "Good" } }).success).toBe(false);
  });
});