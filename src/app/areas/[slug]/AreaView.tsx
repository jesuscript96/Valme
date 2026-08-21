"use client";

import Link from "next/link";
import { ArrowUpRight, ArrowRight, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Reveal, SplitReveal } from "@/components/Reveal";
import { Magnetic } from "@/components/Magnetic";
import { useWhatsApp } from "@/components/WhatsApp";
import { areaIcon } from "@/lib/areaIcons";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function AreaView({
  area,
  settings,
  others,
}: {
  area: any;
  settings: any;
  others: any[];
}) {
  const { open: openWhatsApp } = useWhatsApp();

  if (!area) return null;

  const Icon = areaIcon(area.icon);
  const process: any[] = settings?.areaMandateSteps ?? [];

  return (
    <>
      <Navbar settings={settings} />
      <main className="bg-white text-brand-black">
        {/* Area hero */}
        <section className="relative min-h-[88svh] flex flex-col justify-end overflow-hidden bg-brand-black text-white px-6 pb-16 pt-40">
          <div
            className="absolute inset-0 z-0"
            style={{
              background:
                "radial-gradient(120% 90% at 50% 30%, #1a1a1f 0%, #0c0c0e 60%, #060607 100%)",
            }}
          />
          <Icon
            className="absolute right-6 top-1/3 -z-0 w-[40vw] max-w-[420px] text-white/[0.04]"
            strokeWidth={0.75}
          />

          <div className="relative z-10 max-w-7xl mx-auto w-full">
            <Reveal
              as="div"
              className="flex items-center gap-3 mb-8 font-mono text-xs tracking-[0.35em] uppercase text-white/45"
            >
              <Link href="/" className="hover:text-white transition-colors">
                {settings?.brandName ?? "Valme"}
              </Link>
              <span>/</span>
              <span>Intervención</span>
              <span>/</span>
              <span className="text-white/80">{area.name}</span>
            </Reveal>

            <SplitReveal
              as="h1"
              className="font-display font-medium tracking-tighter leading-[0.95] text-[15vw] md:text-[9rem] lg:text-[10rem]"
            >
              {area.name}
            </SplitReveal>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
              <Reveal
                as="p"
                className="lg:col-span-7 text-2xl md:text-3xl font-display font-light tracking-tight text-white/90 text-balance"
              >
                {area.tagline}
              </Reveal>
              <Reveal
                as="p"
                delay={0.1}
                className="lg:col-span-5 text-base md:text-lg text-white/55 leading-relaxed font-light"
              >
                {area.intro}
              </Reveal>
            </div>
          </div>
        </section>

        {/* Process strip — The Valme Mandate */}
        <section className="border-b border-gray-200 px-6 py-16 md:py-20">
          <div className="max-w-7xl mx-auto mb-10">
            <span className="block font-mono text-xs tracking-[0.35em] uppercase text-gray-400">
              {settings?.areaMandateEyebrow ?? "/ The Valme Mandate"}
            </span>
          </div>
          <Reveal
            stagger={0.1}
            className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200 border-y border-gray-200"
          >
            {process.map((p) => (
              <div key={p._key ?? p.step} className="bg-white p-8">
                <span className="block font-mono text-xs text-brand-accent mb-4">
                  /{p.step}
                </span>
                <h3 className="text-lg font-medium tracking-tight mb-2">{p.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </Reveal>
        </section>

        {/* Concrete cases */}
        <section className="px-6 py-24 md:py-32">
          <div className="max-w-7xl mx-auto">
            <Reveal
              as="span"
              className="block font-mono text-xs tracking-[0.35em] uppercase text-gray-400 mb-8"
            >
              / Escenarios
            </Reveal>
            <SplitReveal
              as="h2"
              className="max-w-4xl text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight leading-[1.1] text-balance"
            >
              Cómo se manifiesta la <span className="text-gray-400">exposición</span> en {String(area.name).toLowerCase()}.
            </SplitReveal>

            <Reveal
              as="p"
              delay={0.1}
              className="mt-8 max-w-2xl text-sm text-gray-500 leading-relaxed"
            >
              {settings?.areaScenariosNote}
            </Reveal>

            <Reveal
              stagger={0.08}
              y={50}
              className="mt-16 md:mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200 border border-gray-200"
            >
              {(area.cases ?? []).map((c: any, i: number) => (
                <div
                  key={c._key ?? c.title}
                  data-cursor="hover"
                  className="group relative bg-white p-8 md:p-10 transition-colors duration-500 hover:bg-brand-gray-50"
                >
                  <span className="absolute top-0 left-0 h-px w-0 bg-brand-accent transition-[width] duration-500 ease-out group-hover:w-full" />
                  <span className="block font-mono text-sm text-gray-400 mb-6">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-xl md:text-2xl font-medium tracking-tight mb-3">
                    {c.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{c.description}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* Intangible benefits */}
        <section className="bg-brand-black text-white px-6 py-24 md:py-32">
          <div className="max-w-7xl mx-auto">
            <Reveal
              as="span"
              className="block font-mono text-xs tracking-[0.35em] uppercase text-white/40 mb-8"
            >
              / Resultado de la intervención
            </Reveal>
            <SplitReveal
              as="h2"
              className="max-w-3xl text-3xl md:text-5xl font-normal tracking-tight leading-[1.1] text-balance mb-16"
            >
              Lo que se restablece al intervenir.
            </SplitReveal>

            <Reveal
              stagger={0.12}
              className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12 border-t border-white/15 pt-12"
            >
              {(area.benefits ?? []).map((b: any, i: number) => (
                <div key={b._key ?? b.label}>
                  <span className="block font-mono text-xs text-white/30 mb-4">
                    /0.{i + 1}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-display font-medium tracking-tight mb-3">
                    {b.label}
                  </h3>
                  <p className="text-white/55 leading-relaxed">{b.detail}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-24 md:py-32">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
            <SplitReveal
              as="h2"
              className="text-4xl md:text-6xl lg:text-7xl font-display font-medium tracking-tighter mb-10 text-balance"
            >
              ¿Intervenir en {String(area.name).toLowerCase()}?
            </SplitReveal>
            <Reveal as="div">
              <Magnetic strength={0.5}>
                <button
                  type="button"
                  onClick={openWhatsApp}
                  className="group inline-flex items-center gap-2 px-8 py-4 bg-brand-black text-white text-sm font-medium tracking-wide rounded-full"
                >
                  Solicitar diagnóstico
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Magnetic>
            </Reveal>
          </div>
        </section>

        {/* Other areas */}
        <section className="border-t border-gray-200 px-6 py-16 md:py-24">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <span className="font-mono text-xs tracking-[0.35em] uppercase text-gray-400">
                / Otras áreas de intervención
              </span>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Volver al inicio
              </Link>
            </div>

            <div className="flex flex-col border-t border-gray-200">
              {(others ?? []).map((o: any) => (
                <Link
                  key={o._id}
                  href={`/areas/${o.slug}`}
                  data-cursor="hover"
                  className="group flex items-center justify-between gap-4 border-b border-gray-200 py-6 md:py-8"
                >
                  <div className="flex items-baseline gap-4 md:gap-8">
                    <span className="font-mono text-sm text-gray-400">/{o.index}</span>
                    <h3 className="font-display font-medium text-3xl md:text-5xl tracking-tighter group-hover:text-gray-400 transition-colors">
                      {o.name}
                    </h3>
                  </div>
                  <ArrowUpRight
                    className="w-7 h-7 shrink-0 text-brand-black -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300"
                    strokeWidth={1.25}
                  />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer settings={settings} />
    </>
  );
}
