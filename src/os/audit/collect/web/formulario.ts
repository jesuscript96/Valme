import type { Añadido } from "../base/runtime";
import { señal, type Señal } from "../../types";

/**
 * FORMULARIO · paso 4 (¿puede?)
 *
 * Donde más dinero se pierde y lo que menos se mira. No basta con contar campos: importa
 * si tienen etiqueta de verdad o solo marcador de posición, si el teclado del móvil va a
 * salir con números al pedir un teléfono, y si el navegador puede rellenarlos solo.
 */

export const formulario: Añadido = {
  nombre: "Formulario",
  async ejecutar(page, url) {
    const r = (await page.evaluate(`(() => {
      const forms = Array.from(document.querySelectorAll("form"))
        // Los buscadores de la propia web no son formularios de captación.
        .filter((f) => !f.querySelector('input[type="search"]') && f.querySelectorAll("input,select,textarea").length > 1);
      if (!forms.length) return null;

      // El de más campos suele ser el de contacto.
      const f = forms.sort((a, b) => b.querySelectorAll("input,select,textarea").length - a.querySelectorAll("input,select,textarea").length)[0];
      const campos = Array.from(f.querySelectorAll("input,select,textarea"))
        .filter((c) => c.type !== "hidden" && c.type !== "submit");

      const conEtiqueta = campos.filter((c) => {
        if (c.id && document.querySelector('label[for="' + CSS.escape(c.id) + '"]')) return true;
        if (c.closest("label")) return true;
        if (c.getAttribute("aria-label") || c.getAttribute("aria-labelledby")) return true;
        return false;
      });

      const texto = (f.textContent || "").toLowerCase();
      return {
        formularios: forms.length,
        campos: campos.length,
        obligatorios: campos.filter((c) => c.hasAttribute("required")).length,
        conEtiqueta: conEtiqueta.length,
        soloMarcador: campos.filter((c) => !conEtiqueta.includes(c) && c.getAttribute("placeholder")).length,
        conAutocomplete: campos.filter((c) => c.hasAttribute("autocomplete")).length,
        tipos: Array.from(new Set(campos.map((c) => c.type || c.tagName.toLowerCase()))),
        telefonoBienTipado: campos.filter((c) =>
          /tel|phone|m[oó]vil|tel[eé]fono/i.test((c.name || "") + (c.id || "") + (c.getAttribute("placeholder") || ""))
        ).every((c) => c.type === "tel"),
        emailBienTipado: campos.filter((c) =>
          /mail|correo/i.test((c.name || "") + (c.id || "") + (c.getAttribute("placeholder") || ""))
        ).every((c) => c.type === "email"),
        consentimiento: /privacidad|protecci[oó]n de datos|rgpd|acepto|condiciones/.test(texto),
        enlaceLegal: Boolean(f.querySelector('a[href*="privacidad"],a[href*="legal"],a[href*="privacy"]')),
        destino: f.getAttribute("action"),
        metodo: (f.getAttribute("method") || "get").toLowerCase(),
        botones: Array.from(f.querySelectorAll('button,input[type="submit"]')).map((b) => (b.textContent || b.value || "").trim()).filter(Boolean),
      };
    })()`)) as null | {
      formularios: number; campos: number; obligatorios: number; conEtiqueta: number;
      soloMarcador: number; conAutocomplete: number; tipos: string[];
      telefonoBienTipado: boolean; emailBienTipado: boolean; consentimiento: boolean;
      enlaceLegal: boolean; destino: string | null; metodo: string; botones: string[];
    };

    const base = { funcion: 7 as const, fuente: "Navegador · formulario", url };
    const s = (id: string, que: string, valor: Señal["valor"], funcion: Señal["funcion"] = 7, limite?: string) =>
      señal({ ...base, funcion, id, que, valor, estado: "verificado", limite });

    if (!r) {
      return [s("form.existe", "Hay formulario de captación en la página", false)];
    }

    return [
      s("form.existe", "Hay formulario de captación en la página", true),
      s("form.campos", "Campos visibles del formulario principal", r.campos),
      s("form.obligatorios", "Cuántos son obligatorios", r.obligatorios),
      s("form.sin_etiqueta", "Campos sin etiqueta accesible", r.campos - r.conEtiqueta),
      s("form.solo_marcador", "Campos que solo tienen texto de marcador",
        r.soloMarcador,
        7,
        r.soloMarcador > 0
          ? "Un marcador desaparece al escribir y no lo lee un lector de pantalla"
          : undefined),
      s("form.autocomplete", "Campos con autocompletado declarado", r.conAutocomplete),
      s("form.telefono_tipado", "El campo de teléfono usa type=tel", r.telefonoBienTipado),
      s("form.email_tipado", "El campo de email usa type=email", r.emailBienTipado),
      s("form.consentimiento", "Pide consentimiento de forma explícita", r.consentimiento),
      s("form.enlace_legal", "Enlaza la política de privacidad", r.enlaceLegal),
      s("form.destino", "A dónde envía", r.destino, 8),
      s("form.metodo", "Método de envío", r.metodo, 8),
      s("form.boton", "Texto del botón", r.botones[0] ?? null),
    ];
  },
};
