/* VALME Search OS · V2 — Onboarding guiado y ficha de cliente ampliada.
   Prototipo de demostración: ningún dato es real y ninguna acción sale de esta pantalla. */

const ONB_ACCESOS = [
  { id: 'gsc', nombre: 'Search Console', finalidad: 'Leer rendimiento e indexación', permiso: 'Lectura restringida' },
  { id: 'ga4', nombre: 'Analytics 4', finalidad: 'Medir tráfico y conversiones', permiso: 'Visualizador' },
  { id: 'cms', nombre: 'CMS del sitio', finalidad: 'Preparar borradores (sin publicar)', permiso: 'Editor sin publicación' },
  { id: 'logs', nombre: 'Servidor o logs', finalidad: 'Comprobar rastreo y errores', permiso: 'Solo consulta' },
  { id: 'gbp', nombre: 'Perfil de empresa', finalidad: 'Presencia local', permiso: 'Gestor sin publicación' }
];
const ONB_ESTADOS_ACCESO = ['No solicitado', 'Pendiente', 'Validado', 'Insuficiente', 'Caducado'];
const ONB_NIVELES = ['El agente prepara y ejecuta', 'Autorización del PM', 'Aprobación del cliente'];
const ONB_ACCIONES = [
  { id: 'analisis', label: 'Analizar datos y preparar diagnósticos', sensible: false },
  { id: 'borradores', label: 'Redactar borradores y propuestas', sensible: false },
  { id: 'publicar', label: 'Publicar contenido o cambios en el sitio', sensible: true },
  { id: 'comunicar', label: 'Enviar comunicaciones al cliente', sensible: true },
  { id: 'presupuesto', label: 'Cambiar presupuesto o alcance', sensible: true },
  { id: 'permisos', label: 'Modificar permisos o accesos', sensible: true },
  { id: 'eliminar', label: 'Eliminar información', sensible: true }
];
const ONB_SERVICIOS = ['SEO', 'SEO local', 'Contenidos', 'SEO técnico', 'AEO', 'GEO'];

const ONB_PASOS = [
  {
    letra: 'A', id: 'empresa', titulo: 'Empresa y responsables', cliente: true,
    campos: [
      { id: 'nombre', label: 'Nombre comercial', req: true },
      { id: 'dominio', label: 'Dominio principal', req: true, placeholder: 'ejemplo.com' },
      { id: 'sector', label: 'Sector', req: true },
      { id: 'mercados', label: 'Países, idiomas y ubicaciones', req: true },
      { id: 'contacto', label: 'Contacto principal', req: true },
      { id: 'aprobador', label: 'Aprobador por parte del cliente', req: true, ayuda: 'Quién autoriza publicaciones y envíos.' },
      { id: 'pm', label: 'Project Manager asignado', req: true }
    ]
  },
  {
    letra: 'B', id: 'servicio', titulo: 'Servicio y alcance',
    campos: [
      { id: 'servicios', label: 'Servicios contratados', tipo: 'checklist', opciones: ONB_SERVICIOS, req: true },
      { id: 'entregables', label: 'Entregables y frecuencia', tipo: 'area', req: true },
      { id: 'exclusiones', label: 'Exclusiones del alcance', tipo: 'area', req: true, ayuda: 'Lo que no se hará aunque lo pida un agente.' },
      { id: 'inicio', label: 'Fecha de inicio', tipo: 'date', req: true },
      { id: 'revision', label: 'Fecha de revisión del servicio', tipo: 'date', req: true },
      { id: 'limites', label: 'Límites de consumo y dedicación previstos', tipo: 'area', req: true }
    ]
  },
  {
    letra: 'C', id: 'negocio', titulo: 'Negocio y objetivos', cliente: true,
    campos: [
      { id: 'prioritarios', label: 'Productos o servicios prioritarios', tipo: 'area', req: true },
      { id: 'publico', label: 'Público y mercados', tipo: 'area', req: true },
      { id: 'competidores', label: 'Competidores de referencia', req: true },
      { id: 'objetivos', label: 'Objetivos de negocio', tipo: 'area', req: true },
      { id: 'indicadores', label: 'Indicadores acordados', req: true },
      { id: 'base', label: 'Situación inicial', tipo: 'select', opciones: ['Pendiente de medir', 'Conocida y documentada', 'Parcial'], req: true, ayuda: 'No se prometen posiciones ni resultados garantizados.' }
    ]
  },
  {
    letra: 'D', id: 'contexto', titulo: 'Contexto y materiales', cliente: true,
    campos: [
      { id: 'marca', label: 'Marca y tono de comunicación', tipo: 'area', req: true },
      { id: 'materiales', label: 'Documentación y contenidos existentes', tipo: 'area' },
      { id: 'restricciones', label: 'Restricciones editoriales y temas sensibles', tipo: 'area', req: true },
      { id: 'previos', label: 'Trabajos previos relevantes', tipo: 'area' },
      { id: 'fuentes', label: 'Referencias y fuentes autorizadas', tipo: 'area', req: true }
    ]
  },
  { letra: 'E', id: 'accesos', titulo: 'Accesos e integraciones', cliente: true, especial: 'accesos' },
  { letra: 'F', id: 'autonomia', titulo: 'Autonomía y aprobaciones', especial: 'autonomia' },
  { letra: 'G', id: 'equipo', titulo: 'Equipo y capacidad', especial: 'equipo' },
  { letra: 'H', id: 'revision', titulo: 'Revisión y activación', especial: 'revision' }
];

let onbRegistros = [];
let onbActual = null;
let onbPaso = 0;
let onbVistaCliente = false;
let clientTab = 'Resumen';
let onbSeq = 0;

function onbNuevo(nombre) {
  onbSeq += 1;
  const reg = {
    id: 'ONB-' + String(onbSeq).padStart(3, '0'),
    estado: 'Borrador',
    creado: '18 sep 2026',
    clienteId: null,
    data: { nombre: nombre || '' },
    servicios: [],
    accesos: {},
    autonomia: {},
    equipo: [],
    responsableCalidad: '',
    excepciones: [],
    historial: ['18 sep 2026 · 09:42 · Borrador creado por el Project Manager.']
  };
  ONB_ACCESOS.forEach(a => { reg.accesos[a.id] = 'No solicitado'; });
  ONB_ACCIONES.forEach(a => { reg.autonomia[a.id] = a.sensible ? 'Autorización del PM' : 'El agente prepara y ejecuta'; });
  onbRegistros.push(reg);
  return reg;
}

function onbDeCliente(c) {
  let reg = onbRegistros.find(r => r.clienteId === c.id);
  if (reg) return reg;
  reg = onbNuevo(c.name);
  reg.clienteId = c.id;
  const enCurso = c.state === 'Onboarding';
  reg.estado = enCurso ? 'Borrador' : 'Activo';
  reg.data = {
    nombre: c.name, dominio: c.name.toLowerCase().replace(/[^a-z]+/g, '') + '.example',
    sector: 'Demostración', mercados: 'España · español', contacto: 'Contacto de demostración',
    aprobador: enCurso ? '' : 'Responsable de marketing (demo)', pm: 'Project Manager',
    entregables: enCurso ? '' : 'Informe mensual, plan de contenidos y revisión técnica trimestral.',
    exclusiones: enCurso ? '' : 'Sin publicación automática ni compra de enlaces.',
    inicio: '2026-09-01', revision: '2027-03-01',
    limites: enCurso ? '' : 'Hasta 40 acciones automáticas por semana; 4 h de revisión humana.',
    prioritarios: enCurso ? '' : 'Catálogo principal y páginas de servicio.',
    publico: enCurso ? '' : 'Compradores profesionales en España.',
    competidores: enCurso ? '' : 'Tres competidores de demostración.',
    objetivos: enCurso ? '' : 'Aumentar la captación orgánica cualificada.',
    indicadores: enCurso ? '' : 'Clics orgánicos, contactos cualificados, respuestas con cita.',
    base: enCurso ? 'Pendiente de medir' : 'Conocida y documentada',
    marca: enCurso ? '' : 'Tono sobrio y técnico.',
    materiales: 'Documentación de demostración.',
    restricciones: enCurso ? '' : 'Sin comparativas de precio ni afirmaciones clínicas.',
    previos: '', fuentes: enCurso ? '' : 'Web propia y fuentes sectoriales autorizadas.'
  };
  reg.servicios = c.service.includes('técnico') ? ['SEO técnico', 'Contenidos'] : ['SEO', 'AEO', 'GEO'];
  ONB_ACCESOS.forEach((a, i) => {
    reg.accesos[a.id] = enCurso ? (i < 2 ? 'Pendiente' : 'No solicitado') : (i === 3 ? 'No solicitado' : 'Validado');
  });
  reg.equipo = enCurso ? [specialties[0]] : specialties.slice(0, reg.servicios.length + 4);
  reg.responsableCalidad = enCurso ? '' : 'Control de calidad';
  if (!enCurso) {
    reg.activadoEn = '01 sep 2026 · 10:10';
    reg.historial.push('01 sep 2026 · 10:10 · Activación aprobada por el Project Manager.');
  }
  return reg;
}

function onbCampoValor(reg, f) {
  if (f.id === 'servicios') return reg.servicios.join(', ');
  return reg.data[f.id] || '';
}

function onbPendientes(reg) {
  const faltan = [];
  ONB_PASOS.forEach(p => {
    (p.campos || []).forEach(f => {
      if (f.req && !onbCampoValor(reg, f)) faltan.push({ paso: p, label: f.label });
    });
  });
  if (!reg.equipo.length) faltan.push({ paso: ONB_PASOS[6], label: 'Agentes asignados al alcance' });
  if (!reg.responsableCalidad) faltan.push({ paso: ONB_PASOS[6], label: 'Responsable de calidad' });
  return faltan;
}

function onbRequisitos(reg) {
  const faltan = onbPendientes(reg);
  const accesosNecesarios = ONB_ACCESOS.filter(a => reg.accesos[a.id] !== 'No solicitado');
  const validados = accesosNecesarios.filter(a => reg.accesos[a.id] === 'Validado');
  const sensiblesOk = ONB_ACCIONES.filter(a => a.sensible).every(a => reg.autonomia[a.id] !== 'El agente prepara y ejecuta');
  return [
    { id: 'campos', label: 'Información obligatoria completa', ok: faltan.length === 0, detalle: faltan.length ? faltan.length + ' campos pendientes' : 'Sin campos pendientes', dispensable: false },
    { id: 'accesos', label: 'Al menos un acceso validado', ok: validados.length > 0, detalle: validados.length + ' de ' + accesosNecesarios.length + ' solicitados están validados', dispensable: true },
    { id: 'autoridad', label: 'Acciones sensibles bajo autorización humana', ok: sensiblesOk, detalle: sensiblesOk ? 'Publicar, enviar, presupuesto, permisos y borrado requieren autorización' : 'Alguna acción sensible quedaría sin autorización', dispensable: false },
    { id: 'equipo', label: 'Equipo asignado según el alcance', ok: reg.equipo.length > 0 && reg.equipo.length <= 8, detalle: reg.equipo.length + ' especialidades asignadas de 8', dispensable: false },
    { id: 'linea-base', label: 'Situación inicial declarada', ok: !!reg.data.base, detalle: reg.data.base || 'Sin declarar', dispensable: true }
  ];
}

function onbPuedeActivar(reg) {
  return onbRequisitos(reg).every(r => r.ok || (r.dispensable && reg.excepciones.some(e => e.req === r.id)));
}

/* ---------- Formulario ---------- */

function onbCampo(reg, f, soloLectura) {
  const val = escapeText(String(onbCampoValor(reg, f)));
  const dis = soloLectura ? ' disabled' : '';
  const req = f.req ? ' <span class="v-mono v-muted">obligatorio</span>' : '';
  const ayuda = f.ayuda ? `<p class="v-small v-muted">${f.ayuda}</p>` : '';
  let control;
  if (f.tipo === 'area') control = `<textarea rows="3" data-onb-field="${f.id}"${dis}>${val}</textarea>`;
  else if (f.tipo === 'select') control = `<select data-onb-field="${f.id}"${dis}><option value="">Sin indicar</option>${f.opciones.map(o => `<option ${o === val ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
  else if (f.tipo === 'checklist') control = `<div class="v-flex">${f.opciones.map(o => `<label class="v-check"><input type="checkbox" data-onb-servicio="${o}" ${reg.servicios.includes(o) ? 'checked' : ''}${dis}> ${o}</label>`).join('')}</div>`;
  else control = `<input type="${f.tipo === 'date' ? 'date' : 'text'}" data-onb-field="${f.id}" value="${val}" placeholder="${f.placeholder || ''}"${dis}>`;
  return `<div class="v-field${f.req && !onbCampoValor(reg, f) ? ' v-field-pending' : ''}"><label><span>${f.label}${req}</span>${control}</label>${ayuda}</div>`;
}

function onbPasoAccesos(reg, soloLectura) {
  return `<p class="v-small v-muted">Indica qué herramientas entran en el servicio y en qué estado está cada permiso. No pedimos contraseñas ni claves: nunca las escribas aquí.</p>
  <div class="v-panel" style="margin-top:14px">${ONB_ACCESOS.map(a => `<div class="v-row"><div><strong>${a.nombre}</strong><p>${a.finalidad} · permiso mínimo: ${a.permiso} · responsable: cliente</p></div><label><span class="v-sr-only">Estado de ${a.nombre}</span><select data-onb-acceso="${a.id}"${soloLectura ? ' disabled' : ''}>${ONB_ESTADOS_ACCESO.map(e => `<option ${reg.accesos[a.id] === e ? 'selected' : ''}>${e}</option>`).join('')}</select></label></div>`).join('')}</div>
  <div class="v-notice">Las conexiones y validaciones de esta versión son simuladas: no se contacta con ningún servicio real.</div>`;
}

function onbPasoAutonomia(reg, soloLectura) {
  return `<p class="v-small v-muted">Define qué puede hacer un agente por sí mismo y qué necesita una decisión humana. El nivel de confianza del agente nunca amplía estos permisos.</p>
  <div class="v-panel" style="margin-top:14px">${ONB_ACCIONES.map(a => `<div class="v-row"><div><strong>${a.label}</strong><p>${a.sensible ? 'Acción sensible: requiere autorización humana' : 'Trabajo preparatorio dentro del alcance'}</p></div><label><span class="v-sr-only">Nivel para ${a.label}</span><select data-onb-auton="${a.id}"${soloLectura ? ' disabled' : ''}>${ONB_NIVELES.filter(n => !a.sensible || n !== 'El agente prepara y ejecuta').map(n => `<option ${reg.autonomia[a.id] === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>`).join('')}</div>
  ${onbCampo(reg, { id: 'incidencias', label: 'Quién recibe las incidencias y en qué plazo responde', tipo: 'area' }, soloLectura)}`;
}

function onbPasoEquipo(reg, soloLectura) {
  const sugerido = reg.servicios.length ? reg.servicios.length + 3 : 0;
  return `<p class="v-small v-muted">Asigna solo las especialidades que el alcance contratado necesita. Alcance actual: ${reg.servicios.join(', ') || 'sin definir'}${sugerido ? ' · sugerencia demo: ' + sugerido + ' especialidades' : ''}.</p>
  <div class="v-grid" style="margin-top:14px">${specialties.map(s => `<label class="v-check v-panel"><input type="checkbox" data-onb-equipo="${s}" ${reg.equipo.includes(s) ? 'checked' : ''}${soloLectura ? ' disabled' : ''}> <span>${s}</span></label>`).join('')}</div>
  <div class="v-grid" style="margin-top:14px">${onbCampo(reg, { id: 'pm', label: 'Project Manager responsable', req: true }, soloLectura)}<div class="v-field${reg.responsableCalidad ? '' : ' v-field-pending'}"><label><span>Responsable de calidad <span class="v-mono v-muted">obligatorio</span></span><input type="text" data-onb-calidad value="${escapeText(reg.responsableCalidad)}"${soloLectura ? ' disabled' : ''}></label></div></div>
  <div class="v-notice">Capacidad estimada: ${reg.equipo.length} especialidades ocupan 1 plaza de cartera y unas ${Math.max(1, Math.round(reg.equipo.length * 0.5))} h de revisión humana al ciclo. Estimación de demostración.</div>
  <p class="v-small v-muted">Dependencias: auditoría antes de estrategia; estrategia antes de ejecución; control de calidad antes de cualquier entrega.</p>`;
}

function onbPasoRevision(reg) {
  const reqs = onbRequisitos(reg);
  const faltan = onbPendientes(reg);
  const puede = onbPuedeActivar(reg);
  return `<p class="v-small v-muted">Resumen editable y comprobación de requisitos antes de que el Project Manager autorice el diagnóstico.</p>
  <div class="v-panel" style="margin-top:14px"><h3>Resumen</h3><dl class="v-kv">
    <div><dt>CLIENTE</dt><dd>${escapeText(reg.data.nombre || 'Sin nombre')} · ${escapeText(reg.data.dominio || 'sin dominio')}</dd></div>
    <div><dt>SERVICIO</dt><dd>${reg.servicios.join(', ') || 'Sin definir'}</dd></div>
    <div><dt>EQUIPO</dt><dd>${reg.equipo.length} especialidades · calidad: ${escapeText(reg.responsableCalidad || 'sin asignar')}</dd></div>
    <div><dt>ACCESOS VALIDADOS</dt><dd>${ONB_ACCESOS.filter(a => reg.accesos[a.id] === 'Validado').length} de ${ONB_ACCESOS.length}</dd></div>
    <div><dt>SITUACIÓN INICIAL</dt><dd>${escapeText(reg.data.base || 'Sin declarar')}</dd></div>
    <div><dt>ESTADO</dt><dd>${reg.estado}</dd></div>
  </dl><p class="v-small v-muted">Para corregir cualquier dato, vuelve al paso correspondiente: nada se pierde al retroceder.</p></div>
  <div class="v-panel" style="margin-top:14px"><h3>Checklist de requisitos</h3>${reqs.map(r => {
    const exc = reg.excepciones.find(e => e.req === r.id);
    return `<div class="v-row"><div>${tag(r.ok ? 'Cumplido' : exc ? 'Excepción registrada' : 'Pendiente', r.ok ? 'good' : exc ? 'warn' : 'bad')}<strong>${r.label}</strong><p>${r.detalle}${r.dispensable ? ' · requisito dispensable' : ' · requisito indispensable'}</p>${exc ? `<p class="v-small">Excepción del PM: ${escapeText(exc.motivo)} · ${exc.fecha}</p>` : ''}</div>${!r.ok && r.dispensable && !exc ? `<button data-onb-except="${r.id}">Registrar excepción</button>` : '<span class="v-mono v-muted">' + (r.ok ? '✓' : r.dispensable ? '—' : 'Sin excepción posible') + '</span>'}</div>`;
  }).join('')}
  <p class="v-small v-muted">Las excepciones solo se admiten en requisitos dispensables y quedan registradas con su motivo. Nunca sustituyen una autorización.</p></div>
  ${faltan.length ? `<div class="v-panel" style="margin-top:14px"><h3>Campos pendientes (${faltan.length})</h3>${faltan.slice(0, 8).map(f => `<div class="v-row"><div><strong>${f.label}</strong><p>Paso ${f.paso.letra} · ${f.paso.titulo}</p></div><button data-onb-step="${ONB_PASOS.indexOf(f.paso)}">Ir al paso</button></div>`).join('')}</div>` : ''}
  <div class="v-flex" style="margin-top:18px">
    <button class="v-primary" data-onb-activate ${puede ? '' : 'disabled'}>Aprobar y activar el diagnóstico</button>
    <button data-onb-save>Guardar borrador y salir</button>
  </div>
  <p class="v-small v-muted">${puede ? 'Activar registra la aprobación del PM e inicia el diagnóstico en la demostración; no ejecuta trabajo real ni envía nada al cliente.' : 'No se puede activar el servicio mientras falte un requisito indispensable.'}</p>`;
}

function onbAsistente() {
  const reg = onbRegistros.find(r => r.id === onbActual);
  if (!reg) return onbSeccion();
  const soloLectura = reg.estado === 'Activo';
  const pasos = onbVistaCliente ? ONB_PASOS.filter(p => p.cliente) : ONB_PASOS;
  if (onbPaso >= pasos.length) onbPaso = pasos.length - 1;
  const p = pasos[onbPaso];
  const faltan = onbPendientes(reg);
  const cuerpo = p.especial === 'accesos' ? onbPasoAccesos(reg, soloLectura)
    : p.especial === 'autonomia' ? onbPasoAutonomia(reg, soloLectura)
      : p.especial === 'equipo' ? onbPasoEquipo(reg, soloLectura)
        : p.especial === 'revision' ? onbPasoRevision(reg)
          : `<div class="v-grid">${p.campos.map(f => onbCampo(reg, f, soloLectura)).join('')}</div>`;
  return `<button class="v-back" data-go="Onboarding">← Onboarding</button>`
    + heading(onbVistaCliente ? 'COMPLETAR INFORMACIÓN / ' + reg.id : 'ASISTENTE / ' + reg.id,
      escapeText(reg.data.nombre || 'Nuevo cliente'),
      onbVistaCliente ? 'Vista simulada del cliente: solo los datos que aporta su equipo.' : 'Paso ' + p.letra + ' de H · ' + faltan.length + ' campos obligatorios pendientes',
      tag(reg.estado, reg.estado === 'Activo' ? 'good' : 'warn'))
    + `<div class="v-steps" role="list" aria-label="Pasos del onboarding">${pasos.map((s, i) => `<button role="listitem" data-onb-step="${ONB_PASOS.indexOf(s)}" aria-current="${i === onbPaso ? 'step' : 'false'}"><span class="v-mono">${s.letra}</span> <span>${s.titulo}</span></button>`).join('')}</div>
    <section class="v-section v-panel"><div class="v-section-head"><h2>${p.letra}. ${p.titulo}</h2>${onbVistaCliente ? tag('Vista del cliente', 'dark') : tag('Acción interna', 'dark')}</div>${cuerpo}</section>
    ${p.especial === 'revision' ? '' : `<div class="v-flex" style="margin-top:18px"><button data-onb-nav="-1" ${onbPaso === 0 ? 'disabled' : ''}>← Paso anterior</button><button class="v-primary" data-onb-nav="1" ${onbPaso === pasos.length - 1 ? 'disabled' : ''}>Paso siguiente →</button><button data-onb-save>Guardar borrador y salir</button></div>`}
    <p class="v-small v-muted" style="margin-top:12px">${onbVistaCliente ? 'Simulación de la experiencia del cliente. No existe autenticación real ni envío de datos.' : 'Puedes salir y continuar más tarde: el borrador conserva todo lo escrito.'} ${soloLectura ? 'Este onboarding ya está activo: los campos se muestran solo para consulta.' : ''}</p>`;
}

function onbSeccion() {
  const borradores = onbRegistros.filter(r => r.estado === 'Borrador');
  const activos = onbRegistros.filter(r => r.estado === 'Activo');
  const fila = r => {
    const faltan = onbPendientes(r).length;
    const total = ONB_PASOS.reduce((n, p) => n + (p.campos || []).filter(f => f.req).length, 0) + 2;
    const hechos = Math.max(0, total - faltan);
    return `<div class="v-row"><div><div class="v-flex">${tag(r.estado, r.estado === 'Activo' ? 'good' : 'warn')}<span class="v-mono v-muted">${r.id} · ${r.creado}</span></div><strong>${escapeText(r.data.nombre || 'Sin nombre')}</strong><p>${r.servicios.join(', ') || 'Servicio sin definir'} · ${faltan ? faltan + ' campos pendientes' : 'información completa'}</p>${meter(Math.round(hechos / total * 100), 'Avance del onboarding de ' + (r.data.nombre || r.id))}</div><div class="v-flex"><button data-onb-open="${r.id}">${r.estado === 'Activo' ? 'Consultar' : 'Continuar'}</button><button data-onb-clientview="${r.id}">Vista del cliente</button></div></div>`;
  };
  return heading('ALTA DE CLIENTES', 'Onboarding', 'Sin información validada no empieza el trabajo. El asistente guía los ocho pasos y el PM autoriza la activación.',
    `<button class="v-primary" data-onb-new>+ Nuevo cliente</button>`)
    + `<div class="v-stats"><div class="v-stat"><span class="v-small v-muted">Borradores en curso</span><div class="v-number">${borradores.length}</div><span class="v-small">Esperan información o autorización</span></div>
    <div class="v-stat"><span class="v-small v-muted">Onboardings activos</span><div class="v-number">${activos.length}</div><span class="v-small">Diagnóstico autorizado por el PM</span></div>
    <div class="v-stat"><span class="v-small v-muted">Accesos pendientes</span><div class="v-number">${onbRegistros.reduce((n, r) => n + ONB_ACCESOS.filter(a => r.accesos[a.id] === 'Pendiente').length, 0)}</div><span class="v-small">Solicitados y sin validar</span></div>
    <div class="v-stat"><span class="v-small v-muted">Excepciones registradas</span><div class="v-number">${onbRegistros.reduce((n, r) => n + r.excepciones.length, 0)}</div><span class="v-small">Solo requisitos dispensables</span></div></div>
    <section class="v-section"><div class="v-section-head"><h2>Borradores y altas en curso</h2><span class="v-mono">${borradores.length} ABIERTOS</span></div><div class="v-panel">${borradores.map(fila).join('') || '<p>No hay borradores abiertos.</p>'}</div></section>
    <section class="v-section"><div class="v-section-head"><h2>Onboardings activos</h2><span class="v-mono">CONSULTA</span></div><div class="v-panel">${activos.slice(0, 4).map(fila).join('') || '<p>Aún no hay onboardings activos.</p>'}</div></section>
    <div class="v-notice"><strong>«Nuevo cliente» es una acción interna.</strong><p class="v-small">«Vista del cliente» simula el formulario que completaría su equipo: solo empresa, negocio, contexto y accesos. Ninguna de las dos vistas usa autenticación real.</p></div>`;
}

/* ---------- Ficha de cliente ---------- */

const CLIENT_TABS = ['Resumen', 'Servicio', 'Onboarding', 'Objetivos', 'Accesos', 'Equipo', 'Plan', 'Entregables', 'Resultados', 'Decisiones', 'Historial'];
let clientActual = null;

function planCliente(c) {
  return [
    { obj: 'Recuperar indexación de categorías', accion: 'Corregir 24 redirecciones', entregable: 'Mapa de redirecciones', agente: 'SEO técnico', dep: 'Auditoría técnica', esfuerzo: '6 h · coste demo 180 €', fecha: '22 sep', criterio: '0 cadenas y 0 bucles; destinos HTTP 200', aprob: 'Autorización del PM' },
    { obj: 'Ampliar cobertura informativa', accion: 'Actualizar 6 contenidos', entregable: 'Borradores con fuentes', agente: 'Contenidos', dep: 'Estrategia aprobada', esfuerzo: '12 h · coste demo 420 €', fecha: '26 sep', criterio: 'Fuentes citadas y tono de marca', aprob: 'Aprobación del cliente' },
    { obj: 'Aparecer en respuestas de IA', accion: 'Plan de citabilidad', entregable: 'Ficha de fuentes y datos', agente: 'AEO/GEO y citabilidad', dep: 'Contenidos actualizados', esfuerzo: '8 h · coste demo 260 €', fecha: '30 sep', criterio: 'Afirmaciones con fuente verificable', aprob: 'Autorización del PM' }
  ];
}

function tabResumen(c, reg) {
  return `<div class="v-grid"><div class="v-panel"><h2>Objetivo y próximo resultado</h2><p>${escapeText(reg.data.objetivos || 'Objetivo pendiente de definir en el onboarding.')}</p><dl class="v-kv"><div><dt>PLAN ACTIVO</dt><dd>Auditoría → estrategia → ejecución → QA</dd></div><div><dt>PRÓXIMO ENTREGABLE</dt><dd>${c.state === 'Onboarding' ? 'Diagnóstico inicial · 22 sep' : 'Informe de oportunidades · 21 sep'}</dd></div><div><dt>RESPONSABLE HUMANO</dt><dd>${escapeText(reg.data.pm || 'Project Manager')}</dd></div><div><dt>PROGRESO DEL CICLO</dt><dd>${c.progress}%</dd></div></dl>${meter(c.progress, 'Progreso del ciclo')}</div>
  <div class="v-panel"><h2>Estado de gobierno</h2>${tag(reg.estado === 'Activo' ? 'Onboarding activo' : 'Onboarding incompleto', reg.estado === 'Activo' ? 'good' : 'warn')}<p class="v-small v-muted">${onbPendientes(reg).length} campos obligatorios pendientes · ${ONB_ACCESOS.filter(a => reg.accesos[a.id] === 'Validado').length} accesos validados</p><p style="margin-top:12px">Acciones sensibles bajo autorización humana: publicar, enviar comunicaciones, cambiar presupuesto, modificar permisos y eliminar información.</p><button data-onb-open="${reg.id}" style="margin-top:14px">Abrir onboarding →</button></div></div>`;
}

function tabServicio(c, reg) {
  return `<div class="v-panel"><h2>Servicio contratado</h2><dl class="v-kv">
  <div><dt>SERVICIOS</dt><dd>${reg.servicios.join(', ') || 'Sin definir'}</dd></div>
  <div><dt>ENTREGABLES Y FRECUENCIA</dt><dd>${escapeText(reg.data.entregables || 'Pendiente')}</dd></div>
  <div><dt>EXCLUSIONES</dt><dd>${escapeText(reg.data.exclusiones || 'Pendiente')}</dd></div>
  <div><dt>LÍMITES DE CONSUMO</dt><dd>${escapeText(reg.data.limites || 'Pendiente')}</dd></div>
  <div><dt>INICIO</dt><dd>${escapeText(reg.data.inicio || 'Pendiente')}</dd></div>
  <div><dt>REVISIÓN DEL SERVICIO</dt><dd>${escapeText(reg.data.revision || 'Pendiente')}</dd></div></dl>
  <div class="v-notice">Cambiar el alcance o el presupuesto exige una nueva aprobación; la anterior no la cubre.</div></div>`;
}

function tabOnboarding(c, reg) {
  const reqs = onbRequisitos(reg);
  return `<div class="v-panel"><div class="v-section-head"><h2>Onboarding ${reg.id}</h2>${tag(reg.estado, reg.estado === 'Activo' ? 'good' : 'warn')}</div>
  ${reqs.map(r => `<div class="v-row"><div>${tag(r.ok ? 'Cumplido' : 'Pendiente', r.ok ? 'good' : 'bad')}<strong>${r.label}</strong><p>${r.detalle}</p></div></div>`).join('')}
  <div class="v-flex" style="margin-top:16px"><button class="v-primary" data-onb-open="${reg.id}">${reg.estado === 'Activo' ? 'Consultar asistente' : 'Continuar el asistente'}</button><button data-onb-clientview="${reg.id}">Vista del cliente</button></div></div>`;
}

function tabObjetivos(c, reg) {
  return `<div class="v-grid"><div class="v-panel"><h2>Negocio y objetivos</h2><dl class="v-kv">
  <div><dt>PRIORIDADES</dt><dd>${escapeText(reg.data.prioritarios || 'Pendiente')}</dd></div>
  <div><dt>PÚBLICO Y MERCADOS</dt><dd>${escapeText(reg.data.publico || 'Pendiente')}</dd></div>
  <div><dt>COMPETIDORES</dt><dd>${escapeText(reg.data.competidores || 'Pendiente')}</dd></div>
  <div><dt>INDICADORES</dt><dd>${escapeText(reg.data.indicadores || 'Pendiente')}</dd></div>
  <div><dt>SITUACIÓN INICIAL</dt><dd>${escapeText(reg.data.base || 'Pendiente de medir')}</dd></div></dl>
  <p class="v-small v-muted">No se prometen posiciones ni resultados garantizados.</p></div>
  <div class="v-panel"><h2>Marca y restricciones</h2><p>${escapeText(reg.data.marca || 'Pendiente')}</p><p class="v-small v-muted" style="margin-top:10px">Restricciones: ${escapeText(reg.data.restricciones || 'Pendiente')}</p><p class="v-small v-muted">Fuentes autorizadas: ${escapeText(reg.data.fuentes || 'Pendiente')}</p></div></div>`;
}

function tabAccesos(c, reg) {
  return `<div class="v-panel"><h2>Accesos e integraciones</h2>${ONB_ACCESOS.map(a => `<div class="v-row"><div>${tag(reg.accesos[a.id], reg.accesos[a.id] === 'Validado' ? 'good' : reg.accesos[a.id] === 'Insuficiente' || reg.accesos[a.id] === 'Caducado' ? 'bad' : 'warn')}<strong>${a.nombre}</strong><p>${a.finalidad} · permiso mínimo: ${a.permiso} · responsable: cliente</p></div></div>`).join('')}
  <div class="v-notice">Conexiones simuladas. No se piden ni se guardan contraseñas, tokens ni claves.</div></div>`;
}

function tabEquipo(c, reg) {
  return `<section><div class="v-section-head"><h2>Equipo de agentes asignado</h2><span class="v-mono">${reg.equipo.length} DE 8 ESPECIALIDADES</span></div><div class="v-grid">${specialties.map((s, i) => {
    const asignado = reg.equipo.includes(s);
    return `<div class="v-panel"><h3>${s}</h3>${tag(asignado ? (i === 0 && c.state === 'Bloqueado' ? 'Bloqueo' : i === 3 ? 'Agente trabajando' : i === 7 ? 'Revisión humana en curso' : 'Funcionamiento normal') : 'Fuera del alcance contratado', !asignado ? 'dark' : i === 0 && c.state === 'Bloqueado' ? 'bad' : i === 7 ? 'warn' : 'dark')}<p class="v-small v-muted">${c.pod} / AG-${i + 1} · ${asignado ? 'Contexto exclusivo de este cliente' : 'Sin asignar'}</p>${asignado ? `<button data-agent="${i}" style="margin-top:10px">Ver agente</button>` : ''}</div>`;
  }).join('')}</div>
  <div class="v-panel" style="margin-top:14px"><h3>Responsables humanos</h3><p>Project Manager: ${escapeText(reg.data.pm || 'Sin asignar')}</p><p>Calidad: ${escapeText(reg.responsableCalidad || 'Sin asignar')}</p><p class="v-small v-muted">Los agentes trabajan con permisos limitados a esta cuenta; los reintentos están acotados y escalan al PM.</p></div></section>`;
}

function tabPlan(c) {
  return `<div class="v-panel"><div class="v-section-head"><h2>Plan priorizado del ciclo</h2>${tag('Requiere revisión del PM', 'warn')}</div>${planCliente(c).map(p => `<div class="v-row"><div><strong>${p.accion}</strong><p>${p.obj}</p><dl class="v-kv"><div><dt>ENTREGABLE</dt><dd>${p.entregable}</dd></div><div><dt>AGENTE</dt><dd>${p.agente}</dd></div><div><dt>DEPENDENCIA</dt><dd>${p.dep}</dd></div><div><dt>ESFUERZO Y COSTE</dt><dd>${p.esfuerzo}</dd></div><div><dt>FECHA PREVISTA</dt><dd>${p.fecha}</dd></div><div><dt>CRITERIO DE ACEPTACIÓN</dt><dd>${p.criterio}</dd></div><div><dt>APROBACIÓN</dt><dd>${p.aprob}</dd></div></dl></div></div>`).join('')}
  <div class="v-notice">El PM revisa el plan antes de activar el ciclo. Un cambio de alcance o presupuesto abre una aprobación nueva.</div></div>`;
}

function tabEntregables(c) {
  return `<div class="v-panel"><h2>Entregables del ciclo</h2>${[['Informe mensual de resultados', 'Validado', '21 sep'], ['Mapa de redirecciones', 'Aprobación pendiente', '22 sep'], ['Plan de citabilidad', 'En preparación', '30 sep']].map(r => `<div class="v-row"><div>${tag(r[1], tone(r[1]))}<strong>${r[0]}</strong><p>${c.name} · ${r[2]}</p></div><button data-go="Informes">Ver en Informes</button></div>`).join('')}<p class="v-small v-muted" style="margin-top:12px">Aprobar el contenido y autorizar el envío son decisiones separadas.</p></div>`;
}

function tabResultados(c, reg) {
  const sinBase = c.state === 'Onboarding' || reg.data.base === 'Pendiente de medir';
  return `<div class="v-grid"><div class="v-panel"><h2>Resultados observados</h2>${sinBase ? '<p>Sin datos · pendiente de conexión y de línea base.</p>' : '<p>18.420 clics · +9,2% en 28 días</p><p>42 contactos cualificados · +6 frente al periodo anterior</p>'}<p class="v-small v-muted">${sinBase ? 'No mostramos estimaciones cuando falta la medición.' : 'Comparación entre dos periodos de 28 días. Datos ficticios; no se atribuye causalidad.'}</p></div>
  <div class="v-panel"><h2>Limitaciones y datos ausentes</h2><p class="v-small">${ONB_ACCESOS.filter(a => reg.accesos[a.id] !== 'Validado').map(a => a.nombre + ': ' + reg.accesos[a.id]).join(' · ') || 'Todos los accesos del alcance están validados.'}</p><p class="v-small v-muted" style="margin-top:10px">Cada dato ausente se declara en el informe antes de la entrega.</p></div></div>`;
}

function tabDecisiones(c, reg) {
  const propios = queue.filter(q => q.client.id === c.id);
  return `<div class="v-panel"><h2>Decisiones y aprobaciones</h2>${propios.length ? propios.map(q => `<div class="v-row"><div>${tag(q.status, tone(q.status))}<strong>${q.title}</strong><p>${q.agent} · ${q.timestamp}</p></div><button data-review="${q.id}">Abrir expediente</button></div>`).join('') : '<p>Sin decisiones abiertas para este cliente.</p>'}
  ${reg.excepciones.length ? `<div class="v-notice">Excepciones del PM: ${reg.excepciones.map(e => escapeText(e.motivo)).join(' · ')}</div>` : ''}
  <p class="v-small v-muted" style="margin-top:12px">Si cambia el entregable, la aprobación anterior no autoriza la nueva versión.</p></div>`;
}

function tabHistorial(c, reg) {
  return `<div class="v-panel"><h2>Historial del cliente</h2>${reg.historial.concat([
    '14 sep 2026 · 09:00 · Inicio del ciclo 38.',
    '17 sep 2026 · 21:00 · Última lectura correcta de accesos.',
    '18 sep 2026 · 09:42 · Corte de datos de esta demostración.'
  ]).map(h => `<p class="v-small">${h}</p>`).join('')}
  <details><summary>Renovación, pausa y salida</summary><p class="v-small">Revisión del servicio: ${escapeText(reg.data.revision || 'pendiente')}. Una pausa detiene los trabajos nuevos y obliga a decidir qué ocurre con los que están en curso. La salida contempla entrega de documentación, trabajos pendientes, retirada de accesos y conservación o eliminación de datos según la política aprobada. Nada se elimina automáticamente.</p></details></div>`;
}

function clientFile(c) {
  clientActual = c.id;
  const reg = onbDeCliente(c);
  const tabs = { Resumen: tabResumen, Servicio: tabServicio, Onboarding: tabOnboarding, Objetivos: tabObjetivos, Accesos: tabAccesos, Equipo: tabEquipo, Plan: tabPlan, Entregables: tabEntregables, Resultados: tabResultados, Decisiones: tabDecisiones, Historial: tabHistorial };
  if (!tabs[clientTab]) clientTab = 'Resumen';
  return `<button class="v-back" data-go="Clientes">← Cartera</button>`
    + heading(c.pod, c.name, c.service, tag(c.state, tone(c.state)))
    + `<div class="v-tabs" role="tablist" aria-label="Secciones de la ficha">${CLIENT_TABS.map(t => `<button role="tab" data-ctab="${t}" aria-selected="${t === clientTab}">${t}</button>`).join('')}</div>
    <section class="v-section" id="v-ctab-panel">${tabs[clientTab](c, reg)}</section>`;
}

/* ---------- Eventos ---------- */

function onbRender(vista) {
  page.innerHTML = vista;
  decorate();
  focusHeading();
}

root.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  const d = b.dataset;
  if (d.onbNew !== undefined) {
    const reg = onbNuevo('');
    onbActual = reg.id; onbPaso = 0; onbVistaCliente = false;
    onbRender(onbAsistente());
    announce('Asistente de onboarding abierto. Borrador ' + reg.id + '.');
  } else if (d.onbOpen) {
    onbActual = d.onbOpen; onbPaso = 0; onbVistaCliente = false;
    onbRender(onbAsistente());
    announce('Onboarding ' + d.onbOpen + ' abierto.');
  } else if (d.onbClientview) {
    onbActual = d.onbClientview; onbPaso = 0; onbVistaCliente = true;
    onbRender(onbAsistente());
    announce('Vista simulada del cliente.');
  } else if (d.onbStep !== undefined) {
    const objetivo = ONB_PASOS[Number(d.onbStep)];
    const pasos = onbVistaCliente ? ONB_PASOS.filter(p => p.cliente) : ONB_PASOS;
    const i = pasos.indexOf(objetivo);
    if (i >= 0) onbPaso = i;
    onbRender(onbAsistente());
  } else if (d.onbNav) {
    onbPaso += Number(d.onbNav);
    onbRender(onbAsistente());
  } else if (d.onbSave !== undefined) {
    render('Onboarding');
    announce('Borrador guardado. Puedes continuar cuando quieras.');
  } else if (d.onbExcept) {
    const reg = onbRegistros.find(r => r.id === onbActual);
    const motivo = (root.querySelector('#v-onb-motivo') && root.querySelector('#v-onb-motivo').value) || 'Requisito dispensable; el PM asume el riesgo y lo revisará en el primer ciclo.';
    reg.excepciones.push({ req: d.onbExcept, motivo, fecha: '18 sep 2026 · Project Manager' });
    reg.historial.push('18 sep 2026 · Excepción registrada por el PM: ' + motivo);
    onbRender(onbAsistente());
    announce('Excepción registrada con su motivo. No sustituye ninguna autorización.');
  } else if (d.onbActivate !== undefined) {
    const reg = onbRegistros.find(r => r.id === onbActual);
    if (!onbPuedeActivar(reg)) return;
    reg.estado = 'Activo';
    reg.activadoEn = '18 sep 2026 · 09:42';
    reg.historial.push('18 sep 2026 · 09:42 · Activación aprobada por el Project Manager (simulada).');
    onbRender(onbAsistente());
    announce('Onboarding activado en la demostración: el diagnóstico queda autorizado, sin ejecutar trabajo real.');
  } else if (d.ctab) {
    clientTab = d.ctab;
    onbRender(clientFile(clients[clientActual - 1]));
    announce('Ficha del cliente · ' + clientTab + '.');
  }
});

root.addEventListener('input', e => {
  const t = e.target, reg = onbRegistros.find(r => r.id === onbActual);
  if (!reg) return;
  if (t.dataset.onbField) reg.data[t.dataset.onbField] = t.value;
  else if (t.dataset.onbCalidad !== undefined) reg.responsableCalidad = t.value;
});

root.addEventListener('change', e => {
  const t = e.target, reg = onbRegistros.find(r => r.id === onbActual);
  if (!reg) return;
  if (t.dataset.onbAcceso) reg.accesos[t.dataset.onbAcceso] = t.value;
  else if (t.dataset.onbAuton) reg.autonomia[t.dataset.onbAuton] = t.value;
  else if (t.dataset.onbServicio) {
    const s = t.dataset.onbServicio;
    reg.servicios = t.checked ? reg.servicios.concat([s]) : reg.servicios.filter(x => x !== s);
  } else if (t.dataset.onbEquipo) {
    const s = t.dataset.onbEquipo;
    reg.equipo = t.checked ? reg.equipo.concat([s]) : reg.equipo.filter(x => x !== s);
  } else return;
  if (t.dataset.onbAcceso || t.dataset.onbServicio || t.dataset.onbEquipo) onbRender(onbAsistente());
});

/* Semilla de demostración: los clientes en onboarding ya tienen borrador abierto. */
clients.filter(c => c.state === 'Onboarding').forEach(onbDeCliente);
clients.slice(0, 3).forEach(onbDeCliente);
