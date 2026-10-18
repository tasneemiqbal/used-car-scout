import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SitePage, useLanguage } from "@/components/site";
import { ScoutAvatar } from "@/components/scout-avatar";
import { Button } from "@/components/ui/button";
import { DEMO_LISTINGS, demoListingText } from "@/lib/scout.demo";
import { compressScreenshot, PREFILL_IMAGE_KEY, PREFILL_TEXT_KEY } from "@/lib/screenshot";
import altimaAsset from "@/assets/demo/altima.jpg.asset.json";
import bmwAsset from "@/assets/demo/bmw.jpg.asset.json";

const SCREENSHOT_EXAMPLES = [
  { id: "altima", car: "2014 Nissan Altima 2.5 SV", image: altimaAsset.url },
  { id: "bmw", car: "2011 BMW 328i", image: bmwAsset.url },
];

export const Route = createFileRoute("/demo")({
  head: () => ({ meta: [
    { title: "Try the demo | Used Car Scout" },
    { name: "description", content: "Try Used Car Scout without an account using real listing screenshots or fictional scenarios and the real car checker." },
    { property: "og:title", content: "Try the demo | Used Car Scout" },
    { property: "og:description", content: "Choose a real listing screenshot or fictional scenario, get a car report and ask Scout. No account or payment needed." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: DemoPage,
});

function DemoPage() {
  const { language } = useLanguage();
  const es = language === "es";
  const navigate = useNavigate();
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  async function startScreenshot(example: typeof SCREENSHOT_EXAMPLES[number]) {
    if (loading) return;
    setError(false);
    setLoading(example.id);
    try {
      const response = await fetch(example.image);
      if (!response.ok) throw new Error("Screenshot unavailable");
      const image = await compressScreenshot(new File([await response.blob()], `${example.id}.jpg`, { type: "image/jpeg" }));
      sessionStorage.removeItem(PREFILL_TEXT_KEY);
      sessionStorage.setItem(PREFILL_IMAGE_KEY, image);
      await navigate({ to: "/check" });
    } catch {
      setError(true);
    } finally {
      setLoading(null);
    }
  }
  function start(id: string) {
    const text = demoListingText(id, language);
    if (!text) return;
    try {
      sessionStorage.removeItem(PREFILL_IMAGE_KEY);
      sessionStorage.setItem(PREFILL_TEXT_KEY, text);
      void navigate({ to: "/check" });
    } catch {
      setError(true);
    }
  }
  return <SitePage>{() => <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
    <ScoutAvatar className="size-12" />
    <h1 className="mt-5 text-4xl font-semibold">{es ? "Prueba Used Car Scout" : "Try Used Car Scout"}</h1>
    <p className="mt-4 max-w-2xl text-muted-foreground">{es ? "Prueba una captura real o un anuncio ficticio. Sin cuenta ni pagos. Scout genera un reporte nuevo con su revisión real." : "Try a real screenshot or a fictional listing. No account or payment. Scout generates a fresh report through the real checker."}</p>
    <Button asChild variant="outline" className="mt-5 rounded-none"><Link to="/check">{es ? "Revisa un anuncio real" : "Check a real listing"}<ArrowRight className="size-4" /></Link></Button>
    <p className="mt-3 text-sm text-muted-foreground">{es ? "Pega el texto o sube una captura sin los datos de contacto del vendedor. No necesitas conectar Facebook ni otra cuenta." : "Paste the text or upload a screenshot with seller contact details removed. No Facebook or other account connection needed."}</p>
    <h2 className="mt-10 text-2xl font-semibold">{es ? "Capturas de anuncios reales" : "Real listing screenshots"}</h2>
    <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{es ? "Datos privados eliminados. Las afirmaciones son del vendedor y no están verificadas. Estos anuncios guardados pueden ya no estar disponibles. Las capturas originales están en inglés; Scout responde en el idioma seleccionado." : "Private details removed. Seller claims are unverified, and these saved listings may no longer be available."}</p>
    <div className="mt-5 grid gap-5 md:grid-cols-2">
      {SCREENSHOT_EXAMPLES.map((example) => <article key={example.id} className="flex flex-col border border-border bg-card p-5">
        <img src={example.image} alt={es ? `Captura del anuncio de ${example.car}, con datos privados eliminados` : `${example.car} listing screenshot with private details removed`} className="aspect-[880/488] w-full object-contain" />
        <h3 className="mt-4 text-xl font-semibold">{example.car}</h3>
        <Button onClick={() => void startScreenshot(example)} disabled={loading !== null} className="mt-5 w-full whitespace-normal rounded-none">{loading === example.id ? (es ? "Cargando captura…" : "Loading screenshot…") : (es ? "Revisa esta captura" : "Check this screenshot")}<ArrowRight className="size-4 shrink-0" /></Button>
      </article>)}
    </div>
    <h2 className="mt-10 text-2xl font-semibold">{es ? "Escenarios ficticios" : "Fictional scenarios"}</h2>
    <div className="mt-5 grid gap-5 md:grid-cols-3">
      {DEMO_LISTINGS.map((listing) => <article key={listing.id} className="flex flex-col border border-border bg-card p-6">
        <p className="text-xs font-medium uppercase text-muted-foreground">{es ? "Ejemplo ficticio" : "Fictional example"}</p>
        <h2 className="mt-3 text-xl font-semibold">{listing.title[language]}</h2>
        <p className="mt-4 font-medium">{listing.car}</p>
        <p className="mt-2 text-sm text-muted-foreground">{listing.detail[language]}</p>
        <p className="mt-5 flex-1 text-sm leading-relaxed">{listing.text[language]}</p>
        <Button onClick={() => start(listing.id)} className="mt-6 w-full whitespace-normal rounded-none">{es ? "Revisa este ejemplo" : "Check this example"}<ArrowRight className="size-4 shrink-0" /></Button>
      </article>)}
    </div>
    {error && <p role="alert" className="mt-5 text-risk">{es ? "No se pudo cargar el ejemplo. Inténtalo de nuevo o copia el texto de un escenario ficticio." : "The example could not be loaded. Try again or copy the text of a fictional scenario."}</p>}
    <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">{es ? "Los datos oficiales corresponden al modelo y año, no al historial de este auto. Los costos son estimaciones. La disponibilidad de las fuentes puede variar. Se aplican los límites habituales: 10 revisiones y 40 mensajes de Scout por hora." : "Official records cover the model and year, not this car’s history. Costs are estimates. Source availability can vary. The usual limits apply: 10 car checks and 40 Scout messages per hour."}</p>
    <Button asChild variant="link" className="mt-4 px-0"><Link to="/sample-report">{es ? "Ver un reporte ilustrativo sin esperar" : "View an illustrative report without waiting"}<ArrowRight className="size-4" /></Link></Button>
  </section>}</SitePage>;
}