(function (global) {
  "use strict";

  const KEY = "valme-pilot-review-v1";
  const ID = "VALME-PILOTO-2026-09-27";
  const options = {
    pendiente: "Pendiente",
    priorizar: "Priorizar",
    investigar: "Investigar",
    descartar: "Descartar",
  };
  const findings = [
    {
      id: "VALME-01",
      title: "Dar una página propia a la oferta de marketing",
      priority: "Alta",
      observed:
        "Las ocho URL del sitemap incluyen la portada, cuatro áreas de operaciones y tres casos. En esta muestra no aparece una página dedicada al departamento de marketing externo.",
      recommendation:
        "Preparar una página de oferta para pymes B2B y enlazarla desde portada y casos. Validar la demanda antes de ampliar el contenido.",
      source: "https://www.valmesolutions.com/sitemap.xml",
      evidence: "Sitemap público y enlaces HTML de las ocho páginas",
      confidence: "Alta sobre la muestra; demanda de búsqueda pendiente",
    },
    {
      id: "VALME-02",
      title: "Explicar la oferta en el encabezado de portada",
      priority: "Alta",
      observed:
        "El H1 usa un eslogan; el texto de apoyo explica el departamento de marketing. Las páginas de áreas usan nombres de operaciones en inglés.",
      recommendation:
        "Probar un encabezado descriptivo: Tu departamento de marketing externo para pymes B2B. Conservar el eslogan como apoyo y aclarar la relación con las áreas de operaciones.",
      source: "https://www.valmesolutions.com/",
      evidence: "H1 y contenido HTML de portada",
      confidence: "Media: propuesta editorial, no penalización demostrada",
    },
    {
      id: "VALME-03",
      title: "Respaldar un caso de éxito con datos verificables",
      priority: "Alta",
      observed:
        "Los tres casos explican intervenciones y beneficios cualitativos. En el contenido auditado no se publican comparaciones numéricas antes/después ni fuentes para verificarlas.",
      recommendation:
        "Completar un caso con periodo, métrica, resultado y fuente autorizada. Si es un escenario ilustrativo, identificarlo como tal. No inventar cifras.",
      source: "https://www.valmesolutions.com/casos/atribucion-canal-rentable",
      evidence: "Lectura de los tres casos públicos; enlace a una muestra",
      confidence: "Alta sobre el contenido publicado",
    },
    {
      id: "VALME-04",
      title: "Resolver preguntas de contratación y presentar al equipo",
      priority: "Media",
      observed:
        "La muestra enlaza LinkedIn y presenta Organization en JSON-LD. No se encontró una página dedicada de equipo entre los enlaces auditados.",
      recommendation:
        "Añadir responsables reales y respuestas sobre alcance, costes excluidos, medición y colaboración. Validar las condiciones comerciales; no prometer posiciones ni citas en IA.",
      source: "https://www.valmesolutions.com/",
      evidence: "Navegación y marcado Organization del HTML",
      confidence: "Media: oportunidad de claridad y confianza",
    },
    {
      id: "VALME-05",
      title: "Establecer una línea base de captación",
      priority: "Alta",
      observed:
        "No se consultaron Search Console, GA4 ni CRM. La indexación, el tráfico y las conversiones siguen sin verificar; no se afirma que falte analítica.",
      recommendation:
        "Comprobar Search Console y distinguir clic en WhatsApp, contacto y oportunidad cualificada. Registrar una línea base antes de publicar mejoras.",
      source: "https://www.valmesolutions.com/",
      evidence: "Limitación del alcance de esta revisión pública",
      confidence: "Pendiente de acceso a datos",
    },
  ];

  function createReviewStore(storageFactory) {
    let raw;
    let reviews = {};
    let error = "";
    try {
      raw = storageFactory().getItem(KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (
          parsed.schemaVersion !== 1 ||
          parsed.auditId !== ID ||
          !parsed.reviews ||
          typeof parsed.reviews !== "object" ||
          Array.isArray(parsed.reviews)
        )
          throw new Error("schema");
        for (const [id, review] of Object.entries(parsed.reviews)) {
          if (
            !findings.some((f) => f.id === id) ||
            !review ||
            !Object.hasOwn(options, review.decision) ||
            typeof review.note !== "string" ||
            review.note.length > 3000 ||
            typeof review.savedAt !== "string"
          )
            throw new Error("schema");
        }
        reviews = parsed.reviews;
      }
    } catch {
      error = "No se puede leer el progreso local. Los datos existentes no se sobrescribirán.";
    }
    return {
      snapshot: () => JSON.parse(JSON.stringify(reviews)),
      error: () => error,
      save(id, decision, note) {
        if (error) return false;
        if (
          !findings.some((f) => f.id === id) ||
          !Object.hasOwn(options, decision) ||
          typeof note !== "string" ||
          note.length > 3000
        )
          return false;
        const next = { ...reviews, [id]: { decision, note, savedAt: new Date().toISOString() } };
        try {
          const storage = storageFactory();
          if (storage.getItem(KEY) !== raw) {
            error =
              "El progreso cambió en otra pestaña. Exporta o copia tus notas y recarga antes de continuar.";
            return false;
          }
          const value = JSON.stringify({ schemaVersion: 1, auditId: ID, reviews: next });
          storage.setItem(KEY, value);
          raw = value;
          reviews = next;
          return true;
        } catch {
          error = "No se pudo guardar en este navegador. Conserva tus notas antes de salir.";
          return false;
        }
      },
    };
  }

  let store;
  function reviewStore() {
    return store || (store = createReviewStore(() => global.localStorage));
  }
  function entry() {
    return `<section class="v-section v-pilot-entry" aria-label="Piloto VALME"><div><span class="v-mono v-muted">REVISIÓN EXTERNA · 27 SEP 2026</span><h2>VALME · Web pública</h2><p>www.valmesolutions.com · 5 hallazgos para revisar</p></div><button class="v-primary" data-seo-open="${ID}">Abrir piloto VALME →</button></section>`;
  }
  function detail() {
    const saved = reviewStore().snapshot();
    return `<button class="v-back" data-seo-back>← Auditorías</button>${heading("PILOTO / REVISIÓN EXTERNA", "VALME · Web pública", "www.valmesolutions.com", "<button data-pilot-export>Exportar revisión</button>")}
      <div class="v-notice"><strong>Revisión pública realizada por Codex · 27 sep 2026</strong><p>Ocho páginas revisadas mediante HTTP y HTML. No es una ejecución automática de Search OS. Las decisiones se guardan solo en este navegador, sin sincronización con el servidor. Priorizar no publica ni ejecuta cambios.</p></div>
      <section class="v-section"><h2>Resultado técnico</h2><p>Las ocho páginas del sitemap respondieron 200, con título, descripción, un H1 y canonical. Robots permite el rastreo público. Las variantes del dominio redirigen a HTTPS/www y una URL inexistente devuelve 404.</p><p class="v-muted">Sin verificar: indexación en Google, Search Console, GA4, CRM, rendimiento móvil y visibilidad en asistentes.</p><a href="/v2/valme-pilot-evidence.json" download>Descargar evidencias originales (JSON)</a></section>
      <section class="v-section"><h2>Decisiones del Project Manager</h2><p id="v-pilot-count">${Object.values(saved).filter((r) => r.decision !== "pendiente").length} de 5 hallazgos con decisión</p>
      <div class="v-notice" id="v-pilot-error" role="alert" ${reviewStore().error() ? "" : "hidden"}>${safe(reviewStore().error())}</div>
      ${findings
        .map((f) => {
          const r = saved[f.id] || { decision: "pendiente", note: "" };
          return `<article class="v-pilot-finding"><div class="v-flex">${tag(f.priority, f.priority === "Alta" ? "warn" : "dark")}<span class="v-mono">${f.id}</span></div><h3>${safe(f.title)}</h3><p>${safe(f.observed)}</p><p><strong>Propuesta:</strong> ${safe(f.recommendation)}</p><p class="v-small v-muted">Confianza: ${safe(f.confidence)}</p><details><summary>Evidencia y fuente</summary><p>${safe(f.evidence)} · observado el 27 sep 2026</p><a href="${f.source}" target="_blank" rel="noopener noreferrer">Abrir fuente pública actual ↗</a><p class="v-small">La fuente puede haber cambiado desde la revisión.</p></details>
      <form data-pilot-review="${f.id}" class="v-pilot-review"><label for="decision-${f.id}">Decisión<select id="decision-${f.id}" name="decision">${Object.entries(
        options,
      )
        .map(
          ([value, label]) =>
            `<option value="${value}" ${value === r.decision ? "selected" : ""}>${label}</option>`,
        )
        .join(
          "",
        )}</select></label><label for="note-${f.id}">Notas<textarea id="note-${f.id}" name="note" rows="3" maxlength="3000">${safe(r.note)}</textarea></label><div class="v-flex"><button type="submit" ${reviewStore().error() ? "disabled" : ""}>Guardar decisión</button><span class="v-small v-muted" data-pilot-saved>${r.savedAt ? `Guardado local: ${safe(new Date(r.savedAt).toLocaleString("es-ES"))}` : "Sin decisión guardada"}</span></div></form></article>`;
        })
        .join("")}</section>`;
  }

  global.ValmePilot = { id: ID, entry, detail, createReviewStore };
  global.document?.addEventListener("input", (event) => {
    const form = event.target.closest("[data-pilot-review]");
    if (!form) return;
    form.dataset.dirty = "true";
    form.querySelector("[data-pilot-saved]").textContent = "Cambios sin guardar";
  });
  global.addEventListener?.("beforeunload", (event) => {
    if (!document.querySelector('[data-pilot-review][data-dirty="true"]')) return;
    event.preventDefault();
    event.returnValue = "";
  });
  global.document?.addEventListener(
    "click",
    (event) => {
      if (!event.target.closest("[data-seo-back], [data-go], [data-pilot-export]")) return;
      if (!document.querySelector('[data-pilot-review][data-dirty="true"]')) return;
      if (
        !event.target.closest("[data-pilot-export]") &&
        global.confirm("¿Salir sin guardar los cambios pendientes?")
      )
        return;
      event.preventDefault();
      event.stopImmediatePropagation();
      announce("Guarda las decisiones pendientes antes de salir o exportar.");
    },
    true,
  );
  global.document?.addEventListener(
    "change",
    (event) => {
      if (event.target.id !== "v-mobile-select") return;
      if (!document.querySelector('[data-pilot-review][data-dirty="true"]')) return;
      if (global.confirm("¿Salir sin guardar los cambios pendientes?")) return;
      event.stopImmediatePropagation();
      event.target.value = "Auditorías";
    },
    true,
  );
  global.document?.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-pilot-review]");
    if (!form || seoAuditRepository.status().mode !== ValmeSeoAuditRepository.LOCAL_MODE) return;
    event.preventDefault();
    const data = new FormData(form);
    if (
      reviewStore().save(
        form.dataset.pilotReview,
        String(data.get("decision")),
        String(data.get("note")),
      )
    ) {
      delete form.dataset.dirty;
      document.querySelector("#v-pilot-count").textContent =
        `${Object.values(reviewStore().snapshot()).filter((r) => r.decision !== "pendiente").length} de 5 hallazgos con decisión`;
      form.querySelector("[data-pilot-saved]").textContent =
        "Guardado en este navegador · " + new Date().toLocaleTimeString("es-ES");
      announce("Decisión guardada en este navegador.");
    } else {
      const notice = document.querySelector("#v-pilot-error");
      notice.hidden = false;
      notice.textContent = reviewStore().error() || "No se pudo guardar la decisión.";
      announce(notice.textContent);
    }
  });
  global.document?.addEventListener("click", (event) => {
    if (
      !event.target.closest("[data-pilot-export]") ||
      seoAuditRepository.status().mode !== ValmeSeoAuditRepository.LOCAL_MODE
    )
      return;
    const payload = {
      schemaVersion: 1,
      auditId: ID,
      provenance: "Codex external public review, 2026-09-27",
      findings,
      reviews: reviewStore().snapshot(),
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "valme-piloto-revision.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    announce("Exportación de las decisiones guardadas preparada.");
  });
})(window);
