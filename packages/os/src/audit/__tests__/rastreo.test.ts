import { strict as assert } from "node:assert";
import { test } from "node:test";
import { analizar, extraerEnlaces, normalizar, type Pagina } from "../collect/tools/enlaces";
import { aplicar } from "../rules";
import type { Señal } from "../types";

const s = (id: string, valor: Señal["valor"], estado: Señal["estado"] = "verificado"): Señal => ({
  id, valor, estado, funcion: 3, que: id, fuente: "test", observadoEn: new Date().toISOString(),
});

const pag = (url: string, x: Partial<Pagina> = {}): Pagina => ({
  url, estado: 200, destino: null, title: "t", h1: 1, desc: "d", noindex: false, profundidad: 0, enlaces: [], ...x,
});

test("normalizar quita fragmento, parámetros y barra final", () => {
  assert.equal(normalizar("/servicios/?utm=x#top", "https://www.x.es/"), "https://www.x.es/servicios");
  assert.equal(normalizar("https://www.X.es", "https://www.x.es/"), "https://www.x.es/");
  assert.equal(normalizar("mailto:a@x.es", "https://www.x.es/"), null);
});

test("extraerEnlaces: solo internos (con o sin www) y sin ficheros estáticos", () => {
  const html = `
    <a href="/servicios">S</a><a href="https://x.es/casos/">C</a><a href="https://otra.com/">O</a>
    <a href="/doc.pdf">PDF</a><a href="tel:600">T</a><a href="#arriba">A</a><a class="b" href='/contacto?x=1'>K</a>`;
  assert.deepEqual(extraerEnlaces(html, "https://www.x.es/").sort(), [
    "https://www.x.es/contacto", "https://www.x.es/servicios", "https://x.es/casos",
  ].sort());
});

test("analizar: rotos, redirecciones, profundidad, huérfanas y noindex en sitemap", () => {
  const home = "https://x.es/";
  const paginas = [
    pag(home, { enlaces: ["https://x.es/a", "https://x.es/roto", "https://x.es/viejo"] }),
    pag("https://x.es/a", { profundidad: 1, enlaces: ["https://x.es/b"] }),
    pag("https://x.es/roto", { estado: 404, profundidad: 1 }),
    pag("https://x.es/viejo", { estado: 301, destino: "https://x.es/a", profundidad: 1 }),
    pag("https://x.es/b", { profundidad: 4, noindex: true }),
    pag("https://x.es/sola", { profundidad: null }),
  ];
  const a = analizar(paginas, [home, "https://x.es/a", "https://x.es/b", "https://x.es/sola"]);
  assert.deepEqual(a.enlacesRotos, ["https://x.es/ → https://x.es/roto (404)"]);
  assert.equal(a.enlacesARedireccion, 1);
  assert.equal(a.profundidadMax, 4);
  assert.deepEqual(a.profundas, ["https://x.es/b"]);
  assert.deepEqual(a.huerfanas, ["https://x.es/sola"], "la home no cuenta como huérfana");
  assert.deepEqual(a.noindexEnSitemap, ["https://x.es/b"]);
});

test("reglas del rastreo: rotos p1, huérfanas y profundas p2, y parcial no dispara", () => {
  const h = aplicar([
    s("seo.crawl", 20), s("seo.enlaces_rotos", ["a → b (404)"]), s("seo.huerfanas", ["https://x.es/sola"]),
    s("seo.paginas_profundas", ["https://x.es/b"]), s("seo.profundidad_max", 4), s("seo.enlaces_a_redireccion", 2),
    s("seo.noindex_en_sitemap", ["https://x.es/b"]),
  ]);
  const ids = h.map((x) => x.id);
  for (const id of ["enlaces_rotos", "paginas_huerfanas", "paginas_profundas", "enlaces_a_redireccion", "noindex_en_sitemap"]) {
    assert.ok(ids.includes(id), id);
  }
  assert.equal(h.find((x) => x.id === "enlaces_rotos")?.gravedad, "p1");
  // Con el rastreo cortado por el tope, las huérfanas no se afirman.
  assert.ok(!aplicar([s("seo.huerfanas", ["x"], "parcial")]).some((x) => x.id === "paginas_huerfanas"));
});
