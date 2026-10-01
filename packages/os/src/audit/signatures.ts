/**
 * CATÁLOGO DE TAGS Y PÍXELES.
 *
 * Cada firma tiene dos formas de detectarse y NO valen lo mismo:
 *
 *   `objeto`  — la variable global o el objeto que deja la herramienta al ejecutarse.
 *               Es la prueba: si existe, la herramienta está cargada de verdad.
 *   `peticion`— el dominio al que llama. Confirma que además se ejecuta.
 *   `id`      — patrón para extraer el identificador de la cuenta.
 *
 * Buscar solo el nombre de la función en el HTML da falsos positivos: `fbq(` aparece en
 * comentarios, en documentación y en bundles que nunca se ejecutan. La comprobación
 * autorizada es la de runtime, con el navegador cargando la página de verdad.
 */

export type Firma = {
  clave: string;
  nombre: string;
  /** Globales de `window` que deja al cargarse. */
  objetos: string[];
  /** Fragmentos de host de las peticiones de red que dispara. */
  peticiones: string[];
  /** Patrón del identificador de cuenta, buscado en el HTML y en los bundles. */
  id?: RegExp;
  categoria: "medicion" | "paid" | "crm" | "soporte" | "cro" | "agenda";
};

export const FIRMAS: Firma[] = [
  { clave: "meta_pixel", nombre: "Meta Pixel", categoria: "paid",
    objetos: ["fbq"], peticiones: ["connect.facebook.net", "facebook.com/tr"],
    id: /fbq\(\s*['"]init['"]\s*,\s*['"](\d{8,20})['"]/ },

  { clave: "ga4", nombre: "Google Analytics 4", categoria: "medicion",
    objetos: ["gtag", "dataLayer"], peticiones: ["google-analytics.com/g/collect", "googletagmanager.com/gtag/js"],
    id: /\b(G-[A-Z0-9]{8,12})\b/ },

  { clave: "gtm", nombre: "Google Tag Manager", categoria: "medicion",
    objetos: ["google_tag_manager"], peticiones: ["googletagmanager.com/gtm.js"],
    id: /\b(GTM-[A-Z0-9]{6,9})\b/ },

  { clave: "google_ads", nombre: "Google Ads (conversión)", categoria: "paid",
    objetos: [], peticiones: ["googleadservices.com", "google.com/pagead"],
    id: /\b(AW-\d{9,12})\b/ },

  { clave: "tiktok", nombre: "TikTok Pixel", categoria: "paid",
    objetos: ["ttq"], peticiones: ["analytics.tiktok.com"] },

  { clave: "linkedin", nombre: "LinkedIn Insight Tag", categoria: "paid",
    objetos: ["_linkedin_data_partner_ids"], peticiones: ["snap.licdn.com"],
    id: /_linkedin_partner_id\s*=\s*["'](\d+)["']/ },

  { clave: "hubspot", nombre: "HubSpot", categoria: "crm",
    objetos: ["_hsq", "HubSpotConversations"], peticiones: ["js.hs-scripts.com", "hsforms.net"] },

  { clave: "salesforce", nombre: "Salesforce / Pardot", categoria: "crm",
    objetos: ["pi"], peticiones: ["pardot.com", "salesforce.com"] },

  { clave: "hotjar", nombre: "Hotjar", categoria: "cro",
    objetos: ["hj"], peticiones: ["static.hotjar.com"] },

  { clave: "clarity", nombre: "Microsoft Clarity", categoria: "cro",
    objetos: ["clarity"], peticiones: ["clarity.ms"] },

  { clave: "intercom", nombre: "Intercom", categoria: "soporte",
    objetos: ["Intercom"], peticiones: ["widget.intercom.io"] },

  { clave: "crisp", nombre: "Crisp", categoria: "soporte",
    objetos: ["$crisp"], peticiones: ["client.crisp.chat"] },

  { clave: "tawk", nombre: "Tawk.to", categoria: "soporte",
    objetos: ["Tawk_API"], peticiones: ["embed.tawk.to"] },

  { clave: "calendly", nombre: "Calendly", categoria: "agenda",
    objetos: ["Calendly"], peticiones: ["calendly.com"] },

  { clave: "cal_com", nombre: "Cal.com", categoria: "agenda",
    objetos: ["Cal"], peticiones: ["cal.com"] },

  { clave: "optimizely", nombre: "Optimizely", categoria: "cro",
    objetos: ["optimizely"], peticiones: ["optimizely.com"] },

  { clave: "vwo", nombre: "VWO", categoria: "cro",
    objetos: ["VWO", "_vwo_code"], peticiones: ["visualwebsiteoptimizer.com"] },
];

/**
 * Grado de certeza de una detección. El informe distingue las tres: decir «tienes el
 * píxel instalado» cuando solo aparece el script en un bundle es una afirmación que el
 * cliente puede desmentir en diez segundos.
 */
export type Deteccion = {
  clave: string;
  nombre: string;
  categoria: Firma["categoria"];
  /** `confirmado` = el objeto existe en runtime. `probable` = solo hay rastro estático. */
  certeza: "confirmado" | "probable" | "ausente";
  /** Identificador de cuenta, si se ha podido extraer. */
  cuenta?: string;
  /** Si además dispara peticiones: está cargado Y funcionando. */
  activo: boolean;
};
