import type { Hallazgo } from "@/os/audit/types";
import type { EjecucionAuditoria, Lead } from "./types";

/**
 * Datos de demo del lado Diagnóstico. Se sustituyen por Supabase cuando llegue.
 *
 * Los hallazgos guardados son los que produjo el motor de reglas de verdad al ejecutarlo
 * contra estos dominios. No están inventados a mano: si se cambia una regla, lo que
 * saldrá en la próxima ejecución cambia igual.
 */

const d = (dias: number) => new Date(Date.now() - dias * 86_400_000).toISOString();

export const leads: Lead[] = [
  {
    id: "ld_1", empresa: "Nordic Clinic", dominio: "nordicclinic.es",
    contacto: "Elena Vidal", email: "elena@nordicclinic.es", telefono: "+34963000000",
    mensaje: "Invertimos en Meta desde hace un año y no sabemos si funciona.",
    origen: "Formulario web", estado: "ganado", clienteSlug: "nordic-clinic", recibidoEn: d(64),
  },
  {
    id: "ld_2", empresa: "Taller Rivas", dominio: "tallerrivas.com",
    contacto: "Sergio Rivas", email: "sergio@tallerrivas.com", telefono: "+34961111111",
    mensaje: "Queremos empezar a captar clientes por internet.",
    origen: "Recomendación", estado: "ganado", clienteSlug: "taller-rivas", recibidoEn: d(31),
  },
  {
    id: "ld_3", empresa: "Casa Boix", dominio: "casaboix.es",
    contacto: "Marta Boix", email: "marta@casaboix.es", telefono: null,
    mensaje: "Nos han dicho que necesitamos estar en Google.",
    origen: "Formulario web", estado: "auditado", clienteSlug: null, recibidoEn: d(3),
  },
  {
    id: "ld_4", empresa: "Grupo Almenar", dominio: "almenar.example",
    contacto: "Pablo Almenar", email: "pablo@almenar.example", telefono: "+34962222222",
    mensaje: "Tenemos agencia pero no vemos resultados. Queremos una segunda opinión.",
    origen: "LinkedIn", estado: "nuevo", clienteSlug: null, recibidoEn: d(1),
  },
  {
    id: "ld_5", empresa: "Cerámicas Ponent", dominio: "ponent.example",
    contacto: null, email: "info@ponent.example", telefono: null, mensaje: null,
    origen: "Formulario web", estado: "nuevo", clienteSlug: null, recibidoEn: d(0),
  },
];

const H = (
  id: string, funcion: Hallazgo["funcion"], titulo: string, situacion: string,
  consecuencia: string, solucion: string, gravedad: Hallazgo["gravedad"],
  evidencia: string[], positivo = false,
): Hallazgo => ({
  id, funcion, titulo, situacion, consecuencia, solucion, gravedad,
  confianza: "alta", evidencia, positivo,
});

const resumir = (hs: Hallazgo[]) => ({
  p0: hs.filter((h) => !h.positivo && h.gravedad === "p0").length,
  p1: hs.filter((h) => !h.positivo && h.gravedad === "p1").length,
  p2: hs.filter((h) => !h.positivo && h.gravedad === "p2").length,
  p3: hs.filter((h) => !h.positivo && h.gravedad === "p3").length,
  positivos: hs.filter((h) => h.positivo).length,
});

const boixWeb: Hallazgo[] = [
  H("sin_medicion", 8, "La web no tiene ninguna herramienta de medición",
    "Al cargar la página no se ejecuta ninguna herramienta de analítica, ni gestor de etiquetas, ni píxel de ninguna plataforma.",
    "No hay datos de lo que pasa en la web: ni cuánta gente entra, ni de dónde viene, ni qué hace. Cualquier inversión en captación que se haga ahora será imposible de evaluar después, y los primeros meses de datos no se recuperan.",
    "Instalar un gestor de etiquetas, medición de analítica con los eventos de conversión definidos y el píxel de las plataformas donde se vaya a invertir. Es lo primero, antes de gastar un euro en anuncios.",
    "p0", ["datos.herramientas"]),
  H("sin_formulario", 7, "La home no tiene formulario",
    "No hay ningún formulario en la página principal.",
    "Todo el que llega convencido tiene que buscar cómo contactar. Cada paso extra entre la decisión y el contacto se lleva una parte de los interesados, y no queda registro de los que se van.",
    "Poner un formulario corto en la home, con los campos mínimos, y medir su envío como conversión.",
    "p1", ["web.formularios"]),
  H("sin_dmarc", 8, "El dominio no tiene DMARC",
    "No existe registro DMARC en el DNS del dominio.",
    "Sin DMARC, los proveedores de correo no saben qué hacer con los mensajes que dicen venir del dominio y no superan la comprobación. Una parte del correo comercial acaba en spam sin que nadie lo sepa.",
    "Publicar un registro DMARC empezando en p=none con dirección de informes, leer dos semanas de datos y endurecer a quarantine.",
    "p1", ["datos.dmarc"]),
  H("sin_telefono", 7, "No hay teléfono visible",
    "La página no incluye ningún enlace de teléfono.",
    "Parte de los interesados quiere llamar antes de dejar sus datos. Sin teléfono a la vista, esos se van.",
    "Poner el teléfono como enlace tel: en la cabecera y en el pie.",
    "p3", ["web.telefono"]),
];

const boixSeo: Hallazgo[] = [
  H("sin_datos_estructurados", 3, "Sin datos estructurados",
    "La home no declara ningún bloque JSON-LD.",
    "Los buscadores y los asistentes tienen que deducir qué es la empresa a partir del texto. Con schema se les dice explícitamente, y es lo que alimenta las fichas y las respuestas generadas.",
    "Añadir al menos Organization y, por tener sede física, LocalBusiness.",
    "p2", ["seo.jsonld"]),
  H("sin_sitemap", 3, "No hay sitemap",
    "El dominio no sirve un fichero sitemap.xml.",
    "Los buscadores tienen que descubrir las páginas siguiendo enlaces. Lo que esté a más de tres clics de la home puede tardar semanas en indexarse o no indexarse nunca.",
    "Generar el sitemap, declararlo en robots.txt y darlo de alta en Search Console.",
    "p2", ["seo.sitemap"]),
  H("sin_llmstxt", 3, "No hay llms.txt",
    "El dominio no sirve un fichero llms.txt.",
    "Cada vez más gente busca proveedores preguntando a un asistente en vez de a un buscador. llms.txt es la forma de decirle a esos sistemas qué hace la empresa.",
    "Publicar un llms.txt en la raíz con la descripción del negocio y los enlaces a las páginas que deberían citarse.",
    "p3", ["seo.llmstxt"]),
  H("https_ok", 3, "El sitio resuelve limpio a HTTPS",
    "Las cuatro variantes del dominio acaban en el mismo destino seguro y en un solo salto.",
    "No se pierde autoridad por redirecciones encadenadas y no hay contenido duplicado entre variantes.",
    "Mantenerlo al cambiar de proveedor o de dominio.",
    "p3", ["seo.https", "seo.redirecciones"], true),
];

const nordicPaid: Hallazgo[] = [
  H("pixel_sin_eventos", 2, "El píxel carga pero no dispara eventos",
    "El píxel de Meta se ejecuta en la página y no se ha observado ningún evento al navegar.",
    "Meta optimiza hacia el evento que se le indique. Sin eventos solo puede optimizar a clic, que es la señal más barata y la menos relacionada con vender.",
    "Definir los eventos de conversión del negocio, implementarlos y verificarlos en el administrador de eventos.",
    "p1", ["paid.pixel_meta", "paid.pixel_eventos"]),
  H("pixel_sin_capi", 2, "Medición dependiente del navegador",
    "Hay píxel y hay aviso de cookies. No se ha podido comprobar desde fuera si además se envían eventos por servidor.",
    "Todo lo que dependa solo del navegador se pierde con el rechazo de cookies y con los bloqueadores.",
    "Comprobar si está configurada la Conversions API y, si no lo está, implementarla deduplicando con el mismo identificador de evento que el píxel.",
    "p2", ["paid.pixel_meta", "web.cookies"]),
];

export const ejecuciones: EjecucionAuditoria[] = [
  {
    id: "au_1", leadId: "ld_3", dominio: "casaboix.es", herramienta: "web",
    ejecutadaEn: d(3), duracionMs: 24_100, señales: 13,
    resumen: resumir(boixWeb), hallazgos: boixWeb,
    fuentesNoDisponibles: [{
      fuente: "PageSpeed y CrUX",
      motivo: "Falta PAGESPEED_API_KEY. Sin clave, la cuota anónima compartida está siempre agotada.",
    }],
  },
  {
    id: "au_2", leadId: "ld_3", dominio: "casaboix.es", herramienta: "seo",
    ejecutadaEn: d(3), duracionMs: 31_400, señales: 21,
    resumen: resumir(boixSeo), hallazgos: boixSeo, fuentesNoDisponibles: [],
  },
  {
    id: "au_3", leadId: "ld_1", dominio: "nordicclinic.es", herramienta: "paid",
    ejecutadaEn: d(60), duracionMs: 22_800, señales: 6,
    resumen: resumir(nordicPaid), hallazgos: nordicPaid,
    fuentesNoDisponibles: [{
      fuente: "Meta Ad Library",
      motivo: "Falta META_ADLIB_TOKEN. Sin él no se puede afirmar nada sobre sus anuncios.",
    }],
  },
];
