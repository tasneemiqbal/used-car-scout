// Browser-safe VIN rules and the NHTSA vPIC decoder contract. A decoded VIN
// gives factory specifications only: never history, accidents, title or condition.
import { z } from "zod";

const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;
const VALUES: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};
const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

export function normalizeVin(value: string) {
  return value.toUpperCase().replace(/[\s-]/g, "");
}

/** 17 characters, no I, O or Q. */
export function isVinShaped(value: string) {
  return VIN_PATTERN.test(normalizeVin(value));
}

/** North American check digit (position 9). A failure usually means a typo. */
export function vinCheckDigitOk(value: string) {
  const vin = normalizeVin(value);
  if (!VIN_PATTERN.test(vin)) return false;
  const sum = [...vin].reduce((total, char, i) => {
    const n = /\d/.test(char) ? Number(char) : (VALUES[char] ?? 0);
    return total + n * (WEIGHTS[i] ?? 0);
  }, 0);
  const remainder = sum % 11;
  return vin[8] === (remainder === 10 ? "X" : String(remainder));
}

const VIN_IN_TEXT = /\b[A-HJ-NPR-Z0-9]{17}\b/i;

export type VinInText = { vin: string; checkDigitOk: boolean };

/** Finds the first VIN-shaped token in free text, for the report chat. A bad check digit is flagged, not dropped. */
export function findVinInText(value: string): VinInText | null {
  const match = VIN_IN_TEXT.exec(value);
  if (!match) return null;
  const vin = normalizeVin(match[0]);
  return { vin, checkDigitOk: vinCheckDigitOk(vin) };
}

export const vinLookupSchema = z
  .object({ vin: z.string().transform(normalizeVin).refine((v) => VIN_PATTERN.test(v), "A VIN is 17 letters and numbers, with no I, O or Q.") })
  .strict();

export const vinSpecsSchema = z
  .object({
    vin: z.string(),
    year: z.number().int().nullable(),
    make: z.string().nullable(),
    model: z.string().nullable(),
    trim: z.string().nullable(),
    bodyClass: z.string().nullable(),
    engine: z.string().nullable(),
    fuelType: z.string().nullable(),
    driveType: z.string().nullable(),
    transmission: z.string().nullable(),
    builtIn: z.string().nullable(),
    note: z.string().nullable(),
    source: z.string().url(),
    fetchedAt: z.string().datetime(),
  })
  .strict();
export type VinSpecs = z.infer<typeof vinSpecsSchema>;

export function vpicUrl(vin: string) {
  return `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`;
}

const clean = (value: unknown) => {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text && text !== "Not Applicable" && text !== "0" ? text.slice(0, 120) : null;
};

/** Turns a vPIC DecodeVinValues reply into the few specs a buyer can use. */
export function parseVpic(vin: string, body: unknown, fetchedAt: string): VinSpecs | null {
  const row = (body as { Results?: Array<Record<string, unknown>> })?.Results?.[0];
  if (!row) return null;
  const make = clean(row["Make"]);
  const model = clean(row["Model"]);
  if (!make && !model) return null;
  const litres = clean(row["DisplacementL"]);
  const cylinders = clean(row["EngineCylinders"]);
  const engine = [litres && `${Number(litres).toFixed(1)}L`, cylinders && `${cylinders} cylinder`].filter(Boolean).join(", ") || null;
  const speeds = clean(row["TransmissionSpeeds"]);
  const style = clean(row["TransmissionStyle"]);
  const errorCode = clean(row["ErrorCode"]);
  const year = Number(clean(row["ModelYear"]));
  return vinSpecsSchema.parse({
    vin,
    year: Number.isInteger(year) && year > 1900 ? year : null,
    make,
    model,
    trim: clean(row["Trim"]),
    bodyClass: clean(row["BodyClass"]),
    engine,
    fuelType: clean(row["FuelTypePrimary"]),
    driveType: clean(row["DriveType"]),
    transmission: [speeds && `${speeds}-speed`, style].filter(Boolean).join(" ") || null,
    builtIn: clean(row["PlantCountry"]),
    note: errorCode && !errorCode.split(",").every((c) => c.trim() === "0") ? "NHTSA could only partly decode this VIN. Double-check it with the seller." : null,
    source: vpicUrl(vin),
    fetchedAt,
  });
}

/** Differences between what the VIN decodes to and what the listing claims. */
export function vinMismatches(specs: VinSpecs, listing: { year: string; make: string; model: string }) {
  const issues: string[] = [];
  const same = (a: string, b: string) => a.toLowerCase().replace(/[^a-z0-9]/g, "") === b.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (specs.year && listing.year && Number(listing.year) !== specs.year) issues.push(`The VIN says ${specs.year}, the listing says ${listing.year}.`);
  if (specs.make && listing.make && !same(specs.make, listing.make)) issues.push(`The VIN says ${specs.make}, the listing says ${listing.make}.`);
  if (specs.model && listing.model && !same(specs.model, listing.model) && !listing.model.toLowerCase().includes(specs.model.toLowerCase())) {
    issues.push(`The VIN says ${specs.model}, the listing says ${listing.model}.`);
  }
  return issues;
}
