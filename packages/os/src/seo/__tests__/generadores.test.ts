import { strict as assert } from "node:assert";
import { test } from "node:test";
import { avisos, escribirPaginas, generarJsonLd, generarLlmsTxt, leerPaginas, type DatosEmpresa } from "../generadores";

const d: DatosEmpresa = {
  nombre: "VALME Solutions",
  url: "https://www.valmesolutions.com/",
  descripcion: "Departamento de marketing externo para pymes B2B.",
  servicios: ["SEO", "Paid media", " "],
  zona: "España",
  telefono: "",
  email: "hola@valmesolutions.com",
  logo: "",
  perfiles: ["https://www.linkedin.com/company/valme"],
  paginas: leerPaginas("Casos | https://www.valmesolutions.com/casos | Tres casos de clientes\nsin url |  | nada"),
};

test("páginas clave: una por línea, con título y URL obligatorios", () => {
  assert.equal(d.paginas.length, 1);
  assert.equal(escribirPaginas(d.paginas), "Casos | https://www.valmesolutions.com/casos | Tres casos de clientes");
});

test("llms.txt: título, resumen, detalles, páginas y contacto; sin inventar lo que falta", () => {
  const t = generarLlmsTxt(d);
  assert.match(t, /^# VALME Solutions\n\n> Departamento de marketing externo/);
  assert.match(t, /Servicios: SEO, Paid media\./);
  assert.match(t, /## Páginas principales\n\n- \[Casos\]\(https:\/\/www\.valmesolutions\.com\/casos\): Tres casos/);
  assert.match(t, /- Email: hola@valmesolutions\.com/);
  assert.doesNotMatch(t, /Teléfono/);
});

test("JSON-LD: @graph con la entidad, el sitio y un Service por servicio; sin campos vacíos", () => {
  const html = generarJsonLd(d, "ProfessionalService");
  const json = JSON.parse(html.replace(/<\/?script[^>]*>/g, ""));
  const [empresa, web, ...servicios] = json["@graph"];
  assert.equal(empresa["@type"], "ProfessionalService");
  assert.equal(empresa.url, "https://www.valmesolutions.com/");
  assert.equal(empresa.telephone, undefined);
  assert.deepEqual(empresa.sameAs, ["https://www.linkedin.com/company/valme"]);
  assert.equal(web.publisher["@id"], empresa["@id"]);
  assert.deepEqual(servicios.map((s: { name: string }) => s.name), ["SEO", "Paid media"]);
});

test("avisos: dice qué falta", () => {
  assert.deepEqual(avisos(d), []);
  assert.equal(avisos({ ...d, url: "valme.es", paginas: [] }).length, 2);
});
