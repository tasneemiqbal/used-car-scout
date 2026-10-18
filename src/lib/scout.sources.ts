export const sameModel = (a: string, b: string) => a.toLowerCase().replace(/[^a-z0-9]/g, "") === b.toLowerCase().replace(/[^a-z0-9]/g, "");
export function menuRows(payload: unknown): Array<{ text: string; value: string }> {
  if (!payload || typeof payload !== "object") return [];
  const menu = (payload as Record<string, unknown>)["menuItem"];
  return (Array.isArray(menu) ? menu : menu ? [menu] : []).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    return typeof row["text"] === "string" && typeof row["value"] === "string" ? [{ text: row["text"].slice(0, 200), value: row["value"] }] : [];
  });
}
export function positiveNumber(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}
export function fuelMpg(payload: Record<string, unknown>, expected: { year: number; make: string; model: string }) {
  if (Number(payload["year"]) !== expected.year || !sameModel(String(payload["make"]), expected.make) || !sameModel(String(payload["model"]), expected.model)) return null;
  // Electric energy consumption is not gasoline MPG.
  if (/electricity/i.test(String(payload["fuelType"])) && !/gasoline/i.test(String(payload["fuelType"]))) return null;
  const mpg = positiveNumber(payload["comb08"]);
  return mpg && mpg <= 150 ? mpg : null;
}
export function starRating(value: unknown) {
  const n = positiveNumber(value);
  return n && Number.isInteger(n) && n <= 5 ? n : null;
}