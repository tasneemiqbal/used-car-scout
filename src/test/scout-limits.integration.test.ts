// @vitest-environment node
import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import type { Database } from "@/integrations/supabase/types";

const url = process.env['SUPABASE_URL'];
const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];

describe.skipIf(!url || !key)("Cloud atomic usage limits", () => {
  it("admits exactly 10 concurrent checks and rejects the eleventh", async () => {
    if (!url || !key) throw new Error("Cloud test credentials unavailable");
    const client = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      } },
    });
    const id = crypto.randomUUID();
    try {
      const results = await Promise.all(Array.from({ length: 11 }, () => client.rpc("scout_consume_usage", { p_visitor_id: id, p_operation: "check" })));
      expect(results.every((result) => result.error === null)).toBe(true);
      expect(results.filter((result) => result.data?.[0]?.allowed).length).toBe(10);
      expect(results.filter((result) => result.data?.[0]?.allowed === false).length).toBe(1);
      const unknown = await client.rpc("scout_consume_usage", { p_visitor_id: id, p_operation: "unlimited" });
      expect(unknown.error).not.toBeNull();
    } finally {
      const { error } = await client.from("scout_usage_windows").delete().eq("visitor_id", id);
      if (error) throw new Error("Test usage cleanup failed");
    }
  }, 30_000);
  it("admits exactly 40 concurrent messages and rejects the forty-first", async () => {
    if (!url || !key) throw new Error("Cloud test credentials unavailable");
    const id = crypto.randomUUID();
    const call = async () => {
      const response = await fetch(`${url}/rest/v1/rpc/scout_consume_usage`, {
        method: "POST", headers: { apikey: key, ...(key.startsWith("sb_") ? {} : { Authorization: `Bearer ${key}` }), "Content-Type": "application/json" },
        body: JSON.stringify({ p_visitor_id: id, p_operation: "message" }),
      });
      expect(response.ok).toBe(true);
      return await response.json() as { allowed: boolean; remaining: number }[];
    };
    try {
      const results = await Promise.all(Array.from({ length: 41 }, call));
      expect(results.filter((result) => result[0]?.allowed).length).toBe(40);
      expect(results.filter((result) => result[0]?.allowed === false).length).toBe(1);
    } finally {
      const response = await fetch(`${url}/rest/v1/scout_usage_windows?visitor_id=eq.${id}`, {
        method: "DELETE", headers: { apikey: key, ...(key.startsWith("sb_") ? {} : { Authorization: `Bearer ${key}` }) },
      });
      expect(response.ok).toBe(true);
    }
  }, 30_000);
});