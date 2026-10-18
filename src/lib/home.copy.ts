// Browser-safe homepage copy in two languages. The language switch is only
// offered because every string below exists in both, a half-translated page is
// worse than none. Founder details that have not been supplied are marked as
// needing them rather than filled in with invented facts.
export const LANGUAGES = ["en", "es"] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_LABEL: Record<Language, string> = { en: "EN", es: "ES" };
export const LANGUAGE_NAME: Record<Language, string> = { en: "English", es: "Español" };

export type HomeCopy = {
  nav: {
    how: string;
    meetScout: string;
    about: string;
    faq: string;
    afterYouBuy: string;
    language: string;
    check: string;
  };
  hero: {
    alone: string;
    dont: string;
    sub: string;
    check: string;
    howItWorks: string;
    receiptTitle: string;
    receiptMeta: string;
    scoutHello: string;
    pastePlaceholder: string;
    checkThis: string;
    noListing: string;
    demo: string;
    demoNote: string;
    seeExample: string;
    upload: string;
    gap: string;
    partNobody: string;
    riskTag: string;
    riskReason: string;
  };
  trust: { data: string; noSignup: string; free: string };
  features: { heading: string; viewing: string; viewingBody: string; practice: string; practiceBody: string; safety: string; safetyBody: string; preview: string[]; tryIt: string };
  steps: { heading: string; seconds: string; items: { title: string; body: string }[] };
  friend: {
    heading: string;
    body: string;
    ticks: string[];
    chat: { title: string; buyer1: string; scout1: string; buyer2: string; scout2: string; draft: string; online: string };
  };
  founder: {
    heading: string;
    pull: string;
    body: string[];
    nameNeeded: string;
    role: string;
  };
  faq: { heading: string; items: { q: string; a: string }[] };
  site: {
    tagline: string;
    product: string;
    company: string;
    legal: string;
    how: string;
    meetScout: string;
    sampleReport: string;
    about: string;
    privacy: string;
    terms: string;
    disclaimer: string;
    rights: string;
    dataLine: string;
  };
  footer: { disclaimer: string; built: string };
};

export const homeCopy: Record<Language, HomeCopy> = {
  en: {
    nav: {
      how: "How it works",
      meetScout: "Meet Scout",
      about: "About",
      faq: "FAQ",
      afterYouBuy: "After you buy",
      language: "Language",
      check: "Check a car",
    },
    hero: {
      alone: "Buying your first car alone?",
      dont: "You don't have to.",
      sub: "See what a used car will really cost, what to check, and what to say. Free, even if you can't afford a mechanic.",
      check: "Check a car",
      howItWorks: "How it works",
      receiptTitle: "2013 Nissan Altima 2.5 SV",
      receiptMeta: "148,000 MI · $4,200 ASKING",
      scoutHello: "Hi, I'm Scout! Paste a listing and I'll take a look.",
      pastePlaceholder: "Paste the listing text here…",
      checkThis: "Check this car",
      noListing: "No listing yet?",
      demo: "Try the demo",
      demoNote: "First time? Start here",
      seeExample: "See an example report",
      upload: "Upload a screenshot",
      gap: "more than the asking price",
      partNobody: "the part nobody tells you",
      riskTag: "Low risk",
      riskReason: "12 recalls on record. Ask if they're fixed",
    },
    trust: {
      data: "Real government data",
      noSignup: "No sign up",
      free: "Free",
    },
    features: { heading: "More than a price check", viewing: "Check the car yourself", viewingBody: "One check at a time, from the title to the test drive. Leave with questions about what you found.", practice: "Practice what to say", practiceBody: "Try your offer with a friendly or pushy seller before the real conversation.", safety: "Stay safe", safetyBody: "Spot payment pressure and title problems. Know what to check before meeting or paying.", preview: ["Start it cold", "Watch for warning lights, smoke or shaking.", "Looks fine", "Something felt off", "Skip for now"], tryIt: "Check a car" },
    steps: {
      heading: "Three steps.",
      seconds: "About 30 seconds.",
      items: [
        {
          title: "Paste the listing",
          body: "Paste the listing text or screenshot from Facebook or Craigslist.",
        },
        {
          title: "Scout checks it",
          body: "Owner complaints, recalls, costs and red flags.",
        },
        {
          title: "Decide with confidence",
          body: "Know what to ask, what to check, and what to offer.",
        },
      ],
    },
    friend: {
      heading: "A car-savvy friend who's always on your side",
      body: "Ask anything, from \u201cwhat's a CVT?\u201d to \u201chow do I negotiate?\u201d. Scout explains it simply, with no judgment.",
      ticks: [
        "Explains car words in plain English",
        "Writes polite messages to the seller",
        "Lets you practice the conversation first",
      ],
      chat: {
        title: "Scout",
        online: "Here to help",
        buyer1: "What's a CVT? The listing says it has one.",
        scout1: "It's a type of automatic gearbox. Smooth to drive, but some older ones wear out early, so it's worth asking if it's ever been serviced.",
        buyer2: "Can you help me ask the seller about it?",
        scout2: "Of course. Here's a polite message you can send:",
        draft: "Hi! Is the car still available? Has the transmission ever been serviced or repaired? Thank you!",
      },
    },
    founder: {
      heading: "Why I built this",
      pull: "I bought my first car with no one to ask, and no money for a mechanic.",
      body: [
        "I was 18, new to the US, and on my own. I spent hours researching and still didn't trust my own judgment, and the “car guys” I found felt like they might scam me.",
        "Used Car Scout is the friend I wish I'd had: one who knows cars, is on your side, and doesn't cost a thing.",
      ],
      nameNeeded: "Tasneem",
      role: "Founder",
    },
    faq: {
      heading: "Questions people ask",
      items: [
        {
          q: "Is it really free?",
          a: "Yes. No account, no card, no trial that quietly turns into a bill. You can run ten checks an hour on a device.",
        },
        {
          q: "Where do the facts come from?",
          a: "Recalls and owner complaints come from the National Highway Traffic Safety Administration. Every sourced figure in your report carries the link it came from and the time it was fetched.",
        },
        {
          q: "Does this replace a mechanic?",
          a: "No. It is not a professional inspection. Viewing mode helps you check the car yourself, and nothing here requires you to pay a mechanic.",
        },
        {
          q: "Do I need to make an account?",
          a: "No. Your report opens from its own private link. Nothing is tied to a name or an email, so keep that link to yourself.",
        },
        {
          q: "What if it reads my listing wrong?",
          a: "Every detail it pulls out stays editable before the check runs. Correct it yourself, or ignore the reading and type the car in.",
        },
      ],
    },
    site: {
      tagline: "Your honest friend for buying a car",
      product: "Product",
      company: "Company",
      legal: "Legal",
      how: "How it works",
      meetScout: "Meet Scout",
      sampleReport: "Sample report",
      about: "About",
      privacy: "Privacy",
      terms: "Terms",
      disclaimer: "Disclaimer",
      rights: "© 2026 Used Car Scout",
      dataLine: "Data from NHTSA and fueleconomy.gov. Not a professional inspection.",
    },
    footer: {
      disclaimer:
        "Used Car Scout does not decide whether a car is safe to buy. It shows you what official records say and what the car may cost, so you know what to ask before you hand over money.",
      built: "Built for first-time buyers who are doing this alone.",
    },
  },
  es: {
    nav: {
      how: "Cómo funciona",
      meetScout: "Conoce a Scout",
      about: "Acerca de",
      faq: "Preguntas",
      afterYouBuy: "Después de comprar",
      language: "Idioma",
      check: "Revisar un auto",
    },
    hero: {
      alone: "¿Compras tu primer auto sola?",
      dont: "No tienes que hacerlo sola.",
      sub: "Mira lo que un auto usado realmente cuesta, qué revisar y qué decir. Gratis, aunque no puedas pagar un mecánico.",
      check: "Revisar un auto",
      howItWorks: "Cómo funciona",
      receiptTitle: "Nissan Altima 2.5 SV 2013",
      receiptMeta: "148,000 MI · PIDE $4,200",
      scoutHello: "¡Hola, soy Scout! Pega un anuncio y le echo un vistazo.",
      pastePlaceholder: "Pega aquí el texto del anuncio…",
      checkThis: "Revisar este auto",
      noListing: "¿Aún no tienes anuncio?",
      demo: "Prueba la demo",
      demoNote: "¿Primera vez? Empieza aquí",
      seeExample: "Ver un reporte de ejemplo",
      upload: "Subir una captura",
      gap: "más que el precio pedido",
      partNobody: "lo que nadie te dice",
      riskTag: "Riesgo bajo",
      riskReason: "12 llamados a revisión. Pregunta si están reparados",
    },
    trust: {
      data: "Datos reales del gobierno",
      noSignup: "Sin registro",
      free: "Gratis",
    },
    features: { heading: "Más que revisar el precio", viewing: "Revisa el auto tú misma", viewingBody: "Una revisión a la vez, del título a la prueba de manejo. Termina con preguntas sobre lo que encontraste.", practice: "Practica qué decir", practiceBody: "Ensaya tu oferta con un vendedor amable o insistente antes de hablar de verdad.", safety: "Cuida tu seguridad", safetyBody: "Detecta presión para pagar y problemas con el título. Sabrás qué revisar antes de reunirte o pagar.", preview: ["Arráncalo en frío", "Observa luces de advertencia, humo o vibraciones.", "Se ve bien", "Algo se sintió raro", "Omitir por ahora"], tryIt: "Revisar un auto" },
    steps: {
      heading: "Tres pasos.",
      seconds: "Unos 30 segundos.",
      items: [
        {
          title: "Pega el anuncio",
          body: "Pega el texto del anuncio o una captura de Facebook o Craigslist.",
        },
        {
          title: "Scout lo revisa",
          body: "Quejas de dueños, llamados a revisión, costos y señales de alerta.",
        },
        {
          title: "Decide con confianza",
          body: "Sabrás qué preguntar, qué revisar y qué ofrecer.",
        },
      ],
    },
    friend: {
      heading: "Un amigo que sabe de autos y siempre está de tu lado",
      body: "Pregunta lo que sea, desde \u201c¿qué es una CVT?\u201d hasta \u201c¿cómo negocio?\u201d. Scout lo explica fácil y sin juzgarte.",
      ticks: [
        "Explica palabras de autos en lenguaje sencillo",
        "Escribe mensajes amables para el vendedor",
        "Te deja practicar la conversación primero",
      ],
      chat: {
        title: "Scout",
        online: "Aquí para ayudarte",
        buyer1: "¿Qué es una CVT? El anuncio dice que tiene una.",
        scout1: "Es un tipo de caja automática. Se maneja suave, pero algunas viejas se desgastan pronto, así que vale la pena preguntar si le han dado servicio.",
        buyer2: "¿Me ayudas a preguntarle al vendedor?",
        scout2: "Claro. Aquí tienes un mensaje amable que puedes enviar:",
        draft: "¡Hola! ¿Sigue disponible el auto? ¿Le han dado servicio o reparado la transmisión? ¡Gracias!",
      },
    },
    founder: {
      heading: "Por qué lo creé",
      pull: "Compré mi primer auto sin nadie a quien preguntar, y sin dinero para un mecánico.",
      body: [
        "Tenía 18 años, era nueva en Estados Unidos y estaba sola. Pasé horas investigando y aun así no confiaba en mi propio criterio, y los “expertos en autos” que encontré sentía que podrían estafarme.",
        "Used Car Scout es la amiga que yo hubiera querido: una que sabe de autos, está de tu lado, y no cuesta nada.",
      ],
      nameNeeded: "Tasneem",
      role: "Fundadora",
    },
    faq: {
      heading: "Preguntas que hacen",
      items: [
        {
          q: "¿De verdad es gratis?",
          a: "Sí. Sin cuenta, sin tarjeta, sin una prueba que se convierta en una factura. Puedes hacer diez revisiones por hora en un dispositivo.",
        },
        {
          q: "¿De dónde vienen los datos?",
          a: "Los llamados a revisión y las quejas vienen de la Administración Nacional de Seguridad del Tráfico. Cada cifra con fuente en tu informe trae el enlace de donde salió y la hora en que se consultó.",
        },
        {
          q: "¿Esto reemplaza a un mecánico?",
          a: "No. No es una inspección profesional. El modo de visita te ayuda a revisar el auto tú misma, sin exigir que pagues un mecánico.",
        },
        {
          q: "¿Necesito crear una cuenta?",
          a: "No. Tu informe se abre con su propio enlace privado. Nada está atado a un nombre o un correo, así que guarda ese enlace.",
        },
        {
          q: "¿Y si lee mal mi anuncio?",
          a: "Cada dato que saca queda editable antes de correr la revisión. Corrígelo tú, o ignora la lectura y escribe el auto.",
        },
      ],
    },
    site: {
      tagline: "Tu amiga honesta para comprar un auto",
      product: "Producto",
      company: "Compañía",
      legal: "Legal",
      how: "Cómo funciona",
      meetScout: "Conoce a Scout",
      sampleReport: "Informe de ejemplo",
      about: "Acerca de",
      privacy: "Privacidad",
      terms: "Términos",
      disclaimer: "Aviso legal",
      rights: "© 2026 Used Car Scout",
      dataLine: "Datos de NHTSA y fueleconomy.gov. No es una inspección profesional.",
    },
    footer: {
      disclaimer:
        "Used Car Scout no decide si un auto es seguro comprar. Te muestra lo que dicen los registros oficiales y lo que el auto puede costar, para que sepas qué preguntar antes de entregar dinero.",
      built: "Hecho para compradores primerizos que están haciendo esto solos.",
    },
  },
};
