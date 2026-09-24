import { H, type Regla } from "./tipos";

/**
 * 03 · SEO, CONTENIDO Y GEO
 *
 * Señales disponibles:
 *   seo.robots · seo.robots_sitemap · seo.robots_bloqueo · seo.sitemap · seo.sitemap_urls
 *   seo.llmstxt · seo.https · seo.redirecciones · seo.404 · seo.h1 · seo.canonical
 *   seo.descripcion · seo.hreflang · seo.jsonld
 */
export const REGLAS: Regla[] = [
  {
    id: "robots_bloquea", funcion: 3, necesita: ["seo.robots_bloqueo"],
    evaluar: (v) => v.bool("seo.robots_bloqueo") ? H(
      "robots.txt bloquea el sitio entero",
      "El fichero robots.txt contiene una regla que impide el rastreo de todo el sitio.",
      "Los buscadores no pueden rastrear ninguna página. El tráfico orgánico tiende a cero y no se recupera hasta semanas después de quitarlo.",
      "Retirar la regla de bloqueo y solicitar el rastreo de las páginas principales.",
      "p0") : null,
  },
  {
    id: "sin_sitemap", funcion: 3, necesita: ["seo.sitemap"],
    evaluar: (v) => !v.bool("seo.sitemap") ? H(
      "No hay sitemap",
      "El dominio no sirve un fichero sitemap.xml.",
      "Los buscadores tienen que descubrir las páginas siguiendo enlaces. Lo que esté a más de tres clics de la home puede tardar semanas en indexarse o no indexarse nunca.",
      "Generar el sitemap, declararlo en robots.txt y darlo de alta en Search Console.",
      "p2") : null,
  },
  {
    id: "sitemap_sin_declarar", funcion: 3, necesita: ["seo.sitemap", "seo.robots_sitemap"],
    evaluar: (v) => v.bool("seo.sitemap") && !v.bool("seo.robots_sitemap") ? H(
      "El sitemap existe pero no está declarado",
      "Hay sitemap.xml, pero robots.txt no lo referencia.",
      "Los rastreadores que no tengan el sitemap dado de alta en su consola no lo encontrarán.",
      "Añadir la línea Sitemap: con la URL completa al final de robots.txt.",
      "p3") : null,
  },
  {
    id: "sin_llmstxt", funcion: 3, necesita: ["seo.llmstxt"],
    evaluar: (v) => !v.bool("seo.llmstxt") ? H(
      "No hay llms.txt",
      "El dominio no sirve un fichero llms.txt.",
      "Cada vez más gente busca proveedores preguntando a un asistente en vez de a un buscador. llms.txt es la forma de decirle a esos sistemas qué hace la empresa y qué páginas son las importantes.",
      "Publicar un llms.txt en la raíz con la descripción del negocio y los enlaces a las páginas que deberían citarse. Es media hora de trabajo.",
      "p3") : null,
  },
  {
    id: "h1_incorrecto", funcion: 3, necesita: ["seo.h1"],
    evaluar: (v) => v.num("seo.h1") !== 1 ? H(
      v.num("seo.h1") === 0 ? "La home no tiene H1" : "La home tiene varios H1",
      `Se han encontrado ${v.num("seo.h1")} encabezados de primer nivel.`,
      "El H1 es la señal más directa de de qué va la página. Sin él, o con varios compitiendo, se pierde claridad para buscadores y para lectores de pantalla.",
      "Dejar un único H1 por página que diga a qué se dedica la empresa.",
      "p2") : null,
  },
  {
    id: "404_devuelve_200", funcion: 3, necesita: ["seo.404"],
    evaluar: (v) => v.num("seo.404") === 200 ? H(
      "Las páginas inexistentes devuelven 200",
      "Una URL que no existe responde con código 200 en vez de 404.",
      "Los buscadores indexan páginas de error como si fueran contenido. Se diluye la autoridad del dominio y aparecen resultados vacíos en las búsquedas de marca.",
      "Devolver 404 en las URLs inexistentes, con una página de error que ofrezca salida.",
      "p2") : null,
  },
  {
    id: "redirecciones_largas", funcion: 3, necesita: ["seo.redirecciones"],
    evaluar: (v) => v.num("seo.redirecciones") > 2 ? H(
      "Cadena de redirecciones larga",
      `Desde http:// hasta el destino final hay ${v.num("seo.redirecciones")} saltos.`,
      "Cada salto añade latencia a la primera visita y diluye un poco la señal de enlaces.",
      "Redirigir en un solo salto desde cada variante del dominio al destino canónico.",
      "p3") : null,
  },
  {
    id: "sin_datos_estructurados", funcion: 3, necesita: ["seo.jsonld"],
    evaluar: (v) => v.lista("seo.jsonld").length === 0 ? H(
      "Sin datos estructurados",
      "La home no declara ningún bloque JSON-LD.",
      "Los buscadores y los asistentes tienen que deducir qué es la empresa a partir del texto. Con schema se les dice explícitamente, y es lo que alimenta las fichas y las respuestas generadas.",
      "Añadir al menos Organization y, si hay sede física, LocalBusiness. En las páginas de servicio, Service. En las de preguntas, FAQPage.",
      "p2") : null,
  },
];
