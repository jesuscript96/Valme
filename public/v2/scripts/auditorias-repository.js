(function installSeoAuditRepository(global) {
  "use strict";

  const SCHEMA_VERSION = 1;
  const LOCAL_MODE = "local-demo";

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

  function create(options) {
    if (!options || !validRecords(options.seed)) {
      throw new TypeError("El repositorio requiere una colección inicial válida.");
    }
    if (options.mode !== LOCAL_MODE) return createDisabledRemoteRepository(options);
    if (typeof options.storageFactory !== "function" || !options.key) {
      throw new TypeError("El modo local requiere storageFactory y key.");
    }
    return createLocalRepository(options);
  }

  global.ValmeSeoAuditRepository = Object.freeze({
    create,
    LOCAL_MODE,
    SCHEMA_VERSION,
  });
})(globalThis);
