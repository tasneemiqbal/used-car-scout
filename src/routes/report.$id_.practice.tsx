import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { useLanguage } from "@/components/site";
import { ReportChat } from "@/components/report-chat";
import { ReportHeader } from "@/components/report-header";
import { reportQueryOptions } from "@/lib/report-query";

export const Route = createFileRoute("/report/$id_/practice")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(reportQueryOptions(params.id));
    if (!data) throw notFound();
    return data;
  },
  head: () => ({
    meta: [
      { title: "Practice with the seller | Used Car Scout" },
      { name: "description", content: "Scout plays the seller so you can practice asking questions and making an offer." },
      { property: "og:title", content: "Practice with the seller | Used Car Scout" },
      { property: "og:description", content: "Rehearse the conversation with Scout before you meet the seller." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PracticePage,
});

function PracticePage() {
  const { id } = Route.useParams();
  const { language } = useLanguage();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ReportHeader />
      <main className="mx-auto max-w-2xl px-5 pb-16">
        <Link to="/report/$id" params={{ id }} className="text-sm text-primary hover:underline">
          {language === "es" ? "‹ Volver al reporte" : "‹ Back to report"}
        </Link>
        <p className="mt-4 text-sm text-muted-foreground">
          {language === "es" ? "Elige una situación y el estilo del vendedor. Termina la práctica para recibir consejos sobre tu conversación." : "Choose a scenario and seller style. End practice for feedback on your conversation."}
        </p>
        <div className="mt-6">
          <ReportChat reportId={id} practice />
        </div>
      </main>
    </div>
  );
}
