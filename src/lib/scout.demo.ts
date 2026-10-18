import type { Language } from "./home.copy";

// Fictional seller claims only. Reports still use the normal live, limited checker.
export const DEMO_LISTINGS = [
  {
    id: "ordinary",
    title: { en: "An everyday listing", es: "Un anuncio normal" },
    car: "2019 Toyota Corolla LE",
    detail: { en: "$14,500 · 72,000 miles · Clean title", es: "$14,500 · 72,000 millas · Título limpio" },
    text: {
      en: "Fictional demo listing: 2019 Toyota Corolla LE automatic, 72,000 miles, asking $14,500. Clean title. Runs well, no warning lights. Maintenance records available. Seller welcomes an independent inspection.",
      es: "Anuncio ficticio de demostración: Toyota Corolla LE automático 2019, 72,000 millas, precio $14,500. Título limpio. Funciona bien, sin luces de advertencia. Registros de mantenimiento disponibles. El vendedor acepta una inspección independiente.",
    },
  },
  {
    id: "risky",
    title: { en: "An older car with problems", es: "Un auto antiguo con problemas" },
    car: "2008 Nissan Altima 2.5 S",
    detail: { en: "$4,200 · 148,000 miles · Transmission slips", es: "$4,200 · 148,000 millas · La transmisión patina" },
    text: {
      en: "Fictional demo listing: 2008 Nissan Altima 2.5 S, 148,000 miles, asking $4,200. Clean title. Transmission slips and check engine light is on. Sold as is. No maintenance records.",
      es: "Anuncio ficticio de demostración: Nissan Altima 2.5 S 2008, 148,000 millas, precio $4,200. Título limpio. La transmisión patina y la luz del motor está encendida. Se vende tal como está. Sin registros de mantenimiento.",
    },
  },
  {
    id: "scam",
    title: { en: "Payment pressure to spot", es: "Presión para pagar" },
    car: "2017 Honda Civic LX",
    detail: { en: "$3,000 · 65,000 miles · Gift-card deposit demanded", es: "$3,000 · 65,000 millas · Exige depósito con tarjeta de regalo" },
    text: {
      en: "Fictional demo listing: 2017 Honda Civic LX, 65,000 miles, asking $3,000. Seller says clean title. Seller is overseas and demands a $500 gift-card deposit before viewing. Car will be shipped. Seller refuses a test drive or independent inspection.",
      es: "Anuncio ficticio de demostración: Honda Civic LX 2017, 65,000 millas, precio $3,000. El vendedor dice que tiene título limpio. Está en el extranjero y exige un depósito de $500 con tarjeta de regalo antes de ver el auto. Enviará el auto. Rechaza una prueba de manejo o una inspección independiente.",
    },
  },
] as const;

export function demoListingText(id: string, language: Language) {
  return DEMO_LISTINGS.find((listing) => listing.id === id)?.text[language];
}