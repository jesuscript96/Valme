import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import postgres from "postgres";

const ROOT = new URL("../../", import.meta.url);
const SUPABASE_CONFIG = new URL("supabase/config.toml", ROOT);
const MIGRATION = new URL("drizzle/migrations/0005_seo_audit_persistence.sql", ROOT);
const VERIFIER = new URL("scripts/staging/verify_seo_audit_rls.sql", ROOT);

export const AUDIT_TABLES = [
  "tenants",
  "tenant_memberships",
  "projects",
  "seo_audits",
  "seo_audit_access_refs",
  "seo_audit_evidence",
  "seo_audit_findings",
  "seo_finding_evidence",
  "seo_service_coverage",
  "seo_audit_state_events",
];

function normalizeProjectRef(value, label) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!/^[a-z0-9]{8,40}$/.test(normalized)) {
    throw new Error(`${label} no tiene el formato de un project ref de Supabase.`);
  }
  return normalized;
}

export function projectRefsFromDatabaseUrl(databaseUrl) {
  let url;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error("STAGING_DB_URL no es una URL PostgreSQL valida.");
  }

  if (!new Set(["postgres:", "postgresql:"]).has(url.protocol)) {
    throw new Error("STAGING_DB_URL debe usar postgres:// o postgresql://.");
  }

  const refs = new Set();
  const hostname = url.hostname.toLowerCase();
  const direct = hostname.match(/^db\.([a-z0-9]{8,40})\.supabase\.co$/);
  const pooled = /(^|\.)pooler\.supabase\.com$/.test(hostname)
    ? decodeURIComponent(url.username)
        .toLowerCase()
        .match(/^postgres\.([a-z0-9]{8,40})$/)
    : null;
  if (direct?.[1]) refs.add(direct[1]);
  if (pooled?.[1]) refs.add(pooled[1]);
  return refs;
}

export function assertStagingTarget({ databaseUrl, stagingProjectRef, productionProjectRef }) {
  const staging = normalizeProjectRef(stagingProjectRef, "STAGING_SUPABASE_PROJECT_REF");
  const production = normalizeProjectRef(productionProjectRef, "project_id de produccion");
  if (staging === production) {
    throw new Error("Bloqueado: el project ref de staging coincide con produccion.");
  }

  const detected = projectRefsFromDatabaseUrl(databaseUrl);
  if (detected.has(production)) {
    throw new Error("Bloqueado: STAGING_DB_URL apunta al proyecto de produccion.");
  }
  if (detected.size !== 1 || !detected.has(staging)) {
    throw new Error(
      "STAGING_DB_URL no demuestra que pertenezca a STAGING_SUPABASE_PROJECT_REF. Usa la URL directa o la del pooler con usuario postgres.<project-ref>.",
    );
  }
  return staging;
}

export function safeErrorMessage(error, databaseUrl) {
  let message = error instanceof Error ? error.message : String(error);
  const secrets = [databaseUrl];
  try {
    const parsed = new URL(databaseUrl);
    secrets.push(parsed.password, decodeURIComponent(parsed.password));
  } catch {}
  for (const secret of secrets.filter((value) => value && value.length >= 4)) {
    message = message.replaceAll(secret, "[redacted]");
  }
  return message;
}

export function assertApplyConfirmation(stagingProjectRef, confirmation) {
  const expected = `apply-0005-to-${stagingProjectRef}`;
  if (confirmation !== expected) {
    throw new Error(`Para aplicar 0005 define STAGING_APPLY_CONFIRM=${expected}.`);
  }
}

export function prepareVerifierSql(source) {
  const prepared = source
    .split(/\r?\n/)
    .flatMap((line) => {
      if (/^\s*\\set\b/.test(line)) return [];
      const echo = line.match(/^\s*\\echo\s+(.+)\s*$/);
      if (!echo) return [line];
      const message = echo[1].replaceAll("'", "''");
      return [`DO $staging_marker$ BEGIN RAISE NOTICE '${message}'; END $staging_marker$;`];
    })
    .join("\n");

  if (/^\s*\\/m.test(prepared)) {
    throw new Error("El verificador contiene un metacomando psql no compatible con este ejecutor.");
  }
  return prepared;
}

export async function readProductionProjectRef() {
  const config = await readFile(SUPABASE_CONFIG, "utf8");
  const match = config.match(/^project_id\s*=\s*"([a-z0-9]+)"\s*$/m);
  if (!match?.[1]) throw new Error("No se pudo leer project_id de supabase/config.toml.");
  return normalizeProjectRef(match[1], "project_id de produccion");
}

async function inspectDatabase(sql) {
  const [baseline] = await sql.unsafe(`
    SELECT
      to_regclass('public.user_access') IS NOT NULL AS user_access,
      to_regclass('public.user_client_access') IS NOT NULL AS user_client_access,
      to_regclass('public.clients') IS NOT NULL AS clients,
      to_regprocedure('auth.uid()') IS NOT NULL AS auth_uid,
      EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') AS authenticated_role,
      EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') AS service_role
  `);
  const rows = await sql.unsafe(`
    SELECT name, to_regclass('public.' || name) IS NOT NULL AS present
    FROM unnest(ARRAY[${AUDIT_TABLES.map((table) => `'${table}'`).join(", ")}]) AS name
    ORDER BY name
  `);
  const missingBaseline = Object.entries(baseline)
    .filter(([, present]) => !present)
    .map(([name]) => name);
  const presentAuditTables = rows.filter((row) => row.present).map((row) => row.name);
  const missingAuditTables = rows.filter((row) => !row.present).map((row) => row.name);
  return { missingBaseline, presentAuditTables, missingAuditTables };
}

function assertDatabaseState(state) {
  if (state.missingBaseline.length) {
    throw new Error(
      `Staging no tiene la Fase 1 completa: falta ${state.missingBaseline.join(", ")}.`,
    );
  }
  if (state.presentAuditTables.length && state.missingAuditTables.length) {
    throw new Error(
      `Staging contiene una aplicacion parcial de 0005. Presentes: ${state.presentAuditTables.join(", ")}; faltan: ${state.missingAuditTables.join(", ")}.`,
    );
  }
}

async function preflight(sql, stagingProjectRef) {
  const [identity] = await sql.unsafe(`
    SELECT current_database() AS database_name, current_user AS database_user,
           current_setting('server_version') AS server_version
  `);
  const state = await inspectDatabase(sql);
  assertDatabaseState(state);
  console.log(`[staging] Conexion validada para ${stagingProjectRef}.`);
  console.log(
    `[staging] PostgreSQL ${identity.server_version}; base ${identity.database_name}; usuario ${identity.database_user}.`,
  );
  console.log(
    state.missingAuditTables.length === 0
      ? "[staging] 0005 ya esta aplicada completamente."
      : "[staging] Fase 1 preparada; 0005 todavia no esta aplicada.",
  );
  return state;
}

async function applyMigration(sql, state) {
  if (state.missingAuditTables.length === 0) {
    console.log("[staging] 0005 ya estaba aplicada; no se ha repetido la migracion.");
    return;
  }
  const migration = await readFile(MIGRATION, "utf8");
  await sql.begin((transaction) => transaction.unsafe(migration));
  const after = await inspectDatabase(sql);
  assertDatabaseState(after);
  if (after.missingAuditTables.length) {
    throw new Error(`0005 termino sin crear: ${after.missingAuditTables.join(", ")}.`);
  }
  console.log("[staging] 0005 aplicada completamente.");
}

async function verifyRls(sql, notices) {
  const state = await inspectDatabase(sql);
  assertDatabaseState(state);
  if (state.missingAuditTables.length) {
    throw new Error("No se puede verificar RLS antes de aplicar 0005.");
  }

  notices.length = 0;
  const verifier = prepareVerifierSql(await readFile(VERIFIER, "utf8"));
  await sql.unsafe(verifier);
  for (let scenario = 1; scenario <= 12; scenario += 1) {
    if (!notices.some((message) => message.startsWith(`OK ${scenario}:`))) {
      throw new Error(`El verificador no confirmo el escenario ${scenario}.`);
    }
  }
  if (!notices.includes("VERIFICACION COMPLETA")) {
    throw new Error("El verificador no alcanzo VERIFICACION COMPLETA.");
  }
  console.log("[staging] 12/12 escenarios RLS correctos; el fixture termino en ROLLBACK.");
}

export async function run(command, env = process.env) {
  if (!new Set(["preflight", "apply", "verify", "all"]).has(command)) {
    throw new Error("Uso: node scripts/staging/seo-audit-staging.mjs <preflight|apply|verify|all>");
  }

  const databaseUrl = env.STAGING_DB_URL;
  if (!databaseUrl) throw new Error("Falta STAGING_DB_URL.");
  const productionProjectRef = await readProductionProjectRef();
  const stagingProjectRef = assertStagingTarget({
    databaseUrl,
    stagingProjectRef: env.STAGING_SUPABASE_PROJECT_REF,
    productionProjectRef,
  });
  if (command === "apply" || command === "all") {
    assertApplyConfirmation(stagingProjectRef, env.STAGING_APPLY_CONFIRM);
  }

  const notices = [];
  const sql = postgres(databaseUrl, {
    max: 1,
    prepare: false,
    ssl: "require",
    connect_timeout: 15,
    idle_timeout: 5,
    onnotice: (notice) => {
      notices.push(notice.message);
      if (notice.message.startsWith("OK ") || notice.message === "VERIFICACION COMPLETA") {
        console.log(`[staging] ${notice.message}`);
      }
    },
  });

  try {
    const state = await preflight(sql, stagingProjectRef);
    if (command === "apply" || command === "all") await applyMigration(sql, state);
    if (command === "verify" || command === "all") await verifyRls(sql, notices);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (invokedPath === import.meta.url) {
  run(process.argv[2]).catch((error) => {
    console.error(`[staging] ERROR: ${safeErrorMessage(error, process.env.STAGING_DB_URL)}`);
    process.exitCode = 1;
  });
}
