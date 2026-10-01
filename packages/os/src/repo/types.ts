/**
 * MODELO DE DATOS DEL MVP.
 *
 * Es el mismo esquema que generará Supabase en el Sprint 1 — nombres en inglés,
 * `clientId` en todo. Escribir esto bien ahora es la mitad de ese sprint: las pantallas
 * se construyen contra estos tipos y el cambio de origen de datos no las toca.
 */

export type ClientStatus = "onboarding" | "active" | "paused";

export type Client = {
  id: string;
  slug: string;
  name: string;
  websiteUrl: string | null;
  status: ClientStatus;
  createdAt: string;
};

// --- Brand Kit -------------------------------------------------------------

export type BrandKitStatus = "draft" | "extracting" | "extracted" | "approved";

/** Marca de procedencia por campo: distingue lo sugerido por IA de lo revisado. */
export type FieldOrigin = "suggested" | "reviewed" | "empty";

export type Identity = {
  logoLightPath: string | null;
  logoDarkPath: string | null;
  colors: {
    primary: string | null;
    secondary: string | null;
    accent: string | null;
    background: string | null;
    textPrimary: string | null;
  };
  fonts: { heading: string | null; body: string | null };
  colorScheme: "light" | "dark" | null;
  borderRadius: string | null;
  photoStyle: string | null;
  /** Qué modelo de imagen usar. Marketing Studio es el único que acepta referencias. */
  imageModel: "soul-2" | "marketing-studio" | null;
};

export type Voice = {
  tone: string[];
  address: "tu" | "usted" | null;
  wordsToUse: string[];
  wordsToAvoid: string[];
  sampleCopy: string[];
};

/** Cada afirmación lleva de dónde salió: revisar es comprobar, no leer y confiar. */
export type Sourced<T> = { value: T; sourceUrl: string | null };

export type Business = {
  valueProposition: Sourced<string> | null;
  services: Sourced<string>[];
  differentiators: Sourced<string>[];
  proof: Sourced<string>[];
  geo: string | null;
};

export type Persona = {
  profile: string;
  pains: string[];
  desires: string[];
  objections: string[];
};

export type Legal = {
  privacyUrl: string | null;
  controller: string | null;
  consentText: string | null;
  /** Decisión legal del cliente, no ajuste técnico. Por defecto, sólo con consentimiento. */
  capiLegalBasis: "consent" | "legitimate_interest";
};

export type BrandKit = {
  id: string;
  clientId: string;
  status: BrandKitStatus;
  version: number;
  identity: Identity;
  voice: Voice;
  business: Business;
  personas: Persona[];
  legal: Legal;
  origins: Record<string, FieldOrigin>;
  approvedAt: string | null;
  approvedBy: string | null;
};

// --- Ofertas ---------------------------------------------------------------

export type Offer = {
  id: string;
  clientId: string;
  brandKitId: string;
  name: string;
  what: string;
  hook: string | null;
  personaIndex: number | null;
  cta: MetaCta;
  endsAt: string | null;
  createdAt: string;
};

// --- Creatividades ---------------------------------------------------------

export type Angle = "pain" | "benefit" | "social_proof" | "urgency" | "objection";

/** Valores exactos de `call_to_action.type` de la Marketing API: cero traducción después. */
export type MetaCta =
  | "LEARN_MORE"
  | "SIGN_UP"
  | "GET_QUOTE"
  | "CONTACT_US"
  | "BOOK_NOW"
  | "DOWNLOAD";

export type CreativeStatus = "generating" | "generated" | "reviewed" | "approved" | "discarded";

export type AdFormat = "3:4" | "4:5" | "1:1" | "9:16";

export type Asset = {
  id: string;
  clientId: string;
  parentAssetId: string | null;
  kind: "logo" | "client_photo" | "generated" | "overlay";
  format: AdFormat | null;
  storagePath: string;
  width: number | null;
  height: number | null;
  origin: "upload" | "firecrawl" | "higgsfield";
  aiJobId: string | null;
  createdAt: string;
};

export type AdCreative = {
  id: string;
  clientId: string;
  offerId: string;
  angle: Angle;
  variant: number;
  primaryText: string;
  headline: string;
  description: string;
  cta: MetaCta;
  masterAssetId: string | null;
  status: CreativeStatus;
  metaAdId: string | null;
  createdAt: string;
};

// --- Campañas --------------------------------------------------------------

export type CampaignStatus = "draft" | "creating" | "created_paused" | "failed";

export type Campaign = {
  id: string;
  clientId: string;
  offerId: string;
  objective: "OUTCOME_LEADS" | "OUTCOME_TRAFFIC";
  dailyBudgetCents: number;
  geo: string;
  ageMin: number;
  ageMax: number;
  metaCampaignId: string | null;
  metaAdsetId: string | null;
  status: CampaignStatus;
  error: string | null;
  createdAt: string;
};

// --- Landings --------------------------------------------------------------

export type FormField = {
  key: string;
  label: string;
  type: "text" | "email" | "tel" | "select" | "textarea";
  required: boolean;
  options?: string[];
};

export type Landing = {
  id: string;
  clientId: string;
  offerId: string;
  slug: string;
  blocks: unknown;
  publishedBlocks: unknown | null;
  formFields: FormField[];
  emailTemplate: { subject: string; intro: string; whatsNext: string; signature: string } | null;
  status: "draft" | "published";
  publishedAt: string | null;
};

// --- Leads -----------------------------------------------------------------

export type EmailStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "bounced"
  | "complained"
  | "failed";

export type Lead = {
  id: string;
  clientId: string;
  landingId: string | null;
  adCreativeId: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  answers: Record<string, string>;
  utm: {
    source: string | null;
    medium: string | null;
    campaign: string | null;
    content: string | null;
    term: string | null;
  };
  fbclid: string | null;
  consent: boolean;
  consentText: string | null;
  eventId: string;
  emailStatus: EmailStatus;
  createdAt: string;
};

// --- Trazabilidad de IA ----------------------------------------------------

export type AiJobStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

export type AiJob = {
  id: string;
  clientId: string;
  kind: string;
  provider: "anthropic" | "higgsfield" | "firecrawl" | "meta" | "resend";
  model: string | null;
  status: AiJobStatus;
  externalId: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  cacheReadTokens: number | null;
  costUsd: number | null;
  error: string | null;
  createdAt: string;
  finishedAt: string | null;
};

export type Integration = {
  clientId: string;
  provider: "meta" | "resend";
  connected: boolean;
  meta: Record<string, string>;
};
