import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { runInNewContext } from "node:vm";

const source = readFileSync(
  new URL("../../../public/v2/scripts/auditorias-repository.js", import.meta.url),
  "utf8",
);

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

type Repository = {
  load(): Promise<unknown[]>;
  save(records: unknown[]): Promise<boolean>;
  reset(): Promise<unknown[]>;
  status(): {
    mode: string;
    writable: boolean;
    source: string;
    lastError: string | null;
    schemaVersion: number;
  };
};

type RepositoryApi = {
  LOCAL_MODE: string;
  SCHEMA_VERSION: number;
  create(options: {
    mode: string;
    key: string;
    seed: unknown[];
    storageFactory?: () => StorageLike;
  }): Repository;
};

function loadApi(): RepositoryApi {
  const context: Record<string, unknown> = {};
  runInNewContext(source, context);
  return context["ValmeSeoAuditRepository"] as RepositoryApi;
}

// Values created inside the vm context carry its own prototypes; normalise before deep comparison.
function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function memoryStorage(initial?: Record<string, string>) {
  const values = new Map(Object.entries(initial ?? {}));
  const storage: StorageLike = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  return { storage, values };
}

describe("SEO audit browser repository", () => {
  it("stores a versioned envelope and returns defensive copies", async () => {
    const api = loadApi();
    const { storage, values } = memoryStorage();
    const seed = [{ id: "AUD-1", state: "borrador" }];
    const repository = api.create({
      mode: api.LOCAL_MODE,
      key: "audits",
      seed,
      storageFactory: () => storage,
    });

    const records = await repository.load();
    records[0] = { id: "MUTATED" };
    assert.deepEqual(plain(await repository.reset()), seed);

    const saved = JSON.parse(values.get("audits") ?? "null") as {
      schemaVersion: number;
      records: unknown[];
    };
    assert.equal(saved.schemaVersion, api.SCHEMA_VERSION);
    assert.deepEqual(saved.records, seed);
    assert.equal(repository.status().source, "versioned");
  });

  it("migrates the PR 9 array format without losing records", async () => {
    const api = loadApi();
    const legacy = [{ id: "AUD-LEGACY", state: "borrador" }];
    const { storage, values } = memoryStorage({ audits: JSON.stringify(legacy) });
    const repository = api.create({
      mode: api.LOCAL_MODE,
      key: "audits",
      seed: [],
      storageFactory: () => storage,
    });

    assert.deepEqual(plain(await repository.load()), legacy);
    const migrated = JSON.parse(values.get("audits") ?? "null") as {
      schemaVersion: number;
      records: unknown[];
    };
    assert.equal(migrated.schemaVersion, 1);
    assert.deepEqual(migrated.records, legacy);
  });

  it("falls back to memory when browser storage is unavailable", async () => {
    const api = loadApi();
    const seed = [{ id: "AUD-SAFE", state: "borrador" }];
    const repository = api.create({
      mode: api.LOCAL_MODE,
      key: "audits",
      seed,
      storageFactory: () => {
        throw new Error("storage blocked");
      },
    });

    assert.deepEqual(plain(await repository.load()), seed);
    assert.equal(await repository.save(seed), false);
    assert.deepEqual(plain(repository.status()), {
      mode: "local-demo",
      label: "Demo en memoria",
      writable: false,
      source: "memory",
      lastError: "storage-unavailable",
      schemaVersion: 1,
    });
  });

  it("never overwrites data saved with an unknown schema version", async () => {
    const api = loadApi();
    const future = JSON.stringify({ schemaVersion: 99, records: [{ id: "AUD-FUTURE" }] });
    const { storage, values } = memoryStorage({ audits: future });
    const seed = [{ id: "AUD-SAFE", state: "borrador" }];
    const repository = api.create({
      mode: api.LOCAL_MODE,
      key: "audits",
      seed,
      storageFactory: () => storage,
    });

    assert.deepEqual(plain(await repository.load()), seed);
    assert.equal(await repository.save(seed), false);
    assert.deepEqual(plain(await repository.reset()), seed);
    assert.equal(values.get("audits"), future);
    assert.equal(repository.status().writable, false);
    assert.equal(repository.status().lastError, "unsupported-schema");
  });

  it("fails closed when remote persistence is requested prematurely", async () => {
    const api = loadApi();
    const seed = [{ id: "AUD-SAFE", state: "borrador" }];
    const repository = api.create({ mode: "supabase", key: "audits", seed });

    assert.deepEqual(plain(await repository.load()), seed);
    assert.equal(await repository.save(seed), false);
    assert.equal(repository.status().mode, "remote-disabled");
    assert.equal(repository.status().lastError, "remote-not-ready");
  });

  it("contains no network client or credential material", () => {
    assert.doesNotMatch(source, /\bfetch\s*\(/);
    assert.doesNotMatch(source, /supabase/i);
    assert.doesNotMatch(source, /service_role|anon_key|bearer\s+[a-z0-9]/i);
  });
});
