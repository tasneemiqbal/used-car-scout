import { describe, expect, it } from "vitest";
import { buildViewingSteps, summarizeViewing } from "@/lib/scout.viewing";

const steps = buildViewingSteps({ concerns: [{ point: "CVT slipping", why: "Costly repair" }], recallCount: 2 });

describe("viewing mode", () => {
  it("adds report concerns and a recall step", () => {
    expect(steps.map((s) => s.id)).toEqual(["papers", "outside", "cold-start", "under-hood", "drive", "inside", "concern-0", "recalls"]);
  });

  it("skips the recall step when there are no recalls", () => {
    expect(buildViewingSteps({ concerns: [], recallCount: 0 }).some((s) => s.id === "recalls")).toBe(false);
  });

  it("all fine means keep going with no questions", () => {
    const all = Object.fromEntries(steps.map((s) => [s.id, "fine" as const]));
    const r = summarizeViewing(steps, all);
    expect(r.verdict).toBe("keep-going");
    expect(r.questions).toEqual([]);
    expect(r.answered).toBe(8);
  });

  it("a title problem means walk away", () => {
    expect(summarizeViewing(steps, { papers: "problem" }).verdict).toBe("walk-away");
  });

  it("problems come before unsure in copied questions", () => {
    const r = summarizeViewing(steps, { inside: "unsure", drive: "problem" });
    expect(r.verdict).toBe("slow-down");
    expect(r.questions).toEqual([steps[4]!.ask, steps[5]!.ask]);
  });
});
