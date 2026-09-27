import { readFileSync } from "node:fs";

export function browserConfig(env = process.env) {
  const required = [
    "STAGING_SUPABASE_PROJECT_REF",
    "STAGING_SUPABASE_PUBLISHABLE_KEY",
    "STAGING_E2E_ACTORS",
  ];
  for (const name of required) if (!env[name]) throw new Error(`Missing ${name}`);
  const ref = env.STAGING_SUPABASE_PROJECT_REF;
  const production = readFileSync(new URL("../../supabase/config.toml", import.meta.url), "utf8");
  if (!/^[a-z]{20}$/.test(ref) || production.includes(ref))
    throw new Error("Invalid staging target");
  const key = env.STAGING_SUPABASE_PUBLISHABLE_KEY;
  if (!key.startsWith("sb_publishable_")) throw new Error("Use a staging publishable key");
  let actors;
  try {
    actors = JSON.parse(env.STAGING_E2E_ACTORS);
  } catch {
    throw new Error("Invalid actor configuration");
  }
  for (const name of ["a", "b", "member"]) {
    const actor = actors[name];
    if (
      !actor ||
      typeof actor.email !== "string" ||
      typeof actor.password !== "string" ||
      !actor.password ||
      !/^[a-f0-9-]{36}$/i.test(actor.projectId ?? "")
    )
      throw new Error(`Incomplete actor ${name}`);
  }
  if (
    new Set(Object.values(actors).map((a) => a.email)).size !== 3 ||
    actors.a.projectId === actors.b.projectId ||
    actors.member.projectId !== actors.a.projectId
  )
    throw new Error("Expected distinct users and two projects; member belongs to A");
  return { ref, key, actors, url: `https://${ref}.supabase.co` };
}
