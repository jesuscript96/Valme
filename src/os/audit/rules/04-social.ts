import { H, type Regla } from "./tipos";

/**
 * 04 · SOCIAL ORGÁNICO
 *
 * Señales disponibles:
 *   social.perfiles  string[] · perfiles enlazados desde la web
 *
 * Aviso: Instagram y LinkedIn no se rastrean (va contra sus términos). Seguidores,
 * cadencia e interacción se rellenan a mano con rúbrica. Ver docs/plan-auditoria-comercial.md
 */
export const REGLAS: Regla[] = [
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
