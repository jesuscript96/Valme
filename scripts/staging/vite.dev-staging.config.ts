// Configuración usada solo por `npm run dev:staging`. Reutiliza vite.config.ts sin cambiarlo.
// En Windows, @lovable.dev/mcp-js compara config.root ("C:/...") con rutas resueltas
// ("C:\..."), rechaza su propio directorio de rutas y el servidor no arranca. Solo a ese
// plugin se le entrega la raíz con separadores de Windows; el resto de Vite no cambia.
import type { Plugin, ResolvedConfig, UserConfig, UserConfigFnObject } from "vite";
import base from "../../vite.config";

function flatten(plugins: unknown): Plugin[] {
  if (!Array.isArray(plugins))
    return plugins && typeof plugins === "object" ? [plugins as Plugin] : [];
  return plugins.flatMap(flatten);
}

function patchMcpRootOnWindows(config: UserConfig): UserConfig {
  if (process.platform !== "win32") return config;
  for (const plugin of flatten(config.plugins)) {
    if (plugin.name !== "@lovable.dev/mcp-js" || typeof plugin.configResolved !== "function")
      continue;
    const original = plugin.configResolved;
    plugin.configResolved = function (resolved: ResolvedConfig) {
      const windowsRoot = resolved.root.replace(/\//g, "\\");
      const view = new Proxy(resolved, {
        get: (target, key) => (key === "root" ? windowsRoot : Reflect.get(target, key)),
      });
      return (original as (this: unknown, config: ResolvedConfig) => unknown).call(this, view);
    } as Plugin["configResolved"];
  }
  return config;
}

const configFn: UserConfigFnObject = async (env) => {
  const resolved = typeof base === "function" ? await (base as UserConfigFnObject)(env) : base;
  return patchMcpRootOnWindows(resolved as UserConfig);
};

export default configFn;
