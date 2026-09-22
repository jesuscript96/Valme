"use client";
import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { SplitReveal, Reveal } from "./Reveal";
import { areaIcon } from "../lib/areaIcons";
import { useCta, type CtaData } from "./useCta";

type AreaCard = {
  _id: string;
  name?: string;
  /** Sin slug la tarjeta no navega: se pinta como div (las ocho funciones). */
  slug?: string;
  index?: string;
  icon?: string;
  tagline?: string;
};
type Weight = { _key?: string; label?: string; value?: number };
type AreasData = {
  eyebrow?: string;
  heading?: { lead?: string; dim?: string };
  intro?: string;
  /** Tarjetas embebidas en la sección. Si faltan, se usa la prop `areas`. */
  items?: AreaCard[];
  weightsTitle?: string;
  weightsNote?: string;
  weights?: Weight[];
  closingEyebrow?: string;
  closingHeading?: string;
  closingCta?: CtaData;
};

/** Degradado del acento, de menor a mayor peso. */
const WEIGHT_TINTS = [
  "#ffd9d2",
  "#ffc4b9",
  "#ffaea0",
  "#ff9887",
  "#ff826e",
  "#ff6b55",
  "#ff543c",
  "#e63218",
];

export function Areas({ data, areas }: { data: AreasData; areas?: AreaCard[] }) {
  const cta = useCta();
  const onClosing = cta(data?.closingCta);

  const cards = data?.items ?? areas ?? [];
  const weights = data?.weights ?? [];
  const totalWeight = weights.reduce((sum, w) => sum + (w.value ?? 0), 0);
  // Con más de cuatro tarjetas la rejilla pasa a cuatro columnas y se compacta.
  const dense = cards.length > 4;

  return (
    <section id="intervencion" className="bg-white px-6 py-24 md:py-32">
      <div className="max-w-7xl mx-auto">
        <Reveal
          as="span"
          className="block font-mono text-xs tracking-[0.35em] uppercase text-gray-400 mb-8"
        >
          {data?.eyebrow}
        </Reveal>
        <SplitReveal
          as="h2"
          className="max-w-4xl text-4xl md:text-6xl lg:text-7xl font-normal text-brand-black tracking-tight leading-[1.1] text-balance"
        >
          {data?.heading?.lead} <span className="text-gray-400">{data?.heading?.dim}</span>
        </SplitReveal>
        <Reveal
          as="p"
          className="mt-6 max-w-xl text-base md:text-lg text-gray-500 leading-relaxed"
        >
          {data?.intro}
        </Reveal>

        <Reveal
          stagger={dense ? 0.05 : 0.08}
          y={40}
          className="mt-16 md:mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200 border border-gray-200"
        >
          {cards.map((area) => {
            const Icon = areaIcon(area.icon);
            const body = (
              <>
                <span className="absolute top-0 left-0 h-px w-0 bg-brand-accent transition-[width] duration-500 ease-out group-hover:w-full" />
                <div className={`flex items-center justify-between ${dense ? "mb-8" : "mb-10"}`}>
                  <Icon className="w-7 h-7 text-brand-black" strokeWidth={1.25} />
                  <span className="font-mono text-sm text-gray-400">/{area.index}</span>
                </div>
                <h3
                  className={`font-display font-medium tracking-tight mb-3 ${
                    dense ? "text-xl md:text-2xl" : "mt-auto text-2xl md:text-3xl"
                  }`}
                >
                  {area.name}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed pr-6">{area.tagline}</p>
              </>
            );
            const shell = `group relative flex flex-col bg-white transition-colors duration-500 hover:bg-brand-gray-50 ${
              dense ? "p-7 md:p-8 min-h-[240px]" : "p-8 md:p-12 min-h-[280px]"
            }`;

            // Las áreas de operaciones enlazan a su página; las funciones, no.
            return area.slug ? (
              <Link key={area._id} href={`/areas/${area.slug}`} data-cursor="hover" className={shell}>
                {body}
                <ArrowUpRight
                  className="absolute bottom-8 right-8 w-5 h-5 text-brand-black -translate-x-2 translate-y-2 opacity-0 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
                  strokeWidth={1.5}
                />
              </Link>
            ) : (
              <div key={area._id} className={shell}>
                {body}
              </div>
            );
          })}
        </Reveal>

        {/* Reparto de peso entre funciones */}
        {weights.length > 0 && totalWeight > 0 && (
          <Reveal y={30} className="mt-px bg-brand-gray-50 border-x border-b border-gray-200 p-8 md:p-10">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 mb-7">
              <p className="text-sm md:text-base font-medium text-brand-black max-w-2xl">
                {data?.weightsTitle}
              </p>
              <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-gray-400 whitespace-nowrap">
                {data?.weightsNote}
              </p>
            </div>

            <div className="flex h-3 w-full overflow-hidden rounded-full" aria-hidden="true">
              {weights.map((w, i) => (
                <span
                  key={w._key ?? w.label}
                  style={{
                    flex: `${w.value ?? 0} 1 0%`,
                    backgroundColor: WEIGHT_TINTS[i % WEIGHT_TINTS.length],
                  }}
                />
              ))}
            </div>

            <ul className="mt-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-3">
              {weights.map((w, i) => (
                <li key={w._key ?? w.label} className="flex items-center gap-2.5 text-sm">
                  <span
                    className="block w-2.5 h-2.5 rounded-[2px] shrink-0"
                    style={{ backgroundColor: WEIGHT_TINTS[i % WEIGHT_TINTS.length] }}
                  />
                  <span className="text-gray-600 truncate">{w.label}</span>
                  <span className="ml-auto font-mono text-xs text-brand-black tabular-nums">
                    {w.value}%
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        )}

        {/* Closing diagnostic CTA */}
        <Reveal y={40} className="mt-px">
          <button
            type="button"
            onClick={onClosing}
            data-cursor="hover"
            className="group relative w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-brand-black text-white p-8 md:p-12 overflow-hidden text-left"
          >
            <span className="absolute inset-0 bg-brand-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            <div className="relative z-10 max-w-2xl">
              <p className="font-mono text-xs tracking-[0.3em] uppercase text-white/50 group-hover:text-white/80 transition-colors mb-4">
                {data?.closingEyebrow}
              </p>
              <h3 className="font-display font-medium text-2xl md:text-3xl tracking-tight">
                {data?.closingHeading}
              </h3>
            </div>
            <span className="relative z-10 inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap">
              {data?.closingCta?.label}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </Reveal>
      </div>
    </section>
  );
}
