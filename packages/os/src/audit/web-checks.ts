import type { Paso } from "./types";

/**
 * CATÁLOGO DE COMPROBACIONES DE LA AUDITORÍA WEB.
 *
 * Es la respuesta a «¿qué auditáis exactamente?», y la pantalla la enseña ANTES de lanzar
 * nada. Dos razones:
 *
 *  · Delante de un cliente, enseñar el alcance antes del resultado cambia la conversación:
 *    se discute lo que se ha mirado, no si se ha mirado poco.
 *  · Después de ejecutar, cada comprobación se marca contra las señales recogidas, así que
 *    se ve de un vistazo qué se ha podido responder y qué no. Una comprobación pendiente
 *    no desaparece en silencio.
 */

export type Comprobacion = {
  /** Prefijo o id exacto de las señales que la responden. */
  señal: string;
  paso: Paso;
  que: string;
  como: string;
  /** Variable de entorno que hace falta. Si no está, se marca como bloqueada. */
  necesita?: string;
};

export const COMPROBACIONES: Comprobacion[] = [
  // ---------- 1 · ¿Llega? ----------
  { señal: "campo.lcp", paso: "llega", que: "Velocidad real con usuarios reales",
    como: "Percentil 75 de los últimos 28 días, móvil y escritorio", necesita: "PAGESPEED_API_KEY" },
  { señal: "campo.inp", paso: "llega", que: "Respuesta al tocar, con usuarios reales",
    como: "Percentil 75 de INP", necesita: "PAGESPEED_API_KEY" },
  { señal: "campo.cls", paso: "llega", que: "Cuánto baila el contenido al cargar",
    como: "Percentil 75 de CLS", necesita: "PAGESPEED_API_KEY" },
  { señal: "campo.ttfb", paso: "llega", que: "Tiempo de respuesta del servidor",
    como: "Percentil 75 de TTFB", necesita: "PAGESPEED_API_KEY" },
  { señal: "lab.performance", paso: "llega", que: "Puntuación de rendimiento en laboratorio",
    como: "Lighthouse en móvil", necesita: "PAGESPEED_API_KEY" },
  { señal: "lab.oportunidades", paso: "llega", que: "Qué está frenando la carga, en concreto",
    como: "Auditorías de Lighthouse con su valor", necesita: "PAGESPEED_API_KEY" },
  { señal: "lab.terceros", paso: "llega", que: "Cuánto cuestan los scripts de terceros",
    como: "Resumen de terceros de Lighthouse", necesita: "PAGESPEED_API_KEY" },
  { señal: "web.img_peso", paso: "llega", que: "Peso total de las imágenes",
    como: "Suma de las peticiones de imagen al cargar" },
  { señal: "web.img_formato_antiguo", paso: "llega", que: "Imágenes en formato antiguo",
    como: "JPEG y PNG frente a WebP y AVIF" },
  { señal: "web.img_sobredimensionadas", paso: "llega", que: "Imágenes servidas más grandes de lo que se ven",
    como: "Ancho real frente al ancho en pantalla" },
  { señal: "web.img_hero_peso", paso: "llega", que: "Peso de la imagen de la primera pantalla",
    como: "La más pesada por encima del pliegue. Suele ser el elemento del LCP" },
  { señal: "web.img_sin_lazy", paso: "llega", que: "Carga diferida por debajo del pliegue",
    como: "Atributo loading en las imágenes que no se ven al entrar" },
  { señal: "web.img_sin_dimensiones", paso: "llega", que: "Dimensiones declaradas en las imágenes",
    como: "Su ausencia es la causa habitual de que el contenido baile" },
  { señal: "web.errores_js", paso: "llega", que: "Errores de JavaScript al cargar",
    como: "Consola del navegador" },
  { señal: "movil.scroll_horizontal", paso: "llega", que: "Scroll horizontal en móvil",
    como: "Ancho del documento frente al de la ventana, a 390 px" },
  { señal: "seo.redirecciones", paso: "llega", que: "Saltos de redirección hasta el destino",
    como: "Se sigue la cadena desde http://" },
  { señal: "web.youtube", paso: "llega", que: "Vídeo de YouTube incrustado",
    como: "Carga cientos de KB y cookies aunque nadie le dé al play" },

  // ---------- 2 · ¿Entiende? ----------
  { señal: "movil.mensaje_primera_pantalla", paso: "entiende", que: "Qué se lee sin hacer scroll en móvil",
    como: "Texto visible en los primeros 844 px de alto" },
  { señal: "movil.cta_primera_pantalla", paso: "entiende", que: "Acciones visibles sin hacer scroll",
    como: "Enlaces y botones dentro de la primera pantalla" },
  { señal: "seo.h1", paso: "entiende", que: "Un solo H1 y que diga algo",
    como: "Recuento y contenido del encabezado principal" },
  { señal: "estilo.colores_texto", paso: "entiende", que: "Cuántos colores distintos se usan",
    como: "Estilos aplicados de los elementos visibles. Muchos significa que no hay sistema" },
  { señal: "estilo.tamaños", paso: "entiende", que: "Cuántos tamaños de letra distintos",
    como: "Mismo recuento sobre los elementos con texto" },
  { señal: "estilo.familias", paso: "entiende", que: "Familias tipográficas en pantalla",
    como: "Lo que realmente se está pintando, no lo que declara el CSS" },
  { señal: "estilo.radios", paso: "entiende", que: "Radios de borde distintos",
    como: "Indicador de si hay criterio o cada componente va por libre" },
  { señal: "share.completo", paso: "entiende", que: "Cómo se ve el enlace al compartirlo",
    como: "Etiquetas Open Graph: título, descripción e imagen" },

  // ---------- 3 · ¿Confía? ----------
  { señal: "confianza.legales_faltan", paso: "confia", que: "Páginas legales obligatorias",
    como: "Aviso legal, privacidad, cookies y condiciones" },
  { señal: "confianza.cif", paso: "confia", que: "Identificación fiscal publicada",
    como: "La LSSI obliga a publicar quién es el prestador" },
  { señal: "confianza.direccion", paso: "confia", que: "Dirección física",
    como: "Búsqueda en el texto de la página" },
  { señal: "confianza.telefono", paso: "confia", que: "Teléfono visible",
    como: "Enlace tel: o número en el texto" },
  { señal: "confianza.testimonios", paso: "confia", que: "Testimonios de cliente",
    como: "Búsqueda en el texto" },
  { señal: "confianza.cifras", paso: "confia", que: "Cifras verificables",
    como: "Reseñas, años, clientes o proyectos con número. Prueba frente a adjetivos" },
  { señal: "confianza.logos", paso: "confia", que: "Logos de cliente",
    como: "Imágenes marcadas como logo" },
  { señal: "stack.cms", paso: "confia", que: "Con qué está hecha la web",
    como: "Huellas en el HTML y las cabeceras. Es contexto: dice qué se puede tocar y a qué coste" },

  // ---------- 4 · ¿Puede? ----------
  { señal: "form.existe", paso: "puede", que: "Hay formulario de captación",
    como: "Formularios de la página, descartando buscadores" },
  { señal: "form.campos", paso: "puede", que: "Cuántos campos pide",
    como: "Campos visibles del formulario principal" },
  { señal: "form.sin_etiqueta", paso: "puede", que: "Campos sin etiqueta accesible",
    como: "label, aria-label o envoltura. El marcador no cuenta" },
  { señal: "form.telefono_tipado", paso: "puede", que: "El teléfono abre el teclado numérico",
    como: "Atributo type de los campos de teléfono" },
  { señal: "form.autocomplete", paso: "puede", que: "El navegador puede rellenar solo",
    como: "Atributos autocomplete" },
  { señal: "form.consentimiento", paso: "puede", que: "Consentimiento RGPD",
    como: "Texto y enlace a la política en el propio formulario" },
  { señal: "a11y.violaciones", paso: "puede", que: "Accesibilidad según WCAG",
    como: "axe-core con las reglas de WCAG 2.0, 2.1 y 2.2 nivel AA" },
  { señal: "a11y.contraste", paso: "puede", que: "Contraste de texto suficiente",
    como: "Regla de contraste de axe" },
  { señal: "movil.tocables_pequeños", paso: "puede", que: "Tamaño de los objetivos táctiles",
    como: "Medida real a 390 px. WCAG exige 24 px; con el dedo hacen falta 44" },
  { señal: "movil.telefono", paso: "puede", que: "Se puede llamar pulsando",
    como: "Enlace tel: en la página" },

  // ---------- 5 · ¿Queda registro? ----------
  { señal: "datos.herramientas", paso: "registro", que: "Qué herramientas hay instaladas",
    como: "Objetos globales y peticiones de red al cargar. No basta con buscar en el HTML" },
  { señal: "paid.pixel_meta", paso: "registro", que: "Píxel de Meta",
    como: "Comprobado en ejecución, no en el código" },
  { señal: "form.destino", paso: "registro", que: "A dónde va el formulario",
    como: "Atributo action. Un mailto: significa que no hay circuito" },
  { señal: "web.cookies", paso: "registro", que: "Aviso de cookies",
    como: "Texto de consentimiento en la página" },
  { señal: "datos.dmarc", paso: "registro", que: "DMARC del dominio",
    como: "Registro TXT de _dmarc" },
  { señal: "datos.spf", paso: "registro", que: "SPF del dominio",
    como: "Registro TXT del dominio" },
  { señal: "datos.dkim", paso: "registro", que: "DKIM en selectores habituales",
    como: "El selector lo elige quien envía y no se puede enumerar" },
  { señal: "datos.mx", paso: "registro", que: "Proveedor de correo",
    como: "Registros MX" },
];

export type EstadoComprobacion = "respondida" | "pendiente" | "bloqueada";

/** Cruza el catálogo con las señales de una ejecución. */
export function evaluarComprobaciones(
  idsDeSeñales: string[],
): (Comprobacion & { estado: EstadoComprobacion })[] {
  const set = new Set(idsDeSeñales);
  return COMPROBACIONES.map((c) => {
    const respondida = set.has(c.señal) || idsDeSeñales.some((i) => i.startsWith(c.señal));
    const bloqueada = Boolean(c.necesita && !process.env[c.necesita]);
    return {
      ...c,
      estado: respondida ? "respondida" : bloqueada ? "bloqueada" : "pendiente",
    };
  });
}
