// Deterministic ownership cost. Totals are arithmetic in code, never model
// output, and every assumption is returned so the screen can print it.
import { z } from "zod";
import { vehicleSchema } from "./scout.schemas";

export const ownershipAssumptionsSchema = z
  .object({
    annualMiles: z.number().finite().nonnegative(),
    combinedMpg: z.number().finite().positive().nullable(),
    dollarsPerGallon: z.number().finite().nonnegative().nullable(),
    annualMaintenance: z.number().finite().nonnegative(),
    repairAllowance: z.number().finite().nonnegative(),
  })
  .strict();

export type OwnershipAssumptions = z.infer<typeof ownershipAssumptionsSchema>;

export function estimateOwnershipCost(price: number, input: OwnershipAssumptions) {
  const askingPrice = vehicleSchema.shape.askingPrice.parse(price);
  const assumptions = ownershipAssumptionsSchema.parse(input);

  const canPriceFuel = assumptions.combinedMpg !== null && assumptions.dollarsPerGallon !== null;
  const fuel = canPriceFuel
    ? Math.round(
        ((3 * assumptions.annualMiles) / (assumptions.combinedMpg as number)) *
          (assumptions.dollarsPerGallon as number),
      )
    : null;
  const maintenance = Math.round(3 * assumptions.annualMaintenance);
  const repairs = Math.round(assumptions.repairAllowance);

  const excluded = ["taxes", "insurance", "registration and fees", "financing", "resale value"];
  if (fuel === null) excluded.unshift("fuel");

  return {
    purchase: askingPrice,
    fuel,
    maintenance,
    repairs,
    total: askingPrice + maintenance + repairs + (fuel ?? 0),
    estimate: true as const,
    fuelIncluded: canPriceFuel,
    excluded,
    assumptions,
  };
}

export type OwnershipCost = ReturnType<typeof estimateOwnershipCost>;
