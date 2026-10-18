// Server-only: official NHTSA lookups for a VIN the buyer pastes into Scout
// chat. Factory specs come from the VIN decode; recalls come back for the
// model year the VIN decodes to, because the public API has no per-VIN recall
// list. A VIN never carries history, accidents, owners, title or condition.
import { parseVpic, vpicUrl, type VinSpecs } from "./scout.vin";

const REQUEST_TIMEOUT_MS = 15_000;
const RECALLS_URL = "https://api.nhtsa.gov/recalls/recallsByVehicle";

export type VinRecallItem = {
  campaign: string;
  component: string;
  summary: string;
  remedy: string;
  parkIt: boolean;
};

export type VinFacts = {
  vin: string;
  checkDigitOk: boolean;
  specs: VinSpecs | null;
  recalls: { status: "available" | "unavailable"; count: number | null; items: VinRecallItem[] };
  fetchedAt: string;
};

const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

async function decodeVin(vin: string, fetchedAt: string): Promise<VinSpecs | null> {
  try {
    const response = await fetch(vpicUrl(vin), {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;
    return parseVpic(vin, await response.json(), fetchedAt);
  } catch {
    return null;
  }
}

async function recallsForSpecs(specs: VinSpecs | null): Promise<VinFacts["recalls"]> {
  if (!specs?.year || !specs.make || !specs.model) {
    return { status: "unavailable", count: null, items: [] };
  }
  try {
    const url = new URL(RECALLS_URL);
    url.searchParams.set("make", specs.make);
    url.searchParams.set("model", specs.model);
    url.searchParams.set("modelYear", String(specs.year));
    if (url.hostname !== "api.nhtsa.gov") throw new Error("unexpected host");
    const response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { accept: "application/json" },
    });
    if (!response.ok) throw new Error(String(response.status));
    const payload = (await response.json()) as { results?: unknown; Count?: unknown };
    const rows = Array.isArray(payload.results)
      ? payload.results.filter((row) => row && typeof row === "object")
      : [];
    const items: VinRecallItem[] = rows.slice(0, 6).map((row) => {
      const record = row as Record<string, unknown>;
      return {
        campaign: text(record["NHTSACampaignNumber"], 32),
        component: text(record["Component"], 160),
        summary: text(record["Summary"], 400),
        remedy: text(record["Remedy"], 400),
        parkIt: record["parkIt"] === true,
      };
    });
    const count = Number(payload.Count);
    return {
      status: "available",
      count: Number.isFinite(count) ? count : items.length,
      items,
    };
  } catch {
    // A failed fetch is never reported as "zero recalls".
    return { status: "unavailable", count: null, items: [] };
  }
}

/** Decodes the VIN, then pulls recalls for the model year it decodes to. */
export async function fetchVinFacts(vin: string, checkDigitOk: boolean): Promise<VinFacts> {
  const fetchedAt = new Date().toISOString();
  const specs = await decodeVin(vin, fetchedAt);
  const recalls = await recallsForSpecs(specs);
  return { vin, checkDigitOk, specs, recalls, fetchedAt };
}
