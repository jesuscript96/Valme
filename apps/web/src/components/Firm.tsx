"use client";
import { SplitReveal, Reveal } from "./Reveal";

type Proof = { _key?: string; tag?: string; label?: string; body?: string };
type FirmData = {
  eyebrow?: string;
  heading?: { lead?: string; dim?: string };
  proof?: Proof[];
  statement?: string;
  statementSub?: string;
};

export function Firm({ data }: { data: FirmData }) {
  const proof = data?.proof ?? [];

  return (
    <section id="firma" className="bg-white px-6 py-24 md:py-32">
      <div className="max-w-7xl mx-auto">
        <Reveal
          as="span"
          className="block font-mono text-xs tracking-[0.35em] uppercase text-gray-400 mb-8"
        >
          {data?.eyebrow}
        </Reveal>

        <div className="max-w-5xl">
          <SplitReveal
            as="h2"
            className="text-4xl md:text-6xl lg:text-7xl font-normal text-brand-black tracking-tight leading-[1.05] text-balance"
          >
            {data?.heading?.lead} <span className="text-gray-400">{data?.heading?.dim}</span>
          </SplitReveal>
        </div>

        <Reveal
          stagger={0.1}
          y={40}
          className="mt-16 md:mt-20 grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-200 border-y border-gray-200"
        >
          {proof.map((p) => (
            <div key={p._key ?? p.tag} className="bg-white p-8 md:p-10">
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
            {data?.statement}
          </p>
          <p className="mt-4 text-sm text-gray-500 leading-relaxed">
            {data?.statementSub}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
