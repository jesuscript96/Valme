import { FUNCIONES, type Confianza, type Funcion, type Gravedad, type Hallazgo, type Señal } from "./types";

/**
 * MOTOR DE REGLAS. De señales a hallazgos, sin IA y sin ambigüedad.
 *
 * Una regla declara qué señales necesita y qué concluye. Tres propiedades que importan:
 *
 *  · Si una señal que la regla necesita no está `verificado`, la regla NO se dispara.
 *    Ausencia de dato no es hallazgo. Esto es lo que impide afirmar «no tienes píxel»
 *    cuando lo que pasa es que la página no cargó.
 *
 *  · Todo hallazgo cita las señales que lo sostienen. Sin señales no se emite.
 *
 *  · Los hallazgos positivos son tan reglas como los negativos. Se reconoce lo que
 *    funciona antes de proponer nada.
 *
 * La IA no entra aquí. Entra después, y solo para redactar: nunca para decidir si algo
 * es un hallazgo.
 */

export type Regla = {
  id: string;
  funcion: Funcion;
  /** Señales necesarias. Todas tienen que estar verificadas para evaluar. */
  necesita: string[];
  evaluar: (v: Lectura) => Omit<Hallazgo, "id" | "funcion" | "evidencia"> | null;
};

/** Acceso tipado a los valores de las señales necesarias. */
export type Lectura = {
  num: (id: string) => number;
  bool: (id: string) => boolean;
  txt: (id: string) => string | null;
  lista: (id: string) => string[];
  existe: (id: string) => boolean;
};

const H = (
  titulo: string, situacion: string, consecuencia: string, solucion: string,
  gravedad: Gravedad, confianza: Confianza = "alta", positivo = false,
) => ({ titulo, situacion, consecuencia, solucion, gravedad, confianza, positivo });

export const REGLAS: Regla[] = [
  // ---------- 08 · Datos, CRM y leads ----------
  {
    id: "sin_dmarc", funcion: 8, necesita: ["datos.dmarc"],
    evaluar: (v) => v.txt("datos.dmarc") ? null : H(
      "El dominio no tiene DMARC",
      "No existe registro DMARC en el DNS del dominio.",
      "Sin DMARC, los proveedores de correo no saben qué hacer con los mensajes que dicen venir del dominio y no superan la comprobación. Una parte del correo comercial acaba en spam sin que nadie lo sepa, porque tampoco hay informes que lo avisen.",
      "Publicar un registro DMARC empezando en p=none con dirección de informes, leer dos semanas de datos y endurecer a quarantine cuando el envío legítimo esté alineado.",
      "p1"),
  },
  {
    id: "dmarc_permisivo", funcion: 8, necesita: ["datos.dmarc_politica"],
    evaluar: (v) => v.txt("datos.dmarc_politica") === "none" ? H(
      "DMARC existe pero no protege",
      "El registro DMARC está publicado con política p=none.",
      "p=none solo observa: no pide a los receptores que hagan nada con el correo que falla la comprobación. Sirve para medir, no para proteger.",
      "Revisar los informes agregados, confirmar que todo el envío legítimo pasa SPF o DKIM alineado y subir a quarantine.",
      "p2") : null,
  },
  {
    id: "dmarc_ok", funcion: 8, necesita: ["datos.dmarc_politica"],
    evaluar: (v) => ["quarantine", "reject"].includes(v.txt("datos.dmarc_politica") ?? "") ? H(
      "El correo está protegido con DMARC",
      `El dominio publica DMARC con política ${v.txt("datos.dmarc_politica")}.`,
      "Es más de lo que tiene la mayoría de las pymes. La entregabilidad del correo comercial parte de una base sana.",
      "Mantenerlo y revisar los informes agregados cuando se añada una herramienta nueva de envío.",
      "p3", "alta", true) : null,
  },
  {
    id: "spf_permisivo", funcion: 8, necesita: ["datos.spf_modo"],
    evaluar: (v) => /\?all|sin modificador/.test(v.txt("datos.spf_modo") ?? "") ? H(
      "El SPF no rechaza a los remitentes no autorizados",
      `El registro SPF termina en ${v.txt("datos.spf_modo")}.`,
      "Un SPF neutro deja pasar correo de cualquier servidor que diga ser el dominio. Es la puerta abierta a la suplantación.",
      "Inventariar todo lo que envía correo en nombre del dominio, incluirlo en el registro y cerrar con -all.",
      "p1") : null,
  },
  {
    id: "sin_medicion", funcion: 8, necesita: ["datos.herramientas"],
    evaluar: (v) => v.lista("datos.herramientas").length === 0 ? H(
      "La web no tiene ninguna herramienta de medición",
      "Al cargar la página no se ejecuta ninguna herramienta de analítica, ni gestor de etiquetas, ni píxel de ninguna plataforma.",
      "No hay datos de lo que pasa en la web: ni cuánta gente entra, ni de dónde viene, ni qué hace. Cualquier inversión en captación que se haga ahora será imposible de evaluar después, y los primeros meses de datos no se recuperan.",
      "Instalar un gestor de etiquetas, medición de analítica con los eventos de conversión definidos y el píxel de las plataformas donde se vaya a invertir. Es lo primero, antes de gastar un euro en anuncios.",
      "p0") : null,
  },
  {
    id: "formulario_mailto", funcion: 8, necesita: ["web.destino_formulario"],
    evaluar: (v) => (v.txt("web.destino_formulario") ?? "").startsWith("mailto:") ? H(
      "El formulario abre el cliente de correo",
      "El formulario no envía a un servidor: abre el programa de correo del visitante.",
      "En móvil muchos visitantes no tienen cliente de correo configurado y el envío se pierde. Además no queda registro, no se puede medir la conversión y el lead no entra en ningún sitio.",
      "Enviar el formulario a un endpoint propio que guarde el lead, dispare el evento de conversión y mande el aviso.",
      "p0") : null,
  },

  // ---------- 02 · Paid media ----------
  {
    id: "sin_pixel", funcion: 2, necesita: ["paid.pixel_meta"],
    evaluar: (v) => !v.bool("paid.pixel_meta") ? H(
      "No hay píxel de Meta instalado",
      "La página no carga el píxel de Meta.",
      "Sin píxel no se puede hacer retargeting, ni construir audiencias similares, ni medir qué anuncio trae qué. Y el histórico no se recupera: un píxel instalado hoy empieza a aprender hoy.",
      "Instalar el píxel y configurar los eventos que importan para el negocio. Aunque no se vaya a invertir todavía, conviene ponerlo ya para que acumule datos.",
      "p1") : null,
  },
  {
    id: "pixel_sin_eventos", funcion: 2, necesita: ["paid.pixel_meta", "paid.pixel_eventos"],
    evaluar: (v) => v.bool("paid.pixel_meta") && v.lista("paid.pixel_eventos").length === 0 ? H(
      "El píxel carga pero no dispara eventos",
      "El píxel de Meta se ejecuta en la página y no se ha observado ningún evento al navegar.",
      "Meta optimiza hacia el evento que se le indique. Sin eventos solo puede optimizar a clic, que es la señal más barata y la menos relacionada con vender.",
      "Definir los eventos de conversión del negocio, implementarlos y verificarlos en el administrador de eventos. Comprobar también que el evento de lead se dispara en el envío del formulario, no solo al cargar.",
      "p1", "media") : null,
  },
  {
    id: "pixel_sin_capi", funcion: 2, necesita: ["paid.pixel_meta", "web.cookies"],
    evaluar: (v) => v.bool("paid.pixel_meta") && v.bool("web.cookies") ? H(
      "Medición dependiente del navegador",
      "Hay píxel y hay aviso de cookies. No se ha podido comprobar desde fuera si además se envían eventos por servidor.",
      "Todo lo que dependa solo del navegador se pierde con el rechazo de cookies y con los bloqueadores. La plataforma optimiza con menos señal de la que hay en realidad.",
      "Comprobar si está configurada la Conversions API y, si no lo está, implementarla deduplicando con el mismo identificador de evento que el píxel.",
      "p2", "baja") : null,
  },

  // ---------- 03 · SEO, contenido y GEO ----------
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

  // ---------- 07 · Web, landings y CRO ----------
  {
    id: "sin_formulario", funcion: 7, necesita: ["web.formularios"],
    evaluar: (v) => v.num("web.formularios") === 0 ? H(
      "La home no tiene formulario",
      "No hay ningún formulario en la página principal.",
      "Todo el que llega convencido tiene que buscar cómo contactar. Cada paso extra entre la decisión y el contacto se lleva una parte de los interesados, y no queda registro de los que se van.",
      "Poner un formulario corto en la home, con los campos mínimos, y medir su envío como conversión.",
      "p1") : null,
  },
  {
    id: "formulario_largo", funcion: 7, necesita: ["web.campos_formulario"],
    evaluar: (v) => v.num("web.campos_formulario") > 6 ? H(
      "El formulario pide demasiado",
      `El formulario principal tiene ${v.num("web.campos_formulario")} campos visibles.`,
      "Cada campo de más reduce los envíos. Los datos que se piden antes de hablar suelen poder pedirse después, en la llamada.",
      "Reducir a nombre, una vía de contacto y como mucho una pregunta de cualificación. El resto, en la conversación.",
      "p2") : null,
  },
  {
    id: "sin_consentimiento", funcion: 7, necesita: ["web.formularios", "web.consentimiento"],
    evaluar: (v) => v.num("web.formularios") > 0 && !v.bool("web.consentimiento") ? H(
      "El formulario no recoge consentimiento",
      "No se ha detectado casilla ni texto de consentimiento en el formulario.",
      "Recoger datos de contacto sin consentimiento informado incumple el RGPD, y además impide demostrar después qué aceptó cada persona.",
      "Añadir la casilla con el texto de la política de privacidad y guardar ese texto literal junto al lead, no una referencia.",
      "p1") : null,
  },
  {
    id: "sin_telefono", funcion: 7, necesita: ["web.telefono"],
    evaluar: (v) => !v.bool("web.telefono") ? H(
      "No hay teléfono visible",
      "La página no incluye ningún enlace de teléfono.",
      "En venta B2B con ticket alto, parte de los interesados quiere llamar antes de dejar sus datos. Sin teléfono a la vista, esos se van.",
      "Poner el teléfono como enlace tel: en la cabecera y en el pie.",
      "p3") : null,
  },
  {
    id: "errores_js", funcion: 7, necesita: ["web.errores_js"],
    evaluar: (v) => v.num("web.errores_js") > 0 ? H(
      "La página lanza errores de JavaScript",
      `Se han registrado ${v.num("web.errores_js")} errores al cargar la home.`,
      "Un error puede dejar sin funcionar un formulario, un botón o un tag de medición sin que se note a simple vista.",
      "Revisar la consola, corregir los errores y comprobar después que formularios y medición siguen funcionando.",
      "p2", "media") : null,
  },

  // ---------- 04 · Social orgánico ----------
  {
    id: "sin_social", funcion: 4, necesita: ["social.perfiles"],
    evaluar: (v) => v.lista("social.perfiles").length === 0 ? H(
      "La web no enlaza ningún perfil social",
      "No hay enlaces a redes sociales en la página.",
      "Casi todo el mundo investiga a un proveedor antes de contactar. Si no encuentra rastro, la duda la resuelve en contra.",
      "Enlazar los perfiles que estén vivos. Si uno está abandonado, es mejor no enlazarlo que enseñar una cuenta parada.",
      "p2") : null,
  },
  {
    id: "social_un_canal", funcion: 4, necesita: ["social.perfiles"],
    evaluar: (v) => v.lista("social.perfiles").length === 1 ? H(
      "Presencia social en un solo canal",
      `La web solo enlaza un perfil: ${v.lista("social.perfiles")[0]}.`,
      "No es un problema por sí mismo, y concentrar en el canal donde está el público suele ser buena decisión. Pero conviene comprobar que el canal elegido es el correcto y que está vivo.",
      "Revisar cadencia y actividad de ese perfil antes de plantear abrir ninguno más.",
      "p3", "media") : null,
  },
];

/** Aplica todas las reglas. Una señal no verificada bloquea su regla. */
export function aplicar(señales: Señal[]): Hallazgo[] {
  const por = new Map(señales.map((s) => [s.id, s]));

  const leer: Lectura = {
    num: (id) => Number(por.get(id)?.valor ?? 0),
    bool: (id) => Boolean(por.get(id)?.valor),
    txt: (id) => { const v = por.get(id)?.valor; return typeof v === "string" ? v : null; },
    lista: (id) => { const v = por.get(id)?.valor; return Array.isArray(v) ? v.map(String) : []; },
    existe: (id) => por.has(id),
  };

  const out: Hallazgo[] = [];
  for (const regla of REGLAS) {
    const usadas = regla.necesita.map((id) => por.get(id));
    // Si falta una señal o no está verificada, no hay hallazgo. Sin excepciones.
    if (usadas.some((s) => !s || s.estado !== "verificado")) continue;

    const r = regla.evaluar(leer);
    if (r) out.push({ ...r, id: regla.id, funcion: regla.funcion, evidencia: regla.necesita });
  }

  // Los positivos primero: el método pide reconocer lo que funciona antes de proponer
  // nada. Dentro de cada grupo, por gravedad.
  const orden: Record<string, number> = { p0: 0, p1: 1, p2: 2, p3: 3 };
  return out.sort((a, b) =>
    Number(b.positivo) - Number(a.positivo) || orden[a.gravedad] - orden[b.gravedad]);
}

/** Cobertura por función: qué parte de lo comprobable se ha podido comprobar. */
export function cobertura(señales: Señal[]) {
  return (Object.keys(FUNCIONES) as unknown as Funcion[]).map((f) => {
    const s = señales.filter((x) => x.funcion === Number(f));
    const verificadas = s.filter((x) => x.estado === "verificado").length;
    const pendientes = s.filter((x) => x.estado === "pendiente").length;
    const noAplica = s.filter((x) => x.estado === "no_aplica").length;
    const base = s.length - noAplica;
    return {
      funcion: Number(f) as Funcion, verificadas, pendientes, noAplica,
      pct: base > 0 ? Math.round((verificadas / base) * 100) : 0,
    };
  });
}
