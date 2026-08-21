"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight } from "lucide-react";
import { SplitReveal, Reveal } from "./Reveal";
import { useWhatsApp } from "./WhatsApp";

const AUTOPLAY_INTERVAL = 7000;

type Symptom = { _key?: string; label?: string; statement?: string; detail?: string };
type SymptomsData = {
  eyebrow?: string;
  heading?: { lead?: string; dim?: string };
  items?: Symptom[];
};

export function FeatureTabs({ data }: { data: SymptomsData }) {
  const SYMPTOMS = data?.items ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const { open: openWhatsApp } = useWhatsApp();

  const startTimeRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!SYMPTOMS.length) return;
    startTimeRef.current = Date.now();
    setProgress(0);

    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / AUTOPLAY_INTERVAL) * 100, 100);
      setProgress(newProgress);

      if (elapsed >= AUTOPLAY_INTERVAL) {
        setActiveIndex((prev) => (prev + 1) % SYMPTOMS.length);
        startTimeRef.current = Date.now();
      } else {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateProgress);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [activeIndex, SYMPTOMS.length]);

  const symptom = SYMPTOMS[activeIndex];

  return (
    <section id="sintomas" className="py-24 md:py-32 bg-brand-gray-100">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="mb-14 max-w-3xl">
          <Reveal
            as="span"
            className="block font-mono text-xs tracking-[0.35em] uppercase text-gray-400 mb-8"
          >
            {data?.eyebrow}
          </Reveal>
          <SplitReveal
            as="h2"
            className="text-4xl md:text-6xl lg:text-7xl font-normal text-brand-black tracking-tight leading-[1.1] text-balance"
          >
            {data?.heading?.lead} <span className="text-gray-400">{data?.heading?.dim}</span>
          </SplitReveal>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 pb-4">
          {SYMPTOMS.map((s, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={s._key ?? s.label}
                onClick={() => setActiveIndex(index)}
                className={`flex-none px-5 py-2.5 rounded-sm text-sm font-medium transition-all relative overflow-hidden uppercase tracking-wider ${
                  isActive
                    ? "bg-white text-black shadow-sm"
                    : "bg-white/50 text-gray-500 hover:bg-white/80 hover:text-gray-900"
                }`}
              >
                <span className="relative z-10">{s.label}</span>
                {isActive && (
                  <div className="absolute inset-0 z-0 bg-gray-100 pointer-events-none">
                    <div
                      className="h-full bg-white transition-none"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Display */}
        <div className="relative bg-brand-black rounded-lg overflow-hidden min-h-[520px] lg:min-h-[600px] flex items-center shadow-2xl px-8 md:px-16 lg:px-24">
          <span className="absolute right-8 top-8 font-mono text-xs tracking-[0.35em] uppercase text-white/25">
            {String(activeIndex + 1).padStart(2, "0")} / {String(SYMPTOMS.length).padStart(2, "0")}
          </span>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-20 max-w-3xl"
            >
              <span className="text-gray-400 font-mono text-xs tracking-widest uppercase mb-6 block">
                {symptom?.label}
              </span>
              <h3 className="text-3xl md:text-5xl lg:text-6xl font-display font-medium text-white tracking-tight leading-[1.05] mb-8 text-balance">
                {symptom?.statement}
              </h3>
              <p className="text-gray-400 text-base md:text-lg leading-relaxed max-w-xl">
                {symptom?.detail}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="absolute left-8 md:left-16 lg:left-24 bottom-8 md:bottom-10 z-20">
            <button
              type="button"
              onClick={openWhatsApp}
              className="group inline-flex items-center gap-2 text-white font-medium hover:text-white/80 transition-colors text-sm"
            >
              Solicitar diagnóstico
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
