"use client";
import { ArrowRight, Check, X } from "lucide-react";
import { SplitReveal, Reveal } from "./Reveal";
import { useWhatsApp } from "./WhatsApp";

type Plan = {
  _key?: string;
  index?: string;
  name?: string;
  pitch?: string;
  includes?: string[];
  ctaLabel?: string;
  variant?: "light" | "dark";
};
type MandatesData = {
  eyebrow?: string;
  heading?: { lead?: string; dim?: string };
  lead?: string;
  footnote?: string;
  plans?: Plan[];
};

function MandateCard({ data, onCta }: { data: Plan; onCta: () => void }) {
  const dark = data.variant === "dark";
  return (
    <div
      data-cursor="hover"
      className={`group relative flex flex-col p-8 md:p-12 min-h-[440px] transition-colors duration-500 ${
        dark
          ? "bg-brand-black text-white"
          : "bg-white text-brand-black border border-gray-200"
      }`}
    >
      {dark && (
        <span className="absolute inset-0 bg-brand-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
      )}
      <div className="relative z-10 flex items-center justify-between mb-8">
        <span
          className={`font-mono text-xs tracking-[0.3em] uppercase ${
            dark ? "text-white/50 group-hover:text-white/80" : "text-gray-400"
          } transition-colors`}
        >
          / {data.index}
        </span>
        <Check
          className={`w-5 h-5 ${dark ? "text-white/70" : "text-gray-300"}`}
          strokeWidth={1.5}
        />
      </div>

      <h3 className="relative z-10 font-display font-medium text-3xl md:text-4xl tracking-tight mb-5">
        {data.name}
      </h3>
      <p
        className={`relative z-10 text-sm md:text-base leading-relaxed mb-10 ${
          dark ? "text-white/70 group-hover:text-white/90" : "text-gray-600"
        } transition-colors`}
      >
        {data.pitch}
      </p>

      <ul className="relative z-10 mt-auto space-y-3 mb-10">
        {(data.includes ?? []).map((item) => (
          <li key={item} className="flex items-start gap-3 text-sm">
            <span
              className={`mt-1.5 block w-1 h-1 rounded-full shrink-0 ${
                dark ? "bg-white/60" : "bg-brand-accent"
              }`}
            />
            <span className={dark ? "text-white/80 group-hover:text-white" : "text-gray-700"}>
              {item}
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onCta}
        className="relative z-10 group/btn inline-flex items-center gap-2 text-sm font-medium w-fit"
      >
        {data.ctaLabel}
        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}

export function Mandates({ data }: { data: MandatesData }) {
  const { open: openWhatsApp } = useWhatsApp();
  const plans = data?.plans ?? [];

  return (
    <section id="mandatos" className="bg-brand-gray-100 px-6 py-24 md:py-32">
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
          {data?.lead}
        </Reveal>

        <Reveal
          stagger={0.12}
          y={50}
          className="mt-16 md:mt-20 grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {plans.map((plan) => (
            <MandateCard key={plan._key ?? plan.index} data={plan} onCta={openWhatsApp} />
          ))}
        </Reveal>

        <Reveal
          as="p"
          delay={0.2}
          className="mt-8 flex items-center gap-2 text-sm text-gray-400"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
          {data?.footnote}
        </Reveal>
      </div>
    </section>
  );
}
