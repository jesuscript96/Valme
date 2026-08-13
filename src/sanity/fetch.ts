import {client} from './client'
import type {QueryParams} from 'next-sanity'

/**
 * Fetch published content with ISR revalidation. Content edited + published in
 * the Studio appears on the live site within `revalidate` seconds, or instantly
 * when a Sanity webhook hits /api/revalidate (tag-based).
 */
export async function sanityFetch<T>({
  query,
  params = {},
  tags = [],
  revalidate = 60,
}: {
  query: string
  params?: QueryParams
  tags?: string[]
  revalidate?: number | false
}): Promise<T> {
  // Baseline: refresh at most every `revalidate` seconds. The Sanity webhook
  // (/api/revalidate) makes edits appear instantly via revalidatePath.
  return client.fetch<T>(query, params, {
    next: {revalidate, tags},
  })
}
