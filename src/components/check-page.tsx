import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { SafeMeetupTips } from "@/components/safe-meetup-tips";
import { CameraIcon } from "@/components/camera-icon";
import { SCOUT_LOGO_URL } from "@/lib/brand";
import { compressScreenshot, PREFILL_IMAGE_KEY, PREFILL_TEXT_KEY } from "@/lib/screenshot";
import { decodeVin, readListingDetails, runVehicleCheck } from "@/lib/scout.functions";
import { isEnoughToCheck, SCREENSHOT_LIMIT, TITLE_STATUSES, type ExtractedListing, type ListingField } from "@/lib/scout.extract";
import { isVinShaped, normalizeVin, vinMismatches, type VinSpecs } from "@/lib/scout.vin";
import { LISTING_CHARACTER_LIMIT, vehicleSchema } from "@/lib/scout.schemas";
import { useLanguage } from "@/components/site";
import { Button } from "@/components/ui/button";

const EMPTY: Record<ListingField, string> = {
  year: "", make: "", model: "", trim: "", mileage: "", askingPrice: "",
  location: "", vin: "", titleStatus: "", condition: "",
};

const LABELS: Record<ListingField, string> = {
  year: "Year", make: "Make", model: "Model", trim: "Trim", mileage: "Mileage", askingPrice: "Asking price",
  location: "Location", vin: "VIN", titleStatus: "Title status", condition: "Seller says (condition)",
};

const SPANISH_LABELS: Record<ListingField, string> = { year: "Año", make: "Marca", model: "Modelo", trim: "Versión", mileage: "Millas", askingPrice: "Precio anunciado", location: "Ubicación", vin: "VIN", titleStatus: "Estado del título", condition: "Estado según el vendedor" };

type Mark = "missing" | "uncertain" | null;

export function CheckPage() {
  const { language } = useLanguage();
  const es = language === "es";
  const t = (en: string, spanish: string) => es ? spanish : en;
  const navigate = useNavigate();
  const check = useServerFn(runVehicleCheck);
  const read = useServerFn(readListingDetails);
  const decode = useServerFn(decodeVin);
  const fileInput = useRef<HTMLInputElement>(null);

  const [listing, setListing] = useState("");
  const [shots, setShots] = useState<string[]>([]);
  const [fields, setFields] = useState(EMPTY);
  const [readResult, setReadResult] = useState<ExtractedListing | null>(null);
  const [touched, setTouched] = useState<Set<ListingField>>(new Set());
  const [vinSpecs, setVinSpecs] = useState<VinSpecs | null>(null);
  const [vinState, setVinState] = useState<"idle" | "loading" | "none">("idle");
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [running, setRunning] = useState(false);

  const remaining = LISTING_CHARACTER_LIMIT - listing.length;

  // A listing or screenshot handed over from the homepage is used once, then forgotten.
  useEffect(() => {
    const handed = window.sessionStorage.getItem(PREFILL_TEXT_KEY);
    const image = window.sessionStorage.getItem(PREFILL_IMAGE_KEY);
    window.sessionStorage.removeItem(PREFILL_TEXT_KEY);
    window.sessionStorage.removeItem(PREFILL_IMAGE_KEY);
    const text = handed ? handed.slice(0, LISTING_CHARACTER_LIMIT) : "";
    if (text) setListing(text);
    if (image) setShots([image]);
    if (text || image) void readAll(text, image ? [image] : [], true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(key: ListingField, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
    setTouched((current) => new Set(current).add(key));
    if (key === "vin") {
      setVinSpecs(null);
      setVinState("idle");
    }
  }

  function markFor(key: ListingField): Mark {
    if (!readResult || touched.has(key)) return null;
    if (!fields[key]) return "missing";
    return readResult.uncertain.includes(key) ? "uncertain" : null;
  }

  async function readAll(text = listing, images = shots, autoRun = false) {
    if (reading) return;
    setError(null);
    const trimmed = text.trim();
    if (!trimmed && images.length === 0) {
      setError(t("Paste the listing words or add a screenshot first, or fill the car in yourself below.", "Pega el anuncio, añade una captura o completa los datos del auto abajo."));
      return;
    }
    if (trimmed.length > LISTING_CHARACTER_LIMIT) {
      setError(`That listing is longer than ${LISTING_CHARACTER_LIMIT.toLocaleString()} characters.`);
      return;
    }
    setReading(true);
    try {
      const result = await read({ data: { text: trimmed, images, language: localStorage.getItem("scout.language") === "es" ? "es" : language } });
      applyRead(result.listing);
      // From the homepage "Check this car" button: go straight to the report when the listing had enough.
      if (autoRun && isEnoughToCheck(result.listing)) void runCheck(result.listing, result.vinSpecs);
      setVinSpecs(result.vinSpecs);
      setVinState(result.listing.vin && !result.vinSpecs ? "none" : "idle");
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : "The listing could not be read. Fill the car in below instead.");
    } finally {
      setReading(false);
    }
  }

  async function addScreenshots(files: FileList | null) {
    if (!files || reading) return;
    setError(null);
    const room = SCREENSHOT_LIMIT - shots.length;
    if (files.length > room) setError(`Up to ${SCREENSHOT_LIMIT} screenshots at a time. Extra ones were left out.`);
    try {
      const added: string[] = [];
      for (const file of [...files].slice(0, Math.max(0, room))) added.push(await compressScreenshot(file));
      const next = [...shots, ...added].slice(0, SCREENSHOT_LIMIT);
      setShots(next);
      // Read straight away so the buyer does not have to press a button.
      if (added.length > 0) void readAll(listing, next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That image could not be used.");
    }
  }

  async function lookUpVin() {
    const vin = normalizeVin(fields.vin);
    if (!isVinShaped(vin)) {
      setError(t("A VIN is 17 letters and numbers, with no I, O or Q.", "Un VIN tiene 17 letras y números, sin I, O ni Q."));
      return;
    }
    setError(null);
    setVinState("loading");
    try {
      const result = await decode({ data: { vin } });
      setVinSpecs(result.vinSpecs);
      setVinState(result.vinSpecs ? "idle" : "none");
    } catch (cause) {
      setVinState("idle");
      setError(cause instanceof Error ? cause.message : "The VIN could not be looked up.");
    }
  }

  function applyRead(result: ExtractedListing) {
    setReadResult(result);
    setTouched(new Set());
    const str = (v: string | number | null) => (v === null ? "" : String(v));
    setFields({
      year: str(result.year), make: str(result.make), model: str(result.model), trim: str(result.trim),
      mileage: str(result.mileage), askingPrice: str(result.askingPrice), location: str(result.location),
      vin: str(result.vin), titleStatus: str(result.titleStatus), condition: str(result.condition),
    });
    if (!isEnoughToCheck(result)) {
      setError(t("Some details were not in the listing. Fill in what is missing below. Scout will not guess.", "Faltan datos en el anuncio. Complétalos abajo. Scout no los inventará."));
    }
  }

  async function runCheck(l: ExtractedListing, specs: VinSpecs | null = null) {
    const parsed = vehicleSchema.safeParse({ year: l.year, make: l.make, model: l.model, mileage: l.mileage, askingPrice: l.askingPrice });
    if (!parsed.success) return;
    setRunning(true);
    try {
      const result = await check({ data: { ...parsed.data, language: localStorage.getItem("scout.language") === "es" ? "es" : language, listing: { condition: l.condition ?? "", titleStatus: l.titleStatus ?? "", redFlags: [...l.redFlags, ...(specs ? vinMismatches(specs, { year: String(l.year), make: l.make ?? "", model: l.model ?? "" }) : [])].slice(0, 8), questions: l.questions } } });
      await navigate({ to: "/report/$id", params: { id: result.id } });
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : "The check could not finish. Try again.");
      setRunning(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (running) return;
    setError(null);
    const parsed = vehicleSchema.safeParse({
      year: Number(fields.year),
      make: fields.make,
      model: fields.model,
      mileage: Number(fields.mileage.replace(/[,\s]/g, "")),
      askingPrice: Number(fields.askingPrice.replace(/[$,\s]/g, "")),
    });
    if (!parsed.success) {
      setError(t("Fill in the year, make, model, mileage and asking price so there is something to check.", "Completa año, marca, modelo, millas y precio anunciado para revisar el auto."));
      return;
    }
    setRunning(true);
    try {
      const result = await check({ data: { ...parsed.data, language: localStorage.getItem("scout.language") === "es" ? "es" : language, listing: { condition: fields.condition, titleStatus: TITLE_STATUSES.find((value) => value === fields.titleStatus) ?? "", redFlags: redFlags.slice(0, 8), questions: readResult?.questions ?? [] } } });
      await navigate({ to: "/report/$id", params: { id: result.id } });
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : "The check could not finish. Try again.");
      setRunning(false);
    }
  }

  const redFlags = [...(vinSpecs ? vinMismatches(vinSpecs, fields) : []), ...(readResult?.redFlags ?? [])];
  if (readResult && fields.titleStatus && fields.titleStatus !== "clean" && !redFlags.some((f) => /title/i.test(f))) {
    redFlags.unshift(es ? "El anuncio indica un problema con el título. Pide verlo antes de pagar." : `Title is listed as ${fields.titleStatus}. Ask to see the title before paying.`);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {running ? <CheckProgress language={language} /> : null}
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <a href="/" className="flex items-center gap-3">
          <img src={SCOUT_LOGO_URL} alt="" className="h-9 w-9" />
          <span className="font-serif text-lg tracking-tight">Used Car Scout</span>
        </a>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-16">
        <ol aria-label={t("Car check steps", "Pasos de revisión")} className="mb-8 grid grid-cols-3 gap-3 border-y border-border py-4 text-sm">
          {[t("Add listing", "Añade el anuncio"), t("Review details", "Revisa los datos"), t("Car report", "Reporte del auto")].map((label, i) => <li key={i} aria-current={(readResult || touched.size > 0 ? 1 : 0) === i ? "step" : undefined} className={(readResult || touched.size > 0 ? 1 : 0) === i ? "font-medium text-primary" : "text-muted-foreground"}>{i + 1}. {label}</li>)}
        </ol>
        <h1 className="font-serif text-4xl leading-tight tracking-tight text-balance md:text-5xl">{t("What are we looking at?", "¿Qué auto vamos a revisar?")}</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
          {t("Paste the listing words, add screenshots, or both. Scout fills in the car. You can edit everything.", "Pega el anuncio, añade capturas o ambos. Scout completa los datos del auto. Puedes editar todo.")}
        </p>

        <label className="mt-9 block">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("Listing text", "Texto del anuncio")}</span>
          <textarea
            value={listing}
            onChange={(event) => setListing(event.target.value)}
            rows={6}
            placeholder={t("2013 Nissan Altima 2.5 SV, 148,000 miles, $6,900. Clean title. Runs well, cold A/C, one door rattle.", "2013 Nissan Altima 2.5 SV, 148,000 millas, $6,900. Título limpio. Funciona bien, aire frío, ruido en una puerta.")}
            className="mt-3 w-full resize-y rounded-none border border-input bg-card p-4 font-mono text-sm leading-relaxed outline-none placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-ring"
          />
          <span className={`mt-2 block font-mono text-xs ${remaining < 0 ? "text-risk" : "text-muted-foreground"}`}>
            {remaining.toLocaleString()} {t("characters left", "caracteres disponibles")}
          </span>
        </label>

        <div className="mt-5">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {t("Screenshots", "Capturas")} ({shots.length} {t("of", "de")} {SCREENSHOT_LIMIT})
          </span>
          <div className="mt-3 flex flex-wrap gap-3">
            {shots.map((shot, index) => (
              <div key={index} className="relative h-24 w-24 border border-input bg-card">
                <img src={shot} alt={`Listing screenshot ${index + 1}`} className="h-full w-full object-cover" />
                <Button variant="ghost"
                  type="button"
                  onClick={() => setShots((current) => current.filter((_, i) => i !== index))}
                  aria-label={`Remove screenshot ${index + 1}`}
                  className="absolute right-0 top-0 bg-foreground px-1.5 text-xs text-background"
                >
                  ×
                </Button>
              </div>
            ))}
            {shots.length < SCREENSHOT_LIMIT ? (
              <Button variant="outline"
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={reading}
                className="flex h-24 w-24 flex-col items-center justify-center gap-1 border border-dashed border-input text-xs text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-60"
              >
                <CameraIcon /> {t("Add", "Añadir")}
              </Button>
            ) : null}
          </div>
          <input
            ref={fileInput}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/heic,image/heif,.heic,.heif"
            className="sr-only"
            aria-label="Upload listing screenshots"
            onChange={(event) => {
              void addScreenshots(event.target.files);
              event.target.value = "";
            }}
          />
        </div>

        <Button
          type="button"
          onClick={() => void readAll()}
          disabled={reading}
          className="mt-6 rounded-none bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {reading ? t("Reading the listing\u2026", "Leyendo el anuncio…") : t("Read the listing", "Lee el anuncio")}
        </Button>

        {readResult ? (
          <section className="mt-8 space-y-4">
            {readResult.summary ? (
              <div className="border-l-2 border-primary bg-card p-4">
                <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
                  {t("Summary · confidence", "Resumen · confianza")} {es ? ({high: "alta", medium: "media", low: "baja"}[readResult.confidence]) : readResult.confidence}
                </p>
                <p className="mt-2 text-sm leading-relaxed">{readResult.summary}</p>
              </div>
            ) : null}
            {redFlags.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="bg-caution-tint p-4">
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-caution">{t("Red flags to verify", "Señales de alerta por confirmar")}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed">
                    {redFlags.map((flag) => <li key={flag}>{flag}</li>)}
                  </ul>
                </div>
                <SafeMeetupTips language={language} />
              </div>
            ) : null}
            {readResult.questions.length > 0 ? (
              <div className="bg-card p-4">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("Ask the seller", "Preguntas para el vendedor")}</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed">
                  {readResult.questions.map((q) => <li key={q}>{q}</li>)}
                </ol>
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">{t("Read from the seller's own words, not an official record.", "Datos del anuncio del vendedor, no de un registro oficial.")}</p>
          </section>
        ) : null}

        <form onSubmit={submit} className="mt-10 border-t border-border pt-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("The car", "El auto")}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {(["year", "make", "model", "trim", "mileage", "askingPrice", "location"] as const).map((key) => (
              <Field key={key} label={es ? SPANISH_LABELS[key] : LABELS[key]} mark={markFor(key)}>
                <input value={fields[key]} onChange={(e) => update(key, e.target.value)} className={INPUT} />
              </Field>
            ))}
            <Field label={es ? SPANISH_LABELS.titleStatus : LABELS.titleStatus} mark={markFor("titleStatus")}>
              <select value={fields.titleStatus} onChange={(e) => update("titleStatus", e.target.value)} className={INPUT}>
                <option value="">{t("Unknown", "Desconocido")}</option>
                {TITLE_STATUSES.map((t) => (
                  <option key={t} value={t}>{es ? ({clean: "Limpio", salvage: "Pérdida total", rebuilt: "Reconstruido", lien: "Con gravamen", missing: "Falta el título", other: "Otro"}[t]) : t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-4">
            <Field label={es ? SPANISH_LABELS.condition : LABELS.condition} mark={markFor("condition")}>
              <textarea value={fields.condition} rows={2} onChange={(e) => update("condition", e.target.value)} className={INPUT} />
            </Field>
          </div>

          <div className="mt-4 flex items-end gap-3">
            <div className="flex-1">
              <Field label={LABELS.vin} mark={markFor("vin")}>
                <input value={fields.vin} onChange={(e) => update("vin", e.target.value)} className={INPUT} />
              </Field>
            </div>
            <Button variant="outline"
              type="button"
              onClick={() => void lookUpVin()}
              disabled={vinState === "loading" || !fields.vin}
              className="rounded-none border border-input px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-60"
            >
              {vinState === "loading" ? t("Looking up\u2026", "Consultando…") : t("Look up VIN", "Consulta el VIN")}
            </Button>
          </div>

          {vinState === "none" ? (
            <p className="mt-3 text-sm text-muted-foreground">{t("NHTSA had no specs for that VIN. Double-check it with the seller.", "NHTSA no encontró datos para ese VIN. Confírmalo con el vendedor.")}</p>
          ) : null}
          {vinSpecs ? <VinPanel specs={vinSpecs} /> : null}

          {error ? <p className="mt-6 bg-risk-tint p-4 text-sm text-risk" role="alert">{error}</p> : null}

          <Button
            type="submit"
            disabled={running}
            className="mt-8 inline-flex items-center gap-2 rounded-none bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {running ? t("Checking the records\u2026", "Consultando registros…") : t("Run the check", "Genera el reporte")}
            <span aria-hidden className="text-base leading-none">&rarr;</span>
          </Button>
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            {t("Uses year, make, model, mileage and price. About half a minute. Ten checks an hour.", "Usa año, marca, modelo, millas y precio. Aproximadamente medio minuto. Diez revisiones por hora.")}
          </p>
        </form>
      </main>
    </div>
  );
}

const INPUT =
  "mt-2 w-full rounded-none border border-input bg-card px-3.5 py-2.5 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Field({ label, mark, children }: { label: string; mark: Mark; children: React.ReactNode }) {
  const { language } = useLanguage();
  const es = language === "es";
  return (
    <label className="block">
      <span className="flex items-center justify-between gap-2 font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
        {label}
        {mark === "missing" ? <span className="normal-case tracking-normal text-muted-foreground/80">{es ? "No figura en el anuncio" : "Not in listing"}</span> : null}
        {mark === "uncertain" ? <span className="bg-caution-tint px-1.5 normal-case tracking-normal text-caution">{es ? "Confirma esto" : "Check this"}</span> : null}
      </span>
      {children}
    </label>
  );
}

function VinPanel({ specs }: { specs: VinSpecs }) {
  const { language } = useLanguage();
  const es = language === "es";
  const rows: Array<[string, string | number | null]> = [
    ["Year", specs.year], ["Make", specs.make], ["Model", specs.model], ["Trim", specs.trim],
    ["Body", specs.bodyClass], ["Engine", specs.engine], ["Fuel", specs.fuelType],
    ["Drive", specs.driveType], ["Transmission", specs.transmission], ["Built in", specs.builtIn],
  ];
  return (
    <div className="mt-4 border border-input bg-card p-4">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{es ? "Datos de fábrica según el VIN" : "Factory specs from the VIN"}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-3">
        {rows.filter(([, v]) => v).map(([k, v]) => (
          <div key={k}>
            <dt className="font-mono text-xs text-muted-foreground">{es ? ({Year: "Año", Make: "Marca", Model: "Modelo", Trim: "Versión", Body: "Carrocería", Engine: "Motor", Fuel: "Combustible", Drive: "Tracción", Transmission: "Transmisión", "Built in": "Fabricado en"} as Record<string, string>)[k] ?? k : k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      {specs.note ? <p className="mt-3 text-sm text-caution">{specs.note}</p> : null}
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {es ? "Datos del " : "From the "}<a href={specs.source} target="_blank" rel="noreferrer" className="underline">{es ? "decodificador VIN de NHTSA" : "NHTSA VIN decoder"}</a>.
        {es ? " Muestra cómo salió el auto de fábrica. No es un historial ni una inspección. No muestra accidentes, dueños anteriores, estado del título ni condición actual." : " This shows how the car left the factory. It is not a vehicle history report or a mechanical inspection, so it cannot show accidents, past owners, title brands or current condition."}
      </p>
    </div>
  );
}

const STEPS = [
  { at: 0, label: "Looking up recalls for this model" },
  { at: 6, label: "Reading owner complaints" },
  { at: 14, label: "Working out the real 3-year cost" },
  { at: 20, label: "Scout is writing your report" },
];
const EXPECTED_SECONDS = 35;

/** Honest progress: time-based, never claims done until the report opens. */
function CheckProgress({ language }: { language: "en" | "es" }) {
  const es = language === "es";
  const label = (value: string) => es ? ({"Looking up recalls for this model": "Consultando retiros de este modelo", "Reading owner complaints": "Leyendo quejas de propietarios", "Working out the real 3-year cost": "Calculando el costo a 3 años", "Scout is writing your report": "Scout está escribiendo tu reporte"} as Record<string, string>)[value] ?? value : value;
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const timer = window.setInterval(() => setSeconds((Date.now() - started) / 1000), 250);
    return () => window.clearInterval(timer);
  }, []);
  // Eases toward 95% so a slow check never shows a finished bar.
  const percent = Math.min(95, Math.round(95 * (1 - Math.exp(-seconds / (EXPECTED_SECONDS / 2.2)))));
  const current = [...STEPS].reverse().find((s) => seconds >= s.at) ?? { at: 0, label: "Looking up recalls for this model" };
  const left = Math.max(0, Math.ceil(EXPECTED_SECONDS - seconds));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 px-6 backdrop-blur-sm" role="status" aria-live="polite">
      <div className="w-full max-w-md border border-border bg-card p-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{es ? "Paso 3 de 3 · Preparando tu reporte" : "Step 3 of 3 · Preparing your report"}</p>
        <p className="mt-3 font-serif text-2xl leading-tight">{label(current.label)}…</p>
        <div className="mt-5 h-2 w-full bg-secondary" aria-hidden>
          <div className="h-full bg-primary transition-[width] duration-300 ease-out" style={{ width: `${percent}%` }} />
        </div>
        <div className="mt-2 flex justify-between font-mono text-xs text-muted-foreground">
          <span>{percent}%</span>
          <span>{left > 0 ? es ? `Unos ${left}s restantes` : `About ${left}s left` : es ? "Ya casi está" : "Almost there"}</span>
        </div>
        <ul className="mt-5 space-y-1.5 text-sm">
          {STEPS.map((step) => {
            const done = seconds >= step.at && step !== current;
            const active = step === current;
            return (
              <li key={step.label} className={done ? "text-muted-foreground" : active ? "text-foreground" : "text-muted-foreground/60"}>
                <span aria-hidden className="mr-2 inline-block w-3">{done ? "✓" : active ? "•" : ""}</span>
                {label(step.label)}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
