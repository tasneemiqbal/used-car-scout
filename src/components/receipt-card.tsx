import { useLanguage } from "./site";
// The receipt is the product's one honest artefact: a paper-style card whose
// numbers are all computed on the server. It is shown on the report page and,
// with sample figures, on the homepage, never with invented data.
import { useState } from "react";

export type ReceiptLine = { label: string; value: string; muted?: boolean };

export type ReceiptData = {
  language?: "en" | "es";
  title: string;
  meta: string;
  lines: ReceiptLine[];
  total: string;
  totalNote: string;
  costIncludes?: string;
  costExcludes?: string;
  verdictLines: ReceiptLine[];
  riskReason: string;
  offerBasis?: string;
  headingLevel?: "h1" | "h2";
  /** Plays a short "printing" reveal. Homepage only. */
  animate?: boolean;
  /** One bold line under the total, e.g. "+$4,500 more than the asking price". */
  gapNote?: string;
  /** Replaces the plain risk reason with a coloured tag plus reason. */
  riskTag?: string;
};

export function ReceiptCard({
  language: selectedLanguage,
  title,
  meta,
  lines,
  total,
  totalNote,
  costIncludes = "Asking price + 3 years of upkeep + money set aside for repairs.",
  costExcludes = "Fuel, insurance, taxes, registration, fees and financing. Resale value is not deducted.",
  verdictLines,
  riskReason,
  offerBasis,
  headingLevel = "h2",
  animate = false,
  gapNote,
  riskTag,
}: ReceiptData) {
  const { language: currentLanguage } = useLanguage();
  const es = (selectedLanguage ?? currentLanguage) === "es";
  const label = (value: string) => es ? ({ASKING: "PRECIO", FUEL: "COMBUSTIBLE", UPKEEP: "MANTENIMIENTO", REPAIRS: "REPARACIONES", "FAIR OFFER": "OFERTA INICIAL", "Asking price": "Precio anunciado", "Fuel, 3 years": "Combustible, 3 años", "Upkeep, 3 years": "Mantenimiento, 3 años", "Repair allowance": "Reserva para reparaciones", "Fair offer": "Oferta inicial", Risk: "Riesgo"} as Record<string, string>)[value] ?? value : value;
  const translatedValue = (value: string) => es ? ({UNAVAILABLE: "NO DISPONIBLE", "not priced": "sin calcular", LOW: "BAJO", MEDIUM: "MEDIO", HIGH: "ALTO"} as Record<string, string>)[value] ?? value : value;
  const Heading = headingLevel;
  const step = (i: number) =>
    animate ? { className: "receipt-row-in", style: { animationDelay: `${0.25 + i * 0.22}s` } } : {};
  const circleDelay = 0.25 + (lines.length + 0.5) * 0.22;
  return (
    <>
      <article className="receipt-shadow bg-card px-6 pt-7 pb-6 sm:px-8">
        <p className="text-center font-mono text-xs tracking-[0.3em] text-foreground">
          USED CAR SCOUT
        </p>
        <p className="mt-1 text-center font-mono text-xs tracking-[0.22em] text-muted-foreground">
          {es ? 'REVISIÓN DEL COSTO REAL' : 'REAL COST CHECK'}
        </p>

        <hr className="my-5 border-dashed border-border" />

        <Heading className="font-mono text-sm font-medium tracking-tight uppercase">{title}</Heading>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{meta}</p>

        <hr className="my-5 border-dashed border-border" />

        <div className="space-y-2.5">
          {lines.map((line, i) => (
            <div key={line.label} {...step(i)}>
              <Line {...line} label={label(line.label)} value={translatedValue(line.value)} />
            </div>
          ))}
        </div>

        <hr className="my-5 border-dashed border-border" />

        <div {...step(lines.length)}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-xs">{es ? 'COSTO EST. A 3 AÑOS' : 'EST. 3-YEAR COST'}</span>
            <Circled value={total} drawDelay={animate ? circleDelay : undefined} />
          </div>
          {gapNote ? (
            <p className="mt-3 text-right font-mono text-sm font-semibold text-accent-warm">{gapNote}</p>
          ) : null}
          <p className="mt-1 text-right font-mono text-xs text-muted-foreground">{es && totalNote === "OVER 3 YEARS · ESTIMATE" ? "A 3 AÑOS · ESTIMACIÓN" : totalNote}</p>
          <div className="mt-4 space-y-2 text-xs leading-relaxed text-muted-foreground">
            <p><span className="font-medium text-foreground">{es ? 'Incluye: ' : 'Includes: '}</span>{es && costIncludes === "Asking price + 3 years of upkeep + money set aside for repairs." ? "Precio anunciado + 3 años de mantenimiento + reserva para reparaciones." : costIncludes}</p>
            <p><span className="font-medium text-foreground">{es ? 'No incluye: ' : 'Not included: '}</span>{es && costExcludes === "Fuel, insurance, taxes, registration, fees and financing. Resale value is not deducted." ? "Combustible, seguro, impuestos, registro, comisiones y financiación. No se descuenta la reventa." : costExcludes}</p>
            <p>{es ? 'El mantenimiento y las reparaciones son presupuestos estimados, no cotizaciones para este auto.' : 'Upkeep and repairs are budget estimates, not quotes for this car.'}</p>
          </div>
        </div>

        <hr className="my-5 border-dashed border-border" />

        <div className="space-y-2.5">
          {verdictLines.map((line) => (
            <Line key={line.label} {...line} label={label(line.label)} value={translatedValue(line.value)} />
          ))}
        </div>
        {riskTag ? (
          <p className="mt-3 flex flex-wrap items-center gap-2 font-mono text-xs leading-relaxed text-muted-foreground">
            <span className="bg-primary px-2 py-0.5 tracking-[0.12em] text-primary-foreground uppercase">
              {riskTag}
            </span>
            {riskReason}
          </p>
        ) : (
          <p className="mt-2 font-mono text-xs leading-relaxed text-muted-foreground">{riskReason}</p>
        )}

        <hr className="my-5 border-dashed border-border" />

        <p className="text-center font-mono text-xs tracking-[0.2em] text-muted-foreground">
          {es ? '*** REVISADO POR SCOUT ***' : '*** CHECKED BY SCOUT ***'}
        </p>
        <p className="mt-1 text-center font-mono text-xs tracking-[0.14em] text-accent-warm">
          {es ? 'GRACIAS POR COMPRAR CON INFORMACIÓN' : 'THANK YOU FOR NOT BUYING BLIND'}
        </p>
      </article>
      <div aria-hidden className="receipt-tear" />

      {offerBasis ? (
        <p className="mt-3 text-center font-mono text-xs leading-relaxed text-muted-foreground">
          {offerBasis}
        </p>
      ) : null}
    </>
  );
}

function Line({ label, value, muted }: ReceiptLine) {
  return (
    <div className="flex items-baseline gap-2 font-mono text-sm">
      <span className="shrink-0">{label}</span>
      <span
        aria-hidden
        className="min-w-6 flex-1 -translate-y-1 border-b border-dotted border-border"
      />
      <span className={`shrink-0 tabular-nums ${muted ? "text-muted-foreground" : ""}`}>
        {value}
      </span>
    </div>
  );
}

/** A hand-drawn oval around the total, the one figure the buyer should remember. */
function Circled({ value, drawDelay }: { value: string; drawDelay?: number | undefined }) {
  return (
    <span className="relative inline-block px-3 py-1">
      <svg
        aria-hidden
        viewBox="0 0 200 70"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full overflow-visible"
      >
        <path
          d="M104 9 C152 5 190 19 192 36 C194 55 150 66 97 64 C44 62 7 52 8 34 C9 15 56 5 112 11"
          fill="none"
          stroke="var(--brand-accent)"
          strokeWidth="2.6"
          strokeLinecap="round"
          pathLength={1}
          className={drawDelay !== undefined ? "receipt-circle-draw" : undefined}
          style={drawDelay !== undefined ? { animationDelay: `${drawDelay}s` } : undefined}
        />
      </svg>
      <span className="relative font-mono text-xl tabular-nums">{value}</span>
    </span>
  );
}

/** Copy-to-clipboard pill used beside seller questions and the report link. */
export function CopyPill({ text, label = "copy", copiedLabel = "copied" }: { text: string; label?: string; copiedLabel?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="shrink-0 rounded-none border border-input px-3 py-1 font-mono text-xs uppercase tracking-[0.1em] transition-colors hover:bg-secondary"
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
