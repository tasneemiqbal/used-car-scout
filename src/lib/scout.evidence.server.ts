// Server-only: official-records fetching with an independent cache per source.
// Never reachable from the browser bundle, file name ends in .server.ts.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";
import type { Vehicle } from "./scout.schemas";
import { menuRows, sameModel, fuelMpg, starRating } from "./scout.sources";

type Json = Database["public"]["Tables"]["scout_vehicle_cache"]["Row"]["evidence"];

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_MODEL_TRIES = 4;

// Only these approved government hosts are ever contacted, and only with
// server-built URLs. A listing's own URL is never fetched.
const APPROVED_HOSTS = new Set(["api.nhtsa.gov"]);

export type SourceEvidence = {
  source: "nhtsa" | "fueleconomy";
  url: string;
  fetchedAt: string;
  status: "available" | "unavailable";
  count: number | null;
  checkedAs?: string;
};

export type VehicleEvidence = {
  recalls: SourceEvidence & { items: RecallItem[] };
  complaints: SourceEvidence & { items: ComplaintItem[] };
  fuelEconomy: SourceEvidence & { reason?: string; combinedMpg: number | null; variants: Array<{ label: string; mpg: number }> };
  safetyRatings: SourceEvidence & { reason?: string; variants: Array<{ label: string; overall: number | null }> };
  otherYears: Array<{ year: number; count: number | null; status: "available" | "unavailable"; url: string; fetchedAt: string }>;
};

export type RecallItem = {
  campaign: string;
  component: string;
  received: string;
  summary: string;
  consequence: string;
  remedy: string;
  parkIt: boolean;
};

export type ComplaintItem = {
  odiNumber: string;
  components: string;
  summary: string;
  filed: string;
  crash: boolean;
  fire: boolean;
  injuries: number;
  deaths: number;
};

/**
 * Listings often name the trim ("Altima 2.5 SV") while the records ask for the
 * model ("Altima"). Try the buyer's wording first, then shorten from the right
 * until a source recognises it. Nothing is ever invented: if no shortening is
 * recognised, the section is reported as unavailable.
 */
export function modelCandidates(model: string) {
  const words = model.trim().split(/\s+/).filter(Boolean);
  const candidates: string[] = [];
  for (let keep = words.length; keep >= 1 && candidates.length < MAX_MODEL_TRIES; keep -= 1) {
    candidates.push(words.slice(0, keep).join(" "));
  }
  return candidates;
}

function cacheKey(source: string, vehicle: Vehicle) {
  return `${source}:${vehicle.year}:${vehicle.make}:${vehicle.model}`
    .toLowerCase()
    .replace(/\s+/g, "-");
}

async function readCache<T>(source: string, vehicle: Vehicle): Promise<T | null> {
  const { data } = await supabaseAdmin
    .from("scout_vehicle_cache")
    .select("fetched_at, evidence")
    .eq("cache_key", cacheKey(source, vehicle))
    .maybeSingle();
  if (!data) return null;
  const age = Date.now() - Date.parse(data.fetched_at);
  if (!Number.isFinite(age) || age > CACHE_TTL_MS) return null;
  return data.evidence as unknown as T;
}

async function writeCache(source: string, vehicle: Vehicle, evidence: object) {
  await supabaseAdmin.from("scout_vehicle_cache").upsert({
    cache_key: cacheKey(source, vehicle),
    source,
    fetched_at: new Date().toISOString(),
    evidence: evidence as Json,
  });
}

type Lookup = { payload: Record<string, unknown>; checkedAs: string };

type Attempt = Lookup | "unknown-name" | null;

async function tryModel(endpoint: string, vehicle: Vehicle, model: string): Promise<Attempt> {
  const url = new URL(`https://api.nhtsa.gov/${endpoint}`);
  url.searchParams.set("make", vehicle.make);
  url.searchParams.set("model", model);
  url.searchParams.set("modelYear", String(vehicle.year));
  if (!APPROVED_HOSTS.has(url.hostname)) return null;
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { accept: "application/json" },
    });
    if (response.status === 400) return "unknown-name"; // This wording is not a known model.
    if (!response.ok) return null;
    return { payload: (await response.json()) as Record<string, unknown>, checkedAs: model };
  } catch {
    return null;
  }
}

/**
 * Tries every model-name shortening at the same time, then keeps the longest
 * name that answered. A remembered name for this car is tried alone first.
 */
async function fetchFirstAcceptable(endpoint: string, vehicle: Vehicle): Promise<Lookup | null> {
  const remembered = await readCache<{ checkedAs: string }>("nhtsa-model-name", vehicle).catch(() => null);
  if (remembered?.checkedAs) {
    const hit = await tryModel(endpoint, vehicle, remembered.checkedAs);
    if (hit && hit !== "unknown-name") return hit;
  }
  const attempts = await Promise.all(modelCandidates(vehicle.model).map((m) => tryModel(endpoint, vehicle, m)));
  for (const attempt of attempts) {
    if (attempt === "unknown-name") continue;
    if (attempt === null) return null; // Never guess past a failed request.
    if (attempt.checkedAs !== remembered?.checkedAs) {
      await writeCache("nhtsa-model-name", vehicle, { checkedAs: attempt.checkedAs }).catch(() => undefined);
    }
    return attempt;
  }
  return null;
}

function text(value: unknown, max = 900) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function number(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asRows(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((row) => row && typeof row === "object") : [];
}

async function loadRecalls(vehicle: Vehicle): Promise<VehicleEvidence["recalls"]> {
  const source = "nhtsa-recalls";
  const cached = await readCache<VehicleEvidence["recalls"]>(source, vehicle);
  if (cached) return cached;

  const found = await fetchFirstAcceptable("recalls/recallsByVehicle", vehicle);
  if (!found) {
    // A failed fetch is never reported as "zero recalls".
    return {
      source: "nhtsa",
      url: "https://www.nhtsa.gov/recalls",
      fetchedAt: new Date().toISOString(),
      status: "unavailable",
      count: null,
      items: [],
    };
  }

  const rows = asRows(found.payload["results"]);
  const items: RecallItem[] = rows.slice(0, 12).map((row) => ({
    campaign: text(row["NHTSACampaignNumber"], 32),
    component: text(row["Component"], 160),
    received: text(row["ReportReceivedDate"], 32),
    summary: text(row["Summary"]),
    consequence: text(row["Consequence"]),
    remedy: text(row["Remedy"]),
    parkIt: row["parkIt"] === true,
  }));
  const evidence = {
    source: "nhtsa" as const,
    url: "https://www.nhtsa.gov/recalls",
    fetchedAt: new Date().toISOString(),
    status: "available" as const,
    count: number(found.payload["Count"] ?? rows.length),
    checkedAs: found.checkedAs,
    items,
  };
  await writeCache(source, vehicle, evidence);
  return evidence;
}

async function loadComplaints(vehicle: Vehicle): Promise<VehicleEvidence["complaints"]> {
  const source = "nhtsa-complaints";
  const cached = await readCache<VehicleEvidence["complaints"]>(source, vehicle);
  if (cached) return cached;

  const found = await fetchFirstAcceptable("complaints/complaintsByVehicle", vehicle);
  if (!found) {
    return {
      source: "nhtsa",
      url: "https://www.nhtsa.gov/car-reports-and-complaints",
      fetchedAt: new Date().toISOString(),
      status: "unavailable",
      count: null,
      items: [],
    };
  }

  const rows = asRows(found.payload["results"]);
  const items: ComplaintItem[] = rows.slice(0, 10).map((row) => ({
    odiNumber: String(row["odiNumber"] ?? ""),
    components: text(row["components"], 200),
    summary: text(row["summary"], 700),
    filed: text(row["dateComplaintFiled"], 32),
    crash: row["crash"] === true,
    fire: row["fire"] === true,
    injuries: number(row["numberOfInjuries"]),
    deaths: number(row["numberOfDeaths"]),
  }));
  const evidence = {
    source: "nhtsa" as const,
    url: "https://www.nhtsa.gov/car-reports-and-complaints",
    fetchedAt: new Date().toISOString(),
    status: "available" as const,
    count: number(found.payload["count"] ?? rows.length),
    checkedAs: found.checkedAs,
    items,
  };
  await writeCache(source, vehicle, evidence);
  return evidence;
}

// Failed or unmatched government lookups stay explicitly unavailable.
function unavailableFuelEconomy(): VehicleEvidence["fuelEconomy"] {
  return {
    source: "fueleconomy",
    url: "https://www.fueleconomy.gov/feg/findacar.shtml",
    fetchedAt: new Date().toISOString(),
    status: "unavailable",
    count: null,
    combinedMpg: null,
    variants: [],
    reason: "fueleconomy.gov did not return machine-readable data for this car.",
  };
}

function unavailableSafety(): VehicleEvidence["safetyRatings"] {
  return {
    source: "nhtsa",
    url: "https://www.nhtsa.gov/ratings",
    fetchedAt: new Date().toISOString(),
    status: "unavailable",
    count: null,
    variants: [],
    reason: "The NHTSA crash-test ratings service rejected the request.",
  };
}

async function sourceJson(url: URL) {
  if (!["api.nhtsa.gov", "www.fueleconomy.gov"].includes(url.hostname)) return null;
  try {
    const response = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8_000) });
    return response.ok ? await response.json() as Record<string, unknown> | null : null;
  } catch { return null; }
}

async function loadFuel(vehicle: Vehicle): Promise<VehicleEvidence["fuelEconomy"]> {
  const cached = await readCache<VehicleEvidence["fuelEconomy"]>("fuel-v2", vehicle);
  if (cached) return cached;
  const modelsUrl = new URL("https://www.fueleconomy.gov/ws/rest/vehicle/menu/model");
  modelsUrl.searchParams.set("year", String(vehicle.year));
  modelsUrl.searchParams.set("make", vehicle.make);
  const models = menuRows(await sourceJson(modelsUrl));
  const model = models.find((row) => sameModel(row.text, vehicle.model));
  if (!model) return unavailableFuelEconomy();
  const optionsUrl = new URL("https://www.fueleconomy.gov/ws/rest/vehicle/menu/options");
  optionsUrl.searchParams.set("year", String(vehicle.year));
  optionsUrl.searchParams.set("make", vehicle.make);
  optionsUrl.searchParams.set("model", model.text);
  const options = menuRows(await sourceJson(optionsUrl)).filter((row) => /^\d+$/.test(row.value));
  if (!options.length || options.length > 30) return unavailableFuelEconomy();
  const variants = await Promise.all(options.map(async (option) => {
    const details = await sourceJson(new URL(`https://www.fueleconomy.gov/ws/rest/vehicle/${option.value}`));
    const mpg = details ? fuelMpg(details, { ...vehicle, model: model.text }) : null;
    return mpg ? { label: option.text, mpg } : null;
  }));
  const valid = variants.filter((item): item is { label: string; mpg: number } => item !== null);
  if (!valid.length || valid.length !== options.length) return unavailableFuelEconomy();
  const result: VehicleEvidence["fuelEconomy"] = { source: "fueleconomy", url: `https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=${options.map((o) => o.value).join(",")}`, fetchedAt: new Date().toISOString(), status: "available", count: valid.length, checkedAs: model.text, combinedMpg: Math.min(...valid.map((v) => v.mpg)), variants: valid, reason: "Uses the lowest gasoline MPG among matching configurations for a conservative budget. Confirm the engine before relying on it." };
  await writeCache("fuel-v2", vehicle, result);
  return result;
}

async function loadSafety(vehicle: Vehicle): Promise<VehicleEvidence["safetyRatings"]> {
  const cached = await readCache<VehicleEvidence["safetyRatings"]>("safety-v2", vehicle);
  if (cached) return cached;
  const base = `https://api.nhtsa.gov/SafetyRatings/modelyear/${vehicle.year}/make/${encodeURIComponent(vehicle.make)}`;
  const models = await sourceJson(new URL(`${base}?format=json`));
  const model = asRows(models?.["Results"]).find((row) => sameModel(String(row["Model"]), vehicle.model));
  const name = model ? String(model["Model"]) : vehicle.model;
  const matches = await sourceJson(new URL(`${base}/model/${encodeURIComponent(name)}?format=json`));
  const candidates = asRows(matches?.["Results"]).filter((row) => /^\d+$/.test(String(row["VehicleId"]))).slice(0, 12);
  if (!candidates.length) return unavailableSafety();
  const variants = await Promise.all(candidates.map(async (row) => {
    const detail = await sourceJson(new URL(`https://api.nhtsa.gov/SafetyRatings/VehicleId/${row["VehicleId"]}?format=json`));
    const rating = asRows(detail?.["Results"])[0];
    if (!rating || !("OverallRating" in rating)) return null;
    return { label: text(row["VehicleDescription"], 200), overall: starRating(rating["OverallRating"]) };
  }));
  const valid = variants.filter((v): v is { label: string; overall: number | null } => v !== null);
  if (valid.length !== candidates.length) return unavailableSafety();
  const result: VehicleEvidence["safetyRatings"] = { source: "nhtsa", url: "https://www.nhtsa.gov/ratings", fetchedAt: new Date().toISOString(), status: "available", count: valid.length, checkedAs: name, variants: valid };
  await writeCache("safety-v2", vehicle, result);
  return result;
}

async function loadOtherYears(vehicle: Vehicle): Promise<VehicleEvidence["otherYears"]> {
  const cached = await readCache<VehicleEvidence["otherYears"]>("other-years-v2", vehicle);
  if (cached) return cached;
  const matched = await readCache<{ checkedAs: string }>("nhtsa-model-name", vehicle).catch(() => null);
  const modelName = matched?.checkedAs ?? vehicle.model;
  const years = Array.from({ length: 11 }, (_, i) => vehicle.year - 5 + i).filter((year) => year >= 1980 && year <= new Date().getUTCFullYear() + 1);
  const result = await Promise.all(years.map(async (year) => {
    const url = new URL("https://api.nhtsa.gov/complaints/complaintsByVehicle");
    url.searchParams.set("make", vehicle.make); url.searchParams.set("model", modelName); url.searchParams.set("modelYear", String(year));
    const response = await sourceJson(url);
    const count = response ? number(response["count"] ?? response["Count"] ?? asRows(response["results"]).length) : null;
    return { year, count, status: response ? "available" as const : "unavailable" as const, url: url.href, fetchedAt: new Date().toISOString() };
  }));
  await writeCache("other-years-v2", vehicle, result);
  return result;
}

export async function gatherEvidence(vehicle: Vehicle): Promise<VehicleEvidence> {
  const [recalls, complaints, fuelEconomy, safetyRatings, otherYears] = await Promise.all([
    loadRecalls(vehicle),
    loadComplaints(vehicle),
    loadFuel(vehicle), loadSafety(vehicle), loadOtherYears(vehicle),
  ]);
  return {
    recalls,
    complaints,
    fuelEconomy, safetyRatings, otherYears,
  };
}
