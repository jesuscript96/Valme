import {
  createElement,
  useLayoutEffect,
  useRef,
  type ElementType,
  type ReactNode,
} from "react";
import { gsap, SplitText, EASE } from "../lib/gsap";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

/**
 * Generic scroll reveal. Slides + fades its content (or, with `stagger`,
 * its direct children) up into place when it enters the viewport.
 */
export function Reveal({
  children,
  as = "div",
  className = "",
  y = 40,
  delay = 0,
  stagger,
  start = "top 85%",
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  y?: number;
  delay?: number;
  stagger?: number;
  start?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const ctx = gsap.context(() => {
      const targets =
        stagger != null ? (gsap.utils.toArray(el.children) as Element[]) : el;
      gsap.from(targets, {
        y,
        opacity: 0,
        duration: 1.1,
        ease: EASE,
        delay,
        stagger: stagger ?? 0,
        scrollTrigger: { trigger: el, start },
      });
    }, el);
    return () => ctx.revert();
  }, [y, delay, stagger, start, reduced]);

  return createElement(as, { ref, className }, children);
}

/**
 * Headline reveal: splits text into masked lines that wipe up on scroll.
 * Waits for webfonts so the line breaks are measured correctly, and is
 * resilient to React StrictMode's mount/unmount/mount cycle.
 */
export function SplitReveal({
  children,
  as = "h2",
  className = "",
  start = "top 82%",
  duration = 1.1,
  stagger = 0.09,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  start?: string;
  duration?: number;
  stagger?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    let cancelled = false;
    let split: SplitText | null = null;
    let tween: gsap.core.Tween | null = null;

    const run = () => {
      if (cancelled || !el.isConnected) return;
      split = new SplitText(el, { type: "lines", mask: "lines" });
      tween = gsap.from(split.lines, {
        yPercent: 115,
        duration,
        ease: EASE,
        stagger,
        scrollTrigger: { trigger: el, start },
      });
    };

    if ((document as Document).fonts?.status === "loaded") run();
    else (document as Document).fonts?.ready.then(run);

    return () => {
      cancelled = true;
      tween?.scrollTrigger?.kill();
      tween?.kill();
      split?.revert();
    };
  }, [start, duration, stagger, reduced]);

  return createElement(as, { ref, className }, children);
}
