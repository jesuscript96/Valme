import { strict as assert } from "node:assert";
import { test } from "node:test";
import { botsBloqueados } from "../collect/base/robots";
import { marcas, puesto } from "../collect/tools/geo";
import { aplicar } from "../rules";
import type { Señal } from "../types";

const s = (id: string, valor: Señal["valor"], estado: Señal["estado"] = "verificado"): Señal => ({
  id, valor, estado, funcion: 3, que: id, fuente: "test", observadoEn: new Date().toISOString(),
});
const ids = (señales: Señal[]) => aplicar(señales).map((h) => h.id);

test("robots.txt: detecta los asistentes bloqueados en su propio grupo", () => {
  const robots = [
    "User-agent: *", "Disallow: /admin", "",
    "User-agent: GPTBot", "User-agent: CCBot", "Disallow: /", "",
    "User-agent: ClaudeBot", "Disallow: /privado", "",
    "# User-agent: PerplexityBot", "Sitemap: https://x.com/sitemap.xml",
  ].join("\n");
  assert.deepEqual(botsBloqueados(robots), ["GPTBot", "CCBot"]);
  assert.deepEqual(botsBloqueados("User-agent: *\nDisallow:"), []);
});

test("noindex en meta o en cabecera es un p0; sin noindex no hay hallazgo", () => {
  const h = aplicar([s("seo.meta_robots", "noindex, nofollow"), s("seo.x_robots", "none")]);
  assert.deepEqual(h.filter((x) => x.gravedad === "p0").map((x) => x.id).sort(), [
    "indexacion_bloqueada_cabecera", "indexacion_bloqueada_meta",
  ]);
  assert.deepEqual(ids([s("seo.meta_robots", "index, follow"), s("seo.x_robots", null)]), []);
});

test("title, descripción, canonical e idioma: ausencia y longitud", () => {
  assert.ok(ids([s("seo.title", null)]).includes("sin_title"));
  assert.ok(ids([s("seo.title", "Corto")]).includes("title_longitud"));
  assert.deepEqual(ids([s("seo.title", "Tu departamento de marketing externo | Valme")]), []);
  assert.ok(ids([s("seo.descripcion", null)]).includes("sin_descripcion"));
  assert.ok(ids([s("seo.descripcion", "x".repeat(200))]).includes("descripcion_longitud"));
  assert.ok(ids([s("seo.canonical", null)]).includes("sin_canonical"));
  assert.ok(ids([s("seo.lang", null)]).includes("sin_idioma"));
  // Una señal pendiente no dispara nada: no haber podido mirar no es que esté mal.
  assert.deepEqual(ids([s("seo.title", null, "pendiente")]), []);
});

test("bots de IA: bloqueo es p1 y permitirlos se reconoce como positivo", () => {
  const mal = aplicar([s("seo.robots_bots_ia", ["GPTBot"])]);
  assert.equal(mal[0]?.id, "bots_ia_bloqueados");
  assert.equal(mal[0]?.gravedad, "p1");
  assert.equal(aplicar([s("seo.robots_bots_ia", [])])[0]?.positivo, true);
});

test("JSON-LD sin Organization ni LocalBusiness", () => {
  assert.ok(ids([s("seo.jsonld", ["WebSite"])]).includes("jsonld_sin_entidad"));
  assert.ok(!ids([s("seo.jsonld", ["WebSite", "Organization"])]).includes("jsonld_sin_entidad"));
});

test("las señales del rastreo ya tienen reglas", () => {
  const h = ids([
    s("seo.crawl", 20), s("seo.titles_duplicados", 4), s("seo.titles_vacios", 1),
    s("seo.desc_vacias", 6), s("seo.sin_h1", 2), s("seo.varios_h1", 0),
  ]);
  for (const id of ["titles_duplicados", "titles_vacios", "descripciones_vacias", "paginas_sin_h1"]) {
    assert.ok(h.includes(id), id);
  }
  assert.ok(!h.includes("paginas_varios_h1"));
});

test("GEO: no aparecer es p1 y nombra a quién recomiendan; aparecer es positivo", () => {
  const consultas = s("geo.consultas", ["a", "b", "c"]);
  const no = aplicar([s("geo.menciones", 0), consultas, s("geo.competidores", ["Acme", "Beta"])]);
  assert.equal(no[0]?.gravedad, "p1");
  assert.match(no[0]?.consecuencia ?? "", /Acme, Beta/);
  const si = aplicar([s("geo.menciones", 2), consultas, s("geo.competidores", []), s("geo.posicion", 3)]);
  assert.equal(si[0]?.positivo, true);
  assert.match(si[0]?.titulo ?? "", /2 de 3/);
});

test("GEO: la marca se reconoce por dominio o por el nombre del title", () => {
  const n = marcas("www.valmesolutions.com", "Valme Solutions | Tu departamento de marketing");
  assert.deepEqual(n, ["valmesolutions", "valme solutions"]);
  assert.equal(puesto([{ nombre: "Otra", web: null }, { nombre: "VALME Solutions", web: null }], n), 2);
  assert.equal(puesto([{ nombre: "X", web: "https://www.valmesolutions.com" }], n), 1);
  assert.equal(puesto([{ nombre: "Otra", web: "otra.es" }], n), null);
});
