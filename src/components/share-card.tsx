import { useLanguage } from "./site";
import { useEffect, useState } from "react";
import { Share2, Link2, ImageDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { shareImageSvg, type ShareImageData, type SharePalette } from "@/lib/share-card-art";
import { SCOUT_LOGO_URL } from "@/lib/brand";

type ShareCardProps = ShareImageData & { reportId: string };

function palette(): SharePalette {
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string) => styles.getPropertyValue(`--share-${name}`).trim();
  return { paper: token("paper"), ink: token("ink"), total: token("total"), coral: token("coral"), muted: token("muted"), risk: token("risk"), divider: token("divider"), logo: token("logo") };
}

// Rasterize the real logo once so it can be embedded in the share image and
// survives canvas export (nested SVG references would be blocked there).
let logoDataUri: string | null = null;
let logoPromise: Promise<string | null> | null = null;

function loadLogoDataUri(): Promise<string | null> {
  if (logoDataUri) return Promise.resolve(logoDataUri);
  logoPromise ??= new Promise<string | null>((resolve) => {
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 160;
        canvas.height = 160;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("no canvas");
        context.drawImage(image, 0, 0, 160, 160);
        logoDataUri = canvas.toDataURL("image/png");
        resolve(logoDataUri);
      } catch {
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    image.src = SCOUT_LOGO_URL;
  });
  return logoPromise;
}

export async function renderShareCard(props: ShareImageData, siteUrl: string): Promise<HTMLCanvasElement> {
  await document.fonts.ready;
  const logo = await loadLogoDataUri();
  const svg = shareImageSvg(props, siteUrl, palette(), logo ?? undefined);
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 1000;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Unable to create share image.");
    context.drawImage(image, 0, 0, 1000, 1000);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ShareCard(input: ShareCardProps) {
  const { language } = useLanguage();
  const es = language === "es";
  const props = { ...input, language };
  const t = (en: string, spanish: string) => es ? spanish : en;
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [art, setArt] = useState("");
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(window.location.origin); }, []);
  useEffect(() => {
    if (!open || !origin) return;
    let active = true;
    void Promise.all([document.fonts.ready, loadLogoDataUri()]).then(([, logo]) => {
      if (active) setArt(shareImageSvg(props, window.location.host, palette(), logo ?? undefined));
    });
    return () => { active = false; };
  }, [open, origin, props.model, props.askingPrice, props.total, props.fairOffer, props.risk, props.fuelIncluded, props.excluded, language]);
  const reportUrl = `${origin}/report/${props.reportId}?shared=1`;

  const shareImage = async () => {
    setSharing(true);
    setError("");
    try {
      const canvas = await renderShareCard(props, window.location.host);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Unable to prepare image.");
      const file = new File([blob], "used-car-scout-report.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Used Car Scout report", text: reportUrl });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === "AbortError")) setError(t("Couldn't share the image. Please try again.", "No se pudo compartir la imagen. Intenta de nuevo."));
    } finally {
      setSharing(false);
    }
  };

  const copyLink = async () => {
    setError("");
    try {
      try {
        await navigator.clipboard.writeText(reportUrl);
      } catch {
        const textarea = document.createElement("textarea");
        textarea.value = reportUrl;
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand("copy");
        textarea.remove();
        if (!success) throw new Error("Copy failed");
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t("Couldn't copy the link. Please try again.", "No se pudo copiar el enlace. Intenta de nuevo."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5"><Share2 className="h-3.5 w-3.5" />{t("Share", "Compartir")}</Button>
      </DialogTrigger>
      <DialogContent closeLabel={t("Close", "Cerrar")} className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[548px] overflow-y-auto rounded-none p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{t("Get a second opinion", "Pide una segunda opinión")}</DialogTitle>
          <DialogDescription>{t("Send this summary to a friend or family member.", "Envía este resumen a un amigo o familiar.")}</DialogDescription>
        </DialogHeader>
        <div aria-label="Share image preview" className="aspect-square w-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: art }} />
        <div className="flex gap-2">
          <Button onClick={shareImage} disabled={sharing || !art} className="flex-1 gap-1.5 rounded-none"><ImageDown className="h-4 w-4" />{sharing ? t("Preparing...", "Preparando…") : t("Share image", "Compartir imagen")}</Button>
          <Button variant="outline" onClick={copyLink} disabled={!origin} className="flex-1 gap-1.5 rounded-none">{copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}{copied ? t("Copied", "Copiado") : t("Copy link", "Copiar enlace")}</Button>
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <p className="text-center text-xs text-muted-foreground">{t("They'll see the summary, not your personal info.", "Verán el resumen, no tus datos personales.")}</p>
      </DialogContent>
    </Dialog>
  );
}
