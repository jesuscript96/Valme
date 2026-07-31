/**
 * Subtle film-grain texture layered over the whole page for a tactile,
 * print-like finish. Pure SVG turbulence, no runtime cost.
 */
export function Grain() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[80] opacity-[0.035] mix-blend-overlay"
      aria-hidden="true"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}
