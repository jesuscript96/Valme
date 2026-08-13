"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { gsap, SplitText, EASE } from "../lib/gsap";
import { Magnetic } from "./Magnetic";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { useCta, type CtaData } from "./useCta";

type HeroData = {
  eyebrow?: string;
  titleLine1?: string;
  titleLine2?: string;
  subtitle?: string;
  paragraph?: string;
  primaryCta?: CtaData;
  secondaryCta?: CtaData;
  mediaUrl?: string;
};

export function Hero({ ready, data }: { ready: boolean; data: HeroData }) {
  const root = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduced = usePrefersReducedMotion();
  const cta = useCta();
  const onPrimary = cta(data?.primaryCta);
  const onSecondary = cta(data?.secondaryCta);
  const mediaUrl = data?.mediaUrl || "/assets/ValmeSolutionsVideo.webm";

  // Ensure the background video plays (some browsers ignore the attribute).
  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (reduced) return;

    let cancelled = false;
    let split: SplitText | null = null;

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>(".hero-fade");
      gsap.set(".hero-line", { yPercent: 120 });
      gsap.set(items, { opacity: 0, y: 24 });

      if (!reduced) {
        gsap.to(".hero-inner", {
          yPercent: -18,
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      if (!ready) return;

      const build = () => {
        if (cancelled || !el.isConnected) return;
        const title = el.querySelector<HTMLElement>(".hero-title");
        const tl = gsap.timeline({ delay: 0.1 });

        if (title) {
          split = new SplitText(title, { type: "chars,lines", mask: "lines" });
          gsap.set(split.chars, { yPercent: 120 });
          tl.to(split.chars, {
            yPercent: 0,
            duration: 1.1,
            ease: EASE,
            stagger: 0.018,
          });
        }
        tl.to(
          ".hero-line",
          { yPercent: 0, duration: 1, ease: EASE, stagger: 0.1 },
          0.2
        ).to(
          items,
          { opacity: 1, y: 0, duration: 1, ease: EASE, stagger: 0.12 },
          "-=0.6"
        );
      };

      if ((document as Document).fonts?.status === "loaded") build();
      else (document as Document).fonts?.ready.then(build);
    }, el);

    return () => {
      cancelled = true;
      split?.revert();
      ctx.revert();
    };
  }, [ready, reduced]);

  return (
    <section
      ref={root}
      className="relative w-full h-[100svh] min-h-[640px] flex items-center justify-center overflow-hidden bg-brand-black"
    >
      {/* Background video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 z-0 h-full w-full object-cover scale-105 opacity-80"
      >
        <source src={mediaUrl} type="video/webm" />
      </video>

      {/* Vignette + bottom fade into the next section. */}
      <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-b from-brand-black/40 via-brand-black/10 to-brand-black" />
      <div
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 52%, rgba(6,6,7,0.65) 0%, rgba(6,6,7,0) 72%)",
        }}
      />

      {/* Content */}
      <div className="hero-inner relative z-10 px-6 w-full max-w-6xl mx-auto flex flex-col items-center text-center">
        <div className="overflow-hidden mb-7">
          <p className="hero-line font-mono text-[11px] md:text-xs tracking-[0.45em] uppercase text-white/45">
            {data?.eyebrow}
          </p>
        </div>

        <h1 className="hero-title font-display font-medium text-white tracking-tighter leading-[0.92] text-[10vw] sm:text-[8vw] md:text-[5.5rem] lg:text-[7rem]">
          {data?.titleLine1}
          <br />
          {data?.titleLine2}
        </h1>

        <div className="overflow-hidden mt-3 mb-8">
          <p className="hero-line font-display text-white/90 text-[6vw] sm:text-2xl md:text-3xl lg:text-4xl tracking-tight font-light">
            {data?.subtitle}
          </p>
        </div>

        <p className="hero-fade max-w-xl text-base md:text-lg text-white/70 leading-relaxed font-light">
          {data?.paragraph}
        </p>

        <div className="hero-fade mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Magnetic strength={0.5}>
            <button
              type="button"
              onClick={onPrimary}
              className="group relative inline-flex items-center gap-2 px-7 py-3.5 bg-white text-brand-black text-sm font-medium tracking-wide rounded-full overflow-hidden"
            >
              <span className="relative z-10">{data?.primaryCta?.label}</span>
              <ArrowDown className="relative z-10 w-4 h-4 -rotate-90 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </Magnetic>
          <button
            type="button"
            onClick={onSecondary}
            className="group inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white transition-colors tracking-wide"
          >
            {data?.secondaryCta?.label}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="hero-fade absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/35">
          Scroll
        </span>
        <span className="relative block h-10 w-px bg-white/15 overflow-hidden">
          <span className="absolute inset-x-0 top-0 h-1/2 bg-white/70 animate-scroll-cue" />
        </span>
      </div>
    </section>
  );
}
