/* VALME Search OS · V2 — Diagnóstico, control de calidad, plan y decisión del PM.
   Prototipo de demostración: datos ficticios, ninguna acción sale de esta pantalla.
   Se apoya en app.js (clients, specialties, queue, helpers) y onboarding.js (onbRegistros). */

const DG_ESTADOS = ['Pendiente', 'En curso', 'Bloqueado', 'En revisión', 'Completado'];

const DG_CATALOGO = [
  { id: 'h1', titulo: 'Categorías principales sin indexar', dep: 'gsc', servicio: 'SEO', fuente: 'Informe de cobertura (ejemplo)', prioridad: 'Alta', impacto: 'Hasta 1.200 visitas/mes (cifra ilustrativa)', limitaciones: 'Muestra de 28 días; sin serie histórica comparable.' },
  { id: 'h2', titulo: 'Cadenas de redirección en rutas antiguas', dep: 'logs', servicio: 'SEO técnico', fuente: 'Registro de servidor (ejemplo)', prioridad: 'Media', impacto: 'Pérdida de rastreo en 38 URL (ilustrativo)', limitaciones: 'Solo 7 días de registros de ejemplo.' },
  { id: 'h3', titulo: 'Fichas con contenido duplicado', dep: 'cms', servicio: 'Contenidos', fuente: 'Inventario del CMS (ejemplo)', prioridad: 'Media', impacto: '26 fichas compiten entre sí (ilustrativo)', limitaciones: 'Inventario parcial: faltan plantillas antiguas.' },
  { id: 'h4', titulo: 'Conversiones orgánicas sin medición válida', dep: 'ga4', servicio: 'SEO', fuente: 'Configuración analítica (ejemplo)', prioridad: 'Alta', impacto: 'No se puede atribuir resultado de negocio', limitaciones: 'Sin línea base: no se estiman cifras.' },
  { id: 'h5', titulo: 'Afirmaciones sin fuente citable', dep: null, servicio: 'AEO', fuente: 'Revisión editorial interna (ejemplo)', prioridad: 'Alta', impacto: '18 afirmaciones no citables por asistentes (ilustrativo)', limitaciones: 'Muestra de 40 páginas revisadas.' },
  { id: 'h6', titulo: 'Intención poco clara en títulos y encabezados', dep: null, servicio: 'GEO', fuente: 'Revisión de plantillas (ejemplo)', prioridad: 'Baja', impacto: 'Menor claridad para respuestas generativas', limitaciones: 'Valoración cualitativa, no medición.' }
];

const DG_QA_PASOS = [
  { id: 'alcance', label: 'Alcance cubierto por los hallazgos' },
  { id: 'evidencia', label: 'Cada hallazgo tiene evidencia, fuente y fecha' },
  { id: 'pendientes', label: 'Datos ausentes y limitaciones declarados' }
];

let encargos = [];
let encSeq = 0;
let dgActual = null;

/* ---------- Datos ---------- */

function dgAccesoNombre(id) {
  const a = ONB_ACCESOS.find(x => x.id === id);
  return a ? a.nombre : id;
}

function dgHallazgos(reg) {
  const servicios = reg.servicios.length ? reg.servicios : ['SEO'];
  const base = DG_CATALOGO.filter(h => servicios.some(s => h.servicio === s) || h.dep === 'gsc');
  return (base.length ? base : DG_CATALOGO.slice(0, 3)).map((h, i) => ({
    ref: h.id,
    titulo: h.titulo,
    dep: h.dep,
    fuente: h.fuente,
    fecha: '18 sep 2026',
    prioridad: h.prioridad,
    impacto: h.impacto,
    limitaciones: h.limitaciones,
    evidencia: 'EV-DEMO-' + String(i + 1).padStart(3, '0')
  }));
}

function dgEncargoDe(clienteId) {
  return encargos.find(e => e.clienteId === clienteId) || null;
}

function dgCrearEncargo(reg, cliente) {
  const existente = dgEncargoDe(cliente.id);
  if (existente) return existente;
  encSeq += 1;
  const enc = {
    id: 'DIA-' + String(encSeq).padStart(3, '0'),
    onbId: reg.id,
    clienteId: cliente.id,
    creado: '18 sep 2026 · 09:42',
    estado: 'Pendiente',
    servicios: reg.servicios.slice(),
    objetivos: reg.data.objetivos || '',
    agentes: reg.equipo.slice(),
    hallazgos: dgHallazgos(reg),
    limitacionesDeclaradas: false,
    revisiones: [],
    planes: [],
    historial: ['18 sep 2026 · 09:42 · Encargo de diagnóstico creado tras la activación del onboarding.']
  };
  encargos.push(enc);
  cliente.state = 'Diagnóstico pendiente';
  reg.historial.push('18 sep 2026 · 09:42 · Encargo ' + enc.id + ' creado. El servicio no está activo todavía.');
  return enc;
}

function dgReg(enc) {
  return onbRegistros.find(r => r.id === enc.onbId) || onbDeCliente(clients[enc.clienteId - 1]);
}

function dgBloqueos(enc) {
  const reg = dgReg(enc);
  const ids = [...new Set(enc.hallazgos.map(h => h.dep).filter(Boolean))];
  return ids
    .filter(id => reg.accesos[id] !== 'Validado')
    .map(id => ({
      acceso: id,
      nombre: dgAccesoNombre(id),
      estado: reg.accesos[id],
      afectados: enc.hallazgos.filter(h => h.dep === id).map(h => h.titulo)
    }));
}

function dgBloqueado(enc, h) {
  return !!h.dep && dgReg(enc).accesos[h.dep] !== 'Validado';
}

function dgDisponibles(enc) {
  return enc.hallazgos.filter(h => !dgBloqueado(enc, h));
}

function dgEstadoCliente(enc) {
  const plan = dgPlan(enc);
  if (plan && plan.estado === 'Listo para ejecución') return 'Plan aprobado';
  if (plan) return 'Plan pendiente';
  if (enc.estado === 'Completado') return 'Diagnóstico completado';
  if (enc.estado === 'En revisión') return 'Diagnóstico en revisión';
  if (enc.estado === 'Bloqueado') return 'Diagnóstico bloqueado';
  if (enc.estado === 'En curso') return 'Diagnóstico en curso';
  return 'Diagnóstico pendiente';
}

function dgSincronizarCliente(enc) {
  const c = clients[enc.clienteId - 1];
  if (c) c.state = dgEstadoCliente(enc);
}

/* ---------- Validaciones y estados de error ---------- */

// Aviso visible tras un intento bloqueado. No se persiste: describe el último intento.
let dgAviso = null; // { encId, accion, titulo, problemas: [{ texto, resolucion }] }

function dgHallazgosIncompletos(enc) {
  return enc.hallazgos.filter(h => !h.evidencia || !h.fuente || !h.fecha);
}

function dgAccesosSinRegistrar(reg) {
  return (typeof ONB_ACCESOS !== 'undefined' ? ONB_ACCESOS : []).filter(x => !reg.accesos[x.id]);
}

// Requisitos incumplidos para una acción. Vacío = la acción puede ejecutarse.
function dgRequisitos(enc, accion) {
  const reg = dgReg(enc);
  const p = [];
  const bloqueos = dgBloqueos(enc);
  if (accion === 'start') {
    if (!enc.servicios.length) p.push({ texto: 'El encargo no tiene servicio contratado.', resolucion: 'Indicar el servicio en el paso B del onboarding.' });
    if (!enc.objetivos) p.push({ texto: 'Sin objetivos de negocio registrados: el diagnóstico no tendría criterio de prioridad.', resolucion: 'Completar los objetivos en el paso C del onboarding.' });
    if (!enc.agentes.length) p.push({ texto: 'Sin agentes asignados al encargo.', resolucion: 'Asignar equipo en el paso G del onboarding.' });
    const sin = dgAccesosSinRegistrar(reg);
    if (sin.length) p.push({ texto: 'Accesos sin estado registrado: ' + sin.map(x => x.label || x.id).join(', ') + '.', resolucion: 'Marcar cada acceso como validado, pendiente o no aplica en el paso E. Nunca se piden contraseñas.' });
  }
  if (accion === 'send') {
    if (enc.estado !== 'En curso') p.push({ texto: 'El encargo no está «En curso» (estado actual: ' + enc.estado + ').', resolucion: 'Iniciar el diagnóstico antes de enviarlo a control de calidad.' });
    if (!dgDisponibles(enc).length) p.push({ texto: 'No hay ningún hallazgo sin bloqueo: la respuesta sería vacía.', resolucion: 'Conseguir al menos un acceso validado para poder revisar algo con evidencia.' });
    const inc = dgHallazgosIncompletos(enc);
    if (inc.length) p.push({ texto: inc.length + ' hallazgo(s) sin fuente, fecha o referencia de evidencia.', resolucion: 'Completar la evidencia de cada hallazgo; sin fuente no se envía.' });
    if (bloqueos.length && !enc.limitacionesDeclaradas) p.push({ texto: 'Hay accesos sin validar y las limitaciones no están declaradas.', resolucion: 'Pulsar «Declarar datos ausentes y limitaciones»: lo que no se puede medir se dice, no se estima.' });
    if (!reg.responsableCalidad) p.push({ texto: 'Sin responsable de control de calidad.', resolucion: 'Designar responsable de calidad en el paso G del onboarding.' });
  }
  if (accion === 'declare') {
    if (!bloqueos.length) p.push({ texto: 'No hay datos ausentes que declarar.', resolucion: 'Todos los accesos necesarios están validados.' });
    if (enc.limitacionesDeclaradas) p.push({ texto: 'Las limitaciones ya están declaradas.', resolucion: 'No es necesario repetirlo.' });
  }
  if (accion === 'qa') {
    if (enc.estado !== 'En revisión') p.push({ texto: 'La revisión de calidad solo se ejecuta sobre un diagnóstico enviado a revisión.', resolucion: 'Enviar el diagnóstico a control de calidad primero.' });
  }
  if (accion === 'plan') {
    const ultima = enc.revisiones[enc.revisiones.length - 1];
    if (enc.estado !== 'Completado') p.push({ texto: 'El diagnóstico no está completado (estado: ' + enc.estado + ').', resolucion: 'Pasar el control de calidad antes de planificar.' });
    if (!ultima || ultima.resultado !== 'Validado') p.push({ texto: 'La última revisión de calidad no está validada.', resolucion: 'Corregir lo devuelto y volver a pasar control de calidad.' });
    if (dgPlan(enc)) p.push({ texto: 'Ya existe un plan para este encargo.', resolucion: 'Abrir el plan y crear una versión nueva si hace falta cambiarlo.' });
    if (!dgDisponibles(enc).length) p.push({ texto: 'No hay hallazgos sin bloqueo con los que construir acciones.', resolucion: 'Resolver los accesos bloqueados antes de planificar.' });
    if (!enc.objetivos) p.push({ texto: 'Sin objetivos registrados: las acciones no podrían justificarse.', resolucion: 'Completar los objetivos en el paso C del onboarding.' });
  }
  return p;
}

function dgBloqueoHTML(titulo, problemas, id) {
  return `<div class="v-error" role="alert"${id ? ' id="' + id + '"' : ''}>${tag('Acción no disponible', 'bad')}<strong>${escapeText(titulo)}</strong>
  <ul class="v-error-list">${problemas.map(x => `<li><span>${escapeText(x.texto)}</span><span class="v-small v-muted">Cómo resolverlo: ${escapeText(x.resolucion)}</span></li>`).join('')}</ul></div>`;
}

// Devuelve true si la acción queda bloqueada: muestra el error y no cambia nada.
function dgImpedir(enc, accion, titulo) {
  const problemas = dgRequisitos(enc, accion);
  if (!problemas.length) { dgAviso = null; return false; }
  dgAviso = { encId: enc.id, accion, titulo, problemas };
  dgAbrirCliente(enc);
  announce(titulo + ' ' + problemas.length + ' requisito(s) sin cumplir: ' + problemas.map(x => x.texto).join(' ') );
  return true;
}

/* ---------- Control de calidad ---------- */

function dgRevisar(enc) {
  const reg = dgReg(enc);
  const servicios = enc.servicios.length ? enc.servicios : ['SEO'];
  const comprobaciones = [
    { id: 'alcance', label: DG_QA_PASOS[0].label, ok: servicios.every(s => enc.hallazgos.some(h => DG_CATALOGO.find(x => x.id === h.ref && x.servicio === s)) ) || enc.hallazgos.length >= 3 },
    { id: 'evidencia', label: DG_QA_PASOS[1].label, ok: enc.hallazgos.every(h => h.evidencia && h.fuente && h.fecha) },
    { id: 'pendientes', label: DG_QA_PASOS[2].label, ok: dgBloqueos(enc).length === 0 || enc.limitacionesDeclaradas }
  ];
  const ok = comprobaciones.every(x => x.ok);
  const rev = {
    n: enc.revisiones.length + 1,
    resultado: ok ? 'Validado' : 'Devuelto para corrección',
    comprobaciones,
    comentario: ok
      ? 'Alcance, evidencias y limitaciones verificados por control de calidad (revisión simulada).'
      : 'Faltan por declarar los datos ausentes derivados de accesos sin validar: ' + dgBloqueos(enc).map(b => b.nombre + ' · ' + b.estado).join(' · ') + '.',
    fecha: '18 sep 2026 · Control de calidad'
  };
  enc.revisiones.push(rev);
  enc.estado = ok ? 'Completado' : 'En curso';
  enc.historial.push(rev.fecha + ' · Revisión ' + rev.n + ': ' + rev.resultado + '.');
  dgSincronizarCliente(enc);
  return rev;
}

/* ---------- Plan ---------- */

function dgPlan(enc) {
  return enc.planes.length ? enc.planes[enc.planes.length - 1] : null;
}

function dgAccionesPlan(enc) {
  const reg = dgReg(enc);
  const agentes = { SEO: 'Estrategia y planificación', 'SEO técnico': 'SEO técnico', Contenidos: 'Contenidos', AEO: 'AEO/GEO y citabilidad', GEO: 'AEO/GEO y citabilidad' };
  const fechas = ['22 sep', '26 sep', '30 sep', '3 oct', '7 oct', '10 oct'];
  const costes = ['6 h · 180 € (ilustrativo)', '12 h · 420 € (ilustrativo)', '8 h · 260 € (ilustrativo)', '4 h · 140 € (ilustrativo)', '10 h · 340 € (ilustrativo)', '5 h · 165 € (ilustrativo)'];
  return dgDisponibles(enc).map((h, i) => {
    const cat = DG_CATALOGO.find(x => x.id === h.ref) || {};
    const agente = agentes[cat.servicio] || 'Estrategia y planificación';
    return {
      n: i + 1,
      accion: 'Resolver: ' + h.titulo,
      justifica: 'Hallazgo ' + h.evidencia + ' · objetivo: ' + (reg.data.objetivos || 'objetivo pendiente de definir'),
      entregable: cat.servicio === 'Contenidos' ? 'Borradores con fuentes citadas' : cat.servicio === 'SEO técnico' ? 'Mapa de cambios técnicos' : 'Ficha de recomendaciones con evidencia',
      criterio: h.prioridad === 'Alta' ? 'Hallazgo verificado como resuelto con evidencia posterior' : 'Entregable revisado por control de calidad sin devoluciones',
      agente,
      dependencias: i === 0 ? 'Diagnóstico validado' : 'Acción ' + i + ' entregada',
      plazo: fechas[i] || 'Por fijar',
      coste: costes[i] || 'Por estimar',
      aprobacion: /Publicar|Contenidos/.test(cat.servicio) ? 'Aprobación del cliente antes de publicar' : 'Autorización del PM'
    };
  });
}

function dgCrearPlan(enc, motivo) {
  const v = enc.planes.length + 1;
  const plan = {
    version: v,
    estado: 'Pendiente de aprobación',
    creado: '18 sep 2026 · 09:42',
    motivo: motivo || 'Generado desde el diagnóstico validado.',
    acciones: dgAccionesPlan(enc),
    excluidas: enc.hallazgos.filter(h => dgBloqueado(enc, h)).map(h => h.titulo + ' · bloqueado por ' + dgAccesoNombre(h.dep)),
    decisiones: []
  };
  enc.planes.push(plan);
  enc.historial.push('18 sep 2026 · Plan v' + v + ' generado y enviado al Project Manager.');
  dgSincronizarCliente(enc);
  return plan;
}

function dgDecidirPlan(enc, tipo, comentario) {
  const plan = dgPlan(enc);
  if (!plan || plan.estado === 'Listo para ejecución') return;
  const texto = comentario.trim();
  if (tipo === 'approve') {
    plan.estado = 'Listo para ejecución';
    plan.decisiones.push({ tipo: 'Aprobado', comentario: texto || 'Sin observaciones.', fecha: '18 sep 2026 · Project Manager', version: plan.version });
  } else if (tipo === 'changes') {
    plan.estado = 'Cambios solicitados';
    plan.decisiones.push({ tipo: 'Cambios solicitados', comentario: texto, fecha: '18 sep 2026 · Project Manager', version: plan.version });
  } else {
    plan.estado = 'Rechazado';
    plan.decisiones.push({ tipo: 'Rechazado', comentario: texto, fecha: '18 sep 2026 · Project Manager', version: plan.version });
  }
  enc.historial.push('18 sep 2026 · Decisión del PM sobre el plan v' + plan.version + ': ' + plan.decisiones[plan.decisiones.length - 1].tipo + '.');
  dgSincronizarCliente(enc);
}

/* ---------- Persistencia local ---------- */

const DG_KEY = 'valme-v2-demo';

function dgGuardar() {
  try {
    localStorage.setItem(DG_KEY, JSON.stringify({
      v: 1, onbRegistros, onbSeq, encargos, encSeq,
      clientes: clients.map(c => ({ id: c.id, name: c.name, state: c.state, service: c.service, progress: c.progress, pod: c.pod }))
    }));
  } catch (err) { /* almacenamiento no disponible: la demo sigue en memoria */ }
}

function dgRestaurar() {
  let raw = null;
  try { raw = localStorage.getItem(DG_KEY); } catch (err) { return false; }
  if (!raw) return false;
  try {
    const d = JSON.parse(raw);
    if (!d || d.v !== 1) return false;
    onbRegistros = d.onbRegistros || [];
    onbSeq = d.onbSeq || onbRegistros.length;
    encargos = d.encargos || [];
    encSeq = d.encSeq || encargos.length;
    (d.clientes || []).forEach(s => {
      const c = clients.find(x => x.id === s.id);
      if (c) { c.state = s.state; c.service = s.service; c.progress = s.progress; c.name = s.name; }
      else clients.push({ id: s.id, name: s.name, state: s.state, service: s.service, progress: s.progress, pod: s.pod });
    });
    return true;
  } catch (err) { return false; }
}

/* ---------- Vistas ---------- */

function dgFichaHallazgo(enc, h) {
  const bloq = dgBloqueado(enc, h);
  const incompleto = !h.evidencia || !h.fuente || !h.fecha;
  return `<div class="v-row${incompleto ? ' v-row-error' : ''}"><div><div class="v-flex">${tag(bloq ? 'Bloqueado por acceso' : incompleto ? 'Evidencia incompleta' : 'Hallazgo registrado', bloq ? 'bad' : incompleto ? 'warn' : 'dark')}${tag('Prioridad ' + h.prioridad, h.prioridad === 'Alta' ? 'warn' : 'dark')}<span class="v-mono v-muted">${h.evidencia || 'SIN REFERENCIA'}</span></div>
  <strong>${escapeText(h.titulo)}</strong>
  <dl class="v-kv"><div><dt>FUENTE DE EJEMPLO</dt><dd>${escapeText(h.fuente)}</dd></div><div><dt>FECHA</dt><dd>${h.fecha}</dd></div><div><dt>IMPACTO ESTIMADO</dt><dd>${escapeText(h.impacto)}</dd></div><div><dt>LIMITACIONES</dt><dd>${escapeText(h.limitaciones)}</dd></div></dl>
  ${bloq ? `<p class="v-small">Trabajo detenido solo en este hallazgo. Cómo resolverlo: solicitar ${dgAccesoNombre(h.dep)} con el permiso mínimo previsto y marcarlo como validado en el paso E del onboarding. Sin ese acceso no se mide nada ni se inventan cifras.</p>` : ''}</div></div>`;
}

function dgPanelEstado(enc) {
  const bloqueos = dgBloqueos(enc);
  const plan = dgPlan(enc);
  const ultima = enc.revisiones[enc.revisiones.length - 1];
  const posibles = [];
  if (enc.estado === 'Pendiente') posibles.push({ attr: 'data-dg-start', label: 'Iniciar diagnóstico', accion: 'start', primary: true });
  if (enc.estado === 'En curso') posibles.push({ attr: 'data-dg-send', label: 'Enviar a control de calidad', accion: 'send', primary: true });
  if (enc.estado === 'En curso' && bloqueos.length && !enc.limitacionesDeclaradas) posibles.push({ attr: 'data-dg-declare', label: 'Declarar datos ausentes y limitaciones', accion: 'declare' });
  if (enc.estado === 'En revisión') posibles.push({ attr: 'data-dg-qa', label: 'Ejecutar revisión de calidad (simulada)', accion: 'qa', primary: true });
  if (enc.estado === 'Completado' && !plan) posibles.push({ attr: 'data-dg-plan', label: 'Generar plan de trabajo', accion: 'plan', primary: true });
  const acciones = [];
  const impedimentos = [];
  posibles.forEach((a, i) => {
    const problemas = dgRequisitos(enc, a.accion);
    const descId = 'v-dg-req-' + enc.id + '-' + i;
    if (problemas.length) {
      acciones.push(`<button${a.primary ? ' class="v-primary"' : ''} ${a.attr}="${enc.id}" aria-disabled="true" aria-describedby="${descId}">${a.label}</button>`);
      impedimentos.push(dgBloqueoHTML('No se puede continuar: ' + a.label.toLowerCase() + '.', problemas, descId));
    } else {
      acciones.push(`<button${a.primary ? ' class="v-primary"' : ''} ${a.attr}="${enc.id}">${a.label}</button>`);
    }
  });
  if (plan) acciones.push('<button data-plan-open="' + enc.id + '">Ver plan v' + plan.version + '</button>');
  const aviso = dgAviso && dgAviso.encId === enc.id
    ? dgBloqueoHTML(dgAviso.titulo, dgAviso.problemas)
    : '';
  return `<div class="v-panel"><div class="v-section-head"><h2>Encargo ${enc.id}</h2>${tag(enc.estado, tone(enc.estado))}</div>
  <dl class="v-kv"><div><dt>CLIENTE</dt><dd>${escapeText(clients[enc.clienteId - 1].name)}</dd></div>
  <div><dt>SERVICIO CONTRATADO</dt><dd>${enc.servicios.join(', ') || 'Sin definir'}</dd></div>
  <div><dt>OBJETIVOS DEL ONBOARDING</dt><dd>${escapeText(enc.objetivos || 'Pendiente de definir')}</dd></div>
  <div><dt>AGENTES ASIGNADOS</dt><dd>${enc.agentes.length ? enc.agentes.join(', ') : 'Sin asignar'}</dd></div>
  <div><dt>ESTADO DEL CLIENTE</dt><dd>${dgEstadoCliente(enc)}</dd></div>
  <div><dt>CREADO</dt><dd>${enc.creado}</dd></div></dl>
  <p class="v-small v-muted">Estados posibles: ${DG_ESTADOS.join(' · ')}. El encargo es único por cliente: repetir la activación no lo duplica.</p>
  ${ultima ? `<div class="v-notice"><strong>Revisión ${ultima.n}: ${ultima.resultado}</strong><p class="v-small">${escapeText(ultima.comentario)}</p></div>` : ''}
  ${aviso}
  ${acciones.length ? `<div class="v-flex" style="margin-top:16px">${acciones.join('')}</div>` : ''}
  ${impedimentos.join('')}</div>`;
}

function tabDiagnostico(c, reg) {
  const enc = dgEncargoDe(c.id);
  if (!enc) {
    return `<div class="v-panel"><h2>Sin encargo de diagnóstico</h2><p>El diagnóstico se crea cuando el Project Manager aprueba el onboarding. Este cliente aún no lo tiene.</p><button class="v-primary" data-onb-open="${reg.id}" style="margin-top:14px">Abrir onboarding →</button></div>`;
  }
  const bloqueos = dgBloqueos(enc);
  return dgPanelEstado(enc)
    + `<section class="v-section"><div class="v-section-head"><h2>Hallazgos (${enc.hallazgos.length})</h2><span class="v-mono">${dgDisponibles(enc).length} SIN BLOQUEO</span></div><div class="v-panel">${enc.estado === 'Pendiente' ? '<p>Sin datos: el diagnóstico no se ha iniciado.</p>' : enc.hallazgos.map(h => dgFichaHallazgo(enc, h)).join('')}</div></section>`
    + (bloqueos.length ? `<section class="v-section"><div class="v-section-head"><h2>Trabajo bloqueado por accesos</h2>${tag(enc.limitacionesDeclaradas ? 'Limitaciones declaradas' : 'Sin declarar', enc.limitacionesDeclaradas ? 'good' : 'warn')}</div><div class="v-panel">${bloqueos.map(b => `<div class="v-row"><div>${tag(b.estado, tone(b.estado))}<strong>${b.nombre}</strong><p>Bloquea: ${b.afectados.map(escapeText).join(' · ')}</p><p class="v-small">Resolución: el cliente concede ${b.nombre} con permiso mínimo; después se marca como validado en el paso E. El resto del diagnóstico continúa.</p></div></div>`).join('')}</div></section>` : '')
    + (enc.revisiones.length ? `<section class="v-section"><div class="v-section-head"><h2>Control de calidad</h2><span class="v-mono">${enc.revisiones.length} REVISIONES</span></div><div class="v-panel">${enc.revisiones.map(r => `<div class="v-row"><div>${tag(r.resultado, r.resultado === 'Validado' ? 'good' : 'warn')}<strong>Revisión ${r.n} · ${r.fecha}</strong><p>${escapeText(r.comentario)}</p>${r.comprobaciones.map(x => `<p class="v-small">${x.ok ? '✓' : '×'} ${x.label}</p>`).join('')}</div></div>`).join('')}</div></section>` : '')
    + `<section class="v-section v-panel"><h2>Historial del encargo</h2>${enc.historial.map(h => `<p class="v-small">${escapeText(h)}</p>`).join('')}</section>`;
}

function dgTablaPlan(enc, plan) {
  return plan.acciones.map(a => `<div class="v-row"><div><div class="v-flex">${tag('Acción ' + a.n, 'dark')}${tag(a.aprobacion, 'warn')}</div><strong>${escapeText(a.accion)}</strong><p>${escapeText(a.justifica)}</p>
  <dl class="v-kv"><div><dt>ENTREGABLE</dt><dd>${escapeText(a.entregable)}</dd></div><div><dt>CRITERIO DE ACEPTACIÓN</dt><dd>${escapeText(a.criterio)}</dd></div><div><dt>AGENTE RESPONSABLE</dt><dd>${escapeText(a.agente)}</dd></div><div><dt>DEPENDENCIAS</dt><dd>${escapeText(a.dependencias)}</dd></div><div><dt>PLAZO</dt><dd>${a.plazo}</dd></div><div><dt>ESFUERZO Y COSTE</dt><dd>${a.coste}</dd></div></dl></div></div>`).join('')
    + (plan.excluidas.length ? `<div class="v-notice"><strong>Fuera del plan por falta de acceso</strong><p class="v-small">${plan.excluidas.map(escapeText).join(' · ')}</p></div>` : '');
}

function planReview(enc) {
  dgActual = enc.id;
  const plan = dgPlan(enc);
  const c = clients[enc.clienteId - 1];
  if (!plan) return tabDiagnostico(c, dgReg(enc));
  const pendiente = plan.estado === 'Pendiente de aprobación';
  return `<button class="v-back" data-go="Supervisión">← Supervisión</button>`
    + heading('PLAN / ' + enc.id + ' · v' + plan.version, 'Plan de trabajo de ' + c.name, enc.servicios.join(', ') + ' · ' + plan.acciones.length + ' acciones', tag(plan.estado, tone(plan.estado)))
    + `<div class="v-panel"><dl class="v-kv"><div><dt>VERSIÓN</dt><dd>v${plan.version} de ${enc.planes.length}</dd></div><div><dt>ORIGEN</dt><dd>${escapeText(plan.motivo)}</dd></div><div><dt>DIAGNÓSTICO</dt><dd>${enc.estado} · ${enc.revisiones.length} revisiones de calidad</dd></div><div><dt>ESTADO DEL CLIENTE</dt><dd>${dgEstadoCliente(enc)}</dd></div></dl>
  <p class="v-small v-muted">Estado del cliente, estado del encargo y estado de la aprobación son distintos y se muestran por separado. Aprobar no ejecuta ni publica nada.</p></div>
  <section class="v-section"><div class="v-section-head"><h2>Acciones propuestas</h2><span class="v-mono">COSTES ILUSTRATIVOS</span></div><div class="v-panel">${dgTablaPlan(enc, plan)}</div></section>
  <section class="v-section v-panel"><h2>Decisión del Project Manager</h2>
  ${pendiente ? `<div class="v-field"><label><span>Comentario o motivo</span><textarea rows="3" id="v-plan-comment" placeholder="Obligatorio para solicitar cambios o rechazar"></textarea></label></div>
  <div class="v-flex" style="margin-top:14px"><button class="v-primary" data-plan-decision="approve">Aprobar plan v${plan.version}</button><button data-plan-decision="changes">Solicitar cambios</button><button data-plan-decision="reject">Rechazar</button></div>
  <p class="v-small v-muted" style="margin-top:12px">La decisión queda vinculada a la versión v${plan.version}. Aprobar deja el plan «Listo para ejecución»; no inicia trabajo real.</p>`
      : `<div class="v-notice"><strong>${plan.estado}</strong><p class="v-small">${escapeText(plan.decisiones.length ? plan.decisiones[plan.decisiones.length - 1].comentario : '')}</p></div>
  <div class="v-flex"><button data-plan-newversion="${enc.id}">${plan.estado === 'Listo para ejecución' ? 'Modificar plan aprobado (crea v' + (plan.version + 1) + ')' : 'Aplicar cambios y crear v' + (plan.version + 1)}</button></div>
  <p class="v-small v-muted" style="margin-top:12px">Modificar un plan aprobado crea una versión nueva pendiente de revisión: la aprobación anterior no la cubre.</p>`}
  </section>
  <section class="v-section v-panel"><h2>Historial de decisiones</h2>${enc.planes.map(p => `<div class="v-row"><div>${tag('v' + p.version + ' · ' + p.estado, tone(p.estado))}<strong>${p.acciones.length} acciones · ${p.creado}</strong><p>${escapeText(p.motivo)}</p>${p.decisiones.map(d => `<p class="v-small">${d.fecha} · ${d.tipo}: ${escapeText(d.comentario)}</p>`).join('') || '<p class="v-small v-muted">Sin decisión registrada.</p>'}</div></div>`).join('')}</section>`;
}

/* ---------- Integración con las vistas existentes ---------- */

if (CLIENT_TABS.indexOf('Diagnóstico') === -1) CLIENT_TABS.splice(3, 0, 'Diagnóstico');

const _clientFile = clientFile;
globalThis.clientFile = function (c) {
  if (clientTab !== 'Diagnóstico') return _clientFile(c);
  clientActual = c.id;
  const reg = onbDeCliente(c);
  return `<button class="v-back" data-go="Clientes">← Cartera</button>`
    + heading(c.pod, c.name, c.service, tag(c.state, tone(c.state)))
    + `<div class="v-tabs" role="tablist" aria-label="Secciones de la ficha">${CLIENT_TABS.map(t => `<button role="tab" data-ctab="${t}" aria-selected="${t === clientTab}">${t}</button>`).join('')}</div>
    <section class="v-section" id="v-ctab-panel">${tabDiagnostico(c, reg)}</section>`;
};

const _tabPlan = tabPlan;
globalThis.tabPlan = function (c, reg) {
  const enc = dgEncargoDe(c.id);
  const plan = enc && dgPlan(enc);
  if (!plan) {
    return `<div class="v-panel"><h2>Sin plan generado</h2><p>${enc ? 'El plan se genera desde un diagnóstico validado por control de calidad. Estado actual del encargo: ' + enc.estado + '.' : 'Este cliente todavía no tiene encargo de diagnóstico.'}</p>${enc ? `<button data-ctab="Diagnóstico" style="margin-top:14px">Ver diagnóstico →</button>` : ''}
    <details><summary>Ejemplo de plan de referencia (sin vincular)</summary>${_tabPlan(c, reg)}</details></div>`;
  }
  return `<div class="v-panel"><div class="v-section-head"><h2>Plan v${plan.version} · ${plan.acciones.length} acciones</h2>${tag(plan.estado, tone(plan.estado))}</div>${dgTablaPlan(enc, plan)}
  <div class="v-flex" style="margin-top:16px"><button data-plan-open="${enc.id}">Abrir plan y decisión del PM →</button></div></div>`;
};

function dgPlanesPendientes() {
  return encargos.filter(e => { const p = dgPlan(e); return p && p.estado === 'Pendiente de aprobación'; });
}

function dgFilaPlan(e) {
  const p = dgPlan(e);
  const c = clients[e.clienteId - 1];
  return `<div class="v-row"><div><div class="v-flex">${tag(p.estado, tone(p.estado))}<span class="v-mono v-muted">${e.id} · v${p.version}</span></div><strong>Plan de trabajo · ${escapeText(c.name)}</strong><p>${p.acciones.length} acciones · ${e.servicios.join(', ') || 'servicio sin definir'}</p></div><button data-plan-open="${e.id}" aria-label="Revisar el plan de ${c.name}">Revisar plan →</button></div>`;
}

const _supervision = supervision;
globalThis.supervision = function () {
  const pendientes = dgPlanesPendientes();
  const decididos = encargos.filter(e => { const p = dgPlan(e); return p && p.estado !== 'Pendiente de aprobación'; });
  return _supervision()
    + `<section class="v-section"><div class="v-section-head"><h2>Planes de trabajo para decidir (${pendientes.length})</h2><span class="v-mono">APROBAR · CAMBIOS · RECHAZO</span></div><div class="v-panel">${pendientes.map(dgFilaPlan).join('') || '<p>No hay planes pendientes de decisión.</p>'}</div>
  ${decididos.length ? `<div class="v-panel" style="margin-top:14px"><h3>Planes con decisión registrada</h3>${decididos.map(e => { const p = dgPlan(e); const c = clients[e.clienteId - 1]; return `<div class="v-row"><div>${tag(p.estado, tone(p.estado))}<strong>${escapeText(c.name)} · v${p.version}</strong><p>${p.decisiones.length ? escapeText(p.decisiones[p.decisiones.length - 1].tipo + ': ' + p.decisiones[p.decisiones.length - 1].comentario) : 'Sin comentario'}</p></div><button data-plan-open="${e.id}">Abrir</button></div>`; }).join('')}</div>` : ''}
  <p class="v-small v-muted" style="margin-top:12px">Aprobar un plan lo deja «Listo para ejecución»: no ejecuta trabajo, no publica y no comunica nada al cliente.</p></section>`;
};

const _dashboard = dashboard;
globalThis.dashboard = function () {
  const cuenta = est => clients.filter(c => c.state === est).length;
  const diag = clients.filter(c => /Diagnóstico/.test(c.state)).length;
  const planes = dgPlanesPendientes().length;
  const listos = encargos.filter(e => { const p = dgPlan(e); return p && p.estado === 'Listo para ejecución'; }).length;
  const viejo = `<div class="v-stats"><div class="v-stat"><div class="v-number">62</div><span class="v-small">Piloto automático</span></div><div class="v-stat"><div class="v-number">12</div><span class="v-small">En revisión</span></div><div class="v-stat"><div class="v-number">6</div><span class="v-small">Bloqueados</span></div><div class="v-stat"><div class="v-number">4</div><span class="v-small">Onboarding</span></div></div>`;
  const nuevo = `<div class="v-stats"><div class="v-stat"><div class="v-number">${cuenta('Piloto automático')}</div><span class="v-small">Piloto automático</span></div><div class="v-stat"><div class="v-number">${cuenta('En revisión')}</div><span class="v-small">En revisión</span></div><div class="v-stat"><div class="v-number">${cuenta('Bloqueado')}</div><span class="v-small">Bloqueados</span></div><div class="v-stat"><div class="v-number">${cuenta('Onboarding')}</div><span class="v-small">Onboarding</span></div></div><p class="v-small v-muted" style="margin-top:10px">${diag} clientes en diagnóstico o con plan · recuento calculado sobre la cartera, no fijado a mano.</p>`;
  const extra = `<section class="v-section"><div class="v-section-head"><h2>Diagnóstico y planificación</h2><button data-go="Clientes">Ver cartera →</button></div>
  <div class="v-stats"><div class="v-stat"><span class="v-small v-muted">Encargos de diagnóstico</span><div class="v-number">${encargos.length}</div><span class="v-small">Uno por cliente activado</span></div>
  <div class="v-stat"><span class="v-small v-muted">En curso o bloqueados</span><div class="v-number">${encargos.filter(e => e.estado === 'En curso' || e.estado === 'Bloqueado').length}</div><span class="v-small">Con limitaciones declaradas cuando falta un acceso</span></div>
  <div class="v-stat"><span class="v-small v-muted">Planes por decidir</span><div class="v-number">${planes}</div><span class="v-small">Esperan al Project Manager</span></div>
  <div class="v-stat"><span class="v-small v-muted">Planes listos para ejecución</span><div class="v-number">${listos}</div><span class="v-small">Aprobados; sin ejecutar</span></div></div>
  ${planes ? `<div class="v-panel" style="margin-top:14px">${dgPlanesPendientes().slice(0, 3).map(dgFilaPlan).join('')}</div>` : ''}</section>`;
  return _dashboard().replace(viejo, nuevo) + extra;
};

/* ---------- Eventos ---------- */

function dgAbrirCliente(enc, tab) {
  clientTab = tab || 'Diagnóstico';
  onbRender(clientFile(clients[enc.clienteId - 1]));
}

root.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  const d = b.dataset;
  let enc = null;
  if (d.onbActivate !== undefined) {
    const reg = onbRegistros.find(r => r.id === onbActual);
    if (!reg || reg.estado !== 'Activo') return;
    let c = reg.clienteId ? clients.find(x => x.id === reg.clienteId) : null;
    if (!c) {
      c = { id: clients.length + 1, name: reg.data.nombre || reg.id, state: 'Diagnóstico pendiente', service: reg.servicios.join(' + ') || 'Sin definir', progress: 10, pod: 'POD-' + String(clients.length + 1).padStart(3, '0') };
      clients.push(c);
      reg.clienteId = c.id;
    }
    enc = dgCrearEncargo(reg, c);
    dgSincronizarCliente(enc);
    dgGuardar();
    dgAbrirCliente(enc, 'Diagnóstico');
    announce('Onboarding aprobado. El cliente queda en «Diagnóstico pendiente» con el encargo ' + enc.id + '; el servicio no está activo.');
    return;
  }
  if (d.dgStart) {
    enc = encargos.find(x => x.id === d.dgStart);
    enc.estado = 'En curso';
    enc.historial.push('18 sep 2026 · Diagnóstico iniciado por los agentes asignados (simulado).');
    const bl = dgBloqueos(enc);
    if (bl.length) enc.historial.push('18 sep 2026 · Trabajo dependiente de ' + bl.map(x => x.nombre).join(', ') + ' bloqueado; el resto continúa.');
    dgSincronizarCliente(enc); dgGuardar(); dgAbrirCliente(enc);
    announce('Diagnóstico en curso.' + (bl.length ? ' Hay trabajo bloqueado por accesos sin validar.' : ''));
  } else if (d.dgDeclare) {
    enc = encargos.find(x => x.id === d.dgDeclare);
    enc.limitacionesDeclaradas = true;
    enc.historial.push('18 sep 2026 · Datos ausentes y limitaciones declarados por el equipo.');
    dgGuardar(); dgAbrirCliente(enc);
    announce('Limitaciones declaradas. No se sustituyen por estimaciones.');
  } else if (d.dgSend) {
    enc = encargos.find(x => x.id === d.dgSend);
    enc.estado = 'En revisión';
    enc.historial.push('18 sep 2026 · Diagnóstico enviado a control de calidad.');
    dgSincronizarCliente(enc); dgGuardar(); dgAbrirCliente(enc);
    announce('Diagnóstico en revisión de calidad.');
  } else if (d.dgQa) {
    enc = encargos.find(x => x.id === d.dgQa);
    const rev = dgRevisar(enc);
    dgGuardar(); dgAbrirCliente(enc);
    announce('Revisión de calidad: ' + rev.resultado + '.');
  } else if (d.dgPlan) {
    enc = encargos.find(x => x.id === d.dgPlan);
    if (enc.estado !== 'Completado' || dgPlan(enc)) return;
    dgCrearPlan(enc, 'Generado desde el diagnóstico validado el 18 sep 2026.');
    dgGuardar();
    onbRender(planReview(enc));
    announce('Plan generado y pendiente de decisión del Project Manager.');
  } else if (d.planOpen) {
    enc = encargos.find(x => x.id === d.planOpen);
    onbRender(planReview(enc));
    announce('Plan abierto para revisión.');
  } else if (d.planDecision) {
    enc = encargos.find(x => x.id === dgActual);
    if (!enc) return;
    const campo = root.querySelector('#v-plan-comment');
    const texto = campo ? campo.value.trim() : '';
    if (d.planDecision !== 'approve' && !texto) {
      announce('Escribe el comentario o el motivo antes de solicitar cambios o rechazar el plan.');
      if (campo) campo.focus();
      return;
    }
    dgDecidirPlan(enc, d.planDecision, texto);
    dgGuardar();
    onbRender(planReview(enc));
    announce(d.planDecision === 'approve' ? 'Plan aprobado: listo para ejecución. No se ha ejecutado ni publicado nada.' : d.planDecision === 'changes' ? 'Cambios solicitados con comentario registrado.' : 'Plan rechazado con su motivo.');
  } else if (d.planNewversion) {
    enc = encargos.find(x => x.id === d.planNewversion);
    const anterior = dgPlan(enc);
    dgCrearPlan(enc, 'Nueva versión tras la decisión sobre v' + anterior.version + ': ' + (anterior.decisiones.length ? anterior.decisiones[anterior.decisiones.length - 1].tipo.toLowerCase() : 'revisión') + '.');
    dgGuardar();
    onbRender(planReview(enc));
    announce('Nueva versión del plan creada y pendiente de revisión.');
  }
});

root.addEventListener('click', () => setTimeout(dgGuardar, 0));
root.addEventListener('change', () => setTimeout(dgGuardar, 0));
root.addEventListener('input', () => setTimeout(dgGuardar, 0));

/* ---------- Semilla y restauración ---------- */

function dgSemilla() {
  const a = clients[18], b = clients[19];
  [a, b].forEach((c, i) => {
    const reg = onbDeCliente(c);
    reg.estado = 'Activo';
    ONB_ACCESOS.forEach(x => { reg.accesos[x.id] = 'Validado'; });
    reg.data.objetivos = reg.data.objetivos || 'Aumentar la captación orgánica cualificada un 15% en el trimestre.';
    reg.data.base = 'Parcial';
    reg.responsableCalidad = reg.responsableCalidad || 'Control de calidad';
    if (reg.equipo.length < 4) reg.equipo = specialties.slice(0, 5);
    reg.historial.push('18 sep 2026 · 09:20 · Onboarding aprobado por el Project Manager (demostración).');
    const enc = dgCrearEncargo(reg, c);
    if (i === 1) {
      const conDep = enc.hallazgos.find(h => h.dep);
      if (conDep) reg.accesos[conDep.dep] = 'Pendiente';
    }
    enc.estado = 'En curso';
    enc.historial.push('18 sep 2026 · 09:30 · Diagnóstico iniciado por los agentes asignados.');
    if (i === 1) enc.historial.push('18 sep 2026 · 09:31 · Trabajo dependiente de ' + dgBloqueos(enc).map(x => x.nombre).join(', ') + ' bloqueado; el resto continúa.');
    dgSincronizarCliente(enc);
  });
}

if (!dgRestaurar()) { dgSemilla(); dgGuardar(); }
render(current, false);
