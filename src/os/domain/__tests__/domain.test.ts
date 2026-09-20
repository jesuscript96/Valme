import { strict as assert } from "node:assert";
import { test } from "node:test";
import { checkCopy, checkLength, META_LIMITS } from "../metaCopy";
import { HONEYPOT_FIELD, isRateLimited, parseSubmission } from "../leadIntake";
import { buildCopyCsv, assetFileName } from "../pack";
import { cropPlan, deriveFormats } from "../imageFormats";
import { LandingDoc } from "../landingBlocks";

// --- Longitudes de Meta ----------------------------------------------------

test("el contador marca el corte cuando se pasa del recomendado", () => {
  const long = "a".repeat(200);
  const c = checkLength("primaryText", long);
  assert.equal(c.over, true);
  assert.equal(c.truncatedAt, META_LIMITS.primaryText);
});

test("cuenta caracteres, no unidades de código: los acentos y emojis valen 1", () => {
  assert.equal(checkLength("headline", "ñññ").length, 3);
  assert.equal(checkLength("headline", "👋👋").length, 2);
});

test("pasarse no invalida: se avisa de los tres campos siempre", () => {
  const checks = checkCopy({ primaryText: "x", headline: "y", description: "z" });
  assert.equal(checks.length, 3);
  assert.equal(checks.every((c) => !c.over), true);
});

// --- Ingesta de leads ------------------------------------------------------

const valid = {
  landingId: "ld_1",
  name: "Marta Gil",
  email: "  MARTA.Gil@Example.COM ",
  phone: "+34 600 111 222",
  consent: true,
  answers: {},
};

test("normaliza el email antes de deduplicar y de hashear para la CAPI", () => {
  const r = parseSubmission(valid, { clientId: "c1", rateLimited: false });
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.lead.emailNormalized, "marta.gil@example.com");
  assert.equal(r.lead.phoneNormalized, "34600111222");
  assert.equal(r.lead.dedupeKey, "c1:marta.gil@example.com");
});

test("dos envíos del mismo email producen la misma clave de deduplicación", () => {
  const a = parseSubmission(valid, { clientId: "c1", rateLimited: false });
  const b = parseSubmission(
    { ...valid, email: "marta.gil@EXAMPLE.com" },
    { clientId: "c1", rateLimited: false },
  );
  assert.equal(a.ok && b.ok && a.lead.dedupeKey === b.lead.dedupeKey, true);
});

test("clientes distintos NO se deduplican entre sí", () => {
  const a = parseSubmission(valid, { clientId: "c1", rateLimited: false });
  const b = parseSubmission(valid, { clientId: "c2", rateLimited: false });
  assert.equal(a.ok && b.ok && a.lead.dedupeKey !== b.lead.dedupeKey, true);
});

test("el honeypot devuelve 200 para no avisar al bot", () => {
  const r = parseSubmission(
    { ...valid, [HONEYPOT_FIELD]: "http://spam.example" },
    { clientId: "c1", rateLimited: false },
  );
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.status, 200);
});

test("sin consentimiento no entra", () => {
  const r = parseSubmission({ ...valid, consent: false }, { clientId: "c1", rateLimited: false });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.status, 422);
  assert.ok(r.errors.consent);
});

test("sin email ni teléfono no entra", () => {
  const r = parseSubmission(
    { ...valid, email: "", phone: "" },
    { clientId: "c1", rateLimited: false },
  );
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.status, 422);
});

test("cada lead recibe un event_id único: es lo que deduplica píxel y CAPI", () => {
  const a = parseSubmission(valid, { clientId: "c1", rateLimited: false });
  const b = parseSubmission(valid, { clientId: "c1", rateLimited: false });
  assert.equal(a.ok && b.ok && a.lead.eventId !== b.lead.eventId, true);
});

test("el límite salta al sexto envío en un minuto", () => {
  const key = `test-${Math.random()}`;
  for (let i = 0; i < 5; i++) assert.equal(isRateLimited(key), false);
  assert.equal(isRateLimited(key), true);
});

// --- Formatos de imagen ----------------------------------------------------

test("se generan dos imágenes, no tres: 4:5 y 1:1 salen del máster 3:4", () => {
  const plan = deriveFormats();
  assert.deepEqual(plan.generate, ["3:4", "9:16"]);
  assert.deepEqual(plan.derive, ["4:5", "1:1"]);
});

test("el recorte a 4:5 pierde poco; el de 1:1 pierde un cuarto", () => {
  const to45 = cropPlan("3:4", "4:5");
  const to11 = cropPlan("3:4", "1:1");
  assert.equal(to45.width, 1080);
  assert.equal(to45.height, 1350);
  assert.ok(to45.lossPct < 7);
  assert.equal(to11.height, 1080);
  assert.ok(to11.lossPct > 24 && to11.lossPct < 26);
});

// --- Pack ------------------------------------------------------------------

const creative = {
  id: "ac_1", clientId: "c1", offerId: "of_1", angle: "pain" as const, variant: 1,
  primaryText: 'Con "comillas"\ny salto de línea', headline: "Título", description: "Desc",
  cta: "BOOK_NOW" as const, masterAssetId: null, status: "approved" as const,
  metaAdId: null, createdAt: "2026-01-01T00:00:00Z",
};

test("el CSV entrecomilla saltos de línea y duplica las comillas", () => {
  const csv = buildCopyCsv([creative], "https://x.valme.site/y");
  assert.ok(csv.includes('""comillas""'));
  assert.ok(csv.startsWith("﻿"), "lleva BOM para que Excel no rompa los acentos");
});

test("la URL del pack lleva el id interno en utm_content", () => {
  const csv = buildCopyCsv([creative], "https://x.valme.site/y");
  assert.ok(csv.includes("utm_content=ac_1"));
  assert.ok(csv.includes("{{campaign.name}}"), "la macro de Meta va sin escapar");
});

test("los nombres de fichero son legibles al subirlos a mano", () => {
  assert.equal(assetFileName(creative, "4:5"), "pain-v1-4x5.png");
});

// --- Bloques de landing ----------------------------------------------------

test("el esquema rechaza un bloque que no existe", () => {
  const r = LandingDoc.safeParse({
    blocks: [{ id: "x", visible: true, block: { type: "carousel", items: [] } }],
  });
  assert.equal(r.success, false);
});

test("beneficios exige entre 3 y 6 elementos", () => {
  const mk = (n: number) => ({
    blocks: [{
      id: "x", visible: true,
      block: { type: "benefits", title: "t", items: Array.from({ length: n }, () => ({ title: "a", body: "b" })) },
    }],
  });
  assert.equal(LandingDoc.safeParse(mk(2)).success, false);
  assert.equal(LandingDoc.safeParse(mk(3)).success, true);
  assert.equal(LandingDoc.safeParse(mk(7)).success, false);
});
