import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useState, useRef } from "react";
import { ScoutAvatar } from "@/components/scout-avatar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/site";
import { CHAT_MESSAGE_CHARACTER_LIMIT, type ScoutReply } from "@/lib/scout.chat";
import { Copy, Send, Square, Trash2, X } from "lucide-react";
import { GlossaryText } from "@/components/scout-glossary";

type Practice = { scenario: "price" | "pressure" | "leave"; style: "friendly" | "pushy"; end: boolean };
const keyFor = (id: string, practice: boolean, language: string, settings?: Practice) => `scout.${practice ? "practice" : "chat"}.${id}.${language}.${settings ? settings.scenario + settings.style : ""}`;
function messageText(message: UIMessage) { return message.parts.filter((p) => p.type === "text").map((p) => p.type === "text" ? p.text : "").join("\n"); }
function replyData(message?: UIMessage): Omit<ScoutReply, "answer"> | null {
  const part = message?.parts.find((p) => p.type === "data-scout");
  return part && "data" in part ? part.data as Omit<ScoutReply, "answer"> : null;
}

export function ReportChat({ reportId, onClose, practice = false, openingQuestion, autoFocus = false, fill = false }: { reportId: string; onClose?: () => void; practice?: boolean; openingQuestion?: string; autoFocus?: boolean; fill?: boolean }) {
  const { language } = useLanguage();
  const es = language === "es";
  const [scenario, setScenario] = useState<Practice["scenario"]>("price");
  const [style, setStyle] = useState<Practice["style"]>("friendly");
  const [settingsReady, setSettingsReady] = useState(!practice);
  useEffect(() => {
    if (!practice) return;
    try {
      const value = JSON.parse(localStorage.getItem(`scout.practice.settings.${reportId}`) ?? "null");
      if (value && ["price", "pressure", "leave"].includes(value.scenario) && ["friendly", "pushy"].includes(value.style)) { setScenario(value.scenario); setStyle(value.style); }
    } catch {}
    setSettingsReady(true);
  }, [reportId, practice]);
  useEffect(() => { if (practice && settingsReady) localStorage.setItem(`scout.practice.settings.${reportId}`, JSON.stringify({ scenario, style })); }, [practice, settingsReady, reportId, scenario, style]);
  const settings = practice ? { scenario, style, end: false } : undefined;
  const storageKey = keyFor(reportId, practice, language, settings);
  const [saved, setSaved] = useState<{ key: string; messages: UIMessage[] } | null>(null);
  useEffect(() => { if (!settingsReady) return; try { const data = JSON.parse(localStorage.getItem(storageKey) ?? "[]"); setSaved({ key: storageKey, messages: Array.isArray(data) ? data : [] }); } catch { setSaved({ key: storageKey, messages: [] }); } }, [storageKey, settingsReady]);
  return <section className={fill ? "flex min-h-0 flex-1 flex-col" : undefined}>
    {practice && <div className="mb-5 grid gap-3 sm:grid-cols-2">
      <label className="text-sm">{es ? "Situación" : "Scenario"}<select aria-label="Scenario" value={scenario} onChange={(e) => setScenario(e.target.value as Practice["scenario"])} className="mt-2 w-full border border-input bg-card p-3"><option value="price">{es ? "No baja el precio" : "The seller won't drop the price"}</option><option value="pressure">{es ? "Me está apurando" : "The seller is rushing me"}</option><option value="leave">{es ? "Quiero retirarme con respeto" : "I want to walk away politely"}</option></select></label>
      <fieldset><legend className="text-sm">{es ? "Estilo del vendedor" : "Seller style"}</legend><div className="mt-2 grid grid-cols-2">{(["friendly", "pushy"] as const).map((value) => <Button key={value} variant={style === value ? "default" : "outline"} aria-pressed={style === value} onClick={() => setStyle(value)} className="h-12 rounded-none">{value === "friendly" ? es ? "Amable" : "Friendly" : es ? "Insistente" : "Pushy"}</Button>)}</div></fieldset>
    </div>}
    {saved?.key === storageKey && settingsReady && <ChatWindow key={storageKey} reportId={reportId} initial={saved.messages} storageKey={storageKey} language={language} practice={settings} onClose={onClose} openingQuestion={openingQuestion} autoFocus={autoFocus} fill={fill} />}
  </section>;
}
function ChatWindow({ reportId, initial, storageKey, language, practice, onClose, openingQuestion, autoFocus, fill = false }: { reportId: string; initial: UIMessage[]; storageKey: string; language: "en" | "es"; practice?: Practice | undefined; onClose?: (() => void) | undefined; openingQuestion?: string | undefined; autoFocus: boolean; fill?: boolean }) {
  const es = language === "es";
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (autoFocus) inputRef.current?.focus(); }, [autoFocus]);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/scout-chat", body: { reportId, language, practice }, fetch: async (input, init) => { const response = await fetch(input, init); if (!response.ok) { const data = await response.json().catch(() => null) as { error?: string } | null; throw new Error(data?.error ?? "Scout could not answer right now."); } return response; } }), [reportId, language, practice?.scenario, practice?.style, practice?.end]);
  const { messages, sendMessage, status, stop, setMessages } = useChat({ id: storageKey, messages: initial, transport, onError: (e) => setError(e.message) });
  const busy = status === "submitted" || status === "streaming";
  const last = [...messages].reverse().find((m) => m.role === "assistant");
  const data = replyData(last);
  useEffect(() => { const box = scrollRef.current; if (box) box.scrollTop = box.scrollHeight; }, [messages, status]);
  useEffect(() => { if (!busy) { try { localStorage.setItem(storageKey, JSON.stringify(messages)); } catch {} } }, [busy, messages, storageKey]);
  useEffect(() => { if (openingQuestion && messages.length === 0) void sendMessage({ text: openingQuestion }); }, []);
  const send = (value: string, end = false) => { if (busy || !value.trim()) return; setText(""); setError(""); void sendMessage({ text: value.trim().slice(0, CHAT_MESSAGE_CHARACTER_LIMIT) }, end ? { body: { reportId, language, practice: practice ? { ...practice, end: true } : undefined } } : undefined); };
  async function copy(value: string, id: string) { try { await navigator.clipboard.writeText(value); setCopied(id); } catch { setError(es ? "No se pudo copiar." : "Could not copy. Select the text instead."); } }
  const starters = es ? ["¿Qué reviso primero?", "¿Qué significan estos retiros?", "Escribe un mensaje para negociar"] : ["What should I check first?", "Should the recalls worry me?", "Write a message asking for a lower price"];
  return <div className={`flex flex-col ${fill ? "min-h-0 flex-1" : ""}`} aria-label={practice ? "Practice chat" : "Scout chat"}>
    <div className="flex shrink-0 items-center justify-between gap-2"><div className="flex items-center gap-3"><ScoutAvatar className="size-9" /><div><h2 className="text-xl">{practice ? es ? "Practica con el vendedor" : "Practice with the seller" : es ? "Pregunta a Scout" : "Ask Scout about this car"}</h2><p className="text-xs text-muted-foreground">{es ? "Tu reporte y cualquier VIN que pegues." : "Your report, plus any VIN you paste."}</p></div></div><div className="flex"><Button variant="ghost" size="icon" title={es ? "Borrar conversación" : "Clear conversation"} aria-label="Clear conversation" disabled={busy} onClick={() => setMessages([])}><Trash2 /></Button>{onClose && <Button variant="ghost" size="icon" title={es ? "Cerrar" : "Close"} aria-label="Close chat" onClick={onClose}><X /></Button>}</div></div>
    {practice && <p className="mt-3 bg-accent-warm-tint p-3 text-xs">{es ? "Modo práctica. Scout representa al vendedor." : "Practice mode. Scout is playing the seller."}</p>}
    <div className={`mt-4 border border-border bg-card ${fill ? "flex min-h-0 flex-1 flex-col" : ""}`}>
      <div ref={scrollRef} className={`${fill ? "min-h-0 flex-1" : "h-[360px]"} overflow-y-auto overscroll-contain p-4`} aria-live="polite">
        {messages.map((message) => { const meta = replyData(message); const answer = messageText(message); return <div key={message.id} className={`mb-4 flex gap-2 ${message.role === "user" ? "justify-end" : "items-start"}`}>
          {message.role === "assistant" && <ScoutAvatar className="mt-1 size-7 shrink-0" />}
          <div className={`min-w-0 max-w-[88%] px-3 py-2 text-sm leading-relaxed ${message.role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-background"}`}>
            <p className="whitespace-pre-wrap break-words"><GlossaryText text={answer} language={language} /></p>
            {meta?.sellerMessage && <div className="mt-3 border-t border-border pt-3"><p className="whitespace-pre-wrap">{meta.sellerMessage}</p><Button variant="link" className="mt-2 h-auto p-0" onClick={() => void copy(meta.sellerMessage ?? "", message.id)}><Copy />{copied === message.id ? es ? "Copiado" : "Copied" : es ? "Copiar mensaje" : "Copy message"}</Button></div>}
            {meta?.feedback && <dl className="mt-3 space-y-3 border-t border-border pt-3">{[[es ? "Lo que hiciste bien" : "What you did well", meta.feedback.didWell], [es ? "Una cosa para probar" : "One thing to try", meta.feedback.tryNext], [es ? "Una frase más firme" : "A stronger phrase", meta.feedback.strongerPhrase]].map(([label, value]) => <div key={label}><dt className="font-medium">{label}</dt><dd className="mt-1 text-muted-foreground">{value}</dd></div>)}</dl>}
          </div></div>; })}
        {busy && <p role="status" className="text-sm text-muted-foreground">{es ? "Scout está pensando…" : "Scout is thinking…"}</p>}
        {!messages.length && <div className="flex items-start gap-3"><ScoutAvatar /><p className="text-sm text-muted-foreground">{practice ? es ? "Elige tu situación y comienza." : "Choose your scenario and start the conversation." : es ? "¿Qué quieres saber sobre este auto?" : "What would you like to know about this car?"}</p></div>}
      </div>
      {!busy && <div className="flex shrink-0 flex-wrap gap-2 border-t border-border p-3">{(practice ? messages.length === 0 ? [es ? "Comencemos la práctica." : "Let's start practicing."] : data?.feedback ? [] : [es ? "Terminar práctica" : "End practice"] : data?.followUps ?? starters).map((question) => <Button variant="outline" key={question} className="h-auto whitespace-normal rounded-none px-3 py-2 text-left text-xs" onClick={() => send(question, Boolean(practice && messages.length))}>{question}</Button>)}</div>}
      {error && <p role="alert" className="p-3 text-sm text-caution">{error}</p>}
      <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="flex shrink-0 items-end gap-2 border-t border-border p-3"><textarea ref={inputRef} aria-label="Message Scout" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(text); } }} maxLength={CHAT_MESSAGE_CHARACTER_LIMIT} placeholder={es ? "Pregunta o pega un VIN…" : "Ask a question or paste a VIN…"} rows={2} className="min-w-0 flex-1 resize-none border border-input bg-background p-2 text-sm" /><Button type={busy ? "button" : "submit"} size="icon" className="rounded-none" disabled={!busy && !text.trim()} onClick={busy ? stop : undefined} aria-label={busy ? "Stop response" : "Send message"}>{busy ? <Square /> : <Send />}</Button></form>
    </div>
    <p className="mt-2 shrink-0 text-xs text-muted-foreground">{es ? "Guardado solo en este navegador. Cada pregunta usa un mensaje de tu límite por hora." : "Saved only in this browser. Each question uses one hourly Scout message."}</p>
  </div>;
}
