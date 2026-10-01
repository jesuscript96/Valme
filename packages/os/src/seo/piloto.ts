/**
 * Revisión externa de valmesolutions.com (27 sep 2026), traída de VALME Search OS.
 * Cinco hallazgos y las ocho páginas revisadas. Se importa como revisión, no como
 * ejecución automática: los impactos son cualitativos y no se inventan cifras.
 *
 * Generado desde public/v2/valme-pilot-evidence.json y valme-pilot.js de Search OS.
 */
import type { Confianza, Prioridad, Servicio } from "./tipos";

export const PILOTO_DOMINIOS = ["valmesolutions.com", "www.valmesolutions.com"];

export const PILOTO: {
  revisor: string;
  observadoEn: string;
  metodo: string;
  evidencias: { clave: string; url: string; observado: string }[];
  hallazgos: {
    titulo: string; descripcion: string; impacto: string; recomendacion: string;
    categoria: string; servicio: Servicio; prioridad: Prioridad; confianza: Confianza;
    fuentes: string[]; claves: string[]; limitaciones: string[];
  }[];
} = {
  "revisor": "Revisión externa (Codex)",
  "observadoEn": "2026-09-27T21:23:21.334Z",
  "metodo": "HTTP HTML parsing; no browser rendering or Search Console",
  "evidencias": [
    {
      "clave": "/",
      "url": "https://www.valmesolutions.com/",
      "observado": "HTTP 200 · Título: Valme Solutions | Tu departamento de marketing, sin montarlo · H1: Hacer buen marketing es difícil.Tenerlo, no. · Canonical: https://www.valmesolutions.com"
    },
    {
      "clave": "/areas/revenue-operations",
      "url": "https://www.valmesolutions.com/areas/revenue-operations",
      "observado": "HTTP 200 · Título: Revenue Operations | Valme Solutions · H1: Revenue Operations · Canonical: https://www.valmesolutions.com/areas/revenue-operations"
    },
    {
      "clave": "/areas/internal-operations",
      "url": "https://www.valmesolutions.com/areas/internal-operations",
      "observado": "HTTP 200 · Título: Internal Operations | Valme Solutions · H1: Internal Operations · Canonical: https://www.valmesolutions.com/areas/internal-operations"
    },
    {
      "clave": "/areas/administrative-operations",
      "url": "https://www.valmesolutions.com/areas/administrative-operations",
      "observado": "HTTP 200 · Título: Administrative Operations | Valme Solutions · H1: Administrative Operations · Canonical: https://www.valmesolutions.com/areas/administrative-operations"
    },
    {
      "clave": "/areas/executive-intelligence",
      "url": "https://www.valmesolutions.com/areas/executive-intelligence",
      "observado": "HTTP 200 · Título: Executive Intelligence | Valme Solutions · H1: Executive Intelligence · Canonical: https://www.valmesolutions.com/areas/executive-intelligence"
    },
    {
      "clave": "/casos/ceo-sin-visibilidad-marketing",
      "url": "https://www.valmesolutions.com/casos/ceo-sin-visibilidad-marketing",
      "observado": "HTTP 200 · Título: El CEO que dejó de preguntar en qué se iba el dinero de marketing | Casos de éxito · Valme Solutions · H1: El CEO que dejó de preguntar en qué se iba el dinero de marketing · Canonical: https://www.valmesolutions.com/casos/ceo-sin-visibilidad-marketing"
    },
    {
      "clave": "/casos/atribucion-canal-rentable",
      "url": "https://www.valmesolutions.com/casos/atribucion-canal-rentable",
      "observado": "HTTP 200 · Título: Su mejor canal era el que menos leads traía | Casos de éxito · Valme Solutions · H1: Su mejor canal era el que menos leads traía · Canonical: https://www.valmesolutions.com/casos/atribucion-canal-rentable"
    },
    {
      "clave": "/casos/paid-con-seo-desde-cero",
      "url": "https://www.valmesolutions.com/casos/paid-con-seo-desde-cero",
      "observado": "HTTP 200 · Título: Empezaron de cero: paid para vender ya, SEO para dejar de depender de él | Casos de éxito · Valme Solutions · H1: Empezaron de cero: paid para vender ya, SEO para dejar de depender de él · Canonical: https://www.valmesolutions.com/casos/paid-con-seo-desde-cero"
    }
  ],
  "hallazgos": [
    {
      "titulo": "Dar una página propia a la oferta de marketing",
      "descripcion": "Las ocho URL del sitemap incluyen la portada, cuatro áreas de operaciones y tres casos. En esta muestra no aparece una página dedicada al departamento de marketing externo.",
      "impacto": "Claridad de la oferta principal para visitantes y buscadores. Sin medición todavía.",
      "recomendacion": "Preparar una página de oferta para pymes B2B y enlazarla desde portada y casos. Validar la demanda antes de ampliar el contenido.",
      "categoria": "contenido",
      "servicio": "Contenidos",
      "prioridad": "alta",
      "confianza": "alta",
      "fuentes": [
        "https://www.valmesolutions.com/sitemap.xml"
      ],
      "claves": [
        "/",
        "/areas/revenue-operations",
        "/areas/internal-operations",
        "/areas/administrative-operations",
        "/areas/executive-intelligence",
        "/casos/ceo-sin-visibilidad-marketing",
        "/casos/atribucion-canal-rentable",
        "/casos/paid-con-seo-desde-cero"
      ],
      "limitaciones": [
        "Revisión HTTP de ocho páginas públicas, sin renderizado ni Search Console."
      ]
    },
    {
      "titulo": "Explicar la oferta en el encabezado de portada",
      "descripcion": "El H1 usa un eslogan; el texto de apoyo explica el departamento de marketing. Las páginas de áreas usan nombres de operaciones en inglés.",
      "impacto": "Comprensión inmediata de qué ofrece VALME al llegar a la portada. Sin medición todavía.",
      "recomendacion": "Probar un encabezado descriptivo: Tu departamento de marketing externo para pymes B2B. Conservar el eslogan como apoyo y aclarar la relación con las áreas de operaciones.",
      "categoria": "contenido",
      "servicio": "Contenidos",
      "prioridad": "alta",
      "confianza": "media",
      "fuentes": [
        "https://www.valmesolutions.com/"
      ],
      "claves": [
        "/"
      ],
      "limitaciones": [
        "Revisión HTTP de ocho páginas públicas, sin renderizado ni Search Console."
      ]
    },
    {
      "titulo": "Respaldar un caso de éxito con datos verificables",
      "descripcion": "Los tres casos explican intervenciones y beneficios cualitativos. En el contenido auditado no se publican comparaciones numéricas antes/después ni fuentes para verificarlas.",
      "impacto": "Credibilidad de los casos ante clientes potenciales y asistentes de IA. Sin medición todavía.",
      "recomendacion": "Completar un caso con periodo, métrica, resultado y fuente autorizada. Si es un escenario ilustrativo, identificarlo como tal. No inventar cifras.",
      "categoria": "eeat",
      "servicio": "Contenidos",
      "prioridad": "alta",
      "confianza": "alta",
      "fuentes": [
        "https://www.valmesolutions.com/casos/atribucion-canal-rentable"
      ],
      "claves": [
        "/casos/ceo-sin-visibilidad-marketing",
        "/casos/atribucion-canal-rentable",
        "/casos/paid-con-seo-desde-cero"
      ],
      "limitaciones": [
        "Revisión HTTP de ocho páginas públicas, sin renderizado ni Search Console."
      ]
    },
    {
      "titulo": "Resolver preguntas de contratación y presentar al equipo",
      "descripcion": "La muestra enlaza LinkedIn y presenta Organization en JSON-LD. No se encontró una página dedicada de equipo entre los enlaces auditados.",
      "impacto": "Confianza para contratar: quién hay detrás y qué incluye el servicio. Sin medición todavía.",
      "recomendacion": "Añadir responsables reales y respuestas sobre alcance, costes excluidos, medición y colaboración. Validar las condiciones comerciales; no prometer posiciones ni citas en IA.",
      "categoria": "eeat",
      "servicio": "Contenidos",
      "prioridad": "media",
      "confianza": "media",
      "fuentes": [
        "https://www.valmesolutions.com/"
      ],
      "claves": [
        "/"
      ],
      "limitaciones": [
        "Revisión HTTP de ocho páginas públicas, sin renderizado ni Search Console."
      ]
    },
    {
      "titulo": "Establecer una línea base de captación",
      "descripcion": "No se consultaron Search Console, GA4 ni CRM. La indexación, el tráfico y las conversiones siguen sin verificar; no se afirma que falte analítica.",
      "impacto": "Sin línea base no se podrá demostrar el efecto de las mejoras.",
      "recomendacion": "Comprobar Search Console y distinguir clic en WhatsApp, contacto y oportunidad cualificada. Registrar una línea base antes de publicar mejoras.",
      "categoria": "search_console",
      "servicio": "Analítica",
      "prioridad": "alta",
      "confianza": "baja",
      "fuentes": [
        "https://www.valmesolutions.com/"
      ],
      "claves": [
        "/"
      ],
      "limitaciones": [
        "Revisión HTTP de ocho páginas públicas, sin renderizado ni Search Console.",
        "No se consultaron Search Console, GA4 ni CRM."
      ]
    }
  ]
};
