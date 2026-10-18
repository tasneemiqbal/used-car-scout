// Browser-safe: the two numbers a buyer actually acts on. Both are arithmetic
// over figures we already hold, the model is never asked to price or rate a car.
import { z } from "zod";

// A near-term-work deduction larger than this share of the asking price stops
// being a negotiating position and becomes an insult. Cheap cars are exactly
// where the raw arithmetic goes furthest wrong.
const MAX_DEDUCTION_SHARE = 0.25;

export const verdictInputSchema = z
  .object({
    askingPrice: z.number().finite().positive(),
    repairs: z.number().finite().nonnegative(),
    annualMaintenance: z.number().finite().nonnegative(),
    recallsAvailable: z.boolean(),
    complaintsAvailable: z.boolean(),
    complaintsSampled: z.number().int().nonnegative(),
    complaintsTotal: z.number().int().nonnegative().nullable(),
    parkIt: z.boolean(),
    deaths: z.number().int().nonnegative(),
    injuries: z.number().int().nonnegative(),
    crashOrFire: z.boolean(),
    scam: z.boolean().default(false),
    sellerProblem: z.boolean().default(false),
    titleConcern: z.boolean().default(false),
    language: z.enum(["en", "es"]).default("en"),
  })
  .strict();

export const verdictSchema = z
  .object({
    fairOffer: z.number().int().nonnegative(),
    deduction: z.number().int().nonnegative(),
    risk: z.enum(["low", "medium", "high", "unknown"]),
    riskReason: z.string().max(300),
    offerBasis: z.string().max(300),
  })
  .strict();

export type Verdict = z.infer<typeof verdictSchema>;

const roundTo50 = (value: number) => Math.max(0, Math.round(value / 50) * 50);
const dollars = (value: number) => `$${Math.round(value).toLocaleString()}`;

/**
 * A fair opening offer is the asking price less the near-term work we can name:
 * the repair allowance and one year of routine upkeep, never more than a
 * quarter of the asking price. Rounded to the nearest $50 because a figure this
 * estimated should not pretend to be exact.
 */
export function judgeDeal(raw: z.input<typeof verdictInputSchema>): Verdict {
  const input = verdictInputSchema.parse(raw);

  const namedWork = input.repairs + input.annualMaintenance;
  const cap = Math.round(input.askingPrice * MAX_DEDUCTION_SHARE);
  const deduction = Math.min(namedWork, cap);
  const capped = deduction < namedWork;

  let offerBasis = capped
    ? `Asking price less ${dollars(deduction)}, a quarter of the asking price, the most this reasoning will take off ${
        input.askingPrice < 2_000 ? "so cheap a car" : "a car this cheap"
      }.`
    : `Asking price less ${dollars(input.repairs)} set aside for repairs and ${dollars(
        input.annualMaintenance,
      )} for one year of upkeep.`;

  const sampled = `the ${input.complaintsSampled} complaint${
    input.complaintsSampled === 1 ? "" : "s"
  } sampled from ${input.complaintsTotal?.toLocaleString() ?? "those on file"}`;

  let risk: Verdict["risk"] = "low";
  let riskReason = `No crash, fire, injury or death in ${sampled}.`;

  if (input.scam) {
    risk = "high";
    riskReason = "Possible scam signs in the listing. Do not send money before seeing the car and checking the title.";
  } else if (!input.recallsAvailable && !input.complaintsAvailable && !input.sellerProblem && !input.titleConcern) {
    risk = "unknown";
    riskReason = "Neither records source answered, so nothing here has been checked.";
  } else if (input.deaths > 0 || input.parkIt) {
    risk = "high";
    riskReason =
      input.deaths > 0
        ? `${input.deaths} death${input.deaths === 1 ? "" : "s"} in ${sampled}.`
        : `A recall in ${sampled.replace("complaint", "record")} tells owners not to park it.`;
  } else if (input.crashOrFire || input.injuries > 0) {
    risk = "medium";
    riskReason = input.crashOrFire
      ? `Crash or fire reported in ${sampled}.`
      : `${input.injuries} injur${input.injuries === 1 ? "y" : "ies"} reported in ${sampled}.`;
  } else if (input.sellerProblem || input.titleConcern) {
    risk = "medium";
    riskReason = input.sellerProblem ? "The seller describes a problem. Check it in person and ask for repair records before making an offer." : "The listing describes a title issue. Verify the paperwork before paying.";
  } else if (!input.recallsAvailable || !input.complaintsAvailable) {
    risk = "unknown";
    riskReason = "One records source did not answer. The available sample cannot establish low risk.";
  }

  if (input.language === "es") {
    offerBasis = capped ? `Precio anunciado menos ${dollars(deduction)}, como máximo el 25% del precio. Es una oferta inicial estimada, no una valoración.` : `Precio anunciado menos ${dollars(input.repairs)} reservados para reparaciones y ${dollars(input.annualMaintenance)} para un año de mantenimiento.`;
    const sample = `las ${input.complaintsSampled} quejas de una muestra de ${input.complaintsTotal?.toLocaleString() ?? "las quejas registradas"}`;
    riskReason = input.scam ? "Posibles señales de estafa. No envíes dinero antes de ver el auto y revisar el título." : input.deaths > 0 ? `${input.deaths} muertes reportadas en ${sample}.` : input.parkIt ? "Un retiro incluye una advertencia urgente. Pide al concesionario que confirme si aplica a este auto antes de manejar." : input.crashOrFire ? `Choque o incendio reportado en ${sample}.` : input.injuries > 0 ? `${input.injuries} lesiones reportadas en ${sample}.` : input.sellerProblem ? "El vendedor describe un problema. Revísalo en persona y pide registros antes de hacer una oferta." : input.titleConcern ? "El anuncio describe un problema con el título. Revisa los documentos antes de pagar." : risk === "unknown" ? "No respondieron todas las fuentes. No hay datos suficientes para establecer riesgo bajo." : `No hay choques, incendios, lesiones ni muertes en ${sample}.`;
  }
  return {
    fairOffer: roundTo50(input.askingPrice - deduction),
    deduction,
    risk,
    riskReason,
    offerBasis,
  };
}
