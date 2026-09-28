// Clientes en modo real (staging): lista, alta, ficha con proyectos y auditorías, y
// archivado reversible. Solo actúa cuando auditorias.js ha activado el repositorio
// remoto; en modo demostración la sección Clientes sigue siendo la de app.js.
(function installRemoteClients() {
  "use strict";

  const demoClientList = clientList;
  const state = { view: "list", clientId: null, query: "", showArchived: false, saving: false };

  function remoteActive() {
    return typeof seoAuditIsRemote === "function" && seoAuditIsRemote();
  }

  function remoteClients() {
    return seoAuditRepository.clients();
  }

  function auditsOf(clientId) {
    return seoAudits.filter((audit) => audit.clientId === clientId);
  }

  function archivedLabel(value) {
    return new Date(value).toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function listView() {
    const q = state.query.trim().toLowerCase();
    const all = remoteClients();
    const archivedCount = all.filter((client) => client.archivedAt).length;
    const rows = all
      .filter((client) => state.showArchived || !client.archivedAt)
      .filter(
        (client) =>
          !q ||
          [client.name, client.sector, ...client.projects.map((p) => p.domain)].some((value) =>
            String(value).toLowerCase().includes(q),
          ),
      );
    return (
      heading(
        "CARTERA / STAGING",
        "Clientes",
        "Clientes reales del entorno de staging, con sus proyectos y auditorías.",
        '<button class="v-primary" data-rc-new>+ Nuevo cliente</button>',
      ) +
      `<div class="v-tools v-rc-tools">
        <label class="v-search">Buscar<input id="v-rc-search" type="search" value="${safe(state.query)}" placeholder="Nombre, sector o dominio"></label>
        <label class="v-check"><input type="checkbox" id="v-rc-archived" ${state.showArchived ? "checked" : ""}>Mostrar archivados (${archivedCount})</label>
      </div>
      <div class="v-panel">${
        rows
          .map((client) => {
            const audits = auditsOf(client.id).filter((audit) => !audit.archivedAt);
            return `<div class="v-row"><div><div class="v-flex">${client.archivedAt ? tag("Archivado") : tag("Activo", "good")}<span class="v-small v-muted">${safe(client.sector)}</span></div>
              <strong>${safe(client.name)}</strong>
              <p>${safe(client.projects.map((p) => p.domain).join(" · ") || "Sin proyectos")} · ${audits.length} ${audits.length === 1 ? "auditoría" : "auditorías"}</p></div>
              <button data-rc-open="${safe(client.id)}" aria-label="Abrir ficha de ${safe(client.name)}">Abrir →</button></div>`;
          })
          .join("") ||
        `<div class="v-audit-empty"><strong>${all.length ? "No hay clientes con estos filtros." : "Todavía no hay clientes en staging."}</strong><p>${all.length ? "Cambia la búsqueda o muestra los archivados." : "Da de alta el primero con «+ Nuevo cliente»."}</p></div>`
      }</div>`
    );
  }

  function newView() {
    const tenants = seoAuditRepository.tenants().filter((tenant) => tenant.canManage);
    return (
      `<button class="v-back" data-rc-back>← Clientes</button>` +
      heading(
        "ALTA EN STAGING",
        "Nuevo cliente",
        "Se crea el cliente con su primer proyecto. Después podrás abrir auditorías desde su ficha.",
      ) +
      (tenants.length
        ? ""
        : '<div class="v-notice"><strong>No gestionas ninguna organización.</strong><p>Para dar de alta clientes necesitas rol de manager en una organización y ser super admin o Project Manager con cartera completa.</p></div>') +
      `<form id="v-rc-form" class="v-audit-form">
        <section class="v-audit-form-section"><div><span class="v-mono v-muted">01 / CLIENTE</span><h2>Datos básicos</h2></div><div class="v-audit-fields">
          <label>Nombre<input name="nombre" required maxlength="120" autocomplete="organization" placeholder="VALME Solutions"></label>
          <label>Sector<input name="sector" maxlength="80" placeholder="Consultoría B2B"></label>
          ${tenants.length > 1 ? `<label class="v-audit-wide">Organización<select name="tenantId" required>${tenants.map((tenant) => `<option value="${safe(tenant.id)}">${safe(tenant.name)}</option>`).join("")}</select></label>` : ""}
        </div></section>
        <section class="v-audit-form-section"><div><span class="v-mono v-muted">02 / PROYECTO</span><h2>Primer proyecto</h2></div><div class="v-audit-fields">
          <label>Nombre del proyecto<input name="projectName" required maxlength="120" value="Web principal"></label>
          <label>Dominio<input name="primaryDomain" required maxlength="253" inputmode="url" placeholder="valmesolutions.com"></label>
        </div></section>
        <div class="v-flex"><button class="v-primary" type="submit" ${tenants.length && !state.saving ? "" : "disabled"}>${state.saving ? "Guardando…" : "Dar de alta"}</button><button type="button" data-rc-back>Cancelar</button></div>
      </form>`
    );
  }

  function detailView(client) {
    const audits = auditsOf(client.id);
    const archived = Boolean(client.archivedAt);
    return (
      `<button class="v-back" data-rc-back>← Clientes</button>` +
      heading(
        client.sector.toUpperCase(),
        client.name,
        client.projects.map((p) => p.domain).join(" · ") || "Sin proyectos",
        archived ? tag("Archivado") : tag("Activo", "good"),
      ) +
      (archived
        ? `<div class="v-notice v-audit-archived"><div><strong>Cliente archivado · ${safe(archivedLabel(client.archivedAt))}</strong><p>Fuera del trabajo diario. Sus auditorías quedan en solo lectura y no admite trabajo nuevo hasta restaurarlo. No se ha borrado nada.</p></div><button data-rc-restore="${safe(client.id)}">Restaurar cliente</button></div>`
        : "") +
      `<section class="v-section"><div class="v-section-head"><h2>Proyectos</h2><span class="v-mono">${client.projects.length} ACTIVOS</span></div>
        <div class="v-panel">${
          client.projects
            .map(
              (
                project,
              ) => `<div class="v-row"><div><strong>${safe(project.project)}</strong><p>${safe(project.domain)}</p></div>
              ${archived ? "" : `<button data-rc-new-audit="${safe(project.id)}">Nueva auditoría →</button>`}</div>`,
            )
            .join("") || '<div class="v-audit-empty"><strong>Sin proyectos activos.</strong></div>'
        }</div></section>
      <section class="v-section"><div class="v-section-head"><h2>Auditorías</h2><span class="v-mono">${audits.length} EN TOTAL</span></div>
        <div class="v-panel">${
          audits
            .map(
              (
                audit,
              ) => `<div class="v-row"><div><div class="v-flex">${tag(seoAuditLabel(audit.state), seoAuditTone(audit.state))}${audit.archivedAt ? tag("Archivada") : ""}</div>
              <strong>${safe(audit.project)} · ${safe(audit.domain)}</strong><p><span class="v-mono">${safe(audit.displayId || audit.id)}</span> · creada ${safe(audit.createdAt)}</p></div>
              <button data-rc-open-audit="${safe(audit.id)}">Abrir →</button></div>`,
            )
            .join("") ||
          '<div class="v-audit-empty"><strong>Sin auditorías.</strong><p>Crea la primera desde uno de sus proyectos.</p></div>'
        }</div></section>
      ${
        archived
          ? ""
          : `<section class="v-section"><div class="v-panel v-rc-danger"><div class="v-section-head"><div><h2>Archivar cliente</h2><p class="v-small v-muted">Lo retira del trabajo diario y deja sus auditorías en solo lectura. Es reversible y no borra evidencias ni historial.</p></div><button data-rc-archive="${safe(client.id)}">Archivar cliente</button></div></div></section>`
      }`
    );
  }

  function remoteView() {
    if (seoAuditRepositoryLoading) {
      return heading("CARTERA / STAGING", "Clientes", "Cargando clientes autorizados.");
    }
    if (state.view === "new") return newView();
    if (state.view === "detail") {
      const client = remoteClients().find((item) => item.id === state.clientId);
      if (client) return detailView(client);
      state.view = "list";
    }
    return listView();
  }

  // app.js resuelve la sección Clientes llamando a clientList en cada render.
  clientList = function () {
    return remoteActive() ? remoteView() : demoClientList();
  };

  function show(message) {
    render("Clientes");
    if (message) announce(message);
  }

  async function reloadAndShow(message) {
    await seoAuditLoadRepository();
    show(message);
  }

  async function setArchived(clientId, archived) {
    const client = remoteClients().find((item) => item.id === clientId);
    if (!client) return;
    const question = archived
      ? `¿Archivar ${client.name}? Saldrá del trabajo diario y sus auditorías quedarán en solo lectura. Podrás restaurarlo cuando quieras; no se borra nada.`
      : `¿Restaurar ${client.name}? Volverá al trabajo diario y sus auditorías podrán avanzar de nuevo.`;
    if (!window.confirm(question)) return;
    try {
      await seoAuditRepository.setClientArchived({ clientId, archived });
      await reloadAndShow(archived ? `${client.name} archivado.` : `${client.name} restaurado.`);
    } catch (error) {
      show(`No se pudo ${archived ? "archivar" : "restaurar"}: ${error.message}`);
    }
  }

  // Volver a la lista al entrar en la sección desde la navegación.
  root.addEventListener(
    "click",
    (event) => {
      if (event.target.closest("button")?.dataset.go === "Clientes") state.view = "list";
    },
    true,
  );
  root.addEventListener(
    "change",
    (event) => {
      if (event.target.id === "v-mobile-select" && event.target.value === "Clientes") {
        state.view = "list";
      }
    },
    true,
  );

  root.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button || !remoteActive()) return;
    const data = button.dataset;
    if (data.rcNew !== undefined) {
      state.view = "new";
      show("Alta de cliente.");
    } else if (data.rcBack !== undefined) {
      state.view = "list";
      show("Lista de clientes.");
    } else if (data.rcOpen) {
      state.view = "detail";
      state.clientId = data.rcOpen;
      show("Ficha del cliente abierta.");
    } else if (data.rcArchive) {
      await setArchived(data.rcArchive, true);
    } else if (data.rcRestore) {
      await setArchived(data.rcRestore, false);
    } else if (data.rcOpenAudit) {
      seoAuditCreating = false;
      seoAuditCurrent = data.rcOpenAudit;
      seoAuditTab = "Resumen";
      render("Auditorías");
      announce("Expediente abierto.");
    } else if (data.rcNewAudit) {
      seoAuditCurrent = null;
      seoAuditCreating = true;
      seoAuditPresetProject = data.rcNewAudit;
      render("Auditorías");
      announce("Nuevo borrador de auditoría para el proyecto elegido.");
    }
  });

  root.addEventListener("input", (event) => {
    if (event.target.id !== "v-rc-search" || !remoteActive()) return;
    state.query = event.target.value;
    const panel = page.querySelector(".v-panel");
    const fresh = document.createElement("div");
    fresh.innerHTML = listView();
    const next = fresh.querySelector(".v-panel");
    if (panel && next) panel.replaceWith(next);
    decorate();
  });

  root.addEventListener("change", (event) => {
    if (event.target.id !== "v-rc-archived" || !remoteActive()) return;
    state.showArchived = event.target.checked;
    show(state.showArchived ? "Mostrando archivados." : "Archivados ocultos.");
  });

  root.addEventListener("submit", async (event) => {
    if (event.target.id !== "v-rc-form" || !remoteActive()) return;
    event.preventDefault();
    if (state.saving) return;
    const form = new FormData(event.target);
    const input = {
      nombre: String(form.get("nombre") || "").trim(),
      projectName: String(form.get("projectName") || "").trim(),
      primaryDomain: String(form.get("primaryDomain") || "").trim(),
    };
    const sector = String(form.get("sector") || "").trim();
    if (sector) input.sector = sector;
    const tenantId = form.get("tenantId");
    if (tenantId) input.tenantId = String(tenantId);
    state.saving = true;
    show("Dando de alta el cliente.");
    try {
      const created = await seoAuditRepository.addClient(input);
      state.saving = false;
      state.view = "detail";
      state.clientId = created.client.id;
      await reloadAndShow(`${created.client.nombre} dado de alta con su proyecto.`);
    } catch (error) {
      state.saving = false;
      state.view = "new";
      show(`No se pudo dar de alta: ${error.message}`);
      // Conservar lo escrito tras el re-render.
      const again = page.querySelector("#v-rc-form");
      if (again) {
        for (const [name, value] of Object.entries({ ...input, sector })) {
          const field = again.elements.namedItem(name);
          if (field && "value" in field) field.value = value;
        }
      }
    }
  });
})();
