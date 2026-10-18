import { Fragment } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const TERMS: Record<string, [string, string]> = {
  CVT: ["A type of automatic transmission that changes smoothly without fixed gears.", "Un tipo de transmisión automática que cambia suavemente sin marchas fijas."],
  "timing belt": ["A belt that keeps engine parts moving together. Replacement is scheduled by age or mileage.", "Una correa que sincroniza el motor. Se cambia según la edad o el kilometraje."],
  transmission: ["The part that sends engine power to the wheels and changes gears.", "La parte que lleva la fuerza del motor a las ruedas y cambia las marchas."],
  alternator: ["The part that charges the battery while the engine runs.", "La pieza que carga la batería mientras funciona el motor."],
  "head gasket": ["A seal inside the engine that keeps oil and coolant apart.", "Un sello del motor que mantiene separados el aceite y el refrigerante."],
  lien: ["A lender's claim on the car. It must be resolved before ownership can transfer cleanly.", "El derecho de un prestamista sobre el auto. Debe resolverse antes de transferirlo."],
  salvage: ["A title label for a car declared a total loss. Rules and insurance options vary by state.", "Un título de un auto declarado pérdida total. Las reglas varían por estado."],
  rebuilt: ["A previously salvage car approved for road use under state rules. This is not proof of good condition.", "Un auto antes declarado pérdida total y aprobado para circular. No garantiza su estado."],
  ABS: ["Anti-lock brakes help prevent wheels locking during hard braking.", "Los frenos antibloqueo ayudan a que las ruedas no se bloqueen al frenar fuerte."],
};
const pattern = new RegExp(`(${Object.keys(TERMS).join("|")})`, "gi");
export function GlossaryText({ text, language = "en" }: { text: string; language?: "en" | "es" | undefined }) {
  return <>{text.split(pattern).map((part, i) => {
    const key = Object.keys(TERMS).find((term) => term.toLowerCase() === part.toLowerCase());
    if (!key) return <Fragment key={i}>{part}</Fragment>;
    return <Popover key={i}><PopoverTrigger asChild><Button variant="link" className="inline h-auto whitespace-normal rounded-none p-0 text-inherit underline decoration-dotted underline-offset-4">{part}</Button></PopoverTrigger><PopoverContent className="max-w-xs text-sm">{TERMS[key]?.[language === "es" ? 1 : 0]}</PopoverContent></Popover>;
  })}</>;
}