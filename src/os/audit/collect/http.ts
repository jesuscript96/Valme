import { señal, type Señal } from "../types";

/**
 * Comprobaciones sobre HTTP puro: cadena de redirecciones, ficheros de raíz y 404.
 * Todo determinista y sin ejecutar JavaScript.
 */

const UA = "ValmeAudit/1.0 (+https://valmesolutions.com; auditoría técnica)";

async function pedir(url: string, opts: { redirigir?: boolean } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15_000);
  try {
    return await fetch(url, {
      redirect: opts.redirigir === false ? "manual" : "follow",
      headers: { "User-Agent": UA },
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(t);
  }
}

/** Sigue la cadena salto a salto para poder contarla, no solo ver el destino. */
async function cadena(inicio: string, max = 6) {
  const saltos: { url: string; status: number }[] = [];
  let url = inicio;
  for (let i = 0; i < max; i++) {
    let r: Response;
    try {
      r = await pedir(url, { redirigir: false });
    } catch {
      saltos.push({ url, status: 0 });
      break;
    }
    saltos.push({ url, status: r.status });
    const loc = r.headers.get("location");
    if (!loc || r.status < 300 || r.status >= 400) break;
    url = new URL(loc, url).toString();
  }
  return saltos;
}

export async function recogerHttp(dominio: string): Promise<{ señales: Señal[]; urlFinal: string }> {
  const out: Señal[] = [];
  const seo = { funcion: 3 as const, fuente: "HTTP" };

  const saltos = await cadena(`http://${dominio}`);
  const urlFinal = saltos[saltos.length - 1]?.url ?? `https://${dominio}`;

  out.push(señal({
    ...seo, id: "seo.redirecciones", que: "Saltos desde http:// hasta el destino",
    valor: saltos.length - 1, url: urlFinal, estado: "verificado",
    limite: saltos.length - 1 > 2 ? "Más de dos saltos añade latencia en cada visita" : undefined,
  }));

  out.push(señal({
    ...seo, id: "seo.https", que: "El destino final es HTTPS",
    valor: urlFinal.startsWith("https://"), url: urlFinal, estado: "verificado",
  }));

  // Ficheros de raíz. llms.txt casi nadie lo tiene y es de lo más barato de poner.
  for (const [archivo, id, fn] of [
    ["robots.txt", "seo.robots", 3],
    ["sitemap.xml", "seo.sitemap", 3],
    ["llms.txt", "seo.llmstxt", 3],
  ] as const) {
    try {
      const r = await pedir(new URL(`/${archivo}`, urlFinal).toString());
      const cuerpo = r.ok ? await r.text() : "";
      const existe = r.ok && cuerpo.trim().length > 0;

      out.push(señal({
        funcion: fn, fuente: "HTTP", id, que: `Existe ${archivo}`,
        valor: existe, url: new URL(`/${archivo}`, urlFinal).toString(), estado: "verificado",
      }));

      if (existe && archivo === "sitemap.xml") {
        const urls = (cuerpo.match(/<loc>/g) ?? []).length;
        const indices = (cuerpo.match(/<sitemap>/g) ?? []).length;
        out.push(señal({
          ...seo, id: "seo.sitemap_urls",
          que: indices ? "Sitemaps referenciados en el índice" : "URLs declaradas en el sitemap",
          valor: indices || urls, estado: "verificado",
        }));
      }

      if (existe && archivo === "robots.txt") {
        out.push(señal({
          ...seo, id: "seo.robots_sitemap", que: "robots.txt declara su sitemap",
          valor: /sitemap:/i.test(cuerpo), estado: "verificado",
        }));
        // Un Disallow: / global es el fallo más caro y más silencioso que existe.
        const bloqueaTodo = /user-agent:\s*\*[\s\S]*?disallow:\s*\/\s*$/im.test(cuerpo);
        out.push(señal({
          ...seo, id: "seo.robots_bloqueo", que: "robots.txt bloquea el sitio entero",
          valor: bloqueaTodo, estado: "verificado",
        }));
      }
    } catch {
      out.push(señal({
        funcion: fn, fuente: "HTTP", id, que: `Existe ${archivo}`, valor: null,
        estado: "pendiente", limite: "La petición ha fallado o ha agotado el tiempo",
      }));
    }
  }

  // Una URL inexistente debe devolver 404. Un 200 con página de error rompe la indexación.
  try {
    const r = await pedir(new URL("/valme-auditoria-url-que-no-existe", urlFinal).toString());
    out.push(señal({
      ...seo, id: "seo.404", que: "Código devuelto por una URL inexistente",
      valor: r.status, estado: "verificado",
      limite: r.status === 200 ? "Devuelve 200 en vez de 404: los buscadores indexarán páginas de error" : undefined,
    }));
  } catch {
    out.push(señal({ ...seo, id: "seo.404", que: "Código devuelto por una URL inexistente",
      valor: null, estado: "pendiente", limite: "La petición ha fallado" }));
  }

  // Cabeceras de seguridad: no es SEO, pero sale gratis en la misma petición.
  try {
    const r = await pedir(urlFinal);
    out.push(señal({
      funcion: 7, fuente: "HTTP", id: "web.hsts", que: "Cabecera HSTS",
      valor: r.headers.has("strict-transport-security"), url: urlFinal, estado: "verificado",
    }));
    out.push(señal({
      funcion: 7, fuente: "HTTP", id: "web.servidor", que: "Servidor o plataforma declarada",
      valor: r.headers.get("server") ?? r.headers.get("x-powered-by") ?? null,
      url: urlFinal, estado: "verificado",
    }));
  } catch { /* la cadena de arriba ya registró el fallo */ }

  return { señales: out, urlFinal };
}
