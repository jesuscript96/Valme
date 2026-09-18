import { createFileRoute } from "@tanstack/react-router";

// La app es la interfaz V2 importada desde GitHub (prototipo estático con
// datos ficticios). Se sirve como HTML completo; sus recursos viven en /v2/*.
const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#14161a" />
    <meta name="description" content="VALME Search OS — centro de mando de demostración para una agencia SEO, AEO y GEO supervisada." />
    <meta property="og:title" content="VALME Search OS · V2" />
    <meta property="og:description" content="Centro de mando de demostración para una agencia SEO, AEO y GEO supervisada por un Project Manager." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary" />
    <title>VALME Search OS · V2</title>
    <link rel="stylesheet" href="/v2/styles/main.css" />
  </head>
  <body>
    <a class="skip-link" href="#v-page">Saltar al contenido principal</a>
    <div id="valme-v2">
      <div class="v-shell">
        <aside class="v-side" aria-label="Navegación de VALME Search OS">
          <div>
            <div class="v-logo">
              <img alt="VALME" src="/v2/assets/valme-wordmark.svg" style="display:block;width:120px;height:auto;filter:invert(1)" />
              <span style="display:block;margin-top:10px;letter-spacing:.28em;font-family:'IBM Plex Mono',monospace;font-size:11px">SOLUTIONS</span>
            </div>
            <p>Search OS <span class="v-mono">/ V2</span></p>
          </div>
          <nav aria-label="Secciones principales"></nav>
          <div class="v-person">
            <span class="v-demo-label v-mono">DATOS FICTICIOS</span>
            <strong>Project Manager</strong>
            Los agentes ejecutan.<br />Tú diriges.
          </div>
        </aside>
        <div class="v-main">
          <header class="v-top">
            <span class="v-mobile-brand"><img alt="" src="/v2/assets/valme-monogram.svg" /><span class="v-mono">AGENCIA / OPERACIONES</span></span>
            <span class="v-cycle">18 SEP 2026 · 09:42 CEST</span>
            <span class="v-tag dark">● Demostración</span>
            <div class="v-mobile-nav">
              <label><span class="v-sr-only">Sección</span><select id="v-mobile-select" aria-label="Cambiar de sección"></select></label>
              <button data-go="Supervisión" aria-label="Abrir supervisión">Supervisión <span class="v-nav-count v-count">18</span></button>
            </div>
          </header>
          <div class="v-live" role="status" aria-live="polite" aria-atomic="true"></div>
          <main class="v-content" id="v-page"></main>
          <footer class="v-bottom"><span>84 clientes · 8 especialidades · 672 agentes asignados</span><span>Sin conexiones reales · entorno de demostración</span></footer>
        </div>
      </div>
    </div>
    <script src="/v2/scripts/app.js"></script>
  </body>
</html>
`;

export const Route = createFileRoute("/")({
  server: {
    handlers: {
      GET: () =>
        new Response(html, {
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
    },
  },
});
