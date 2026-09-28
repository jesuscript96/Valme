const SEO_AUDIT_STORAGE = "valme-demo-seo-audits-v1";
const SEO_AUDIT_STATES = [
  "borrador",
  "pendiente_autorizacion",
  "autorizado",
  "en_cola",
  "en_ejecucion",
  "bloqueado",
  "control_calidad",
  "devuelto",
  "validado",
  "cancelado",
];
const SEO_AUDIT_LABELS = {
  borrador: "Borrador",
  pendiente_autorizacion: "Pendiente de autorización",
  autorizado: "Autorizado",
  en_cola: "En cola",
  en_ejecucion: "En ejecución",
  bloqueado: "Bloqueado",
  control_calidad: "Control de calidad",
  devuelto: "Devuelto",
  validado: "Validado",
  cancelado: "Cancelado",
};
const SEO_AUDIT_NEXT = {
  borrador: ["pendiente_autorizacion", "cancelado"],
  pendiente_autorizacion: ["autorizado", "devuelto", "cancelado"],
  autorizado: ["en_cola", "en_ejecucion", "bloqueado", "cancelado"],
  en_cola: ["en_ejecucion", "bloqueado", "cancelado"],
  en_ejecucion: ["bloqueado", "control_calidad", "cancelado"],
  bloqueado: ["en_ejecucion", "devuelto", "cancelado"],
  control_calidad: ["devuelto", "validado", "cancelado"],
  devuelto: ["borrador", "pendiente_autorizacion", "cancelado"],
  validado: [],
  cancelado: [],
};
const SEO_AUDIT_ACTIONS = {
  borrador: { next: "pendiente_autorizacion", label: "Solicitar autorización" },
  pendiente_autorizacion: { next: "autorizado", label: "Autorizar alcance" },
  autorizado: { next: "en_cola", label: "Añadir a la cola" },
  en_cola: { next: "en_ejecucion", label: "Iniciar auditoría" },
  en_ejecucion: { next: "control_calidad", label: "Enviar a calidad" },
  bloqueado: { next: "en_ejecucion", label: "Reanudar trabajo" },
  control_calidad: { next: "validado", label: "Validar auditoría" },
  devuelto: { next: "pendiente_autorizacion", label: "Solicitar reautorización" },
};

const SEO_AUDIT_SEED = [
  {
    id: "AUD-2026-001",
    client: "Nébula Hogar",
    project: "Web principal",
    domain: "www.nebulahogar.example",
    state: "pendiente_autorizacion",
    services: ["SEO técnico", "AEO/GEO"],
    capabilities: ["Crawling", "Indexación", "Schema.org", "Citabilidad"],
    markets: ["España"],
    languages: ["es"],
    requestedBy: "Project Manager",
    createdAt: "24 sep 2026 · 10:15",
    limits: { pages: 500, minutes: 45, cost: "0 EUR" },
    scope: "Dominio principal, blog y categorías públicas. Solo lectura.",
    accesses: [
      { name: "Search Console", state: "validado" },
      { name: "GA4", state: "pendiente" },
    ],
    evidence: [
      {
        id: "EV-001",
        source: "Sitemap declarado",
        resource: "/sitemap.xml",
        method: "Artefacto aportado",
        observed: "486 URL declaradas",
        trusted: false,
      },
      {
        id: "EV-002",
        source: "Muestra HTML",
        resource: "/categoria/iluminacion",
        method: "Archivo aportado",
        observed: "Canonical autorreferente",
        trusted: false,
      },
    ],
    findings: [
      {
        id: "HAL-001",
        priority: "Alta",
        title: "Cobertura parcial del sitemap",
        category: "Indexación",
        confidence: "Alta",
        status: "abierto",
      },
      {
        id: "HAL-002",
        priority: "Media",
        title: "Datos estructurados incompletos",
        category: "Schema.org",
        confidence: "Media",
        status: "abierto",
      },
    ],
    coverage: [
      {
        service: "SEO técnico",
        state: "cobertura_parcial",
        reason: "Muestra limitada a artefactos aportados",
      },
      {
        service: "AEO/GEO",
        state: "pendiente_justificado",
        reason: "Pendiente de autorización del alcance",
      },
    ],
    events: [
      "24 sep 2026 · 10:15 · Borrador creado por Project Manager",
      "24 sep 2026 · 10:28 · Enviado a autorización",
    ],
  },
  {
    id: "AUD-2026-002",
    client: "Tuilus",
    project: "Sitio corporativo",
    domain: "www.tuilus.example",
    state: "borrador",
    services: ["SEO técnico"],
    capabilities: ["Robots.txt", "Sitemap", "Canonical"],
    markets: ["España"],
    languages: ["es"],
    requestedBy: "Project Manager",
    createdAt: "24 sep 2026 · 11:05",
    limits: { pages: 250, minutes: 30, cost: "0 EUR" },
    scope: "Dominio principal y recursos públicos aportados por el cliente.",
    accesses: [{ name: "Search Console", state: "pendiente" }],
    evidence: [],
    findings: [],
    coverage: [
      {
        service: "SEO técnico",
        state: "pendiente_justificado",
        reason: "Encargo todavía en borrador",
      },
    ],
    events: ["24 sep 2026 · 11:05 · Borrador creado por Project Manager"],
  },
  {
    id: "AUD-2026-003",
    client: "Nébula Hogar",
    project: "Archivo de catálogo",
    domain: "catalogo.nebulahogar.example",
    state: "control_calidad",
    services: ["SEO técnico", "Contenidos"],
    capabilities: ["Crawling", "Core Web Vitals", "E-E-A-T"],
    markets: ["España", "Portugal"],
    languages: ["es", "pt"],
    requestedBy: "Project Manager",
    createdAt: "22 sep 2026 · 09:30",
    limits: { pages: 1000, minutes: 90, cost: "0 EUR" },
    scope: "Catálogo aportado y mediciones de laboratorio. Sin publicación.",
    accesses: [{ name: "Artefactos del cliente", state: "validado" }],
    evidence: [
      {
        id: "EV-003",
        source: "Exportación de catálogo",
        resource: "catalogo-2026-09.csv",
        method: "Importación local",
        observed: "812 productos y 74 categorías",
        trusted: false,
      },
      {
        id: "EV-004",
        source: "Lighthouse",
        resource: "plantilla-producto.json",
        method: "Resultado aportado",
        observed: "LCP 3,1 s en móvil",
        trusted: false,
      },
    ],
    findings: [
      {
        id: "HAL-003",
        priority: "Alta",
        title: "LCP supera el objetivo en móvil",
        category: "Rendimiento",
        confidence: "Alta",
        status: "abierto",
      },
      {
        id: "HAL-004",
        priority: "Media",
        title: "Autoría no declarada en guías",
        category: "E-E-A-T",
        confidence: "Media",
        status: "abierto",
      },
    ],
    coverage: [
      {
        service: "SEO técnico",
        state: "evidencia_suficiente",
        reason: "Muestra y mediciones documentadas",
      },
      {
        service: "Contenidos",
        state: "cobertura_parcial",
        reason: "Falta validar autoría con el cliente",
      },
    ],
    events: [
      "22 sep 2026 · 09:30 · Borrador creado",
      "22 sep 2026 · 10:00 · Alcance autorizado por Project Manager",
      "23 sep 2026 · 08:45 · Auditoría iniciada",
      "24 sep 2026 · 09:10 · Enviada a control de calidad",
    ],
  },
];

let seoAuditRepository = ValmeSeoAuditRepository.create({
  mode: ValmeSeoAuditRepository.LOCAL_MODE,
  key: SEO_AUDIT_STORAGE,
  seed: SEO_AUDIT_SEED,
  storageFactory: () => window.localStorage,
});
let seoAudits = seoAuditClone(SEO_AUDIT_SEED);
let seoAuditCurrent = null;
let seoAuditTab = "Resumen";
let seoAuditQuery = "";
let seoAuditStateFilter = "Todos";
let seoAuditClientFilter = "Todos";
let seoAuditCreating = false;
let seoAuditShowArchived = false;
let seoAuditPresetProject = null;
// Formulario abierto de nueva tarea ({ findingId, kind }) y de cierre (id de la tarea).
let seoAuditActionForm = null;
let seoAuditCloseForm = null;
let seoAuditStorageOk = seoAuditRepository.status().writable;
let seoAuditRepositoryLoading = true;

async function seoAuditLoadRepository(message) {
  const activeRepository = seoAuditRepository;
  seoAuditRepositoryLoading = true;
  try {
    const records = await activeRepository.load();
    if (activeRepository !== seoAuditRepository) return;
    seoAudits = records;
    seoAuditRepositoryLoading = false;
    seoAuditStorageOk = seoAuditRepository.status().writable;
    if (current === "Auditorías") seoAuditRender(message);
    else if (current === "Clientes" && seoAuditIsRemote()) render("Clientes", false);
  } catch {
    if (activeRepository !== seoAuditRepository) return;
    seoAuditRepositoryLoading = false;
    seoAuditStorageOk = false;
    if (current === "Auditorías") {
      seoAuditRender("No se pudo cargar la persistencia remota. No se muestran datos locales.");
    }
  }
}

seoAuditLoadRepository("Persistencia local preparada.");

window.addEventListener("message", (event) => {
  const config = event.data;
  if (
    event.origin !==
      (window.origin && window.origin !== "null" ? window.origin : window.location.origin) ||
    event.source !== window.parent ||
    !config ||
    config.channel !== "valme:seo-audit:v1" ||
    config.kind !== "config" ||
    config.mode !== ValmeSeoAuditRepository.REMOTE_MODE ||
    seoAuditRepository.status().mode === ValmeSeoAuditRepository.REMOTE_MODE
  )
    return;

  seoAuditRepository = ValmeSeoAuditRepository.create({
    mode: ValmeSeoAuditRepository.REMOTE_MODE,
    seed: [],
    transport: ValmeSeoAuditRepository.createParentTransport(),
  });
  seoAudits = [];
  seoAuditCurrent = null;
  seoAuditMarkEnvironment();
  seoAuditLoadRepository("Persistencia remota preparada.");
});

// En modo real, Clientes y Auditorías usan datos de staging; el resto sigue siendo demostración.
function seoAuditMarkEnvironment() {
  const topTag = root.querySelector(".v-top > .v-tag");
  if (topTag) topTag.textContent = "● Staging · datos reales";
  root.querySelector(".v-top .v-cycle")?.remove();
  const demoLabel = root.querySelector(".v-demo-label");
  if (demoLabel) demoLabel.textContent = "STAGING";
  const footer = root.querySelectorAll(".v-bottom > span");
  if (footer[0]) footer[0].textContent = "Clientes y Auditorías: datos reales de staging";
  if (footer[1]) footer[1].textContent = "Resto de secciones: demostración";
}

function seoAuditIsRemote() {
  return seoAuditRepository.status().mode === ValmeSeoAuditRepository.REMOTE_MODE;
}

function seoAuditIsArchived(a) {
  return Boolean(a.archivedAt || a.clientArchived);
}

// Trabajo diario: lo archivado (o de un cliente archivado) no cuenta ni aparece por defecto.
function seoAuditWorking() {
  return seoAudits.filter((a) => !seoAuditIsArchived(a));
}

function seoAuditClone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function seoAuditPersist() {
  const saved = await seoAuditRepository.save(seoAudits);
  seoAuditStorageOk = seoAuditRepository.status().writable;
  return saved;
}

function seoAuditTone(state) {
  if (["validado", "autorizado"].includes(state)) return "good";
  if (["bloqueado", "cancelado"].includes(state)) return "bad";
  if (["pendiente_autorizacion", "control_calidad", "devuelto"].includes(state)) return "warn";
  return "dark";
}

function seoAuditLabel(state) {
  return SEO_AUDIT_LABELS[state] || state;
}

function seoAuditNow() {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(new Date())
    .replace(",", " ·");
}

function seoAuditFiltered() {
  const q = seoAuditQuery.trim().toLowerCase();
  return seoAudits.filter(
    (a) =>
      (seoAuditShowArchived || !seoAuditIsArchived(a)) &&
      (seoAuditStateFilter === "Todos" || a.state === seoAuditStateFilter) &&
      (seoAuditClientFilter === "Todos" || a.client === seoAuditClientFilter) &&
      (!q ||
        [a.id, a.displayId || "", a.client, a.project, a.domain].some((v) =>
          v.toLowerCase().includes(q),
        )),
  );
}

function seoAuditSummary() {
  const working = seoAuditWorking();
  const active = working.filter((a) =>
    ["en_cola", "en_ejecucion", "bloqueado"].includes(a.state),
  ).length;
  const review = working.filter((a) =>
    ["pendiente_autorizacion", "control_calidad", "devuelto"].includes(a.state),
  ).length;
  const validated = working.filter((a) => a.state === "validado").length;
  const blocked = working.filter((a) => a.state === "bloqueado").length;
  return `<div class="v-stats v-audit-stats">
    <div class="v-stat"><span class="v-small v-muted">Auditorías activas</span><div class="v-number">${active}</div><span class="v-small">Cola, ejecución o bloqueo</span></div>
    <div class="v-stat"><span class="v-small v-muted">Decisión humana</span><div class="v-number">${review}</div><span class="v-small">Autorización o calidad</span></div>
    <div class="v-stat"><span class="v-small v-muted">Validadas</span><div class="v-number">${validated}</div><span class="v-small">Expediente cerrado</span></div>
    <div class="v-stat"><span class="v-small v-muted">Bloqueadas</span><div class="v-number">${blocked}</div><span class="v-small">Requieren intervención</span></div>
  </div>`;
}

function seoAuditRows() {
  const rows = seoAuditFiltered();
  return `<div class="v-audit-list" role="list">${
    rows
      .map((a) => {
        const evidence = a.evidence.length;
        const findings = a.findings.length;
        return `<div class="v-audit-row" role="listitem">
      <div class="v-audit-main"><div class="v-flex">${tag(seoAuditLabel(a.state), seoAuditTone(a.state))}${a.archivedAt ? tag("Archivada") : a.clientArchived ? tag("Cliente archivado") : ""}<span class="v-mono v-muted">${safe(a.displayId || a.id)}</span></div>
        <strong>${safe(a.client)} · ${safe(a.project)}</strong><p>${safe(a.domain)}</p></div>
      <div class="v-audit-metrics"><span><b>${findings}</b> hallazgos</span><span><b>${evidence}</b> evidencias</span><span>${safe(a.services.join(" · "))}</span></div>
      <button data-seo-open="${safe(a.id)}" aria-label="Abrir auditoría ${safe(a.displayId || a.id)}">Abrir →</button>
    </div>`;
      })
      .join("") ||
    '<div class="v-audit-empty"><strong>No hay auditorías con estos filtros.</strong><p>Cambia los filtros o crea un borrador.</p></div>'
  }</div>`;
}

function seoAuditList() {
  const clientsList = [
    "Todos",
    ...new Set(
      seoAudits.filter((a) => seoAuditShowArchived || !seoAuditIsArchived(a)).map((a) => a.client),
    ),
  ];
  const archivedCount = seoAudits.filter(seoAuditIsArchived).length;
  const repositoryStatus = seoAuditRepository.status();
  return (
    heading(
      repositoryStatus.mode === ValmeSeoAuditRepository.REMOTE_MODE
        ? "AUDITORÍA SEO / STAGING"
        : "AUDITORÍA SEO / DEMOSTRACIÓN",
      "Auditorías",
      "Alcance, evidencias y decisiones en un único expediente.",
      '<button class="v-primary" data-seo-new>+ Nueva auditoría</button>',
    ) +
    (repositoryStatus.mode === ValmeSeoAuditRepository.LOCAL_MODE ? ValmePilot.entry() : "") +
    seoAuditSummary() +
    `<section class="v-section"><div class="v-tools v-audit-tools">
      <label class="v-search">Buscar<br><input id="v-seo-search" type="search" value="${safe(seoAuditQuery)}" placeholder="Cliente, dominio o ID"></label>
      <label>Estado<br><select id="v-seo-state">${["Todos", ...SEO_AUDIT_STATES].map((v) => `<option value="${v}" ${v === seoAuditStateFilter ? "selected" : ""}>${v === "Todos" ? "Todos" : seoAuditLabel(v)}</option>`).join("")}</select></label>
      <label>Cliente<br><select id="v-seo-client">${clientsList.map((v) => `<option ${v === seoAuditClientFilter ? "selected" : ""}>${safe(v)}</option>`).join("")}</select></label>
      <label class="v-check v-audit-archived-toggle"><input type="checkbox" id="v-seo-archived" ${seoAuditShowArchived ? "checked" : ""}>Mostrar archivadas (${archivedCount})</label>
      ${repositoryStatus.mode === ValmeSeoAuditRepository.LOCAL_MODE ? '<button data-seo-reset aria-label="Restablecer auditorías de demostración">Restablecer demo</button>' : ""}
    </div>${seoAuditRows()}</section>
    <p class="v-small v-muted v-audit-storage-state">Persistencia: ${safe(repositoryStatus.label)} · esquema ${repositoryStatus.schemaVersion}</p>
    ${seoAuditStorageOk ? "" : '<div class="v-notice v-audit-storage"><strong>La persistencia no está disponible.</strong><p>No se han sustituido los datos remotos por una copia local.</p></div>'}`
  );
}

function seoAuditNew() {
  const remote = seoAuditRepository.status().mode === ValmeSeoAuditRepository.REMOTE_MODE;
  const projects = remote ? seoAuditRepository.projects() : [];
  return (
    `<button class="v-back" data-seo-back>← Auditorías</button>` +
    heading(
      "NUEVO ENCARGO",
      "Crear auditoría",
      "El encargo nace como borrador y no inicia ninguna ejecución.",
      tag("Borrador", "dark"),
    ) +
    `<form id="v-seo-form" class="v-audit-form">
      <section class="v-audit-form-section"><div><span class="v-mono v-muted">01 / CONTEXTO</span><h2>Cliente y proyecto</h2></div><div class="v-audit-fields">
        ${
          remote
            ? `<label class="v-audit-wide">Proyecto asignado<select name="projectId" required>${projects.map((project) => `<option value="${safe(project.id)}" ${project.id === seoAuditPresetProject ? "selected" : ""}>${safe(project.client)} · ${safe(project.project)} · ${safe(project.domain)}</option>`).join("")}</select></label>`
            : '<label>Cliente<select name="client" required><option>Nébula Hogar</option><option>Tuilus</option></select></label><label>Proyecto<input name="project" required maxlength="80" value="Web principal"></label><label class="v-audit-wide">Dominio principal<input name="domain" required maxlength="160" placeholder="www.ejemplo.test"></label>'
        }
      </div></section>
      <section class="v-audit-form-section"><div><span class="v-mono v-muted">02 / ALCANCE</span><h2>Servicios autorizables</h2></div><div class="v-audit-checks">
        ${["SEO técnico", "Contenidos", "AEO/GEO", "Analítica"].map((s, i) => `<label><input type="checkbox" name="services" value="${s}" ${i === 0 ? "checked" : ""}>${s}</label>`).join("")}
      </div><label class="v-audit-wide">Límites y exclusiones<textarea name="scope" required rows="3">Dominio principal y recursos públicos aportados. Solo lectura; sin publicación ni cambios externos.</textarea></label></section>
      <section class="v-audit-form-section"><div><span class="v-mono v-muted">03 / LÍMITES</span><h2>Consumo máximo</h2></div><div class="v-audit-fields">
        <label>Páginas<input name="pages" type="number" min="1" max="10000" value="500" required></label>
        <label>Duración (min)<input name="minutes" type="number" min="1" max="1440" value="45" required></label>
        <label>Coste máximo<input name="cost" type="number" min="0" step="0.01" value="0" required></label>
      </div></section>
      <div class="v-flex"><button class="v-primary" type="submit" ${remote && !projects.length ? "disabled" : ""}>Guardar borrador</button><button type="button" data-seo-back>Cancelar</button></div>
      ${remote && !projects.length ? '<div class="v-notice">No hay proyectos asignados disponibles para crear una auditoría.</div>' : ""}
    </form>`
  );
}

function seoAuditStateTrack(a) {
  const index = SEO_AUDIT_STATES.indexOf(a.state);
  return `<div class="v-audit-state-track" aria-label="Estado de la auditoría">
    ${SEO_AUDIT_STATES.map((state, i) => `<span class="${state === a.state ? "current" : i < index && !["bloqueado", "devuelto", "cancelado"].includes(state) ? "done" : ""}"><i></i>${safe(seoAuditLabel(state))}</span>`).join("")}
  </div>`;
}

function seoAuditOverview(a) {
  return `<div class="v-audit-detail-grid"><section><h2>Contrato</h2><dl class="v-kv">
    <div><dt>CLIENTE / PROYECTO</dt><dd>${safe(a.client)} / ${safe(a.project)}</dd></div>
    <div><dt>DOMINIO</dt><dd>${safe(a.domain)}</dd></div>
    <div><dt>SERVICIOS</dt><dd>${safe(a.services.join(", "))}</dd></div>
    <div><dt>MERCADOS / IDIOMAS</dt><dd>${safe(a.markets.join(", "))} / ${safe(a.languages.join(", "))}</dd></div>
    <div><dt>SOLICITADO POR</dt><dd>${safe(a.requestedBy)} · ${safe(a.createdAt)}</dd></div>
    <div><dt>LÍMITES</dt><dd>${a.limits.pages} páginas · ${a.limits.minutes} min · ${safe(a.limits.cost)}</dd></div>
  </dl></section><aside><h2>Preparación</h2>
    <div class="v-audit-score"><strong>${a.evidence.length}</strong><span>Evidencias</span></div>
    <div class="v-audit-score"><strong>${a.findings.length}</strong><span>Hallazgos</span></div>
    <div class="v-audit-score"><strong>${a.coverage.filter((c) => c.state === "evidencia_suficiente").length}/${a.coverage.length}</strong><span>Servicios completos</span></div>
  </aside></div>${seoAuditNextActions(a.actions || [])}`;
}

// Tareas abiertas ordenadas por fecha (sin fecha al final), con su hallazgo de origen.
function seoAuditNextActions(actions, options = {}) {
  const open = actions
    .filter((action) => action.open)
    .sort((x, y) => (x.dueDate || "9999").localeCompare(y.dueDate || "9999"));
  if (!open.length && !options.showEmpty) return "";
  return `<section class="v-section"><div class="v-section-head"><h2>Próximas acciones</h2><span class="v-mono">${open.length} ABIERTAS</span></div>
    <div class="v-panel v-next-actions">${
      open
        .map(
          (
            action,
          ) => `<div class="v-row"><div><div class="v-flex">${tag(action.kindLabel)}${tag(action.overdue ? "Vencida" : action.statusLabel, action.overdue ? "bad" : action.status === "en_curso" ? "warn" : "")}<span class="v-mono v-muted">${safe(options.prefix ? `${options.prefix(action)} · ` : "")}${safe(action.findingRef)}</span></div>
          <strong>${safe(action.title)}</strong>
          <p>PM: ${safe(action.owner)} · ${action.agent ? `Agente: ${safe(action.agent)}` : "Sin agente"} · ${action.dueLabel ? safe(action.dueLabel) : "Sin fecha"}</p></div>
          ${options.openButton ? options.openButton(action) : `<button data-seo-goto-finding>Ver hallazgo →</button>`}</div>`,
        )
        .join("") || '<div class="v-audit-empty"><strong>No hay acciones abiertas.</strong></div>'
    }</div></section>`;
}

function seoAuditScope(a) {
  return `<section><h2>Alcance autorizado</h2><p>${safe(a.scope)}</p><div class="v-audit-chips">${a.capabilities.map((c) => tag(c, "dark")).join("")}</div></section>
    <section class="v-section"><h2>Referencias de acceso</h2><div class="v-audit-plain-list">${a.accesses.map((access) => `<div><span>${safe(access.name)}</span>${tag(access.state, access.state === "validado" ? "good" : "warn")}</div>`).join("") || "<p>Sin referencias de acceso.</p>"}</div></section>`;
}

function seoAuditEvidence(a) {
  return `<section><div class="v-section-head"><h2>Evidencias</h2><span class="v-mono">${a.evidence.length} REGISTROS</span></div>
    <div class="v-audit-plain-list">${a.evidence.map((e) => `<div class="v-audit-evidence-row"><div><span class="v-mono v-muted">${safe(e.id)} · ${safe(e.method)}</span><strong>${safe(e.source)}</strong><p>${safe(e.resource)} · ${safe(e.observed)}</p></div>${tag(e.trusted ? "Interna" : "No confiable", e.trusted ? "good" : "warn")}</div>`).join("") || '<div class="v-audit-empty"><strong>Todavía no hay evidencias.</strong><p>Se registrarán después de autorizar e iniciar el encargo.</p></div>'}</div></section>`;
}

const SEO_FINDING_DECISIONS = {
  pendiente: "Pendiente",
  priorizar: "Priorizar",
  investigar: "Investigar",
  descartar: "Descartar",
};

// Solo lectura: auditoría cerrada, archivada o de un cliente archivado (lo mismo que exige RLS).
function seoAuditLocked(a) {
  return seoAuditIsArchived(a) || ["validado", "cancelado"].includes(a.state);
}

function seoAuditFindingReview(a, f) {
  if (!f.review) return "";
  const locked = seoAuditLocked(a);
  const signature = f.review.by
    ? `Decidido por ${safe(f.review.by)} · ${safe(f.review.at)}`
    : "Sin decisión todavía";
  return `<form class="v-finding-review" data-seo-review="${safe(f.dbId)}">
      <label>Decisión del PM<select name="decision" ${locked ? "disabled" : ""}>${Object.entries(
        SEO_FINDING_DECISIONS,
      )
        .map(
          ([value, label]) =>
            `<option value="${value}" ${value === f.review.decision ? "selected" : ""}>${label}</option>`,
        )
        .join("")}</select></label>
      <label>Nota<textarea name="note" rows="2" maxlength="3000" ${locked ? "disabled" : ""}>${safe(f.review.note)}</textarea></label>
      <div class="v-flex">${locked ? "" : '<button type="submit">Guardar decisión</button>'}<span class="v-small v-muted">${signature}</span></div>
    </form>`;
}

const SEO_ACTION_STATUS_TONE = { pendiente: "", en_curso: "warn", hecha: "good", cancelada: "" };

function seoAuditActionsBlock(a, f) {
  if (!f.review) return "";
  const locked = seoAuditLocked(a);
  const creating = seoAuditActionForm && seoAuditActionForm.findingId === f.dbId;
  const rows = (f.actions || []).map((action) => seoAuditActionRow(action, locked)).join("");
  return `<div class="v-finding-actions"><div class="v-finding-actions-head"><strong>Seguimiento</strong>${
    locked || creating
      ? ""
      : `<div class="v-flex"><button data-seo-action-new="${safe(f.dbId)}" data-kind="investigacion">+ Tarea de investigación</button><button data-seo-action-new="${safe(f.dbId)}" data-kind="accion">+ Acción del plan</button></div>`
  }</div>${rows || (creating ? "" : '<p class="v-small v-muted">Sin tareas. Tras decidir, crea la investigación o la acción que corresponda.</p>')}${creating ? seoAuditActionFormHtml(f, seoAuditActionForm.kind) : ""}</div>`;
}

function seoAuditActionRow(action, locked) {
  const meta = [
    `PM: ${action.owner}`,
    action.agent ? `Agente: ${action.agent}` : "Sin agente",
    action.dueLabel
      ? `${action.overdue ? "Vencida el" : "Fecha límite:"} ${action.dueLabel}`
      : "Sin fecha",
  ].join(" · ");
  const closing = seoAuditCloseForm === action.id;
  const buttons =
    !action.open || locked || closing
      ? ""
      : `<div class="v-flex">${action.status === "pendiente" ? `<button data-seo-action-status="${safe(action.id)}" data-status="en_curso">Empezar</button>` : ""}<button class="v-primary" data-seo-action-close="${safe(action.id)}">Cerrar…</button><button data-seo-action-status="${safe(action.id)}" data-status="cancelada">Cancelar tarea</button></div>`;
  const closed = action.open
    ? ""
    : `<p class="v-small"><b>${action.status === "hecha" ? "Conclusión" : "Cancelada"}:</b> ${safe(action.conclusion || "Sin comentario")}${action.outcome ? ` → hallazgo marcado como <b>${safe(SEO_FINDING_DECISIONS[action.outcome])}</b>` : ""}</p><p class="v-small v-muted">Cerrada por ${safe(action.closedBy || "—")} · ${safe(action.closedAt || "")}</p>`;
  return `<div class="v-action-row" id="tarea-${safe(action.id)}">
    <div class="v-flex">${tag(action.kindLabel)}${tag(action.overdue ? "Vencida" : action.statusLabel, action.overdue ? "bad" : SEO_ACTION_STATUS_TONE[action.status])}</div>
    <strong>${safe(action.title)}</strong>
    <p class="v-small">${safe(action.detail)}</p>
    ${action.doneCriteria ? `<p class="v-small v-muted"><b>Hecho cuando:</b> ${safe(action.doneCriteria)}</p>` : ""}
    <p class="v-small v-muted">${safe(meta)}</p>
    ${closed}${closing ? seoAuditCloseFormHtml(action) : buttons}
  </div>`;
}

function seoAuditActionFormHtml(f, kind) {
  const team = seoAuditRepository.team ? seoAuditRepository.team() : { pms: [], agents: [] };
  const investigation = kind === "investigacion";
  if (!team.pms.length) {
    return '<div class="v-notice"><strong>No hay Project Managers disponibles.</strong><p>El responsable de una tarea debe ser un PM o super admin activo.</p><button type="button" data-seo-action-form-cancel>Cerrar</button></div>';
  }
  return `<form class="v-action-form" data-seo-action-form="${safe(f.dbId)}" data-kind="${kind}">
    <strong class="v-wide">${investigation ? "Nueva tarea de investigación" : "Nueva acción del plan"}</strong>
    <label class="v-wide">Título<input name="title" required maxlength="200" value="${safe(investigation ? `Investigar: ${f.title}` : f.title)}"></label>
    <label class="v-wide">${investigation ? "Pregunta que hay que responder" : "Entregable"}<textarea name="detail" required maxlength="2000" rows="2" placeholder="${investigation ? "¿Qué hay que averiguar para decidir? Por ejemplo: ¿se busca «departamento de marketing externo»?" : "Qué se va a entregar"}">${investigation ? "" : safe(f.recommendation || "")}</textarea></label>
    ${investigation ? "" : '<label class="v-wide">Hecho cuando<input name="doneCriteria" maxlength="1000" placeholder="Criterio verificable para dar la acción por terminada"></label>'}
    <label>PM responsable<select name="ownerUserId" required>${team.pms.map((pm) => `<option value="${safe(pm.id)}">${safe(pm.name)}</option>`).join("")}</select></label>
    <label>Agente<select name="agentId"><option value="">Sin agente</option>${team.agents.map((agent) => `<option value="${safe(agent.id)}">${safe(agent.name)} · ${safe(agent.specialty)}${agent.availability === "saturado" ? " (saturado)" : ""}</option>`).join("")}</select></label>
    <label>Fecha límite<input type="date" name="dueDate"></label>
    <div class="v-flex v-wide"><button class="v-primary" type="submit">Crear tarea</button><button type="button" data-seo-action-form-cancel>Cancelar</button></div>
  </form>`;
}

function seoAuditCloseFormHtml(action) {
  const investigation = action.kind === "investigacion";
  return `<form class="v-action-form" data-seo-action-close-form="${safe(action.id)}" data-kind="${action.kind}">
    <label class="v-wide">${investigation ? "Conclusión de la investigación" : "Resultado (opcional)"}<textarea name="conclusion" ${investigation ? "required" : ""} maxlength="3000" rows="3" placeholder="${investigation ? "Qué has averiguado y con qué fuente" : "Qué se ha entregado"}"></textarea></label>
    ${investigation ? '<label class="v-wide">Decisión sobre el hallazgo<select name="outcome"><option value="">Mantener la decisión actual</option><option value="priorizar">Priorizar</option><option value="descartar">Descartar</option></select></label>' : ""}
    <div class="v-flex v-wide"><button class="v-primary" type="submit">Cerrar tarea</button><button type="button" data-seo-action-close-cancel>Volver</button></div>
  </form>`;
}

function seoAuditFindings(a) {
  const rows = a.findings
    .map(
      (
        f,
      ) => `<div class="v-audit-finding-row"><div>${tag(f.priority, f.priority === "Alta" ? "bad" : "warn")}${f.review && f.review.decision !== "pendiente" ? tag(SEO_FINDING_DECISIONS[f.review.decision], f.review.decision === "priorizar" ? "good" : "") : ""}<strong>${safe(f.title)}</strong>
      <p>${safe(f.category)} · Confianza ${safe(f.confidence)} · ${safe(f.status)}${f.responsible ? ` · ${safe(f.responsible)}` : ""}</p>
      ${f.description ? `<p class="v-small">${safe(f.description)}</p>` : ""}
      ${f.impact ? `<p class="v-small v-muted"><b>Impacto:</b> ${safe(f.impact)}</p>` : ""}
      ${f.recommendation ? `<p class="v-small v-muted"><b>Recomendación:</b> ${safe(f.recommendation)}</p>` : ""}
      ${Array.isArray(f.evidenceIds) && f.evidenceIds.length ? `<p class="v-small v-mono v-muted">Evidencia: ${safe(f.evidenceIds.join(", "))}</p>` : '<p class="v-small v-muted">Evidencia incompleta</p>'}
      ${Array.isArray(f.limitations) && f.limitations.length ? `<p class="v-small v-muted"><b>Límites:</b> ${safe(f.limitations.join(" "))}</p>` : ""}
      ${seoAuditFindingReview(a, f)}
      ${seoAuditActionsBlock(a, f)}
      </div><span class="v-mono">${safe(f.id)}</span></div>`,
    )
    .join("");
  const decided = a.findings.filter((f) => f.review && f.review.decision !== "pendiente").length;
  const reviewable = a.findings.some((f) => f.review);
  return `<section><div class="v-section-head"><h2>Hallazgos</h2><span class="v-mono">${reviewable ? `${decided} DE ${a.findings.length} CON DECISIÓN` : `${a.findings.length} REGISTROS`}</span></div>
    <div class="v-audit-plain-list">${rows || '<div class="v-audit-empty"><strong>Sin hallazgos.</strong><p>El borrador aún no contiene resultados.</p></div>'}</div>
    ${Array.isArray(a.limitations) && a.limitations.length ? `<div class="v-notice"><strong>Límites de esta ejecución</strong><ul>${a.limitations.map((l) => `<li>${safe(l)}</li>`).join("")}</ul></div>` : ""}</section>`;
}

function seoAuditCoverage(a) {
  return `<section><h2>Cobertura por servicio</h2><div class="v-audit-coverage">${a.coverage.map((c) => `<div><div><strong>${safe(c.service)}</strong><p>${safe(c.reason)}</p></div>${tag(c.state.replaceAll("_", " "), c.state === "evidencia_suficiente" ? "good" : c.state === "bloqueo_por_acceso" ? "bad" : "warn")}</div>`).join("")}</div></section>`;
}

function seoAuditHistory(a) {
  return `<section><h2>Historial de estados</h2><ol class="v-audit-history">${a.events
    .slice()
    .reverse()
    .map((event) => `<li>${safe(event)}</li>`)
    .join("")}</ol></section>`;
}

// La revisión externa del piloto se ofrece en la auditoría real de su dominio mientras no
// tenga hallazgos y admita cambios.
function seoAuditImportOffer(a) {
  if (
    !a.remote ||
    a.findings.length ||
    seoAuditLocked(a) ||
    typeof ValmePilot === "undefined" ||
    !String(a.domain).toLowerCase().endsWith(ValmePilot.domain)
  )
    return "";
  return `<div class="v-notice v-audit-import"><div><strong>Revisión externa disponible · 27 sep 2026</strong><p>${ValmePilot.findingCount} hallazgos y las 8 páginas revisadas de ${safe(a.domain)}. Se registran como revisión de Codex, no como ejecución automática de Search OS; después decides sobre cada hallazgo.</p></div><button class="v-primary" data-seo-import-pilot>Cargar revisión externa</button></div>`;
}

function seoAuditDetail(a) {
  const tabs = {
    Resumen: seoAuditOverview,
    Alcance: seoAuditScope,
    Evidencias: seoAuditEvidence,
    Hallazgos: seoAuditFindings,
    Cobertura: seoAuditCoverage,
    Historial: seoAuditHistory,
  };
  const action = SEO_AUDIT_ACTIONS[a.state];
  const terminal = ["validado", "cancelado"].includes(a.state);
  const archived = seoAuditIsArchived(a);
  const archiveBlock = a.archivedAt
    ? `<div class="v-notice v-audit-archived"><div><strong>Auditoría archivada${a.archivedAtLabel ? ` · ${safe(a.archivedAtLabel)}` : ""}</strong><p>Fuera del trabajo diario y en solo lectura. Al restaurarla vuelve al trabajo diario en su estado actual (${safe(seoAuditLabel(a.state))}).</p></div><button data-seo-restore>Restaurar auditoría</button></div>`
    : a.clientArchived
      ? `<div class="v-notice v-audit-archived"><div><strong>El cliente ${safe(a.client)} está archivado</strong><p>Sus auditorías quedan en solo lectura hasta restaurar el cliente desde Clientes.</p></div></div>`
      : "";
  return (
    `<button class="v-back" data-seo-back>← Auditorías</button>` +
    heading(
      a.displayId || a.id,
      `${a.client} · ${a.project}`,
      a.domain,
      tag(seoAuditLabel(a.state), seoAuditTone(a.state)),
    ) +
    seoAuditStateTrack(a) +
    archiveBlock +
    (archived ? "" : `<div class="v-audit-command">`) +
    (archived
      ? ""
      : `<div><span class="v-mono v-muted">SIGUIENTE DECISIÓN</span><strong>${terminal ? "Expediente cerrado" : action ? action.label : "Resolver el bloqueo"}</strong><p>${terminal ? "Los artefactos quedan en modo consulta." : seoAuditRepository.status().mode === ValmeSeoAuditRepository.REMOTE_MODE ? "La decisión se registra en el expediente remoto." : "La acción actualiza solo esta demostración local."}</p></div><div class="v-flex">
      ${a.state === "en_ejecucion" && seoAuditRepository.status().mode === ValmeSeoAuditRepository.LOCAL_MODE ? `<button class="v-primary" data-seo-run ${seoAuditRunning ? "disabled" : ""}>${seoAuditRunning ? "Analizando la web…" : "Ejecutar análisis real"}</button>` : ""}
      ${action?.next === "autorizado" ? '<label>Referencia de autorización<input id="v-seo-authorization-ref" required maxlength="500" placeholder="Ticket, acta o aprobación"></label>' : ""}
      ${action ? `<button class="${a.state === "en_ejecucion" ? "" : "v-primary"}" data-seo-transition="${action.next}">${action.label}</button>` : ""}
      ${a.state === "control_calidad" ? "<button data-seo-return>Devolver con motivo</button>" : ""}
      ${!terminal && a.state !== "cancelado" ? "<button data-seo-cancel>Cancelar auditoría</button>" : ""}
      <button data-seo-archive>Archivar</button>
    </div></div>`) +
    seoAuditImportOffer(a) +
    `<div class="v-tabs v-audit-tabs" role="tablist" aria-label="Secciones de la auditoría">${Object.keys(
      tabs,
    )
      .map(
        (tabName) =>
          `<button role="tab" data-seo-tab="${tabName}" aria-selected="${tabName === seoAuditTab}">${tabName}</button>`,
      )
      .join("")}</div>
    <div class="v-audit-detail" role="tabpanel">${tabs[seoAuditTab](a)}</div>`
  );
}

function auditsWorkspace() {
  if (seoAuditRepositoryLoading) {
    return heading(
      seoAuditRepository.status().mode === ValmeSeoAuditRepository.REMOTE_MODE
        ? "AUDITORÍA SEO / STAGING"
        : "AUDITORÍA SEO / DEMOSTRACIÓN",
      "Auditorías",
      seoAuditRepository.status().mode === ValmeSeoAuditRepository.REMOTE_MODE
        ? "Cargando expedientes autorizados."
        : "Preparando el repositorio local.",
    );
  }
  if (seoAuditCreating) return seoAuditNew();
  if (
    seoAuditCurrent === ValmePilot.id &&
    seoAuditRepository.status().mode === ValmeSeoAuditRepository.LOCAL_MODE
  )
    return ValmePilot.detail();
  const audit = seoAudits.find((a) => a.id === seoAuditCurrent);
  return audit ? seoAuditDetail(audit) : seoAuditList();
}

function seoAuditRender(message) {
  page.innerHTML = auditsWorkspace();
  decorate();
  focusHeading();
  if (message) announce(message);
}

async function seoAuditTransition(audit, next, reason) {
  if (!SEO_AUDIT_NEXT[audit.state].includes(next)) {
    announce(`Transición no permitida: ${seoAuditLabel(audit.state)} → ${seoAuditLabel(next)}.`);
    return;
  }
  if (seoAuditRepository.status().mode === ValmeSeoAuditRepository.REMOTE_MODE) {
    const authorizationRef = document.querySelector("#v-seo-authorization-ref")?.value.trim();
    if (next === "autorizado" && !authorizationRef) {
      announce("Añade la referencia de autorización antes de continuar.");
      return;
    }
    try {
      const updated = await seoAuditRepository.transition({
        auditId: audit.id,
        nextState: next,
        reason,
        ...(authorizationRef ? { authorizationRef } : {}),
      });
      seoAudits = seoAudits.map((item) => (item.id === updated.id ? updated : item));
      seoAuditRender(`Auditoría ${audit.displayId || audit.id}: ${seoAuditLabel(next)}.`);
    } catch (error) {
      seoAuditStorageOk = false;
      seoAuditRender(error.message);
    }
    return;
  }
  const previous = audit.state;
  audit.state = next;
  audit.events.push(
    `${seoAuditNow()} · ${seoAuditLabel(previous)} → ${seoAuditLabel(next)} · ${reason}`,
  );
  await seoAuditPersist();
  seoAuditRender(`Auditoría ${audit.displayId || audit.id}: ${seoAuditLabel(next)}.`);
}

async function seoAuditSetArchived(audit, archived) {
  const verb = archived ? "archivar" : "restaurar";
  const question = archived
    ? `¿Archivar la auditoría ${audit.displayId || audit.id}? Saldrá del trabajo diario y quedará en solo lectura. Podrás restaurarla cuando quieras; no se borra nada.`
    : `¿Restaurar la auditoría ${audit.displayId || audit.id}? Volverá al trabajo diario en su estado actual.`;
  if (!window.confirm(question)) return;
  if (seoAuditIsRemote()) {
    try {
      await seoAuditRepository.setAuditArchived({ auditId: audit.id, archived });
      await seoAuditLoadRepository(archived ? "Auditoría archivada." : "Auditoría restaurada.");
    } catch (error) {
      seoAuditRender(`No se pudo ${verb}: ${error.message}`);
    }
    return;
  }
  if (archived) {
    audit.archivedAt = new Date().toISOString();
    audit.archivedAtLabel = seoAuditNow();
    audit.events.push(`${seoAuditNow()} · Archivada por Project Manager`);
  } else {
    delete audit.archivedAt;
    delete audit.archivedAtLabel;
    audit.events.push(`${seoAuditNow()} · Restaurada por Project Manager`);
  }
  await seoAuditPersist();
  seoAuditRender(
    archived
      ? `Auditoría ${audit.displayId || audit.id} archivada.`
      : `Auditoría ${audit.displayId || audit.id} restaurada.`,
  );
}

let seoAuditRunning = false;

async function seoAuditRunReal(audit) {
  if (typeof window.valmeRunRealAudit !== "function") {
    announce("El análisis real no está disponible en esta página.");
    return;
  }
  seoAuditRunning = true;
  seoAuditRender(`Analizando ${audit.domain}. Solo lectura, sin cambios en la web.`);
  try {
    const r = await window.valmeRunRealAudit(audit.domain, audit.services);
    audit.evidence = r.evidence;
    audit.findings = r.findings;
    audit.coverage = r.coverage;
    audit.limitations = r.limitations;
    audit.events.push(
      `${seoAuditNow()} · Análisis real de ${r.url}: ${r.findings.length} hallazgos, ${r.evidence.length} evidencias. Pendiente de revisión del Project Manager`,
    );
    await seoAuditPersist();
    seoAuditRunning = false;
    seoAuditTab = "Hallazgos";
    seoAuditRender(`Análisis terminado: ${r.findings.length} hallazgos propuestos.`);
  } catch (error) {
    seoAuditRunning = false;
    audit.events.push(`${seoAuditNow()} · Análisis real fallido: ${error.message}`);
    await seoAuditPersist();
    seoAuditRender(error.message);
  }
}

// Entrar en la sección desde la navegación lleva siempre al listado.
root.addEventListener(
  "click",
  (event) => {
    if (event.target.closest("button")?.dataset.go !== "Auditorías") return;
    seoAuditCurrent = null;
    seoAuditCreating = false;
    seoAuditPresetProject = null;
  },
  true,
);
root.addEventListener(
  "change",
  (event) => {
    if (event.target.id !== "v-mobile-select" || event.target.value !== "Auditorías") return;
    seoAuditCurrent = null;
    seoAuditCreating = false;
    seoAuditPresetProject = null;
  },
  true,
);

root.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const data = button.dataset;
  if (data.seoNew !== undefined) {
    seoAuditCreating = true;
    seoAuditCurrent = null;
    seoAuditRender("Nuevo borrador de auditoría.");
  } else if (data.seoBack !== undefined) {
    seoAuditActionForm = null;
    seoAuditCloseForm = null;
    seoAuditCreating = false;
    seoAuditPresetProject = null;
    seoAuditCurrent = null;
    seoAuditTab = "Resumen";
    seoAuditRender("Vista de auditorías.");
  } else if (data.seoOpen) {
    seoAuditActionForm = null;
    seoAuditCloseForm = null;
    seoAuditCurrent = data.seoOpen;
    seoAuditTab = "Resumen";
    seoAuditRender("Expediente abierto.");
  } else if (data.seoTab) {
    seoAuditTab = data.seoTab;
    seoAuditRender(`Auditoría · ${seoAuditTab}.`);
  } else if (data.seoTransition) {
    const audit = seoAudits.find((a) => a.id === seoAuditCurrent);
    if (audit)
      await seoAuditTransition(
        audit,
        data.seoTransition,
        seoAuditRepository.status().mode === ValmeSeoAuditRepository.REMOTE_MODE
          ? "Decisión del Project Manager"
          : "Decisión simulada del Project Manager",
      );
  } else if (data.seoReturn !== undefined) {
    const audit = seoAudits.find((a) => a.id === seoAuditCurrent);
    if (audit)
      await seoAuditTransition(
        audit,
        "devuelto",
        "Control de calidad solicita completar evidencias",
      );
  } else if (data.seoCancel !== undefined) {
    const audit = seoAudits.find((a) => a.id === seoAuditCurrent);
    if (audit)
      await seoAuditTransition(
        audit,
        "cancelado",
        seoAuditIsRemote()
          ? "Cancelación del Project Manager"
          : "Cancelación simulada por Project Manager",
      );
  } else if (data.seoImportPilot !== undefined) {
    const audit = seoAudits.find((a) => a.id === seoAuditCurrent);
    if (audit) await seoAuditImportPilot(audit);
  } else if (data.seoArchive !== undefined || data.seoRestore !== undefined) {
    const audit = seoAudits.find((a) => a.id === seoAuditCurrent);
    if (audit) await seoAuditSetArchived(audit, data.seoArchive !== undefined);
  } else if (data.seoRun !== undefined) {
    const audit = seoAudits.find((a) => a.id === seoAuditCurrent);
    if (audit && audit.state === "en_ejecucion" && !seoAuditRunning) {
      await seoAuditRunReal(audit);
    }
  } else if (data.seoReset !== undefined) {
    if (seoAuditRepository.status().mode !== ValmeSeoAuditRepository.LOCAL_MODE) return;
    seoAudits = await seoAuditRepository.reset();
    seoAuditCurrent = null;
    seoAuditQuery = "";
    seoAuditStateFilter = "Todos";
    seoAuditClientFilter = "Todos";
    seoAuditStorageOk = seoAuditRepository.status().writable;
    seoAuditRender("Auditorías de demostración restablecidas.");
  }
});

root.addEventListener("change", (event) => {
  if (event.target.id === "v-seo-state") {
    seoAuditStateFilter = event.target.value;
    seoAuditRender("Filtro de estado aplicado.");
  } else if (event.target.id === "v-seo-client") {
    seoAuditClientFilter = event.target.value;
    seoAuditRender("Filtro de cliente aplicado.");
  } else if (event.target.id === "v-seo-archived") {
    seoAuditShowArchived = event.target.checked;
    seoAuditRender(seoAuditShowArchived ? "Mostrando archivadas." : "Archivadas ocultas.");
  }
});

root.addEventListener("input", (event) => {
  if (event.target.id !== "v-seo-search") return;
  seoAuditQuery = event.target.value;
  const list = root.querySelector(".v-audit-list");
  if (list) list.outerHTML = seoAuditRows();
  decorate();
});

async function seoAuditImportPilot(audit) {
  if (
    !window.confirm(
      `¿Cargar en ${audit.displayId || audit.id} los ${ValmePilot.findingCount} hallazgos y las evidencias de la revisión externa de ${ValmePilot.domain}? Quedarán registrados en staging a tu nombre como importación.`,
    )
  )
    return;
  try {
    const payload = await ValmePilot.loadImportPayload(audit.id);
    const result = await seoAuditRepository.importReview(payload);
    seoAuditTab = "Hallazgos";
    await seoAuditLoadRepository(
      `Revisión cargada: ${result.findings} hallazgos y ${result.evidence} evidencias.`,
    );
  } catch (error) {
    seoAuditRender(`No se pudo cargar la revisión: ${error.message}`);
  }
}

root.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const data = button.dataset;
  if (data.seoActionNew) {
    seoAuditActionForm = { findingId: data.seoActionNew, kind: data.kind };
    seoAuditCloseForm = null;
    seoAuditRender("Nueva tarea.");
  } else if (data.seoActionFormCancel !== undefined) {
    seoAuditActionForm = null;
    seoAuditRender();
  } else if (data.seoActionClose) {
    seoAuditCloseForm = data.seoActionClose;
    seoAuditActionForm = null;
    seoAuditRender("Cierre de tarea.");
  } else if (data.seoActionCloseCancel !== undefined) {
    seoAuditCloseForm = null;
    seoAuditRender();
  } else if (data.seoActionStatus) {
    if (
      data.status === "cancelada" &&
      !window.confirm(
        "¿Cancelar esta tarea? Quedará cerrada en el historial y no se podrá reabrir.",
      )
    )
      return;
    try {
      await seoAuditRepository.updateAction({
        actionId: data.seoActionStatus,
        status: data.status,
      });
      await seoAuditLoadRepository(
        data.status === "en_curso" ? "Tarea en curso." : "Tarea cancelada.",
      );
    } catch (error) {
      announce(`No se pudo actualizar la tarea: ${error.message}`);
    }
  } else if (data.seoGotoFinding !== undefined) {
    seoAuditTab = "Hallazgos";
    seoAuditRender("Hallazgos.");
  }
});

root.addEventListener("submit", async (event) => {
  const form = event.target.closest("form[data-seo-action-form], form[data-seo-action-close-form]");
  if (!form) return;
  event.preventDefault();
  const data = new FormData(form);
  const button = form.querySelector('button[type="submit"]');
  if (button) button.disabled = true;
  const text = (name) => String(data.get(name) || "").trim();
  try {
    if (form.dataset.seoActionForm) {
      await seoAuditRepository.createAction({
        findingId: form.dataset.seoActionForm,
        kind: form.dataset.kind,
        title: text("title"),
        detail: text("detail"),
        ownerUserId: text("ownerUserId"),
        ...(text("doneCriteria") ? { doneCriteria: text("doneCriteria") } : {}),
        ...(text("agentId") ? { agentId: text("agentId") } : {}),
        ...(text("dueDate") ? { dueDate: text("dueDate") } : {}),
      });
      seoAuditActionForm = null;
      await seoAuditLoadRepository("Tarea creada.");
    } else {
      await seoAuditRepository.updateAction({
        actionId: form.dataset.seoActionCloseForm,
        status: "hecha",
        ...(text("conclusion") ? { conclusion: text("conclusion") } : {}),
        ...(text("outcome") ? { outcome: text("outcome") } : {}),
      });
      seoAuditCloseForm = null;
      await seoAuditLoadRepository(
        text("outcome") ? "Tarea cerrada y hallazgo actualizado." : "Tarea cerrada.",
      );
    }
  } catch (error) {
    if (button) button.disabled = false;
    announce(`No se pudo guardar la tarea: ${error.message}`);
  }
});

root.addEventListener("submit", async (event) => {
  const form = event.target.closest("form[data-seo-review]");
  if (!form) return;
  event.preventDefault();
  const data = new FormData(form);
  const decision = String(data.get("decision"));
  const note = String(data.get("note") || "").trim();
  if (decision === "descartar" && !note) {
    announce("Para descartar un hallazgo escribe el motivo en la nota.");
    form.querySelector("textarea")?.focus();
    return;
  }
  const button = form.querySelector('button[type="submit"]');
  if (button) button.disabled = true;
  try {
    await seoAuditRepository.reviewFinding({
      findingId: form.dataset.seoReview,
      decision,
      note,
    });
    seoAuditTab = "Hallazgos";
    const kind = { investigar: "investigacion", priorizar: "accion" }[decision];
    const audit = seoAudits.find((item) => item.id === seoAuditCurrent);
    const finding = audit?.findings.find((item) => item.dbId === form.dataset.seoReview);
    const hasOpen = finding?.actions?.some((action) => action.open && action.kind === kind);
    seoAuditActionForm = kind && !hasOpen ? { findingId: form.dataset.seoReview, kind } : null;
    seoAuditCloseForm = null;
    await seoAuditLoadRepository(
      seoAuditActionForm
        ? `Decisión guardada. Crea ahora la ${kind === "investigacion" ? "tarea de investigación" : "acción del plan"}.`
        : "Decisión guardada.",
    );
  } catch (error) {
    if (button) button.disabled = false;
    announce(`No se pudo guardar la decisión: ${error.message}`);
  }
});

root.addEventListener("submit", async (event) => {
  if (event.target.id !== "v-seo-form") return;
  event.preventDefault();
  const form = new FormData(event.target);
  const services = form.getAll("services").map(String);
  if (!services.length) {
    announce("Selecciona al menos un servicio.");
    return;
  }
  const remote = seoAuditRepository.status().mode === ValmeSeoAuditRepository.REMOTE_MODE;
  if (remote) {
    const project = seoAuditRepository
      .projects()
      .find((item) => item.id === String(form.get("projectId")));
    if (!project) {
      announce("Selecciona un proyecto asignado válido.");
      return;
    }
    try {
      const domainUrl = project.domain.startsWith("http")
        ? project.domain
        : `https://${project.domain}`;
      const audit = await seoAuditRepository.createDraft({
        projectId: project.id,
        serviceIds: services,
        primaryDomain: project.domain,
        seedUrls: [`${domainUrl.replace(/\/$/, "")}/`],
        markets: ["España"],
        languages: ["es"],
        authorizedScope: {
          includedDomains: [project.domain],
          includedPaths: ["/"],
          excludedPaths: [],
          allowedReadActions: ["fetch_public_html"],
          explicitlyExcludedActions: ["publish", "write", "delete"],
        },
        requestedCapabilityIds: services.includes("SEO técnico")
          ? ["crawling", "indexacion", "canonical"]
          : ["analisis_contenido"],
        limits: {
          maxPages: Number(form.get("pages")),
          maxDurationMinutes: Number(form.get("minutes")),
          maxCostAmount: Number(form.get("cost")),
          currency: "EUR",
        },
      });
      seoAudits.unshift(audit);
      seoAuditCreating = false;
      seoAuditPresetProject = null;
      seoAuditCurrent = audit.id;
      seoAuditTab = "Resumen";
      seoAuditRender("Borrador creado. No se ha iniciado ninguna ejecución.");
    } catch (error) {
      seoAuditStorageOk = false;
      seoAuditRender(error.message);
    }
    return;
  }
  const id = `AUD-${new Date().getFullYear()}-${String(Math.max(0, ...seoAudits.map((a) => Number(a.id.split("-").at(-1)))) + 1).padStart(3, "0")}`;
  const audit = {
    id,
    client: String(form.get("client")),
    project: String(form.get("project")).trim(),
    domain: String(form.get("domain")).trim(),
    state: "borrador",
    services,
    capabilities: services.includes("SEO técnico")
      ? ["Crawling", "Indexación", "Canonical"]
      : ["Análisis de contenido"],
    markets: ["España"],
    languages: ["es"],
    requestedBy: "Project Manager",
    createdAt: seoAuditNow(),
    limits: {
      pages: Number(form.get("pages")),
      minutes: Number(form.get("minutes")),
      cost: `${Number(form.get("cost")).toFixed(2)} EUR`,
    },
    scope: String(form.get("scope")).trim(),
    accesses: [],
    evidence: [],
    findings: [],
    coverage: services.map((service) => ({
      service,
      state: "pendiente_justificado",
      reason: "Encargo todavía en borrador",
    })),
    events: [`${seoAuditNow()} · Borrador creado por Project Manager`],
  };
  seoAudits.unshift(audit);
  await seoAuditPersist();
  seoAuditCreating = false;
  seoAuditCurrent = id;
  seoAuditTab = "Resumen";
  seoAuditRender(`Borrador ${id} creado. No se ha iniciado ninguna ejecución.`);
});
