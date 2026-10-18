const TIPS = [
  "Meet in daylight at a busy public place. Many police stations have a safe exchange spot.",
  "Bring a friend, or share your location and the listing with someone you trust.",
  "Never send a deposit or gift cards before you see the car in person.",
  "Check that the name on the title matches the seller's ID.",
  "Pay at a bank or with a cashier's check, never cash on the spot alone.",
];

const ES_TIPS = [
  "Reúnete de día en un lugar público concurrido. Muchas estaciones de policía tienen un área de intercambio seguro.",
  "Lleva a alguien o comparte tu ubicación y el anuncio con una persona de confianza.",
  "Nunca envíes un depósito ni tarjetas de regalo antes de ver el auto en persona.",
  "Comprueba que el nombre del título coincida con la identificación del vendedor.",
  "Paga en un banco o con un cheque de caja. No lleves dinero en efectivo a solas.",
];
export function SafeMeetupTips({ className = "", language = "en" }: { className?: string; language?: "en" | "es" }) {
  return (
    <div className={`border border-border bg-card p-4 ${className}`}>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{language === "es" ? "Consejos para una visita segura" : "Safe meetup tips"}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed">
        {(language === "es" ? ES_TIPS : TIPS).map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </div>
  );
}
