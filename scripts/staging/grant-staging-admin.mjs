// Da rol super_admin activo con cartera completa a una cuenta YA CREADA en Supabase Auth
// de STAGING. Solo staging: reutiliza la validacion del runner de migraciones, que se
// bloquea si la URL apunta al proyecto de produccion.
//
// Uso (la URL de conexion la aporta quien ejecuta, nunca se guarda en el repositorio):
//   STAGING_DB_URL=... STAGING_SUPABASE_PROJECT_REF=<ref> \
//   STAGING_GRANT_CONFIRM=grant-admin-in-<ref> npm run staging:grant-admin -- tu@correo.com
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import postgres from "postgres";
import {
  assertStagingTarget,
  readProductionProjectRef,
  safeErrorMessage,
} from "./seo-audit-staging.mjs";

export function assertGrantInput(email, ref, confirmation) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""))) {
    throw new Error(
      "Indica el correo de la cuenta de staging: npm run staging:grant-admin -- tu@correo.com",
    );
  }
  const expected = `grant-admin-in-${ref}`;
  if (confirmation !== expected) {
    throw new Error(`Para confirmar define STAGING_GRANT_CONFIRM=${expected}.`);
  }
}

export async function run(email, env = process.env) {
  if (!env.STAGING_DB_URL) throw new Error("Falta STAGING_DB_URL.");
  const ref = assertStagingTarget({
    databaseUrl: env.STAGING_DB_URL,
    stagingProjectRef: env.STAGING_SUPABASE_PROJECT_REF,
    productionProjectRef: await readProductionProjectRef(),
  });
  assertGrantInput(email, ref, env.STAGING_GRANT_CONFIRM);

  const sql = postgres(env.STAGING_DB_URL, {
    max: 1,
    prepare: false,
    ssl: "require",
    connect_timeout: 15,
    idle_timeout: 5,
  });
  try {
    const rows = await sql`
      INSERT INTO public.user_access (user_id, email, role, status, full_portfolio)
      SELECT u.id, u.email, 'super_admin', 'activo', true
      FROM auth.users u
      WHERE lower(u.email) = lower(${email})
      ON CONFLICT (user_id) DO UPDATE
        SET role = 'super_admin', status = 'activo', full_portfolio = true
      RETURNING user_id
    `;
    if (!rows.length) {
      throw new Error(
        "No existe esa cuenta en Supabase Auth de staging. Creala antes en Authentication > Users.",
      );
    }
    console.log(`[staging] ${email} es super_admin activo en ${ref} (cartera completa).`);
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
