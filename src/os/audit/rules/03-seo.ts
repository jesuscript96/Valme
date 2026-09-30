import { H, type Regla } from "./tipos";

/**
 * 03 · SEO, CONTENIDO Y GEO
 *
 * Señales disponibles:
 *   seo.robots · seo.robots_sitemap · seo.robots_bloqueo · seo.sitemap · seo.sitemap_urls
 *   seo.llmstxt · seo.https · seo.redirecciones · seo.404 · seo.h1 · seo.canonical
 *   seo.descripcion · seo.hreflang · seo.jsonld · seo.title · seo.meta_robots · seo.lang
 *   seo.x_robots · seo.robots_bots_ia
 *   Rastreo: seo.crawl · seo.titles_duplicados · seo.titles_vacios · seo.desc_vacias
 *            seo.sin_h1 · seo.varios_h1
 *   GEO (herramienta «geo»): geo.categoria · geo.consultas · geo.menciones · geo.posicion
 *            geo.competidores
 *
 * Las reglas de indexación, title, descripción, idioma, bots de IA, rastreo y GEO vienen
 * de VALME Search OS.
 */

const NOINDEX = /noindex|none/i;
const ENTIDADES = /organization|localbusiness|professionalservice|corporation/i;
export const REGLAS: Regla[] = [
  {
    id: "indexacion_bloqueada_meta", funcion: 3, necesita: ["seo.meta_robots"],
    evaluar: (v) => NOINDEX.test(v.txt("seo.meta_robots") ?? "") ? H(
      "La home se declara no indexable",
      `La etiqueta meta robots dice «${v.txt("seo.meta_robots")}».`,
      "Los buscadores retiran la página de sus resultados. Si es un resto de la fase de desarrollo, la web entera puede estar desapareciendo sin que nadie lo note.",
      "Quitar noindex de la meta robots (o dejar index, follow) y pedir la reindexación en Search Console.",
      "p0") : null,
  },
  {
    id: "indexacion_bloqueada_cabecera", funcion: 3, necesita: ["seo.x_robots"],
    evaluar: (v) => NOINDEX.test(v.txt("seo.x_robots") ?? "") ? H(
      "El servidor pide no indexar la home",
      `La cabecera X-Robots-Tag dice «${v.txt("seo.x_robots")}».`,
      "Es una orden a nivel de servidor: aunque el HTML esté bien, los buscadores no indexan la página.",
      "Retirar noindex de la cabecera X-Robots-Tag en la configuración del servidor o del CDN.",
      "p0") : null,
  },
  {
    id: "sin_title", funcion: 3, necesita: ["seo.title"],
    evaluar: (v) => !v.txt("seo.title") ? H(
      "La home no tiene title",
      "No hay etiqueta title o está vacía.",
      "El title es el texto del enlace en los resultados de búsqueda. Sin él, el buscador se inventa uno y el clic cae.",
      "Escribir un title de 30 a 65 caracteres con lo que hace la empresa y la marca al final.",
      "p1") : null,
  },
  {
    id: "title_longitud", funcion: 3, necesita: ["seo.title"],
    evaluar: (v) => {
      const n = (v.txt("seo.title") ?? "").length;
      return n && (n < 30 || n > 65) ? H(
        `El title tiene ${n} caracteres`,
        `«${v.txt("seo.title")}».`,
        n < 30
          ? "Un title tan corto desaprovecha el espacio del resultado para decir qué se ofrece."
          : "Por encima de unos 60 caracteres el buscador lo corta y lo importante puede quedar fuera.",
        "Ajustarlo a 30-65 caracteres: primero lo que se ofrece, después la marca.",
        "p3", "media") : null;
    },
  },
  {
    id: "sin_descripcion", funcion: 3, necesita: ["seo.descripcion"],
    evaluar: (v) => !v.txt("seo.descripcion") ? H(
      "La home no tiene meta description",
      "No hay meta description.",
      "El buscador elige un trozo de texto al azar para el resultado. Es la única frase que se puede escribir pensando en el clic.",
      "Escribir una descripción de 70 a 160 caracteres con la propuesta y una razón para entrar.",
      "p2") : null,
  },
  {
    id: "descripcion_longitud", funcion: 3, necesita: ["seo.descripcion"],
    evaluar: (v) => {
      const n = (v.txt("seo.descripcion") ?? "").length;
      return n && (n < 70 || n > 160) ? H(
        `La meta description tiene ${n} caracteres`,
        "La descripción está fuera del rango en el que se muestra entera.",
        n < 70 ? "Demasiado corta para convencer a nadie de hacer clic." : "Se corta en el resultado y la parte final no se lee.",
        "Ajustarla a 70-160 caracteres.",
        "p3", "media") : null;
    },
  },
  {
    id: "sin_canonical", funcion: 3, necesita: ["seo.canonical"],
    evaluar: (v) => !v.txt("seo.canonical") ? H(
      "La home no declara canonical",
      "No hay enlace rel=canonical.",
      "Con variantes de la misma URL (con y sin barra, con parámetros de campaña) el buscador decide solo cuál indexar y reparte la señal entre ellas.",
      "Declarar la URL canónica en cada página, apuntándose a sí misma.",
      "p3") : null,
  },
  {
    id: "sin_idioma", funcion: 3, necesita: ["seo.lang"],
    evaluar: (v) => !v.txt("seo.lang") ? H(
      "El idioma de la página no está declarado",
      "La etiqueta html no tiene atributo lang.",
      "Buscadores, traductores y lectores de pantalla tienen que adivinar el idioma. Afecta a en qué búsquedas aparece y a la accesibilidad.",
      "Añadir lang=\"es\" (o el que toque) a la etiqueta html.",
      "p3") : null,
  },
  {
    id: "bots_ia_bloqueados", funcion: 3, necesita: ["seo.robots_bots_ia"],
    evaluar: (v) => {
      const bots = v.lista("seo.robots_bots_ia");
      return bots.length ? H(
        `robots.txt bloquea a asistentes de IA (${bots.join(", ")})`,
        `robots.txt prohíbe la raíz a: ${bots.join(", ")}.`,
        "Esos asistentes no pueden leer la web, así que no la citarán cuando alguien les pregunte por un proveedor. Puede ser una decisión consciente; si no lo es, es visibilidad perdida.",
        "Decidir qué asistentes se quieren permitir y quitar su bloqueo de robots.txt. Si hay contenido que proteger, bloquear solo esas rutas.",
        "p1") : H(
        "Los asistentes de IA pueden rastrear la web",
        "robots.txt no bloquea a los rastreadores de los principales asistentes.",
        "Pueden leer el contenido y citarlo en sus respuestas.",
        "Nada que hacer.",
        "p3", "alta", true);
    },
  },
  {
    id: "jsonld_sin_entidad", funcion: 3, necesita: ["seo.jsonld"],
    evaluar: (v) => {
      const tipos = v.lista("seo.jsonld");
      return tipos.length && !tipos.some((t) => ENTIDADES.test(t)) ? H(
        "Los datos estructurados no dicen quién es la empresa",
        `Hay JSON-LD (${tipos.join(", ")}), pero ninguno de tipo Organization o LocalBusiness.`,
        "Es la entidad que usan buscadores y asistentes para saber nombre, web, logo y perfiles de la empresa.",
        "Añadir un bloque Organization (o LocalBusiness con sede) con nombre, url, logo y sameAs.",
        "p3") : null;
    },
  },
  {
    id: "titles_duplicados", funcion: 3, necesita: ["seo.titles_duplicados", "seo.crawl"],
    evaluar: (v) => v.num("seo.titles_duplicados") > 0 ? H(
      `${v.num("seo.titles_duplicados")} páginas comparten title con otra`,
      `De ${v.num("seo.crawl")} páginas rastreadas, ${v.num("seo.titles_duplicados")} repiten title.`,
      "Páginas con el mismo title compiten entre sí por la misma búsqueda y el buscador no sabe cuál mostrar.",
      "Dar a cada página un title propio que diga de qué va esa página en concreto.",
      "p2") : null,
  },
  {
    id: "titles_vacios", funcion: 3, necesita: ["seo.titles_vacios", "seo.crawl"],
    evaluar: (v) => v.num("seo.titles_vacios") > 0 ? H(
      `${v.num("seo.titles_vacios")} páginas sin title`,
      `De ${v.num("seo.crawl")} páginas rastreadas, ${v.num("seo.titles_vacios")} no tienen title.`,
      "Salen en los resultados con un texto que elige el buscador.",
      "Escribir el title de cada una.",
      "p2") : null,
  },
  {
    id: "descripciones_vacias", funcion: 3, necesita: ["seo.desc_vacias", "seo.crawl"],
    evaluar: (v) => v.num("seo.desc_vacias") > 0 ? H(
      `${v.num("seo.desc_vacias")} páginas sin meta description`,
      `De ${v.num("seo.crawl")} páginas rastreadas, ${v.num("seo.desc_vacias")} no tienen description.`,
      "El texto del resultado lo elige el buscador, normalmente peor que uno escrito.",
      "Empezar por las páginas de servicio y las que más tráfico reciben.",
      "p3") : null,
  },
  {
    id: "paginas_sin_h1", funcion: 3, necesita: ["seo.sin_h1", "seo.crawl"],
    evaluar: (v) => v.num("seo.sin_h1") > 0 ? H(
      `${v.num("seo.sin_h1")} páginas sin H1`,
      `De ${v.num("seo.crawl")} páginas rastreadas, ${v.num("seo.sin_h1")} no tienen encabezado principal.`,
      "Sin H1 la página no dice de qué va de la forma que mejor entienden buscadores y lectores de pantalla.",
      "Un H1 por página con el tema de esa página.",
      "p2") : null,
  },
  {
    id: "paginas_varios_h1", funcion: 3, necesita: ["seo.varios_h1", "seo.crawl"],
    evaluar: (v) => v.num("seo.varios_h1") > 0 ? H(
      `${v.num("seo.varios_h1")} páginas con más de un H1`,
      `De ${v.num("seo.crawl")} páginas rastreadas, ${v.num("seo.varios_h1")} tienen varios H1.`,
      "Varios encabezados principales compiten por decir de qué va la página.",
      "Dejar uno y pasar el resto a H2.",
      "p3") : null,
  },
  {
    id: "geo_no_aparece", funcion: 3, necesita: ["geo.menciones", "geo.consultas", "geo.competidores"],
    evaluar: (v) => {
      const n = v.num("geo.menciones");
      const total = v.lista("geo.consultas").length;
      const otros = v.lista("geo.competidores");
      return n === 0 ? H(
        "Los asistentes no recomiendan a la empresa",
        `En ${total} preguntas de comprador sobre su categoría, el modelo no la menciona ninguna vez.`,
        `Quien pregunta a un asistente por un proveedor recibe otros nombres${otros.length ? ` (${otros.slice(0, 5).join(", ")})` : ""}. Es un canal de captación que hoy no trae nada.`,
        "Publicar páginas que respondan a esas preguntas con datos citables, tener presencia en los sitios que los asistentes leen (directorios, prensa, comparativas) y medirlo cada mes.",
        "p1", "media") : H(
        `Los asistentes mencionan a la empresa (${n} de ${total} preguntas)`,
        `Aparece en ${n} de ${total} respuestas; mejor puesto: ${v.num("geo.posicion") || "—"}.`,
        "Ya es una opción para quien pregunta a un asistente.",
        "Repetir la medición cada mes para ver si mejora o se pierde.",
        "p3", "media", true);
    },
  },
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
