// Viewing mode: a step-by-step checklist for seeing the car in person.
// Steps and the final summary are built in deterministic code from the
// stored report. Findings stay in the buyer's browser, never in the report.

export type Decision = "fine" | "unsure" | "problem" | "skip";

export type ViewingStep = {
  id: string;
  title: string;
  look: string;
  why: string;
  /** Question to ask the seller if this step is not fine. */
  ask: string;
};

export type ViewingInput = {
  concerns: Array<{ point: string; why: string }>;
  recallCount: number | null;
  language?: "en" | "es";
};

const BASE: ViewingStep[] = [
  {
    id: "papers",
    title: "Title and VIN",
    look: "Ask to see the title. Check the name matches the seller's ID, and the VIN on the title matches the VIN on the dashboard and driver door.",
    why: "A mismatch can mean the car is not theirs to sell, or has a hidden past.",
    ask: "Can you show me the title in your name, with the same VIN as the car?",
  },
  {
    id: "outside",
    title: "Walk around the outside",
    look: "Look for paint that doesn't match, uneven gaps between panels, rust under the doors, and tires worn more on one side.",
    why: "These are signs of a past accident or alignment problems.",
    ask: "Has the car ever been in an accident or had body work?",
  },
  {
    id: "cold-start",
    title: "Start it cold",
    look: "Ask the seller not to warm it up before you arrive. Watch for warning lights that stay on, smoke, or rough shaking.",
    why: "A warm engine can hide starting and leak problems.",
    ask: "Why is that warning light on, and has it been checked?",
  },
  {
    id: "under-hood",
    title: "Under the hood",
    look: "Look for wet or oily spots, cracked belts, and a burnt smell. You don't need to know the parts, just look for mess.",
    why: "Leaks and burning smells point to repairs coming soon.",
    ask: "Have there been any leaks or repairs under the hood recently?",
  },
  {
    id: "drive",
    title: "Test drive",
    look: "Drive at least 15 minutes, including a highway. Notice pulling to one side, grinding brakes, clunks over bumps, or jerky shifting.",
    why: "Most expensive problems only show up while driving.",
    ask: "Can we take a longer test drive and look at the service records before I decide?",
  },
  {
    id: "inside",
    title: "Inside the car",
    look: "Test the AC, heat, windows, locks, lights and seat belts. Sniff for mold or smoke.",
    why: "Small fixes add up, and water smells can mean flood damage.",
    ask: "Has the car ever had water or flood damage?",
  },
];

export function buildViewingSteps({ concerns, recallCount, language = "en" }: ViewingInput): ViewingStep[] {
  const es = language === "es";
  const spanish: ViewingStep[] = [
    { id: "papers", title: "Título y VIN", look: "Pide el título. Comprueba que el nombre coincida con la identificación del vendedor y que el VIN coincida con el tablero y la puerta del auto.", why: "Una diferencia puede significar que el auto no le pertenece.", ask: "¿Puedes mostrar el título a tu nombre con el mismo VIN del auto?" },
    { id: "outside", title: "Revisa el exterior", look: "Busca pintura diferente, espacios desiguales entre paneles, óxido y neumáticos gastados de un solo lado.", why: "Pueden indicar un choque o un problema de alineación.", ask: "¿Ha tenido choques o reparaciones de carrocería?" },
    { id: "cold-start", title: "Arráncalo en frío", look: "Pide que no lo calienten antes. Observa luces que no se apagan, humo o vibraciones.", why: "Un motor caliente puede ocultar problemas al arrancar.", ask: "¿Por qué está encendida esa luz y qué códigos tiene?" },
    { id: "under-hood", title: "Bajo el capó", look: "Busca manchas húmedas o aceitosas, correas agrietadas y olor a quemado. No abras un depósito de refrigerante caliente.", why: "Las fugas pueden necesitar reparaciones.", ask: "¿Ha tenido fugas o reparaciones del motor?" },
    { id: "drive", title: "Prueba de manejo", look: "Con permiso del vendedor, conduce al menos 15 minutos si es seguro. Nota tirones, frenos que rechinan, golpes o cambios bruscos.", why: "Algunos problemas solo se notan al manejar.", ask: "¿Podemos manejar más tiempo y revisar los registros de servicio antes de decidir?" },
    { id: "inside", title: "Dentro del auto", look: "Prueba aire acondicionado, calefacción, ventanas, cerraduras, luces y cinturones. Nota olor a humedad o humo.", why: "Las reparaciones pequeñas se acumulan. La humedad puede indicar inundación.", ask: "¿Ha sufrido daños por agua o inundación?" },
  ];
  const steps = es ? [...spanish] : [...BASE];
  concerns.slice(0, 4).forEach((c, i) => {
    steps.push({
      id: `concern-${i}`,
      title: es ? `Lo que preocupa a Scout: ${c.point}` : `Scout's concern: ${c.point}`,
      look: es ? (/transmisión|CVT|patina/i.test(c.point + c.why) ? "Acelera suavemente con permiso. Nota retrasos, vibraciones o cambios bruscos. Detente si no es seguro." : /freno|ABS/i.test(c.point + c.why) ? "Frena suavemente en un lugar tranquilo. Nota tirones, ruidos o luces. No sigas si frena mal." : /motor|fuga|sobrecalienta/i.test(c.point + c.why) ? "Arranca en frío. Observa las luces, temperatura y gotas. No abras un depósito de refrigerante caliente." : "Pregunta por esta preocupación y pide registros. Revisa el auto en un lugar público antes de pagar.") : /transmission|CVT|slip|shift/i.test(c.point + c.why) ? "With the seller's permission, accelerate gently and notice delayed movement, shaking or jerky shifts. Stop if anything feels unsafe." : /brake|ABS/i.test(c.point + c.why) ? "In a quiet area, brake gently. Notice pulling, grinding or a warning light. Stop the drive if braking feels wrong." : /engine|overheat|coolant|leak/i.test(c.point + c.why) ? "Start the engine cold. Watch warning lights and the temperature gauge. Look for fresh drips. Never open a hot coolant cap." : /scam|gift|title|payment/i.test(c.point + c.why) ? "Do not send a deposit. See the car and title in person, compare the seller's ID and meet in a busy public place." : "Ask the seller about this specific concern. Request records and use the checks above to look for signs, without taking anything apart.",
      why: c.why,
      ask: es ? `¿Puedes contarme sobre esto: ${c.point}?` : `Can you tell me about this: ${c.point}?`,
    });
  });
  if ((recallCount ?? 0) > 0) {
    steps.push({
      id: "recalls",
      title: es ? "Retiros de seguridad" : "Open safety recalls",
      look: es ? "Pide comprobantes o revisa el VIN en nhtsa.gov/recalls para saber qué retiros siguen pendientes." : "Ask for repair receipts, or enter the VIN at nhtsa.gov/recalls to see which recalls are still open.",
      why: es ? "Las reparaciones por retiros suelen ser gratuitas en un concesionario." : "Recall repairs are usually free at a dealer, but only if someone booked them.",
      ask: es ? "¿Se repararon los retiros de seguridad? ¿Tienes comprobantes?" : "Have the safety recalls on this car been fixed? Do you have the receipts?",
    });
  }
  return steps;
}

export type ViewingSummary = {
  answered: number;
  total: number;
  problems: ViewingStep[];
  unsure: ViewingStep[];
  skipped: ViewingStep[];
  questions: string[];
  verdict: "keep-going" | "slow-down" | "walk-away";
};

export function summarizeViewing(steps: ViewingStep[], decisions: Record<string, Decision | undefined>): ViewingSummary {
  const problems = steps.filter((s) => decisions[s.id] === "problem");
  const skipped = steps.filter((s) => decisions[s.id] === "skip");
  const unsure = steps.filter((s) => decisions[s.id] === "unsure" || decisions[s.id] === "skip");
  const answered = steps.filter((s) => decisions[s.id]).length;
  const papersBad = decisions["papers"] === "problem";
  const verdict = papersBad || problems.length >= 3 ? "walk-away" : problems.length > 0 || skipped.length > 0 || unsure.length >= 2 || answered < steps.length ? "slow-down" : "keep-going";
  return {
    answered,
    total: steps.length,
    problems,
    unsure,
    skipped,
    questions: [...problems, ...unsure].map((s) => s.ask),
    verdict,
  };
}
