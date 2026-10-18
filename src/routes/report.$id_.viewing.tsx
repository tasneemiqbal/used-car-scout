import type { StoredReport as LocalizedStoredReport } from "@/lib/scout.report";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { ReportHeader } from "@/components/report-header";
import { ScoutAvatar } from "@/components/scout-avatar";
import { reportQueryOptions } from "@/lib/report-query";
import { buildViewingSteps, summarizeViewing, type Decision } from "@/lib/scout.viewing";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/report/$id_/viewing")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(reportQueryOptions(params.id));
    if (!data) throw notFound();
    return data;
  },
  head: () => ({
    meta: [
      { title: "Viewing mode | Used Car Scout" },
      { name: "description", content: "A step-by-step checklist for seeing a used car in person." },
      { property: "og:title", content: "Viewing mode | Used Car Scout" },
      { property: "og:description", content: "Check the car step by step, then get the questions to ask." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ViewingMode,
});

const CHOICES: Array<{ value: Decision; label: string; tone: string }> = [
  { value: "fine", label: "Looks fine", tone: "border-good text-good" },
  { value: "unsure", label: "Not sure", tone: "border-caution text-caution" },
  { value: "problem", label: "Problem", tone: "border-risk text-risk" },
  { value: "skip", label: "Skip for now", tone: "border-border text-muted-foreground" },
];

const VERDICT = {
  "keep-going": { title: "Nothing big stood out", body: "These checks are not a guarantee. Review the title, recall status and seller's records before deciding. It's okay to take more time." },
  "slow-down": { title: "Slow down and ask first", body: "Get clear answers to the questions below before you make an offer." },
  "walk-away": { title: "Think about walking away", body: "These are serious. It's okay to say no and keep looking." },
} as const;

function ViewingMode() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(reportQueryOptions(id));
  if (!data) throw notFound();
  return <ViewingModeContent id={id} report={data.report} />;
}

function ViewingModeContent({ id, report }: { id: string; report: LocalizedStoredReport }) {
  const data = { report };
  const { car, wording, evidence } = data.report;
  const language = data.report.language ?? "en";
  const es = language === "es";
  const steps = useMemo(
    () => buildViewingSteps({ concerns: wording.concerns, recallCount: evidence.recalls.status === "available" ? evidence.recalls.count ?? 0 : null, language }),
    [wording.concerns, evidence.recalls, language],
  );
  const key = `scout-viewing-${id}`;
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [index, setIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) setDecisions(JSON.parse(saved));
    } catch {}
  }, [key]);

  const choose = (value: Decision) => {
    const current = steps[index];
    if (!current) return;
    const next = { ...decisions, [current.id]: value };
    setDecisions(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
    setIndex((i) => i + 1);
  };

  const done = index >= steps.length;
  const summary = summarizeViewing(steps, decisions);
  const step = steps[index];

  const copy = () => {
    const text = summary.questions.map((q, i) => `${i + 1}. ${q}`).join("\n");
    const fallback = () => {
      const t = document.createElement("textarea");
      t.value = text; document.body.appendChild(t); t.select(); document.execCommand("copy"); t.remove();
    };
    (navigator.clipboard?.writeText(text) ?? Promise.reject()).catch(fallback);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ReportHeader />
      <main className="mx-auto max-w-xl px-5 pb-20">
        <span className="inline-block bg-primary px-2.5 py-1 font-mono text-xs uppercase tracking-[0.15em] text-primary-foreground">
          {es ? "Modo de visita" : "Viewing mode"}
        </span>
        <h1 className="mt-3 font-serif text-3xl tracking-tight">
          {car.year} {car.make} {car.model}
        </h1>

        <div className="mt-5 flex gap-1" aria-hidden>
          {steps.map((s, i) => (
            <span key={s.id} className={`h-1.5 flex-1 ${i < index ? "bg-primary" : "bg-secondary"}`} />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {done ? es ? "Revisión terminada" : "All steps done" : es ? `Paso ${index + 1} de ${steps.length}` : `Step ${index + 1} of ${steps.length}`}
        </p>

        {!done && step ? (
          <section className="mt-5 border border-border bg-card p-5">
            <h2 className="text-xl font-semibold leading-snug">{step.title}</h2>
            <p className="mt-3 text-sm leading-relaxed">{step.look}</p>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{es ? "Por qué importa" : "Why it matters"}: {step.why}</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {CHOICES.map((c) => (
                <Button variant="outline"
                  key={c.value}
                  type="button"
                  onClick={() => choose(c.value)}
                  className={`rounded-none border-2 bg-background px-2 py-3 text-sm font-medium transition-colors hover:bg-secondary ${decisions[step.id] === c.value ? c.tone : "border-border"}`}
                >
                  {es ? ({ fine: "Se ve bien", unsure: "No estoy segura", problem: "Un problema", skip: "Omitir por ahora" }[c.value]) : c.label}
                </Button>
              ))}
            </div>
            {index > 0 ? (
              <button type="button" onClick={() => setIndex(index - 1)} className="mt-4 text-sm text-muted-foreground hover:text-foreground">
                ‹ {es ? "Atrás" : "Back"}
              </button>
            ) : null}
          </section>
        ) : (
          <section className="mt-5 border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <ScoutAvatar />
              <span className="text-sm text-muted-foreground">{es ? "Resumen de Scout" : "Scout's summary"}</span>
            </div>
            <h2 className="mt-3 text-xl font-semibold">{es ? ({ "keep-going": "No notaste problemas importantes", "slow-down": "Tómate tiempo y pregunta primero", "walk-away": "Considera retirarte" }[summary.verdict]) : VERDICT[summary.verdict].title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{es ? ({ "keep-going": "Estas comprobaciones no garantizan el estado del auto. Revisa el título y los registros antes de decidir.", "slow-down": "Aclara las preguntas siguientes antes de hacer una oferta. Algunas revisiones no están confirmadas.", "walk-away": "Estos problemas son serios. Puedes decir que no y seguir buscando." }[summary.verdict]) : VERDICT[summary.verdict].body}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-center">
              <div><p className="font-serif text-2xl text-good">{summary.answered - summary.problems.length - summary.unsure.length}</p><p className="text-xs text-muted-foreground">{es ? "Bien" : "Fine"}</p></div>
              <div><p className="font-serif text-2xl text-caution">{summary.unsure.length}</p><p className="text-xs text-muted-foreground">{es ? "Sin confirmar" : "Not sure"}</p></div>
              <div><p className="font-serif text-2xl text-risk">{summary.problems.length}</p><p className="text-xs text-muted-foreground">{es ? "Problemas" : "Problems"}</p></div>
            </div>
            {summary.questions.length > 0 ? (
              <>
                <p className="mt-5 text-sm font-medium">{es ? "Preguntas para el vendedor" : "Ask the seller"}</p>
                <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm">
                  {summary.questions.map((q) => <li key={q}>{q}</li>)}
                </ol>
                <button type="button" onClick={copy} className="mt-4 w-full rounded-none bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90">
                  {copied ? es ? "Preguntas copiadas" : "Questions copied" : es ? "Copiar preguntas" : "Copy these questions"}
                </button>
              </>
            ) : null}
            <button
              type="button"
              onClick={() => { setDecisions({}); setIndex(0); try { localStorage.removeItem(key); } catch {} }}
              className="mt-3 w-full rounded-none border border-border px-5 py-3 text-sm hover:bg-secondary"
            >
              {es ? "Empezar de nuevo" : "Start over"}
            </button>
          </section>
        )}

        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          {es ? "Tus respuestas se quedan en este dispositivo. No se añaden al reporte ni al enlace compartido." : "Your answers stay on this phone. They are not added to the report or the share link."}
        </p>
        <div className="mt-4 text-center">
          <Link to="/report/$id" params={{ id }} className="text-sm font-medium text-primary hover:underline">‹ {es ? "Volver al reporte" : "Back to car report"}</Link>
        </div>
      </main>
    </div>
  );
}
