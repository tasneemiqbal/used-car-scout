// @vitest-environment node
import { describe, expect, it } from "vitest";
import { SCOUT_USAGE_LIMITS, signVisitor, verifyVisitor } from "@/lib/scout.visitor";

const testSecret = "test-only-signing-key-never-used-by-the-application";
const visitorId = "33b94d88-f716-4c2c-a686-85287436e759";

describe("approved anonymous allowances", () => {
  it("allows 10 checks per hour", () => expect(SCOUT_USAGE_LIMITS.check).toBe(10));
  it("allows 40 Scout messages per hour", () => expect(SCOUT_USAGE_LIMITS.message).toBe(40));
  it("verifies a server-signed visitor and rejects a changed identity", async () => {
    const token = await signVisitor(visitorId, 2000, testSecret);
    expect(await verifyVisitor(token, testSecret, 1000)).toBe(visitorId);
    expect(await verifyVisitor(token.replace(visitorId, "33b94d88-f716-4c2c-a686-85287436e758"), testSecret, 1000)).toBeNull();
  });
  it("rejects expired cookies at their exact expiry", async () => {
    const token = await signVisitor(visitorId, 2000, testSecret);
    expect(await verifyVisitor(token, testSecret, 2000)).toBeNull();
  });
  it("rejects forged or oversized cookies", async () => {
    expect(await verifyVisitor(`${visitorId}.2000.forged`, testSecret, 1000)).toBeNull();
    expect(await verifyVisitor("a".repeat(257), testSecret, 1000)).toBeNull();
  });
});