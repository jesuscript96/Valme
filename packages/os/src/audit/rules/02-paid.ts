import { H, type Regla } from "./tipos";

/**
 * 02 · PAID MEDIA
 *
 * Señales disponibles hoy (`npm run audit -- undominio.com --json s.json` las lista todas):
 *   paid.pixel_meta      boolean · el píxel se ejecuta al cargar
 *   paid.pixel_id        string  · identificador del píxel
 *   paid.pixel_eventos   string[]· eventos observados al cargar la home
 *   web.cookies          boolean · la página muestra aviso de cookies
 *
 * Con META_ADLIB_TOKEN se añaden:
 *   paid.meta_activos       number   · anuncios activos
 *   paid.meta_antiguedad    number   · días del más antiguo
 *   paid.meta_nuevos_90d    number   · lanzados en 90 días
 *   paid.meta_creatividades number   · textos distintos
 *   paid.meta_plataformas   string[] · dónde se sirven
 */
export const REGLAS: Regla[] = [
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

  // --- Las siguientes solo se evalúan con META_ADLIB_TOKEN configurado. ---
  {
    id: "anuncios_sin_rotar", funcion: 2, necesita: ["paid.meta_antiguedad", "paid.meta_nuevos_90d"],
    evaluar: (v) => v.num("paid.meta_antiguedad") > 180 && v.num("paid.meta_nuevos_90d") === 0 ? H(
      "Los anuncios llevan meses sin cambiar",
      `El anuncio más antiguo lleva ${v.num("paid.meta_antiguedad")} días activo y no se ha lanzado ninguno nuevo en los últimos 90.`,
      "Sin creatividad nueva la audiencia se satura: sube la frecuencia, cae el CTR y el coste por resultado se encarece poco a poco. Además no se está aprendiendo nada sobre qué mensaje funciona.",
      "Definir un calendario de creatividad con ángulos distintos y un criterio de rotación. Antes de cambiar nada, revisar qué anuncio sostiene el resultado para no apagar el que funciona.",
      "p1") : null,
  },
  {
    id: "poca_variedad_creativa", funcion: 2, necesita: ["paid.meta_activos", "paid.meta_creatividades"],
    evaluar: (v) => v.num("paid.meta_activos") >= 3 && v.num("paid.meta_creatividades") <= 2 ? H(
      "Muchos anuncios y pocos mensajes",
      `Hay ${v.num("paid.meta_activos")} anuncios activos con solo ${v.num("paid.meta_creatividades")} textos distintos entre ellos.`,
      "Duplicar el mismo mensaje no es testar: no se aprende qué ángulo mueve a la audiencia y se reparte el aprendizaje entre anuncios que dicen lo mismo.",
      "Reducir el número de anuncios y aumentar los ángulos distintos: dolor, beneficio, prueba social y objeción. Un ángulo por anuncio.",
      "p2") : null,
  },
  {
    id: "paid_activo_ok", funcion: 2, necesita: ["paid.meta_activos", "paid.meta_nuevos_90d"],
    evaluar: (v) => v.num("paid.meta_activos") > 0 && v.num("paid.meta_nuevos_90d") >= 3 ? H(
      "Hay actividad y rotación creativa",
      `${v.num("paid.meta_activos")} anuncios activos y ${v.num("paid.meta_nuevos_90d")} lanzados en los últimos 90 días.`,
      "La cuenta está viva y se está produciendo creatividad nueva con regularidad. El trabajo de base está hecho.",
      "Mantener el ritmo. El foco pasa a la calidad de lo que se produce y a qué ángulos se están probando.",
      "p3", "alta", true) : null,
  },
];
