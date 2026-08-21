"use client";

import Link from "next/link";
import { ArrowUpRight, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Reveal, SplitReveal } from "@/components/Reveal";
import { Magnetic } from "@/components/Magnetic";
import { useWhatsApp } from "@/components/WhatsApp";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function CaseView({
  item,
  settings,
  others,
}: {
  item: any;
  settings: any;
  others: any[];
}) {
  const { open: openWhatsApp } = useWhatsApp();

  if (!item) return null;

  return (
    <>
      <Navbar settings={settings} />
      <main className="bg-white text-brand-black">
        {/* Case hero */}
        <section className="relative min-h-[80svh] flex flex-col justify-end overflow-hidden bg-brand-black text-white px-6 pb-16 pt-40">
          <div
            className="absolute inset-0 z-0"
            style={{
              background:
                "radial-gradient(120% 90% at 50% 25%, #1a1a1f 0%, #0c0c0e 60%, #060607 100%)",
            }}
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
              <Link href="/#casos" className="hover:text-white transition-colors">
                Casos de éxito
              </Link>
              <span>/</span>
              <span className="text-white/80">{item.index}</span>
            </Reveal>

            <Reveal
              as="span"
              className="block font-mono text-[11px] tracking-[0.3em] uppercase text-brand-accent mb-6"
            >
              {item.sector}
            </Reveal>

            <SplitReveal
              as="h1"
              className="max-w-5xl font-display font-medium tracking-tight leading-[1.02] text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-balance"
            >
              {item.title}
            </SplitReveal>

            <Reveal
              as="p"
              delay={0.1}
              className="mt-8 max-w-2xl text-lg md:text-xl text-white/70 leading-relaxed font-light"
            >
              {item.summary}
            </Reveal>
          </div>
        </section>

        {/* El punto de partida */}
        <section className="px-6 py-24 md:py-32 border-b border-gray-200">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-4">
              <span className="block font-mono text-xs tracking-[0.35em] uppercase text-gray-400">
                / El punto de partida
              </span>
            </div>
            <div className="lg:col-span-8">
              <SplitReveal
                as="p"
                className="text-2xl md:text-3xl lg:text-4xl font-display font-light tracking-tight leading-[1.25] text-brand-black text-balance"
              >
                {item.challenge}
              </SplitReveal>
            </div>
          </div>
        </section>

        {/* Qué hicimos */}
        <section className="px-6 py-24 md:py-32">
          <div className="max-w-7xl mx-auto">
            <Reveal
              as="span"
              className="block font-mono text-xs tracking-[0.35em] uppercase text-gray-400 mb-8"
            >
              / Qué hicimos
            </Reveal>
            <SplitReveal
              as="h2"
              className="max-w-3xl text-3xl md:text-5xl font-normal tracking-tight leading-[1.1] text-balance mb-16"
            >
              La intervención, paso a paso.
            </SplitReveal>

            <Reveal
              stagger={0.08}
              className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-200 border border-gray-200"
            >
              {(item.intervention ?? []).map((step: string, i: number) => (
                <div key={step} className="bg-white p-8 md:p-10">
                  <span className="block font-mono text-sm text-gray-400 mb-6">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-lg text-brand-black leading-relaxed">{step}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* El resultado */}
        <section className="bg-brand-black text-white px-6 py-24 md:py-32">
          <div className="max-w-7xl mx-auto">
            <Reveal
              as="span"
              className="block font-mono text-xs tracking-[0.35em] uppercase text-white/40 mb-8"
            >
              / El resultado
            </Reveal>
            <SplitReveal
              as="h2"
              className="max-w-3xl text-3xl md:text-5xl font-normal tracking-tight leading-[1.1] text-balance mb-16"
            >
              En qué se tradujo.
            </SplitReveal>

            <Reveal
              stagger={0.1}
              className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 border-t border-white/15 pt-12"
            >
              {(item.result ?? []).map((r: string) => (
                <div key={r} className="flex items-start gap-4">
                  <Check className="mt-1 w-5 h-5 text-brand-accent shrink-0" strokeWidth={1.75} />
                  <p className="text-lg md:text-xl text-white/85 leading-relaxed">{r}</p>
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
              className="max-w-3xl text-4xl md:text-6xl font-display font-medium tracking-tighter mb-8 text-balance"
            >
              ¿Tu empresa se parece a esta?
            </SplitReveal>
            <Reveal
              as="p"
              className="max-w-xl text-gray-500 leading-relaxed mb-10"
            >
              Empieza por un diagnóstico. Te decimos qué procesos te están frenando y
              qué se puede automatizar primero.
            </Reveal>
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

        {/* Other cases */}
        <section className="border-t border-gray-200 px-6 py-16 md:py-24">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <span className="font-mono text-xs tracking-[0.35em] uppercase text-gray-400">
                / Otros casos de éxito
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
                  href={`/casos/${o.slug}`}
                  data-cursor="hover"
                  className="group flex items-center justify-between gap-4 border-b border-gray-200 py-6 md:py-8"
                >
                  <div className="flex items-baseline gap-4 md:gap-8">
                    <span className="font-mono text-sm text-gray-400">/{o.index}</span>
                    <div>
                      <h3 className="font-display font-medium text-2xl md:text-4xl tracking-tight group-hover:text-gray-400 transition-colors">
                        {o.title}
                      </h3>
                      <span className="mt-2 block font-mono text-[11px] tracking-[0.25em] uppercase text-gray-400">
                        {o.sector}
                      </span>
                    </div>
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
