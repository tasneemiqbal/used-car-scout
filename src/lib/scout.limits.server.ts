import { getCookie, getRequest, setCookie, setResponseHeader, setResponseStatus } from "@tanstack/react-start/server";
import { SCOUT_USAGE_LIMITS, scoutOperationSchema, signVisitor, verifyVisitor, type ScoutOperation } from "./scout.visitor";

const COOKIE_NAME = "scout_visitor";
const VISITOR_LIFETIME_SECONDS = 60 * 60 * 24 * 30;

export async function enforceScoutLimit(operation: ScoutOperation) {
  const checkedOperation = scoutOperationSchema.parse(operation);
  const secret = process.env['SCOUT_VISITOR_SECRET'];
  setResponseHeader("Cache-Control", "no-store");
  if (!secret) throw new Error("Usage protection is unavailable. Please try again later.");
  const now = Math.floor(Date.now() / 1000);
  let visitorId = await verifyVisitor(getCookie(COOKIE_NAME), secret, now);
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    setCookie(COOKIE_NAME, await signVisitor(visitorId, now + VISITOR_LIFETIME_SECONDS, secret), {
      httpOnly: true,
      secure: new URL(getRequest().url).protocol === "https:",
      sameSite: "lax",
      maxAge: VISITOR_LIFETIME_SECONDS,
      path: "/",
    });
  }
  // No unverified forwarded/IP headers and no browser-supplied limit values.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("scout_consume_usage", { p_visitor_id: visitorId, p_operation: checkedOperation });
  const usage = data?.[0];
  if (error || !usage) throw new Error("Usage protection is unavailable. Please try again later.");
  if (!usage.allowed) {
    const seconds = Math.max(1, Math.ceil((Date.parse(usage.resets_at) - Date.now()) / 1000));
    setResponseStatus(429);
    setResponseHeader("Retry-After", String(seconds));
    const label = checkedOperation === "check" ? "car checks" : "Scout messages";
    throw new Error(`You've used your ${SCOUT_USAGE_LIMITS[checkedOperation]} ${label} for this hour. Try again in ${Math.ceil(seconds / 60)} minutes.`);
  }
  return { remaining: usage.remaining, resetsAt: usage.resets_at };
}