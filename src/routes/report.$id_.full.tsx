import { useLanguage } from "@/components/site";
import type { StoredReport as LocalizedStoredReport } from "@/lib/scout.report";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { CopyPill, ReceiptCard } from "@/components/receipt-card";
import { ReportHeader } from "@/components/report-header";
import { groupRecalls, RecallRecord } from "@/components/recall-record";
import { ComplaintGroups } from "@/components/complaint-record";
import { money, reportQueryOptions } from "@/lib/report-query";
import type { StoredReport } from "@/lib/scout.report";
import { GlossaryText } from "@/components/scout-glossary";
import { SafeMeetupTips } from "@/components/safe-meetup-tips";

export const Route = createFileRoute("/report/$id_/full")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(reportQueryOptions(params.id));
    if (!data) throw notFound();
    return data;
  },
  head: () => ({
    meta: [
      { title: "Full car report | Used Car Scout" },
      { name: "description", content: "Every detail behind Scout's take: costs, recalls, owner complaints and sources." },
      { property: "og:title", content: "Full car report | Used Car Scout" },
      { property: "og:description", content: "Costs, recalls, owner complaints and sources for this used car." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FullReport,
});

function FullReport() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(reportQueryOptions(id));
  if (!data) throw notFound();
  return <FullReportContent id={id} report={data.report} original={data.report} />;
}

function FullReportContent({ id, report, original }: { id: string; report: LocalizedStoredReport; original: LocalizedStoredReport }) {
  const data = { report };
  const { car, wording, evidence, cost, verdict } = data.report;
  const language = data.report.language ?? "en";
  const es = language === "es";
  const t = (en: string, spanish: string) => es ? spanish : en;
  const checkedAs = evidence.recalls.checkedAs ?? evidence.complaints.checkedAs;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ReportHeader />
      <main className="mx-auto max-w-2xl px-5 pb-20">
        <Link to="/report/$id" params={{ id }} className="text-sm text-primary hover:underline">
          ‹ {t("Back to summary", "Volver al resumen")}
        </Link>

        <div className="mt-5">
          <ReceiptCard
            language={language}
            headingLevel="h1"
            title={`${car.year} ${car.make} ${car.model}`}
            meta={
              `${car.mileage.toLocaleString()} ${t("MI", "MILLAS")} · ${money(car.askingPrice)} ${t("ASKING", "ANUNCIADO")}` +
              (checkedAs && checkedAs !== car.model ? ` · ${t("CHECKED AS", "CONSULTADO COMO")} ${checkedAs.toUpperCase()}` : "")
            }
            lines={[
              { label: t("Asking price", "Precio anunciado"), value: money(cost.purchase) },
              { label: t("Fuel, 3 years", "Combustible, 3 años"), value: cost.fuel === null ? t("not priced", "sin calcular") : money(cost.fuel), muted: cost.fuel === null },
              { label: t("Upkeep, 3 years", "Mantenimiento, 3 años"), value: money(cost.maintenance) },
              { label: t("Repair allowance", "Reserva para reparaciones"), value: money(cost.repairs) },
            ]}
            total={money(cost.total)}
            totalNote={t("purchase + estimated upkeep, repairs and any priced fuel", "compra + mantenimiento, reparaciones y combustible calculado")}
            costIncludes={es ? `Precio anunciado + 3 años de mantenimiento + reserva para reparaciones${cost.fuelIncluded ? " + combustible estimado" : ""}.` : `Asking price + 3 years of upkeep + money set aside for repairs${cost.fuelIncluded ? " + 3 years of estimated fuel" : ""}.`}
            costExcludes={es ? `Impuestos, seguro, registro, comisiones, financiación${cost.fuelIncluded ? "" : ", combustible"}. No se descuenta la reventa.` : `${cost.excluded.filter((item) => item !== "resale value").join(", ")}. Resale value is not deducted.`}
            verdictLines={[
              { label: t("Fair offer", "Oferta inicial"), value: money(verdict.fairOffer) },
              { label: t("Risk", "Riesgo"), value: es ? ({low: "BAJO", medium: "MEDIO", high: "ALTO", unknown: "DESCONOCIDO"}[verdict.risk]) : verdict.risk.toUpperCase() },
            ]}
            riskReason={verdict.riskReason}
            offerBasis={verdict.offerBasis}
          />
        </div>

        <Section title={t("What matters", "Lo importante")}>
          <ul className="space-y-3">
            {wording.concerns.map((c, i) => (
              <li key={c.point} id={`concern-${i}`} className="scroll-mt-6 border-l-2 border-caution bg-card p-4">
                <p className="text-sm font-medium"><GlossaryText text={c.point} language={language} /></p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground"><GlossaryText text={c.why} language={language} /></p>
              </li>
            ))}
          </ul>
        </Section>

        {data.report.listing && <Section title={t("From the listing", "Del anuncio")}><p className="text-xs text-muted-foreground">{t('Unverified seller claims, not official records.', 'Afirmaciones no verificadas del vendedor, no registros oficiales.')}</p>{data.report.listing.condition && <p className="mt-3 text-sm"><GlossaryText text={data.report.listing.condition} language={language} /></p>}<ul className="mt-3 list-disc space-y-2 pl-5 text-sm">{data.report.listing.redFlags.filter(Boolean).map((flag) => <li key={flag}>{flag}</li>)}</ul>{data.report.listing.redFlags.some(Boolean) && <SafeMeetupTips className="mt-4" language={language} />}</Section>}

        <Section title={t("Other model years", "Otros años del modelo")}>
          <p className="mb-3 text-sm text-muted-foreground">{t('Complaint counts are not failure rates. Older cars have had more time to accumulate complaints, and sales volume varies. These counts do not prove one year is safer.', 'Las cifras de quejas no son tasas de fallas. Los autos antiguos acumulan más años de quejas y las ventas varían. No prueban que un año sea más seguro.')}</p>
          {evidence.otherYears?.length ? <table className="w-full text-sm"><thead><tr className="border-b border-border text-left"><th className="py-2 font-medium">{t('Model year', 'Año del modelo')}</th><th className="py-2 text-right font-medium">{t('Complaints filed', 'Quejas registradas')}</th></tr></thead><tbody>{evidence.otherYears.map((row) => <tr key={row.year} className={row.year === car.year ? "bg-secondary" : "border-b border-border"}><td className="px-2 py-2">{row.year}{row.year === car.year ? t(" · this listing", " · este anuncio") : ""}</td><td className="px-2 py-2 text-right">{row.status === "available" ? <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">{row.count?.toLocaleString()}</a> : t("Couldn't load", "No se pudo cargar")}</td></tr>)}</tbody></table> : <p className="text-sm text-muted-foreground">{t('This older report has no comparison. Run a new check to include nearby years.', 'Este reporte antiguo no tiene comparación. Haz una nueva revisión para incluir otros años.')}</p>}
        </Section>

        <Section title={t("Estimated price check", "Precio estimado")}>
          {wording.priceRange ? <><p className="text-2xl font-medium">{money(wording.priceRange.low)} {t("to", "a")} {money(wording.priceRange.high)} <span className="text-xs text-muted-foreground">{t("Estimate", "Estimación")}</span></p><p className="mt-3 text-sm text-muted-foreground">{wording.priceRange.basis}</p></> : <p className="text-sm text-muted-foreground">{t('No price range was estimated in this report.', 'No se estimó un rango de precios en este reporte.')}</p>}
          <p className="mt-3 text-xs text-muted-foreground">{t('A rough general-knowledge range, not live market prices, comparable listings or an appraisal. Local prices and condition can differ substantially.', 'Un rango aproximado de conocimiento general, no precios actuales, anuncios comparables ni una tasación. El mercado local y el estado del auto pueden variar mucho.')}</p>
          <p className="mt-4 text-sm">{t("Estimated opening offer", "Oferta inicial estimada")}: {money(verdict.fairOffer)}. {t("Potential saving if accepted", "Ahorro posible si se acepta")}: {money(car.askingPrice - verdict.fairOffer)}.</p><p className="mt-2 text-xs text-muted-foreground">{verdict.offerBasis}</p>
        </Section>

        <Section title={t("Fuel and crash-test ratings", "Combustible y pruebas de choque")}>
          {evidence.fuelEconomy.variants?.length ? <><p className="text-sm">{t('EPA combined gasoline MPG by configuration:', 'Consumo combinado EPA por configuración, en millas por galón:')}</p><ul className="mt-2 space-y-2 text-sm">{evidence.fuelEconomy.variants.map((v) => <li key={v.label}>{v.label}: {v.mpg} MPG</li>)}</ul><p className="mt-3 text-xs text-muted-foreground">{es ? `El presupuesto usa el menor MPG coincidente (${cost.assumptions.combinedMpg}), ${cost.assumptions.annualMiles.toLocaleString()} millas al año y un precio supuesto de $${(cost.assumptions.dollarsPerGallon ?? 0).toFixed(2)} por galón. No es un precio actual. Confirma el motor; los hábitos de manejo cambian el consumo.` : `Fuel budget uses the lowest matching MPG (${cost.assumptions.combinedMpg}), ${cost.assumptions.annualMiles.toLocaleString()} miles a year and an assumed $${(cost.assumptions.dollarsPerGallon ?? 0).toFixed(2)} per gallon. This fuel price is an estimate, not a live pump price. Confirm the engine; driving habits change consumption.`}</p></> : <p className="text-sm text-muted-foreground">{t('Fuel data could not be matched. Fuel is excluded from this budget.', 'No se pudo encontrar el consumo. Este presupuesto excluye combustible.')}</p>}
          {evidence.safetyRatings.variants?.length ? <ul className="mt-4 space-y-2 text-sm">{evidence.safetyRatings.variants.map((v) => <li key={v.label}>{v.label}: {v.overall === null ? t("Not rated", "Sin calificación") : `${v.overall} / 5 ${t("overall stars", "estrellas generales")}`}</li>)}</ul> : <p className="mt-4 text-sm text-muted-foreground">{t('Crash-test ratings could not be loaded for this model.', 'No se pudieron cargar las pruebas de choque para este modelo.')}</p>}
          <p className="mt-3 text-xs text-muted-foreground">{t('Ratings apply to the listed body configuration, not the current condition of this car.', 'Las calificaciones corresponden a la configuración indicada, no al estado actual de este auto.')}</p>
        </Section>

        <Section title={t("The records", "Los registros")} id="records">
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            {t("A recall means the manufacturer has identified a safety problem and must offer a fix, usually free. These are notices for this model year, not proof this car still needs repairs.", "Un retiro es un problema de seguridad que el fabricante debe reparar, normalmente gratis. Estos avisos corresponden al año y modelo, no confirman que este auto necesite reparación.")}
          </p>
          <ul className="divide-y divide-border border-y border-border">
            <SourceRow source={evidence.recalls} label={t("Recalls", "Retiros")} />
            <SourceRow source={evidence.complaints} label={t("Owner complaints", "Quejas de propietarios")} />
            <SourceRow source={evidence.fuelEconomy} label={t("Fuel economy", "Consumo de combustible")} />
            <SourceRow source={evidence.safetyRatings} label={t("Crash-test ratings", "Pruebas de choque")} />
          </ul>
          {evidence.recalls.items.length > 0 ? (
            <details className="mt-4 border border-border bg-card p-4" open>
              <summary className="cursor-pointer text-sm font-medium">{t("Recalls", "Retiros")} ({evidence.recalls.items.length})</summary>
              <ul className="mt-3">
                {groupRecalls(evidence.recalls.items).map((group) => (
                  <RecallRecord key={group[0]?.campaign} recalls={group} originals={language !== (original.language ?? "en") ? original.evidence.recalls.items : undefined} />
                ))}
              </ul>
            </details>
          ) : null}
          {evidence.complaints.items.length > 0 ? (
            <details className="mt-3 border border-border bg-card p-4">
              <summary className="cursor-pointer text-sm font-medium">{t("Sample owner complaints", "Muestra de quejas de propietarios")} ({evidence.complaints.items.length})</summary>
              <ComplaintGroups complaints={evidence.complaints.items} />
            </details>
          ) : null}
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {t("These cover the model year, not this exact car. Only a VIN check at the official recall site shows whether a recall is still open.", "Son registros del año y modelo, no de este auto. Revisa el VIN en el sitio oficial para confirmar si faltan reparaciones.")}
          </p>
          <a href="https://www.nhtsa.gov/recalls" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-medium text-primary underline underline-offset-4">
            {t("Check this car's VIN for unrepaired recalls", "Revisa el VIN para confirmar reparaciones pendientes")} ↗
          </a>
        </Section>

        <Section title={t("Ask the seller", "Preguntas para el vendedor")}>
          <ul className="space-y-2">
            {wording.questions.map((q) => (
              <li key={q} className="flex items-start justify-between gap-3 border border-border bg-card px-4 py-3">
                <span className="text-sm leading-snug">{q}</span>
                <CopyPill text={q} label={t("copy", "copiar")} copiedLabel={t("copied", "copiado")} />
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t("Keep in mind", "Ten en cuenta")}>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
            {wording.caveats.map((c) => <li key={c}>{c}</li>)}
          </ul>
          <p className="mt-4 font-mono text-xs leading-relaxed text-muted-foreground">
            {es ? `Supuestos: ${cost.assumptions.annualMiles.toLocaleString()} millas al año, ${money(cost.assumptions.annualMaintenance)} al año de mantenimiento y ${money(cost.assumptions.repairAllowance)} para reparaciones en tres años. Las exclusiones figuran junto al total.` : `Assumptions: ${cost.assumptions.annualMiles.toLocaleString()} miles a year, ${money(cost.assumptions.annualMaintenance)} a year of upkeep, ${money(cost.assumptions.repairAllowance)} for repairs over three years. Not included: ${cost.excluded.join(", ")}.`}
          </p>
        </Section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/report/$id" params={{ id }} hash="scout-chat" className="rounded-none bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
            {t("Ask Scout about this car", "Pregunta a Scout sobre este auto")}
          </Link>
          <Link to="/check" className="rounded-none border border-input px-5 py-2.5 text-sm font-medium hover:bg-secondary">
            {t("Check another car", "Revisa otro auto")}
          </Link>
        </div>
      </main>
    </div>
  );
}

function Section({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-10 scroll-mt-6">
      <details open><summary className="mb-3 cursor-pointer font-serif text-xl tracking-tight">{title}</summary>{children}</details>
    </section>
  );
}

function SourceRow({ source, label }: { source: Pick<StoredReport["evidence"]["fuelEconomy"], "status" | "url" | "count">; label: string }) {
  const { language } = useLanguage();
  const t = (en: string, es: string) => language === "es" ? es : en;
  const ok = source.status === "available";
  return (
    <li className="flex items-baseline justify-between gap-3 py-2.5">
      <span className="text-sm">{label}</span>
      <span className={`font-mono text-sm tabular-nums ${ok ? "" : "text-caution"}`}>
        {ok ? (
          <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline decoration-border underline-offset-4">
            {(source.count ?? 0).toLocaleString()}
          </a>
        ) : (
          t("unavailable", "no disponible")
        )}
      </span>
    </li>
  );
}
