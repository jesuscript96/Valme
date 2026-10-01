/**
 * Marca Valme — activos maestros del kit de identidad (SELLO 2C + WORDMARK).
 * Ambos SVG usan `fill="currentColor"`: heredan el color del texto, así que una
 * sola copia sirve para tema claro y oscuro. No alterar los paths.
 */

type LogoProps = { className?: string };

/** Sello 2C «la incisión» — viewBox 0 0 84 100 · ratio 0.84:1. Marca compacta. */
export function ValmeSeal({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 84 100"
      fill="currentColor"
      role="img"
      aria-label="Valme"
      className={className}
    >
      <path d="M0,0 H16 L31.4,44 H15.4 Z" />
      <path d="M68,0 H84 L68.6,44 H52.6 Z" />
      <path d="M18.9,54 H34.9 L42,74.3 L49.1,54 H65.1 L49,100 H35 Z" />
    </svg>
  );
}

/** Wordmark VALME — viewBox 0 0 464 100 · ratio 4.64:1. Cabecera, pie y firma. */
export function ValmeWordmark({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 464 100"
      fill="currentColor"
      role="img"
      aria-label="VALME Solutions"
      className={className}
    >
      <path d="M0,0 H16 L42,74.3 L68,0 H84 L49,100 H35 Z" />
      <path d="M137,0 H151 L186,100 H170 L144,25.7 L118,100 H102 Z" />
      <path d="M113.2,68 L174.8,68 L180.4,84 L107.6,84 Z" />
      <path d="M212,0 H227 V84 H268 V100 H212 Z" />
      <path d="M290,100 V0 H307 L334,58 L361,0 H378 V100 H363 V32 L339,82 H329 L305,32 V100 Z" />
      <path d="M404,0 H462 V16 H419 V42 H452 V57 H419 V84 H464 V100 H404 Z" />
    </svg>
  );
}
