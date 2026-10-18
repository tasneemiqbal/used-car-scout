import { useLanguage } from "@/components/site";
import { ReportHeader } from "@/components/report-header";
import { createFileRoute, Link } from "@tanstack/react-router";

import { ReceiptCard } from "@/components/receipt-card";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/sample-report")({
  head: () => ({
    meta: [
      { title: "Sample report | Used Car Scout" },
      {
        name: "description",
        content:
          "A worked example of a Used Car Scout report: the real cost of a car, a fair opening offer, and the records behind it.",
      },
      { property: "og:title", content: "Sample report | Used Car Scout" },
      {
        property: "og:description",
        content:
          "See what a report looks like before you run one: the real cost, a fair opening offer, and the records behind both.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SampleReportPage,
});

function SampleReportPage() {
  const { language } = useLanguage();
  const t = (en: string, spanish: string) => language === "es" ? spanish : en;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ReportHeader />

      <main className="mx-auto max-w-2xl px-5 pb-20">
        <p className="font-mono text-xs tracking-[0.22em] text-accent-warm uppercase">{t("Worked example", "Ejemplo ilustrativo")}</p>
        <h1 className="mt-4 font-serif text-4xl leading-tight tracking-tight">{t("What a report tells you", "Qué te dice un reporte")}</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t("This is a sample built from a typical listing, so you can see the shape of a real report before you run one. Your report combines model-year records with clearly labeled upkeep and repair budget assumptions.", "Este ejemplo muestra un reporte antes de generar el tuyo. Combina registros del año y modelo con supuestos de mantenimiento y reparaciones identificados como estimaciones.")}</p>

        <div className="mt-10">
          <ReceiptCard
            language={language}
            title="2013 Nissan Altima 2.5 SV"
            meta={t("148,000 MI · $4,200 ASKING", "148,000 MILLAS · $4,200 ANUNCIADO")}
            lines={[
              { label: "Asking price", value: "$4,200" },
              { label: "Fuel, 3 years", value: "not priced", muted: true },
              { label: "Upkeep, 3 years", value: "$1,500" },
              { label: "Repair allowance", value: "$2,500" },
            ]}
            total="$8,700"
            totalNote={t("estimate", "estimación")}
            verdictLines={[
              { label: "Fair offer", value: "$3,150" },
              { label: "Risk", value: "LOW" },
            ]}
            riskReason={t("12 recalls · 2,313 complaints · 10 sampled", "12 retiros · 2,313 quejas · 10 en la muestra")}
            offerBasis={t("Offer takes off named work, up to a quarter of the asking price.", "La oferta descuenta trabajo identificado, hasta un cuarto del precio anunciado.")}
          />
        </div>

        <section className="mt-12">
          <h2 className="font-serif text-xl tracking-tight">{t("How to read it", "Cómo leerlo")}</h2>
          <dl className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
            <div>
              <dt className="font-medium text-foreground">{t("Estimated 3-year cost", "Costo estimado a 3 años")}</dt>
              <dd className="mt-1">{t("The asking price plus three years of estimated upkeep and a repair budget. Fuel, insurance, taxes, fees and financing are extra. Resale value is not deducted.", "Precio anunciado más tres años de mantenimiento y reserva para reparaciones. Combustible, seguro, impuestos, comisiones y financiación son adicionales. No se descuenta la reventa.")}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">{t("Fair offer", "Oferta inicial")}</dt>
              <dd className="mt-1">{t("The asking price with the cost of named work taken off, up to a quarter of the asking price. A place to start, not a valuation.", "Precio anunciado menos el trabajo identificado, hasta un cuarto del precio. Es un punto de partida, no una tasación.")}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">{t("Risk", "Riesgo")}</dt>
              <dd className="mt-1">{t("How serious the complaints and recalls on this model year look. It says how many complaints were sampled, because the rating is drawn from a sample.", "Qué tan graves parecen los retiros y quejas del año y modelo. Indica cuántas quejas se revisaron porque el nivel se basa en una muestra.")}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">{t("Records", "Registros")}</dt>
              <dd className="mt-1">{t("Recalls and owner complaints come from the National Highway Traffic Safety Administration, with the link and the time it was fetched. Fuel economy and crash-test ratings are shown as unavailable when the source cannot be reached, never as a reassuring zero.", "Los retiros y quejas vienen de NHTSA, con fuente y fecha. Si falla una consulta de consumo o pruebas de choque, se indica no disponible, nunca cero.")}</dd>
            </div>
          </dl>
        </section>

        <p className="mt-10 text-sm leading-relaxed text-muted-foreground">{t("This does not decide whether the car is safe to buy and is not a professional inspection. No mechanic? Viewing mode helps you check the car yourself.", "No decide si el auto es seguro para comprar ni sustituye una inspección profesional. ¿Sin mecánico? El modo de visita te ayuda a revisar el auto.")}</p>
      </main>

      <SiteFooter />
    </div>
  );
}
