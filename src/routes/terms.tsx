import { createFileRoute } from "@tanstack/react-router";

import { useLanguage } from "@/components/site";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms | Used Car Scout" },
      {
        name: "description",
        content:
          "The plain terms of using Used Car Scout: what it does, what it does not do, and the limits on use.",
      },
      { property: "og:title", content: "Terms | Used Car Scout" },
      {
        property: "og:description",
        content:
          "What Used Car Scout does, what it does not do, and the fair-use limits that keep it free.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const { language } = useLanguage();
  const t = (en: string, es: string) => language === "es" ? es : en;
  return (
    <LegalPage eyebrow={t("Legal", "Información legal")} title={t("Terms", "Condiciones")}>
      <p>{t("Used Car Scout is free to use. In exchange we ask that you use it the way it was built to be used: to check a car you are actually thinking about buying.", "Used Car Scout es gratuito. Úsalo para revisar un auto que realmente estés considerando comprar.")}</p>

      <section>
        <h2 className="font-serif text-xl tracking-tight text-foreground">{t("What you get", "Qué obtienes")}</h2>
        <p className="mt-3">{t("A check returns what public records say about that model year, an estimate of what the car may cost to keep, a suggested opening offer, and questions worth asking the seller. Every sourced figure shows where it came from and when it was fetched. Every figure that is our arithmetic is labelled as an estimate and shows its assumptions.", "La revisión muestra registros públicos del año y modelo, un presupuesto de costos, una oferta inicial y preguntas para el vendedor. Los datos indican fuente y fecha. Los cálculos se identifican como estimaciones con sus supuestos.")}</p>
      </section>

      <section>
        <h2 className="font-serif text-xl tracking-tight text-foreground">{t("Fair use", "Uso razonable")}</h2>
        <p className="mt-3">{t("A device can run ten checks an hour and send forty messages to Scout an hour. The limit is there because each check costs us something, and the service is free. If you need more, get in touch rather than working around it.", "Cada dispositivo puede hacer diez revisiones y enviar cuarenta mensajes por hora. El límite mantiene gratuito el servicio. No intentes eludirlo.")}</p>
      </section>

      <section>
        <h2 className="font-serif text-xl tracking-tight text-foreground">{t("What you agree to", "Lo que aceptas")}</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>{t("Don't try to break the limits, reach reports that aren't yours, or scrape the service.", "No eludas los límites, accedas a reportes ajenos ni extraigas datos del servicio.")}</li>
          <li>{t("Don't rely on a report as the only reason to buy or not buy a car.", "No uses un reporte como único motivo para comprar o descartar un auto.")}</li>
        </ul>
      </section>

      <section>
        <h2 className="font-serif text-xl tracking-tight text-foreground">{t("Reports can stop working", "Los enlaces pueden dejar de funcionar")}</h2>
        <p className="mt-3">{t("A report opens from its link for as long as we keep it. If you need a report to last, keep the link somewhere safe. There is no account to recover it from.", "El reporte estará disponible mientras lo conservemos. Guarda el enlace en un lugar seguro. No hay una cuenta desde la que recuperarlo.")}</p>
      </section>

      <p className="border-t border-border pt-6 text-xs">{t("These terms have not been reviewed by a lawyer. They describe how the service runs, and are not a contract written by one.", "Estas condiciones no han sido revisadas por un abogado. Describen el servicio, no son un contrato redactado por uno.")}</p>
    </LegalPage>
  );
}
