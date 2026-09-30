import { strict as assert } from "node:assert";
import { test } from "node:test";
import { AREAS, areaDe, destinoAlCambiar, slugDeRuta } from "../navegacion";

const clave = (ruta: string) => areaDe(ruta).clave;

test("cada ruta cae en su área y su espacio", () => {
  assert.equal(clave("/app"), "inicio");
  assert.equal(clave("/app/clients"), "inicio");
  assert.equal(clave("/app/clients/new"), "inicio");
  assert.equal(clave("/app/c/nordic"), "inicio");
  assert.equal(clave("/app/c/nordic/brand-kit"), "marca");
  assert.equal(clave("/app/c/nordic/offers"), "paid");
  assert.equal(clave("/app/c/nordic/offers/o1/studio"), "paid");
  assert.equal(clave("/app/c/nordic/landings/l1"), "paid");
  assert.equal(clave("/app/c/nordic/leads/x"), "crm");
  assert.equal(clave("/app/c/nordic/settings"), "integraciones");
  assert.equal(clave("/app/seo"), "seo");
  assert.equal(clave("/app/seo/auditorias/a1"), "seo");
  assert.equal(clave("/app/dx"), "ventas-leads");
  assert.equal(clave("/app/dx/leads/l1/informes"), "ventas-leads");
  assert.equal(clave("/app/dx/tools/web"), "ventas-auditorias");
  assert.equal(areaDe("/app/dx/tools").espacio, "ventas");
  assert.equal(areaDe("/app/seo").espacio, "clientes");
});

test("un cliente llamado como una sección no se confunde con ella", () => {
  assert.equal(clave("/app/c/leads"), "inicio");
  assert.equal(clave("/app/c/offers/leads"), "crm");
  assert.equal(slugDeRuta("/app/c/offers/leads"), "offers");
  assert.equal(slugDeRuta("/app/seo"), null);
});

test("las áreas de cliente sin cliente llevan a elegir uno", () => {
  for (const a of AREAS.filter((x) => x.porCliente)) {
    assert.equal(a.href(null), `/app/clients?area=${a.clave}`);
    assert.match(a.href("rivas"), /^\/app\/c\/rivas\//);
  }
  assert.equal(AREAS.find((a) => a.clave === "inicio")!.href(null), "/app");
  assert.equal(AREAS.find((a) => a.clave === "seo")!.href("rivas"), "/app/seo");
});

test("cambiar de cliente deja en la misma sección, sin el detalle del anterior", () => {
  assert.equal(destinoAlCambiar("/app/c/nordic/leads", "rivas"), "/app/c/rivas/leads");
  assert.equal(destinoAlCambiar("/app/c/nordic/offers/o1/studio", "rivas"), "/app/c/rivas/offers");
  assert.equal(destinoAlCambiar("/app/c/nordic", "rivas"), "/app/c/rivas");
  assert.equal(destinoAlCambiar("/app", "rivas"), "/app/c/rivas");
  assert.equal(destinoAlCambiar("/app/clients", "rivas"), "/app/c/rivas");
});

test("«Todos los clientes» sale del cliente; en SEO solo cambia el filtro", () => {
  assert.equal(destinoAlCambiar("/app/c/nordic/leads", null), "/app/clients?area=crm");
  assert.equal(destinoAlCambiar("/app/c/nordic", null), "/app");
  assert.equal(destinoAlCambiar("/app/seo/plan", null), "/app/seo/plan");
  assert.equal(destinoAlCambiar("/app/seo/plan", "rivas"), "/app/seo/plan");
});
