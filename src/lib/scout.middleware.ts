import { createMiddleware } from "@tanstack/react-start";
import { enforceScoutLimit } from "./scout.limits.server";

// Attach at each paid-operation boundary, before any government or AI work.
export const scoutCheckLimit = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const usage = await enforceScoutLimit("check");
  return next({ context: { scoutUsage: usage } });
});

export const scoutMessageLimit = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const usage = await enforceScoutLimit("message");
  return next({ context: { scoutUsage: usage } });
});