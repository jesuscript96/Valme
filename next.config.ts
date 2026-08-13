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
};

export default nextConfig;
