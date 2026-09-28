// Arranca la aplicación en local contra el proyecto Supabase de STAGING con el modo remoto
// de Clientes y Auditorías activado. Nunca apunta a producción: el project ref se valida
// contra supabase/config.toml y la clave debe ser una clave publicable.
//
// Uso: crea .env.staging.local (ignorado por git) con
//   STAGING_SUPABASE_PROJECT_REF=<ref de staging>
//   STAGING_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
// y ejecuta: npm run dev:staging
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = new URL("../../", import.meta.url);
export const DEV_STAGING_PORT = 4180;

export function parseEnvFile(text) {
  const values = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match || line.trim().startsWith("#")) continue;
    values[match[1]] = match[2].replace(/^(["'])(.*)\1$/, "$2");
  }
  return values;
}

export function devStagingEnv(fileEnv, baseEnv, productionConfig) {
  const ref = String(fileEnv.STAGING_SUPABASE_PROJECT_REF || "").trim();
  const key = String(fileEnv.STAGING_SUPABASE_PUBLISHABLE_KEY || "").trim();
  if (!/^[a-z]{20}$/.test(ref)) {
    throw new Error("STAGING_SUPABASE_PROJECT_REF no tiene el formato de un project ref.");
  }
  if (productionConfig.includes(ref)) {
    throw new Error("Bloqueado: el project ref indicado es el de produccion.");
  }
  if (!key.startsWith("sb_publishable_")) {
    throw new Error("Usa la clave publicable de staging (sb_publishable_...).");
  }
  const url = `https://${ref}.supabase.co`;
  const env = {
    ...baseEnv,
    SUPABASE_URL: url,
    VITE_SUPABASE_URL: url,
    SUPABASE_PUBLISHABLE_KEY: key,
    VITE_SUPABASE_PUBLISHABLE_KEY: key,
    SUPABASE_PROJECT_ID: ref,
    VITE_SUPABASE_PROJECT_ID: ref,
    SEO_AUDIT_REMOTE_ENABLED: "true",
    SEO_AUDIT_REMOTE_ENVIRONMENT: "staging",
    SEO_AUDIT_REMOTE_PROJECT_REF: ref,
  };
  // Ninguna clave de administracion viaja al servidor de desarrollo.
  delete env.SUPABASE_SERVICE_ROLE_KEY;
  return { env, ref, url };
}

function main() {
  const file = new URL(".env.staging.local", ROOT);
  if (!existsSync(file)) {
    throw new Error(
      "Falta .env.staging.local con STAGING_SUPABASE_PROJECT_REF y STAGING_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  const production = readFileSync(new URL("supabase/config.toml", ROOT), "utf8");
  const { env, ref } = devStagingEnv(
    parseEnvFile(readFileSync(file, "utf8")),
    process.env,
    production,
  );
  console.log(`[dev:staging] Staging ${ref} · http://localhost:${DEV_STAGING_PORT}/panel`);
  console.log("[dev:staging] Clientes y Auditorias usan datos reales de staging.");
  const child = spawn(
    "npx",
    [
      "vite",
      "dev",
      "--config",
      "scripts/staging/vite.dev-staging.config.ts",
      "--port",
      String(DEV_STAGING_PORT),
      "--strictPort",
    ],
    {
      env,
      stdio: "inherit",
      shell: process.platform === "win32",
    },
  );
  child.on("exit", (code) => process.exit(code ?? 0));
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (invokedPath === import.meta.url) {
  try {
    main();
  } catch (error) {
    console.error(`[dev:staging] ERROR: ${error instanceof Error ? error.message : error}`);
    process.exitCode = 1;
  }
}
