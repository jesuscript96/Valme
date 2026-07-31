import { SplitReveal, Reveal } from "./Reveal";
import { Check, X } from "lucide-react";

const NOT_ACCEPTED = [
  "Automatizaciones aisladas",
  "Implantaciones sin impacto medible",
  "Proyectos experimentales de IA",
  "Empresas que buscan únicamente reducir coste",
  "Intervenciones sin responsable interno",
  "Solicitudes centradas en una herramienta concreta",
];

const ACCEPTED = [
  "El crecimiento ha aumentado la complejidad",
  "La operación depende excesivamente de personas concretas",
  "Existen departamentos o sistemas desconectados",
  "La dirección carece de visibilidad suficiente",
  "La fricción tiene un impacto económico relevante",
];

export function CareersCallout() {
  return (
    <section id="admision" className="bg-brand-gray-100 py-16 lg:py-24 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Statement panel */}
        <div className="bg-brand-black text-white p-12 lg:p-24 flex flex-col justify-center">
          <Reveal
            as="span"
            className="block font-mono text-xs tracking-[0.35em] uppercase text-white/40 mb-8"
          >
            / Admisión
          </Reveal>
          <SplitReveal
            as="h2"
            className="text-3xl md:text-4xl lg:text-5xl font-display font-normal tracking-tight leading-[1.1] mb-8 text-balance"
          >
            Not every operation requires our intervention.
          </SplitReveal>
          <Reveal
            as="p"
            className="text-base md:text-lg text-white/55 leading-relaxed max-w-md font-light"
          >
            Trabajamos con compañías en las que existe una exposición operativa
            identificable, acceso directo a dirección y capacidad real de
            modificar procesos. La exclusividad no se afirma: se establece con
            condiciones.
          </Reveal>
        </div>

        {/* Criteria panel */}
        <div className="bg-white p-10 lg:p-14 grid grid-cols-1 sm:grid-cols-2 gap-10">
          <div>
            <span className="block font-mono text-xs tracking-[0.3em] uppercase text-gray-400 mb-6">
              / No aceptamos
            </span>
            <Reveal as="ul" stagger={0.06} className="space-y-4">
              {NOT_ACCEPTED.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <X className="mt-0.5 w-4 h-4 text-brand-accent shrink-0" strokeWidth={1.75} />
                  <span className="text-gray-600 leading-relaxed">{item}</span>
                </li>
              ))}
            </Reveal>
          </div>
          <div>
            <span className="block font-mono text-xs tracking-[0.3em] uppercase text-gray-400 mb-6">
              / Trabajamos cuando
            </span>
            <Reveal as="ul" stagger={0.06} className="space-y-4">
              {ACCEPTED.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 w-4 h-4 text-brand-black shrink-0" strokeWidth={1.75} />
                  <span className="text-gray-700 leading-relaxed font-medium">{item}</span>
                </li>
              ))}
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
