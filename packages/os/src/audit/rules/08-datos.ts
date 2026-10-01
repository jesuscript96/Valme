import { H, type Regla } from "./tipos";

/**
 * 08 · DATOS, CRM Y LEADS
 *
 * Señales disponibles:
 *   datos.spf · datos.spf_modo · datos.dmarc · datos.dmarc_politica · datos.dmarc_informes
 *   datos.dkim · datos.mx · datos.herramientas · datos.terceros · web.destino_formulario
 */
export const REGLAS: Regla[] = [
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
];
