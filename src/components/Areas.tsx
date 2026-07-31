import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { SplitReveal, Reveal } from "./Reveal";
import { AREAS } from "../content/areas";
import { useWhatsApp } from "./WhatsApp";

export function Areas() {
  const { open: openWhatsApp } = useWhatsApp();

  return (
    <section id="intervencion" className="bg-white px-6 py-24 md:py-32">
      <div className="max-w-7xl mx-auto">
        <Reveal
          as="span"
          className="block font-mono text-xs tracking-[0.35em] uppercase text-gray-400 mb-8"
        >
          / Dónde intervenimos
        </Reveal>
        <SplitReveal
          as="h2"
          className="max-w-4xl text-4xl md:text-6xl lg:text-7xl font-normal text-brand-black tracking-tight leading-[1.1] text-balance"
        >
          Cuatro lugares donde una compañía puede estar <span className="text-gray-400">perdiendo control.</span>
        </SplitReveal>
        <Reveal
          as="p"
          className="mt-6 max-w-xl text-base md:text-lg text-gray-500 leading-relaxed"
        >
          No son servicios cerrados. Son cuatro dominios en los que intervenir.
          Una compañía puede estar perdiendo control en uno solo, o en varios a la
          vez. El diagnóstico lo determina.
        </Reveal>

        <Reveal
          stagger={0.08}
          y={40}
          className="mt-16 md:mt-20 grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-200 border border-gray-200"
        >
          {AREAS.map((area) => {
            const { Icon } = area;
            return (
              <Link
                key={area.slug}
                to={`/areas/${area.slug}`}
                data-cursor="hover"
                className="group relative flex flex-col bg-white p-8 md:p-12 min-h-[280px] transition-colors duration-500 hover:bg-brand-gray-50"
              >
                <span className="absolute top-0 left-0 h-px w-0 bg-brand-accent transition-[width] duration-500 ease-out group-hover:w-full" />
                <div className="flex items-center justify-between mb-10">
                  <Icon className="w-7 h-7 text-brand-black" strokeWidth={1.25} />
                  <span className="font-mono text-sm text-gray-400">/{area.index}</span>
                </div>
                <h3 className="mt-auto font-display font-medium text-2xl md:text-3xl tracking-tight mb-3">
                  {area.name}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed pr-6">
                  {area.tagline}
                </p>
                <ArrowUpRight
                  className="absolute bottom-8 right-8 w-5 h-5 text-brand-black -translate-x-2 translate-y-2 opacity-0 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
                  strokeWidth={1.5}
                />
              </Link>
            );
          })}
        </Reveal>

        {/* Closing diagnostic CTA */}
        <Reveal
          y={40}
          className="mt-px"
        >
          <button
            type="button"
            onClick={openWhatsApp}
            data-cursor="hover"
            className="group relative w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-brand-black text-white p-8 md:p-12 overflow-hidden text-left"
          >
            <span className="absolute inset-0 bg-brand-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            <div className="relative z-10 max-w-2xl">
              <p className="font-mono text-xs tracking-[0.3em] uppercase text-white/50 group-hover:text-white/80 transition-colors mb-4">
                / Diagnóstico
              </p>
              <h3 className="font-display font-medium text-2xl md:text-3xl tracking-tight">
                Su caso no encaja en un solo dominio. Lo diagnosticamos igual.
              </h3>
            </div>
            <span className="relative z-10 inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap">
              Solicitar una revisión privada
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </Reveal>
      </div>
    </section>
  );
}
