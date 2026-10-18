import { z } from "zod";

export const LISTING_CHARACTER_LIMIT = 10_000;
export const IMAGE_BYTE_LIMIT = 5 * 1024 * 1024;
export const reportLookupSchema = z.object({ id: z.string().uuid() }).strict();
export const vehicleSchema = z.object({
  // Workers can expose an epoch clock during module initialization. Read the
  // current year only while validating a request, never while building schemas.
  year: z.number().int().min(1980).refine(
    (year) => year <= new Date().getUTCFullYear() + 1,
    "Use a model year no later than next year.",
  ),
  make: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(80),
  mileage: z.number().int().min(0).max(2_000_000),
  askingPrice: z.number().finite().positive().max(1_000_000),
}).strict();
export type Vehicle = z.infer<typeof vehicleSchema>;

export const evidenceSchema = z.object({
  source: z.enum(["nhtsa", "fueleconomy"]),
  url: z.string().url(),
  fetchedAt: z.string().datetime(),
  status: z.enum(["available", "unavailable"]),
  count: z.number().int().nonnegative().nullable(),
  // The exact model wording a source recognised, when it differs from the listing.
  checkedAs: z.string().max(120).optional(),
}).strict().superRefine((evidence, ctx) => {
  if (evidence.status === "unavailable" && evidence.count !== null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Unavailable evidence cannot claim a count." });
  }
});

export const costAssumptionsSchema = z.object({
  annualMiles: z.number().finite().nonnegative(),
  combinedMpg: z.number().finite().positive(),
  dollarsPerGallon: z.number().finite().nonnegative(),
  annualMaintenance: z.number().finite().nonnegative(),
  repairAllowance: z.number().finite().nonnegative(),
}).strict();

export function calculateThreeYearCost(price: number, input: z.infer<typeof costAssumptionsSchema>) {
  const askingPrice = vehicleSchema.shape.askingPrice.parse(price);
  const assumptions = costAssumptionsSchema.parse(input);
  const fuel = Math.round(3 * assumptions.annualMiles / assumptions.combinedMpg * assumptions.dollarsPerGallon);
  const maintenance = Math.round(3 * assumptions.annualMaintenance);
  const repairs = Math.round(assumptions.repairAllowance);
  return {
    purchase: askingPrice, fuel, maintenance, repairs,
    total: askingPrice + fuel + maintenance + repairs,
    estimate: true as const,
    excluded: ["taxes", "insurance", "registration and fees", "financing", "resale value"],
    assumptions,
  };
}

export function validateImage(bytes: Uint8Array, mime: string) {
  if (bytes.length === 0 || bytes.length > IMAGE_BYTE_LIMIT) throw new Error("Image must be no larger than 5 MB.");
  const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71 && bytes[4] === 13 && bytes[5] === 10 && bytes[6] === 26 && bytes[7] === 10;
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!((mime === "image/png" && png) || (mime === "image/jpeg" && jpeg) || (mime === "image/webp" && webp))) {
    throw new Error("Use a JPG, PNG, or WebP image. HEIC is not supported yet.");
  }
}