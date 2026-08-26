"use client";
import { SplitReveal, Reveal } from "./Reveal";

type Principle = { _key?: string; id?: string; title?: string; body?: string };
type MissionData = {
  eyebrow?: string;
  heading?: { lead?: string; dim?: string };
  lead?: string;
  principlesEyebrow?: string;
  principles?: Principle[];
};

export function Mission({ data }: { data: MissionData }) {
  const principles = data?.principles ?? [];

  return (
    <section id="tesis" className="py-24 md:py-40 px-6 bg-brand-black text-white">
      <div className="max-w-7xl mx-auto">
        <Reveal as="span" className="block font-mono text-xs tracking-[0.35em] uppercase text-white/40 mb-8">
          {data?.eyebrow}
        </Reveal>

        <div className="max-w-5xl">
          <SplitReveal
            as="h2"
            className="text-4xl md:text-6xl lg:text-7xl font-normal text-white tracking-tight leading-[1.1] text-balance"
          >
            {data?.heading?.lead} <span className="text-white/40">{data?.heading?.dim}</span>
          </SplitReveal>
        </div>

        <Reveal
          as="p"
          delay={0.1}
          className="mt-10 max-w-3xl text-lg md:text-xl text-white/60 leading-relaxed font-light"
        >
          {data?.lead}
        </Reveal>

        <Reveal as="div" delay={0.15} y={40} className="mt-16 md:mt-20">
          <div className="relative h-[320px] md:h-[500px] overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/corp/glass.jpeg"
              alt="Fachada corporativa de vidrio y hormigón"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-black/70 via-brand-black/10 to-transparent" />
          </div>
        </Reveal>

        <Reveal
          as="span"
          delay={0.15}
          className="block mt-16 md:mt-20 font-mono text-xs tracking-[0.35em] uppercase text-white/40 mb-8"
        >
          {data?.principlesEyebrow}
        </Reveal>

        <Reveal
          stagger={0.12}
          y={50}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 border-y border-white/10"
        >
          {principles.map((p) => (
            <div
              key={p._key ?? p.id}
              data-cursor="hover"
              className="group relative bg-brand-black p-8 pt-10 transition-colors duration-500 hover:bg-white/[0.04]"
            >
              <span className="absolute top-0 left-0 h-px w-0 bg-brand-accent transition-[width] duration-500 ease-out group-hover:w-full" />
              <span className="block text-sm text-white/40 mb-5 font-mono">/{p.id}</span>
              <h3 className="text-xl font-medium tracking-tight mb-3">{p.title}</h3>
              <p className="text-white/55 text-sm leading-relaxed">{p.body}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
