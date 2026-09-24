import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The site's intro (Preloader → Hero reveal) and GSAP timelines are one-shot
  // animations coordinated across components. React StrictMode's double-invoke
  // in dev tears down and replays effects, which leaves the one-shot intro
  // half-built. Disabling it makes dev match production (which never
  // double-invokes) and keeps the animations reliable.
  reactStrictMode: false,
  images: {
    remotePatterns: [{protocol: 'https', hostname: 'cdn.sanity.io'}],
  },

  // El auditor carga las webs con un navegador de verdad. Estos dos paquetes llevan
  // binarios y ficheros que el empaquetador no sabe seguir: si los mete en el bundle,
  // fallan al cargar en la función con un "cannot find module". Se dejan fuera para que
  // se resuelvan en tiempo de ejecución desde node_modules.
  serverExternalPackages: ['playwright-core', '@sparticuz/chromium'],

  // `playwright-core` lee `browsers.json` en tiempo de ejecución, y el trazador de
  // ficheros no sigue esa lectura porque no es un require: la función se desplegaba sin
  // él y fallaba con "cannot find module". Igual con el binario de Chromium.
  outputFileTracingIncludes: {
    // `browsers.json` pesa unos pocos KB, así que se incluye en todas las rutas: acotarlo
    // por glob de ruta no casaba con la función real que ejecuta la acción de servidor.
    '/**': ['./node_modules/playwright-core/browsers.json'],
    // El binario de Chromium son 66 MB, así que ese sí va solo donde se usa.
    '/app/dx/tools/**': ['./node_modules/@sparticuz/chromium/**'],
  },
};

export default nextConfig;
