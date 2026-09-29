import { resolve4 } from "node:dns/promises";
import { request } from "node:https";

// The first pilot deliberately accepts only VALME, with no redirects or arbitrary URLs.
export function pilotUrl(domain: string): URL {
  const url = new URL(domain.includes("://") ? domain : `https://${domain}`);
  if (
    url.protocol !== "https:" ||
    url.port ||
    url.username ||
    url.password ||
    !["valmesolutions.com", "www.valmesolutions.com"].includes(url.hostname) ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("El piloto solo admite la portada HTTPS de VALME.");
  }
  return url;
}

export function publicIpv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255))
    return false;
  const [a = -1, b = -1] = parts;
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || b === 0 || b === 2)) ||
    (a === 198 && (b === 18 || b === 19 || b === 51)) ||
    (a === 203 && b === 0)
  );
}

export async function probeHomepage(domain: string): Promise<string> {
  const url = pilotUrl(domain);
  let dnsTimer: ReturnType<typeof setTimeout> | undefined;
  const addresses = await Promise.race([
    resolve4(url.hostname),
    new Promise<never>((_, reject) => {
      dnsTimer = setTimeout(() => reject(new Error("Tiempo DNS agotado.")), 2000);
    }),
  ]).finally(() => clearTimeout(dnsTimer));
  const address = addresses[0];
  if (!address || addresses.some((address) => !publicIpv4(address)))
    throw new Error("Destino de red no permitido.");
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => req.destroy(new Error("Tiempo de lectura agotado.")), 4000);
    // Pin the validated DNS address while preserving the original TLS hostname.
    const req = request(
      url,
      {
        method: "GET",
        agent: false,
        family: 4,
        autoSelectFamily: false,
        lookup: (_host, _options, callback) => callback(null, address, 4),
        headers: {
          "user-agent": "VALME-Staging-Probe/1.0",
          accept: "text/html",
          "accept-encoding": "identity",
        },
      },
      (response) => {
        let bytes = 0;
        response.on("data", (chunk: Buffer) => {
          bytes += chunk.length;
          if (bytes > 512_000) req.destroy(new Error("Respuesta superior al limite de 512 KB."));
        });
        response.on("error", reject);
        response.on("end", () => {
          clearTimeout(timer);
          resolve(
            JSON.stringify({
              url: url.href,
              status: response.statusCode,
              contentType: response.headers["content-type"] ?? null,
              xRobotsTag: response.headers["x-robots-tag"] ?? null,
              bytes,
              redirectFollowed: false,
              observedAt: new Date().toISOString(),
              limitations:
                "Solo respuesta HTTP de portada. No analiza HTML, indexacion, rankings ni demanda. Redirecciones no seguidas. No responde por si sola a una investigacion comercial.",
            }),
          );
        });
      },
    );
    req.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    req.end();
  });
}
