import { chromium } from "playwright-core";

/**
 * Servidor de navegador del sandbox.
 *
 * Lanza un Chromium y lo expone por WebSocket en ws://0.0.0.0:<PORT>/<SANDBOX_TOKEN>.
 * Cada conexión del worker abre sus propios contextos, aislados entre sí; al
 * desconectarse se cierran.
 *
 * Si el navegador muere, el proceso sale con error para que el contenedor se reinicie
 * limpio en vez de quedarse vivo sin navegador.
 */

const token = process.env.SANDBOX_TOKEN ?? "";
if (token.length < 24 || !/^[A-Za-z0-9_-]+$/.test(token)) {
  console.error("SANDBOX_TOKEN falta o es demasiado corto (mínimo 24 caracteres, [A-Za-z0-9_-]).");
  process.exit(1);
}
const port = Number(process.env.PORT ?? 3000);

const server = await chromium.launchServer({
  host: "0.0.0.0",
  port,
  wsPath: `/${token}`,
  headless: true,
  // En la imagen se usa el Chromium que instala Playwright; CHROME_PATH permite usar otro
  // (por ejemplo para probar el sandbox en local con el Chrome del sistema).
  executablePath: process.env.CHROME_PATH || undefined,
  // /dev/shm de Docker es de 64 MB: sin esto Chromium se cae con páginas pesadas.
  args: ["--disable-dev-shm-usage"],
});

console.log(JSON.stringify({ t: new Date().toISOString(), msg: "sandbox listo", port }));

server.process().on("exit", (code) => {
  console.error(JSON.stringify({ t: new Date().toISOString(), msg: "el navegador ha terminado", code }));
  process.exit(1);
});

for (const s of ["SIGTERM", "SIGINT"]) {
  process.on(s, async () => {
    await server.close().catch(() => {});
    process.exit(0);
  });
}
