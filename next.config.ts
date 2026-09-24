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
};

export default nextConfig;
