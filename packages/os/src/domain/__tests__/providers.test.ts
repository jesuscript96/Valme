import { strict as assert } from "node:assert";
import { test } from "node:test";
import { parseWebhook, isTerminal, costForTerminal } from "../../providers/higgsfield.pure";
import { isGeneratable } from "../imageFormats";
import { buildUrlTags } from "../utm";
import { normalizeEmail, normalizePhone } from "../normalize";

// --- Webhook de Higgsfield -------------------------------------------------

test("acepta el envelope documentado", () => {
  const w = parseWebhook({
    request_id: "9417a243", status: "completed", error: null,
    payload: { images: [{ url: "https://cdn/x.jpg", content_type: "image/jpeg" }] },
  });
  assert.equal(w?.request_id, "9417a243");
  assert.equal(w?.payload?.images?.length, 1);
});

test("rechaza un cuerpo con forma distinta: 4xx, no reintento de 2 horas", () => {
  assert.equal(parseWebhook({ foo: "bar" }), null);
  assert.equal(parseWebhook(null), null);
});

test("sólo tres estados son terminales", () => {
  for (const s of ["completed", "failed", "nsfw"]) assert.equal(isTerminal(s), true);
  for (const s of ["queued", "in_progress"]) assert.equal(isTerminal(s), false);
});

test("failed y nsfw no se cobran", () => {
  assert.equal(costForTerminal("completed", 0.094), 0.094);
  assert.equal(costForTerminal("failed", 0.094), 0);
  assert.equal(costForTerminal("nsfw", 0.094), 0);
});

// --- Ratios que la API admite de verdad ------------------------------------

test("4:5 NO lo admite ningún modelo: por eso se deriva por recorte", () => {
  assert.equal(isGeneratable("soul-2", "4:5"), false);
  assert.equal(isGeneratable("marketing-studio", "4:5"), false);
});

test("3:4 y 9:16 sí, que son los que se generan", () => {
  for (const f of ["3:4", "9:16"]) {
    assert.equal(isGeneratable("soul-2", f), true);
    assert.equal(isGeneratable("marketing-studio", f), true);
  }
});

// --- UTMs ------------------------------------------------------------------

test("la macro de campaña de Meta va sin escapar y el id sí se escapa", () => {
  const t = buildUrlTags("ac_1/raro");
  assert.ok(t.includes("utm_campaign={{campaign.name}}"));
  assert.ok(t.includes("utm_content=ac_1%2Fraro"));
});

// --- Normalización ---------------------------------------------------------

test("el email se normaliza igual venga como venga", () => {
  for (const v of ["  A@B.ES ", "a@b.es", "A@B.es"]) {
    assert.equal(normalizeEmail(v), "a@b.es");
  }
});

test("el teléfono queda sólo en dígitos, como pide Meta para el hash", () => {
  assert.equal(normalizePhone("+34 600 11-22 33"), "34600112233");
});
