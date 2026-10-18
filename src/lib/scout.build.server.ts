// Server-only: assemble, validate and store one report. Nothing here is
// reachable from the browser bundle.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { gatherEvidence } from "./scout.evidence.server";
import { estimateOwnershipCost } from "./scout.cost";
import { judgeDeal } from "./scout.verdict";
import { requestExplanation } from "./scout.ai.server";
import { parseReportWording, storedReportSchema, type StoredReport } from "./scout.report";
import type { Vehicle } from "./scout.schemas";
import { listingConcerns, listingSignals, type ListingEvidence } from "./scout.listing-evidence";

// Printed next to every figure so an estimate is never mistaken for a source.
const ASSUMPTIONS = {
  annualMiles: 12_000,
  combinedMpg: null,
  dollarsPerGallon: null,
  annualMaintenance: 1_000,
  repairAllowance: 1_500,
};

export async function buildAndStoreReport(vehicle: Vehicle, listing?: ListingEvidence, language: "en" | "es" = "en"): Promise<string> {
  const evidence = await gatherEvidence(vehicle);
  const cost = estimateOwnershipCost(vehicle.askingPrice, { ...ASSUMPTIONS, combinedMpg: evidence.fuelEconomy.combinedMpg ?? null, dollarsPerGallon: evidence.fuelEconomy.combinedMpg ? 3.50 : null });
  const signals = listingSignals(listing);

  // Both numbers the buyer acts on are computed here from figures we hold,
  // before the model is asked for any wording.
  const verdict = judgeDeal({
    askingPrice: vehicle.askingPrice,
    repairs: cost.repairs,
    annualMaintenance: cost.assumptions.annualMaintenance,
    recallsAvailable: evidence.recalls.status === "available",
    complaintsAvailable: evidence.complaints.status === "available",
    // The rating is drawn from a sample, so it says how many it looked at.
    complaintsSampled: evidence.complaints.items.length,
    complaintsTotal: evidence.complaints.count,
    parkIt: evidence.recalls.items.some((recall) => recall.parkIt),
    deaths: evidence.complaints.items.reduce((total, item) => total + item.deaths, 0),
    injuries: evidence.complaints.items.reduce((total, item) => total + item.injuries, 0),
    crashOrFire: evidence.complaints.items.some((item) => item.crash || item.fire),
    scam: signals.scam,
    sellerProblem: signals.mechanical,
    titleConcern: signals.title,
    language,
  });

  const raw = await requestExplanation({ vehicle, evidence, cost, listing, language });
  const wording = parseReportWording(raw);
  const listingRows = listingConcerns(listing, language);
  const otherRows = wording.concerns.filter((row) => !(/(?:no|not|could not).{0,25}scam|scam.{0,30}(?:not|could not)|no.{0,30}estafa/i.test(row.point)) && !(signals.scam && /scam|gift.card|estafa|tarjeta.de.regalo/i.test(row.point + row.why)) && !(signals.mechanical && /seller.{0,20}(?:report|admit)|vendedor.{0,20}(?:declara|informa)/i.test(row.point)));
  wording.concerns = [...listingRows, ...otherRows].filter((item, index, all) => all.findIndex((other) => other.point === item.point) === index).slice(0, 4);
  wording.questions = [...(listing?.questions.filter(Boolean) ?? []), ...wording.questions].filter((q, i, all) => all.indexOf(q) === i).slice(0, 5);

  const draft = {
    car: vehicle,
    wording,
    evidence,
    cost,
    verdict,
    generatedAt: new Date().toISOString(),
    language,
    listing,
  };

  const report = storedReportSchema.parse(draft);
  const { data, error } = await supabaseAdmin
    .from("scout_reports")
    .insert({ car: vehicle, report, schema_version: 1 })
    .select("id")
    .single();
  if (error || !data) throw new Error("The report could not be saved. Please try again.");

  return String(data.id);
}

/** Exact capability lookup: one id in, that one sanitized report out, or null. */
export async function loadStoredReport(id: string): Promise<StoredReport | null> {
  const { data, error } = await supabaseAdmin
    .from("scout_reports")
    .select("report")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("The report could not be read. Please try again.");
  if (!data) return null;
  return storedReportSchema.parse(data.report);
}
