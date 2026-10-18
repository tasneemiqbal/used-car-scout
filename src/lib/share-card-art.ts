import { money } from "@/lib/report-query";

export type ShareImageData = {
  language?: "en" | "es";
  make: string;
  model: string;
  askingPrice: number;
  total: number;
  fairOffer: number;
  risk: "low" | "medium" | "high" | "unknown";
  fuelIncluded?: boolean;
  excluded?: string[];
};

export type SharePalette = Record<"paper" | "ink" | "total" | "coral" | "muted" | "risk" | "divider" | "logo", string>;

const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char] ?? char);

function fit(text: string, size: number, width: number) {
  // Measure with the same loaded font used by the preview and exported image.
  const context = document.createElement("canvas").getContext("2d");
  if (!context) return size;
  context.font = `700 ${size}px Inter`;
  return Math.min(size, size * width / Math.max(width, context.measureText(text).width));
}

export function shareImageSvg(data: ShareImageData, siteUrl: string, c: SharePalette, logoHref?: string) {
  const es = data.language === "es";
  const first = `${es ? "Este" : "This"} ${money(data.askingPrice)} ${data.model}`;
  const total = money(data.total);
  const risk = es ? ({ low: "Bajo", medium: "Medio", high: "Alto", unknown: "Sin datos" }[data.risk]) : data.risk === "unknown" ? "Not enough info" : data.risk[0]?.toUpperCase() + data.risk.slice(1);
  const footer = `${es ? "Revisa tu auto gratis en" : "Check your own car free at"} ${siteUrl}`;
  const exclusions = (data.excluded ?? ["fuel", "insurance", "taxes", "registration", "fees", "financing"])
    .filter((item) => item !== "resale value").map((item) => es ? ({ fuel: "combustible", insurance: "seguro", taxes: "impuestos", registration: "registro", "registration and fees": "registro y comisiones", fees: "comisiones", financing: "financiación" } as Record<string, string>)[item] ?? item : item).join(", ");
  const scope = es ? `Estimación a 3 años: precio + mantenimiento + reparaciones${data.fuelIncluded ? " + combustible" : ""}.` : `3-year estimate: price + upkeep + repair budget${data.fuelIncluded ? " + fuel" : ""}.`;
  const text = (x: number, y: number, value: string, size: number, color: string, weight = 400) =>
    `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${color}">${escape(value)}</text>`;
  // The real Used Car Scout logo, embedded so it survives canvas export.
  // Falls back to the drawn mark only if the logo has not loaded yet.
  const logo = logoHref
    ? `<image x="41" y="42" width="40" height="40" href="${logoHref}"/>`
    : `<g transform="translate(41 48)">
        <path d="M1 17L5 9H24L31 17V25H1Z M8 9L11 3H21L25 9Z" fill="${c.logo}"/>
        <circle cx="7" cy="25" r="3" fill="${c.logo}"/><circle cx="25" cy="25" r="3" fill="${c.logo}"/>
        <circle cx="30" cy="10" r="8" fill="${c.paper}" stroke="${c.coral}" stroke-width="3"/>
        <path d="M36 16L42 23" stroke="${c.coral}" stroke-width="3" stroke-linecap="round"/>
      </g>`;
  const wordmarkX = logoHref ? 92 : 95;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500" role="img" aria-label="Used Car Scout report summary">
    <rect width="500" height="500" fill="${c.paper}"/>
    <g font-family="Inter, Arial, sans-serif" letter-spacing="0">
      ${logo}
      ${text(wordmarkX, 69, "Used Car Scout", 18, c.ink)}
      ${text(41, 142, first, fit(first, 36, 418), c.ink, 700)}
      ${text(41, 185, es ? "podría costar" : "could really cost", 36, c.ink, 700)}
      <text x="41" y="228" font-size="${fit(total + ".", 36, 418)}" font-weight="700"><tspan fill="${c.total}">${escape(total)}</tspan><tspan fill="${c.ink}">.</tspan></text>
      ${text(41, 281, es ? "Oferta inicial" : "Fair offer", 14, c.muted)}
      ${text(245, 281, es ? "Riesgo" : "Risk", 14, c.muted)}
      ${text(41, 314, money(data.fairOffer), fit(money(data.fairOffer), 26, 180), c.ink, 700)}
      ${text(245, 314, risk, fit(risk, 26, 214), c.risk, 700)}
      ${text(41, 347, scope, fit(scope, 10, 418), c.muted)}
      ${text(41, 364, es ? `Excluye ${exclusions}. No descuenta reventa.` : `Excludes ${exclusions}. Resale not deducted.`, fit(es ? `Excluye ${exclusions}. No descuenta reventa.` : `Excludes ${exclusions}. Resale not deducted.`, 10, 418), c.muted)}
      <path d="M41 400H459" stroke="${c.divider}" stroke-width="1"/>
      <g transform="translate(41 422)">
        <circle cx="15" cy="15" r="14" fill="none" stroke="${c.coral}" stroke-width="2"/>
        <circle cx="10" cy="12" r="1.5" fill="${c.total}"/><circle cx="20" cy="12" r="1.5" fill="${c.total}"/>
        <path d="M9 19Q15 25 21 19" fill="none" stroke="${c.total}" stroke-width="2" stroke-linecap="round"/>
      </g>
      ${text(84, 432, es ? "Revisado con Used Car Scout" : "Checked with Used Car Scout", 16, c.ink)}
      ${text(84, 453, footer, fit(footer, 13, 375), c.muted)}
    </g>
  </svg>`;
}