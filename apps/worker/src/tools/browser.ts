import type { Browser, BrowserContext, Locator, Page } from "playwright-core";
import { z } from "zod";
import { abrirNavegador } from "@valme/os/audit/collect/base/runtime";
import type { Guarda } from "../urlGuard";
import { defineTool, recortar } from "./types";

/**
 * NAVEGACIÓN (browser use).
 *
 * Una sesión por ejecución de agente: un contexto de navegador limpio (sin cookies de
 * otras ejecuciones) y una sola pestaña. El navegador es el del sandbox cuando hay
 * `SANDBOX_URL`; el worker sólo le manda órdenes.
 *
 * Cada petición que hace la página pasa por la guarda de destinos, incluidos los
 * WebSockets: una página no puede usar el navegador para llegar a la red interna.
 */

const VIEWPORT = { width: 1280, height: 800 };
const ALTO_MAX_CAPTURA = 6000;

export class BrowserSession {
  private constructor(
    private readonly browser: Browser,
    private readonly context: BrowserContext,
    readonly page: Page,
    readonly guarda: Guarda,
  ) {}

  static async open(guarda: Guarda): Promise<BrowserSession> {
    const browser = await abrirNavegador();
    const context = await browser.newContext({ viewport: VIEWPORT, locale: "es-ES" });

    await context.route("**/*", async (route) => {
      const url = route.request().url();
      if (!/^https?:/i.test(url)) return route.continue(); // data:, blob:…
      try {
        await guarda.comprobar(url);
        await route.continue();
      } catch {
        await route.abort("blockedbyclient");
      }
    });
    await context.routeWebSocket(/.*/, async (ws) => {
      try {
        await guarda.comprobar(ws.url().replace(/^ws/i, "http"));
        ws.connectToServer();
      } catch {
        await ws.close({ code: 1008, reason: "destino bloqueado" });
      }
    });

    const page = await context.newPage();
    page.setDefaultTimeout(15_000);
    return new BrowserSession(browser, context, page, guarda);
  }

  async close(): Promise<void> {
    await this.context.close().catch(() => {});
    await this.browser.close().catch(() => {});
  }
}

/** Cómo señalar un elemento. Uno de los tres modos, por orden de preferencia. */
const Objetivo = z
  .object({
    role: z
      .string()
      .optional()
      .describe("Rol ARIA tal como sale en browser_snapshot: button, link, textbox, combobox…"),
    name: z.string().optional().describe("Nombre accesible del elemento, junto con role."),
    text: z.string().optional().describe("Texto visible del elemento, si no tiene rol claro."),
    selector: z.string().optional().describe("Selector CSS. Último recurso."),
  })
  .describe("El elemento: role+name (preferido), text, o selector.");

function localizar(page: Page, o: z.infer<typeof Objetivo>): Locator {
  if (o.role) {
    return page
      .getByRole(o.role as Parameters<Page["getByRole"]>[0], o.name ? { name: o.name } : undefined)
      .first();
  }
  if (o.text) return page.getByText(o.text).first();
  if (o.selector) return page.locator(o.selector).first();
  throw new Error("Indica role (+name), text o selector.");
}

async function estado(page: Page): Promise<string> {
  return `URL: ${page.url()}\nTítulo: ${await page.title().catch(() => "")}`;
}

export const browserNavigate = defineTool({
  name: "browser_navigate",
  description:
    "Abre una URL en el navegador (http o https, sólo sitios públicos). Devuelve el código " +
    "HTTP, la URL final y el título. Después usa browser_snapshot para ver la página.",
  input: z.object({ url: z.string().describe("URL completa, con https://") }),
  async run({ url }, ctx) {
    const s = await ctx.browser();
    // La ruta del contexto también lo bloquearía, pero así el modelo recibe el motivo
    // en vez de un net::ERR_BLOCKED_BY_CLIENT.
    await s.guarda.comprobar(url);
    const res = await s.page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
    // Lo que inyecta la página después de cargar (tags, banners) tarda un poco más.
    await s.page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {});
    return `HTTP ${res?.status() ?? "sin respuesta"}\n${await estado(s.page)}`;
  },
});

export const browserSnapshot = defineTool({
  name: "browser_snapshot",
  description:
    "Devuelve el árbol de accesibilidad de la página actual (roles, nombres, textos). Es la " +
    "forma de saber qué hay y cómo señalar un elemento para browser_click o browser_type.",
  input: z.object({}),
  async run(_input, ctx) {
    const s = await ctx.browser();
    const arbol = await s.page.locator("body").ariaSnapshot({ timeout: 15_000 });
    return `${await estado(s.page)}\n\n${recortar(arbol)}`;
  },
});

export const browserClick = defineTool({
  name: "browser_click",
  description: "Hace clic en un elemento de la página actual.",
  input: z.object({ target: Objetivo }),
  async run({ target }, ctx) {
    const s = await ctx.browser();
    await localizar(s.page, target).click({ timeout: 10_000 });
    await s.page.waitForLoadState("domcontentloaded", { timeout: 10_000 }).catch(() => {});
    return `Clic hecho.\n${await estado(s.page)}`;
  },
});

export const browserType = defineTool({
  name: "browser_type",
  description:
    "Escribe texto en un campo (lo vacía antes). Con submit=true pulsa Enter al terminar.",
  input: z.object({
    target: Objetivo,
    text: z.string(),
    submit: z.boolean().optional(),
  }),
  async run({ target, text, submit }, ctx) {
    const s = await ctx.browser();
    const campo = localizar(s.page, target);
    await campo.fill(text, { timeout: 10_000 });
    if (submit) {
      await campo.press("Enter");
      await s.page.waitForLoadState("domcontentloaded", { timeout: 10_000 }).catch(() => {});
    }
    return `Texto escrito${submit ? " y enviado" : ""}.\n${await estado(s.page)}`;
  },
});

export const browserScreenshot = defineTool({
  name: "browser_screenshot",
  description:
    "Captura de la página actual, para juzgar lo visual (diseño, jerarquía, banners). " +
    "Para leer contenido es mejor browser_snapshot o browser_extract: cuestan menos.",
  input: z.object({ fullPage: z.boolean().optional().describe("Toda la página, no sólo lo visible.") }),
  async run({ fullPage }, ctx) {
    const s = await ctx.browser();
    let clip: { x: number; y: number; width: number; height: number } | undefined;
    if (fullPage) {
      const alto = await s.page.evaluate(() => document.documentElement.scrollHeight);
      if (alto > ALTO_MAX_CAPTURA) clip = { x: 0, y: 0, width: VIEWPORT.width, height: ALTO_MAX_CAPTURA };
    }
    const png = await s.page.screenshot({ type: "jpeg", quality: 60, fullPage: Boolean(fullPage), clip });
    return [
      { type: "text", text: await estado(s.page) },
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: png.toString("base64") } },
    ];
  },
});

export const browserExtract = defineTool({
  name: "browser_extract",
  description:
    "Devuelve el texto visible de la página actual (o de un selector CSS) y, si se pide, " +
    "sus enlaces. Para leer contenido largo.",
  input: z.object({
    selector: z.string().optional().describe("Selector CSS. Por defecto, main o body."),
    includeLinks: z.boolean().optional(),
  }),
  async run({ selector, includeLinks }, ctx) {
    const s = await ctx.browser();
    const raiz = selector
      ? s.page.locator(selector).first()
      : (await s.page.locator("main").count()) > 0
        ? s.page.locator("main").first()
        : s.page.locator("body");
    const texto = await raiz.innerText({ timeout: 10_000 });
    let enlaces = "";
    if (includeLinks) {
      const lista = await raiz.locator("a[href]").evaluateAll((as) =>
        as.slice(0, 150).map((a) => `${(a.textContent ?? "").trim().slice(0, 80)} → ${(a as HTMLAnchorElement).href}`),
      );
      enlaces = `\n\nEnlaces:\n${lista.join("\n")}`;
    }
    return `${await estado(s.page)}\n\n${recortar(texto)}${recortar(enlaces, 10_000)}`;
  },
});
