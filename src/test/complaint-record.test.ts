import { describe, expect, it } from "vitest";
import { biggestGroup, groupComplaints } from "@/components/complaint-record";

const complaint = (odiNumber: string, components: string) => ({
  odiNumber,
  components,
  summary: "Owner description.",
  filed: "2024-01-01",
  crash: false,
  fire: false,
  injuries: 0,
  deaths: 0,
});

describe("groupComplaints", () => {
  it("groups by part and sorts groups alphabetically", () => {
    const groups = groupComplaints([
      complaint("1", "ENGINE"),
      complaint("2", "AIR BAGS"),
      complaint("3", "ENGINE AND ENGINE COOLING"),
      complaint("4", "SERVICE BRAKES"),
    ]);
    expect(groups.map((g) => g.part)).toEqual(["Airbags", "Brakes", "Engine"]);
    expect(groups.find((g) => g.part === "Engine")?.complaints).toHaveLength(2);
  });

  it("uses the first component when several are listed", () => {
    const groups = groupComplaints([complaint("1", "STEERING, SUSPENSION")]);
    expect(groups[0]?.part).toBe("Steering");
  });

  it("picks the biggest group for the pattern line", () => {
    const groups = groupComplaints([
      complaint("1", "ENGINE"),
      complaint("2", "ENGINE"),
      complaint("3", "BRAKES"),
    ]);
    expect(biggestGroup(groups)?.part).toBe("Engine");
  });
});

describe("groupComplaints fallback", () => {
  it("capitalizes parts without a plain-English name and merges their variants", () => {
    const groups = groupComplaints([
      complaint("1", "SUSPENSION"),
      complaint("2", "suspension"),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.part).toBe("Suspension");
    expect(groups[0]?.complaints).toHaveLength(2);
  });
});
