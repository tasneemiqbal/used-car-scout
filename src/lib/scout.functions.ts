// Callable server operations. Screens import this file only; the server-only
// helpers stay out of the browser bundle.
import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";

import { scoutCheckLimit, scoutMessageLimit } from "./scout.middleware";
import { reportLookupSchema, validateImage, vehicleSchema, type Vehicle } from "./scout.schemas";
import { listingInputSchema, parseExtractedListing } from "./scout.extract";
import { parseVpic, vinLookupSchema, vpicUrl, type VinSpecs } from "./scout.vin";
import { checkRequestSchema } from "./scout.listing-evidence";
import { z } from "zod";

export const runVehicleCheck = createServerFn({ method: "POST" })
  // Limit is spent before any government or AI work happens.
  .middleware([scoutCheckLimit])
  .inputValidator((input: unknown) => checkRequestSchema.parse(input))
  .handler(async ({ data }) => {
    const { buildAndStoreReport } = await import("./scout.build.server");
    const { language, listing, ...vehicle } = data;
    const id = await buildAndStoreReport(vehicle, listing, language);
    return { id };
  });

export const getScoutReport = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => reportLookupSchema.parse(input))
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");
    const { loadStoredReport } = await import("./scout.build.server");
    const report = await loadStoredReport(data.id);
    return report ? { report } : null;
  });


/**
 * Reads pasted listing words and up to four screenshots into editable fields.
 * No links are fetched. This is the buyer's own information being transcribed,
 * not evidence, so every field stays editable. A VIN, if present, is decoded by
 * NHTSA vPIC for factory specs only.
 */
export const readListingDetails = createServerFn({ method: "POST" })
  .middleware([scoutMessageLimit])
  .inputValidator((input: unknown) => listingInputSchema.parse(input))
  .handler(async ({ data }) => {
    for (const dataUrl of data.images) {
      const [header, base64 = ""] = dataUrl.split(",");
      const mime = header?.slice(5, header.indexOf(";")) ?? "";
      validateImage(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)), mime);
    }
    const { requestListingRead } = await import("./scout.ai.server");
    const listing = parseExtractedListing(await requestListingRead(data));
    const vinSpecs = listing.vin ? await lookupVin(listing.vin) : null;
    return { listing, vinSpecs };
  });

/** Decodes a VIN the buyer typed or corrected. */
export const decodeVin = createServerFn({ method: "POST" })
  .middleware([scoutMessageLimit])
  .inputValidator((input: unknown) => vinLookupSchema.parse(input))
  .handler(async ({ data }) => ({ vinSpecs: await lookupVin(data.vin) }));

async function lookupVin(vin: string): Promise<VinSpecs | null> {
  try {
    const response = await fetch(vpicUrl(vin), { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) return null;
    return parseVpic(vin, await response.json(), new Date().toISOString());
  } catch {
    return null;
  }
}
