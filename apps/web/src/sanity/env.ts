export const apiVersion = '2026-02-01'

/** True when a Sanity project + dataset are configured in the environment. */
export const hasSanityConfig = Boolean(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID && process.env.NEXT_PUBLIC_SANITY_DATASET,
)

/**
 * Content source switch. The local seed (`src/content/seed.ts`) wins BY DEFAULT,
 * everywhere — local and production alike — so the site ships the copy we edit in
 * code without depending on Sanity yet.
 *
 * To read live content from Sanity instead, set `NEXT_PUBLIC_USE_SANITY=1` in the
 * environment (e.g. in Vercel) AND have the project/dataset configured. Until
 * then, whatever lives in Sanity is ignored.
 */
export const useSanity =
  process.env.NEXT_PUBLIC_USE_SANITY === '1' && hasSanityConfig

// Placeholder values keep `createClient` from throwing at import time in local
// (seed) mode. The client is never actually queried while `hasSanityConfig` is
// false, so these are never used to fetch anything.
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'placeholder'
