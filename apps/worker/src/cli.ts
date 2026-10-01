import { agentRunsRepo } from "@valme/os/db/agentRuns";
import { serviceClient } from "@valme/os/db/client";
import { TOOL_NAMES } from "./tools";

/**
 * Encola una ejecución desde la terminal, para probar el worker sin pantalla:
 *
 *   npm run run:agent -w @valme/worker -- <slug-del-cliente> "la tarea" [--tools a,b] [--wait]
 *
 * Usa la clave de servicio, así que sólo sirve donde ya están las credenciales.
 */

const args = process.argv.slice(2);
const [slug, goal] = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--tools");
if (!slug || !goal) {
  console.error(`Uso: run:agent -- <slug-del-cliente> "tarea" [--tools ${TOOL_NAMES.join(",")}] [--wait]`);
  process.exit(1);
}
const tools = args.includes("--tools") ? (args[args.indexOf("--tools") + 1] ?? "").split(",").filter(Boolean) : [];

const db = serviceClient();
const { data: client, error } = await db.from("clients").select("id, name").eq("slug", slug).maybeSingle();
if (error) throw new Error(error.message);
if (!client) {
  console.error(`No hay ningún cliente con slug «${slug}».`);
  process.exit(1);
}

const repo = agentRunsRepo(db);
const id = await repo.create({ clientId: client.id, goal, tools });
console.log(`Encolada ${id} para ${client.name}.`);

if (args.includes("--wait")) {
  for (;;) {
    await new Promise((r) => setTimeout(r, 5_000));
    const run = await repo.get(id);
    if (!run) break;
    process.stdout.write(`\r${run.status}…   `);
    if (["succeeded", "failed", "cancelled"].includes(run.status)) {
      console.log(`\n\n${run.status === "succeeded" ? (run.result as { text: string }).text : run.error}`);
      break;
    }
  }
}
