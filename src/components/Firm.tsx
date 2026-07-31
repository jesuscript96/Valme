import { SplitReveal, Reveal } from "./Reveal";

const PROOF = [
  {
    label: "Experiencia real",
    body: "El equipo que compone la firma trabajó en captación, CRM, ventas, datos, tecnología y procesos empresariales antes de que Valme Solutions existiera. No improvisamos en el dominio que intervenimos.",
    tag: "01",
  },
  {
    label: "Escenarios operativos",
    body: "Los ejemplos que describimos están etiquetados como escenarios, no como casos reales. Preferimos señalar con honestidad una situación reconocible que inflar un logro.",
    tag: "02",
  },
  {
    label: "Profundidad metodológica",
    body: "Diagnóstico cuantificado, documentación, seguridad, gobernanza y trazabilidad de la ejecución. El método se sostiene aunque todavía no exista un caso público que lo respalde.",
    tag: "03",
  },
];

export function Firm() {
  return (
    <section id="firma" className="bg-white px-6 py-24 md:py-32">
      <div className="max-w-7xl mx-auto">
        <Reveal
          as="span"
          className="block font-mono text-xs tracking-[0.35em] uppercase text-gray-400 mb-8"
        >
          / Firma
        </Reveal>

        <div className="max-w-5xl">
          <SplitReveal
            as="h2"
            className="text-4xl md:text-6xl lg:text-7xl font-normal text-brand-black tracking-tight leading-[1.05] text-balance"
          >
            Puede que la firma sea nueva. <span className="text-gray-400">El criterio no lo es.</span>
          </SplitReveal>
        </div>

        <Reveal
          stagger={0.1}
          y={40}
          className="mt-16 md:mt-20 grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-200 border-y border-gray-200"
        >
          {PROOF.map((p) => (
            <div key={p.tag} className="bg-white p-8 md:p-10">
              <span className="block font-mono text-sm text-gray-400 mb-6">/{p.tag}</span>
              <h3 className="text-xl md:text-2xl font-display font-medium tracking-tight mb-4">
                {p.label}
              </h3>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed">{p.body}</p>
            </div>
          ))}
        </Reveal>

        <Reveal
          as="div"
          delay={0.15}
          className="mt-14 max-w-2xl border-l-2 border-brand-accent pl-6"
        >
          <p className="text-lg md:text-xl text-brand-black font-display font-light tracking-tight leading-snug">
            Valme Solutions la dirige Jesús, que responde personalmente por
            cada mandato admitido.
          </p>
          <p className="mt-4 text-sm text-gray-500 leading-relaxed">
            Si una operación no cumple los criterios de admisión, lo decimos.
            Preferimos no aceptar un mandato a aceptar uno que no podemos
            sostener con criterio.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
