/**
 * Comprobaciones de red del agente HTTP, sin dependencias de servidor para poder
 * probarlas: qué URL se admite y qué direcciones IP cuentan como públicas.
 */

export function urlDeSondeo(entrada: string): URL {
  const url = new URL(entrada.includes("://") ? entrada : `https://${entrada}`);
  if (
    url.protocol !== "https:" || url.port || url.username || url.password ||
    url.pathname !== "/" || url.search || url.hash || !url.hostname.includes(".")
  ) {
    throw new Error("El agente solo admite la portada HTTPS del dominio.");
  }
  return url;
}

export function ipv4Publica(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  const [a = -1, b = -1] = p;
  return !(
    a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || b === 0 || b === 2)) ||
    (a === 198 && (b === 18 || b === 19 || b === 51)) ||
    (a === 203 && b === 0)
  );
}
