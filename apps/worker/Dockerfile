# Worker de agentes de Valme.
#
# Se construye con la RAÍZ del repo como contexto (Coolify: Base Directory "/",
# Dockerfile "apps/worker/Dockerfile"): necesita packages/os y el package-lock común.
#
# No lleva navegador: las páginas se cargan en el contenedor sandbox (SANDBOX_URL).
FROM node:22-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

# Primero sólo los manifiestos, para que la capa de dependencias se reutilice mientras
# no cambien. npm ci necesita los package.json de TODOS los workspaces del lockfile.
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY apps/worker/package.json apps/worker/
COPY packages/os/package.json packages/os/
RUN npm ci -w @valme/worker --omit=dev --no-audit --no-fund && npm cache clean --force

COPY packages/os packages/os
COPY apps/worker apps/worker

USER node
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"

# --conditions=react-server: el código compartido lleva `import "server-only"`, que sólo
# se deja importar con esta condición. tsx ejecuta el TypeScript sin paso de build.
CMD ["node", "--conditions=react-server", "--import", "tsx", "apps/worker/src/main.ts"]
