"use client";
import { useEffect, useRef, useState } from "react";
import { gsap, EASE_INOUT } from "../lib/gsap";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

// Only play the intro once per session, so client-side navigation back to
// the home route doesn't replay it (or lock scroll).
let hasPreloaded = false;

/**
 * Full-screen intro overlay: an animated 00 → 100 counter and wordmark,
 * followed by a slab curtain reveal. Calls onComplete when the page
 * should become interactive.
 */
export function Preloader({ onComplete }: { onComplete: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const [hidden, setHidden] = useState(hasPreloaded);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced || hasPreloaded) {
      hasPreloaded = true;
      onComplete();
      setHidden(true);
      return;
    }

    const el = root.current;
    if (!el) return;

    document.body.style.overflow = "hidden";

    const ctx = gsap.context(() => {
      const counter = { v: 0 };
      const tl = gsap.timeline({
        onComplete: () => {
          hasPreloaded = true;
          document.body.style.overflow = "";
          onComplete();
          setHidden(true);
        },
      });

      // Wordmark + counter rise in.
      tl.from(".pl-rise", {
        yPercent: 120,
        duration: 0.9,
        ease: "expo.out",
        stagger: 0.08,
      })
        // Count up while the progress line draws.
        .to(
          counter,
          {
            v: 100,
            duration: 1.9,
            ease: "power2.inOut",
            onUpdate: () => {
              if (countRef.current)
                countRef.current.textContent = String(
                  Math.round(counter.v)
                ).padStart(3, "0");
            },
          },
          0.2
        )
        .to(".pl-bar", { scaleX: 1, duration: 1.9, ease: "power2.inOut" }, 0.2)
        // Lift content, then drop the slab curtain.
        .to(".pl-content", {
          yPercent: -120,
          opacity: 0,
          duration: 0.7,
          ease: "expo.in",
        })
        .to(
          ".pl-slab",
          {
            scaleY: 0,
            transformOrigin: "top",
            duration: 0.9,
            ease: EASE_INOUT,
            stagger: 0.08,
          },
          "-=0.3"
        );
    }, el);

    return () => {
      ctx.revert();
      document.body.style.overflow = "";
    };
  }, [onComplete, reduced]);

  if (hidden) return null;

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
      aria-hidden="true"
    >
      {/* Slab curtain */}
      <div className="absolute inset-0 flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="pl-slab h-full flex-1 bg-brand-black" />
        ))}
      </div>

      {/* Content */}
      <div className="pl-content relative z-10 flex flex-col items-center px-6">
        <div className="overflow-hidden">
          <span className="pl-rise block font-display text-white text-[12vw] md:text-[7rem] leading-none font-medium tracking-tighter">
            Valme
          </span>
        </div>
        <div className="overflow-hidden mt-4">
          <span className="pl-rise block font-mono text-white/40 text-xs tracking-[0.4em] uppercase">
            Private Operations Firm
          </span>
        </div>

        {/* Progress line + counter */}
        <div className="mt-10 w-[60vw] max-w-md flex items-center gap-4">
          <div className="relative h-px flex-1 bg-white/15 overflow-hidden">
            <div className="pl-bar absolute inset-0 bg-white origin-left scale-x-0" />
          </div>
          <span
            ref={countRef}
            className="font-mono text-white/70 text-sm tabular-nums"
          >
            000
          </span>
        </div>
      </div>
    </div>
  );
}
