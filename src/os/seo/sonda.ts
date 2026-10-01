import "server-only";
import { resolve4 } from "node:dns/promises";
import { request } from "node:https";
import { ipv4Publica, urlDeSondeo } from "./red";

/**
 * AGENTE HTTP · una sola petición a la portada del dominio auditado.
 *
 * Portado del piloto de Search OS y generalizado al dominio del proyecto. Protecciones:
 * solo HTTPS a la raíz, DNS resuelto a IPv4 PÚBLICA y fijado para la conexión (así una
 * redirección o un DNS que cambia no nos lleva a una red interna), sin seguir
 * redirecciones, 2 s de DNS, 4 s de lectura y 512 KB como máximo. Sin cookies ni credenciales.
 */

export async function sondearPortada(dominio: string): Promise<{ url: string; observado: string }> {
  const url = urlDeSondeo(dominio);
  let reloj: ReturnType<typeof setTimeout> | undefined;
  const direcciones = await Promise.race([
    resolve4(url.hostname),
    new Promise<never>((_, rechazar) => {
      reloj = setTimeout(() => rechazar(new Error("Tiempo DNS agotado.")), 2000);
    }),
  ]).finally(() => clearTimeout(reloj));
  const ip = direcciones[0];
  if (!ip || direcciones.some((d) => !ipv4Publica(d))) throw new Error("Destino de red no permitido.");

  return new Promise((resolver, rechazar) => {
    const req = request(
      url,
      {
        method: "GET", agent: false, family: 4,
        lookup: (_h, _o, cb) => cb(null, ip, 4),
        headers: { "user-agent": "Valme-Agente-HTTP/1.0", accept: "text/html", "accept-encoding": "identity" },
      },
      (res) => {
        let bytes = 0;
        res.on("data", (trozo: Buffer) => {
          bytes += trozo.length;
          if (bytes > 512_000) req.destroy(new Error("Respuesta superior a 512 KB."));
        });
        res.on("error", rechazar);
        res.on("end", () => {
          clearTimeout(limite);
          resolver({
            url: url.href,
            observado: [
              `HTTP ${res.statusCode}`,
              `Content-Type: ${res.headers["content-type"] ?? "sin dato"}`,
              `X-Robots-Tag: ${res.headers["x-robots-tag"] ?? "sin cabecera"}`,
              res.headers.location ? `Redirige a ${res.headers.location} (no seguida)` : null,
              `${bytes} bytes`,
              "Solo respuesta HTTP de portada: no analiza HTML, rankings ni demanda.",
            ].filter(Boolean).join(" · "),
          });
        });
      },
    );
    const limite = setTimeout(() => req.destroy(new Error("Tiempo de lectura agotado.")), 4000);
    req.on("error", (e) => {
      clearTimeout(limite);
      rechazar(e);
    });
    req.end();
  });
}
