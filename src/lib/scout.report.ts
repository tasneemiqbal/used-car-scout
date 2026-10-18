// Browser-safe contract for a stored report. The server validates against this
// before saving, and the report screen renders from the same shape.
import { z } from "zod";
import { vehicleSchema } from "./scout.schemas";
import { verdictSchema } from "./scout.verdict";
import { listingEvidenceSchema } from "./scout.listing-evidence";

const sourceSchema = z
  .object({
    source: z.enum(["nhtsa", "fueleconomy"]),
    url: z.string().url(),
    fetchedAt: z.string().datetime(),
    status: z.enum(["available", "unavailable"]),
    count: z.number().int().nonnegative().nullable(),
    reason: z.string().max(300).nullable().optional(),
    // The exact model wording a source recognised, shown when it differs from
    // what the buyer typed (for example "Altima" for a listing saying "Altima 2.5 SV").
    checkedAs: z.string().max(120).optional(),
  })
  .strict();

const recallSchema = z
  .object({
    campaign: z.string().max(64),
    component: z.string().max(200),
    received: z.string().max(40),
    summary: z.string().max(1200),
    consequence: z.string().max(1200),
    remedy: z.string().max(1200),
    parkIt: z.boolean(),
  })
  .strict();

const complaintSchema = z
  .object({
    odiNumber: z.string().max(32),
    components: z.string().max(240),
    summary: z.string().max(1200),
    filed: z.string().max(40),
    crash: z.boolean(),
    fire: z.boolean(),
    injuries: z.number().int().nonnegative(),
    deaths: z.number().int().nonnegative(),
  })
  .strict();

export const evidenceBundleSchema = z
  .object({
    recalls: sourceSchema.extend({ items: z.array(recallSchema).max(12) }),
    complaints: sourceSchema.extend({ items: z.array(complaintSchema).max(10) }),
    fuelEconomy: sourceSchema.extend({ combinedMpg: z.number().positive().nullable().optional(), variants: z.array(z.object({ label: z.string().max(200), mpg: z.number().positive() })).max(30).optional() }),
    safetyRatings: sourceSchema.extend({ variants: z.array(z.object({ label: z.string().max(200), overall: z.number().min(1).max(5).nullable() })).max(12).optional() }),
    otherYears: z.array(z.object({ year: z.number().int(), count: z.number().int().nonnegative().nullable(), status: z.enum(["available", "unavailable"]), url: z.string().url(), fetchedAt: z.string().datetime() })).max(11).optional(),
  })
  .strict();

const costSchema = z
  .object({
    purchase: z.number().finite(),
    fuel: z.number().finite().nullable(),
    maintenance: z.number().finite(),
    repairs: z.number().finite(),
    total: z.number().finite(),
    estimate: z.literal(true),
    fuelIncluded: z.boolean(),
    excluded: z.array(z.string().max(80)).max(12),
    assumptions: z
      .object({
        annualMiles: z.number().finite(),
        combinedMpg: z.number().finite().nullable(),
        dollarsPerGallon: z.number().finite().nullable(),
        annualMaintenance: z.number().finite(),
        repairAllowance: z.number().finite(),
      })
      .strict(),
  })
  .strict();

// Wording comes from the model, so every field is length-bounded here before it
// is ever stored or shown. Plain text only, never markup.
const wordingSchema = z
  .object({
    headline: z.string().trim().min(1).max(300),
    concerns: z
      .array(
        z
          .object({
            point: z.string().trim().min(1).max(400),
            why: z.string().trim().min(1).max(900),
          })
          .strict(),
      )
      .min(1)
      .max(4),
    questions: z.array(z.string().trim().min(1).max(400)).min(2).max(5),
    caveats: z.array(z.string().trim().min(1).max(400)).min(1).max(4),
    priceRange: z.object({ low: z.number().int().positive(), high: z.number().int().positive(), basis: z.string().max(400) }).refine((range) => range.high >= range.low).optional(),
  })
  .strict();

export const storedReportSchema = z
  .object({
    car: vehicleSchema,
    wording: wordingSchema,
    evidence: evidenceBundleSchema,
    cost: costSchema,
    verdict: verdictSchema,
    generatedAt: z.string().datetime(),
    language: z.enum(["en", "es"]).optional(),
    listing: listingEvidenceSchema.optional(),
  })
  .strict();

export type StoredReport = z.infer<typeof storedReportSchema>;
export type ReportWording = z.infer<typeof wordingSchema>;

export function parseReportWording(raw: string): ReportWording {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("The summary came back unreadable.");
  const parsed = wordingSchema.safeParse(JSON.parse(raw.slice(start, end + 1)));
  if (!parsed.success) throw new Error("The summary came back incomplete.");
  return parsed.data;
}
