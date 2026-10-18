import { createFileRoute } from "@tanstack/react-router";

import { useLanguage } from "@/components/site";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({
    meta: [
      { title: "Disclaimer | Used Car Scout" },
      {
        name: "description",
        content:
          "Used Car Scout is not a professional inspection. Here is exactly what its numbers do and do not tell you.",
      },
      { property: "og:title", content: "Disclaimer | Used Car Scout" },
      {
        property: "og:description",
        content:
          "Recalls and complaints cover a model year, not your exact car. Estimates are arithmetic, not appraisals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DisclaimerPage,
});

function DisclaimerPage() {
  const { language } = useLanguage();
  const t = (en: string, es: string) => language === "es" ? es : en;
  return (
    <LegalPage eyebrow={t("Legal", "Información legal")} title={t("Disclaimer", "Aviso importante")}>
      <p className="font-serif text-xl leading-snug text-foreground italic">{t("Used Car Scout is not a professional inspection, and it does not decide whether a car is safe to buy.", "Used Car Scout no es una inspección profesional y no decide si un auto es seguro para comprar.")}</p>

      <section>
        <h2 className="font-serif text-xl tracking-tight text-foreground">{t("Records cover a model year, not your car", "Los registros corresponden al año y modelo, no a tu auto")}</h2>
        <p className="mt-3">{t("Recall and complaint figures are gathered by make, model and year. They say what owners of that model have reported. They cannot say whether this particular car has had its recall work done, how it was driven, or what condition it is in. Only a VIN check at the official recall site can tell you whether an open recall is still outstanding on one car.", "Los retiros y quejas se consultan por marca, modelo y año. No muestran cómo se condujo este auto, su condición ni qué reparaciones recibió. Consulta el VIN en el sitio oficial para confirmar retiros pendientes.")}</p>
      </section>

      <section>
        <h2 className="font-serif text-xl tracking-tight text-foreground">{t("Cost figures are arithmetic, not an appraisal", "Los costos son cálculos, no una tasación")}</h2>
        <p className="mt-3">{t("The three-year total is purchase price plus fuel where available, plus a fixed yearly upkeep figure and a fixed repair allowance. Those two are assumptions chosen to be typical, not quotes for this car. A car that needs a transmission will cost far more than the allowance; a car that never needs one will cost less. The assumptions are printed beside the total so you can disagree with them.", "El total a tres años suma precio, combustible cuando está disponible, mantenimiento anual y una reserva para reparaciones. Son supuestos, no cotizaciones para este auto. Una reparación grande puede superar la reserva. Los supuestos aparecen junto al total.")}</p>
      </section>

      <section>
        <h2 className="font-serif text-xl tracking-tight text-foreground">{t("The opening offer is a starting point", "La oferta inicial es un punto de partida")}</h2>
        <p className="mt-3">{t("The suggested offer subtracts the cost of named work from the asking price, capped at a quarter of that price, then rounded. It is one way to open a conversation. It is not a valuation, and a seller is free to refuse it.", "La oferta descuenta trabajo identificado hasta un cuarto del precio y se redondea. No es una tasación. El vendedor puede rechazarla.")}</p>
      </section>

      <section>
        <h2 className="font-serif text-xl tracking-tight text-foreground">{t("Sources go quiet", "Las fuentes pueden fallar")}</h2>
        <p className="mt-3">{t("Government services are sometimes unavailable. When one cannot be reached, the report says so and leaves the figure out. A missing figure is never shown as zero, because zero would look like good news.", "Los servicios públicos a veces no están disponibles. Si falla una consulta, el reporte lo indica y omite la cifra. Un dato faltante nunca se muestra como cero.")}</p>
      </section>

      <p className="border-t border-border pt-6 text-xs">{t("A pre-purchase inspection by a mechanic you choose is still the last word on any used car.", "Una inspección previa a la compra por un mecánico que elijas sigue siendo la mejor evaluación del estado del auto.")}</p>
    </LegalPage>
  );
}
