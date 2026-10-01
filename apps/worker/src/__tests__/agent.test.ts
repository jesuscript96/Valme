import { strict as assert } from "node:assert";
import { test } from "node:test";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { AgentFailure, contentToEcho, runAgent, usageOf, type AgentDeps, type AgentStep } from "../agent";
import { defineTool, toApiTool, type Tool, type ToolContext } from "../tools/types";
import { toolsFor, TOOLS_V0 } from "../tools";

type Msg = Anthropic.Beta.BetaMessage;
const msg = (content: unknown[], stop_reason: string, usage: Record<string, unknown> = { input_tokens: 100, output_tokens: 10 }): Msg =>
  ({ id: "m", type: "message", role: "assistant", model: "claude-opus-5-5", content, stop_reason, usage }) as unknown as Msg;

const eco = defineTool({
  name: "eco",
  description: "devuelve lo que recibe",
  input: z.object({ texto: z.string() }),
  run: async ({ texto }) => `eco: ${texto}`,
});

function deps(respuestas: Msg[], extra: Partial<AgentDeps> = {}) {
  const pasos: AgentStep[] = [];
  const llamadas: Anthropic.Beta.MessageCreateParamsNonStreaming[] = [];
  const ctx: ToolContext = {
    runId: "r", clientId: "c",
    browser: async () => { throw new Error("sin navegador"); },
    saveAudit: async () => "a1",
    signal: new AbortController().signal,
  };
  const d: AgentDeps = {
    callModel: async (p) => {
      llamadas.push(structuredClone(p));
      const r = respuestas.shift();
      if (!r) throw new Error("el test no esperaba otra llamada");
      return r;
    },
    model: "claude-opus-5-5",
    anthropicFeatures: true,
    recordStep: async (s) => { pasos.push(s); },
    isCancelled: async () => false,
    ctx,
    ...extra,
  };
  return { d, pasos, llamadas };
}

test("llama a la herramienta, le devuelve el resultado y termina con el texto final", async () => {
  const { d, pasos, llamadas } = deps([
    msg([{ type: "tool_use", id: "t1", name: "eco", input: { texto: "hola" } }], "tool_use"),
    msg([{ type: "text", text: "Hecho." }], "end_turn"),
  ]);
  const r = await runAgent({ goal: "di hola", tools: [eco as Tool], maxSteps: 5 }, d);

  assert.equal(r.text, "Hecho.");
  assert.equal(r.steps, 2);
  assert.equal(r.usage.inputTokens, 200);
  // La segunda llamada lleva el tool_result con el id correcto.
  const ultimo = llamadas[1].messages.at(-1)!;
  assert.equal(ultimo.role, "user");
  const bloque = (ultimo.content as Anthropic.Beta.BetaToolResultBlockParam[])[0];
  assert.equal(bloque.tool_use_id, "t1");
  assert.deepEqual(bloque.content, [{ type: "text", text: "eco: hola" }]);
  // Traza: respuesta, herramienta, respuesta.
  assert.deepEqual(pasos.map((p) => p.kind), ["assistant", "tool_call", "assistant"]);
  assert.equal(pasos[1].toolName, "eco");
});

test("las peticiones llevan pensamiento adaptativo, esfuerzo, caché y fallbacks", async () => {
  const { d, llamadas } = deps([msg([{ type: "text", text: "ok" }], "end_turn")]);
  await runAgent({ goal: "x", tools: [eco as Tool], maxSteps: 1 }, d);
  const p = llamadas[0] as unknown as Record<string, unknown>;
  assert.equal(p.model, "claude-opus-5-5");
  assert.deepEqual(p.thinking, { type: "adaptive" });
  assert.deepEqual(p.output_config, { effort: "high" });
  assert.deepEqual(p.cache_control, { type: "ephemeral", ttl: "1h" });
  assert.equal(p.fallbacks, "default");
  assert.deepEqual(p.betas, ["server-side-fallback-2026-07-01"]);
});

test("sin Anthropic de verdad no manda betas ni fallbacks", async () => {
  const { d, llamadas } = deps([msg([{ type: "text", text: "ok" }], "end_turn")], { anthropicFeatures: false });
  await runAgent({ goal: "x", tools: [], maxSteps: 1 }, d);
  const p = llamadas[0] as unknown as Record<string, unknown>;
  assert.equal(p.fallbacks, undefined);
  assert.equal(p.betas, undefined);
});

test("unos argumentos inválidos vuelven al modelo como error, sin ejecutar la herramienta", async () => {
  const { d, llamadas, pasos } = deps([
    msg([{ type: "tool_use", id: "t1", name: "eco", input: { texto: 42 } }], "tool_use"),
    msg([{ type: "text", text: "corregido" }], "end_turn"),
  ]);
  await runAgent({ goal: "x", tools: [eco as Tool], maxSteps: 5 }, d);
  const bloque = (llamadas[1].messages.at(-1)!.content as Anthropic.Beta.BetaToolResultBlockParam[])[0];
  assert.equal(bloque.is_error, true);
  assert.match(JSON.stringify(bloque.content), /Argumentos inválidos/);
  assert.equal(pasos[1].isError, true);
});

test("una herramienta que lanza devuelve el error al modelo y el bucle sigue", async () => {
  const rota = defineTool({ name: "rota", description: "", input: z.object({}), run: async () => { throw new Error("se rompió"); } });
  const { d, llamadas } = deps([
    msg([{ type: "tool_use", id: "t1", name: "rota", input: {} }], "tool_use"),
    msg([{ type: "text", text: "vale" }], "end_turn"),
  ]);
  const r = await runAgent({ goal: "x", tools: [rota as Tool], maxSteps: 5 }, d);
  assert.equal(r.text, "vale");
  const bloque = (llamadas[1].messages.at(-1)!.content as Anthropic.Beta.BetaToolResultBlockParam[])[0];
  assert.equal(bloque.is_error, true);
});

test("al llegar al tope de pasos falla con el uso acumulado, sin reintento", async () => {
  const bucle = () => msg([{ type: "tool_use", id: "t", name: "eco", input: { texto: "a" } }], "tool_use");
  const { d } = deps([bucle(), bucle()]);
  await assert.rejects(runAgent({ goal: "x", tools: [eco as Tool], maxSteps: 2 }, d), (e: unknown) => {
    assert.ok(e instanceof AgentFailure);
    assert.equal(e.retryable, false);
    assert.equal(e.usage?.inputTokens, 200);
    assert.match(e.message, /máximo de 2 pasos/);
    return true;
  });
});

test("un rechazo del modelo es definitivo", async () => {
  const { d } = deps([msg([], "refusal")]);
  await assert.rejects(runAgent({ goal: "x", tools: [], maxSteps: 3 }, d), (e: unknown) =>
    e instanceof AgentFailure && !e.retryable && /declinado/.test(e.message));
});

test("un 529 del modelo merece reintento; un 400, no", async () => {
  const sobrecarga = new Anthropic.APIError(529, { type: "error" }, "overloaded", new Headers());
  const { d } = deps([], { callModel: async () => { throw sobrecarga; } });
  await assert.rejects(runAgent({ goal: "x", tools: [], maxSteps: 3 }, d), (e: unknown) =>
    e instanceof AgentFailure && e.retryable);

  const mal = new Anthropic.BadRequestError(400, { type: "error" }, "bad", new Headers());
  const { d: d2 } = deps([], { callModel: async () => { throw mal; } });
  await assert.rejects(runAgent({ goal: "x", tools: [], maxSteps: 3 }, d2), (e: unknown) =>
    e instanceof AgentFailure && !e.retryable);
});

test("una ejecución cancelada se detiene antes del siguiente paso", async () => {
  const { d } = deps([msg([{ type: "text", text: "no debería llegar" }], "end_turn")], { isCancelled: async () => true });
  await assert.rejects(runAgent({ goal: "x", tools: [], maxSteps: 3 }, d), /Cancelada/);
});

test("el uso suma todos los intentos cuando hubo fallback", () => {
  const u = usageOf(msg([], "end_turn", {
    input_tokens: 5, output_tokens: 1,
    iterations: [
      { type: "message", input_tokens: 100, output_tokens: 0 },
      { type: "fallback_message", input_tokens: 100, output_tokens: 20, cache_read_input_tokens: 50 },
    ],
  }));
  assert.deepEqual(u, { inputTokens: 200, outputTokens: 20, cacheReadTokens: 50, cacheWriteTokens: 0 });
});

test("tras un fallback sólo se reenvía el texto anterior al último bloque fallback", () => {
  const content = [
    { type: "thinking", thinking: "" },
    { type: "text", text: "parcial" },
    { type: "tool_use", id: "x", name: "eco", input: {} },
    { type: "fallback", from: { model: "a" }, to: { model: "b" } },
    { type: "text", text: "sigue" },
  ] as unknown as Msg["content"];
  assert.deepEqual(contentToEcho(content).map((b) => b.type), ["text", "text"]);
});

test("las siete herramientas de v0 tienen esquema de objeto y nombre único", () => {
  assert.deepEqual(TOOLS_V0.map((t) => t.name), [
    "browser_navigate", "browser_snapshot", "browser_click", "browser_type",
    "browser_screenshot", "browser_extract", "auditar_dominio",
  ]);
  for (const t of TOOLS_V0) {
    const api = toApiTool(t);
    assert.equal((api.input_schema as { type: string }).type, "object", t.name);
    assert.ok(api.description && api.description.length > 20, t.name);
  }
  assert.throws(() => toolsFor(["borrar_todo"]), /desconocidas/);
  assert.deepEqual(toolsFor(["auditar_dominio"]).map((t) => t.name), ["auditar_dominio"]);
});
