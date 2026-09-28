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
    let context = { clients: [], projects: [], tenants: [] };
    let lastError = null;

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
        requestedBy: "Usuario autenticado",
        createdAt: formatDate(row.created_at),
        limits: {
          pages: row.max_pages,
          minutes: row.max_duration_minutes,
          cost: `${Number(row.max_cost_amount).toFixed(2)} ${row.currency}`,
        },
        scope: scopeLabel(row.authorized_scope),
        authorizedScope: row.authorized_scope,
        accesses: [],
        evidence: [],
        findings: [],
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
