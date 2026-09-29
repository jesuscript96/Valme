(function installSeoAuditRepository(global) {
  "use strict";

  const SCHEMA_VERSION = 1;
  const LOCAL_MODE = "local-demo";
  const REMOTE_MODE = "supabase";
  const BRIDGE_CHANNEL = "valme:seo-audit:v1";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function validRecords(value) {
    return Array.isArray(value) && value.every((record) => record && typeof record === "object");
  }

  function createLocalRepository(options) {
    const key = options.key;
    const seed = clone(options.seed);
    const storageFactory = options.storageFactory;
    let writable = true;
    let source = "seed";
    let lastError = null;

    function storage() {
      return storageFactory();
    }

    function envelope(records) {
      return {
        schemaVersion: SCHEMA_VERSION,
        savedAt: new Date().toISOString(),
        records: clone(records),
      };
    }

    async function save(records) {
      if (lastError === "unsupported-schema") return false;
      if (!validRecords(records)) {
        writable = false;
        lastError = "invalid-records";
        return false;
      }
      try {
        storage().setItem(key, JSON.stringify(envelope(records)));
        writable = true;
        source = "versioned";
        lastError = null;
        return true;
      } catch {
        writable = false;
        source = "memory";
        lastError = "storage-unavailable";
        return false;
      }
    }

    async function load() {
      try {
        const raw = storage().getItem(key);
        if (!raw) return clone(seed);
        const parsed = JSON.parse(raw);
        if (validRecords(parsed)) {
          source = "legacy";
          await save(parsed);
          return clone(parsed);
        }
        if (parsed && parsed.schemaVersion === SCHEMA_VERSION && validRecords(parsed.records)) {
          source = "versioned";
          return clone(parsed.records);
        }
        source = "memory";
        writable = false;
        lastError = "unsupported-schema";
        return clone(seed);
      } catch {
        writable = false;
        source = "memory";
        lastError = "storage-unavailable";
        return clone(seed);
      }
    }

    async function reset() {
      const records = clone(seed);
      await save(records);
      return records;
    }

    function status() {
      return {
        mode: LOCAL_MODE,
        label: writable ? "Demo local" : "Demo en memoria",
        writable,
        source,
        lastError,
        schemaVersion: SCHEMA_VERSION,
      };
    }

    return Object.freeze({ load, save, reset, status });
  }

  function createDisabledRemoteRepository(options) {
    const seed = clone(options.seed);
    return Object.freeze({
      load: async () => clone(seed),
      save: async () => false,
      reset: async () => clone(seed),
      status: () => ({
        mode: "remote-disabled",
        label: "Persistencia remota bloqueada",
        writable: false,
        source: "memory",
        lastError: "remote-not-ready",
        schemaVersion: SCHEMA_VERSION,
      }),
    });
  }

  function scopeLabel(scope) {
    if (!scope || typeof scope !== "object") return "Alcance remoto registrado.";
    const domains = Array.isArray(scope.includedDomains) ? scope.includedDomains.join(", ") : "";
    const paths = Array.isArray(scope.includedPaths) ? scope.includedPaths.join(", ") : "";
    return [domains && `Dominios: ${domains}`, paths && `Rutas: ${paths}`]
      .filter(Boolean)
      .join(" · ");
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value || "");
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function createRemoteRepository(options) {
    const transport = options.transport;
    let context = {
      clients: [],
      projects: [],
      tenants: [],
      findings: [],
      evidence: [],
      links: [],
      people: [],
      actions: [],
      agents: [],
    };
    let lastError = null;

    const LABELS = {
      priority: { baja: "Baja", media: "Media", alta: "Alta", critica: "Crítica" },
      confidence: { baja: "baja", media: "media", alta: "alta" },
      category: {
        contenido: "Contenido",
        eeat: "E-E-A-T",
        search_console: "Search Console",
        seo_tecnico: "SEO técnico",
        aeo_geo_citabilidad: "AEO/GEO y citabilidad",
        schema_org: "Schema.org",
        ga4: "GA4",
      },
      findingState: {
        propuesto: "Propuesto",
        bloqueado: "Bloqueado",
        devuelto: "Devuelto",
        validado: "Validado",
        descartado: "Descartado",
      },
    };

    function personName(userId) {
      if (!userId) return null;
      const person = context.people.find((item) => item.user_id === userId);
      return person ? person.full_name || person.email : "Otro miembro del equipo";
    }

    const ACTION_LABELS = {
      kind: { investigacion: "Investigación", accion: "Acción del plan" },
      status: {
        pendiente: "Pendiente",
        en_curso: "En curso",
        hecha: "Hecha",
        cancelada: "Cancelada",
      },
    };

    function formatDay(value) {
      if (!value) return null;
      const date = new Date(`${value}T00:00:00`);
      if (Number.isNaN(date.getTime())) return value;
      return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
    }

    function mapAction(item, findingRef, findingTitle) {
      const agent = context.agents.find((candidate) => candidate.id === item.agent_id);
      const open = item.status === "pendiente" || item.status === "en_curso";
      const today = new Date().toISOString().slice(0, 10);
      return {
        id: item.id,
        auditId: item.audit_id,
        findingId: item.finding_id,
        findingRef,
        findingTitle,
        kind: item.kind,
        kindLabel: ACTION_LABELS.kind[item.kind] || item.kind,
        title: item.title,
        detail: item.detail,
        doneCriteria: item.done_criteria || "",
        owner: personName(item.owner_user_id) || "PM asignado",
        agent: agent ? agent.nombre : null,
        dueDate: item.due_date || null,
        dueLabel: formatDay(item.due_date),
        overdue: Boolean(open && item.due_date && item.due_date < today),
        status: item.status,
        statusLabel: ACTION_LABELS.status[item.status] || item.status,
        open,
        conclusion: item.conclusion || "",
        outcome: item.outcome || null,
        closedBy: personName(item.completed_by),
        closedAt: item.completed_at ? formatDate(item.completed_at) : null,
      };
    }

    // Responsables posibles: PM o super admin activos visibles para la sesión.
    function team() {
      return {
        pms: context.people
          .filter(
            (person) =>
              person.status === "activo" &&
              (person.role === "project_manager" || person.role === "super_admin"),
          )
          .map((person) => ({ id: person.user_id, name: person.full_name || person.email })),
        agents: context.agents.map((agent) => ({
          id: agent.id,
          name: agent.nombre,
          specialty: agent.especialidad,
          availability: agent.disponibilidad,
        })),
      };
    }

    // H-01, H-02… salen de la posición en la lista, así que el orden tiene que ser estable.
    // Una revisión importada de una vez comparte created_at y Postgres devuelve los empates
    // en cualquier orden (la fila recién editada suele ir al final): se desempata por
    // prioridad y título, que no cambian.
    const PRIORITY_RANK = { critica: 0, alta: 1, media: 2, baja: 3 };

    function compareFindings(a, b) {
      return (
        String(a.created_at || "").localeCompare(String(b.created_at || "")) ||
        (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9) ||
        String(a.title).localeCompare(String(b.title), "es") ||
        String(a.id).localeCompare(String(b.id))
      );
    }

    function auditArtifacts(auditId) {
      const evidence = context.evidence
        .filter((item) => item.audit_id === auditId)
        .map((item, index) => ({
          id: `E-${String(index + 1).padStart(2, "0")}`,
          dbId: item.id,
          source: item.source,
          resource: item.url_or_resource,
          method: item.collection_method,
          observed: item.observed_data,
          observedAt: formatDate(item.observed_at),
          trusted: !item.contains_external_untrusted_data,
        }));
      const refByEvidence = new Map(evidence.map((item) => [item.dbId, item.id]));
      const findings = context.findings
        .filter((item) => item.audit_id === auditId)
        .sort(compareFindings)
        .map((item, index) => ({
          id: `H-${String(index + 1).padStart(2, "0")}`,
          dbId: item.id,
          priority: LABELS.priority[item.priority] || item.priority,
          title: item.title,
          category:
            LABELS.category[item.category] ||
            item.category.charAt(0).toUpperCase() + item.category.slice(1).replaceAll("_", " "),
          confidence: LABELS.confidence[item.confidence] || item.confidence,
          status: LABELS.findingState[item.state] || item.state,
          description: item.description,
          impact: item.impact,
          recommendation: item.recommendation,
          responsible: item.responsible_name,
          limitations: item.limitations || [],
          evidenceIds: context.links
            .filter((link) => link.finding_id === item.id)
            .map((link) => refByEvidence.get(link.evidence_id))
            .filter(Boolean),
          actions: context.actions
            .filter((action) => action.finding_id === item.id)
            .map((action) =>
              mapAction(action, `H-${String(index + 1).padStart(2, "0")}`, item.title),
            ),
          review: {
            decision: item.review_decision || "pendiente",
            note: item.review_note || "",
            by: personName(item.reviewed_by),
            at: item.reviewed_at ? formatDate(item.reviewed_at) : null,
          },
        }));
      const actions = findings.flatMap((finding) => finding.actions);
      return { evidence, findings, actions };
    }

    function allProjects() {
      const clients = new Map(context.clients.map((client) => [client.id, client]));
      return context.projects.map((project) => ({
        id: project.id,
        clientId: project.client_id,
        client: clients.get(project.client_id)?.nombre || "Cliente asignado",
        clientArchived: Boolean(clients.get(project.client_id)?.archived_at),
        project: project.nombre,
        domain: project.primary_domain,
      }));
    }

    // Solo proyectos de clientes activos admiten auditorías nuevas.
    function projectOptions() {
      return allProjects().filter((project) => !project.clientArchived);
    }

    function clientList() {
      const projects = allProjects();
      return context.clients.map((client) => ({
        id: client.id,
        name: client.nombre,
        sector: client.sector || "General",
        tenantId: client.tenant_id,
        archivedAt: client.archived_at || null,
        projects: projects.filter((project) => project.clientId === client.id),
      }));
    }

    function tenantList() {
      return context.tenants.map((tenant) => ({
        id: tenant.id,
        name: tenant.nombre,
        role: tenant.role,
        canManage: tenant.role === "owner" || tenant.role === "manager",
      }));
    }

    function mapAudit(row) {
      const project = allProjects().find((item) => item.id === row.project_id);
      const artifacts = auditArtifacts(row.id);
      return {
        id: row.id,
        displayId: `AUD-${String(row.id).slice(0, 8).toUpperCase()}`,
        projectId: row.project_id,
        clientId: row.client_id,
        archivedAt: row.archived_at || null,
        archivedAtLabel: row.archived_at ? formatDate(row.archived_at) : null,
        clientArchived: Boolean(project?.clientArchived),
        client: project?.client || "Cliente asignado",
        project: project?.project || "Proyecto asignado",
        domain: row.primary_domain,
        state: row.state,
        services: row.service_ids,
        capabilities: row.requested_capability_ids,
        markets: row.markets,
        languages: row.languages,
        requestedBy: personName(row.requested_by) || "Usuario autenticado",
        createdAt: formatDate(row.created_at),
        limits: {
          pages: row.max_pages,
          minutes: row.max_duration_minutes,
          cost: `${Number(row.max_cost_amount).toFixed(2)} ${row.currency}`,
        },
        scope: scopeLabel(row.authorized_scope),
        authorizedScope: row.authorized_scope,
        accesses: [],
        evidence: artifacts.evidence,
        findings: artifacts.findings,
        actions: artifacts.actions,
        remote: true,
        coverage: row.service_ids.map((service) => ({
          service,
          state: "pendiente_justificado",
          reason: "Cobertura detallada pendiente de carga.",
        })),
        events: [
          `${formatDate(row.created_at)} · Borrador registrado`,
          ...(row.transition_reason
            ? [`${formatDate(row.updated_at)} · ${row.transition_reason}`]
            : []),
        ],
      };
    }

    async function load() {
      try {
        const workspace = await transport("load");
        context = {
          clients: workspace.clients || [],
          projects: workspace.projects || [],
          tenants: workspace.tenants || [],
          findings: workspace.findings || [],
          evidence: workspace.evidence || [],
          links: workspace.links || [],
          people: workspace.people || [],
          actions: workspace.actions || [],
          agents: workspace.agents || [],
        };
        lastError = null;
        return workspace.audits.map(mapAudit);
      } catch (error) {
        lastError = "remote-unavailable";
        throw error;
      }
    }

    async function createDraft(input) {
      try {
        const row = await transport("createDraft", input);
        lastError = null;
        return mapAudit(row);
      } catch (error) {
        lastError = "remote-write-failed";
        throw error;
      }
    }

    async function transition(input) {
      try {
        const row = await transport("transition", input);
        lastError = null;
        return mapAudit(row);
      } catch (error) {
        lastError = "remote-write-failed";
        throw error;
      }
    }

    // Las escrituras de clientes y archivado devuelven el resultado del servidor; quien
    // llama recarga el espacio de trabajo para ver el estado autoritativo.
    // Un rechazo explicado (permiso, archivado) no marca el repositorio como inservible.
    async function write(action, input) {
      const result = await transport(action, input);
      lastError = null;
      return result;
    }

    return Object.freeze({
      load,
      createDraft,
      transition,
      addClient: (input) => write("addClient", input),
      setClientArchived: (input) => write("setClientArchived", input),
      setAuditArchived: (input) => write("setAuditArchived", input),
      importReview: (input) => write("importReview", input),
      reviewFinding: (input) => write("reviewFinding", input),
      createAction: (input) => write("createAction", input),
      updateAction: (input) => write("updateAction", input),
      runAgent: (input) => write("runAgent", input),
      team,
      projects: projectOptions,
      clients: clientList,
      tenants: tenantList,
      save: async () => false,
      reset: load,
      status: () => ({
        mode: REMOTE_MODE,
        label: "Supabase · sesión autenticada",
        writable: lastError === null,
        source: "remote",
        lastError,
        schemaVersion: SCHEMA_VERSION,
      }),
    });
  }

  // El panel vive en un iframe srcdoc: location.origin vale "null" y el origen real,
  // heredado del documento padre, está en window.origin.
  function frameOrigin() {
    return global.origin && global.origin !== "null" ? global.origin : global.location.origin;
  }

  function createParentTransport(options = {}) {
    const target = options.target || global.parent;
    const timeoutMs = options.timeoutMs || 15000;
    const pending = new Map();

    global.addEventListener("message", (event) => {
      const message = event.data;
      if (
        event.origin !== frameOrigin() ||
        event.source !== target ||
        !message ||
        message.channel !== BRIDGE_CHANNEL ||
        message.kind !== "response"
      )
        return;
      const request = pending.get(message.id);
      if (!request) return;
      pending.delete(message.id);
      global.clearTimeout(request.timer);
      if (message.ok) request.resolve(message.data);
      else request.reject(new Error(message.error || "La operación remota ha fallado."));
    });

    return (action, payload) =>
      new Promise((resolve, reject) => {
        const id = global.crypto.randomUUID();
        const timer = global.setTimeout(() => {
          pending.delete(id);
          reject(new Error("La operación remota ha superado el tiempo de espera."));
        }, timeoutMs);
        pending.set(id, { resolve, reject, timer });
        target.postMessage(
          { channel: BRIDGE_CHANNEL, kind: "request", id, action, payload },
          frameOrigin(),
        );
      });
  }

  function create(options) {
    if (!options || !validRecords(options.seed)) {
      throw new TypeError("El repositorio requiere una colección inicial válida.");
    }
    if (options.mode === REMOTE_MODE && typeof options.transport === "function") {
      return createRemoteRepository(options);
    }
    if (options.mode !== LOCAL_MODE) return createDisabledRemoteRepository(options);
    if (typeof options.storageFactory !== "function" || !options.key) {
      throw new TypeError("El modo local requiere storageFactory y key.");
    }
    return createLocalRepository(options);
  }

  global.ValmeSeoAuditRepository = Object.freeze({
    create,
    createParentTransport,
    LOCAL_MODE,
    REMOTE_MODE,
    SCHEMA_VERSION,
  });
})(globalThis);
