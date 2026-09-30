import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { Auditoria as ResultadoMotor } from "../../audit/types";
import { calcularCobertura } from "../cobertura";
import {
  ErrorSeo, actualizarTarea, archivarAuditoria, cambiarEstado, crearAuditoria, crearProyecto,
  crearTarea, declararCobertura, decidirHallazgo, importarPiloto, normalizarDominio,
  registrarEjecucion, registrarMedicionGeo, registrarSondeo, reservarParaAgente,
} from "../herramientas";
import { ipv4Publica, urlDeSondeo } from "../red";
import type { Actor, Datos } from "../tipos";

const pm: Actor = { id: "u_juan", nombre: "Juan", pm: true };
const equipo: Actor = { id: "u_ejecutor", nombre: "Operaciones", pm: false };

function datos(dominio = "www.valmesolutions.com"): Datos {
  return {
    proyectos: [{ id: "pr_1", clientId: "c_1", nombre: "Web", dominio, creadoEn: "2026-09-01T00:00:00Z" }],
    auditorias: [], evidencias: [], hallazgos: [], tareas: [], eventos: [], declaraciones: [], mediciones: [],
  };
}

const nueva = (d: Datos, actor = pm) =>
  crearAuditoria(d, actor, "c_1", {
    proyectoId: "pr_1", servicios: ["SEO técnico", "Contenidos"], alcance: "Solo lectura",
    paginas: 100, minutos: 30, costeEur: 0,
  });

const rechaza = (fn: () => unknown, mensaje: RegExp) =>
  assert.throws(fn, (e: unknown) => e instanceof ErrorSeo && mensaje.test(e.message));

function hastaEjecucion(d: Datos) {
  const a = nueva(d);
  cambiarEstado(d, pm, a.id, { a: "pendiente_autorizacion" });
  cambiarEstado(d, pm, a.id, { a: "autorizado", referencia: "Correo de dirección" });
  cambiarEstado(d, pm, a.id, { a: "en_ejecucion" });
  return a;
}

// --- Auditorías ------------------------------------------------------------

test("una auditoría nace en borrador, con referencia correlativa y sin autorización", () => {
  const d = datos();
  const a = nueva(d, equipo);
  const b = nueva(d);
  assert.equal(a.estado, "borrador");
  assert.equal(a.autorizacion, null);
  assert.match(a.ref, /^AUD-\d{4}-001$/);
  assert.match(b.ref, /^AUD-\d{4}-002$/);
  assert.equal(d.eventos.length, 2);
});

test("la máquina de estados rechaza saltos y exige PM y referencia para autorizar", () => {
  const d = datos();
  const a = nueva(d);
  rechaza(() => cambiarEstado(d, pm, a.id, { a: "en_ejecucion" }), /No se puede pasar/);
  cambiarEstado(d, equipo, a.id, { a: "pendiente_autorizacion" });
  rechaza(() => cambiarEstado(d, equipo, a.id, { a: "autorizado", referencia: "x" }), /Solo un PM/);
  rechaza(() => cambiarEstado(d, pm, a.id, { a: "autorizado" }), /referencia/);
  cambiarEstado(d, pm, a.id, { a: "autorizado", referencia: "Correo 28/09" });
  assert.equal(a.autorizacion?.por, "Juan");
});

test("bloquear, devolver y cancelar exigen motivo; volver atrás borra la autorización", () => {
  const d = datos();
  const a = hastaEjecucion(d);
  rechaza(() => cambiarEstado(d, pm, a.id, { a: "bloqueado" }), /motivo/);
  cambiarEstado(d, pm, a.id, { a: "bloqueado", motivo: "Falta acceso a Search Console" });
  cambiarEstado(d, pm, a.id, { a: "devuelto", motivo: "Rehacer alcance" });
  cambiarEstado(d, pm, a.id, { a: "pendiente_autorizacion" });
  assert.equal(a.autorizacion, null);
  rechaza(() => cambiarEstado(d, pm, a.id, { a: "cancelado" }), /motivo/);
});

test("no se pasa a calidad sin cobertura por servicio; la declaración lo desbloquea", () => {
  const d = datos();
  const a = hastaEjecucion(d);
  rechaza(() => cambiarEstado(d, pm, a.id, { a: "control_calidad" }), /SEO técnico, Contenidos/);
  importarPiloto(d, pm, a.id);
  rechaza(() => cambiarEstado(d, pm, a.id, { a: "control_calidad" }), /SEO técnico/);
  declararCobertura(d, pm, a.id, {
    servicio: "SEO técnico", estado: "ausencia_declarada", motivo: "Revisión solo editorial",
  });
  cambiarEstado(d, pm, a.id, { a: "control_calidad" });
  cambiarEstado(d, pm, a.id, { a: "validado" });
  assert.equal(a.estado, "validado");
  rechaza(() => declararCobertura(d, pm, a.id, { servicio: "Contenidos", estado: "ausencia_declarada", motivo: "x" }), /cerrada o archivada/);
  // Validar abre el plan: decisiones y tareas siguen abiertas.
  decidirHallazgo(d, pm, d.hallazgos[0]!.id, { decision: "priorizar" });
  const t = crearTarea(d, pm, d.hallazgos[0]!.id, { tipo: "accion", titulo: "Publicar", detalle: "Página", responsableId: "u_juan" }, ["u_juan"]);
  archivarAuditoria(d, pm, a.id, true);
  rechaza(() => actualizarTarea(d, pm, t.id, { estado: "en_curso" }), /seguimiento está cerrado/);
});

test("archivar es de PM, deja la auditoría en solo lectura y se deshace", () => {
  const d = datos();
  const a = nueva(d);
  rechaza(() => archivarAuditoria(d, equipo, a.id, true), /Solo un PM/);
  archivarAuditoria(d, pm, a.id, true);
  rechaza(() => cambiarEstado(d, pm, a.id, { a: "pendiente_autorizacion" }), /archivada/);
  archivarAuditoria(d, pm, a.id, false);
  cambiarEstado(d, pm, a.id, { a: "pendiente_autorizacion" });
});

test("proyectos: solo PM, dominio normalizado y sin duplicados", () => {
  const d = datos();
  rechaza(() => crearProyecto(d, equipo, "c_1", { nombre: "Blog", dominio: "blog.x.com" }), /Solo un PM/);
  const p = crearProyecto(d, pm, "c_1", { nombre: "Blog", dominio: "HTTPS://Blog.Ejemplo.com/ruta" });
  assert.equal(p.dominio, "blog.ejemplo.com");
  rechaza(() => crearProyecto(d, pm, "c_1", { nombre: "Otro", dominio: "blog.ejemplo.com" }), /ya tiene/);
  rechaza(() => normalizarDominio("sin-punto"), /no es válido/);
});

// --- Revisión externa y motor ---------------------------------------------

test("la revisión de VALME carga 5 hallazgos y 8 evidencias una sola vez", () => {
  const d = datos();
  const a = nueva(d);
  assert.deepEqual(importarPiloto(d, pm, a.id), { evidencias: 8, hallazgos: 5 });
  assert.deepEqual(importarPiloto(d, pm, a.id), { evidencias: 0, hallazgos: 0 });
  assert.ok(d.hallazgos.every((h) => h.evidencias.length > 0 && h.decision.valor === "pendiente"));
  const otro = datos("www.otro.com");
  rechaza(() => importarPiloto(otro, pm, nueva(otro).id), /valmesolutions/);
});

test("el motor guarda señales como evidencias y los fallos como hallazgos, no los positivos", () => {
  const d = datos();
  const a = hastaEjecucion(d);
  const r: ResultadoMotor = {
    dominio: "www.valmesolutions.com", urlFinal: "https://www.valmesolutions.com/",
    iniciadaEn: "2026-09-30T00:00:00Z", duracionMs: 1,
    señales: [
      { id: "seo.llmstxt", funcion: 3, que: "llms.txt", valor: false, estado: "verificado", fuente: "HTTP", observadoEn: "2026-09-30T00:00:00Z" },
      { id: "seo.h1", funcion: 3, que: "H1", valor: 1, estado: "verificado", fuente: "Navegador", observadoEn: "2026-09-30T00:00:00Z" },
      { id: "seo.gsc", funcion: 3, que: "Search Console", valor: null, estado: "pendiente", fuente: "GSC", observadoEn: "2026-09-30T00:00:00Z" },
    ],
    hallazgos: [
      { id: "seo.sin-llms", funcion: 3, titulo: "Sin llms.txt", situacion: "No hay llms.txt", consecuencia: "Menos citas", solucion: "Publicarlo", gravedad: "p2", confianza: "alta", evidencia: ["seo.llmstxt"] },
      { id: "seo.h1-ok", funcion: 3, titulo: "Un solo H1", situacion: "Bien", consecuencia: "", solucion: "", gravedad: "p3", confianza: "alta", evidencia: ["seo.h1"], positivo: true },
    ],
    cobertura: [], fuentesNoDisponibles: [{ fuente: "PageSpeed", motivo: "sin clave" }],
  };
  assert.deepEqual(registrarEjecucion(d, pm, a.id, r), { evidencias: 2, hallazgos: 1, noDisponibles: 1 });
  const h = d.hallazgos[0]!;
  assert.equal(h.servicio, "AEO/GEO");
  assert.equal(h.categoria, "aeo_geo_citabilidad");
  assert.equal(h.prioridad, "media");
  assert.equal(h.evidencias.length, 1);
  assert.deepEqual(registrarEjecucion(d, pm, a.id, r).hallazgos, 0);
});

// --- Decisiones y tareas ---------------------------------------------------

test("decidir es de PM y descartar exige motivo", () => {
  const d = datos();
  const a = nueva(d);
  importarPiloto(d, pm, a.id);
  const h = d.hallazgos[0]!;
  rechaza(() => decidirHallazgo(d, equipo, h.id, { decision: "priorizar" }), /Solo un PM/);
  rechaza(() => decidirHallazgo(d, pm, h.id, { decision: "descartar", nota: "  " }), /motivo/);
  decidirHallazgo(d, pm, h.id, { decision: "investigar", nota: "Validar demanda" });
  assert.equal(h.decision.por, "Juan");
});

test("tareas: responsable PM, nacen pendientes, cierre con conclusión y resultado sobre el hallazgo", () => {
  const d = datos();
  const a = nueva(d);
  importarPiloto(d, pm, a.id);
  const h = d.hallazgos[0]!;
  const pms = ["u_juan"];
  rechaza(
    () => crearTarea(d, pm, h.id, { tipo: "investigacion", titulo: "x", detalle: "y", responsableId: "u_ejecutor" }, pms),
    /PM con acceso/,
  );
  const t = crearTarea(
    d, equipo, h.id,
    { tipo: "investigacion", titulo: "Investigar demanda", detalle: "¿Se busca?", responsableId: "u_juan", agenteId: "ag_contenido", fecha: "2026-10-05" },
    pms,
  );
  assert.equal(t.estado, "pendiente");
  rechaza(() => actualizarTarea(d, pm, t.id, { estado: "hecha" }), /conclusión/);
  rechaza(
    () => actualizarTarea(d, equipo, t.id, { estado: "hecha", conclusion: "Hay demanda", resultado: "priorizar" }),
    /Solo un PM/,
  );
  assert.equal(t.estado, "pendiente", "si la decisión falla, la tarea no queda cerrada a medias");
  actualizarTarea(d, pm, t.id, { estado: "hecha", conclusion: "Hay demanda", resultado: "priorizar" });
  assert.equal(h.decision.valor, "priorizar");
  assert.equal(t.cerradaPor, "Juan");
  rechaza(() => actualizarTarea(d, pm, t.id, { estado: "en_curso" }), /cerrada/);
});

test("el agente HTTP solo reserva investigaciones pendientes con la auditoría en ejecución", () => {
  const d = datos();
  const a = nueva(d);
  importarPiloto(d, pm, a.id);
  const h = d.hallazgos[0]!;
  const t = crearTarea(d, pm, h.id, { tipo: "investigacion", titulo: "x", detalle: "y", responsableId: "u_juan" }, ["u_juan"]);
  rechaza(() => reservarParaAgente(d, pm, t.id), /en ejecución/);
  cambiarEstado(d, pm, a.id, { a: "pendiente_autorizacion" });
  cambiarEstado(d, pm, a.id, { a: "autorizado", referencia: "ok" });
  cambiarEstado(d, pm, a.id, { a: "en_ejecucion" });
  rechaza(() => reservarParaAgente(d, equipo, t.id), /Solo un PM/);
  assert.equal(reservarParaAgente(d, pm, t.id).url, "https://www.valmesolutions.com/");
  rechaza(() => reservarParaAgente(d, pm, t.id), /pendientes/);
  const antes = h.evidencias.length;
  registrarSondeo(d, pm, t.id, { ok: true, url: "https://www.valmesolutions.com/", observado: "HTTP 200" });
  assert.equal(h.evidencias.length, antes + 1);
  assert.equal(t.estado, "en_curso", "el agente no cierra la investigación");
});

test("la sonda solo admite la portada HTTPS y descarta IPs privadas", () => {
  assert.equal(urlDeSondeo("www.valmesolutions.com").href, "https://www.valmesolutions.com/");
  assert.throws(() => urlDeSondeo("http://x.com/"));
  assert.throws(() => urlDeSondeo("https://x.com/ruta"));
  assert.ok(ipv4Publica("76.76.21.21"));
  for (const ip of ["10.0.0.1", "127.0.0.1", "169.254.169.254", "192.168.1.1", "172.16.0.1", "100.64.0.1"]) {
    assert.equal(ipv4Publica(ip), false, ip);
  }
});

test("una medición GEO se guarda con su resultado o con el motivo de no poder medir", () => {
  const d = datos();
  const base = { dominio: "x", urlFinal: "https://x/", iniciadaEn: "", duracionMs: 1, hallazgos: [], cobertura: [] };
  const sig = (id: string, valor: unknown) => ({ id, valor, estado: "verificado" as const, funcion: 3 as const, que: id, fuente: "t", observadoEn: "" });
  const m = registrarMedicionGeo(d, pm, "pr_1", {
    ...base, fuentesNoDisponibles: [],
    señales: [sig("geo.categoria", "marketing · España"), sig("geo.consultas", ["a", "b", "c"]), sig("geo.menciones", 1), sig("geo.posicion", 4), sig("geo.competidores", ["Acme"])] as never,
  });
  assert.deepEqual([m.estado, m.menciones, m.posicion, m.clientId], ["medida", 1, 4, "c_1"]);
  const n = registrarMedicionGeo(d, pm, "pr_1", {
    ...base, señales: [], fuentesNoDisponibles: [{ fuente: "Modelo de lenguaje", motivo: "Falta OS_LLM_API_KEY." }],
  });
  assert.equal(n.estado, "no_disponible");
  assert.match(n.motivo ?? "", /OS_LLM_API_KEY/);
  assert.equal(d.mediciones.length, 2);
});

test("la cobertura cuenta evidencia registrada e ignora lo descartado", () => {
  const d = datos();
  const a = nueva(d);
  importarPiloto(d, pm, a.id);
  const c = calcularCobertura(a, d.hallazgos, d.evidencias, d.declaraciones);
  assert.deepEqual(c.map((x) => x.estado), ["pendiente_justificado", "evidencia_suficiente"]);
});
