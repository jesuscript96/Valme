import {cache} from 'react'
import {sanityFetch} from './fetch'
import {SETTINGS_QUERY} from './queries'

/** Request-deduped settings fetch (used by layout for chrome + base metadata). */
export const getSettings = cache(() =>
  sanityFetch<Record<string, unknown> | null>({
    query: SETTINGS_QUERY,
    tags: ['siteSettings'],
  }),
)
