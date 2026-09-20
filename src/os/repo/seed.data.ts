import type {
  AdCreative, AiJob, BrandKit, Campaign, Client, Integration, Landing, Lead, Offer,
} from "./types";

/**
 * DATOS DE DEMO. Sustituidos por Supabase en el Sprint 1.
 *
 * Tres clientes a propósito: uno completo (para ver las pantallas llenas), uno a medias
 * (para ver los estados intermedios) y uno recién dado de alta y vacío (para diseñar los
 * estados vacíos con algo real delante, que es cuando salen bien).
 */

const d = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * 86_400_000).toISOString();

export const clients: Client[] = [
  { id: "c_nordic", slug: "nordic-clinic", name: "Nordic Clinic", websiteUrl: "https://nordicclinic.es", status: "active", createdAt: d(64) },
  { id: "c_rivas", slug: "taller-rivas", name: "Taller Rivas", websiteUrl: "https://tallerrivas.com", status: "active", createdAt: d(31) },
  { id: "c_boix", slug: "casa-boix", name: "Casa Boix", websiteUrl: "https://casaboix.es", status: "onboarding", createdAt: d(1) },
];

export const brandKits: BrandKit[] = [
  {
    id: "bk_nordic", clientId: "c_nordic", status: "approved", version: 3,
    identity: {
      logoLightPath: "seed/nordic-logo-light.svg", logoDarkPath: "seed/nordic-logo-dark.svg",
      colors: { primary: "#0F3B57", secondary: "#8CC0D6", accent: "#E8A33D", background: "#FFFFFF", textPrimary: "#12212B" },
      fonts: { heading: "Söhne", body: "Inter" },
      colorScheme: "light", borderRadius: "12px",
      photoStyle: "Luz natural, consulta diáfana, piel sin retoque agresivo, azules fríos y madera clara.",
      imageModel: "marketing-studio",
    },
    voice: {
      tone: ["cercano", "riguroso", "sereno"], address: "tu",
      wordsToUse: ["tu caso", "sin compromiso", "primera visita", "diagnóstico"],
      wordsToAvoid: ["barato", "milagro", "oferta flash", "low cost"],
      sampleCopy: ["Primero te escuchamos. El presupuesto llega después.", "Un plan de tratamiento que entiendes antes de firmarlo."],
    },
    business: {
      valueProposition: { value: "Odontología integral con diagnóstico gratuito y plan de tratamiento por escrito antes de empezar.", sourceUrl: "https://nordicclinic.es/" },
      services: [
        { value: "Implantología", sourceUrl: "https://nordicclinic.es/servicios" },
        { value: "Ortodoncia invisible", sourceUrl: "https://nordicclinic.es/servicios" },
        { value: "Estética dental", sourceUrl: "https://nordicclinic.es/servicios" },
      ],
      differentiators: [
        { value: "Plan de tratamiento por escrito antes de cobrar nada", sourceUrl: "https://nordicclinic.es/sobre-nosotros" },
        { value: "Escáner 3D en la primera visita", sourceUrl: "https://nordicclinic.es/servicios" },
      ],
      proof: [
        { value: "412 reseñas en Google con 4,8 de media", sourceUrl: "https://nordicclinic.es/" },
        { value: "18 años en el barrio de Ruzafa", sourceUrl: "https://nordicclinic.es/sobre-nosotros" },
      ],
      geo: "Valencia y área metropolitana",
    },
    personas: [
      { profile: "Adulto de 35-55 que lleva años posponiendo un implante", pains: ["Miedo al dolor", "No saber el precio final", "Malas experiencias previas"], desires: ["Volver a masticar sin pensarlo", "Saber el coste total desde el principio"], objections: ["Seguro que me hinchan el presupuesto", "No tengo tiempo para tantas visitas"] },
      { profile: "Madre o padre que busca ortodoncia para un hijo adolescente", pains: ["Precio", "Que el hijo no quiera brackets"], desires: ["Tratamiento discreto", "Financiación clara"], objections: ["¿Merece la pena la invisible?"] },
    ],
    legal: {
      privacyUrl: "https://nordicclinic.es/privacidad", controller: "Nordic Clinic Valencia S.L.",
      consentText: "He leído y acepto la política de privacidad. Nordic Clinic tratará mis datos para responder a esta solicitud.",
      capiLegalBasis: "consent",
    },
    origins: {
      "identity.colors": "reviewed", "identity.fonts": "reviewed", "identity.photoStyle": "reviewed",
      "voice.tone": "reviewed", "business.valueProposition": "reviewed", "business.proof": "reviewed",
      "personas": "reviewed", "legal.consentText": "reviewed",
    },
    approvedAt: d(52), approvedBy: "u_estratega",
  },
  {
    id: "bk_rivas", clientId: "c_rivas", status: "approved", version: 1,
    identity: {
      logoLightPath: "seed/rivas-logo.svg", logoDarkPath: null,
      colors: { primary: "#1C1C1C", secondary: "#D92D20", accent: "#F5A524", background: "#FFFFFF", textPrimary: "#1C1C1C" },
      fonts: { heading: "Barlow Condensed", body: "Inter" },
      colorScheme: "light", borderRadius: "4px",
      photoStyle: "Taller real, luz dura, herramienta a la vista, nada de stock.",
      imageModel: "soul-2",
    },
    voice: {
      tone: ["directo", "honesto", "de barrio"], address: "tu",
      wordsToUse: ["te lo enseñamos", "presupuesto cerrado", "sin sorpresas"],
      wordsToAvoid: ["premium", "excelencia", "soluciones integrales"],
      sampleCopy: ["Te enseñamos la pieza rota antes de cambiarla."],
    },
    business: {
      valueProposition: { value: "Taller multimarca con presupuesto cerrado y coche de sustitución sin coste.", sourceUrl: "https://tallerrivas.com/" },
      services: [
        { value: "Mecánica general", sourceUrl: "https://tallerrivas.com/servicios" },
        { value: "Pre-ITV", sourceUrl: "https://tallerrivas.com/servicios" },
      ],
      differentiators: [{ value: "Coche de sustitución incluido", sourceUrl: "https://tallerrivas.com/" }],
      proof: [],
      geo: "Paterna y Burjassot",
    },
    personas: [
      { profile: "Conductor de 30-60 con coche de más de 8 años", pains: ["Que le cobren de más", "Quedarse sin coche"], desires: ["Precio cerrado antes de empezar"], objections: ["Los talleres siempre encuentran algo más"] },
    ],
    legal: { privacyUrl: "https://tallerrivas.com/privacidad", controller: "Talleres Rivas S.L.", consentText: "Acepto la política de privacidad.", capiLegalBasis: "consent" },
    origins: { "identity.colors": "reviewed", "voice.tone": "reviewed", "business.proof": "empty", "business.valueProposition": "suggested" },
    approvedAt: d(22), approvedBy: "u_juan",
  },
  {
    // Recién extraído y sin revisar: es el estado donde se ve para qué sirve el
    // marcado de procedencia — todo "sugerido" hasta que una persona lo mira.
    id: "bk_boix", clientId: "c_boix", status: "extracted", version: 1,
    identity: {
      logoLightPath: "seed/boix-logo.svg", logoDarkPath: null,
      colors: { primary: "#2E4034", secondary: "#C8B79A", accent: "#8A5B2E", background: "#FBF9F5", textPrimary: "#22251F" },
      fonts: { heading: "Playfair Display", body: "Inter" },
      colorScheme: "light", borderRadius: "2px",
      photoStyle: null, imageModel: null,
    },
    voice: {
      tone: ["cálido", "sobrio", "familiar"], address: "usted",
      wordsToUse: ["de temporada", "casa", "mercado"],
      wordsToAvoid: ["fusión", "experiencia gastronómica"],
      sampleCopy: [],
    },
    business: {
      valueProposition: { value: "Cocina de mercado en un comedor de toda la vida, con menú diario y carta corta.", sourceUrl: "https://casaboix.es/" },
      services: [{ value: "Menú diario", sourceUrl: "https://casaboix.es/" }],
      differentiators: [],
      proof: [],
      geo: null,
    },
    personas: [
      { profile: "Oficinista de la zona que come fuera entre semana", pains: ["Poco tiempo", "Cansancio del menú de siempre"], desires: ["Comer bien sin gastar de más"], objections: ["¿Habrá sitio sin reservar?"] },
    ],
    legal: { privacyUrl: null, controller: null, consentText: null, capiLegalBasis: "consent" },
    origins: {
      "identity.colors": "suggested", "identity.fonts": "suggested",
      "identity.photoStyle": "empty", "voice.tone": "suggested",
      "business.valueProposition": "suggested", "business.proof": "empty",
      "personas": "suggested", "legal.consentText": "empty",
    },
    approvedAt: null, approvedBy: null,
  },
];

export const offers: Offer[] = [
  { id: "of_nordic_implante", clientId: "c_nordic", brandKitId: "bk_nordic", name: "Primera visita de implantología", what: "Diagnóstico con escáner 3D y plan de tratamiento por escrito, sin compromiso.", hook: "Escáner 3D gratis", personaIndex: 0, cta: "BOOK_NOW", endsAt: null, createdAt: d(48) },
  { id: "of_nordic_orto", clientId: "c_nordic", brandKitId: "bk_nordic", name: "Ortodoncia invisible adolescentes", what: "Estudio de ortodoncia invisible con financiación a 24 meses sin intereses.", hook: "24 meses sin intereses", personaIndex: 1, cta: "GET_QUOTE", endsAt: d(-45), createdAt: d(20) },
  { id: "of_rivas_previt", clientId: "c_rivas", brandKitId: "bk_rivas", name: "Revisión pre-ITV", what: "Revisión de 25 puntos antes de pasar la ITV, con presupuesto cerrado.", hook: "39 €", personaIndex: 0, cta: "BOOK_NOW", endsAt: null, createdAt: d(18) },
];

const ANGLE_COPY: Record<string, { p: string; h: string; d: string }[]> = {
  pain: [
    { p: "Llevas años diciendo \"el año que viene me lo miro\". Y el año que viene sigue doliendo al masticar por el mismo lado.\n\nEn la primera visita te hacemos un escáner 3D y te damos el plan por escrito. Sin compromiso, y sabiendo lo que cuesta antes de decidir.", h: "Deja de masticar de un lado", d: "Escáner 3D y plan por escrito" },
    { p: "Lo que frena a la mayoría no es el implante. Es no saber en qué acaba costando.\n\nPor eso el presupuesto va por escrito antes de empezar nada.", h: "Sin sorpresas en la factura", d: "Presupuesto cerrado por escrito" },
  ],
  benefit: [
    { p: "Volver a comer una manzana de un mordisco. Eso es lo que nos dicen casi todos cuando terminan.\n\nPrimera visita con escáner 3D y plan de tratamiento por escrito.", h: "Vuelve a morder sin pensarlo", d: "Primera visita sin compromiso" },
    { p: "Un plan de tratamiento que entiendes antes de firmarlo: qué se hace, en cuántas visitas y cuánto cuesta.", h: "Lo entiendes antes de firmar", d: "Plan de tratamiento por escrito" },
  ],
  social_proof: [
    { p: "412 reseñas en Google y un 4,8 de media. Dieciocho años en Ruzafa.\n\nEmpieza por una primera visita con escáner 3D, sin compromiso.", h: "412 reseñas, 4,8 de media", d: "18 años en Ruzafa" },
    { p: "\"Me dijeron el precio final en la primera visita y fue exactamente ese.\" Es la reseña que más se repite.", h: "El precio que te dicen es el que pagas", d: "Diagnóstico sin compromiso" },
  ],
};

function creativesFor(clientId: string, offerId: string, status: AdCreative["status"], prefix: string): AdCreative[] {
  const out: AdCreative[] = [];
  (["pain", "benefit", "social_proof"] as const).forEach((angle) => {
    ANGLE_COPY[angle].forEach((c, i) => {
      out.push({
        id: `${prefix}_${angle}_${i + 1}`, clientId, offerId, angle, variant: i + 1,
        primaryText: c.p, headline: c.h, description: c.d, cta: "BOOK_NOW",
        masterAssetId: `as_${prefix}_${angle}_${i + 1}`,
        status, metaAdId: status === "approved" ? `1201${Math.abs(hash(prefix + angle + i)) % 900000 + 100000}` : null,
        createdAt: d(12),
      });
    });
  });
  return out;
}
function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }

export const adCreatives: AdCreative[] = [
  ...creativesFor("c_nordic", "of_nordic_implante", "approved", "ac_nimp"),
  ...creativesFor("c_rivas", "of_rivas_previt", "generated", "ac_rpre"),
];

export const campaigns: Campaign[] = [
  { id: "cp_nordic", clientId: "c_nordic", offerId: "of_nordic_implante", objective: "OUTCOME_LEADS", dailyBudgetCents: 2500, geo: "Valencia (+15 km)", ageMin: 35, ageMax: 60, metaCampaignId: "23861294857320511", metaAdsetId: "23861294857330511", status: "created_paused", error: null, createdAt: d(11) },
];

export const landings: Landing[] = [
  {
    id: "ld_nordic", clientId: "c_nordic", offerId: "of_nordic_implante", slug: "primera-visita",
    blocks: {
      blocks: [
        { id: "b1", visible: true, block: { type: "hero", headline: "Recupera la mordida sin sorpresas en la factura", subheadline: "Primera visita con escáner 3D y plan de tratamiento por escrito. Sin compromiso.", ctaLabel: "Pedir cita", imageAssetId: null } },
        { id: "b2", visible: true, block: { type: "benefits", title: "Qué incluye la primera visita", items: [
          { title: "Escáner 3D", body: "Vemos el hueso y la posición real antes de proponer nada." },
          { title: "Plan por escrito", body: "Qué se hace, en cuántas visitas y cuánto cuesta. Todo, antes de empezar." },
          { title: "Financiación clara", body: "Si hace falta, con las condiciones delante desde el primer día." },
        ] } },
        { id: "b3", visible: true, block: { type: "how", title: "Cómo funciona", steps: [
          { title: "1. Te escuchamos", body: "Qué te molesta y desde cuándo." },
          { title: "2. Escaneamos", body: "Quince minutos, sin dolor." },
          { title: "3. Te damos el plan", body: "Por escrito, y decides tú." },
        ] } },
        { id: "b4", visible: true, block: { type: "proof", title: "Por qué se fían", quotes: [
          { quote: "Me dijeron el precio final en la primera visita y fue exactamente ese.", author: "Reseña en Google" },
        ], stats: [
          { value: "412", label: "reseñas en Google" },
          { value: "4,8", label: "de media" },
          { value: "18 años", label: "en Ruzafa" },
        ] } },
        { id: "b5", visible: false, block: { type: "faq", title: "Dudas frecuentes", items: [
          { q: "¿La primera visita cuesta algo?", a: "No. Ni la visita ni el escáner." },
          { q: "¿Cuánto tarda un implante?", a: "Depende del caso; te lo decimos en el plan." },
          { q: "¿Puedo financiarlo?", a: "Sí, y verás las condiciones antes de firmar." },
        ] } },
        { id: "b6", visible: true, block: { type: "form", title: "Pide tu primera visita", subtitle: "Te llamamos en menos de 24 h laborables.", submitLabel: "Pedir cita" } },
        { id: "b7", visible: true, block: { type: "footer", legalHtml: "Nordic Clinic Valencia S.L. · Aviso legal y política de privacidad" } },
      ],
    },
    publishedBlocks: {
      blocks: [
        { id: "b1", visible: true, block: { type: "hero", headline: "Recupera la mordida sin sorpresas en la factura", subheadline: "Primera visita con escáner 3D y plan de tratamiento por escrito. Sin compromiso.", ctaLabel: "Pedir cita", imageAssetId: null } },
        { id: "b2", visible: true, block: { type: "benefits", title: "Qué incluye la primera visita", items: [
          { title: "Escáner 3D", body: "Vemos el hueso y la posición real antes de proponer nada." },
          { title: "Plan por escrito", body: "Qué se hace, en cuántas visitas y cuánto cuesta. Todo, antes de empezar." },
          { title: "Financiación clara", body: "Si hace falta, con las condiciones delante desde el primer día." },
        ] } },
        { id: "b3", visible: true, block: { type: "how", title: "Cómo funciona", steps: [
          { title: "1. Te escuchamos", body: "Qué te molesta y desde cuándo." },
          { title: "2. Escaneamos", body: "Quince minutos, sin dolor." },
          { title: "3. Te damos el plan", body: "Por escrito, y decides tú." },
        ] } },
        { id: "b4", visible: true, block: { type: "proof", title: "Por qué se fían", quotes: [
          { quote: "Me dijeron el precio final en la primera visita y fue exactamente ese.", author: "Reseña en Google" },
        ], stats: [
          { value: "412", label: "reseñas en Google" },
          { value: "4,8", label: "de media" },
          { value: "18 años", label: "en Ruzafa" },
        ] } },
        { id: "b5", visible: false, block: { type: "faq", title: "Dudas frecuentes", items: [
          { q: "¿La primera visita cuesta algo?", a: "No. Ni la visita ni el escáner." },
          { q: "¿Cuánto tarda un implante?", a: "Depende del caso; te lo decimos en el plan." },
          { q: "¿Puedo financiarlo?", a: "Sí, y verás las condiciones antes de firmar." },
        ] } },
        { id: "b6", visible: true, block: { type: "form", title: "Pide tu primera visita", subtitle: "Te llamamos en menos de 24 h laborables.", submitLabel: "Pedir cita" } },
        { id: "b7", visible: true, block: { type: "footer", legalHtml: "Nordic Clinic Valencia S.L. · Aviso legal y política de privacidad" } },
      ],
    },
    formFields: [
      { key: "name", label: "Nombre", type: "text", required: true },
      { key: "email", label: "Email", type: "email", required: true },
      { key: "phone", label: "Teléfono", type: "tel", required: true },
      { key: "when", label: "¿Cuándo te viene mejor?", type: "select", required: false, options: ["Mañanas", "Tardes", "Me da igual"] },
    ],
    emailTemplate: { subject: "Hemos recibido tu solicitud, {{nombre}}", intro: "Gracias por escribirnos.", whatsNext: "Te llamamos en menos de 24 h laborables para darte cita.", signature: "Nordic Clinic · Ruzafa, Valencia · 963 000 000" },
    status: "published", publishedAt: d(10),
  },
  {
    id: "ld_rivas", clientId: "c_rivas", offerId: "of_rivas_previt", slug: "pre-itv",
    blocks: {
      blocks: [
        { id: "b1", visible: true, block: { type: "hero", headline: "Pasa la ITV a la primera, por 39 €", subheadline: "Revisión de 25 puntos con presupuesto cerrado. Te enseñamos lo que falla antes de tocarlo.", ctaLabel: "Pedir hora", imageAssetId: null } },
        { id: "b2", visible: true, block: { type: "benefits", title: "Qué revisamos", items: [
          { title: "Frenos y suspensión", body: "Los dos motivos de rechazo más habituales." },
          { title: "Luces y emisiones", body: "Medidas con el equipo, no a ojo." },
          { title: "Presupuesto cerrado", body: "Si hay que arreglar algo, el precio es el que te decimos." },
        ] } },
        { id: "b3", visible: true, block: { type: "how", title: "Cómo va", steps: [
          { title: "1. Traes el coche", body: "Sin cita previa si vienes por la mañana." },
          { title: "2. Te llamamos", body: "Con lo que hemos visto y lo que cuesta." },
        ] } },
        { id: "b4", visible: false, block: { type: "proof", title: "Prueba social", quotes: [], stats: [] } },
        { id: "b5", visible: false, block: { type: "faq", title: "Dudas", items: [
          { q: "¿Lleváis el coche a la ITV?", a: "Si lo necesitas, sí." },
          { q: "¿Y si no pasa?", a: "Te decimos por qué antes de ir." },
          { q: "¿Coche de sustitución?", a: "Incluido si el arreglo pasa del día." },
        ] } },
        { id: "b6", visible: true, block: { type: "form", title: "Pide hora", subtitle: "Te llamamos hoy mismo.", submitLabel: "Pedir hora" } },
        { id: "b7", visible: true, block: { type: "footer", legalHtml: "Talleres Rivas S.L. · Aviso legal y política de privacidad" } },
      ],
    },
    publishedBlocks: null,
    formFields: [
      { key: "name", label: "Nombre", type: "text", required: true },
      { key: "phone", label: "Teléfono", type: "tel", required: true },
      { key: "plate", label: "Matrícula", type: "text", required: false },
    ],
    emailTemplate: null, status: "draft", publishedAt: null,
  },
];

const NAMES = ["Marta Gil","Andrés Pons","Lucía Ferrer","Javier Soler","Nuria Camps","Óscar Benet","Pilar Roig","Iván Mora","Teresa Alós","Rubén Lax","Carmen Vidal","Diego Sanchis","Elena Bosch","Pau Ribes"];
const EMAILSTATES: Lead["emailStatus"][] = ["delivered","delivered","delivered","delivered","bounced","delivered","delivered","sent","delivered","delivered","delivered","complained","delivered","delivered"];

const nordicLeads: Lead[] = NAMES.map((name, i): Lead => {
  const creative = adCreatives.filter((c) => c.clientId === "c_nordic")[i % 6];
  const slug = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, ".");
  return {
    id: `ld_n_${i + 1}`, clientId: "c_nordic", landingId: "ld_nordic", adCreativeId: creative.id,
    name, email: `${slug}@example.com`, phone: `+3460000${String(1000 + i).slice(-4)}`,
    answers: { when: ["Mañanas", "Tardes", "Me da igual"][i % 3] },
    utm: { source: "facebook", medium: "paid", campaign: "Nordic · Primera visita", content: creative.id, term: null },
    fbclid: `IwAR${i}xQ9d`, consent: true,
    consentText: "He leído y acepto la política de privacidad. Nordic Clinic tratará mis datos para responder a esta solicitud.",
    eventId: `4f1a${i}b2c-0000-4000-8000-00000000000${i % 10}`,
    emailStatus: EMAILSTATES[i], createdAt: d(i < 6 ? i : i + 4),
  };
});

export const leads: Lead[] = [
  ...nordicLeads,
  { id: "ld_r_1", clientId: "c_rivas", landingId: "ld_rivas", adCreativeId: null, name: "Sergio Palau", email: "sergio.palau@example.com", phone: "+34600111222", answers: { plate: "1234 KLM" }, utm: { source: "direct", medium: null, campaign: null, content: null, term: null }, fbclid: null, consent: true, consentText: "Acepto la política de privacidad.", eventId: "9a2b1c3d-0000-4000-8000-000000000001", emailStatus: "delivered", createdAt: d(3) },
];

export const aiJobs: AiJob[] = [
  { id: "aj_1", clientId: "c_nordic", kind: "brand_kit.extract", provider: "firecrawl", model: null, status: "succeeded", externalId: null, inputTokens: null, outputTokens: null, cacheReadTokens: null, costUsd: 0.012, error: null, createdAt: d(53), finishedAt: d(53) },
  { id: "aj_2", clientId: "c_nordic", kind: "brand_kit.extract", provider: "anthropic", model: "claude-opus-5", status: "succeeded", externalId: null, inputTokens: 24_180, outputTokens: 3_940, cacheReadTokens: 0, costUsd: 0.2194, error: null, createdAt: d(53), finishedAt: d(53) },
  { id: "aj_3", clientId: "c_nordic", kind: "copy.generate", provider: "anthropic", model: "claude-opus-5", status: "succeeded", externalId: null, inputTokens: 5_120, outputTokens: 2_260, cacheReadTokens: 18_400, costUsd: 0.0871, error: null, createdAt: d(12), finishedAt: d(12) },
  { id: "aj_4", clientId: "c_nordic", kind: "image.generate", provider: "higgsfield", model: "marketing-studio/image", status: "succeeded", externalId: "d7e6c0f3-6699-4f6c-bb45-2ad7fd9158ff", inputTokens: null, outputTokens: null, cacheReadTokens: null, costUsd: 0.564, error: null, createdAt: d(12), finishedAt: d(12) },
  { id: "aj_5", clientId: "c_nordic", kind: "landing.generate", provider: "anthropic", model: "claude-opus-5", status: "succeeded", externalId: null, inputTokens: 4_980, outputTokens: 5_310, cacheReadTokens: 18_400, costUsd: 0.1576, error: null, createdAt: d(10), finishedAt: d(10) },
  { id: "aj_6", clientId: "c_rivas", kind: "image.generate", provider: "higgsfield", model: "soul-2", status: "failed", externalId: "a1b2c3d4-0000-4000-8000-000000000002", inputTokens: null, outputTokens: null, cacheReadTokens: null, costUsd: 0, error: "nsfw: la petición fue moderada. No se ha cobrado.", createdAt: d(5), finishedAt: d(5) },
  { id: "aj_7", clientId: "c_boix", kind: "brand_kit.extract", provider: "firecrawl", model: null, status: "running", externalId: null, inputTokens: null, outputTokens: null, cacheReadTokens: null, costUsd: null, error: null, createdAt: d(0), finishedAt: null },
];

export const integrations: Integration[] = [
  { clientId: "c_nordic", provider: "meta", connected: true, meta: { adAccountId: "act_402918374", pageId: "10219384756", pixelId: "738201947382019" } },
  { clientId: "c_nordic", provider: "resend", connected: true, meta: { sendingDomain: "correo.nordicclinic.es" } },
  { clientId: "c_rivas", provider: "meta", connected: false, meta: {} },
  { clientId: "c_rivas", provider: "resend", connected: false, meta: {} },
  { clientId: "c_boix", provider: "meta", connected: false, meta: {} },
  { clientId: "c_boix", provider: "resend", connected: false, meta: {} },
];
