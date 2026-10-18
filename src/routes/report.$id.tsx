import type { StoredReport as LocalizedStoredReport } from "@/lib/scout.report";
import { createFileRoute, Link, notFound, useLocation } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";

import { ReportChat } from "@/components/report-chat";
import { ReportHeader } from "@/components/report-header";
import { ScoutAvatar } from "@/components/scout-avatar";
import { SafeMeetupTips } from "@/components/safe-meetup-tips";
import { ShareCard } from "@/components/share-card";
import { money, reportQueryOptions } from "@/lib/report-query";
import { ReportHighlight } from "@/components/report-highlight";
import { listingSignals } from "@/lib/scout.listing-evidence";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/report/$id")({
  validateSearch: z.object({ shared: z.coerce.number().optional() }),
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(reportQueryOptions(params.id));
    if (!data) throw notFound();
    return data;
  },
  head: () => ({
    meta: [
      { title: "Your car report | Used Car Scout" },
      { name: "description", content: "Scout's take on this used car: real 3-year cost, a fair offer, and what matters most." },
      { property: "og:title", content: "Your car report | Used Car Scout" },
      { property: "og:description", content: "Real 3-year cost, a fair offer, and what to ask the seller." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReportSummary,
});

const RISK_STEP = { low: 1, medium: 2, high: 3, unknown: 0 } as const;
const RISK_TONE = { low: "bg-good", medium: "bg-caution", high: "bg-risk", unknown: "bg-border" } as const;
const RISK_TEXT = { low: "text-good", medium: "text-caution", high: "text-risk", unknown: "text-muted-foreground" } as const;

function ReportSummary() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(reportQueryOptions(id));
  if (!data) throw notFound();
  return <ReportSummaryContent id={id} report={data.report} />;
}

function ReportSummaryContent({ id, report }: { id: string; report: LocalizedStoredReport }) {
  const data = { report };
  const { car, wording, evidence, cost, verdict } = data.report;
  const { shared } = Route.useSearch();
  const language = data.report.language ?? "en";
  const es = language === "es";
  const t = (en: string, spanish: string) => es ? spanish : en;
  const save = car.askingPrice - verdict.fairOffer;
  const step = RISK_STEP[verdict.risk];
  const [chatOpen, setChatOpen] = useState(false);
  const chatRequested = useLocation({ select: (location) => location.hash === "scout-chat" });
  useEffect(() => { if (chatRequested) setChatOpen(true); }, [chatRequested]);

  const rows: Array<{ label: string; explanation: string; tone: "risk" | "caution" | "muted" }> = [
    ...wording.concerns.slice(0, 3).map((c, i) => ({ label: c.point, explanation: c.why, tone: i === 0 && listingSignals(data.report.listing).scam ? "risk" as const : "caution" as const })),
  ];
  if (rows.length < 3 && evidence.recalls.status === "available") {
    rows.push({ label: `${evidence.recalls.count ?? 0} ${t("recall notices for this model year", "retiros para este año y modelo")}`, explanation: t("A recall is a safety problem the manufacturer must offer to fix. These notices may already be repaired on this car. A dealer can check its VIN.", "Un retiro es un problema de seguridad que el fabricante debe reparar. Quizá este auto ya fue reparado. Un concesionario puede revisar el VIN."), tone: (evidence.recalls.count ?? 0) > 0 ? "risk" : "muted" });
  }
  if (rows.length < 3 && evidence.complaints.status === "available") {
    rows.push({ label: `${(evidence.complaints.count ?? 0).toLocaleString()} ${t("owner complaints filed", "quejas de propietarios")}`, explanation: t("Complaints are reports from individual owners, not proof your car has the same problem. Compare nearby years in the full report. Sales volume affects counts.", "Son experiencias de propietarios, no prueba de que este auto tenga el mismo problema. Compara otros años en el reporte completo. Las ventas afectan las cifras."), tone: "muted" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ReportHeader wide />
      <div className="mx-auto grid max-w-6xl gap-8 px-5 pb-20 lg:grid-cols-[minmax(0,1fr)_400px]">
      <main className="min-w-0">
        {shared === 1 && <div className="mb-5 flex flex-wrap items-center justify-between gap-3 bg-secondary p-4"><p className="text-sm">{t("A friend shared this with you", "Un amigo compartió esto contigo")}</p><Link to="/check" className="text-sm font-medium text-primary underline">{t("Check your own car", "Revisa tu propio auto")}</Link></div>}
        <div className="flex items-center justify-between gap-3">
          <span className="inline-block bg-primary px-2.5 py-1 font-mono text-xs uppercase tracking-[0.15em] text-primary-foreground">
            {t("Car report", "Reporte del auto")}
          </span>
          <ShareCard
            reportId={id}
            make={car.make}
            model={car.model}
            askingPrice={car.askingPrice}
            total={cost.total}
            fuelIncluded={cost.fuelIncluded}
            excluded={cost.excluded}
            fairOffer={verdict.fairOffer}
            risk={verdict.risk}
          />
        </div>
        <p className="mt-3 font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
          {car.year} · {car.mileage.toLocaleString()} mi · {money(car.askingPrice)}
        </p>
        <h1 className="mt-2 font-serif text-4xl leading-tight tracking-tight">
          {car.make} {car.model}
        </h1>

        <section className="mt-6 border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <ScoutAvatar />
            <span className="text-sm text-muted-foreground">{t("Scout's take", "Lo que dice Scout")}</span>
          </div>
          <p className="mt-3 text-lg font-medium leading-snug">{wording.headline}</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex flex-1 gap-1.5" aria-hidden>
              {[1, 2, 3].map((n) => (
                <span key={n} className={`h-1.5 flex-1 ${n === step ? RISK_TONE[verdict.risk] : "bg-secondary"}`} />
              ))}
            </div>
            <span className={`text-sm capitalize ${RISK_TEXT[verdict.risk]}`}>{es ? ({ low: "Riesgo bajo", medium: "Riesgo medio", high: "Riesgo alto", unknown: "Riesgo desconocido" }[verdict.risk]) : `${verdict.risk} risk`}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{verdict.riskReason}</p>
          <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4">
            <div>
              <p className="text-xs text-muted-foreground">{t("Estimated 3-year cost", "Costo estimado a 3 años")}</p>
              <p className="mt-1 font-serif text-3xl">{money(cost.total)}</p>
              <p className="text-xs text-muted-foreground">vs. {money(car.askingPrice)} {t("asking", "anunciado")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("Estimated opening offer", "Oferta inicial estimada")}</p>
              <p className="mt-1 font-serif text-3xl">{money(verdict.fairOffer)}</p>
              {save > 0 ? <p className="text-xs text-good">{t("Potential saving", "Ahorro posible")}: {money(save)}</p> : null}
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            {es ? `Incluye el precio anunciado, 3 años de mantenimiento estimado y un presupuesto para reparaciones${cost.fuelIncluded ? ", más combustible estimado" : ""}. No incluye impuestos, seguro, registro, comisiones ni financiación${cost.fuelIncluded ? "" : " ni combustible"}. No se descuenta el valor de reventa.` : `Includes asking price, 3 years of estimated upkeep and a repair budget${cost.fuelIncluded ? ", plus estimated fuel" : ""}. Not included: ${cost.excluded.filter((item) => item !== "resale value").join(", ")}. Resale value is not deducted.`}
          </p>
        </section>

        <p className="mt-8 text-sm text-muted-foreground">{t("What matters", "Lo importante")}</p>
        <ul className="mt-2 divide-y divide-border border border-border bg-card">
          {rows.slice(0, 3).map((row) => <ReportHighlight key={row.label} reportId={id} {...row} language={language} />)}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {t("A recall is a safety problem the manufacturer must offer to fix, usually free. These notices may already be repaired on this car. Check its VIN to find out which repairs are still needed.", "Un retiro es un problema de seguridad que el fabricante debe reparar, normalmente gratis. Quizá este auto ya fue reparado. Revisa su VIN para confirmar qué reparaciones faltan.")}
        </p>

        <div className="mt-5 text-center">
          <Link to="/report/$id/full" params={{ id }} className="text-sm font-medium text-primary hover:underline">
            {t("Show full report", "Ver reporte completo")} ›
          </Link>
        </div>

        <CopyQuestions questions={wording.questions} es={es} />
        <p className="mt-2 text-center text-xs text-muted-foreground">{t("Paste them into Facebook Marketplace or Craigslist.", "Pégalas en Facebook Marketplace o Craigslist.")}</p>

        <Link
          to="/report/$id/viewing"
          params={{ id }}
          className="mt-4 block w-full rounded-none border-2 border-primary px-5 py-3.5 text-center text-sm font-medium text-primary transition-colors hover:bg-secondary"
        >
          {t("No mechanic? Check the car yourself with Viewing mode.", "¿Sin mecánico? Revisa el auto tú misma con el modo de visita.")}
        </Link>
        <Link
          to="/report/$id/practice"
          params={{ id }}
          className="mt-3 block w-full rounded-none border border-input px-5 py-3 text-center text-sm font-medium transition-colors hover:bg-secondary"
        >
          {t("Practice talking to the seller", "Practica hablar con el vendedor")}
        </Link>

        <SafeMeetupTips className="mt-6" language={language} />

        <p className="mt-6 text-center text-sm">
          {t("Bought it?", "¿Ya lo compraste?")}{" "}
          <Link to="/after-you-buy" className="font-medium text-primary hover:underline">
            {t("See your first-week checklist", "Revisa los pasos de tu primera semana")} ›
          </Link>
        </p>

        <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
          {t("Estimates and model-year records, not a professional inspection or a promise about this car's condition.", "Estimaciones y datos del año y modelo, no una inspección profesional ni una garantía del estado de este auto.")}
        </p>
      </main>
      <aside
        id="scout-chat"
        className={`${chatOpen ? "fixed inset-0 z-50 flex flex-col bg-background p-4" : "hidden"} overflow-hidden lg:sticky lg:top-6 lg:z-auto lg:flex lg:min-h-0 lg:h-[calc(100vh_-_3rem)] lg:flex-col lg:self-start lg:bg-transparent lg:p-0`}
      >
        <ReportChat reportId={id} autoFocus={chatOpen} fill onClose={() => setChatOpen(false)} />
      </aside>
      {!chatOpen && (
        <Button
          type="button"
          onClick={() => setChatOpen(true)}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg lg:hidden"
        >
          <ScoutAvatar className="h-6 w-6" /> {t("Ask Scout", "Pregunta a Scout")}
        </Button>
      )}
      </div>
    </div>
  );
}

function CopyQuestions({ questions, es = false }: { questions: string[]; es?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(questions.map((q, i) => `${i + 1}. ${q}`).join("\n"));
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="mt-8 w-full rounded-none bg-primary px-5 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
    >
      {copied ? es ? "Preguntas copiadas" : "Questions copied" : es ? "Copiar preguntas para el vendedor" : "Copy questions for the seller"}
    </button>
  );
}
