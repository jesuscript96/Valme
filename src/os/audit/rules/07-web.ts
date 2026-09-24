import { H, type Regla } from "./tipos";

/**
 * 07 · WEB, LANDINGS Y CRO
 *
 * Señales disponibles:
 *   web.formularios · web.campos_formulario · web.consentimiento · web.destino_formulario
 *   web.telefono · web.cookies · web.errores_js · web.hsts · web.servidor
 */
export const REGLAS: Regla[] = [
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
];
