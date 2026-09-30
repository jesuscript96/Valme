import { strict as assert } from "node:assert";
import { test } from "node:test";
import { ErrorSeo } from "../herramientas";
import {
  actualizarAcceso, bloqueos, declarar, decidirPlan, enviarCalidad, estadoCliente, generarPlan,
  impedimentos, iniciar, nuevaVersion, registrarEvidencia, revisarCalidad, ultimoPlan,
} from "../operacion/diagnostico";
import { aprobarContenido, autorizarEnvio, crearInforme, estadoInforme } from "../operacion/informes";
import {
  activarAlta, guardarAlta, nuevaAlta, pendientes, progreso, puedeActivar, registrarExcepcion, requisitos,
} from "../operacion/onboarding";
import { cargaAgentes, colaSupervision } from "../operacion/panel";
import type { Actor, Datos } from "../tipos";

const pm: Actor = { id: "u_juan", nombre: "Juan", pm: true };
const equipo: Actor = { id: "u_ejecutor", nombre: "Operaciones", pm: false };

const vacio = (): Datos => ({
  proyectos: [], auditorias: [], evidencias: [], hallazgos: [], tareas: [], eventos: [], declaraciones: [],
  mediciones: [], altas: [], encargos: [], informes: [], actividad: [], clientesNuevos: [],
});

const rechaza = (fn: () => unknown, re: RegExp) =>
  assert.throws(fn, (e: unknown) => e instanceof ErrorSeo && re.test(e.message));

const COMPLETO = {
  nombre: "Acme", dominio: "acme.es", sector: "Industria", mercados: "España · español", contacto: "Ana",
  aprobador: "Dirección", pm: "Juan", entregables: "Informe mensual", exclusiones: "Sin compra de enlaces",
  inicio: "2026-10-01", revision: "2027-04-01", limites: "4 h de revisión", prioritarios: "Servicios B2B",
  publico: "Pymes", competidores: "Beta, Gamma", objetivos: "Más contactos cualificados",
  indicadores: "Contactos", base: "Parcial", marca: "Sobrio", restricciones: "Sin precios", fuentes: "Web propia",
};

function altaLista(d: Datos) {
  const a = nuevaAlta(d, pm);
  guardarAlta(d, pm, a.id, {
    datos: COMPLETO, servicios: ["SEO", "AEO"], equipo: ["Auditoría SEO", "Contenidos"],
    responsableCalidad: "Control de calidad", accesos: { gsc: "Validado", ga4: "Pendiente" },
  });
  return a;
}

test("onboarding: nace en borrador con pendientes, progreso y acciones sensibles bajo el PM", () => {
  const d = vacio();
  const a = nuevaAlta(d, pm);
  assert.equal(a.id, "ONB-001");
  assert.equal(pendientes(a).length, 23, "el PM se rellena con quien crea el alta");
  assert.equal(progreso(a), 4);
  assert.equal(requisitos(a).find((r) => r.id === "autoridad")?.ok, true);
  rechaza(() => guardarAlta(d, pm, a.id, { autonomia: { publicar: "El agente prepara y ejecuta" } }), /acción sensible/);
  assert.equal(puedeActivar(a), false);
});

test("onboarding: excepciones solo en requisitos dispensables y activación que crea cliente y encargo", () => {
  const d = vacio();
  const a = nuevaAlta(d, pm);
  guardarAlta(d, pm, a.id, { datos: { ...COMPLETO, base: "" }, servicios: ["SEO"], equipo: ["Auditoría SEO"], responsableCalidad: "QA" });
  rechaza(() => registrarExcepcion(d, pm, a.id, "campos", ""), /indispensable/);
  rechaza(() => registrarExcepcion(d, equipo, a.id, "accesos", ""), /Solo un PM/);
  assert.equal(puedeActivar(a), false);
  // Falta la situación inicial (dispensable) y no hay acceso validado (dispensable).
  assert.ok(pendientes(a).some((p) => p.id === "base"));
  guardarAlta(d, pm, a.id, { datos: { base: "Parcial" } });
  registrarExcepcion(d, pm, a.id, "accesos", "Se validan en la primera semana");
  assert.equal(puedeActivar(a), true);
  let creado = "";
  const r = activarAlta(d, pm, a.id, (x) => (creado = `c_${x.nombre.toLowerCase()}`));
  assert.equal(creado, "c_acme");
  assert.equal(r.encargoId, "DIA-001");
  assert.equal(a.estado, "Activo");
  rechaza(() => guardarAlta(d, pm, a.id, { datos: { nombre: "Otro" } }), /solo para consulta/);
  assert.equal(estadoCliente(a, d.encargos[0]!), "Diagnóstico pendiente");
});

test("diagnóstico: bloqueos por acceso, evidencia obligatoria, limitaciones y calidad", () => {
  const d = vacio();
  const a = altaLista(d);
  activarAlta(d, pm, a.id, () => "c_1");
  const e = d.encargos[0]!;
  // SEO + AEO: h1 (gsc), h4 (ga4) y h5 (sin acceso).
  assert.deepEqual(e.hallazgos.map((h) => h.titulo.split(" ")[0]), ["Categorías", "Conversiones", "Afirmaciones"]);
  iniciar(d, pm, e.id);
  assert.equal(e.estado, "En curso");
  assert.deepEqual(bloqueos(e, a).map((b) => b.acceso), ["ga4"]);
  assert.ok(impedimentos("enviar", e, a).some((i) => /sin fuente/.test(i.texto)));
  rechaza(() => registrarEvidencia(d, pm, e.id, "H-02", { fuente: "GA4", fecha: "2026-10-02", evidencia: "EV-1", impacto: "", limitaciones: "" }), /Bloqueado por Analytics 4/);
  registrarEvidencia(d, pm, e.id, "H-01", { fuente: "Search Console", fecha: "2026-10-02", evidencia: "EV-1", impacto: "8 categorías", limitaciones: "" });
  registrarEvidencia(d, pm, e.id, "H-03", { fuente: "Revisión editorial", fecha: "2026-10-02", evidencia: "EV-2", impacto: "", limitaciones: "40 páginas" });
  rechaza(() => enviarCalidad(d, pm, e.id), /limitaciones no están declaradas/);
  declarar(d, pm, e.id);
  enviarCalidad(d, pm, e.id);
  assert.equal(e.estado, "En revisión");
  rechaza(() => revisarCalidad(d, equipo, e.id, ""), /Solo un PM/);
  revisarCalidad(d, pm, e.id, "");
  assert.equal(e.estado, "Completado");
  assert.equal(e.revisiones[0]?.resultado, "Validado");
});

test("plan: acciones desde hallazgos con evidencia, decisión con motivo y versiones", () => {
  const d = vacio();
  const a = altaLista(d);
  activarAlta(d, pm, a.id, () => "c_1");
  const e = d.encargos[0]!;
  iniciar(d, pm, e.id);
  registrarEvidencia(d, pm, e.id, "H-01", { fuente: "GSC", fecha: "2026-10-02", evidencia: "EV-1", impacto: "", limitaciones: "" });
  registrarEvidencia(d, pm, e.id, "H-03", { fuente: "Editorial", fecha: "2026-10-02", evidencia: "EV-2", impacto: "", limitaciones: "" });
  declarar(d, pm, e.id);
  enviarCalidad(d, pm, e.id);
  revisarCalidad(d, pm, e.id, "");
  const p = generarPlan(d, pm, e.id);
  assert.equal(p.acciones.length, 2);
  assert.deepEqual(p.excluidas, ["Conversiones orgánicas sin medición válida · bloqueado por Analytics 4"]);
  rechaza(() => generarPlan(d, pm, e.id), /Ya existe un plan/);
  rechaza(() => decidirPlan(d, pm, e.id, "Rechazado", "no"), /demasiado breve \(2 caracteres\)/);
  decidirPlan(d, pm, e.id, "Cambios solicitados", "Separar la acción 2 en dos entregas");
  assert.equal(ultimoPlan(e)?.estado, "Cambios solicitados");
  nuevaVersion(d, pm, e.id);
  decidirPlan(d, pm, e.id, "Aprobado", "");
  assert.deepEqual([ultimoPlan(e)?.version, ultimoPlan(e)?.estado], [2, "Listo para ejecución"]);
  assert.equal(estadoCliente(a, e), "Plan aprobado");
  assert.equal(e.planes[0]?.estado, "Cambios solicitados", "la versión anterior no cambia");
});

test("accesos: validar reanuda el trabajo; retirarlo lo vuelve a bloquear", () => {
  const d = vacio();
  const a = altaLista(d);
  activarAlta(d, pm, a.id, () => "c_1");
  const e = d.encargos[0]!;
  iniciar(d, pm, e.id);
  assert.match(actualizarAcceso(d, pm, a.id, "ga4", "Validado"), /reanudado en 1/);
  assert.equal(bloqueos(e, a).length, 0);
  actualizarAcceso(d, pm, a.id, "gsc", "Caducado");
  assert.ok(e.historial.some((h) => /de nuevo bloqueado/.test(h)));
  assert.equal(e.limitacionesDeclaradas, false);
});

test("informes: sin datos suficientes no se aprueba; contenido y envío son dos decisiones", () => {
  const d = vacio();
  const a = altaLista(d);
  activarAlta(d, pm, a.id, () => "c_1");
  const e = d.encargos[0]!;
  const inf = crearInforme(d, pm, { clientId: "c_1", tipo: "diagnostico", origenId: e.id });
  assert.equal(estadoInforme(d, inf), "Datos insuficientes");
  rechaza(() => aprobarContenido(d, pm, inf.id), /Datos insuficientes/);
  e.estado = "Completado";
  rechaza(() => autorizarEnvio(d, pm, inf.id), /separadas/);
  rechaza(() => aprobarContenido(d, equipo, inf.id), /Solo un PM/);
  aprobarContenido(d, pm, inf.id);
  assert.equal(estadoInforme(d, inf), "Contenido aprobado");
  autorizarEnvio(d, pm, inf.id);
  assert.equal(estadoInforme(d, inf), "Envío autorizado");
  rechaza(() => crearInforme(d, pm, { clientId: "otro", tipo: "diagnostico", origenId: e.id }), /origen de este cliente/);
});

test("supervisión y agentes se calculan de los datos", () => {
  const d = vacio();
  const a = altaLista(d);
  activarAlta(d, pm, a.id, () => "c_1");
  const e = d.encargos[0]!;
  iniciar(d, pm, e.id);
  const cola = colaSupervision(d, new Set(["c_1"]));
  assert.ok(cola.some((x) => x.tipo === "Bloqueo" && /Analytics 4/.test(x.titulo)));
  const carga = cargaAgentes(d, new Set(["c_1"]));
  assert.equal(carga.find((c) => c.especialidad === "Auditoría SEO")?.abiertos, 1);
  assert.deepEqual(carga.find((c) => c.especialidad === "Contenidos")?.clientes, ["c_1"]);
});
