import { z } from "zod";
import { vehicleSchema } from "./scout.schemas";

// Never retain the original listing, VIN, location, screenshots or seller identity.
const privateDetails = /[^\s@]+@[^\s@]+\.[^\s@]+|\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b|\b[A-HJ-NPR-Z0-9]{17}\b|https?:\/\/|\b\d{1,6}\s+\w+(?:\s\w+)?\s+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|blvd|court|ct|way)\b|(?:seller(?:'s)? name|contact|call|email|vendedor se llama|llama a)\s*[:=]/i;
const note = z.string().trim().max(400).transform((value) => privateDetails.test(value) ? "" : value);
export const listingEvidenceSchema = z.object({
  condition: note.default(""),
  titleStatus: z.enum(["", "clean", "salvage", "rebuilt", "lien", "missing", "other"]).default(""),
  redFlags: z.array(note).max(8).default([]),
  questions: z.array(note).max(5).default([]),
}).strict();
export type ListingEvidence = z.infer<typeof listingEvidenceSchema>;
export const checkRequestSchema = vehicleSchema.extend({
  language: z.enum(["en", "es"]).default("en"),
  listing: listingEvidenceSchema.optional(),
}).strict();

export function listingSignals(listing?: ListingEvidence) {
  const text = [listing?.condition, ...(listing?.redFlags ?? [])].join(" ").replace(/(?:no|sin)\s+(?:deposit|depósito)(?:\s+(?:required|needed|necesario))?|(?:no|sin)\s+(?:shipping|envío)|(?:no|sin)\s+(?:gift cards?|tarjetas? de regalo)/gi, "");
  const scam = /gift\s*cards?|wire\s*transfer|overseas|shipping|deployed|deposit.{0,40}(?:before|view|upfront)|(?:no|refus|won't|will not).{0,25}(?:view|test drive|inspection)|tarjeta[s]? de regalo|transferencia|extranjero|depósito/i.test(text);
  // Remove only explicit denials of specific symptoms, not the rest of a sentence.
  // "No warning lights, but transmission slips" must still warn about the slip.
  const mechanicalText = text
    .replace(/\b(?:no|without)\s+(?:warning\s*lights?|check[ -]engine\s*lights?|leaks?|overheating|slipping|jerking|grinding)\b/gi, "")
    .replace(/\b(?:warning\s*lights?|check[ -]engine\s*lights?)\s+(?:are\s+|is\s+)?(?:off|not\s+on)\b/gi, "")
    .replace(/\b(?:sin|no\s+hay)\s+(?:luces?\s+de\s+advertencia|luz\s+(?:del\s+motor|de\s+motor)|fugas?|sobrecalentamiento)\b/gi, "");
  const mechanical = /slip|check.engine|warning.light|overheat|won't start|does not start|leak|jerk|grind|transmission.{0,30}(?:fail|problem)|engine.{0,30}(?:fail|problem)|patina|sobrecalienta|fuga|luz.{0,15}motor/i.test(mechanicalText);
  const title = Boolean(listing?.titleStatus && listing.titleStatus !== "clean");
  return { scam, mechanical, title };
}

export function listingConcerns(listing: ListingEvidence | undefined, language: "en" | "es") {
  if (!listing) return [];
  const es = language === "es";
  const signals = listingSignals(listing);
  const concerns: Array<{ point: string; why: string }> = [];
  if (signals.scam) concerns.push({ point: es ? "Señales de posible estafa en el anuncio" : "Possible scam signs in this listing", why: listing.redFlags.filter(Boolean).join(" ").slice(0, 850) || listing.condition });
  if (signals.mechanical) concerns.push({ point: es ? "El vendedor declara problemas" : "The seller admits problems", why: listing.condition || listing.redFlags.filter(Boolean).join(" ").slice(0, 850) });
  if (signals.title) concerns.push({ point: es ? `Título declarado: ${listing.titleStatus}` : `Title listed as ${listing.titleStatus}`, why: es ? "Revisa el título y que el nombre coincida con la identificación del vendedor antes de pagar." : "Check the title and that its name matches the seller's ID before paying." });
  if (!signals.scam && listing.redFlags.some(Boolean)) concerns.push({ point: es ? "Cosas que verificar del anuncio" : "Things to verify from the listing", why: listing.redFlags.filter(Boolean).join(" ").slice(0, 850) });
  return concerns;
}