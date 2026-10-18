import { useLanguage } from "./site";
import type { StoredReport } from "@/lib/scout.report";

type Recall = StoredReport["evidence"]["recalls"]["items"][number];

// These describe parts, not the defect or repair. Official wording stays intact.
export function partName(component: string) {
  const part = component.toUpperCase();
  if (part.includes("HOOD")) return { name: "Hood latch", meaning: "The latch keeps the hood closed while you drive." };
  if (part.includes("AIR BAG") || part.includes("AIRBAG")) return { name: "Airbags", meaning: "Airbags help protect you in a crash." };
  if (part.includes("SEAT BELT")) return { name: "Seat belts", meaning: "Seat belts hold you in place in a crash." };
  if (part.includes("BRAKE")) return { name: "Brakes", meaning: "The system that slows and stops the car." };
  if (part.includes("STEERING")) return { name: "Steering", meaning: "The parts that let you control the car's direction." };
  if (part.includes("FUEL")) return { name: "Fuel system", meaning: "The parts that store fuel and deliver it to the engine." };
  if (part.includes("ENGINE")) return { name: "Engine", meaning: "The engine powers the car." };
  if (part.includes("TRANSMISSION") || part.includes("POWER TRAIN")) return { name: "Transmission", meaning: "The transmission moves power from the engine to the wheels." };
  if (part.includes("ELECTRICAL")) return { name: "Electrical system", meaning: "The wiring, battery and electronics." };
  return { name: component.toLowerCase().replaceAll(":", " · "), meaning: null };
}

/** One row per part, so several airbag notices show once with all their official records inside. */
export function groupRecalls(recalls: Recall[]): Recall[][] {
  const groups = new Map<string, Recall[]>();
  const seen = new Set<string>();
  for (const recall of recalls) {
    if (seen.has(recall.campaign)) continue;
    seen.add(recall.campaign);
    const key = partName(recall.component).name;
    groups.set(key, [...(groups.get(key) ?? []), recall]);
  }
  return [...groups.values()];
}

export function RecallRecord({ recalls, originals }: { recalls: Recall[]; originals?: Recall[] | undefined }) {
  const first = recalls[0];
  const { language } = useLanguage();
  if (!first) return null;
  const es = language === "es";
  const t = (en: string, spanish: string) => es ? spanish : en;
  const part = localizedPart(first.component, language);
  const parkIt = recalls.some((r) => r.parkIt);
  return (
    <li className="border-t border-border py-4 text-sm first:border-t-0">
      <p className="font-medium capitalize">
        {part.name}
        {recalls.length > 1 ? <span className="ml-2 font-normal text-muted-foreground">{recalls.length} {t("notices", "avisos")}</span> : null}
      </p>
      {part.meaning ? <p className="mt-1 text-muted-foreground">{part.meaning}</p> : null}
      {parkIt ? (
        <p className="mt-2 border-l-2 border-risk bg-risk-tint p-3 text-risk">
          {t("Do not drive warning in this recall. Ask a dealer whether it applies to this car before driving it.", "Este retiro indica no conducir. Pregunta a un concesionario si aplica a este auto antes de manejar.")}
        </p>
      ) : null}
      <p className="mt-2 leading-relaxed">
        <span className="font-medium">{t("Your next step: ", "Tu siguiente paso: ")}</span>
        {es ? "Pide al concesionario que revise el VIN y confirme si faltan reparaciones por estos retiros." : `Ask a dealer to check the car's VIN and confirm whether ${recalls.length > 1 ? "these recalls still need" : "this recall still needs"} a repair.`}
      </p>
      <details className="mt-3">
        <summary className="cursor-pointer text-primary">{t("Read the official issue and repair details", "Lee los detalles del problema y la reparación")}</summary>
        {recalls.map((recall) => (
          <div key={recall.campaign} className="mt-3 border-t border-border pt-3 first:border-t-0">
            <dl className="space-y-3 leading-relaxed text-muted-foreground">
              <div><dt className="font-medium text-foreground">{t("What can go wrong", "Qué puede fallar")}</dt><dd>{recall.summary}</dd></div>
              <div><dt className="font-medium text-foreground">{t("Why it matters", "Por qué importa")}</dt><dd>{recall.consequence || "The record does not describe this separately."}</dd></div>
              <div><dt className="font-medium text-foreground">{t("Repair described by the manufacturer", "Reparación indicada por el fabricante")}</dt><dd>{recall.remedy || "Ask a dealer for the repair details."}</dd></div>
            </dl>
            {originals && <details className="mt-3"><summary className="cursor-pointer text-primary">{t("Original official text", "Texto oficial original")}</summary>{originals.filter((item) => item.campaign === recall.campaign).map((item) => <div key={item.campaign} className="mt-2 space-y-2"><p>{item.summary}</p><p>{item.consequence}</p><p>{item.remedy}</p></div>)}</details>}
            <p className="mt-3 font-mono text-xs text-muted-foreground">{t("Recall ID", "ID del retiro")}: {recall.campaign} · {recall.component}</p>
          </div>
        ))}
      </details>
    </li>
  );
}

export function localizedPart(component: string, language: "en" | "es") {
  const part = partName(component);
  if (language !== "es") return part;
  const names: Record<string, [string, string]> = {
    "Hood latch": ["Cierre del capó", "Mantiene el capó cerrado al manejar."], Airbags: ["Bolsas de aire", "Ayudan a protegerte durante un choque."],
    "Seat belts": ["Cinturones de seguridad", "Te mantienen en tu asiento durante un choque."], Brakes: ["Frenos", "Reducen la velocidad y detienen el auto."],
    Steering: ["Dirección", "Permite controlar hacia dónde va el auto."], "Fuel system": ["Sistema de combustible", "Almacena combustible y lo lleva al motor."],
    Engine: ["Motor", "Da potencia al auto."], Transmission: ["Transmisión", "Lleva la potencia del motor a las ruedas."], "Electrical system": ["Sistema eléctrico", "Cableado, batería y electrónica."],
  };
  const translated = names[part.name];
  return translated ? { name: translated[0], meaning: translated[1] } : { name: "Otro componente", meaning: null };
}
