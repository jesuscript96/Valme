import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Las mismas reglas que apps/web: parte de este paquete (ui/, auth/) son componentes y
// acciones de Next. Lo único que sobra es la regla de `pages/`, que aquí no existe.
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  { rules: { "@next/next/no-html-link-for-pages": "off" } },
]);
