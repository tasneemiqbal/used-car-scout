import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { ReceiptCard } from "@/components/receipt-card";
import { SiteFooter } from "@/components/site-footer";
import { SCOUT_LOGO_URL } from "@/lib/brand";
import { ScoutAvatar } from "@/components/scout-avatar";
import { CameraIcon } from "@/components/camera-icon";
import { Button } from "@/components/ui/button";
import { Car, ClipboardCheck, MessagesSquare, ShieldCheck } from "lucide-react";
import { compressScreenshot, PREFILL_IMAGE_KEY, PREFILL_TEXT_KEY } from "@/lib/screenshot";
import {
  homeCopy,
  type HomeCopy,
  type Language,
} from "@/lib/home.copy";

const LANGUAGE_KEY = "scout.language";

export function useLanguage() {
  // The site is English-only; the language option was removed.
  const language = "en" as Language;
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  return { language, copy: homeCopy[language] };
}

/** Shared shell for every marketing page: nav, language, footer. */
export function SitePage({ children }: { children: (copy: HomeCopy) => React.ReactNode }) {
  const { copy } = useLanguage();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav copy={copy} />
      <main>{children(copy)}</main>
      <SiteFooter />
    </div>
  );
}

export function HomeSections({ copy }: { copy: HomeCopy }) {
  return (
    <>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pt-10 pb-16 md:grid-cols-[1.15fr_1fr] md:pt-16">
          <div className="order-1">
            <Button
              asChild
              variant="ghost"
              className="mb-6 rounded-none border border-accent-warm/45 bg-accent-warm-tint px-5 text-sm font-medium text-foreground hover:border-accent-warm hover:bg-accent-warm-tint/70"
            >
              <Link to="/demo">
                <Car className="relative -top-px text-accent-warm" aria-hidden />
                {copy.hero.demo}
              </Link>
            </Button>
            <h1 className="font-serif text-5xl leading-[1.03] tracking-tight text-balance md:text-6xl">
              {copy.hero.alone}
              <span className="mt-2 block italic text-primary">{copy.hero.dont}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {copy.hero.sub}
            </p>
            <HeroPasteBox copy={copy} />
          </div>

          <div className="order-2 md:rotate-[1.5deg]">
            <ReceiptCard
              animate
              title={copy.hero.receiptTitle}
              meta={copy.hero.receiptMeta}
              lines={[
                { label: "ASKING", value: "$4,200" },
                { label: "FUEL", value: "UNAVAILABLE", muted: true },
                { label: "UPKEEP", value: "$1,500" },
                { label: "REPAIRS", value: "$2,500" },
              ]}
              total="$8,700"
              gapNote={`+$4,500 ${copy.hero.gap}`}
              totalNote="OVER 3 YEARS · ESTIMATE"
              verdictLines={[{ label: "FAIR OFFER", value: "$3,150" }]}
              riskTag={copy.hero.riskTag}
              riskReason={copy.hero.riskReason}
            />
            <p className="mt-2 text-right font-serif text-base italic text-accent-warm">
              &uarr; {copy.hero.partNobody}
            </p>
          </div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto max-w-6xl px-6 py-7">
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 font-mono text-xs tracking-[0.16em] text-primary uppercase">
              <li>{copy.trust.data}</li>
              <li aria-hidden className="h-1 w-1 rounded-full bg-accent-warm" />
              <li>{copy.trust.noSignup}</li>
              <li aria-hidden className="h-1 w-1 rounded-full bg-accent-warm" />
              <li>{copy.trust.free}</li>
            </ul>

          </div>
        </section>

        <StepsSection copy={copy} />
        <FeaturesSection copy={copy} />

        <MeetScoutSection copy={copy} />

        <AboutSection copy={copy} />

        <FaqSection copy={copy} />

    </>
  );
}

function FeaturesSection({ copy }: { copy: HomeCopy }) {
  const f = copy.features;
  return <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
    <h2 className="font-serif text-4xl leading-tight">{f.heading}</h2>
    <div className="mt-8 grid gap-6 md:grid-cols-2">
      <div className="border border-border bg-card p-6">
        <ClipboardCheck className="size-6 text-primary" />
        <h3 className="mt-4 text-2xl font-medium">{f.viewing}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.viewingBody}</p>
        <div className="mt-6 border-t border-border pt-5">
          <div className="flex items-center gap-2"><ScoutAvatar className="size-7" /><span className="text-xs text-muted-foreground">3 / 8</span></div>
          <p className="mt-3 text-lg font-medium">{f.preview[0]}</p><p className="mt-2 text-sm text-muted-foreground">{f.preview[1]}</p>
          <div className="mt-4 grid grid-cols-3 gap-2">{f.preview.slice(2).map((label) => <span key={label} className="border border-border px-2 py-3 text-center text-xs">{label}</span>)}</div>
        </div>
      </div>
      <div className="grid gap-6">
        <div className="border border-border bg-secondary p-6"><MessagesSquare className="size-6 text-primary" /><h3 className="mt-4 text-2xl font-medium">{f.practice}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.practiceBody}</p></div>
        <div className="border border-border bg-card p-6"><ShieldCheck className="size-6 text-primary" /><h3 className="mt-4 text-2xl font-medium">{f.safety}</h3><p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.safetyBody}</p></div>
      </div>
    </div>
    <Button asChild className="mt-6 rounded-none"><Link to="/check">{f.tryIt} →</Link></Button>
  </section>;
}

function SiteNav({ copy }: { copy: HomeCopy }) {
  return (
    <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-4 px-6 py-6">
      <Link to="/" className="flex items-center gap-3">
        <img src={SCOUT_LOGO_URL} alt="" className="h-9 w-9" />
        <span className="font-serif text-lg tracking-tight">Used Car Scout</span>
      </Link>

      <nav className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link
          to="/how-it-works"
          activeProps={{ className: "text-foreground" }}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {copy.nav.how}
        </Link>
        <Link
          to="/meet-scout"
          activeProps={{ className: "text-foreground" }}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {copy.nav.meetScout}
        </Link>
        <Link
          to="/about"
          activeProps={{ className: "text-foreground" }}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {copy.nav.about}
        </Link>
        <Link
          to="/faq"
          activeProps={{ className: "text-foreground" }}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {copy.nav.faq}
        </Link>
        <Link
          to="/after-you-buy"
          activeProps={{ className: "text-foreground" }}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {copy.nav.afterYouBuy}
        </Link>


        <Link
          to="/check"
          className="rounded-none bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          {copy.nav.check}
        </Link>
      </nav>
    </header>
  );
}



function HeroPasteBox({ copy }: { copy: HomeCopy }) {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [shotError, setShotError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function chooseScreenshot(file: File | undefined) {
    if (!file) return;
    setShotError(null);
    try {
      window.sessionStorage.setItem(PREFILL_IMAGE_KEY, await compressScreenshot(file));
      void navigate({ to: "/check" });
    } catch (cause) {
      setShotError(cause instanceof Error ? cause.message : "That image could not be used.");
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const listing = text.trim();
    if (listing) window.sessionStorage.setItem(PREFILL_TEXT_KEY, listing);
    void navigate({ to: "/check" });
  }

  return (
    <>
    <form onSubmit={submit} className="receipt-shadow mt-8 max-w-xl bg-card p-5">
      <div className="flex items-start gap-3">
        <ScoutAvatar />
        <p className="bg-secondary px-4 py-2.5 text-sm leading-relaxed">{copy.hero.scoutHello}</p>
      </div>
      <label htmlFor="hero-listing" className="sr-only">
        {copy.hero.pastePlaceholder}
      </label>
      <textarea
        id="hero-listing"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={copy.hero.pastePlaceholder}
        rows={3}
        maxLength={10000}
        className="mt-4 w-full resize-none rounded-none border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <CameraIcon /> {copy.hero.upload}
        </button>
        <input
          ref={fileInput}
          type="file"
            accept="image/png,image/jpeg,image/webp,image/heic,image/heif,.heic,.heif"
          className="sr-only"
          aria-label={copy.hero.upload}
          onChange={(event) => {
            void chooseScreenshot(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <button
          type="submit"
          className="rounded-none bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          {copy.hero.checkThis} &rarr;
        </button>
      </div>
      {shotError ? <p className="mt-2 text-sm text-risk">{shotError}</p> : null}
    </form>
    <div className="mt-4">
      <p className="text-sm text-muted-foreground">
        {copy.hero.noListing}{" "}
        <Link to="/sample-report" className="font-medium text-primary underline underline-offset-4">
          {copy.hero.seeExample}
        </Link>
      </p>
    </div>
    </>
  );
}

function ScoutChatPreview({ copy }: { copy: HomeCopy }) {
  const chat = copy.friend.chat;
  return (
    <div className="receipt-shadow bg-card" aria-label="Scout chat preview">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <ScoutAvatar className="h-10 w-10" />
        <div>
          <p className="font-medium leading-tight">{chat.title}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-good" />
            {chat.online}
          </p>
        </div>
      </div>
      <div className="space-y-4 px-5 py-6 text-sm leading-relaxed">
        <p className="ml-auto max-w-[80%] bg-primary px-4 py-2.5 text-primary-foreground">{chat.buyer1}</p>
        <div className="flex items-end gap-2.5">
          <ScoutAvatar className="h-7 w-7" />
          <p className="max-w-[80%] bg-secondary px-4 py-2.5">{chat.scout1}</p>
        </div>
        <p className="ml-auto max-w-[80%] bg-primary px-4 py-2.5 text-primary-foreground">{chat.buyer2}</p>
        <div className="flex items-end gap-2.5">
          <ScoutAvatar className="h-7 w-7" />
          <div className="max-w-[80%] bg-secondary px-4 py-2.5">
            <p>{chat.scout2}</p>
            <p className="mt-2 border-l-2 border-accent-warm bg-card px-3 py-2 italic">{chat.draft}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StepsSection({ copy }: { copy: HomeCopy }) {
  return (
    <section id="steps" className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <h2 className="font-serif text-4xl leading-tight tracking-tight md:text-5xl">
          {copy.steps.heading}
          <span className="block font-sans text-lg font-normal italic opacity-80">
            {copy.steps.seconds}
          </span>
        </h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3">
          {copy.steps.items.map((step, index) => (
            <li key={step.title}>
              <span className="inline-flex size-9 items-center justify-center rounded-full border border-primary-foreground/60 font-mono text-sm">
                {index + 1}
              </span>
              <h3 className="mt-4 font-serif text-2xl leading-tight">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed opacity-85">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function MeetScoutSection({ copy }: { copy: HomeCopy }) {
  return (
    <section id="meet-scout" className="bg-secondary">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-20">
        <div>
          <h2 className="max-w-xl font-serif text-4xl leading-tight tracking-tight text-balance md:text-5xl">
            {copy.friend.heading}
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            {copy.friend.body}
          </p>
          <ul className="mt-8 space-y-4">
            {copy.friend.ticks.map((tick) => (
              <li key={tick} className="flex items-center gap-3 text-base">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-warm text-primary-foreground">
                  <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.5 8.5l3 3 6-7" />
                  </svg>
                </span>
                {tick}
              </li>
            ))}
          </ul>
        </div>
        <ScoutChatPreview copy={copy} />
      </div>
    </section>
  );
}

export function AboutSection({ copy }: { copy: HomeCopy }) {
  return (
    <section id="about" className="bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <p className="font-mono text-xs tracking-[0.22em] text-accent-warm uppercase">
          {copy.founder.heading}
        </p>
        <blockquote className="mt-6 font-serif text-3xl leading-[1.15] tracking-tight text-balance md:text-4xl">
          &ldquo;{copy.founder.pull}&rdquo;
        </blockquote>
        <div className="mt-7 space-y-4 text-base leading-relaxed text-muted-foreground">
          {copy.founder.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
        <p className="mt-8 font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase">
          {copy.founder.nameNeeded} · {copy.founder.role}
        </p>
      </div>
    </section>
  );
}

export function FaqSection({ copy }: { copy: HomeCopy }) {
  return (
    <section id="faq" className="border-t border-border bg-card">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h2 className="font-serif text-3xl tracking-tight">{copy.faq.heading}</h2>
        <div className="mt-8 divide-y divide-border">
          {copy.faq.items.map((item) => (
            <details key={item.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {item.q}
                <span
                  aria-hidden
                  className="font-mono text-muted-foreground transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

