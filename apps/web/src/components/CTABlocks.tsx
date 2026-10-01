"use client";
import { ArrowRight } from "lucide-react";
import { Reveal, SplitReveal } from "./Reveal";
import { Magnetic } from "./Magnetic";
import { useCta, type CtaData } from "./useCta";

type ContactData = {
  eyebrow?: string;
  heading?: string;
  paragraph?: string;
  cta?: CtaData;
  footnote?: string;
};

export function CTABlocks({ data }: { data: ContactData }) {
  const cta = useCta();
  const onCta = cta(data?.cta);

  return (
    <section id="contacto" className="bg-brand-black text-white px-6 py-28 md:py-40">
      <div className="max-w-5xl mx-auto text-center">
        <Reveal
          as="span"
          className="block font-mono text-xs tracking-[0.35em] uppercase text-white/40 mb-10"
        >
          {data?.eyebrow}
        </Reveal>

        <SplitReveal
          as="h2"
          className="text-4xl md:text-6xl lg:text-7xl font-display font-medium tracking-tighter leading-[1.02] text-balance"
        >
          {data?.heading}
        </SplitReveal>

        <Reveal
          as="p"
          delay={0.1}
          className="mt-10 max-w-2xl mx-auto text-lg md:text-xl text-white/60 leading-relaxed font-light"
        >
          {data?.paragraph}
        </Reveal>

        <Reveal as="div" delay={0.2} className="mt-14">
          <Magnetic strength={0.5}>
            <button
              type="button"
              onClick={onCta}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-brand-black text-sm md:text-base font-medium tracking-wide rounded-full overflow-hidden"
            >
              <span className="relative z-10">{data?.cta?.label}</span>
              <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Magnetic>
        </Reveal>

        <Reveal
          as="p"
          delay={0.3}
          className="mt-10 text-xs md:text-sm text-white/35 font-light"
        >
          {data?.footnote}
        </Reveal>
      </div>
    </section>
  );
}
