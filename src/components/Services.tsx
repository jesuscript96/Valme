"use client";
import { Fragment, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ScanSearch, Stethoscope, Wrench, Activity, ArrowUpRight, type LucideIcon } from "lucide-react";
import { SplitReveal, Reveal } from "./Reveal";
import { imageUrl } from "@/sanity/image";

const STEP_ICONS: LucideIcon[] = [ScanSearch, Stethoscope, Wrench, Activity];

type Step = { _key?: string; id?: string; name?: string; description?: string; image?: unknown };
type MethodData = {
  eyebrow?: string;
  heading?: { lead?: string; dim?: string };
  lead?: string;
  leadMono?: string;
  steps?: Step[];
};

export function Services({ data }: { data: MethodData }) {
  const MANDATE = data?.steps ?? [];
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section id="mandato" className="bg-white">
      <div className="max-w-7xl mx-auto px-6 pt-24 md:pt-32 pb-12">
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
        <Reveal
          as="p"
          delay={0.1}
          className="mt-8 max-w-2xl text-base md:text-lg text-gray-500 leading-relaxed"
        >
          {data?.lead}{" "}
          <span className="font-mono text-brand-black">{data?.leadMono}</span>.
        </Reveal>
      </div>

      <div className="flex flex-col border-t border-gray-200">
        {MANDATE.map((step, index) => {
          const isHovered = hoveredIndex === index;
          const Icon = STEP_ICONS[index] ?? Activity;
          const img = imageUrl(step.image as never);
          return (
            <Fragment key={step._key ?? step.id}>
            <Reveal
              as="div"
              y={30}
              start="top 92%"
              className="border-b border-gray-200"
            >
              <div
                data-cursor="hover"
                className={`relative transition-colors duration-500 ${
                  isHovered ? "bg-brand-gray-100" : "bg-white"
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div className="max-w-7xl mx-auto px-6 py-8 lg:py-12 flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-12">
                  {/* Left: Description & Number */}
                  <div className="w-full lg:w-[300px] flex flex-col justify-between self-stretch shrink-0">
                    <p className="text-base text-brand-black leading-relaxed max-w-sm">
                      {step.description}
                    </p>
                    <span
                      className={`text-sm font-mono mt-6 lg:mt-auto transition-colors duration-300 ${
                        isHovered ? "text-brand-accent" : "text-gray-400"
                      }`}
                    >
                      /{step.id}
                    </span>
                  </div>

                  {/* Middle: Icon → Image (clip-path wipe) */}
                  <div className="w-full lg:w-[320px] aspect-video relative flex items-center justify-center overflow-hidden shrink-0 rounded-sm">
                    <AnimatePresence mode="popLayout" initial={false}>
                      {isHovered && img ? (
                        <motion.img
                          key={`img-${step._key ?? step.id}`}
                          initial={{ clipPath: "inset(0 100% 0 0)", scale: 1.15 }}
                          animate={{ clipPath: "inset(0 0% 0 0)", scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                          src={img}
                          alt={step.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <motion.div
                          key={`icon-${step._key ?? step.id}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <Icon
                            className="w-20 h-20 text-brand-gray-200"
                            strokeWidth={1}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Right: Title */}
                  <div className="w-full lg:flex-grow flex items-center lg:justify-end gap-4 overflow-hidden">
                    <ArrowUpRight
                      className={`hidden lg:block w-8 h-8 text-brand-black transition-all duration-500 ${
                        isHovered
                          ? "opacity-100 translate-x-0 translate-y-0"
                          : "opacity-0 -translate-x-3 translate-y-3"
                      }`}
                      strokeWidth={1.25}
                    />
                    <h3
                      className={`font-display font-medium text-4xl sm:text-5xl lg:text-6xl xl:text-7xl tracking-tighter text-brand-black lg:text-right transition-transform duration-500 ${
                        isHovered ? "lg:-translate-x-1" : ""
                      }`}
                    >
                      {step.name}
                    </h3>
                  </div>
                </div>
              </div>
            </Reveal>
            </Fragment>
          );
        })}
      </div>
    </section>
  );
}
