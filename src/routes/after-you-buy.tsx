import { createFileRoute, Link } from "@tanstack/react-router";

import { SitePage, useLanguage } from "@/components/site";
import titleIllustration from "@/assets/title-illustration.png";
import billOfSaleIllustration from "@/assets/bill-of-sale-illustration.png";

export const Route = createFileRoute("/after-you-buy")({
  head: () => ({
    meta: [
      { title: "After you buy | Used Car Scout" },
      { name: "description", content: "Your first week with a used car: title, insurance, registration, recalls and first maintenance." },
      { property: "og:title", content: "After you buy | Used Car Scout" },
      { property: "og:description", content: "A simple checklist for your first week as a car owner." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AfterYouBuy,
});

const STEPS = [
  { title: "Get the title and a bill of sale", body: "Make sure the seller signs the title over to you. Keep a written bill of sale with the price, date, VIN and both signatures." },
  { title: "Insure it before you drive away", body: "Most states require insurance before you drive. Call your insurer with the VIN, or buy a policy online, before you leave." },
  { title: "Register and pay sales tax", body: "Visit your state's DMV, usually within 10 to 30 days. Bring the title, bill of sale, ID and proof of insurance. Check your state's deadline." },
  { title: "Fix open recalls for free", body: "Call any dealer for the brand and give them the VIN. Recall repairs cost nothing, even on a used car." },
  { title: "Do a first service", body: "Get an oil change and have the tires, brakes and fluids checked. It gives you a fresh starting point." },
  { title: "Set up a simple car file", body: "Keep the title, receipts and service records in one folder. It helps with repairs and when you sell later." },
];

const SPANISH_STEPS = [
  { title: "Obtén el título y el contrato de compraventa", body: "Asegúrate de que el vendedor te transfiera el título con su firma. Guarda un contrato escrito con precio, fecha, VIN y ambas firmas." },
  { title: "Asegúralo antes de conducir", body: "La mayoría de los estados exige seguro antes de manejar. Llama a tu aseguradora con el VIN o compra una póliza antes de salir." },
  { title: "Regístralo y paga el impuesto de venta", body: "Visita el DMV de tu estado, normalmente en 10 a 30 días. Lleva el título, contrato, identificación y comprobante de seguro. Confirma el plazo de tu estado." },
  { title: "Repara los retiros pendientes gratis", body: "Llama a un concesionario de la marca y dale el VIN. Las reparaciones por retiros no cuestan nada, incluso en un auto usado." },
  { title: "Haz el primer mantenimiento", body: "Cambia el aceite y revisa neumáticos, frenos y líquidos. Así tendrás un punto de partida." },
  { title: "Organiza los documentos del auto", body: "Guarda el título, recibos y registros de servicio en una carpeta. Te servirá para reparar o vender el auto." },
];

function AfterYouBuy() {
  const { language } = useLanguage();
  const es = language === "es";
  return (
    <SitePage>
      {() => (
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="font-serif text-4xl tracking-tight">{es ? "Después de comprar" : "After you buy"}</h1>
          <p className="mt-3 text-muted-foreground">{es ? "Tu primera semana con tu auto, en seis pasos." : "Your first week as a car owner, in six steps."}</p>
          <ol className="mt-10 space-y-6">
            {(es ? SPANISH_STEPS : STEPS).map((step, i) => (
              <li key={step.title} className="flex gap-4 border-t border-border pt-6">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary font-mono text-sm text-primary">{i + 1}</span>
                <div className="min-w-0">
                  <h2 className="text-lg font-medium">{step.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                  {i === 0 && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <figure className="border border-border bg-card">
                        <img src={titleIllustration} alt={es ? "Ejemplo de un título de auto" : "Example of a car title"} width={816} height={816} loading="lazy" className="w-full" />
                        <figcaption className="px-3 py-2 text-xs text-muted-foreground">{es ? "Así se ve un título de auto" : "What a car title looks like"}</figcaption>
                      </figure>
                      <figure className="border border-border bg-card">
                        <img src={billOfSaleIllustration} alt={es ? "Ejemplo de un contrato de compraventa" : "Example of a bill of sale"} width={816} height={816} loading="lazy" className="w-full" />
                        <figcaption className="px-3 py-2 text-xs text-muted-foreground">{es ? "Así se ve un contrato de compraventa" : "What a bill of sale looks like"}</figcaption>
                      </figure>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-10 text-xs text-muted-foreground">{es ? "Las reglas cambian según el estado. Consulta el sitio del DMV de tu estado para confirmar plazos y tarifas." : "Rules differ by state. Check your state's DMV website for exact deadlines and fees."}</p>
          <Link to="/check" className="mt-8 inline-flex rounded-none bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
            {es ? "Revisa otro auto" : "Check another car"}
          </Link>
        </div>
      )}
    </SitePage>
  );
}
