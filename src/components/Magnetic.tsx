import { useRef, type MouseEvent, type ReactNode } from "react";
import { gsap } from "../lib/gsap";

/**
 * Wraps a single child so it gently "sticks" to the cursor within its
 * bounds — the classic awwwards magnetic button effect. No-op on touch.
 */
export function Magnetic({
  children,
  strength = 0.4,
  className = "",
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: MouseEvent) => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const el = ref.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = (e.clientX - (left + width / 2)) * strength;
    const y = (e.clientY - (top + height / 2)) * strength;
    gsap.to(el, { x, y, duration: 0.6, ease: "expo.out" });
  };

  const reset = () => {
    if (ref.current)
      gsap.to(ref.current, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
  };

  return (
    <div
      ref={ref}
      className={`inline-block ${className}`}
      onMouseMove={onMove}
      onMouseLeave={reset}
    >
      {children}
    </div>
  );
}
