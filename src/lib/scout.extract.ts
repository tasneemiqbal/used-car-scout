// Browser-safe contract for reading a listing. The model only ever fills
// editable form fields with what the listing itself states. It is user input,
// never evidence, and it carries no seller identity or contact details.
import { z } from "zod";
import { IMAGE_BYTE_LIMIT, LISTING_CHARACTER_LIMIT, vehicleSchema } from "./scout.schemas";
import { isVinShaped, normalizeVin, vinCheckDigitOk } from "./scout.vin";

export const SCREENSHOT_LIMIT = 4;

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]/;
const PHONE = /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/;
const STREET = /\b\d{1,6}\s+\w+(?:\s\w+)?\s+(?:st|street|ave|avenue|rd|road|blvd|dr|drive|ln|lane|ct|court|way)\b/i;

/** A listing is untrusted, so a read that smuggled in contact details is dropped. */
function carriesContact(value: unknown) {
  if (typeof value !== "string") return false;
  return EMAIL.test(value) || PHONE.test(value) || STREET.test(value);
}

export const LISTING_FIELDS = [
  "year", "make", "model", "trim", "mileage", "askingPrice", "location", "vin", "titleStatus", "condition",
] as const;
export type ListingField = (typeof LISTING_FIELDS)[number];
export const TITLE_STATUSES = ["clean", "salvage", "rebuilt", "lien", "missing", "other"] as const;

const shortText = (max: number) => z.string().trim().min(1).max(max);

const fieldSchemas = {
  year: vehicleSchema.shape.year,
  make: vehicleSchema.shape.make,
  model: vehicleSchema.shape.model,
  trim: shortText(80),
  mileage: vehicleSchema.shape.mileage,
  askingPrice: vehicleSchema.shape.askingPrice,
  location: shortText(80),
  vin: z.string().refine(isVinShaped),
  titleStatus: z.enum(TITLE_STATUSES),
  condition: shortText(400),
} satisfies Record<ListingField, z.ZodTypeAny>;

export const extractedListingSchema = z
  .object({
    year: fieldSchemas.year.nullable(),
    make: fieldSchemas.make.nullable(),
    model: fieldSchemas.model.nullable(),
    trim: fieldSchemas.trim.nullable(),
    mileage: fieldSchemas.mileage.nullable(),
    askingPrice: fieldSchemas.askingPrice.nullable(),
    location: fieldSchemas.location.nullable(),
    vin: fieldSchemas.vin.nullable(),
    titleStatus: fieldSchemas.titleStatus.nullable(),
    condition: fieldSchemas.condition.nullable(),
    uncertain: z.array(z.enum(LISTING_FIELDS)).max(LISTING_FIELDS.length),
    confidence: z.enum(["high", "medium", "low"]),
    summary: shortText(400).nullable(),
    redFlags: z.array(shortText(300)).max(5),
    questions: z.array(shortText(300)).max(5),
  })
  .strict();

export type ExtractedListing = z.infer<typeof extractedListingSchema>;

const dataUrlSchema = z
  .string()
  .max(Math.ceil((IMAGE_BYTE_LIMIT * 4) / 3) + 64)
  .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, "Use a JPG, PNG, or WebP image.");

/** What the buyer sends: pasted words, up to four screenshots, or both. No links are fetched. */
export const listingInputSchema = z
  .object({
    text: z.string().trim().max(LISTING_CHARACTER_LIMIT).default(""),
    images: z.array(dataUrlSchema).max(SCREENSHOT_LIMIT, `Up to ${SCREENSHOT_LIMIT} screenshots at a time.`).default([]),
    language: z.enum(["en", "es"]).default("en"),
  })
  .strict()
  .refine((input) => input.text.length > 0 || input.images.length > 0, "Paste the listing words or add a screenshot first.");

function textList(value: unknown, max: number) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string" && !carriesContact(entry))
    .map((entry) => entry.trim().slice(0, 300))
    .filter(Boolean)
    .slice(0, max);
}

/**
 * Pulls the JSON object out of the model reply and validates every field on its
 * own. A field that fails its rules is left empty and marked for the buyer to
 * check, instead of a bad value being shown as a fact.
 */
export function parseExtractedListing(raw: string): ExtractedListing {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("The listing could not be read. Try again.");
  let candidate: Record<string, unknown>;
  try {
    candidate = JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    throw new Error("The listing could not be read. Try again.");
  }

  const uncertain = new Set<ListingField>(
    Array.isArray(candidate["uncertain"])
      ? candidate["uncertain"].filter((f): f is ListingField => LISTING_FIELDS.includes(f as ListingField))
      : [],
  );

  const values = {} as Record<ListingField, unknown>;
  for (const field of LISTING_FIELDS) {
    let value = candidate[field];
    if (value === undefined || value === "" || value === 0 || (typeof value === "number" && Number.isNaN(value))) value = null;
    if (typeof value === "string" && field === "vin") value = normalizeVin(value);
    if (typeof value === "string" && field === "titleStatus") value = value.toLowerCase();
    if (value !== null && carriesContact(value)) value = null;
    if (value !== null && !fieldSchemas[field].safeParse(value).success) {
      value = null;
      uncertain.add(field);
    }
    values[field] = value;
  }
  if (typeof values.vin === "string" && !vinCheckDigitOk(values.vin)) uncertain.add("vin");
  for (const field of LISTING_FIELDS) if (values[field] === null) uncertain.delete(field);

  const summary = typeof candidate["summary"] === "string" && !carriesContact(candidate["summary"])
    ? candidate["summary"].trim().slice(0, 400) || null
    : null;
  const confidence = ["high", "medium", "low"].includes(candidate["confidence"] as string) ? candidate["confidence"] : "low";

  const parsed = extractedListingSchema.safeParse({
    ...values,
    uncertain: [...uncertain],
    confidence,
    summary,
    redFlags: textList(candidate["redFlags"], 5),
    questions: textList(candidate["questions"], 5),
  });
  if (!parsed.success) throw new Error("The listing could not be read. Try again.");
  return parsed.data;
}

export function isEnoughToCheck(listing: ExtractedListing) {
  return (
    listing.year !== null &&
    listing.make !== null &&
    listing.model !== null &&
    listing.mileage !== null &&
    listing.askingPrice !== null
  );
}
