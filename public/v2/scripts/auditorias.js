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

let seoAudits = seoAuditLoad();
let seoAuditCurrent = null;
let seoAuditTab = "Resumen";
let seoAuditQuery = "";
let seoAuditStateFilter = "Todos";
let seoAuditClientFilter = "Todos";
let seoAuditCreating = false;
let seoAuditStorageOk = true;

function seoAuditClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function seoAuditLoad() {
  try {
    const stored = localStorage.getItem(SEO_AUDIT_STORAGE);
    if (!stored) return seoAuditClone(SEO_AUDIT_SEED);
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : seoAuditClone(SEO_AUDIT_SEED);
  } catch {
    return seoAuditClone(SEO_AUDIT_SEED);
  }
}

function seoAuditPersist() {
  try {
    localStorage.setItem(SEO_AUDIT_STORAGE, JSON.stringify(seoAudits));
    seoAuditStorageOk = true;
    return true;
  } catch {
    seoAuditStorageOk = false;
    return false;
  }
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
      (seoAuditStateFilter === "Todos" || a.state === seoAuditStateFilter) &&
      (seoAuditClientFilter === "Todos" || a.client === seoAuditClientFilter) &&
      (!q || [a.id, a.client, a.project, a.domain].some((v) => v.toLowerCase().includes(q))),
  );
}

function seoAuditSummary() {
  const active = seoAudits.filter((a) =>
    ["en_cola", "en_ejecucion", "bloqueado"].includes(a.state),
  ).length;
  const review = seoAudits.filter((a) =>
    ["pendiente_autorizacion", "control_calidad", "devuelto"].includes(a.state),
  ).length;
  const validated = seoAudits.filter((a) => a.state === "validado").length;
  const blocked = seoAudits.filter((a) => a.state === "bloqueado").length;
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
      <div class="v-audit-main"><div class="v-flex">${tag(seoAuditLabel(a.state), seoAuditTone(a.state))}<span class="v-mono v-muted">${safe(a.id)}</span></div>
        <strong>${safe(a.client)} · ${safe(a.project)}</strong><p>${safe(a.domain)}</p></div>
      <div class="v-audit-metrics"><span><b>${findings}</b> hallazgos</span><span><b>${evidence}</b> evidencias</span><span>${safe(a.services.join(" · "))}</span></div>
      <button data-seo-open="${safe(a.id)}" aria-label="Abrir auditoría ${safe(a.id)}">Abrir →</button>
    </div>`;
      })
      .join("") ||
    '<div class="v-audit-empty"><strong>No hay auditorías con estos filtros.</strong><p>Cambia los filtros o crea un borrador.</p></div>'
  }</div>`;
}

function seoAuditList() {
  const clientsList = ["Todos", ...new Set(seoAudits.map((a) => a.client))];
  return (
    heading(
      "AUDITORÍA SEO / DEMOSTRACIÓN",
      "Auditorías",
      "Alcance, evidencias y decisiones en un único expediente.",
      '<button class="v-primary" data-seo-new>+ Nueva auditoría</button>',
    ) +
    seoAuditSummary() +
    `<section class="v-section"><div class="v-tools v-audit-tools">
      <label class="v-search">Buscar<br><input id="v-seo-search" type="search" value="${safe(seoAuditQuery)}" placeholder="Cliente, dominio o ID"></label>
      <label>Estado<br><select id="v-seo-state">${["Todos", ...SEO_AUDIT_STATES].map((v) => `<option value="${v}" ${v === seoAuditStateFilter ? "selected" : ""}>${v === "Todos" ? "Todos" : seoAuditLabel(v)}</option>`).join("")}</select></label>
      <label>Cliente<br><select id="v-seo-client">${clientsList.map((v) => `<option ${v === seoAuditClientFilter ? "selected" : ""}>${safe(v)}</option>`).join("")}</select></label>
      <button data-seo-reset aria-label="Restablecer auditorías de demostración">Restablecer demo</button>
    </div>${seoAuditRows()}</section>
    ${seoAuditStorageOk ? "" : '<div class="v-notice v-audit-storage"><strong>No se pudo guardar en este navegador.</strong><p>Los cambios durarán solamente durante esta sesión.</p></div>'}`
  );
}

function seoAuditNew() {
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
        <label>Cliente<select name="client" required><option>Nébula Hogar</option><option>Tuilus</option></select></label>
        <label>Proyecto<input name="project" required maxlength="80" value="Web principal"></label>
        <label class="v-audit-wide">Dominio principal<input name="domain" required maxlength="160" placeholder="www.ejemplo.test"></label>
      </div></section>
      <section class="v-audit-form-section"><div><span class="v-mono v-muted">02 / ALCANCE</span><h2>Servicios autorizables</h2></div><div class="v-audit-checks">
        ${["SEO técnico", "Contenidos", "AEO/GEO", "Analítica"].map((s, i) => `<label><input type="checkbox" name="services" value="${s}" ${i === 0 ? "checked" : ""}>${s}</label>`).join("")}
      </div><label class="v-audit-wide">Límites y exclusiones<textarea name="scope" required rows="3">Dominio principal y recursos públicos aportados. Solo lectura; sin publicación ni cambios externos.</textarea></label></section>
      <section class="v-audit-form-section"><div><span class="v-mono v-muted">03 / LÍMITES</span><h2>Consumo máximo</h2></div><div class="v-audit-fields">
        <label>Páginas<input name="pages" type="number" min="1" max="10000" value="500" required></label>
        <label>Duración (min)<input name="minutes" type="number" min="1" max="1440" value="45" required></label>
        <label>Coste máximo<input name="cost" type="number" min="0" step="0.01" value="0" required></label>
      </div></section>
      <div class="v-flex"><button class="v-primary" type="submit">Guardar borrador</button><button type="button" data-seo-back>Cancelar</button></div>
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
  </aside></div>`;
}

function seoAuditScope(a) {
  return `<section><h2>Alcance autorizado</h2><p>${safe(a.scope)}</p><div class="v-audit-chips">${a.capabilities.map((c) => tag(c, "dark")).join("")}</div></section>
    <section class="v-section"><h2>Referencias de acceso</h2><div class="v-audit-plain-list">${a.accesses.map((access) => `<div><span>${safe(access.name)}</span>${tag(access.state, access.state === "validado" ? "good" : "warn")}</div>`).join("") || "<p>Sin referencias de acceso.</p>"}</div></section>`;
}

function seoAuditEvidence(a) {
  return `<section><div class="v-section-head"><h2>Evidencias</h2><span class="v-mono">${a.evidence.length} REGISTROS</span></div>
    <div class="v-audit-plain-list">${a.evidence.map((e) => `<div class="v-audit-evidence-row"><div><span class="v-mono v-muted">${safe(e.id)} · ${safe(e.method)}</span><strong>${safe(e.source)}</strong><p>${safe(e.resource)} · ${safe(e.observed)}</p></div>${tag(e.trusted ? "Interna" : "No confiable", e.trusted ? "good" : "warn")}</div>`).join("") || '<div class="v-audit-empty"><strong>Todavía no hay evidencias.</strong><p>Se registrarán después de autorizar e iniciar el encargo.</p></div>'}</div></section>`;
}

function seoAuditFindings(a) {
  return `<section><div class="v-section-head"><h2>Hallazgos</h2><span class="v-mono">${a.findings.length} REGISTROS</span></div>
    <div class="v-audit-plain-list">${a.findings.map((f) => `<div class="v-audit-finding-row"><div>${tag(f.priority, f.priority === "Alta" ? "bad" : "warn")}<strong>${safe(f.title)}</strong><p>${safe(f.category)} · Confianza ${safe(f.confidence)} · ${safe(f.status)}</p></div><span class="v-mono">${safe(f.id)}</span></div>`).join("") || '<div class="v-audit-empty"><strong>Sin hallazgos.</strong><p>El borrador aún no contiene resultados.</p></div>'}</div></section>`;
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
  return (
    `<button class="v-back" data-seo-back>← Auditorías</button>` +
    heading(
      a.id,
      `${a.client} · ${a.project}`,
      a.domain,
      tag(seoAuditLabel(a.state), seoAuditTone(a.state)),
    ) +
    seoAuditStateTrack(a) +
    `<div class="v-audit-command"><div><span class="v-mono v-muted">SIGUIENTE DECISIÓN</span><strong>${terminal ? "Expediente cerrado" : action ? action.label : "Resolver el bloqueo"}</strong><p>${terminal ? "Los artefactos quedan en modo consulta." : "La acción actualiza solo esta demostración local."}</p></div><div class="v-flex">
      ${action ? `<button class="v-primary" data-seo-transition="${action.next}">${action.label}</button>` : ""}
      ${a.state === "control_calidad" ? "<button data-seo-return>Devolver con motivo</button>" : ""}
      ${!terminal && a.state !== "cancelado" ? "<button data-seo-cancel>Cancelar auditoría</button>" : ""}
    </div></div>
    <div class="v-tabs v-audit-tabs" role="tablist" aria-label="Secciones de la auditoría">${Object.keys(
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
  if (seoAuditCreating) return seoAuditNew();
  const audit = seoAudits.find((a) => a.id === seoAuditCurrent);
  return audit ? seoAuditDetail(audit) : seoAuditList();
}

function seoAuditRender(message) {
  page.innerHTML = auditsWorkspace();
  decorate();
  focusHeading();
  if (message) announce(message);
}

function seoAuditTransition(audit, next, reason) {
  if (!SEO_AUDIT_NEXT[audit.state].includes(next)) {
    announce(`Transición no permitida: ${seoAuditLabel(audit.state)} → ${seoAuditLabel(next)}.`);
    return;
  }
  const previous = audit.state;
  audit.state = next;
  audit.events.push(
    `${seoAuditNow()} · ${seoAuditLabel(previous)} → ${seoAuditLabel(next)} · ${reason}`,
  );
  seoAuditPersist();
  seoAuditRender(`Auditoría ${audit.id}: ${seoAuditLabel(next)}.`);
}

root.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const data = button.dataset;
  if (data.seoNew !== undefined) {
    seoAuditCreating = true;
    seoAuditCurrent = null;
    seoAuditRender("Nuevo borrador de auditoría.");
  } else if (data.seoBack !== undefined) {
    seoAuditCreating = false;
    seoAuditCurrent = null;
    seoAuditTab = "Resumen";
    seoAuditRender("Vista de auditorías.");
  } else if (data.seoOpen) {
    seoAuditCurrent = data.seoOpen;
    seoAuditTab = "Resumen";
    seoAuditRender(`Expediente ${data.seoOpen} abierto.`);
  } else if (data.seoTab) {
    seoAuditTab = data.seoTab;
    seoAuditRender(`Auditoría · ${seoAuditTab}.`);
  } else if (data.seoTransition) {
    const audit = seoAudits.find((a) => a.id === seoAuditCurrent);
    if (audit)
      seoAuditTransition(audit, data.seoTransition, "Decisión simulada del Project Manager");
  } else if (data.seoReturn !== undefined) {
    const audit = seoAudits.find((a) => a.id === seoAuditCurrent);
    if (audit)
      seoAuditTransition(audit, "devuelto", "Control de calidad solicita completar evidencias");
  } else if (data.seoCancel !== undefined) {
    const audit = seoAudits.find((a) => a.id === seoAuditCurrent);
    if (audit) seoAuditTransition(audit, "cancelado", "Cancelación simulada por Project Manager");
  } else if (data.seoReset !== undefined) {
    seoAudits = seoAuditClone(SEO_AUDIT_SEED);
    seoAuditCurrent = null;
    seoAuditQuery = "";
    seoAuditStateFilter = "Todos";
    seoAuditClientFilter = "Todos";
    seoAuditPersist();
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
  }
});

root.addEventListener("input", (event) => {
  if (event.target.id !== "v-seo-search") return;
  seoAuditQuery = event.target.value;
  const list = root.querySelector(".v-audit-list");
  if (list) list.outerHTML = seoAuditRows();
  decorate();
});

root.addEventListener("submit", (event) => {
  if (event.target.id !== "v-seo-form") return;
  event.preventDefault();
  const form = new FormData(event.target);
  const services = form.getAll("services").map(String);
  if (!services.length) {
    announce("Selecciona al menos un servicio.");
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
  seoAuditPersist();
  seoAuditCreating = false;
  seoAuditCurrent = id;
  seoAuditTab = "Resumen";
  seoAuditRender(`Borrador ${id} creado. No se ha iniciado ninguna ejecución.`);
});
