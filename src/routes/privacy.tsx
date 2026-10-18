import { createFileRoute } from "@tanstack/react-router";

import { useLanguage } from "@/components/site";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy | Used Car Scout" },
      {
        name: "description",
        content:
          "What Used Car Scout stores: no accounts, no personal details, and report links you keep yourself.",
      },
      { property: "og:title", content: "Privacy | Used Car Scout" },
      {
        property: "og:description",
        content:
          "No accounts, no personal details, and report links you keep yourself. Here is exactly what is stored.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { language } = useLanguage();
  const t = (en: string, es: string) => language === "es" ? es : en;
  return (
    <LegalPage eyebrow={t("Legal", "Información legal")} title={t("Privacy", "Privacidad")}>
      <p>{t("Used Car Scout does not ask for an account. There is no name, no email address and no payment detail on a check, and nothing about you is needed to produce a report.", "Used Car Scout no pide una cuenta. No necesitas dar tu nombre, correo ni datos de pago para obtener un reporte.")}</p>

      <section>
        <h2 className="font-serif text-xl tracking-tight text-foreground">{t("What a report holds", "Qué contiene un reporte")}</h2>
        <p className="mt-3">{t("A report stores the car you entered (year, make, model, mileage and asking price), the figures taken from public records, the arithmetic we show beside them, and the wording we wrote. It also holds selected seller claims about condition and title status, listing warnings and questions. It does not store the full listing, any screenshot, the VIN, seller contact details, or where you found the car. Anyone with the link can see those selected claims and the report, so share it only with people you trust.", "El reporte guarda año, marca, modelo, millas, precio, datos públicos, cálculos y explicaciones. También incluye algunas afirmaciones del vendedor sobre condición y título, alertas y preguntas. No guarda el anuncio completo, capturas, VIN, datos de contacto ni dónde encontraste el auto. Cualquiera con el enlace puede verlo. Compártelo solo con personas de confianza.")}</p>
        <p className="mt-3">{t("Each report sits behind a long random link that only you have. Nothing is tied to a name, so that link is the only way back in, so treat it like a password. There is no list of reports and no search over them.", "Cada reporte tiene un enlace aleatorio largo. Es la única forma de volver a verlo. Trátalo como una contraseña. No hay lista ni búsqueda de reportes.")}</p>
      </section>

      <section>
        <h2 className="font-serif text-xl tracking-tight text-foreground">{t("How long reports are kept", "Cuánto tiempo se guardan los reportes")}</h2>
        <p className="mt-3">{t("Right now, saved reports have no end date, so your link keeps working. If we ever set a time limit, we will say so here first. Answers from Viewing mode and your chat with Scout stay on your device and are never saved with the report.", "Por ahora los reportes no tienen fecha de vencimiento. Si cambia, lo indicaremos aquí. Las respuestas del modo de visita y el chat se quedan en tu dispositivo, fuera del reporte.")}</p>
        <p className="mt-3">{t("When you open a link to another website from a report, your report link is not passed along to that site.", "Al abrir otro sitio desde un reporte, no se envía tu enlace del reporte a ese sitio.")}</p>
      </section>



      <section>
        <h2 className="font-serif text-xl tracking-tight text-foreground">{t("Usage counting", "Conteo de uso")}</h2>
        <p className="mt-3">{t("To keep the service free, a check limit and a Scout-message limit are counted per device per hour. That count is a number attached to a signed marker on your device. It is not a profile, and it is not joined to anything you have searched for.", "Para mantener el servicio gratuito, contamos revisiones y mensajes por dispositivo y hora. El número se asocia a un marcador firmado en tu dispositivo, no a un perfil ni a tus búsquedas.")}</p>
      </section>

      <section>
        <h2 className="font-serif text-xl tracking-tight text-foreground">{t("Who else sees your car", "Quién más recibe datos del auto")}</h2>
        <p className="mt-3">{t("Car details are looked up against public government records at the National Highway Traffic Safety Administration and the fuel-economy site, so those requests leave this app. Those services are not run by us and have their own terms.", "Consultamos datos del auto en los registros públicos de NHTSA y el sitio de consumo de combustible. Esas solicitudes salen de esta app. Los servicios son independientes y tienen sus propias condiciones.")}</p>
      </section>

      <p className="border-t border-border pt-6 text-xs">{t("This page describes how the app behaves today. It has not been reviewed by a lawyer, so read it as a plain-English statement rather than a legal agreement.", "Esta página describe el funcionamiento actual. No ha sido revisada por un abogado. Es una explicación sencilla, no un acuerdo legal.")}</p>
    </LegalPage>
  );
}
