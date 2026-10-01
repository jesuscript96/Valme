import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * GUARDA DE DESTINOS.
 *
 * El agente decide a qué URL ir, y lo que lee en una página puede intentar convencerle
 * de ir a otra. El worker vive en el mismo servidor que otros servicios (Coolify en
 * Hetzner), así que sin esta guarda un `browser_navigate` a http://10.0.0.5:8000 o a
 * http://localhost sería una puerta a la red interna.
 *
 * Regla: sólo http(s) y sólo hosts que resuelven a direcciones públicas. Se aplica antes
 * de navegar y a cada petición que hace la página (ver tools/browser.ts).
 *
 * Límite conocido: entre esta resolución y la del navegador puede cambiar el DNS
 * (rebinding). La defensa de fondo es la red del contenedor sandbox, que no debe tener
 * ruta a la red interna; esto es la segunda capa.
 */

export class DestinoBloqueadoError extends Error {
  constructor(motivo: string) {
    super(`Destino bloqueado: ${motivo}`);
    this.name = "DestinoBloqueadoError";
  }
}

function ipv4Privada(ip: string): boolean {
  const [a, b, c] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    (a === 169 && b === 254) ||           // link-local y metadatos de nube
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) || // IETF y TEST-NET-1 (no todo 192.0/16)
    (a === 198 && b === 51 && c === 100) ||           // TEST-NET-2
    (a === 203 && b === 0 && c === 113) ||            // TEST-NET-3
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224                               // multicast y reservadas
  );
}

function ipv6Privada(ip: string): boolean {
  const x = ip.toLowerCase();
  if (x === "::" || x === "::1") return true;
  const v4 = x.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (v4) return ipv4Privada(v4[1]);
  return (
    x.startsWith("fc") || x.startsWith("fd") ||  // ULA
    x.startsWith("fe8") || x.startsWith("fe9") || x.startsWith("fea") || x.startsWith("feb") || // link-local
    x.startsWith("ff")                             // multicast
  );
}

export function ipPrivada(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) return ipv4Privada(ip);
  if (v === 6) return ipv6Privada(ip);
  return true;
}

export type Resolver = (host: string) => Promise<string[]>;

const resolverDns: Resolver = async (host) =>
  (await lookup(host, { all: true, verbatim: true })).map((r) => r.address);

/** Crea una guarda con caché por host: una página hace cientos de peticiones al mismo. */
export function crearGuarda(resolver: Resolver = resolverDns) {
  const cache = new Map<string, Promise<void>>();

  async function comprobarHost(host: string): Promise<void> {
    const limpio = host.replace(/^\[|\]$/g, "");
    if (limpio === "localhost" || limpio.endsWith(".localhost") || limpio.endsWith(".internal")) {
      throw new DestinoBloqueadoError(`${host} es un nombre local`);
    }
    if (isIP(limpio)) {
      if (ipPrivada(limpio)) throw new DestinoBloqueadoError(`${host} es una dirección privada`);
      return;
    }
    let ips: string[];
    try {
      ips = await resolver(limpio);
    } catch {
      throw new DestinoBloqueadoError(`${host} no resuelve`);
    }
    if (ips.length === 0) throw new DestinoBloqueadoError(`${host} no resuelve`);
    const privada = ips.find(ipPrivada);
    if (privada) throw new DestinoBloqueadoError(`${host} resuelve a una dirección privada (${privada})`);
  }

  return {
    /** Lanza `DestinoBloqueadoError` si la URL no es http(s) o apunta a la red privada. */
    async comprobar(url: string): Promise<URL> {
      let u: URL;
      try {
        u = new URL(url);
      } catch {
        throw new DestinoBloqueadoError(`«${url}» no es una URL`);
      }
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        throw new DestinoBloqueadoError(`sólo se permite http y https, no ${u.protocol}`);
      }
      if (u.username || u.password) throw new DestinoBloqueadoError("la URL lleva credenciales");
      let p = cache.get(u.hostname);
      if (!p) {
        p = comprobarHost(u.hostname);
        cache.set(u.hostname, p);
      }
      await p;
      return u;
    },
  };
}

export type Guarda = ReturnType<typeof crearGuarda>;
