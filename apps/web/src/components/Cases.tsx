"use client";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SplitReveal, Reveal } from "./Reveal";
import { useCta, type CtaData } from "./useCta";

type CaseCard = {
  _id: string;
  slug?: string;
  index?: string;
  image?: string;
  title?: string;
  sector?: string;
  summary?: string;
  challenge?: string;
  result?: string[];
};
type CasesData = {
  eyebrow?: string;
  heading?: { lead?: string; dim?: string };
  intro?: string;
  cta?: CtaData;
};

export function Cases({ data, cases }: { data: CasesData; cases: CaseCard[] }) {
  const cta = useCta();
  const onCta = cta(data?.cta);

  return (
    <section id="casos" className="bg-brand-gray-50 text-brand-black px-6 py-24 md:py-32">
      <div className="max-w-7xl mx-auto">
        <Reveal
          as="span"
          className="block font-mono text-xs tracking-[0.35em] uppercase text-gray-400 mb-8"
        >
          {data?.eyebrow}
        </Reveal>
        <SplitReveal
          as="h2"
          className="max-w-4xl text-4xl md:text-6xl lg:text-7xl font-normal tracking-tight leading-[1.1] text-balance"
        >
          {data?.heading?.lead}{" "}
          <span className="text-gray-400">{data?.heading?.dim}</span>
        </SplitReveal>
        <Reveal
          as="p"
          delay={0.1}
          className="mt-8 max-w-2xl text-base md:text-lg text-gray-500 leading-relaxed font-light"
        >
          {data?.intro}
        </Reveal>

        <div className="mt-16 md:mt-20 flex flex-col gap-px bg-gray-200 border border-gray-200">
          {(cases ?? []).map((c) => (
            <Reveal as="div" y={40} key={c._id}>
              <Link
                href={`/casos/${c.slug}`}
                data-cursor="hover"
                className="group relative block bg-white p-8 md:p-12 transition-colors duration-500 hover:bg-brand-gray-100"
              >
                <span className="absolute top-0 left-0 h-px w-0 bg-brand-accent transition-[width] duration-500 ease-out group-hover:w-full" />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                  {/* Left: identity */}
                  <div className="lg:col-span-6">
                    {c.image && (
                      <div className="mb-7 h-36 w-full sm:h-40 sm:w-64 overflow-hidden rounded-md">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={c.image}
                          alt={c.title ?? ""}
                          className="h-full w-full object-cover grayscale transition-[filter,transform] duration-500 group-hover:grayscale-0 group-hover:scale-[1.03]"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-4 mb-6">
                      <span className="font-mono text-sm text-brand-accent">/{c.index}</span>
                      <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-gray-400">
                        {c.sector}
                      </span>
                    </div>
                    <h3 className="font-display font-medium text-2xl md:text-4xl tracking-tight leading-[1.05] text-balance mb-5">
                      {c.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed max-w-md">{c.summary}</p>
                    <span className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-brand-black group-hover:text-brand-accent transition-colors">
                      Ver caso completo
                      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </span>
                  </div>

                  {/* Right: reto → resultado */}
                  <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-8 lg:border-l lg:border-gray-200 lg:pl-12">
                    <div>
                      <span className="block font-mono text-[11px] tracking-[0.25em] uppercase text-gray-400 mb-4">
                        El punto de partida
                      </span>
                      <p className="text-sm text-gray-600 leading-relaxed">{c.challenge}</p>
                    </div>
                    <div>
                      <span className="block font-mono text-[11px] tracking-[0.25em] uppercase text-gray-400 mb-4">
                        El resultado
                      </span>
                      <ul className="space-y-2.5">
                        {(c.result ?? []).slice(0, 3).map((r) => (
                          <li key={r} className="flex items-start gap-2.5 text-sm text-gray-700">
                            <span className="mt-1.5 block w-1 h-1 rounded-full bg-brand-accent shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>

        {onCta && (
          <Reveal as="div" y={30} className="mt-12">
            <button
              type="button"
              onClick={onCta}
              className="group inline-flex items-center gap-3 px-7 py-3.5 bg-brand-black text-white text-sm font-medium tracking-wide rounded-full"
            >
              {data?.cta?.label}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Reveal>
        )}
      </div>
    </section>
  );
}
