import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { SCOUT_LOGO_URL } from "@/lib/brand";
import { useLanguage } from "@/components/site";
import { Button } from "@/components/ui/button";

export function ReportHeader({ wide = false }: { wide?: boolean }) {
  const { language } = useLanguage();
  return (
    <header className={`mx-auto flex flex-wrap items-center justify-between gap-y-3 px-5 py-6 ${wide ? "max-w-6xl" : "max-w-2xl"}`}>
      <Link to="/" className="flex w-full items-center gap-3 sm:w-auto">
        <img src={SCOUT_LOGO_URL} alt="" className="h-8 w-8" />
        <span className="font-serif text-lg tracking-tight">Used Car Scout</span>
      </Link>
      <div className="flex items-center gap-2">
        <Link
          to="/check"
          className="rounded-none border border-input px-3 py-2 font-mono text-xs uppercase tracking-[0.1em] transition-colors hover:bg-secondary"
        >
          {language === "es" ? "Nueva revisión" : "New check"}
        </Link>
        <CopyLink />
      </div>
    </header>
  );
}

function CopyLink() {
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);
  return (
    <Button variant="outline"
      type="button"
      onClick={() => {
        const url = new URL(window.location.href);
        url.pathname = url.pathname.replace(/\/(full|viewing|practice)$/, "");
        url.hash = "";
        url.search = "?shared=1";
        void navigator.clipboard.writeText(url.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="rounded-none border border-input px-3 py-2 font-mono text-xs uppercase tracking-[0.1em] transition-colors hover:bg-secondary"
    >
      {copied ? language === "es" ? "Enlace copiado" : "Link copied" : language === "es" ? "Copiar enlace" : "Copy link"}
    </Button>
  );
}
