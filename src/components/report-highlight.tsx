import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ReportChat } from "@/components/report-chat";
import { GlossaryText } from "@/components/scout-glossary";

export function ReportHighlight({ reportId, label, explanation, tone, language }: { reportId: string; label: string; explanation: string; tone: "risk" | "caution" | "muted"; language: "en" | "es" }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const es = language === "es";
  const questions = es ? [`¿Cómo reviso esto: ${label}?`, `¿Qué le pregunto al vendedor sobre ${label}?`] : [`How do I check this: ${label}?`, `What should I ask the seller about ${label}?`];
  return <li>
    <Button variant="ghost" aria-expanded={open} onClick={() => setOpen(!open)} className="h-auto w-full justify-start whitespace-normal rounded-none px-4 py-4 text-left">
      <span className={`size-2 shrink-0 rounded-full ${tone === "risk" ? "bg-risk" : tone === "caution" ? "bg-caution" : "bg-muted-foreground"}`} /><span className="flex-1">{label}</span><span aria-hidden>{open ? "−" : "+"}</span>
    </Button>
    {open && <div className="border-t border-border px-4 py-4"><p className="text-sm leading-relaxed text-muted-foreground"><GlossaryText text={explanation} language={language} /></p><div className="mt-3 flex flex-wrap gap-2">{questions.map((q) => <Button key={q} variant="link" className="h-auto whitespace-normal p-0 text-left text-xs" onClick={() => setQuestion(q)}>{q}</Button>)}</div>{question && <div className="mt-4"><ReportChat key={question} reportId={reportId} openingQuestion={question} /></div>}</div>}
  </li>;
}