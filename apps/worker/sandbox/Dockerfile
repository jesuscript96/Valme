# Navegador sandbox para el worker.
#
# Sólo un Chromium detrás de un servidor de Playwright. No tiene credenciales, no tiene
# código de Valme y no necesita puertos públicos: el worker se conecta por la red interna
# con SANDBOX_URL=ws://<host>:3000/<SANDBOX_TOKEN>.
#
# Contexto de build: la raíz del repo (Dockerfile "apps/worker/sandbox/Dockerfile").
# La versión de playwright-core se saca del package-lock, para que coincida siempre con
# la del worker: cliente y servidor de Playwright tienen que ser la misma versión.
FROM node:22-bookworm-slim

ENV NODE_ENV=production \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
WORKDIR /sandbox

COPY package-lock.json /tmp/package-lock.json
RUN V=$(node -p "require('/tmp/package-lock.json').packages['node_modules/playwright-core'].version") \
 && echo "playwright-core $V" \
 && npm init -y >/dev/null \
 && npm install --omit=dev --no-audit --no-fund "playwright-core@$V" \
 && npx playwright-core install --with-deps chromium \
 && rm -rf /var/lib/apt/lists/* /tmp/package-lock.json \
 && npm cache clean --force

COPY apps/worker/sandbox/server.mjs ./

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('net').connect(process.env.PORT||3000,'127.0.0.1').on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))"

CMD ["node", "server.mjs"]
