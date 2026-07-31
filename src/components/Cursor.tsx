import { useEffect, useRef } from "react";
import { gsap } from "../lib/gsap";

/**
 * A minimal blend-difference cursor: a small dot plus a trailing ring that
 * expands over interactive elements. Pointer-fine devices only.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (!finePointer) return;

    document.documentElement.classList.add("has-custom-cursor");

    const xDot = gsap.quickTo(dot.current, "x", { duration: 0.15, ease: "power3" });
    const yDot = gsap.quickTo(dot.current, "y", { duration: 0.15, ease: "power3" });
    const xRing = gsap.quickTo(ring.current, "x", { duration: 0.5, ease: "power3" });
    const yRing = gsap.quickTo(ring.current, "y", { duration: 0.5, ease: "power3" });

    let visible = false;
    const show = () => {
      if (visible) return;
      visible = true;
      gsap.to([dot.current, ring.current], { opacity: 1, duration: 0.3 });
    };
    // Resetting `visible` is what lets the cursor reappear after the pointer
    // leaves and re-enters the window (otherwise it stays hidden).
    const hide = () => {
      visible = false;
      gsap.to([dot.current, ring.current], { opacity: 0, duration: 0.3 });
    };

    const onMove = (e: PointerEvent) => {
      show();
      xDot(e.clientX);
      yDot(e.clientY);
      xRing(e.clientX);
      yRing(e.clientY);
    };

    const enter = () =>
      gsap.to(ring.current, { scale: 2.4, duration: 0.4, ease: "expo.out" });
    const leave = () =>
      gsap.to(ring.current, { scale: 1, duration: 0.4, ease: "expo.out" });

    const onOver = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t.closest("a, button, [data-cursor='hover']")) enter();
    };
    const onOut = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t.closest("a, button, [data-cursor='hover']")) leave();
    };

    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    document.addEventListener("mouseleave", hide);
    window.addEventListener("blur", hide);

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      document.removeEventListener("mouseleave", hide);
      window.removeEventListener("blur", hide);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] mix-blend-difference hidden md:block">
      <div
        ref={ring}
        className="absolute -ml-4 -mt-4 h-8 w-8 rounded-full border border-white opacity-0"
        style={{ willChange: "transform" }}
      />
      <div
        ref={dot}
        className="absolute -ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-white opacity-0"
        style={{ willChange: "transform" }}
      />
    </div>
  );
}
