import { runJob, memoryJobStore } from "../../../domain/aiJobs";
import { señal, type Señal } from "../../types";

/**
 * COLECTOR PROPIO DE GEO · ¿sale la empresa cuando se pregunta a un asistente?
 *
 * Método de `plan-auditoria-comercial.md` §03, reducido a lo que se puede hacer sin
 * accesos: se describe a qué se dedica la empresa SIN su nombre, se le hacen al modelo
 * las preguntas que haría un comprador y se mira si la empresa aparece, en qué puesto
 * y a quién nombra en su lugar.
 *
 * Límites que van en la señal, no escondidos: es un solo modelo y sin búsqueda web, así
 * que mide lo que el modelo «sabe», no lo que respondería ChatGPT con navegador; y la
 * respuesta varía entre ejecuciones. Por eso se repite en el tiempo, no se lee como nota.
 */

const PREGUNTAS = (categoria: string, zona: string) => [
  `¿Qué empresas recomiendas para ${categoria} en ${zona}?`,
  `Estoy buscando proveedor de ${categoria} en ${zona}. ¿Con quién debería hablar?`,
  `¿Cuáles son las empresas más conocidas de ${categoria} en ${zona}?`,
];

type Descripcion = { categoria: string; zona: string };
type Respuestas = { respuestas: { pregunta: string; empresas: { nombre: string; web: string | null }[] }[] };

/** Nombres con los que se reconoce a la empresa: el dominio sin TLD y la marca del title. */
export function marcas(dominio: string, title: string | null): string[] {
  const raiz = dominio.replace(/^www\./, "").split(".")[0] ?? "";
  const marca = (title ?? "").split(/[|·–—-]/)[0]?.trim() ?? "";
  return [...new Set([raiz, marca].map((x) => x.toLowerCase()).filter((x) => x.length >= 3))];
}

const normal = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

/** Puesto (1…) en el que aparece la empresa en una lista de respuestas, o null. */
export function puesto(empresas: { nombre: string; web: string | null }[], nombres: string[]): number | null {
  const claves = nombres.map(normal).filter(Boolean);
  const i = empresas.findIndex((e) => {
    const texto = normal(`${e.nombre} ${e.web ?? ""}`);
    return claves.some((k) => texto.includes(k));
  });
  return i === -1 ? null : i + 1;
}

export async function visibilidadGeo(
  urlFinal: string,
  pagina: { title: string | null; descripcion: string | null },
): Promise<Señal[]> {
  const base = { funcion: 3 as const, fuente: "Modelo de lenguaje · preguntas de comprador", url: urlFinal };
  const dominio = new URL(urlFinal).hostname;
  const texto = [pagina.title, pagina.descripcion].filter(Boolean).join(". ");
  if (!texto) {
    return [señal({
      ...base, id: "geo.menciones", que: "Respuestas que mencionan a la empresa", valor: null,
      estado: "pendiente", limite: "La home no tiene title ni description: no hay de qué partir para preguntar.",
    })];
  }

  const { structured } = await import("../../../providers/anthropic");
  const store = memoryJobStore();
  const job = { clientId: `dominio:${dominio}`, provider: "anthropic" as const };

  const desc = await runJob(store, { ...job, kind: "geo.categoria", input: texto }, async () => {
    const r = await structured<Descripcion>({
      system: [{ text: "Describes negocios de forma genérica, sin nombres de marca ni de empresa." }],
      user:
        `A partir de este texto de una web, di a qué categoría de servicio se dedica (en pocas palabras, en español, sin la marca) ` +
        `y en qué zona trabaja (ciudad, región o «España» si no se sabe).\n\n${texto.slice(0, 1500)}`,
      schema: {
        type: "object", additionalProperties: false, required: ["categoria", "zona"],
        properties: { categoria: { type: "string" }, zona: { type: "string" } },
      },
      maxTokens: 2000,
      effort: "low",
    });
    return { output: r.value, usage: r.usage };
  });

  const preguntas = PREGUNTAS(desc.categoria, desc.zona);
  const r = await runJob(store, { ...job, kind: "geo.preguntas", input: preguntas }, async () => {
    const x = await structured<Respuestas>({
      system: [{
        text:
          "Respondes como un asistente al que un comprador pide recomendaciones. Para cada pregunta, " +
          "da hasta 8 empresas reales en el orden en que las recomendarías, con su web si la conoces. " +
          "Si no conoces empresas concretas, devuelve la lista vacía: no inventes.",
      }],
      user: preguntas.map((p, i) => `${i + 1}. ${p}`).join("\n"),
      schema: {
        type: "object", additionalProperties: false, required: ["respuestas"],
        properties: {
          respuestas: {
            type: "array",
            items: {
              type: "object", additionalProperties: false, required: ["pregunta", "empresas"],
              properties: {
                pregunta: { type: "string" },
                empresas: {
                  type: "array",
                  items: {
                    type: "object", additionalProperties: false, required: ["nombre", "web"],
                    properties: { nombre: { type: "string" }, web: { type: ["string", "null"] } },
                  },
                },
              },
            },
          },
        },
      },
      maxTokens: 6000,
      effort: "medium",
    });
    return { output: x.value, usage: x.usage };
  });

  const nombres = marcas(dominio, pagina.title);
  const puestos = r.respuestas.map((x) => puesto(x.empresas, nombres));
  const conMencion = puestos.filter((p): p is number => p !== null);
  const competidores = [...new Set(r.respuestas.flatMap((x) => x.empresas.slice(0, 3).map((e) => e.nombre)))].slice(0, 8);
  const limite = "Un solo modelo, sin búsqueda web; varía entre ejecuciones. Se mide en el tiempo, no es una nota.";

  return [
    señal({ ...base, id: "geo.categoria", que: "Categoría y zona con las que se pregunta", valor: `${desc.categoria} · ${desc.zona}`, estado: "verificado" }),
    señal({ ...base, id: "geo.consultas", que: "Preguntas de comprador hechas al modelo", valor: preguntas, estado: "verificado" }),
    señal({ ...base, id: "geo.menciones", que: "Respuestas que mencionan a la empresa", valor: conMencion.length, estado: "verificado", limite }),
    señal({ ...base, id: "geo.posicion", que: "Mejor puesto en el que aparece", valor: conMencion.length ? Math.min(...conMencion) : null, estado: "verificado", limite }),
    señal({ ...base, id: "geo.competidores", que: "Empresas que el modelo nombra en su lugar", valor: competidores, estado: "verificado", limite }),
  ];
}
