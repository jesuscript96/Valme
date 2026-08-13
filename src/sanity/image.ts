import {createImageUrlBuilder} from '@sanity/image-url'
import {client} from './client'

// The Sanity image object shape we get back from GROQ (asset ref).
type ImageSource = Parameters<ReturnType<typeof createImageUrlBuilder>['image']>[0]

const builder = createImageUrlBuilder(client)

export function urlFor(source: ImageSource) {
  return builder.image(source)
}

/** Convenience: a plain URL string, or undefined if no image. */
export function imageUrl(source?: ImageSource | null): string | undefined {
  if (!source) return undefined
  try {
    return builder.image(source).auto('format').url()
  } catch {
    return undefined
  }
}
