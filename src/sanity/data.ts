import {cache} from 'react'
import {sanityFetch} from './fetch'
import {SETTINGS_QUERY} from './queries'
import {useSanity} from './env'
import {settingsSeed} from '@/content/seed'

/** Request-deduped settings fetch (used by layout for chrome + base metadata). */
export const getSettings = cache(async () => {
  if (!useSanity) return settingsSeed as Record<string, unknown>
  return sanityFetch<Record<string, unknown> | null>({
    query: SETTINGS_QUERY,
    tags: ['siteSettings'],
  })
})
